import { useState } from "react";

import {
    CalendarDays,
    Loader2,
    Package,
    Send,
} from "lucide-react";

import {
    createDocument,
} from "../../api/documents";

import type {
    AssetPurchaseRequest,
} from "../../types/document";

export interface AssetRequestFormProps {
    formData: AssetPurchaseRequest;
    onDataChange: (
        data: AssetPurchaseRequest
    ) => void;
    onCreated: (documentNo: string) => void;
}

function AssetRequestForm({
    formData,
    onDataChange,
    onCreated,
}: AssetRequestFormProps) {

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    function handleChange(
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) {
        const {
            name,
            value,
        } = e.target;

        onDataChange({
            ...formData,
            [name]: value,
        });

        // Clear error when user starts correcting the form
        if (errorMessage) {
            setErrorMessage("");
        }
    }

    async function handleSubmit(
        e: React.FormEvent
    ) {
        e.preventDefault();

        setErrorMessage("");

        if (!formData.asset.trim()) {
            setErrorMessage("Please enter the asset.");
            return;
        }

        if (!formData.asset_type.trim()) {
            setErrorMessage("Please enter the asset type.");
            return;
        }

        if (!formData.asset_description.trim()) {
            setErrorMessage(
                "Please enter the asset description."
            );
            return;
        }

        if (!formData.required_date) {
            setErrorMessage(
                "Please select the required date."
            );
            return;
        }

        if (!formData.purchase_reason.trim()) {
            setErrorMessage(
                "Please enter the purchase reason."
            );
            return;
        }

        try {
            setIsSubmitting(true);

            /*
             * Temporary document number generation.
             *
             * If the backend generates the document number,
             * replace this with the backend-generated number.
             */
            const documentNo =
                `APR-${Date.now()}`;

            const payload = {
                document_type:
                    "AssetPurchaseRequest",

                document_no:
                    documentNo,

                document_json: {
                    asset:
                        formData.asset.trim(),

                    asset_type:
                        formData.asset_type.trim(),

                    asset_description:
                        formData.asset_description.trim(),

                    required_date:
                        formData.required_date,

                    purchase_reason:
                        formData.purchase_reason.trim(),
                },
            };

            const response =
                await createDocument(payload);

            /*
             * Prefer the document number returned
             * by the backend.
             */
            const createdDocumentNo =
                response?.data?.document_no ||
                documentNo;

            onCreated(createdDocumentNo);

        } catch (error) {

            console.error(
                "Failed to create asset request:",
                error
            );

            setErrorMessage(
                "Failed to create asset purchase request. Please try again."
            );

        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >

            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">

                <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Package size={20} />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Asset Purchase Request
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Enter the details of the asset you want to request.
                        </p>
                    </div>

                </div>

            </div>

            {/* Form */}
            <div className="p-6">

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    {/* Asset */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Asset
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <input
                            type="text"
                            name="asset"
                            value={formData.asset}
                            onChange={handleChange}
                            placeholder="e.g. Laptop"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    {/* Asset Type */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Asset Type
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <input
                            type="text"
                            name="asset_type"
                            value={formData.asset_type}
                            onChange={handleChange}
                            placeholder="e.g. Computer"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    {/* Required Date */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Required Date
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <div className="relative">

                            <CalendarDays
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="date"
                                name="required_date"
                                value={
                                    formData.required_date
                                }
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />

                        </div>
                    </div>

                </div>

                {/* Description */}
                <div className="mt-5">

                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Asset Description
                        <span className="ml-1 text-red-500">
                            *
                        </span>
                    </label>

                    <textarea
                        name="asset_description"
                        value={
                            formData.asset_description
                        }
                        onChange={handleChange}
                        rows={4}
                        placeholder="Describe the asset you require..."
                        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />

                </div>

                {/* Purchase Reason */}
                <div className="mt-5">

                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Purchase Reason
                        <span className="ml-1 text-red-500">
                            *
                        </span>
                    </label>

                    <textarea
                        name="purchase_reason"
                        value={
                            formData.purchase_reason
                        }
                        onChange={handleChange}
                        rows={4}
                        placeholder="Explain why this asset is required..."
                        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />

                </div>

                {/* Error */}
                {errorMessage && (
                    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                        {errorMessage}
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-gray-200 px-6 py-4 dark:border-gray-800">

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                    {isSubmitting ? (
                        <>
                            <Loader2
                                size={16}
                                className="animate-spin"
                            />

                            Creating Request...
                        </>
                    ) : (
                        <>
                            <Send size={16} />

                            Continue
                        </>
                    )}

                </button>

            </div>

        </form>
    );
}

export default AssetRequestForm;