import { useEffect, useState } from "react";

import {
    Check,
    ChevronDown,
    Eye,
    FileText,
    Loader2,
} from "lucide-react";

import {
    getAssetPurchaseQuotes,
    updateAssetQuoteRating,
    submitAssetPurchaseRatings,
    forwardAssetPurchaseTaskToSelection,
    selectAssetPurchaseQuote,
} from "../../api/assetPurchaseQuote";

import type {
    AssetPurchaseQuote,
} from "../../types/assetPurchaseQuote";

interface QuoteDetailsAccordionProps {
    documentNo: string;
    taskId: number;
    canEditRating?: boolean;
}

function QuoteDetailsAccordion({
    documentNo,
    taskId,
    canEditRating = false,
}: QuoteDetailsAccordionProps) {
    const [isOpen, setIsOpen] = useState(true);

    const [quotes, setQuotes] =
        useState<AssetPurchaseQuote[]>([]);

    const [quotesLoading, setQuotesLoading] =
        useState(false);

    const [quotesError, setQuotesError] =
        useState("");

    // ==================================================
    // RATING STATE
    // ==================================================

    const [updatingRatingId, setUpdatingRatingId] =
        useState<number | null>(null);

    const [ratingError, setRatingError] =
        useState("");

    // ==================================================
    // SELECTION STATE
    // ==================================================

    const [selectingQuoteId, setSelectingQuoteId] =
        useState<number | null>(null);

    const [selectedQuoteId, setSelectedQuoteId] =
        useState<number | null>(null);

    const [selectionError, setSelectionError] =
        useState("");

    // ==================================================
    // LOAD QUOTES
    // ==================================================

    useEffect(() => {
        if (!documentNo) {
            return;
        }

        let cancelled = false;

        const loadQuotes = async () => {
            setQuotesLoading(true);
            setQuotesError("");

            try {
                const response =
                    await getAssetPurchaseQuotes(
                        documentNo
                    );

                if (cancelled) {
                    return;
                }

                setQuotes(
                    response.data ?? []
                );
            } catch (err) {
                if (cancelled) {
                    return;
                }

                setQuotesError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load vendor quotes."
                );
            } finally {
                if (!cancelled) {
                    setQuotesLoading(false);
                }
            }
        };

        loadQuotes();

        return () => {
            cancelled = true;
        };
    }, [documentNo]);

    // ==================================================
    // UPDATE RATING
    // ==================================================

    const handleRatingChange = async (
        quoteId: number,
        rating: number
    ) => {
        if (!canEditRating) {
            return;
        }

        setUpdatingRatingId(quoteId);
        setRatingError("");

        try {
            // ==================================================
            // STEP 1
            // Update quote-level rating
            // ==================================================

            const response =
                await updateAssetQuoteRating(
                    taskId,
                    quoteId,
                    rating
                );

            // ==================================================
            // STEP 2
            // Update local quote UI
            // ==================================================

            setQuotes((previous) =>
                previous.map((quote) =>
                    quote.quote_id === quoteId
                        ? {
                            ...quote,
                            executive_rating:
                                response.quote.rating,
                        }
                        : quote
                )
            );

            // ==================================================
            // STEP 3
            // Submit/update task-level rating
            // ==================================================

            await submitAssetPurchaseRatings(
                taskId
            );
        } catch (err) {
            setRatingError(
                err instanceof Error
                    ? err.message
                    : "Failed to update quote rating."
            );
        } finally {
            setUpdatingRatingId(null);
        }
    };
    // ==================================================
    // SELECT QUOTE
    // ==================================================

    const handleQuoteSelection = async (
        quoteId: number
    ) => {
        if (selectingQuoteId !== null) {
            return;
        }

        // Already selected
        if (selectedQuoteId === quoteId) {
            return;
        }

        setSelectingQuoteId(quoteId);
        setSelectionError("");

        try {
            // ==================================================
            // STEP 1
            // Forward task to selection stage
            // ==================================================

            await forwardAssetPurchaseTaskToSelection(
                taskId
            );

            // ==================================================
            // STEP 2
            // Select quotation
            // ==================================================

            await selectAssetPurchaseQuote(
                taskId,
                quoteId
            );

            // ==================================================
            // STEP 3
            // Update UI
            // ==================================================

            setSelectedQuoteId(quoteId);
        } catch (err) {
            setSelectionError(
                err instanceof Error
                    ? err.message
                    : "Failed to select quotation."
            );
        } finally {
            setSelectingQuoteId(null);
        }
    };

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

            {/* ==================================================
                HEADER
            ================================================== */}

            <button
                type="button"
                onClick={() =>
                    setIsOpen(
                        (current) => !current
                    )
                }
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">

                        <FileText
                            size={17}
                            className="text-gray-500 dark:text-gray-400"
                        />

                    </div>

                    <div>

                        <div className="flex items-center gap-2">

                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Quote Details
                            </h2>

                            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">

                                <Eye size={11} />

                                {canEditRating
                                    ? "Rating Editable"
                                    : "View Only"}

                            </span>

                        </div>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Vendor quotations for this request
                        </p>

                    </div>

                </div>

                <div className="flex items-center gap-2">

                    {!quotesLoading &&
                        !quotesError &&
                        quotes.length > 0 && (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">

                                {quotes.length}{" "}

                                {quotes.length === 1
                                    ? "Quote"
                                    : "Quotes"}

                            </span>
                        )}

                    <ChevronDown
                        size={18}
                        className={`shrink-0 text-gray-400 transition-transform duration-200 ${isOpen
                                ? "rotate-180"
                                : ""
                            }`}
                    />

                </div>
            </button>

            {/* ==================================================
                CONTENT
            ================================================== */}

            {isOpen && (
                <div className="border-t border-gray-100 dark:border-gray-800">

                    <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-4 scrollbar-hide">

                        {/* ==================================================
                            DOCUMENT
                        ================================================== */}

                        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">

                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                Document
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                #{documentNo}
                            </p>

                        </div>

                        {/* ==================================================
                            RATING ERROR
                        ================================================== */}

                        {ratingError && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                {ratingError}
                            </div>
                        )}

                        {/* ==================================================
                            SELECTION ERROR
                        ================================================== */}

                        {selectionError && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                {selectionError}
                            </div>
                        )}

                        {/* ==================================================
                            LOADING
                        ================================================== */}

                        {quotesLoading && (
                            <div className="flex items-center justify-center py-10">

                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">

                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />

                                    Loading quotations...

                                </div>

                            </div>
                        )}

                        {/* ==================================================
                            ERROR
                        ================================================== */}

                        {!quotesLoading &&
                            quotesError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                    {quotesError}
                                </div>
                            )}

                        {/* ==================================================
                            EMPTY
                        ================================================== */}

                        {!quotesLoading &&
                            !quotesError &&
                            quotes.length === 0 && (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-5 py-10 text-center dark:border-gray-800 dark:bg-gray-950">

                                    <FileText
                                        size={25}
                                        className="text-gray-300 dark:text-gray-600"
                                    />

                                    <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                        No quotations found
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                        No vendor quotations are available for this request.
                                    </p>

                                </div>
                            )}

                        {/* ==================================================
                            QUOTES
                        ================================================== */}

                        {!quotesLoading &&
                            !quotesError &&
                            quotes.length > 0 && (
                                <div className="space-y-4">

                                    {quotes.map(
                                        (
                                            quote,
                                            index
                                        ) => (
                                            <QuotationCard
                                                key={
                                                    quote.quote_id
                                                }
                                                quote={
                                                    quote
                                                }
                                                index={
                                                    index
                                                }
                                                canEditRating={
                                                    canEditRating
                                                }
                                                updatingRatingId={
                                                    updatingRatingId
                                                }
                                                selectingQuoteId={
                                                    selectingQuoteId
                                                }
                                                selectedQuoteId={
                                                    selectedQuoteId
                                                }
                                                onRatingChange={
                                                    handleRatingChange
                                                }
                                                onSelectQuote={
                                                    handleQuoteSelection
                                                }
                                            />
                                        )
                                    )}

                                </div>
                            )}

                    </div>

                </div>
            )}

        </div>
    );
}

