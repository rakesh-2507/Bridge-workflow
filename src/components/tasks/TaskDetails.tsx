import { useEffect, useState } from "react";

import {
    CalendarDays,
    Eye,
    FileText,
    Loader2,
    Pencil,
    Trash2,
    User,
} from "lucide-react";

import {
    approveTask,
    rejectTask,
    approveAssetPurchaseTask,
    rejectAssetPurchaseTask,
    backwardAssetPurchaseTask,
    deleteTask,
} from "../../api/tasks";

import { getAssetPurchaseQuotes } from "../../api/assetPurchaseQuote";

import type { Task } from "../../types/task";

import type {
    AssetPurchaseQuote,
} from "../../types/assetPurchaseQuote";

import TaskStatus from "./TaskStatus";

interface TaskDetailsProps {
    task: Task | null;
    onEdit: (task: Task) => void;
    onDeleted: (taskId: number) => void;
}

function TaskDetails({
    task,
    onEdit,
    onDeleted,
}: TaskDetailsProps) {
    // ==================================================
    // Delete State
    // ==================================================

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    const [deleteError, setDeleteError] =
        useState("");

    // ==================================================
    // Action State
    // ==================================================

    const [actionLoading, setActionLoading] =
        useState<
            "approve" | "reject" | "backward" | null
        >(null);

    const [actionMessage, setActionMessage] =
        useState("");

    const [actionError, setActionError] =
        useState("");

    // ==================================================
    // Logged In User
    // ==================================================

    const storedUser =
        localStorage.getItem("login_user");

    let loggedInUser: {
        uid?: number;
        mtype?: string;
    } | null = null;

    if (storedUser) {
        try {
            loggedInUser = JSON.parse(storedUser);
        } catch {
            loggedInUser = null;
        }
    }

    const isSeniorAssetManager =
        loggedInUser?.mtype ===
        "Assets Manager-Senior";

    const isAssetExecutive =
        loggedInUser?.mtype === "Assets-Executive";

    // ==================================================
    // Asset Purchase Quotations
    // ==================================================

    const [quotes, setQuotes] = useState<
        AssetPurchaseQuote[]
    >([]);

    const [quotesLoading, setQuotesLoading] =
        useState(false);

    const [quotesError, setQuotesError] =
        useState("");

    useEffect(() => {
        /*
         * Quotations are only required for
         * Assets Manager-Senior.
         *
         * Do not call setState() in the early return.
         * This avoids the React cascading-render warning.
         */
        if (
            !task ||
            !isSeniorAssetManager ||
            !task.document_no
        ) {
            return;
        }

        let cancelled = false;

        const loadQuotes = async () => {
            try {
                const response =
                    await getAssetPurchaseQuotes(
                        task.document_no!
                    );

                if (cancelled) {
                    return;
                }

                setQuotes(response.data ?? []);
                setQuotesError("");
                setQuotesLoading(false);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "Failed to load asset purchase quotes:",
                    err
                );

                setQuotes([]);
                setQuotesError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load quotations."
                );
                setQuotesLoading(false);
            }
        };

        loadQuotes();

        return () => {
            cancelled = true;
        };
    }, [
        task?.task_id,
        task?.document_no,
        isSeniorAssetManager,
    ]);

    /*
     * Loading is derived from whether a senior manager
     * has a task with a document number but quotes have
     * not yet been received.
     *
     * The actual fetch state is handled by the effect.
     */
    const shouldLoadQuotes =
        !!task &&
        isSeniorAssetManager &&
        !!task.document_no;

    // ==================================================
    // No Task Selected
    // ==================================================

    if (!task) {
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center border-l border-gray-200 bg-gray-50 px-6 text-center dark:border-gray-800 dark:bg-gray-950">
                <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 shadow-sm dark:bg-gray-900">
                        <Pencil
                            size={20}
                            className="text-gray-400"
                        />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Select a task
                    </h3>

                    <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Select a task from the list to view
                        its details.
                    </p>
                </div>
            </div>
        );
    }

    // ==================================================
    // Task Status
    //
    // 0 = In Progress
    // 1 = Accepted
    // 2 = Rejected
    // ==================================================

    const canTakeAction = task.status === 0;

    // ==================================================
    // Delete Task
    // ==================================================

    const handleDelete = async () => {
        if (deleteLoading) {
            return;
        }

        setDeleteLoading(true);
        setDeleteError("");

        try {
            await deleteTask(task.task_id);

            setShowDeleteConfirm(false);

            onDeleted(task.task_id);
        } catch (err) {
            setDeleteError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete task."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    // ==================================================
    // Generic Task - Approve
    // ==================================================

    const handleApprove = async () => {
        if (
            actionLoading !== null ||
            !canTakeAction
        ) {
            return;
        }

        setActionLoading("approve");
        setActionMessage("");
        setActionError("");

        try {
            const response = await approveTask(
                task.task_id
            );

            setActionMessage(
                response ||
                    "Task approved successfully."
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Failed to approve task."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // ==================================================
    // Generic Task - Reject
    // ==================================================

    const handleReject = async () => {
        if (
            actionLoading !== null ||
            !canTakeAction
        ) {
            return;
        }

        setActionLoading("reject");
        setActionMessage("");
        setActionError("");

        try {
            const response = await rejectTask(
                task.task_id
            );

            setActionMessage(
                response ||
                    "Task rejected successfully."
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Failed to reject task."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // ==================================================
    // Asset Purchase - Approve
    // ==================================================

    const handleAssetPurchaseApprove = async () => {
        if (
            actionLoading !== null ||
            !canTakeAction
        ) {
            return;
        }

        setActionLoading("approve");
        setActionMessage("");
        setActionError("");

        try {
            const response =
                await approveAssetPurchaseTask(
                    task.task_id
                );

            setActionMessage(
                response ||
                    "Task approved successfully."
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Failed to approve task."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // ==================================================
    // Asset Purchase - Reject
    // ==================================================

    const handleAssetPurchaseReject = async () => {
        if (
            actionLoading !== null ||
            !canTakeAction
        ) {
            return;
        }

        setActionLoading("reject");
        setActionMessage("");
        setActionError("");

        try {
            const response =
                await rejectAssetPurchaseTask(
                    task.task_id
                );

            setActionMessage(
                response ||
                    "Task rejected successfully."
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Failed to reject task."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // ==================================================
    // Asset Purchase - Backward
    // ==================================================

    const handleBackward = async () => {
        if (
            actionLoading !== null ||
            !canTakeAction
        ) {
            return;
        }

        setActionLoading("backward");
        setActionMessage("");
        setActionError("");

        try {
            const response =
                await backwardAssetPurchaseTask(
                    task.task_id
                );

            setActionMessage(
                response ||
                    "Task moved backward successfully."
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Failed to move task backward."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // ==================================================
    // Render
    // ==================================================

    return (
        <div className="flex min-h-0 flex-1 flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

            {/* ==================================================
                Header
            ================================================== */}

            <div className="shrink-0 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">

                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {task.task_type ||
                                    "Untitled Task"}
                            </h2>

                            <TaskStatus
                                status={task.status}
                            />

                        </div>

                        <p className="mt-1.5 text-xs font-medium text-gray-400">
                            Task #{task.task_id}
                        </p>

                        {task.document_no && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Document #{task.document_no}
                            </p>
                        )}
                    </div>

                    {/* ==================================================
                        Edit / Delete
                    ================================================== */}

                    {canTakeAction && (
                        <div className="flex shrink-0 items-center gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    onEdit(task)
                                }
                                className="flex items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                            >
                                <Pencil size={14} />
                                Edit
                            </button>

                            <button
                                type="button"
                                disabled={
                                    deleteLoading
                                }
                                onClick={() => {
                                    setDeleteError("");
                                    setShowDeleteConfirm(
                                        true
                                    );
                                }}
                                className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>

                        </div>
                    )}
                </div>
            </div>

            {/* ==================================================
                Content
            ================================================== */}

            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">

                <div className="space-y-7 p-6">

                    {/* ==================================================
                        Delete Error
                    ================================================== */}

                    {deleteError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                            {deleteError}
                        </div>
                    )}

                    {/* ==================================================
                        Delete Confirmation
                    ================================================== */}

                    {showDeleteConfirm &&
                        canTakeAction && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">

                                <div className="flex items-start gap-3">

                                    <Trash2
                                        size={18}
                                        className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                                            Delete this task?
                                        </p>

                                        <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                                            This action cannot be undone.
                                        </p>
                                    </div>

                                </div>

                                <div className="mt-4 flex justify-end gap-2">

                                    <button
                                        type="button"
                                        disabled={
                                            deleteLoading
                                        }
                                        onClick={() =>
                                            setShowDeleteConfirm(
                                                false
                                            )
                                        }
                                        className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            deleteLoading
                                        }
                                        onClick={
                                            handleDelete
                                        }
                                        className="flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {deleteLoading && (
                                            <Loader2
                                                size={14}
                                                className="animate-spin"
                                            />
                                        )}

                                        {deleteLoading
                                            ? "Deleting..."
                                            : "Delete Task"}
                                    </button>

                                </div>
                            </div>
                        )}

                    {/* ==================================================
                        Dates
                    ================================================== */}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <DateInfo
                            label="Start Date"
                            value={
                                task.start_date ||
                                "N/A"
                            }
                        />

                        <DateInfo
                            label="End Date"
                            value={
                                task.end_date ||
                                "N/A"
                            }
                        />

                    </div>

                    {/* ==================================================
                        Description
                    ================================================== */}

                    <section>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Description:
                        </h3>

                        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">

                            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
                                {task.task_description ||
                                    "No description available."}
                            </p>

                        </div>
                    </section>

                    {/* ==================================================
                        Task Users
                    ================================================== */}

                    <section>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Task Users:
                        </h3>

                        <div className="mt-4 space-y-3">

                            <TaskUser
                                label="Assigned By"
                                value={String(
                                    task.assigned_by ??
                                        "N/A"
                                )}
                            />

                            <TaskUser
                                label="Assigned To"
                                value={String(
                                    task.assigned_to ??
                                        "N/A"
                                )}
                            />

                        </div>
                    </section>

                    {/* ==================================================
                        Vendor Quotations

                        Only Assets Manager-Senior can see this.

                        READ ONLY
                    ================================================== */}

                    {isSeniorAssetManager &&
                        shouldLoadQuotes && (
                            <QuotationView
                                quotes={quotes}
                                loading={
                                    quotesLoading
                                }
                                error={quotesError}
                                documentNo={
                                    task.document_no
                                }
                            />
                        )}

                    {/* ==================================================
                        Task Actions
                    ================================================== */}

                    {canTakeAction &&
                        !isAssetExecutive && (
                            <section>

                                {actionMessage && (
                                    <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                                        {actionMessage}
                                    </div>
                                )}

                                {actionError && (
                                    <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                        {actionError}
                                    </div>
                                )}

                                {isSeniorAssetManager ? (
                                    <div className="flex w-full gap-3 pt-2">

                                        {/* Backward */}

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading !==
                                                null
                                            }
                                            onClick={
                                                handleBackward
                                            }
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                                        >
                                            {actionLoading ===
                                                "backward" && (
                                                <Loader2
                                                    size={14}
                                                    className="animate-spin"
                                                />
                                            )}

                                            {actionLoading ===
                                            "backward"
                                                ? "Moving Back..."
                                                : "Backward"}
                                        </button>

                                        {/* Reject */}

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading !==
                                                null
                                            }
                                            onClick={
                                                handleAssetPurchaseReject
                                            }
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950"
                                        >
                                            {actionLoading ===
                                                "reject" && (
                                                <Loader2
                                                    size={14}
                                                    className="animate-spin"
                                                />
                                            )}

                                            {actionLoading ===
                                            "reject"
                                                ? "Rejecting..."
                                                : "Reject"}
                                        </button>

                                        {/* Approve */}

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading !==
                                                null
                                            }
                                            onClick={
                                                handleAssetPurchaseApprove
                                            }
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {actionLoading ===
                                                "approve" && (
                                                <Loader2
                                                    size={14}
                                                    className="animate-spin"
                                                />
                                            )}

                                            {actionLoading ===
                                            "approve"
                                                ? "Approving..."
                                                : "Approve"}
                                        </button>

                                    </div>
                                ) : (
                                    <div className="flex w-full gap-3 pt-2">

                                        {/* Reject */}

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading !==
                                                null
                                            }
                                            onClick={
                                                handleReject
                                            }
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950"
                                        >
                                            {actionLoading ===
                                                "reject" && (
                                                <Loader2
                                                    size={14}
                                                    className="animate-spin"
                                                />
                                            )}

                                            {actionLoading ===
                                            "reject"
                                                ? "Rejecting..."
                                                : "Reject"}
                                        </button>

                                        {/* Accept */}

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading !==
                                                null
                                            }
                                            onClick={
                                                handleApprove
                                            }
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {actionLoading ===
                                                "approve" && (
                                                <Loader2
                                                    size={14}
                                                    className="animate-spin"
                                                />
                                            )}

                                            {actionLoading ===
                                            "approve"
                                                ? "Approving..."
                                                : "Accept"}
                                        </button>

                                    </div>
                                )}
                            </section>
                        )}

                </div>
            </div>
        </div>
    );
}

/* ======================================================
   Quotation View
====================================================== */

interface QuotationViewProps {
    quotes: AssetPurchaseQuote[];
    loading: boolean;
    error: string;
    documentNo?: string;
}

function QuotationView({
    quotes,
    loading,
    error,
    documentNo,
}: QuotationViewProps) {
    return (
        <section>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Vendor Quotations:
                    </h3>

                    {documentNo && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Document #{documentNo}
                        </p>
                    )}
                </div>

                {!loading &&
                    !error &&
                    quotes.length > 0 && (
                        <div className="flex shrink-0 items-center gap-2">

                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {quotes.length}{" "}
                                {quotes.length === 1
                                    ? "Quote"
                                    : "Quotes"}
                            </span>

                            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                <Eye size={13} />
                                View Only
                            </span>

                        </div>
                    )}
            </div>

            <div className="mt-4">

                {/* Loading */}

                {loading && (
                    <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-5 py-8 dark:border-gray-800 dark:bg-gray-950">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Loader2
                                size={16}
                                className="animate-spin"
                            />

                            Loading quotations...
                        </div>
                    </div>
                )}

                {/* Error */}

                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* Empty */}

                {!loading &&
                    !error &&
                    quotes.length === 0 && (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-8 text-center dark:border-gray-800 dark:bg-gray-950">

                            <FileText
                                size={22}
                                className="mx-auto text-gray-400"
                            />

                            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                No quotations found
                            </p>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                No vendor quotations are
                                available for this request.
                            </p>

                        </div>
                    )}

                {/* Quotes */}

                {!loading &&
                    !error &&
                    quotes.length > 0 && (
                        <div className="space-y-4">
                            {quotes.map(
                                (quote, index) => (
                                    <QuotationCard
                                        key={
                                            quote.quote_id
                                        }
                                        quote={quote}
                                        index={index}
                                    />
                                )
                            )}
                        </div>
                    )}

            </div>
        </section>
    );
}

/* ======================================================
   Quotation Card
====================================================== */

interface QuotationCardProps {
    quote: AssetPurchaseQuote;
    index: number;
}

function QuotationCard({
    quote,
    index,
}: QuotationCardProps) {
    const details =
        quote.quote_data?.additionalProp1?.details;

    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">

            {/* Quote Header */}

            <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-900">
                        <FileText
                            size={17}
                            className="text-gray-500 dark:text-gray-400"
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Quotation {index + 1}
                        </h4>

                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            Quote ID #{quote.quote_id}
                        </p>
                    </div>

                </div>

                <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700">
                    View Only
                </span>

            </div>

            {/* Quote Information */}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <QuotationField
                    label="Vendor Name"
                    value={
                        quote.vendor_name || "-"
                    }
                />

                <QuotationField
                    label="Quote Number"
                    value={
                        quote.quote_no || "-"
                    }
                />

                <QuotationField
                    label="Quote Date"
                    value={formatQuoteDate(
                        quote.quote_date
                    )}
                />

                <QuotationField
                    label="Quoted Amount"
                    value={`${quote.currency || "INR"} ${formatQuoteAmount(
                        quote.quoted_amount
                    )}`}
                />

            </div>

            {/* Quote Details */}

            {details && (
                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                    <QuotationField
                        label="Quote Details"
                        value={details}
                    />
                </div>
            )}

        </div>
    );
}

/* ======================================================
   Quotation Field
====================================================== */

interface QuotationFieldProps {
    label: string;
    value: string;
}

function QuotationField({
    label,
    value,
}: QuotationFieldProps) {
    return (
        <div>
            <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                {label}
            </p>

            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {value}
            </p>
        </div>
    );
}

/* ======================================================
   Date Info
====================================================== */

interface DateInfoProps {
    label: string;
    value: string;
}

function DateInfo({
    label,
    value,
}: DateInfoProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-950">

            <div className="flex items-center gap-2">

                <CalendarDays
                    size={16}
                    className="text-gray-400"
                />

                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {label}
                </span>

            </div>

            <p className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                {value}
            </p>

        </div>
    );
}

/* ======================================================
   Task User
====================================================== */

interface TaskUserProps {
    label: string;
    value: string;
}

function TaskUser({
    label,
    value,
}: TaskUserProps) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-950">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white dark:bg-gray-900">

                <User
                    size={17}
                    className="text-gray-500 dark:text-gray-400"
                />

            </div>

            <div className="flex items-center gap-2">

                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {label}:
                </span>

                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    #{value}
                </span>

            </div>

        </div>
    );
}

/* ======================================================
   Quote Date Formatter
====================================================== */

function formatQuoteDate(date: string) {
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

function formatQuoteAmount(
    amount: number
) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
    }).format(amount);
}

export default TaskDetails;