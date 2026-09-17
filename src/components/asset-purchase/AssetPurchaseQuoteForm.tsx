import { useState } from "react";

import {
    Loader2,
    Plus,
    Trash2,
} from "lucide-react";

import {
    createAssetPurchaseQuote,
    forwardAssetPurchaseTask,
} from "../../api/assetPurchaseQuote";

import type {
    CreateAssetPurchaseQuoteResponse,
} from "../../types/assetPurchaseQuote";

interface AssetPurchaseQuoteFormData {
    vendor_name: string;
    quote_no: string;
    quote_date: string;
    quoted_amount: string;
    currency: string;
    executive_rating: string;
    details: string;
}

interface AssetPurchaseQuoteFormProps {
    taskId: number;
    documentNo: string;

    /**
     * Called after quote(s) are successfully
     * created and forwarded.
     */
    onSuccess?: (
        responses: CreateAssetPurchaseQuoteResponse[],
    ) => void;
}

const createEmptyQuote = (): AssetPurchaseQuoteFormData => ({
    vendor_name: "",
    quote_no: "",
    quote_date: "",
    quoted_amount: "",
    currency: "INR",
    executive_rating: "",
    details: "",
});

function AssetPurchaseQuoteForm({
    taskId,
    documentNo,
    onSuccess,
}: AssetPurchaseQuoteFormProps) {
    const [quotes, setQuotes] = useState<
        AssetPurchaseQuoteFormData[]
    >([createEmptyQuote()]);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    /* ======================================================
       UPDATE QUOTE
    ====================================================== */

    const updateQuote = (
        index: number,
        field: keyof AssetPurchaseQuoteFormData,
        value: string,
    ) => {
        setQuotes((current) =>
            current.map((quote, quoteIndex) =>
                quoteIndex === index
                    ? {
                          ...quote,
                          [field]: value,
                      }
                    : quote,
            ),
        );
    };

    /* ======================================================
       ADD QUOTE
    ====================================================== */

    const addQuote = () => {
        setQuotes((current) => [
            ...current,
            createEmptyQuote(),
        ]);
    };

    /* ======================================================
       REMOVE QUOTE
    ====================================================== */

    const removeQuote = (index: number) => {
        setQuotes((current) => {
            /*
             * Always keep at least one quote.
             */
            if (current.length === 1) {
                return current;
            }

            return current.filter(
                (_, quoteIndex) =>
                    quoteIndex !== index,
            );
        });
    };

    /* ======================================================
       VALIDATE QUOTES
    ====================================================== */

    const validateQuotes = (): string | null => {
        if (!documentNo.trim()) {
            return "Document number is required.";
        }

        if (!taskId) {
            return "Task ID is required.";
        }

        if (quotes.length < 1) {
            return "Please add at least one quote.";
        }

        for (
            let index = 0;
            index < quotes.length;
            index++
        ) {
            const quote = quotes[index];

            const quoteNumber = index + 1;

            if (!quote.vendor_name.trim()) {
                return `Vendor name is required for quote ${quoteNumber}.`;
            }

            if (!quote.quote_no.trim()) {
                return `Quote number is required for quote ${quoteNumber}.`;
            }

            if (!quote.quote_date) {
                return `Quote date is required for quote ${quoteNumber}.`;
            }

            if (!quote.quoted_amount.trim()) {
                return `Quoted amount is required for quote ${quoteNumber}.`;
            }

            const amount = Number(
                quote.quoted_amount,
            );

            if (
                Number.isNaN(amount) ||
                amount <= 0
            ) {
                return `Enter a valid quoted amount for quote ${quoteNumber}.`;
            }

            if (!quote.currency) {
                return `Currency is required for quote ${quoteNumber}.`;
            }

            if (!quote.executive_rating) {
                return `Executive rating is required for quote ${quoteNumber}.`;
            }

            const rating = Number(
                quote.executive_rating,
            );

            if (
                Number.isNaN(rating) ||
                rating < 1 ||
                rating > 5
            ) {
                return `Executive rating must be between 1 and 5 for quote ${quoteNumber}.`;
            }
        }

        return null;
    };

    /* ======================================================
       SUBMIT QUOTES

       FLOW:

       Quote 1
          ↓
       POST /asset-purchase/quotes
          ↓
       POST /asset-purchase/tasks/{taskId}/forward

       Quote 2
          ↓
       POST /asset-purchase/quotes
          ↓
       POST /asset-purchase/tasks/{taskId}/forward

       Quote 3
          ↓
       POST /asset-purchase/quotes
          ↓
       POST /asset-purchase/tasks/{taskId}/forward

       Forward is called EVERY TIME.
    ====================================================== */

    const handleSubmit = async (
        e: React.FormEvent,
    ) => {
        e.preventDefault();

        if (isSubmitting) {
            return;
        }

        const validationError =
            validateQuotes();

        if (validationError) {
            setError(validationError);
            setMessage("");
            return;
        }

        setIsSubmitting(true);
        setMessage("");
        setError("");

        try {
            const quoteResponses: CreateAssetPurchaseQuoteResponse[] =
                [];

            /*
             * Process each quote one by one.
             *
             * IMPORTANT:
             * Forward happens immediately after
             * each successful quote creation.
             */
            for (const quote of quotes) {
                /*
                 * 1. CREATE QUOTE
                 */
                const quoteResponse =
                    await createAssetPurchaseQuote({
                        document_no:
                            documentNo,
                        vendor_name:
                            quote.vendor_name.trim(),
                        quote_no:
                            quote.quote_no.trim(),
                        quote_date:
                            quote.quote_date,
                        quoted_amount:
                            Number(
                                quote.quoted_amount,
                            ),
                        currency:
                            quote.currency,
                        executive_rating:
                            Number(
                                quote.executive_rating,
                            ),
                        quote_data: {
                            additionalProp1: {
                                details:
                                    quote.details.trim(),
                            },
                        },
                    });

                quoteResponses.push(
                    quoteResponse,
                );

                /*
                 * 2. IMMEDIATELY FORWARD
                 *
                 * This happens after THIS quote
                 * has been successfully created.
                 */
                await forwardAssetPurchaseTask(
                    taskId,
                );
            }

            /*
             * 3. SUCCESS
             */
            setMessage(
                `${quoteResponses.length} quote(s) saved and forwarded successfully.`,
            );

            /*
             * 4. RESET FORM
             */
            setQuotes([
                createEmptyQuote(),
            ]);

            /*
             * 5. NOTIFY PARENT
             */
            onSuccess?.(quoteResponses);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save and forward quote(s).",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="border-b border-gray-200 p-5 dark:border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-s">
                        Vendor Quotes
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Document No:{" "}
                        <span className="font-medium text-s">
                            {documentNo || "-"}
                        </span>
                    </p>
                </div>
            </div>

            {/* ==================================================
                FORM
            ================================================== */}

            <form
                onSubmit={handleSubmit}
                className="space-y-5 p-5"
            >
                {/* ==================================================
                    QUOTES
                ================================================== */}

                {quotes.map(
                    (quote, index) => (
                        <div
                            key={index}
                            className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
                        >
                            {/* Quote header */}

                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Quote{" "}
                                    {index + 1}
                                </h3>

                                {quotes.length >
                                    1 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeQuote(
                                                index,
                                            )
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                    >
                                        <Trash2
                                            size={
                                                15
                                            }
                                        />

                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Vendor */}

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Vendor Name
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            quote.vendor_name
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateQuote(
                                                index,
                                                "vendor_name",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                        placeholder="Enter vendor name"
                                    />
                                </div>

                                {/* Quote number */}

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Quote Number
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            quote.quote_no
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateQuote(
                                                index,
                                                "quote_no",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                        placeholder="Enter quote number"
                                    />
                                </div>

                                {/* Quote date */}

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Quote Date
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            quote.quote_date
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateQuote(
                                                index,
                                                "quote_date",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                {/* Currency */}

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Currency
                                    </label>

                                    <select
                                        value={
                                            quote.currency
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateQuote(
                                                index,
                                                "currency",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="INR">
                                            INR
                                        </option>

                                        <option value="USD">
                                            USD
                                        </option>

                                        <option value="EUR">
                                            EUR
                                        </option>

                                        <option value="AED">
                                            AED
                                        </option>
                                    </select>
                                </div>

                                {/* Amount */}

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Quoted Amount
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            quote.quoted_amount
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateQuote(
                                                index,
                                                "quoted_amount",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                        placeholder="Enter amount"
                                    />
                                </div>

                                {/* Rating */}

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Executive Rating
                                    </label>

                                    <select
                                        value={
                                            quote.executive_rating
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateQuote(
                                                index,
                                                "executive_rating",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="">
                                            Select rating
                                        </option>

                                        <option value="1">
                                            1 - Poor
                                        </option>

                                        <option value="2">
                                            2 - Fair
                                        </option>

                                        <option value="3">
                                            3 - Good
                                        </option>

                                        <option value="4">
                                            4 - Very Good
                                        </option>

                                        <option value="5">
                                            5 - Excellent
                                        </option>
                                    </select>
                                </div>

                                {/* Details */}

                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Details
                                    </label>

                                    <textarea
                                        value={
                                            quote.details
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateQuote(
                                                index,
                                                "details",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        rows={3}
                                        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                        placeholder="Enter additional quote details"
                                    />
                                </div>
                            </div>
                        </div>
                    ),
                )}

                {/* ==================================================
                    ADD ANOTHER QUOTE
                ================================================== */}

                <button
                    type="button"
                    onClick={addQuote}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                    <Plus size={16} />

                    Add Another Quote
                </button>

                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* ==================================================
                    SUCCESS
                ================================================== */}

                {message && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
                        {message}
                    </div>
                )}

                {/* ==================================================
                    SUBMIT
                ================================================== */}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting && (
                            <Loader2
                                size={17}
                                className="animate-spin"
                            />
                        )}

                        {isSubmitting
                            ? "Saving & Forwarding..."
                            : "Save & Forward"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AssetPurchaseQuoteForm;