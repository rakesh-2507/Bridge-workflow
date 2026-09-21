import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import {
  Check,
  GripVertical,
  Star,
} from "lucide-react";

import type {
  AssetPurchaseQuote,
} from "../../types/assetPurchaseQuote";

interface CompareQuotesProps {
  quotes: AssetPurchaseQuote[];
  selectedQuoteId?: number | null;
  onSelectQuote?: (quoteId: number) => void;
}

type RatingParameter =
  | "vendor"
  | "quoteNumber"
  | "quoteDate"
  | "quotedAmount"
  | "currency"
  | "details";

type ComparisonFieldId =
  | RatingParameter
  | "executiveRating";

type QuoteRatings = Record<
  number,
  Partial<Record<RatingParameter, number>>
>;

interface ComparisonField {
  id: ComparisonFieldId;
  label: string;
  ratingParameter?: RatingParameter;
  renderValue: (
    quote: AssetPurchaseQuote,
  ) => ReactNode;
}

type DragMode = "quote" | "field" | null;

interface DragState {
  mode: DragMode;
  id: number | ComparisonFieldId | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

/* ======================================================
   EMPTY DRAG STATE
====================================================== */

const EMPTY_DRAG_STATE: DragState = {
  mode: null,
  id: null,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  offsetX: 0,
  offsetY: 0,
  width: 0,
  height: 0,
};

/* ======================================================
   COMPONENT
====================================================== */

const CompareQuotes = ({
  quotes,
  selectedQuoteId = null,
  onSelectQuote,
}: CompareQuotesProps) => {
  /* ======================================================
     ORDER STATE
  ====================================================== */

  const [orderedQuoteIds, setOrderedQuoteIds] =
    useState<number[]>(() =>
      quotes.map(
        (quote) => quote.quote_id,
      ),
    );

  const [fieldOrder, setFieldOrder] =
    useState<ComparisonFieldId[]>([
      "vendor",
      "quoteNumber",
      "quoteDate",
      "quotedAmount",
      "currency",
      "executiveRating",
      "details",
    ]);

  /* ======================================================
     RATINGS
  ====================================================== */

  const [quoteRatings, setQuoteRatings] =
    useState<QuoteRatings>({});

  /* ======================================================
     DRAG STATE
  ====================================================== */

  const [dragState, setDragState] =
    useState<DragState>(
      EMPTY_DRAG_STATE,
    );

  const dragStateRef =
    useRef<DragState>(
      EMPTY_DRAG_STATE,
    );

  const [isDragging, setIsDragging] =
    useState(false);

  const [dragOverQuoteId, setDragOverQuoteId] =
    useState<number | null>(null);

  const [dragOverFieldId, setDragOverFieldId] =
    useState<ComparisonFieldId | null>(
      null,
    );

  /* ======================================================
     REFS
  ====================================================== */

  const quoteRefs =
    useRef<
      Record<
        number,
        HTMLTableCellElement | null
      >
    >({});

  const fieldRefs =
    useRef<
      Partial<
        Record<
          ComparisonFieldId,
          HTMLTableRowElement | null
        >
      >
    >({});

  const pointerMoveRef =
    useRef<
      ((event: PointerEvent) => void) | null
    >(null);

  const pointerUpRef =
    useRef<
      (() => void) | null
    >(null);

  /* ======================================================
     COMPARISON FIELDS
  ====================================================== */

  const comparisonFields =
    useMemo<ComparisonField[]>(
      () => [
        {
          id: "vendor",
          label: "Vendor",
          ratingParameter: "vendor",
          renderValue: (quote) => (
            <span className="font-medium text-gray-900 dark:text-white">
              {quote.vendor_name || "-"}
            </span>
          ),
        },

        {
          id: "quoteNumber",
          label: "Quote Number",
          ratingParameter: "quoteNumber",
          renderValue: (quote) => (
            <span className="text-gray-700 dark:text-gray-300">
              {quote.quote_no || "-"}
            </span>
          ),
        },

        {
          id: "quoteDate",
          label: "Quote Date",
          ratingParameter: "quoteDate",
          renderValue: (quote) => (
            <span className="text-gray-700 dark:text-gray-300">
              {formatQuoteDate(
                quote.quote_date,
              )}
            </span>
          ),
        },

        {
          id: "quotedAmount",
          label: "Quoted Amount",
          ratingParameter: "quotedAmount",
          renderValue: (quote) => (
            <span className="font-bold text-gray-900 dark:text-white">
              {formatAmount(
                quote.quoted_amount,
                quote.currency,
              )}
            </span>
          ),
        },

        {
          id: "currency",
          label: "Currency",
          ratingParameter: "currency",
          renderValue: (quote) => (
            <span className="text-gray-700 dark:text-gray-300">
              {quote.currency || "-"}
            </span>
          ),
        },

        {
          id: "executiveRating",
          label: "Executive Rating",
          renderValue: (quote) => {
            const rating =
              Number(
                quote.executive_rating,
              ) || 0;

            return (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({
                    length: 5,
                  }).map((_, index) => (
                    <Star
                      key={index}
                      size={15}
                      className={
                        index < rating
                          ? "fill-current text-yellow-500"
                          : "text-gray-300 dark:text-gray-600"
                      }
                    />
                  ))}
                </div>

                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {quote.executive_rating ??
                    0}
                  /5
                </span>
              </div>
            );
          },
        },

        {
          id: "details",
          label: "Details",
          ratingParameter: "details",
          renderValue: (quote) => {
            const details =
              quote.quote_data
                ?.additionalProp1?.details;

            return (
              <p className="max-w-[300px] whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                {details || "-"}
              </p>
            );
          },
        },
      ],
      [],
    );

