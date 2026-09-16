import {
    useEffect,
    useState,
} from "react";

import {
    CheckCircle2,
    Circle,
    Clock3,
    Loader2,
    Package,
} from "lucide-react";

import {
    getAssetPurchaseTracking,
} from "../../api/assetPurchase";

import type {
    AssetPurchaseTracking as AssetPurchaseTrackingData,
} from "../../api/assetPurchase";

interface AssetPurchaseTrackingProps {
    assetId: string;
}

const getStatusIcon = (status: string) => {
    const normalized = status.toLowerCase();

    if (
        normalized === "completed" ||
        normalized === "approved" ||
        normalized === "accepted"
    ) {
        return (
            <CheckCircle2
                size={18}
                className="text-emerald-500"
            />
        );
    }

    if (
        normalized === "in progress" ||
        normalized === "pending"
    ) {
        return (
            <Clock3
                size={18}
                className="text-amber-500"
            />
        );
    }

    return (
        <Circle
            size={18}
            className="text-gray-400"
        />
    );
};

const getStatusTextClass = (status: string) => {
    const normalized = status.toLowerCase();

    if (
        normalized === "completed" ||
        normalized === "approved" ||
        normalized === "accepted"
    ) {
        return "text-emerald-500";
    }

    if (
        normalized === "in progress" ||
        normalized === "pending"
    ) {
        return "text-amber-500";
    }

    return "text-gray-500 dark:text-gray-400";
};

const formatDate = (
    value?: string | null
) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default function AssetPurchaseTracking({
    assetId,
}: AssetPurchaseTrackingProps) {
    const [tracking, setTracking] =
        useState<AssetPurchaseTrackingData | null>(
            null
        );

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        let cancelled = false;

        const loadTracking = async () => {
            if (!assetId) {
                setTracking(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response =
                    await getAssetPurchaseTracking(
                        assetId
                    );

                if (!cancelled) {
                    setTracking(response);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load asset tracking."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadTracking();

        return () => {
            cancelled = true;
        };
    }, [assetId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2
                    size={22}
                    className="animate-spin text-gray-400"
                />

                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    Loading tracking...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {error}
            </div>
        );
    }

    if (!tracking) {
        return (
            <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                No tracking information available.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Overall status */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-800">
                            <Package
                                size={17}
                                className="text-cyan-500"
                            />
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Asset Purchase
                            </p>

                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                {tracking.document.document_no}
                            </p>
                        </div>
                    </div>

                    <span
                        className={`shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold dark:bg-gray-800 ${getStatusTextClass(
                            tracking.status_label
                        )}`}
                    >
                        {tracking.status_label}
                    </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            Current Stage
                        </p>

                        <p className="mt-1 text-xs font-medium text-gray-900 dark:text-white">
                            {tracking.current_stage}
                        </p>
                    </div>

                    <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            Started
                        </p>

                        <p className="mt-1 text-xs font-medium text-gray-900 dark:text-white">
                            {formatDate(
                                tracking.start_date
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Workflow timeline */}
            <div>
                <p className="mb-3 text-xs font-semibold text-gray-900 dark:text-white">
                    Workflow Progress
                </p>

                <div className="space-y-0">
                    {tracking.flow.map(
                        (item, index) => {
                            const isLast =
                                index ===
                                tracking.flow.length -
                                1;

                            return (
                                <div
                                    key={`${item.stage}-${index}`}
                                    className="relative flex gap-3"
                                >
                                    {!isLast && (
                                        <div className="absolute left-[8px] top-5 h-[calc(100%-4px)] w-px bg-gray-200 dark:bg-gray-700" />
                                    )}

                                    <div className="relative z-10 shrink-0 bg-white dark:bg-gray-900">
                                        {getStatusIcon(
                                            item.status
                                        )}
                                    </div>

                                    <div className="min-w-0 pb-5">
                                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                                            {item.stage}
                                        </p>

                                        <p
                                            className={`mt-1 text-[10px] font-medium ${getStatusTextClass(
                                                item.status
                                            )}`}
                                        >
                                            {item.status}
                                        </p>
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>

            {/* Current assignment */}
            {tracking.assigned_to && (
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Currently Assigned To
                    </p>

                    <p className="mt-1 text-xs font-semibold text-gray-900 dark:text-white">
                        {tracking.assigned_to.name}
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                        {tracking.assigned_to.mtype}
                    </p>
                </div>
            )}

            {/* Quote information */}
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        Quotations
                    </span>

                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {tracking.quotation_count}
                    </span>
                </div>

                {tracking.selected_quote && (
                    <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            Selected Quote
                        </p>

                        <p className="mt-1 text-xs font-semibold text-gray-900 dark:text-white">
                            {tracking.selected_quote.vendor_name}
                        </p>

                        <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {
                                    tracking
                                        .selected_quote
                                        .quote_no
                                }
                            </span>

                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                                {tracking.selected_quote.currency ??
                                    "INR"}{" "}
                                {tracking.selected_quote.quoted_amount.toLocaleString(
                                    "en-IN"
                                )}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div>
                    <p className="text-gray-400 dark:text-gray-500">
                        Created
                    </p>

                    <p className="mt-1 font-medium text-gray-700 dark:text-gray-300">
                        {formatDate(
                            tracking.created_date
                        )}
                    </p>
                </div>

                <div>
                    <p className="text-gray-400 dark:text-gray-500">
                        Updated
                    </p>

                    <p className="mt-1 font-medium text-gray-700 dark:text-gray-300">
                        {formatDate(
                            tracking.updated_date
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
