import {
    useEffect,
    useState,
} from "react";

import {
    CalendarDays,
    FileText,
    IndianRupee,
    Loader2,
    Send,
    Store,
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
        response: CreateAssetPurchaseQuoteResponse
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

    const [formData, setFormData] =
        useState<AssetPurchaseQuoteFormData>(
            initialForm
        );

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

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

    const handleChange = (
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

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
        setSuccessMessage("");
    };

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

        if (!documentNo.trim()) {
            setError(
                "Document number is not available for this task."
            );
            return;
        }

        if (!formData.vendor_name.trim()) {
            setError(
                "Please enter vendor name."
            );
            return;
        }

        if (!formData.quote_no.trim()) {
            setError(
                "Please enter quote number."
            );
            return;
        }

        if (!formData.quote_date) {
            setError(
                "Please select quote date."
            );
            return;
        }

        if (!formData.quoted_amount) {
            setError(
                "Please enter quoted amount."
            );
            return;
        }

        const quotedAmount =
            Number(formData.quoted_amount);

        if (
            Number.isNaN(quotedAmount) ||
            quotedAmount < 0
        ) {
            setError(
                "Please enter a valid quoted amount."
            );
            return;
        }

        setIsSubmitting(true);

        try {
            /*
             * 1. Create vendor quote
             */
            const quoteResponse =
                await createAssetPurchaseQuote({
                    document_no:
                        documentNo.trim(),

                    vendor_name:
                        formData.vendor_name.trim(),

                    quote_no:
                        formData.quote_no.trim(),

                    quote_date:
                        formData.quote_date,

                    quoted_amount:
                        quotedAmount,

                    currency:
                        formData.currency,

                    quote_data: {
                        additionalProp1:
                            formData.quote_details.trim()
                                ? {
                                    details:
                                        formData.quote_details.trim(),
                                }
                                : {},
                    },
                });

            /*
             * 2. Forward current workflow task
             */
            await forwardAssetPurchaseTask(
                taskId
            );

            /*
             * 3. Show success
             */
            setSuccessMessage(
                "Quote submitted and task forwarded successfully."
            );

            /*
             * 4. Notify parent
             */
            onSuccess?.(quoteResponse);

            /*
             * 5. Reset quote form
             *
             * Do NOT reset documentNo because it
             * belongs to the selected task.
             */
            setFormData(initialForm);
        } catch (err: unknown) {
            console.error(
                "Asset purchase quote forwarding error:",
                err
            );

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(
                    "Failed to submit and forward the quote."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData(initialForm);
        setError("");
        setSuccessMessage("");
    };

    return (
        <div className="w-full">
            {/* Header */}

            <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
                {/* Section Header */}

                <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Store
                            size={18}
                            className="text-gray-500"
                        />

                        <h2 className="font-medium text-gray-900 dark:text-white">
                            Quote Details
                        </h2>
                    </div>
                </div>

                <div className="space-y-6 p-6">
                    {/* Document Number */}

                    <div>
                        <label
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
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

                    {/* Vendor + Quote Number */}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="vendor_name"
                                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Vendor Name

                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="vendor_name"
                                name="vendor_name"
                                type="text"
                                value={
                                    formData.vendor_name
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. Dell Technologies"
                                disabled={
                                    isSubmitting
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="quote_no"
                                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Quote Number

                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="quote_no"
                                name="quote_no"
                                type="text"
                                value={
                                    formData.quote_no
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. QT-2026-001"
                                disabled={
                                    isSubmitting
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Quote Date + Currency */}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="quote_date"
                                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Quote Date

                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <div className="relative">
                                <CalendarDays
                                    size={17}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    id="quote_date"
                                    name="quote_date"
                                    type="date"
                                    value={
                                        formData.quote_date
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="currency"
                                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Currency

                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <select
                                id="currency"
                                name="currency"
                                value={
                                    formData.currency
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    isSubmitting
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
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
                            htmlFor="quoted_amount"
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Quoted Amount

                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <div className="relative">
                            <IndianRupee
                                size={17}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                id="quoted_amount"
                                name="quoted_amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                    formData.quoted_amount
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Enter quoted amount"
                                disabled={
                                    isSubmitting
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Quote Details */}

                    <div>
                        <label
                            htmlFor="quote_details"
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Quote Details
                        </label>

                        <textarea
                            id="quote_details"
                            name="quote_details"
                            rows={4}
                            value={
                                formData.quote_details
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Enter additional quote details, terms, delivery information, etc."
                            disabled={
                                isSubmitting
                            }
                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                    </div>

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
                            <Send size={16} />
                        )}

                        {isSubmitting
                            ? "Forwarding..."
                            : "Forward"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AssetPurchaseQuoteForm;