  /* ======================================================
     ORDERED QUOTES
  ====================================================== */

  const orderedQuotes = useMemo(() => {
    if (
      !quotes ||
      quotes.length === 0
    ) {
      return [];
    }

    const quoteMap =
      new Map<
        number,
        AssetPurchaseQuote
      >(
        quotes.map((quote) => [
          quote.quote_id,
          quote,
        ]),
      );

    const incomingIds =
      quotes.map(
        (quote) =>
          quote.quote_id,
      );

    const existingIds =
      orderedQuoteIds.filter((id) =>
        quoteMap.has(id),
      );

    const existingSet =
      new Set(existingIds);

    const newIds =
      incomingIds.filter(
        (id) =>
          !existingSet.has(id),
      );

    const finalIds = [
      ...existingIds,
      ...newIds,
    ];

    return finalIds
      .map((id) =>
        quoteMap.get(id),
      )
      .filter(
        (
          quote,
        ): quote is AssetPurchaseQuote =>
          Boolean(quote),
      );
  }, [
    quotes,
    orderedQuoteIds,
  ]);

  /* ======================================================
     ORDERED FIELDS
  ====================================================== */

  const orderedFields = useMemo(() => {
    const fieldMap =
      new Map<
        ComparisonFieldId,
        ComparisonField
      >(
        comparisonFields.map(
          (field) => [
            field.id,
            field,
          ],
        ),
      );

    return fieldOrder
      .map((fieldId) =>
        fieldMap.get(fieldId),
      )
      .filter(
        (
          field,
        ): field is ComparisonField =>
          Boolean(field),
      );
  }, [
    comparisonFields,
    fieldOrder,
  ]);

  /* ======================================================
     RATING
  ====================================================== */

  const getRating = (
    quoteId: number,
    parameter: RatingParameter,
  ) => {
    return (
      quoteRatings[quoteId]?.[
      parameter
      ] ?? 0
    );
  };

  const handleRatingChange = (
    quoteId: number,
    parameter: RatingParameter,
    rating: number,
  ) => {
    setQuoteRatings((previous) => ({
      ...previous,

      [quoteId]: {
        ...previous[quoteId],
        [parameter]: rating,
      },
    }));
  };

  /* ======================================================
     FIND QUOTE UNDER POINTER
  ====================================================== */

