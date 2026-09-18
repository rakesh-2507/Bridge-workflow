import { useState } from "react";

import {
  Check,
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

type QuoteRatings = Record<
  number,
  Partial<Record<RatingParameter, number>>
>;

const CompareQuotes = ({
  quotes,
  selectedQuoteId = null,
  onSelectQuote,
}: CompareQuotesProps) => {
  /*
   * Dummy ratings for comparison parameters.
   *
   * These ratings are currently stored only in local state.
   * Later they can be replaced with API calls.
   */
  const [quoteRatings, setQuoteRatings] =
    useState<QuoteRatings>({});

  if (!quotes || quotes.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No quotes available for comparison.
        </p>
      </div>
    );
  }

  const getRating = (
    quoteId: number,
    parameter: RatingParameter,
  ): number => {
    return quoteRatings[quoteId]?.[parameter] ?? 0;
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

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* HEADER */}

      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Quote Comparison
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Compare vendor quotations side by side and
              rate each parameter.
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {quotes.length}{" "}
            {quotes.length === 1 ? "Quote" : "Quotes"}
          </span>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-x-auto">
        <table className="min-w-[1050px] w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/70">
              <th className="sticky left-0 z-20 min-w-[190px] border-r border-gray-200 bg-gray-50 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-400">
                Details
              </th>

              {quotes.map((quote) => {
                const isSelected =
                  selectedQuoteId === quote.quote_id;

                return (
                  <th
                    key={quote.quote_id}
                    className={`min-w-[280px]  border-r border-gray-200 px-4 py-4 text-left align-top ${
                      isSelected
                        ? "bg-green-50 dark:bg-green-950/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 ">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white ">
                          {quote.vendor_name ||
                            "Unknown Vendor"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {quote.quote_no ||
                            "No Quote Number"}
                        </p>
                      </div>

                      {isSelected && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Check size={12} />
                          Selected
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* VENDOR */}

            <ComparisonRow
              label="Vendor"
              quotes={quotes}
              selectedQuoteId={selectedQuoteId}
              ratingParameter="vendor"
              rating={getRating}
              onRatingChange={handleRatingChange}
              renderValue={(quote) => (
                <span className="font-medium text-gray-900 dark:text-white ">
                  {quote.vendor_name || "-"}
                </span>
              )}
            />

            {/* QUOTE NUMBER */}

            <ComparisonRow
              label="Quote Number"
              quotes={quotes}
              selectedQuoteId={selectedQuoteId}
              ratingParameter="quoteNumber"
              rating={getRating}
              onRatingChange={handleRatingChange}
              renderValue={(quote) => (
                <span className="text-gray-700 dark:text-gray-300">
                  {quote.quote_no || "-"}
                </span>
              )}
            />

            {/* QUOTE DATE */}

            <ComparisonRow
              label="Quote Date"
              quotes={quotes}
              selectedQuoteId={selectedQuoteId}
              ratingParameter="quoteDate"
              rating={getRating}
              onRatingChange={handleRatingChange}
              renderValue={(quote) => (
                <span className="text-gray-700 dark:text-gray-300">
                  {formatQuoteDate(quote.quote_date)}
                </span>
              )}
            />

            {/* AMOUNT */}

            <ComparisonRow
              label="Quoted Amount"
              quotes={quotes}
              selectedQuoteId={selectedQuoteId}
              ratingParameter="quotedAmount"
              rating={getRating}
              onRatingChange={handleRatingChange}
              renderValue={(quote) => (
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatAmount(
                    quote.quoted_amount,
                    quote.currency,
                  )}
                </span>
              )}
            />

            {/* CURRENCY */}

            <ComparisonRow
              label="Currency"
              quotes={quotes}
              selectedQuoteId={selectedQuoteId}
              ratingParameter="currency"
              rating={getRating}
              onRatingChange={handleRatingChange}
              renderValue={(quote) => (
                <span className="text-gray-700 dark:text-gray-300">
                  {quote.currency || "-"}
                </span>
              )}
            />

            {/* EXECUTIVE RATING */}

            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="sticky left-0 z-20 border-r border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                Executive Rating
              </td>

              {quotes.map((quote) => {
                const isSelected =
                  selectedQuoteId === quote.quote_id;

                const executiveRating =
                  Number(
                    quote.executive_rating,
                  ) || 0;

                return (
                  <td
                    key={quote.quote_id}
                    className={`px-4 py-3  border-r border-gray-200 align-middle ${
                      isSelected
                        ? "bg-green-50 dark:bg-green-950/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({
                          length: 5,
                        }).map((_, index) => (
                          <Star
                            key={index}
                            size={15}
                            className={
                              index < executiveRating
                                ? "fill-current text-yellow-500"
                                : "text-gray-300 dark:text-gray-600"
                            }
                          />
                        ))}
                      </div>

                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {quote.executive_rating ?? 0}/5
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* DETAILS */}

            <ComparisonRow
              label="Details"
              quotes={quotes}
              selectedQuoteId={selectedQuoteId}
              ratingParameter="details"
              rating={getRating}
              onRatingChange={handleRatingChange}
              renderValue={(quote) => {
                const details =
                  quote.quote_data
                    ?.additionalProp1
                    ?.details;

                return (
                  <p className="max-w-[300px] whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                    {details || "-"}
                  </p>
                );
              }}
            />

            {/* ACTION */}

            {onSelectQuote && (
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="sticky left-0 z-20 border-r border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                  Action
                </td>

                {quotes.map((quote) => {
                  const isSelected =
                    selectedQuoteId === quote.quote_id;

                  return (
                    <td
                      key={quote.quote_id}
                      className={`px-4 py-4  border-r border-gray-200 ${
                        isSelected
                          ? "bg-green-50 dark:bg-green-950/20"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onSelectQuote(
                            quote.quote_id,
                          )
                        }
                        className={`inline-flex items-center justify-center gap-2 rounded-lg  px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        }`}
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
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ======================================================
   COMPARISON ROW
====================================================== */

interface ComparisonRowProps {
  label: string;
  quotes: AssetPurchaseQuote[];
  selectedQuoteId?: number | null;

  ratingParameter: RatingParameter;

  rating: (
    quoteId: number,
    parameter: RatingParameter,
  ) => number;

  onRatingChange: (
    quoteId: number,
    parameter: RatingParameter,
    rating: number,
  ) => void;

  renderValue: (
    quote: AssetPurchaseQuote,
  ) => React.ReactNode;
}

const ComparisonRow = ({
  label,
  quotes,
  selectedQuoteId,
  ratingParameter,
  rating,
  onRatingChange,
  renderValue,
}: ComparisonRowProps) => {
  return (
    <tr className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
      {/* LABEL */}

      <td className="sticky left-0 z-20 border-r border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
        {label}
      </td>

      {/* VALUES */}

      {quotes.map((quote) => {
        const isSelected =
          selectedQuoteId === quote.quote_id;

        const currentRating = rating(
          quote.quote_id,
          ratingParameter,
        );

        return (
          <td
            key={quote.quote_id}
            className={`px-4 py-3  border-r border-gray-200 align-middle ${
              isSelected
                ? "bg-green-50 dark:bg-green-950/20"
                : ""
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              {/* VALUE */}

              <div className="min-w-0 flex-1">
                {renderValue(quote)}
              </div>

              {/* DUMMY PARAMETER RATING */}

              <div className="flex shrink-0 items-center gap-1">
                <div className="flex items-center gap-0">
                  {Array.from({
                    length: 5,
                  }).map((_, index) => {
                    const starRating = index + 1;

                    const active =
                      starRating <= currentRating;

                    return (
                      <button
                        key={starRating}
                        type="button"
                        title={`Rate ${starRating}/5`}
                        onClick={() =>
                          onRatingChange(
                            quote.quote_id,
                            ratingParameter,
                            starRating,
                          )
                        }
                        className="rounded p-0.5 transition hover:scale-110 focus:outline-none focus:ring-1 focus:ring-yellow-400/50"
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
                  })}
                </div>

                <span className="min-w-[25px] text-right text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  {currentRating}/5
                </span>
              </div>
            </div>
          </td>
        );
      })}
    </tr>
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

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
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

  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) {
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
