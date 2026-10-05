import { useEffect, useState } from "react";

import {
    Activity,
    CheckCircle2,
    Clock3,
    FileText,
    Loader2,
    RefreshCw,
    XCircle,
} from "lucide-react";

import {
    getDashboardMetrics,
    type DashboardData,
    type RecentDashboardRequest,
} from "../api/dashboard";

/* =========================================================
 * Helpers
 * ========================================================= */

function getStatusLabel(status: string): string {
    switch (status.toLowerCase()) {
        case "in_progress":
            return "In Progress";

        case "approved":
            return "Approved";

        case "rejected":
            return "Rejected";

        case "pending":
            return "Pending";

        case "completed":
            return "Completed";

        default:
            return status
                .replace(/_/g, " ")
                .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }
}

function getStatusClasses(status: string): string {
    switch (status.toLowerCase()) {
        case "approved":
        case "completed":
            return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

        case "rejected":
            return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

        case "pending":
            return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";

        case "in_progress":
            return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

        default:
            return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
}

function getProgressBarWidth(percentage: number): string {
    const safePercentage = Math.min(100, Math.max(0, percentage));

    return `${safePercentage}%`;
}

/* =========================================================
 * Metric Card
 * ========================================================= */

interface MetricCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    description: string;
    iconClasses: string;
}

function MetricCard({
    title,
    value,
    icon,
    description,
    iconClasses,
}: MetricCardProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconClasses}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

/* =========================================================
 * Recent Request
 * ========================================================= */

interface RecentRequestCardProps {
    request: RecentDashboardRequest;
}