  const getQuoteAtPointer = (
    clientX: number,
  ): number | null => {
    for (
      let index = 0;
      index < orderedQuotes.length;
      index += 1
    ) {
      const quote =
        orderedQuotes[index];

      const element =
        quoteRefs.current[
        quote.quote_id
        ];

      if (!element) {
        continue;
      }

      const rect =
        element.getBoundingClientRect();

      const middle =
        rect.left +
        rect.width / 2;

      if (
        clientX >= rect.left &&
        clientX <= rect.right
      ) {
        return quote.quote_id;
      }

      if (
        index <
        orderedQuotes.length - 1 &&
        clientX < middle
      ) {
        return quote.quote_id;
      }
    }

    return null;
  };

  /* ======================================================
     FIND FIELD UNDER POINTER
  ====================================================== */

  const getFieldAtPointer = (
    clientY: number,
  ): ComparisonFieldId | null => {
    for (
      let index = 0;
      index < orderedFields.length;
      index += 1
    ) {
      const field =
        orderedFields[index];

      const element =
        fieldRefs.current[
        field.id
        ];

      if (!element) {
        continue;
      }

      const rect =
        element.getBoundingClientRect();

      const middle =
        rect.top +
        rect.height / 2;

      if (
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return field.id;
      }

      if (
        index <
        orderedFields.length - 1 &&
        clientY < middle
      ) {
        return field.id;
      }
    }

    return null;
  };

  /* ======================================================
     MOVE QUOTE
  ====================================================== */

  const moveQuote = (
    sourceId: number,
    targetId: number,
  ) => {
    if (
      sourceId === targetId
    ) {
      return;
    }

    setOrderedQuoteIds(
      (previous) => {
        const currentIds =
          previous.filter((id) =>
            quotes.some(
              (quote) =>
                quote.quote_id === id,
            ),
          );

        const missingIds =
          quotes
            .map(
              (quote) =>
                quote.quote_id,
            )
            .filter(
              (id) =>
                !currentIds.includes(id),
            );

        const ids = [
          ...currentIds,
          ...missingIds,
        ];

        const sourceIndex =
          ids.indexOf(sourceId);

        const targetIndex =
          ids.indexOf(targetId);

        if (
          sourceIndex === -1 ||
          targetIndex === -1
        ) {
          return previous;
        }

        const next = [...ids];

        const [movedId] =
          next.splice(
            sourceIndex,
            1,
          );

        next.splice(
          targetIndex,
          0,
          movedId,
        );

        return next;
      },
    );
  };

  /* ======================================================
     MOVE FIELD
  ====================================================== */

  const moveField = (
    sourceId: ComparisonFieldId,
    targetId: ComparisonFieldId,
  ) => {
    if (
      sourceId === targetId
    ) {
      return;
    }

    setFieldOrder(
      (previous) => {
        const sourceIndex =
          previous.indexOf(
            sourceId,
          );

        const targetIndex =
          previous.indexOf(
            targetId,
          );

        if (
          sourceIndex === -1 ||
          targetIndex === -1
        ) {
          return previous;
        }

        const next = [...previous];

        const [movedField] =
          next.splice(
            sourceIndex,
            1,
          );

        next.splice(
          targetIndex,
          0,
          movedField,
        );

        return next;
      },
    );
  };

  /* ======================================================
     STOP DRAGGING
  ====================================================== */

  const stopDragging = () => {
    if (
      pointerMoveRef.current
    ) {
      window.removeEventListener(
        "pointermove",
        pointerMoveRef.current,
      );
    }

    if (
      pointerUpRef.current
    ) {
      window.removeEventListener(
        "pointerup",
        pointerUpRef.current,
      );
    }

    pointerMoveRef.current = null;
    pointerUpRef.current = null;

    dragStateRef.current =
      EMPTY_DRAG_STATE;

    setIsDragging(false);

    setDragState(
      EMPTY_DRAG_STATE,
    );

    setDragOverQuoteId(null);
    setDragOverFieldId(null);
  };

  /* ======================================================
     START QUOTE DRAG
  ====================================================== */

