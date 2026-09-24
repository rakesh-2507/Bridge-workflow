import { useEffect, useState } from "react";

import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  X,
} from "lucide-react";

import {
  getAssetPurchaseQuotes,
  updateAssetQuoteRating,
  submitAssetPurchaseRatings,
} from "../../api/assetPurchaseQuote";

import type { AssetPurchaseQuote } from "../../types/assetPurchaseQuote";

import CompareQuotes from "./CompareQuotes";

/* =========================================================
   TYPES
========================================================= */

interface QuoteDetailsAccordionProps {
  documentNo: string;
  taskId: number;
  canUpdateRating?: boolean;
  canSubmitRatings?: boolean;
  canSelectQuote?: boolean;
  onQuoteSelected?: (quoteId: number) => void;
}

/* =========================================================
   COMPONENT
========================================================= */

function QuoteDetailsAccordion({
  documentNo,
  taskId,
  canUpdateRating = false,
  canSubmitRatings = false,
  canSelectQuote = false,
  onQuoteSelected,
}: QuoteDetailsAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const [quotes, setQuotes] = useState<AssetPurchaseQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState("");

  const [updatingRatingId, setUpdatingRatingId] = useState<number | null>(
    null,
  );

  const [ratingError, setRatingError] = useState("");
  const [submittingRatings, setSubmittingRatings] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [ratingsSubmitted, setRatingsSubmitted] = useState(false);

  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

  const [isCompareOpen, setIsCompareOpen] = useState(false);

  /* ======================================================
     LOAD QUOTES
  ====================================================== */

  useEffect(() => {
    if (!documentNo) {
      return;
    }

    let cancelled = false;

    const loadQuotes = async () => {
      setQuotesLoading(true);

      try {
        const response = await getAssetPurchaseQuotes(documentNo);

        if (cancelled) {
          return;
        }

        setQuotes(response.data ?? []);
        setQuotesError("");
      } catch (err) {
        if (cancelled) {
          return;
        }

        setQuotes([]);
        setQuotesError(
          err instanceof Error ? err.message : "Failed to load vendor quotes.",
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

  /* ======================================================
     UPDATE SINGLE RATING
     
     Executive + Senior Manager can update ratings.
     Submission remains Manager-only.
  ====================================================== */

  const handleRatingChange = async (
    quoteId: number,
    rating: number,
  ): Promise<void> => {
    if (!canUpdateRating || ratingsSubmitted) {
      return;
    }

    if (rating < 1 || rating > 5) {
      return;
    }

    setUpdatingRatingId(quoteId);
    setRatingError("");
    setSubmitSuccess("");

    try {
      const response = await updateAssetQuoteRating(taskId, quoteId, rating);

      setQuotes((previous) =>
        previous.map((quote) =>
          quote.quote_id === quoteId
            ? {
                ...quote,
                executive_rating: response.quote?.rating ?? rating,
              }
            : quote,
        ),
      );
    } catch (err) {
      setRatingError(
        err instanceof Error ? err.message : "Failed to update quote rating.",
      );
    } finally {
      setUpdatingRatingId(null);
    }
  };

  /* ======================================================
     SUBMIT ALL RATINGS

     ONLY Assets Manager-Senior can submit ratings.
  ====================================================== */

  const handleSubmitRatings = async (): Promise<void> => {
    if (!canSubmitRatings || ratingsSubmitted) {
      return;
    }

    if (quotes.length === 0) {
      setRatingError("No quotations are available to submit.");
      return;
    }

    setSubmittingRatings(true);
    setRatingError("");
    setSubmitSuccess("");

    try {
      const ratings: Record<number, number> = {};
      const unratedQuotes: AssetPurchaseQuote[] = [];

      for (const quote of quotes) {
        const rating = Number(quote.executive_rating);

        if (Number.isFinite(rating) && rating >= 1 && rating <= 5) {
          ratings[quote.quote_id] = rating;
        } else {
          unratedQuotes.push(quote);
        }
      }

      if (unratedQuotes.length > 0) {
        setRatingError(
          `Please rate all ${unratedQuotes.length} unrated quotation${
            unratedQuotes.length === 1 ? "" : "s"
          } before submitting.`,
        );

        return;
      }

      const response = await submitAssetPurchaseRatings(taskId, ratings);

      setSubmitSuccess(
        response.message || "Quotation ratings submitted successfully.",
      );

      if (response.quotations_locked) {
        setRatingsSubmitted(true);
      }
    } catch (err) {
      setRatingError(
        err instanceof Error
          ? err.message
          : "Failed to submit quotation ratings.",
      );
    } finally {
      setSubmittingRatings(false);
    }
  };

  /* ======================================================
     SELECT QUOTE

     ONLY Assets Manager-Senior can select.
  ====================================================== */

  const handleQuoteSelection = (quoteId: number): void => {
    if (!canSelectQuote) {
      return;
    }

    setSelectedQuoteId(quoteId);
    onQuoteSelected?.(quoteId);

    setSubmitSuccess("");
    setRatingError("");
  };

  /* ======================================================
     CLOSE COMPARISON
  ====================================================== */

  const handleCloseCompare = (): void => {
    setIsCompareOpen(false);
  };

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* ==================================================
            HEADER
        ================================================== */}

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
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

               
              </div>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Vendor quotations for this request
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!quotesLoading && !quotesError && quotes.length > 0 && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {quotes.length} {quotes.length === 1 ? "Quote" : "Quotes"}
              </span>
            )}

            <ChevronDown
              size={18}
              className={`shrink-0 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
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
              {/* DOCUMENT */}

              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  Document
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  #{documentNo}
                </p>
              </div>

              {/* RATING ERROR */}

              {ratingError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {ratingError}
                </div>
              )}

              {/* SUCCESS */}

              {submitSuccess && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                  {submitSuccess}
                </div>
              )}

              {/* LOADING */}

              {quotesLoading && (
                <div className="flex items-center justify-center py-10">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 size={18} className="animate-spin" />
                    Loading quotations...
                  </div>
                </div>
              )}

              {/* ERROR */}

              {!quotesLoading && quotesError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {quotesError}
                </div>
              )}

              {/* EMPTY */}

              {!quotesLoading && !quotesError && quotes.length === 0 && (
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

              {/* QUOTES */}

              {!quotesLoading && !quotesError && quotes.length > 0 && (
                <>
                  {/* COMPARE BUTTON */}

                  {quotes.length >= 2 && (
                    <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/20">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          Compare Vendor Quotes
                        </p>

                        <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                          Compare all quotations side by side before making a
                          selection.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCompareOpen(true)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        <ArrowLeftRight size={14} />
                        Compare Quotes
                      </button>
                    </div>
                  )}

                  {/* QUOTATION CARDS */}

                  <div className="space-y-4">
                    {quotes.map((quote) => (
                      <QuotationCard
                        key={quote.quote_id}
                        quote={quote}
                        canEditRating={
                          canUpdateRating && !ratingsSubmitted
                        }
                        canSelectQuote={canSelectQuote}
                        updatingRatingId={updatingRatingId}
                        selectedQuoteId={selectedQuoteId}
                        onRatingChange={handleRatingChange}
                        onSelectQuote={handleQuoteSelection}
                      />
                    ))}
                  </div>

                  {/* SUBMIT RATINGS */}

                  {canSubmitRatings && (
                    <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-800">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                            Submit Ratings
                          </p>

                          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                            Review all quotation ratings before submitting.
                          </p>
                        </div>

                        {ratingsSubmitted && (
                          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                            <Check size={11} />
                            Submitted
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitRatings}
                        disabled={submittingRatings || ratingsSubmitted}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingRatings ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            Submitting Ratings...
                          </>
                        ) : ratingsSubmitted ? (
                          <>
                            <Check size={15} />
                            Ratings Submitted
                          </>
                        ) : (
                          <>
                            <Check size={15} />
                            Submit Ratings
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================
          COMPARE MODAL
      ==================================================== */}

      {isCompareOpen && quotes.length >= 2 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseCompare();
            }
          }}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            aria-label="Compare Quotes"
          >
            {/* MODAL HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                  <ArrowLeftRight
                    size={17}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Compare Quotes
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Compare vendor quotations for #{documentNo}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseCompare}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close comparison"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="min-h-0 flex-1 overflow-auto p-5">
              <CompareQuotes
              taskId={taskId}
                quotes={quotes}
                selectedQuoteId={selectedQuoteId}
                onSelectQuote={
                  canSelectQuote ? handleQuoteSelection : undefined
                }
              />
            </div>

            {/* MODAL FOOTER */}

            <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-950">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {canSelectQuote
                  ? selectedQuoteId
                    ? "A quotation is currently selected."
                    : "Select a quotation from the comparison table."
                  : "Comparison is view only."}
              </div>

              <button
                type="button"
                onClick={handleCloseCompare}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   QUOTATION CARD
========================================================= */

interface QuotationCardProps {
  quote: AssetPurchaseQuote;
  canEditRating: boolean;
  canSelectQuote: boolean;
  updatingRatingId: number | null;
  selectedQuoteId: number | null;

  onRatingChange: (quoteId: number, rating: number) => void;

  onSelectQuote: (quoteId: number) => void;
}

function QuotationCard({
  quote,
  canEditRating,
  canSelectQuote,
  updatingRatingId,
  selectedQuoteId,
  onRatingChange,
  onSelectQuote,
}: QuotationCardProps) {
  const details = quote.quote_data?.additionalProp1?.details;

  const isUpdating = updatingRatingId === quote.quote_id;

  const isSelected =
    canSelectQuote && selectedQuoteId === quote.quote_id;

  const handleCardClick = (): void => {
    if (!canSelectQuote) {
      return;
    }

    if (isSelected) {
      return;
    }

    onSelectQuote(quote.quote_id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative rounded-xl border p-4 shadow-sm transition-all ${
        canSelectQuote ? "cursor-pointer" : "cursor-default"
      } ${
        isSelected
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-500 dark:bg-blue-950/30 dark:ring-blue-950"
          : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950"
      } ${
        canSelectQuote && !isSelected
          ? "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-700"
          : ""
      }`}
    >
      {/* CHECK */}

      {canSelectQuote && (
        <div
          className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all ${
            isSelected
              ? "border-blue-600 bg-blue-600"
              : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
          }`}
        >
          {isSelected && (
            <Check size={15} strokeWidth={3} className="text-white" />
          )}
        </div>
      )}

      {/* HEADER */}

      <div
        className={`flex items-start justify-between gap-3 ${
          canSelectQuote ? "pr-10" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isSelected
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-900"
            }`}
          >
            {isSelected ? (
              <Check size={15} />
            ) : (
              <FileText
                size={15}
                className="text-gray-500 dark:text-gray-400"
              />
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
              {details || "Quote Details"}
            </h3>

            <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
              Quote ID #{quote.quote_id}
            </p>
          </div>
        </div>

        {canSelectQuote && isSelected ? (
          <span className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-900">
            <Check size={11} />
            Selected
          </span>
        ) : (
          <span className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-gray-500 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-700">
            Quote
          </span>
        )}
      </div>

      {/* INFORMATION */}

      <div className="mt-4 space-y-3">
        <QuotationField
          label="Vendor Name"
          value={quote.vendor_name || "-"}
        />

        <QuotationField
          label="Quote Number"
          value={quote.quote_no || "-"}
        />

        <QuotationField
          label="Quote Date"
          value={formatQuoteDate(quote.quote_date)}
        />

        <QuotationField
          label="Quoted Amount"
          value={`${quote.currency || "INR"} ${formatQuoteAmount(
            quote.quoted_amount,
          )}`}
        />

        {/* RATING */}

        <div
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Executive Rating
          </p>

          {canEditRating ? (
            <div className="flex items-center gap-2">
              <select
                value={quote.executive_rating ?? ""}
                disabled={isUpdating}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  if (!value) {
                    return;
                  }

                  onRatingChange(quote.quote_id, value);
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-950"
              >
                <option value="">Select rating</option>

                <option value="1">1 - Poor</option>
                <option value="2">2 - Below Average</option>
                <option value="3">3 - Average</option>
                <option value="4">4 - Good</option>
                <option value="5">5 - Excellent</option>
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
                {quote.executive_rating ?? "-"}
              </span>

              <span className="text-xs text-gray-400">/ 5</span>

              {quote.executive_rating && (
                <span className="text-sm tracking-wide text-yellow-500">
                  {"★".repeat(
                    Math.min(
                      5,
                      Math.max(
                        0,
                        Number(quote.executive_rating) || 0,
                      ),
                    ),
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}

      <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Vendor Selection
          </p>

          <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-300">
            {canSelectQuote
              ? isSelected
                ? "This quotation has been selected"
                : "Click anywhere on this card to select"
              : "Selection is available to the senior manager"}
          </p>
        </div>

        {canSelectQuote && isSelected && (
          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Check size={12} />
            Selected
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   QUOTATION FIELD
========================================================= */

interface QuotationFieldProps {
  label: string;
  value: string;
}

function QuotationField({ label, value }: QuotationFieldProps) {
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

/* =========================================================
   DATE FORMATTER
========================================================= */

function formatQuoteDate(
  date: string | undefined | null,
): string {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   AMOUNT FORMATTER
========================================================= */

function formatQuoteAmount(
  amount: number | undefined | null,
): string {
  if (amount === undefined || amount === null) {
    return "-";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/* =========================================================
   EXPORT
========================================================= */

export default QuoteDetailsAccordion;