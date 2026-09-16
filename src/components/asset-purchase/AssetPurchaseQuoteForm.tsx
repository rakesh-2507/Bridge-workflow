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
    CreateAssetPurchaseQuotePayload,
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
     * True when the task has already been forwarded.
     *
     * When true:
     * - Executive can still create quotes
     * - Forward API will NOT be called again
     */
    alreadyForwarded?: boolean;

    /**
     * Called after quote(s) are successfully created.
     */
    onSuccess?: (
        responses: CreateAssetPurchaseQuoteResponse[]
    ) => void;

    /**
     * Called only after the first successful forward.
     */
    onForwarded?: () => void;
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
    alreadyForwarded = false,
    onSuccess,
    onForwarded,
}: AssetPurchaseQuoteFormProps) {
    const [quotes, setQuotes] = useState<
        AssetPurchaseQuoteFormData[]
    >([createEmptyQuote()]);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [message, setMessage] = useState("");

    const [error, setError] = useState("");

    /**
     * This state controls whether the forward API
     * should be called.
     *
     * It does NOT control whether quotes can be created.
     *
     * Even after forwarding:
     *     hasForwarded === true
     *
     * the executive can still submit more quotes.
     */
    const [hasForwarded, setHasForwarded] =
        useState(alreadyForwarded);

    const updateQuote = (
        index: number,
        field: keyof AssetPurchaseQuoteFormData,
        value: string
    ) => {
        setQuotes((current) =>
            current.map((quote, quoteIndex) =>
                quoteIndex === index
                    ? {
                        ...quote,
                        [field]: value,
                    }
                    : quote
            )
        );
    };

    const addQuote = () => {
        setQuotes((current) => [
            ...current,
            createEmptyQuote(),
        ]);
    };

    const removeQuote = (index: number) => {
        setQuotes((current) => {
            /*
             * Always keep at least one quote form.
             */
            if (current.length === 1) {
                return current;
            }

            return current.filter(
                (_, quoteIndex) =>
                    quoteIndex !== index
            );
        });
    };

    const validateQuotes = (): string | null => {
        if (!documentNo.trim()) {
            return "Document number is required.";
        }

        if (!taskId) {
            return "Task ID is required.";
        }

        /*
         * ONE quote is enough.
         *
         * There is no minimum of 4 anymore.
         */
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
                quote.quoted_amount
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
                quote.executive_rating
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

    const handleSubmit = async (
        event: React.SyntheticEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const validationError =
            validateQuotes();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setIsSubmitting(true);

            const quoteResponses: CreateAssetPurchaseQuoteResponse[] =
                [];

            /*
             * STEP 1
             *
             * Create all quotes.
             *
             * Every quote uses the same document number.
             */
            for (const quote of quotes) {
                const payload: CreateAssetPurchaseQuotePayload =
                {
                    document_no: documentNo,
                    vendor_name:
                        quote.vendor_name.trim(),
                    quote_no:
                        quote.quote_no.trim(),
                    quote_date:
                        quote.quote_date,
                    quoted_amount:
                        Number(
                            quote.quoted_amount
                        ),
                    currency:
                        quote.currency,
                    executive_rating:
                        Number(
                            quote.executive_rating
                        ),
                    quote_data: {
                        additionalProp1: {
                            details:
                                quote.details.trim(),
                        },
                    },
                };

                const response =
                    await createAssetPurchaseQuote(
                        payload
                    );

                quoteResponses.push(response);
            }

            /*
             * STEP 2
             *
             * FIRST submission:
             *
             *     Create quote(s)
             *          ↓
             *     Forward task
             *
             * LATER submission:
             *
             *     Create quote(s)
             *          ↓
             *     DO NOT forward
             */
            if (!hasForwarded) {
                await forwardAssetPurchaseTask(
                    taskId
                );

                /*
                 * Prevent another forward during
                 * this component's lifetime.
                 */
                setHasForwarded(true);

                /*
                 * Tell TasksPage that this task
                 * has now been forwarded.
                 */
                onForwarded?.();

                setMessage(
                    `${quoteResponses.length} quote${quoteResponses.length > 1
                        ? "s"
                        : ""
                    } submitted and task forwarded successfully.`
                );
            } else {
                /*
                 * Task was already forwarded.
                 *
                 * ONLY the quotes were created.
                 */
                setMessage(
                    `${quoteResponses.length} quote${quoteResponses.length > 1
                        ? "s"
                        : ""
                    } added successfully to ${documentNo}.`
                );
            }

            /*
             * STEP 3
             *
             * Clear the submitted quote(s).
             *
             * Keep one blank quote form visible so
             * the executive can immediately add
             * another quote.
             */
            setQuotes([
                createEmptyQuote(),
            ]);

            /*
             * Notify parent about newly created
             * quote(s).
             */
            onSuccess?.(quoteResponses);
        } catch (err) {
            console.error(
                "Failed to create vendor quote:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create vendor quote."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {/* Header */}
            <div className="border-b border-gray-200 p-5 dark:border-gray-700">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Vendor Quotes
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Document No:{" "}
                            <span className="font-medium text-gray-900 dark:text-white">
                                {documentNo || "-"}
                            </span>
                        </p>

                    </div>

                    {hasForwarded && (
                        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
                            Task already forwarded
                        </div>
                    )}
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5 p-5"
            >
                {quotes.map((quote, index) => (
                    <div
                        key={index}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
                    >
                        {/* Quote header */}
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Quote {index + 1}
                            </h3>

                            {quotes.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        removeQuote(
                                            index
                                        )
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                    <Trash2
                                        size={15}
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
                                        event
                                    ) =>
                                        updateQuote(
                                            index,
                                            "vendor_name",
                                            event
                                                .target
                                                .value
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
                                        event
                                    ) =>
                                        updateQuote(
                                            index,
                                            "quote_no",
                                            event
                                                .target
                                                .value
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
                                        event
                                    ) =>
                                        updateQuote(
                                            index,
                                            "quote_date",
                                            event
                                                .target
                                                .value
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
                                        event
                                    ) =>
                                        updateQuote(
                                            index,
                                            "currency",
                                            event
                                                .target
                                                .value
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
                                        event
                                    ) =>
                                        updateQuote(
                                            index,
                                            "quoted_amount",
                                            event
                                                .target
                                                .value
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
                                        event
                                    ) =>
                                        updateQuote(
                                            index,
                                            "executive_rating",
                                            event
                                                .target
                                                .value
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
                                        event
                                    ) =>
                                        updateQuote(
                                            index,
                                            "details",
                                            event
                                                .target
                                                .value
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
                ))}

                {/* Add another quote */}
                <button
                    type="button"
                    onClick={addQuote}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                    <Plus size={16} />
                    Add Another Quote
                </button>

                {/* Error */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Success */}
                {message && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
                        {message}
                    </div>
                )}

                {/* Submit */}
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
                            ? "Saving..."
                            : hasForwarded
                                ? "Save Quote(s)"
                                : "Submit"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AssetPurchaseQuoteForm;