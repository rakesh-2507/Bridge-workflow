import { useState } from "react";
import {
    CalendarDays,
    Package,
    Send,
} from "lucide-react";

import { createAssetPurchaseRequest } from "../../api/assetPurchase";

interface FormData {
    document_no: string;
    asset: string;
    asset_type: string;
    asset_description: string;
    required_date: string;
    purchase_reason: string;
}

interface Props {
    onSuccess?: (
        response: Awaited<
            ReturnType<typeof createAssetPurchaseRequest>
        >
    ) => void;
}

const initialForm: FormData = {
    document_no: "",
    asset: "",
    asset_type: "",
    asset_description: "",
    required_date: "",
    purchase_reason: "",
};

function AssetPurchaseRequestForm({ onSuccess }: Props) {
    const [formData, setFormData] = useState<FormData>(initialForm);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
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

        if (!formData.document_no.trim()) {
            setError("Please enter document number.");
            return;
        }

        if (!formData.asset.trim()) {
            setError("Please enter asset name.");
            return;
        }

        if (!formData.asset_type.trim()) {
            setError("Please enter asset type.");
            return;
        }

        if (!formData.asset_description.trim()) {
            setError("Please enter asset description.");
            return;
        }

        if (!formData.required_date) {
            setError("Please select required date.");
            return;
        }

        if (!formData.purchase_reason.trim()) {
            setError("Please enter purchase reason.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await createAssetPurchaseRequest({
                document_no: formData.document_no.trim(),

                request_data: {
                    asset: formData.asset.trim(),
                    asset_type: formData.asset_type.trim(),
                    asset_description:
                        formData.asset_description.trim(),
                    required_date: formData.required_date,
                    purchase_reason:
                        formData.purchase_reason.trim(),
                },
            });

            setSuccessMessage(
                response.message ||
                "Asset Purchase Request created successfully."
            );

            onSuccess?.(response);

            setFormData(initialForm);
        } catch (err: unknown) {
            console.error("Asset purchase request error:", err);

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to create asset purchase request.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Package
                            size={20}
                            className="text-blue-600 dark:text-blue-400"
                        />
                    </div>

                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Asset Purchase Request
                        </h1>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Create a new asset purchase request
                        </p>
                    </div>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >

                <div className="space-y-6 p-6">

                    {/* Document Number */}

                    <div>
                        <label
                            htmlFor="document_no"
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Document Number
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <input
                            id="document_no"
                            name="document_no"
                            type="text"
                            value={formData.document_no}
                            onChange={handleChange}
                            placeholder="e.g. Bridge-001"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Asset + Asset Type */}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        <div>
                            <label
                                htmlFor="asset"
                                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Asset
                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="asset"
                                name="asset"
                                type="text"
                                value={formData.asset}
                                onChange={handleChange}
                                placeholder="e.g. Dell Desktop 1500 Inspirion"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="asset_type"
                                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Asset Type
                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="asset_type"
                                name="asset_type"
                                type="text"
                                value={formData.asset_type}
                                onChange={handleChange}
                                placeholder="e.g. Computer"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>

                    </div>

                    {/* Description */}

                    <div>
                        <label
                            htmlFor="asset_description"
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Asset Description
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <textarea
                            id="asset_description"
                            name="asset_description"
                            rows={4}
                            value={formData.asset_description}
                            onChange={handleChange}
                            placeholder="Enter detailed description of the asset"
                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Required Date */}

                    <div>
                        <label
                            htmlFor="required_date"
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Required Date
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
                                id="required_date"
                                name="required_date"
                                type="date"
                                value={formData.required_date}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Purchase Reason */}

                    <div>
                        <label
                            htmlFor="purchase_reason"
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Purchase Reason
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <textarea
                            id="purchase_reason"
                            name="purchase_reason"
                            rows={3}
                            value={formData.purchase_reason}
                            onChange={handleChange}
                            placeholder="e.g. Office Requirement"
                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
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
                        onClick={() => {
                            setFormData(initialForm);
                            setError("");
                            setSuccessMessage("");
                        }}
                        disabled={isSubmitting}
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Reset
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Send size={16} />

                        {isSubmitting
                            ? "Creating..."
                            : "Create Request"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AssetPurchaseRequestForm;