  const handleQuotePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    quoteId: number,
  ) => {
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    const element =
      quoteRefs.current[quoteId];

    if (!element) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    event.preventDefault();

    const initialState: DragState = {
      mode: "quote",
      id: quoteId,

      startX: event.clientX,
      startY: event.clientY,

      currentX: event.clientX,
      currentY: event.clientY,

      offsetX:
        event.clientX -
        rect.left,

      offsetY:
        event.clientY -
        rect.top,

      /*
       * IMPORTANT:
       * Use the actual dragged element
       * dimensions for the floating preview.
       */
      width: rect.width,
      height: rect.height,
    };

    dragStateRef.current =
      initialState;

    setDragState(
      initialState,
    );

    setIsDragging(true);

    const handleMove = (
      moveEvent: PointerEvent,
    ) => {
      const nextState = {
        ...dragStateRef.current,

        currentX:
          moveEvent.clientX,

        currentY:
          moveEvent.clientY,
      };

      dragStateRef.current =
        nextState;

      setDragState(
        nextState,
      );

      const target =
        getQuoteAtPointer(
          moveEvent.clientX,
        );

      if (
        target !== null &&
        target !== quoteId
      ) {
        setDragOverQuoteId(
          target,
        );
      } else {
        setDragOverQuoteId(null);
      }
    };

    const handleUp = () => {
      const current =
        dragStateRef.current;

      const target =
        getQuoteAtPointer(
          current.currentX,
        );

      if (
        target !== null &&
        target !== quoteId
      ) {
        moveQuote(
          quoteId,
          target,
        );
      }

      stopDragging();
    };

    pointerMoveRef.current =
      handleMove;

    pointerUpRef.current =
      handleUp;

    window.addEventListener(
      "pointermove",
      handleMove,
    );

    window.addEventListener(
      "pointerup",
      handleUp,
      {
        once: true,
      },
    );
  };

  /* ======================================================
     START FIELD DRAG
  ====================================================== */

  const handleFieldPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    fieldId: ComparisonFieldId,
  ) => {
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    const element =
      fieldRefs.current[fieldId];

    if (!element) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    event.preventDefault();

    const initialState: DragState = {
      mode: "field",
      id: fieldId,

      startX: event.clientX,
      startY: event.clientY,

      currentX: event.clientX,
      currentY: event.clientY,

      offsetX:
        event.clientX -
        rect.left,

      offsetY:
        event.clientY -
        rect.top,

      /*
       * Use the actual row dimensions.
       */
      width: rect.width,
      height: rect.height,
    };

    dragStateRef.current =
      initialState;

    setDragState(
      initialState,
    );

    setIsDragging(true);

    const handleMove = (
      moveEvent: PointerEvent,
    ) => {
      const nextState = {
        ...dragStateRef.current,

        currentX:
          moveEvent.clientX,

        currentY:
          moveEvent.clientY,
      };

      dragStateRef.current =
        nextState;

      setDragState(
        nextState,
      );

      const target =
        getFieldAtPointer(
          moveEvent.clientY,
        );

      if (
        target !== null &&
        target !== fieldId
      ) {
        setDragOverFieldId(
          target,
        );
      } else {
        setDragOverFieldId(null);
      }
    };

    const handleUp = () => {
      const current =
        dragStateRef.current;

      const target =
        getFieldAtPointer(
          current.currentY,
        );

      if (
        target !== null &&
        target !== fieldId
      ) {
        moveField(
          fieldId,
          target,
        );
      }

      stopDragging();
    };

    pointerMoveRef.current =
      handleMove;

    pointerUpRef.current =
      handleUp;

    window.addEventListener(
      "pointermove",
      handleMove,
    );

    window.addEventListener(
      "pointerup",
      handleUp,
      {
        once: true,
      },
    );
  };

  /* ======================================================
     DRAGGING QUOTE
  ====================================================== */

  const draggingQuote =
    dragState.mode === "quote" &&
      typeof dragState.id === "number"
      ? orderedQuotes.find(
        (quote) =>
          quote.quote_id ===
          dragState.id,
      )
      : null;

  /* ======================================================
     DRAGGING FIELD
  ====================================================== */

  const draggingField =
    dragState.mode === "field" &&
      typeof dragState.id === "string"
      ? comparisonFields.find(
        (field) =>
          field.id ===
          dragState.id,
      )
      : null;

  /* ======================================================
     EMPTY STATE
  ====================================================== */

  if (
    !quotes ||
    quotes.length === 0
  ) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No quotes available for comparison.
        </p>
      </div>
    );
  }

  /* ======================================================
     UI
  ====================================================== */

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

        {/* ==================================================
            TITLE
        ================================================== */}

        <div className="border-b border-gray-200 bg-gradient-to-r from-cyan-50 via-white to-purple-50 px-5 py-4 dark:border-gray-700 dark:from-cyan-950/20 dark:via-gray-900 dark:to-purple-950/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Quote Comparison
              </h3>
            </div>

            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {orderedQuotes.length}{" "}
              {orderedQuotes.length === 1
                ? "Quote"
                : "Quotes"}
            </span>
          </div>
        </div>

        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/70">

                {/* FIELD HEADER */}

                <th className="sticky left-0 z-40 min-w-[220px] border-r border-gray-200 bg-gray-50 px-5 py-4 text-left dark:border-gray-700 dark:bg-gray-800/70">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <GripVertical size={16} />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        Quotes
                      </p>
                    </div>
                  </div>
                </th>

                {/* QUOTE HEADERS */}

                {orderedQuotes.map(
                  (
                    quote,
                    index,
                  ) => {
                    const isSelected =
                      selectedQuoteId ===
                      quote.quote_id;

                    const isDraggingThis =
                      dragState.mode ===
                      "quote" &&
                      dragState.id ===
                      quote.quote_id;

                    const isDropTarget =
                      dragOverQuoteId ===
                      quote.quote_id;

                    return (
                      <th
                        key={
                          quote.quote_id
                        }
                        ref={(element) => {
                          quoteRefs.current[
                            quote.quote_id
                          ] = element;
                        }}
                        className={`
                          relative min-w-[300px]
                          border-r border-gray-200
                          px-4 py-4 text-left align-top
                          dark:border-gray-700
                          transition-all duration-200
                          ${isSelected
                            ? "bg-green-50 dark:bg-green-950/20"
                            : "bg-white dark:bg-gray-900"
                          }
                          ${isDraggingThis
                            ? "opacity-25 blur-[2px] scale-[0.99]"
                            : ""
                          }
                        `}
                      >
                        {/* DROP SLOT */}

                        {isDropTarget &&
                          !isDraggingThis && (
                            <div className="pointer-events-none absolute inset-y-2 left-0 z-30 w-1">
                              <div className="h-full w-full rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.9)]" />

                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-cyan-300/50 bg-cyan-500/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md">
                                Drop here
                              </div>
                            </div>
                          )}

                        {/* QUOTE DRAG HANDLE */}

                        <div
                          onPointerDown={(
                            event,
                          ) =>
                            handleQuotePointerDown(
                              event,
                              quote.quote_id,
                            )
                          }
                          className="cursor-grab touch-none select-none active:cursor-grabbing"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400 transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-400">
                                <GripVertical size={18} />
                              </div>

                              <div className="min-w-0">
                                <div className="mb-1.5 flex items-center gap-2">
                                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-gray-100 px-1.5 text-[10px] font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                    {index + 1}
                                  </span>

                                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                    {quote.vendor_name ||
                                      "Unknown Vendor"}
                                  </p>
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {quote.quote_no ||
                                    "No Quote Number"}
                                </p>
                              </div>
                            </div>

                            {isSelected && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700 shadow-sm dark:bg-green-900/30 dark:text-green-400">
                                <Check size={12} />
                                Selected
                              </span>
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  },
                )}
              </tr>
            </thead>

            <tbody>
              {/* ==================================================
                  FIELD ROWS
              ================================================== */}

              {orderedFields.map(
                (field) => {
                  const isDraggingThis =
                    dragState.mode ===
                    "field" &&
                    dragState.id ===
                    field.id;

                  const isDropTarget =
                    dragOverFieldId ===
                    field.id;

                  return (
                    <tr
                      key={field.id}
                      ref={(element) => {
                        fieldRefs.current[
                          field.id
                        ] = element;
                      }}
                      className={`
                        relative
                        border-b border-gray-100
                        dark:border-gray-800
                        transition-all duration-200
                        ${isDraggingThis
                          ? "opacity-25 blur-[2px] scale-[0.995]"
                          : ""
                        }
                      `}
                    >
                      {/* FIELD NAME */}

                      <td
                        className={`
                          sticky left-0 z-20
                          min-w-[220px]
                          border-r border-gray-200
                          px-5 py-3
                          dark:border-gray-700
                          ${isDropTarget &&
                            !isDraggingThis
                            ? "bg-purple-50 dark:bg-purple-950/20"
                            : "bg-white dark:bg-gray-900"
                          }
                        `}
                      >
                        {isDropTarget &&
                          !isDraggingThis && (
                            <div className="pointer-events-none absolute inset-x-2 top-0 z-30 h-1">
                              <div className="h-full rounded-full bg-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.9)]" />

                              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-purple-300/50 bg-purple-600/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md">
                                Drop row here
                              </div>
                            </div>
                          )}

                        <div
                          onPointerDown={(
                            event,
                          ) =>
                            handleFieldPointerDown(
                              event,
                              field.id,
                            )
                          }
                          className="flex cursor-grab touch-none select-none items-center gap-2 active:cursor-grabbing"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400 transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 dark:hover:border-purple-700 dark:hover:bg-purple-950/30 dark:hover:text-purple-400">
                            <GripVertical size={17} />
                          </div>

                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.label}
                          </span>
                        </div>
                      </td>

                      {/* QUOTE CELLS */}

                      {orderedQuotes.map(
                        (quote) => {
                          const isSelected =
                            selectedQuoteId ===
                            quote.quote_id;

                          const isQuoteDragging =
                            dragState.mode ===
                            "quote" &&
                            dragState.id ===
                            quote.quote_id;

                          const currentRating =
                            field.ratingParameter
                              ? getRating(
                                quote.quote_id,
                                field.ratingParameter,
                              )
                              : 0;

                          return (
                            <td
                              key={
                                quote.quote_id
                              }
                              className={`
                                relative
                                border-r border-gray-200
                                px-4 py-3
                                align-middle
                                dark:border-gray-700
                                ${isQuoteDragging
                                  ? "opacity-25 blur-[2px]"
                                  : isSelected
                                    ? "bg-green-50 dark:bg-green-950/20"
                                    : "bg-white dark:bg-gray-900"
                                }
                              `}
                            >
                              <div className="relative flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  {field.renderValue(
                                    quote,
                                  )}
                                </div>

                                {field.ratingParameter && (
                                  <div className="flex shrink-0 items-center gap-1">
                                    <div className="flex items-center">
                                      {Array.from(
                                        {
                                          length: 5,
                                        },
                                      ).map(
                                        (
                                          _,
                                          index,
                                        ) => {
                                          const rating =
                                            index +
                                            1;

                                          const active =
                                            rating <=
                                            currentRating;

                                          return (
                                            <button
                                              key={
                                                rating
                                              }
                                              type="button"
                                              title={`Rate ${rating}/5`}
                                              onClick={() =>
                                                handleRatingChange(
                                                  quote.quote_id,
                                                  field.ratingParameter!,
                                                  rating,
                                                )
                                              }
                                              className="rounded p-0.5 transition hover:scale-110 focus:outline-none"
                                            >
                                              <Star
                                                size={15}
                                                className={
                                                  active
                                                    ? "fill-current text-yellow-500"
                                                    : "text-gray-300 dark:text-gray-600"
                                                }
                                              />
                                            </button>
                                          );
                                        },
                                      )}
                                    </div>

                                    <span className="min-w-[25px] text-right text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                      {
                                        currentRating
                                      }
                                      /5
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        },
                      )}
                    </tr>
                  );
                },
              )}

              {/* ==================================================
                  ACTION ROW
              ================================================== */}

              {onSelectQuote && (
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="sticky left-0 z-20 min-w-[220px] border-r border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                        <Check
                          size={15}
                          className="text-green-500"
                        />
                      </div>

                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Action
                      </span>
                    </div>
                  </td>

                  {orderedQuotes.map(
                    (quote) => {
                      const isSelected =
                        selectedQuoteId ===
                        quote.quote_id;

                      return (
                        <td
                          key={
                            quote.quote_id
                          }
                          className={`
                            border-r border-gray-200
                            px-4 py-4
                            dark:border-gray-700
                            ${isSelected
                              ? "bg-green-50 dark:bg-green-950/20"
                              : "bg-white dark:bg-gray-900"
                            }
                          `}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              onSelectQuote(
                                quote.quote_id,
                              )
                            }
                            className={`
                              inline-flex
                              items-center
                              justify-center
                              gap-2
                              rounded-lg
                              px-4 py-2
                              text-sm
                              font-semibold
                              transition-all
                              ${isSelected
                                ? "bg-green-600 text-white shadow-sm hover:bg-green-700"
                                : "border border-gray-300 bg-white text-gray-700 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/30"
                              }
                            `}
                          >
                            {isSelected && (
                              <Check size={15} />
                            )}

                            {isSelected
                              ? "Selected"
                              : "Select Quote"}
                          </button>
                        </td>
                      );
                    },
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          FLOATING GLASS QUOTE
      ====================================================== */}

      {isDragging &&
        draggingQuote && (
          <div
            className="pointer-events-none fixed z-[9999]"
            style={{
              left:
                dragState.currentX -
                dragState.offsetX,

              top:
                dragState.currentY -
                dragState.offsetY,

              width: dragState.width,
              height: dragState.height,

              transform:
                "rotate(0deg) scale(1.01)",

              transformOrigin:
                "top left",
            }}
          >
            <div
              className="
                relative
                h-full
                w-full
                overflow-hidden
                rounded-2xl
                border
                border-white/50
                bg-white/[0.01]
                shadow-[0_30px_90px_rgba(0,0,0,0.30)]
                backdrop-blur-2xl
                backdrop-saturate-150
                dark:border-white/[0.12]
                dark:bg-white/[0.07]
              "
            >

              {/* Reflection */}

              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/80 dark:bg-white/20" />

              <div className="pointer-events-none absolute inset-x-5 top-1 h-px bg-white/40 blur-sm dark:bg-white/10" />

              {/* Content */}

              <div className="relative flex h-[calc(100%-4px)] items-center px-5 py-4">
                {/* Grip */}

                <div
                  className="
                    flex h-10 w-9 shrink-0
                    items-center justify-center
                    rounded-xl
                    border border-white/40
                    bg-white/25
                    text-cyan-600
                    shadow-lg
                    backdrop-blur-xl
                    dark:border-white/10
                    dark:bg-white/10
                    dark:text-cyan-300
                  "
                >
                  <GripVertical size={19} />
                </div>

                {/* Quote information */}

                <div className="ml-4 min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                   
                    {selectedQuoteId ===
                      draggingQuote.quote_id && (
                        <span
                          className="
                          rounded-full
                          border
                          border-green-300/40
                          bg-green-400/15
                          px-2 py-0.5
                          text-[9px]
                          font-bold
                          text-green-700
                          backdrop-blur-md
                          dark:border-green-400/20
                          dark:bg-green-400/10
                          dark:text-green-300
                        "
                        >
                          Selected
                        </span>
                      )}
                  </div>

                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                    {draggingQuote.vendor_name ||
                      "Unknown Vendor"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-gray-600 dark:text-gray-400">
                    {draggingQuote.quote_no ||
                      "No Quote Number"}
                  </p>
                </div>

                {/* Quote preview information */}

                <div className="grid w-[430px] shrink-0 grid-cols-4 gap-2">
                  <FloatingGlassInfo
                    label="Amount"
                    value={formatAmount(
                      draggingQuote.quoted_amount,
                      draggingQuote.currency,
                    )}
                  />

                  <FloatingGlassInfo
                    label="Date"
                    value={formatQuoteDate(
                      draggingQuote.quote_date,
                    )}
                  />

                  <FloatingGlassInfo
                    label="Currency"
                    value={
                      draggingQuote.currency ||
                      "-"
                    }
                  />

                  <FloatingGlassInfo
                    label="Executive"
                    value={`${draggingQuote.executive_rating ?? 0}/5`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ======================================================
          FLOATING GLASS FIELD
      ====================================================== */}

      {isDragging &&
        draggingField && (
          <div
            className="pointer-events-none fixed z-[9999]"
            style={{
              left:
                dragState.currentX -
                dragState.offsetX,

              top:
                dragState.currentY -
                dragState.offsetY,

              width: dragState.width,
              height: dragState.height,

              transform:
                "rotate(0deg) scale(1)",

              transformOrigin:
                "top left",
            }}
          >
            <div
              className="
                relative
                h-full
                w-full
                overflow-hidden
                rounded-2xl
                border
                border-white/50
                bg-white/[0.14]
                shadow-[0_30px_90px_rgba(0,0,0,0.30)]
                backdrop-blur-2xl
                backdrop-saturate-150
                dark:border-white/[0.12]
                dark:bg-white/[0.07]
              "
            >
              {/* Reflection */}

              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/80 dark:bg-white/20" />

              <div className="pointer-events-none absolute inset-x-5 top-1 h-px bg-white/40 blur-sm dark:bg-white/10" />
              {/* Full-width row content */}

              <div className="relative flex h-[calc(100%-4px)] w-full items-center gap-5 px-5 py-3">
                {/* Grip */}

                <div
                  className="
                    flex h-10 w-9 shrink-0
                    items-center justify-center
                    rounded-xl
                    border border-white/40
                    bg-white/25
                    text-purple-600
                    shadow-lg
                    backdrop-blur-xl
                    dark:border-white/10
                    dark:bg-white/10
                    dark:text-purple-300
                  "
                >
                  <GripVertical size={19} />
                </div>

                {/* Field */}

                <div className="w-[180px] shrink-0">
                  <span
                    className="
                      rounded-full
                      border
                      border-purple-300/40
                      bg-purple-400/15
                      px-2 py-1
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-purple-700
                      backdrop-blur-md
                      dark:border-purple-400/20
                      dark:bg-purple-400/10
                      dark:text-purple-300
                    "
                  >
                    Moving Field
                  </span>

                  <p className="mt-1.5 truncate text-sm font-bold text-gray-900 dark:text-white">
                    {draggingField.label}
                  </p>
                </div>

                {/* Divider */}

                <div className="h-9 w-px shrink-0 bg-white/40 dark:bg-white/10" />

                {/* Quote previews */}

                <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                  {orderedQuotes.map(
                    (quote) => (
                      <div
                        key={
                          quote.quote_id
                        }
                        className="
                          min-w-[170px]
                          flex-1
                          rounded-xl
                          border
                          border-white/30
                          bg-white/[0.13]
                          px-3 py-2.5
                          shadow-sm
                          backdrop-blur-xl
                          backdrop-saturate-150
                          dark:border-white/[0.08]
                          dark:bg-white/[0.05]
                        "
                      >
                        <p className="truncate text-[10px] font-semibold text-gray-500/80 dark:text-gray-500">
                          {quote.vendor_name ||
                            "Vendor"}
                        </p>

                        <div className="mt-1 truncate">
                          {draggingField.renderValue(
                            quote,
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

/* ======================================================
   FLOATING GLASS INFO
====================================================== */

interface FloatingGlassInfoProps {
  label: string;
  value: string;
}

const FloatingGlassInfo = ({
  label,
  value,
}: FloatingGlassInfoProps) => {
  return (
    <div
      className="
        min-w-0
        rounded-xl
        border
        border-white/30
        bg-white/[0.12]
        px-3 py-2
        shadow-sm
        backdrop-blur-xl
        backdrop-saturate-150
        dark:border-white/[0.08]
        dark:bg-white/[0.05]
      "
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500/80 dark:text-gray-400/80">
        {label}
      </p>

      <p className="mt-0.5 truncate text-xs font-semibold text-gray-800 dark:text-gray-200">
        {value}
      </p>
    </div>
  );
};

/* ======================================================
   DATE FORMATTER
====================================================== */

const formatQuoteDate = (
  date?: string | null,
): string => {
  if (!date) {
    return "-";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

/* ======================================================
   AMOUNT FORMATTER
====================================================== */

const formatAmount = (
  amount?: number | null,
  currency?: string | null,
): string => {
  if (
    amount === null ||
    amount === undefined
  ) {
    return "-";
  }

  const numericAmount =
    Number(amount);

  if (
    Number.isNaN(
      numericAmount,
    )
  ) {
    return String(amount);
  }

  return `${currency || ""} ${numericAmount.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`.trim();
};

export default CompareQuotes;