/* ======================================================
   QUOTATION CARD
====================================================== */

interface QuotationCardProps {
    quote: AssetPurchaseQuote;
    index: number;

    canEditRating: boolean;

    updatingRatingId: number | null;

    selectingQuoteId: number | null;

    selectedQuoteId: number | null;

    onRatingChange: (
        quoteId: number,
        rating: number
    ) => void;

    onSelectQuote: (
        quoteId: number
    ) => void;
}

function QuotationCard({
    quote,
    canEditRating,
    updatingRatingId,
    selectingQuoteId,
    selectedQuoteId,
    onRatingChange,
    onSelectQuote,
}: QuotationCardProps) {
    const details =
        quote.quote_data
            ?.additionalProp1
            ?.details;

    const isUpdating =
        updatingRatingId === quote.quote_id;

    const isSelecting =
        selectingQuoteId === quote.quote_id;

    const isSelected =
        selectedQuoteId === quote.quote_id;

    const isSelectionInProgress =
        selectingQuoteId !== null;

    // ==================================================
    // CARD CLICK
    // ==================================================

    const handleCardClick = () => {
        if (isSelectionInProgress) {
            return;
        }

        if (isSelected) {
            return;
        }

        onSelectQuote(
            quote.quote_id
        );
    };

    return (
        <div
            onClick={handleCardClick}
            className={`relative rounded-xl border p-4 shadow-sm transition-all ${isSelectionInProgress
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer"
                } ${isSelected
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-500 dark:bg-blue-950/30 dark:ring-blue-950"
                    : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-blue-700"
                }`}
        >

            {/* ==================================================
                CHECKBOX
            ================================================== */}

            <div
                className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all ${isSelected
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                    }`}
            >

                {isSelecting ? (
                    <Loader2
                        size={14}
                        className="animate-spin text-blue-600"
                    />
                ) : isSelected ? (
                    <Check
                        size={15}
                        strokeWidth={3}
                        className="text-white"
                    />
                ) : null}

            </div>

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex items-start justify-between gap-3 pr-10">

                <div className="flex items-center gap-3">

                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-gray-900"
                            }`}
                    >

                        {isSelected ? (
                            <Check
                                size={15}
                            />
                        ) : (
                            <FileText
                                size={15}
                                className="text-gray-500 dark:text-gray-400"
                            />
                        )}

                    </div>

                    <div>

                        <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                            {details
                                ? details
                                : "Quote Details"}
                        </h3>

                        <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                            Quote ID #{quote.quote_id}
                        </p>

                    </div>

                </div>

                {/* ==================================================
                    SELECTED STATUS
                ================================================== */}

                {isSelected ? (
                    <span className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-900">

                        <Check
                            size={11}
                        />

                        Selected

                    </span>
                ) : (
                    <span className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-gray-500 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-700">
                        Quote
                    </span>
                )}

            </div>

            {/* ==================================================
                INFORMATION
            ================================================== */}

            <div className="mt-4 space-y-3">

                <QuotationField
                    label="Vendor Name"
                    value={
                        quote.vendor_name ||
                        "-"
                    }
                />

                <QuotationField
                    label="Quote Number"
                    value={
                        quote.quote_no ||
                        "-"
                    }
                />

                <QuotationField
                    label="Quote Date"
                    value={formatQuoteDate(
                        quote.quote_date
                    )}
                />

                <QuotationField
                    label="Quoted Amount"
                    value={`${quote.currency || "INR"} ${formatQuoteAmount(
                        quote.quoted_amount
                    )}`}
                />

                {/* ==================================================
                    EXECUTIVE RATING
                ================================================== */}

                <div
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                >

                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        Executive Rating
                    </p>

                    {canEditRating ? (
                        <div className="flex items-center gap-2">

                            <select
                                value={
                                    quote.executive_rating ??
                                    ""
                                }
                                disabled={
                                    isUpdating
                                }
                                onChange={(event) =>
                                    onRatingChange(
                                        quote.quote_id,
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                                }
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-950"
                            >

                                <option value="">
                                    Select rating
                                </option>

                                <option value="1">
                                    1 - Poor
                                </option>

                                <option value="2">
                                    2 - Below Average
                                </option>

                                <option value="3">
                                    3 - Average
                                </option>

                                <option value="4">
                                    4 - Good
                                </option>

                                <option value="5">
                                    5 - Excellent
                                </option>

                            </select>

                            {isUpdating && (
                                <Loader2
                                    size={16}
                                    className="shrink-0 animate-spin text-gray-500"
                                />
                            )}

                        </div>
                    ) : (
                        <div className="flex items-center gap-2">

                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {quote.executive_rating ??
                                    "-"}
                            </span>

                            <span className="text-xs text-gray-400">
                                / 5
                            </span>

                            {quote.executive_rating && (
                                <span className="text-sm tracking-wide text-yellow-500">
                                    {"★".repeat(
                                        Math.min(
                                            5,
                                            Math.max(
                                                0,
                                                Number(
                                                    quote.executive_rating
                                                ) || 0
                                            )
                                        )
                                    )}
                                </span>
                            )}

                        </div>
                    )}

                </div>

            </div>

            {/* ==================================================
                SELECTION FOOTER
            ================================================== */}

            <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">

                <div>

                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        Vendor Selection
                    </p>

                    <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-300">

                        {isSelected
                            ? "This quotation has been selected"
                            : "Click anywhere on this card to select"}

                    </p>

                </div>

                {isSelecting && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">

                        <Loader2
                            size={15}
                            className="animate-spin"
                        />

                        Selecting...

                    </div>
                )}

                {isSelected &&
                    !isSelecting && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">

                            <Check
                                size={12}
                            />

                            Selected

                        </span>
                    )}

            </div>

        </div>
    );
}

/* ======================================================
   QUOTATION FIELD
====================================================== */

interface QuotationFieldProps {
    label: string;
    value: string;
}

function QuotationField({
    label,
    value,
}: QuotationFieldProps) {
    return (
        <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                {label}
            </p>

            <p className="whitespace-pre-wrap text-xs font-semibold leading-5 text-gray-900 dark:text-white">
                {value}
            </p>
        </div>
    );
}

/* ======================================================
   DATE FORMATTER
====================================================== */

function formatQuoteDate(
    date: string | undefined | null
) {
    if (!date) {
        return "-";
    }

    const parsedDate =
        new Date(date);

    if (
        Number.isNaN(
            parsedDate.getTime()
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
        }
    );
}

/* ======================================================
   AMOUNT FORMATTER
====================================================== */

function formatQuoteAmount(
    amount: number
) {
    return new Intl.NumberFormat(
        "en-IN",
        {
            maximumFractionDigits: 2,
        }
    ).format(amount);
}

export default QuoteDetailsAccordion;