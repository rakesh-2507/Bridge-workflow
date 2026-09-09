import {
    useEffect,
    useState,
} from "react";

import {
    CalendarDays,
    FileText,
    IndianRupee,
    Loader2,
    Plus,
    Send,
    Trash2,
} from "lucide-react";

import {
    createAssetPurchaseQuote,
    forwardAssetPurchaseTask,
} from "../../api/assetPurchaseQuote";

import { getTask } from "../../api/tasks";

import type {
    CreateAssetPurchaseQuoteResponse,
} from "../../types/assetPurchaseQuote";

interface AssetPurchaseQuoteFormData {
    vendor_name: string;
    quote_no: string;
    quote_date: string;
    quoted_amount: string;
    currency: string;
    quote_details: string;
}

interface AssetPurchaseQuoteFormProps {
    taskId: number;

    onSuccess?: (
        responses: CreateAssetPurchaseQuoteResponse[]
    ) => void;
}

const initialForm: AssetPurchaseQuoteFormData = {
    vendor_name: "",
    quote_no: "",
    quote_date: "",
    quoted_amount: "",
    currency: "INR",
    quote_details: "",
};

function AssetPurchaseQuoteForm({
    taskId,
    onSuccess,
}: AssetPurchaseQuoteFormProps) {
    const [documentNo, setDocumentNo] =
        useState("");

    const [isLoadingTask, setIsLoadingTask] =
        useState(true);

    const [quotes, setQuotes] = useState<
        AssetPurchaseQuoteFormData[]
    >([
        { ...initialForm },
    ]);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    /*
     * Load task details
     */
    useEffect(() => {
        let cancelled = false;

        const loadTaskDetails = async () => {
            try {
                setIsLoadingTask(true);
                setError("");
                setDocumentNo("");

                const response =
                    await getTask(taskId);

                if (cancelled) {
                    return;
                }

                setDocumentNo(
                    response.data.document_no
                );
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load task details."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingTask(false);
                }
            }
        };

        void loadTaskDetails();

        return () => {
            cancelled = true;
        };
    }, [taskId]);

    /*
     * Update one quote
     */
    const handleQuoteChange = (
        index: number,
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement
        >
    ) => {
        const {
            name,
            value,
        } = e.target;

        setQuotes((previous) =>
            previous.map((quote, quoteIndex) =>
                quoteIndex === index
                    ? {
                        ...quote,
                        [name]: value,
                    }
                    : quote
            )
        );

        setError("");
        setSuccessMessage("");
    };

    /*
     * Add another quote
     */
    const handleAddQuote = () => {
        setQuotes((previous) => [
            ...previous,
            { ...initialForm },
        ]);

        setError("");
        setSuccessMessage("");
    };

    /*
     * Remove quote
     */
    const handleRemoveQuote = (
        index: number
    ) => {
        /*
         * Always keep at least one quote
         */
        if (quotes.length === 1) {
            return;
        }

        setQuotes((previous) =>
            previous.filter(
                (_, quoteIndex) =>
                    quoteIndex !== index
            )
        );

        setError("");
        setSuccessMessage("");
    };

    /*
     * Validate all quotes
     */
    const validateQuotes = (): boolean => {
        if (!documentNo.trim()) {
            setError(
                "Document number is not available for this task."
            );

            return false;
        }

        if (quotes.length === 0) {
            setError(
                "Please add at least one quote."
            );

            return false;
        }

        for (
            let index = 0;
            index < quotes.length;
            index++
        ) {
            const quote = quotes[index];

            const quoteNumber =
                index + 1;

            if (!quote.vendor_name.trim()) {
                setError(
                    `Please enter vendor name for Quote ${quoteNumber}.`
                );

                return false;
            }

            if (!quote.quote_no.trim()) {
                setError(
                    `Please enter quote number for Quote ${quoteNumber}.`
                );

                return false;
            }

            if (!quote.quote_date) {
                setError(
                    `Please select quote date for Quote ${quoteNumber}.`
                );

                return false;
            }

            if (!quote.quoted_amount) {
                setError(
                    `Please enter quoted amount for Quote ${quoteNumber}.`
                );

                return false;
            }

            const quotedAmount =
                Number(
                    quote.quoted_amount
                );

            if (
                Number.isNaN(
                    quotedAmount
                ) ||
                quotedAmount < 0
            ) {
                setError(
                    `Please enter a valid quoted amount for Quote ${quoteNumber}.`
                );

                return false;
            }
        }

        return true;
    };

    /*
     * Submit all quotes
     */
    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setError("");
        setSuccessMessage("");

        if (isLoadingTask) {
            setError(
                "Please wait while the task details are loading."
            );

            return;
        }

        if (!validateQuotes()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const quoteResponses: CreateAssetPurchaseQuoteResponse[] =
                [];

            /*
             * Create each quote separately.
             *
             * The current backend API accepts
             * one quote per POST request.
             */
            for (
                let index = 0;
                index < quotes.length;
                index++
            ) {
                const quote =
                    quotes[index];

                const quotedAmount =
                    Number(
                        quote.quoted_amount
                    );

                const quoteResponse =
                    await createAssetPurchaseQuote({
                        document_no:
                            documentNo.trim(),

                        vendor_name:
                            quote.vendor_name.trim(),

                        quote_no:
                            quote.quote_no.trim(),

                        quote_date:
                            quote.quote_date,

                        quoted_amount:
                            quotedAmount,

                        currency:
                            quote.currency,

                        quote_data: {
                            additionalProp1:
                                quote.quote_details.trim()
                                    ? {
                                        details:
                                            quote.quote_details.trim(),
                                    }
                                    : {},
                        },
                    });

                quoteResponses.push(
                    quoteResponse
                );
            }

            /*
             * Forward the workflow task ONLY ONCE
             * after every quote has been created.
             */
            await forwardAssetPurchaseTask(
                taskId
            );

            /*
             * Success
             */
            setSuccessMessage(
                `${quoteResponses.length} quote${quoteResponses.length > 1 ? "s" : ""} submitted and task forwarded successfully.`
            );

            /*
             * Notify parent
             */
            onSuccess?.(
                quoteResponses
            );

            /*
             * Reset quotes after successful
             * submission.
             */
            setQuotes([
                { ...initialForm },
            ]);
        } catch (err: unknown) {
            console.error(
                "Asset purchase quote submission error:",
                err
            );

            if (err instanceof Error) {
                setError(
                    err.message
                );
            } else {
                setError(
                    "Failed to submit quotes and forward the task."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    /*
     * Reset form
     */
    const handleReset = () => {
        setQuotes([
            { ...initialForm },
        ]);

        setError("");
        setSuccessMessage("");
    };

    return (
        <div className="w-full">
            <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
                <div className="space-y-6 p-6">

                    {/* Document Number */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Asset Purchase Request
                        </label>

                        <div className="flex min-h-[44px] items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900">
                            <FileText
                                size={17}
                                className="shrink-0 text-gray-400"
                            />

                            <div className="min-w-0 flex-1">
                                {isLoadingTask ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2
                                            size={15}
                                            className="animate-spin text-gray-400"
                                        />

                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Loading request...
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Document Number
                                        </p>

                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {documentNo ||
                                                "Not available"}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quotes */}

                    <div className="space-y-5">

                        {quotes.map(
                            (
                                quote,
                                index
                            ) => (
                                <div
                                    key={index}
                                    className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                                >

                                    {/* Quote Header */}

                                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Quote{" "}
                                                {index + 1}
                                            </h3>

                                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                Enter vendor quotation details
                                            </p>
                                        </div>

                                        {quotes.length >
                                            1 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveQuote(
                                                        index
                                                    )
                                                }
                                                disabled={
                                                    isSubmitting
                                                }
                                                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
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

                                    <div className="space-y-5 p-5">

                                        {/* Vendor + Quote Number */}

                                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                            <div>
                                                <label
                                                    htmlFor={`vendor_name_${index}`}
                                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    Vendor Name
                                                    <span className="ml-1 text-red-500">
                                                        *
                                                    </span>
                                                </label>

                                                <input
                                                    id={`vendor_name_${index}`}
                                                    name="vendor_name"
                                                    type="text"
                                                    value={
                                                        quote.vendor_name
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        handleQuoteChange(
                                                            index,
                                                            e
                                                        )
                                                    }
                                                    placeholder="e.g. Dell Technologies"
                                                    disabled={
                                                        isSubmitting
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor={`quote_no_${index}`}
                                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    Quote Number
                                                    <span className="ml-1 text-red-500">
                                                        *
                                                    </span>
                                                </label>

                                                <input
                                                    id={`quote_no_${index}`}
                                                    name="quote_no"
                                                    type="text"
                                                    value={
                                                        quote.quote_no
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        handleQuoteChange(
                                                            index,
                                                            e
                                                        )
                                                    }
                                                    placeholder="e.g. QT-2026-001"
                                                    disabled={
                                                        isSubmitting
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                />
                                            </div>

                                        </div>

                                        {/* Date + Currency */}

                                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                            <div>
                                                <label
                                                    htmlFor={`quote_date_${index}`}
                                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    Quote Date
                                                    <span className="ml-1 text-red-500">
                                                        *
                                                    </span>
                                                </label>

                                                <div className="relative">
                                                    <CalendarDays
                                                        size={
                                                            17
                                                        }
                                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                    />

                                                    <input
                                                        id={`quote_date_${index}`}
                                                        name="quote_date"
                                                        type="date"
                                                        value={
                                                            quote.quote_date
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleQuoteChange(
                                                                index,
                                                                e
                                                            )
                                                        }
                                                        disabled={
                                                            isSubmitting
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor={`currency_${index}`}
                                                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    Currency
                                                    <span className="ml-1 text-red-500">
                                                        *
                                                    </span>
                                                </label>

                                                <select
                                                    id={`currency_${index}`}
                                                    name="currency"
                                                    value={
                                                        quote.currency
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        handleQuoteChange(
                                                            index,
                                                            e
                                                        )
                                                    }
                                                    disabled={
                                                        isSubmitting
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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

                                        </div>

                                        {/* Amount */}

                                        <div>
                                            <label
                                                htmlFor={`quoted_amount_${index}`}
                                                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                Quoted Amount
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <div className="relative">
                                                <IndianRupee
                                                    size={
                                                        17
                                                    }
                                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                />

                                                <input
                                                    id={`quoted_amount_${index}`}
                                                    name="quoted_amount"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        quote.quoted_amount
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        handleQuoteChange(
                                                            index,
                                                            e
                                                        )
                                                    }
                                                    placeholder="Enter quoted amount"
                                                    disabled={
                                                        isSubmitting
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        {/* Quote Details */}

                                        <div>
                                            <label
                                                htmlFor={`quote_details_${index}`}
                                                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                Quote Details
                                            </label>

                                            <textarea
                                                id={`quote_details_${index}`}
                                                name="quote_details"
                                                rows={4}
                                                value={
                                                    quote.quote_details
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleQuoteChange(
                                                        index,
                                                        e
                                                    )
                                                }
                                                placeholder="Enter additional quote details, terms, delivery information, etc."
                                                disabled={
                                                    isSubmitting
                                                }
                                                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                            />
                                        </div>

                                    </div>
                                </div>
                            )
                        )}

                    </div>

                    {/* Add Quote */}

                    <button
                        type="button"
                        onClick={
                            handleAddQuote
                        }
                        disabled={
                            isSubmitting
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                    >
                        <Plus
                            size={17}
                        />

                        Add Another Quote
                    </button>

                    {/* Error */}

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Success */}

                    {successMessage && (
                        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400">
                            {successMessage}
                        </div>
                    )}
                </div>

                {/* Actions */}

                <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">

                    <button
                        type="button"
                        onClick={
                            handleReset
                        }
                        disabled={
                            isSubmitting
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Reset
                    </button>

                    <button
                        type="submit"
                        disabled={
                            isSubmitting ||
                            isLoadingTask ||
                            !documentNo
                        }
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2
                                size={16}
                                className="animate-spin"
                            />
                        ) : (
                            <Send
                                size={16}
                            />
                        )}

                        {isSubmitting
                            ? "Submitting..."
                            : "Submit & Forward All"}
                    </button>

                </div>
            </form>
        </div>
    );
}

export default AssetPurchaseQuoteForm;