function RecentRequestCard({
    request,
}: RecentRequestCardProps) {
    const percentage = request.progress?.percentage ?? 0;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                <div className="min-w-0">

                    <div className="flex items-center gap-2">
                        <FileText
                            size={18}
                            className="shrink-0 text-cyan-600 dark:text-cyan-400"
                        />

                        <span className="font-semibold text-gray-900 dark:text-white">
                            {request.task_id}
                        </span>
                    </div>

                    <h3 className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {request.config_name}
                    </h3>

                </div>

                <span
                    className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                        request.status
                    )}`}
                >
                    {getStatusLabel(request.status)}
                </span>

            </div>

            {/* Workflow information */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Active Level
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                        {request.active?.label ?? "Workflow Completed"}
                    </p>
                </div>

                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Assigned To
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                        {request.active?.assign_to ?? "—"}
                    </p>
                </div>

            </div>

            {/* Progress */}
            <div className="mt-5">

                <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Workflow Progress
                    </span>

                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {percentage}%
                    </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                        className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                        style={{
                            width: getProgressBarWidth(percentage),
                        }}
                    />
                </div>

                <div className="mt-2 flex justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>
                        {request.progress?.completed_levels ?? 0} completed
                    </span>

                    <span>
                        {request.progress?.total_levels ?? 0} total levels
                    </span>
                </div>

            </div>

            {/* Mapping */}
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">

                    <span>
                        <strong className="font-medium text-gray-600 dark:text-gray-300">
                            Type:
                        </strong>{" "}
                        {request.config_type}
                    </span>

                    <span>
                        <strong className="font-medium text-gray-600 dark:text-gray-300">
                            Mapping:
                        </strong>{" "}
                        {request.mapping_type}
                    </span>

                    <span>
                        <strong className="font-medium text-gray-600 dark:text-gray-300">
                            Value:
                        </strong>{" "}
                        {request.mapping_value}
                    </span>

                </div>

            </div>

        </div>
    );
}

/* =========================================================
 * Dashboard
 * ========================================================= */

export default function Dashboard() {

    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    /* =====================================================
     * Load Dashboard
     * ===================================================== */

    const loadDashboard = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const data = await getDashboardMetrics();

            console.log("Dashboard API data:", data);

            setDashboard(data);
        } catch (err) {
            console.error(
                "Failed to load dashboard metrics:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load dashboard metrics."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const fetchDashboard = async () => {
            try {
                const data = await getDashboardMetrics();

                if (!cancelled) {
                    setDashboard(data);
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        "Failed to load dashboard metrics:",
                        err
                    );

                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load dashboard metrics."
                    );

                    setLoading(false);
                }
            }
        };

        void fetchDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    /* =====================================================
     * Loading
     * ===================================================== */

    if (loading) {

        return (
            <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">

                <div className="flex flex-col items-center gap-3">

                    <Loader2
                        size={32}
                        className="animate-spin text-cyan-600 dark:text-cyan-400"
                    />

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Loading dashboard...
                    </p>

                </div>

            </div>
        );
    }

    /* =====================================================
     * Error
     * ===================================================== */

    if (error) {

        return (
            <div className="p-6">

                <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">

                    <div className="flex items-start gap-3">

                        <XCircle
                            size={22}
                            className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                        />

                        <div className="flex-1">

                            <h2 className="font-semibold text-red-800 dark:text-red-300">
                                Unable to load dashboard
                            </h2>

                            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => void loadDashboard()}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        );
    }

    /* =====================================================
     * Default Data
     * ===================================================== */

    const metrics = dashboard?.metrics ?? {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
    };

    const recentRequests =
        dashboard?.recent_requests ?? [];

    /* =====================================================
     * Page
     * ===================================================== */

    return (
        <div className="h-[calc(96vh-64px)] overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-hide">
            <div className="mx-auto max-w-7xl">

                {/* =================================================
                 * Page Header
                 * ================================================= */}

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">

                                <Activity
                                    size={21}
                                    className="text-cyan-600 dark:text-cyan-400"
                                />

                            </div>

                            <div>

                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Dashboard
                                </h1>

                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                    Overview of your workflow requests
                                </p>

                            </div>

                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={() => void loadDashboard(true)}
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    >

                        <RefreshCw
                            size={16}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}

                    </button>

                </div>

                {/* =================================================
                 * Metrics
                 * ================================================= */}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <MetricCard
                        title="Total Requests"
                        value={metrics.total}
                        description="All workflow requests"
                        icon={
                            <FileText
                                size={22}
                                className="text-cyan-600 dark:text-cyan-400"
                            />
                        }
                        iconClasses="bg-cyan-100 dark:bg-cyan-900/30"
                    />

                    <MetricCard
                        title="Pending"
                        value={metrics.pending}
                        description="Requests in progress"
                        icon={
                            <Clock3
                                size={22}
                                className="text-yellow-600 dark:text-yellow-400"
                            />
                        }
                        iconClasses="bg-yellow-100 dark:bg-yellow-900/30"
                    />

                    <MetricCard
                        title="Approved"
                        value={metrics.approved}
                        description="Successfully approved"
                        icon={
                            <CheckCircle2
                                size={22}
                                className="text-green-600 dark:text-green-400"
                            />
                        }
                        iconClasses="bg-green-100 dark:bg-green-900/30"
                    />

                    <MetricCard
                        title="Rejected"
                        value={metrics.rejected}
                        description="Rejected requests"
                        icon={
                            <XCircle
                                size={22}
                                className="text-red-600 dark:text-red-400"
                            />
                        }
                        iconClasses="bg-red-100 dark:bg-red-900/30"
                    />

                </div>

                {/* =================================================
                 * Recent Requests
                 * ================================================= */}

                <div className="mt-8">

                    <div className="mb-4 flex items-center justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Recent Requests
                            </h2>

                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Latest workflow requests assigned to you
                            </p>

                        </div>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">

                            {recentRequests.length}{" "}

                            {recentRequests.length === 1
                                ? "Request"
                                : "Requests"}

                        </span>

                    </div>

                    {recentRequests.length === 0 ? (

                        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">

                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">

                                <FileText
                                    size={22}
                                    className="text-gray-400 dark:text-gray-500"
                                />

                            </div>

                            <h3 className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                No recent requests
                            </h3>

                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                You don't have any workflow requests yet.
                            </p>

                        </div>

                    ) : (

                        <div className="grid gap-4">

                            {recentRequests.map(
                                (request) => (
                                    <RecentRequestCard
                                        key={request.task_id}
                                        request={request}
                                    />
                                )
                            )}

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}
