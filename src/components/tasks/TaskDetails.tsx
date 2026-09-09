import { useEffect, useState } from "react";

import {
    CalendarDays,
    Eye,
    Loader2,
    Pencil,
    Trash2,
} from "lucide-react";

import {
    approveTask,
    rejectTask,
    approveAssetPurchaseTask,
    rejectAssetPurchaseTask,
    backwardAssetPurchaseTask,
    deleteTask,
} from "../../api/tasks";

import {
    getAssetPurchaseTask,
} from "../../api/assetPurchase";

import type {
    Task,
    AssetPurchaseTaskDetails,
} from "../../types/task";

import TaskStatus from "./TaskStatus";

interface TaskDetailsProps {
    task: Task | null;
    onEdit: (task: Task) => void;
    onDeleted: (taskId: number) => void;

    /*
     * Called when Assets Manager-Senior
     * wants to view quotations.
     *
     * Quote data itself is handled by the
     * parent TasksPage/right panel.
     */
    onViewQuotes?: () => void;
}

function TaskDetails({
    task,
    onEdit,
    onDeleted,
    onViewQuotes,
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
        loggedInUser?.mtype ===
        "Assets-Executive";

    // ==================================================
    // Asset Purchase Task Details
    // ==================================================

    const [assetTask, setAssetTask] =
        useState<AssetPurchaseTaskDetails | null>(
            null
        );

    const [assetTaskLoading, setAssetTaskLoading] =
        useState(false);

    const [assetTaskError, setAssetTaskError] =
        useState("");

    const isAssetPurchaseTask =
        task?.document_type ===
        "AssetPurchaseRequest" ||
        task?.task_type ===
        "Asset Purchase Request";

    /*
     * Load the complete asset purchase task.
     *
     * Important:
     * AssetPurchaseTaskDetails represents the COMPLETE
     * task object. The actual request fields are inside:
     *
     * assetTask.document.request_data
     *
     * We therefore do NOT cast request_data itself to
     * AssetPurchaseTaskDetails.
     */
    useEffect(() => {
        if (
            !task ||
            (
                task.document_type !==
                "AssetPurchaseRequest" &&
                task.task_type !==
                "Asset Purchase Request"
            )
        ) {
            return;
        }

        const currentTask = task;

        let cancelled = false;

        const loadAssetTask = async () => {
            setAssetTaskLoading(true);
            setAssetTaskError("");
            setAssetTask(null);

            try {
                const response =
                    await getAssetPurchaseTask(
                        currentTask.task_id
                    );

                if (cancelled) {
                    return;
                }

                const details =
                    extractAssetPurchaseTaskDetails(
                        response
                    );

                if (!details) {
                    throw new Error(
                        "Asset purchase task data was not returned in the expected format."
                    );
                }

                setAssetTask(details);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "Failed to load asset purchase task:",
                    err
                );

                setAssetTask(null);

                setAssetTaskError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load asset purchase request."
                );
            } finally {
                if (!cancelled) {
                    setAssetTaskLoading(false);
                }
            }
        };

        loadAssetTask();

        return () => {
            cancelled = true;
        };
    }, [task]);

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
    // Values below this point are safe because task
    // has already been checked for null.
    // ==================================================

    /*
     * Prefer the document number returned by the
     * asset-specific API when available.
     */
    const assetDocumentNo =
        assetTask?.document?.document_no ||
        task.document_no;

    // ==================================================
    // Task Status
    //
    // 0 = In Progress
    // 1 = Accepted
    // 2 = Rejected
    // ==================================================

    const canTakeAction =
        task.status === 0;

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
            const response =
                await approveTask(
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
            const response =
                await rejectTask(
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

    const handleAssetPurchaseApprove =
        async () => {
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

    const handleAssetPurchaseReject =
        async () => {
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
                            Task : {task.task_id} ... Assined By #{task.assigned_by ?? "N/A"}
                        </p>

                        {assetDocumentNo && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Document : #{assetDocumentNo}
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

                    {!isAssetPurchaseTask && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                            <DateInfo
                                icon={
                                    <CalendarDays size={16} />
                                }
                                label="Start Date"
                                value={task.start_date}
                            />

                            <DateInfo
                                icon={
                                    <CalendarDays size={16} />
                                }
                                label="End Date"
                                value={task.end_date}
                            />

                        </div>
                    )}

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
                        Asset Purchase Request Details
                    ================================================== */}

                    {isAssetPurchaseTask && (
                        <section>

                            <div className="flex items-center justify-between gap-4">

                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Asset Purchase Request:
                                </h3>

                                <div className="flex items-center gap-2">

                                    {assetTask?.document
                                        ?.document_no && (
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                {
                                                    assetTask
                                                        .document
                                                        .document_no
                                                }
                                            </span>
                                        )}

                                    {/* ==================================================
                                        Senior Manager - View Quotes
                                    ================================================== */}

                                    {isSeniorAssetManager &&
                                        onViewQuotes && (
                                            <button
                                                type="button"
                                                onClick={
                                                    onViewQuotes
                                                }
                                                disabled={
                                                    !assetDocumentNo
                                                }
                                                className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                                            >
                                                <Eye
                                                    size={14}
                                                />
                                                View Quotes
                                            </button>
                                        )}

                                </div>

                            </div>

                            <div className="mt-4">

                                {/* Loading */}

                                {assetTaskLoading && (
                                    <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-5 py-8 dark:border-gray-800 dark:bg-gray-950">

                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">

                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />

                                            Loading asset request...

                                        </div>

                                    </div>
                                )}

                                {/* Error */}

                                {!assetTaskLoading &&
                                    assetTaskError && (
                                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                            {assetTaskError}
                                        </div>
                                    )}

                                {/* Data */}

                                {!assetTaskLoading &&
                                    !assetTaskError &&
                                    assetTask && (
                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">

                                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                                <AssetRequestField
                                                    label="Asset"
                                                    value={
                                                        assetTask
                                                            .document
                                                            ?.request_data
                                                            ?.asset ||
                                                        "-"
                                                    }
                                                />

                                                <AssetRequestField
                                                    label="Asset Type"
                                                    value={
                                                        assetTask
                                                            .document
                                                            ?.request_data
                                                            ?.asset_type ||
                                                        "-"
                                                    }
                                                />

                                                <AssetRequestField
                                                    label="Required Date"
                                                    value={formatQuoteDate(
                                                        assetTask
                                                            .document
                                                            ?.request_data
                                                            ?.required_date
                                                    )}
                                                />

                                                <AssetRequestField
                                                    label="Document No"
                                                    value={
                                                        assetTask
                                                            .document
                                                            ?.document_no ||
                                                        "-"
                                                    }
                                                />

                                            </div>

                                            <div className="mt-5 border-t border-gray-200 pt-5 dark:border-gray-800">

                                                <AssetRequestField
                                                    label="Asset Description"
                                                    value={
                                                        assetTask
                                                            .document
                                                            ?.request_data
                                                            ?.asset_description ||
                                                        "-"
                                                    }
                                                    fullWidth
                                                />

                                            </div>

                                            <div className="mt-5">

                                                <AssetRequestField
                                                    label="Purchase Reason"
                                                    value={
                                                        assetTask
                                                            .document
                                                            ?.request_data
                                                            ?.purchase_reason ||
                                                        "-"
                                                    }
                                                    fullWidth
                                                />

                                            </div>

                                        </div>
                                    )}

                            </div>
                        </section>
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
   Extract Asset Purchase Task Details
====================================================== */

/**
 * Safely extracts the COMPLETE AssetPurchaseTaskDetails
 * from the API response.
 *
 * Supported response structures:
 *
 * 1. {
 *      data: {
 *          task_id: ...,
 *          document: {
 *              document_no: ...,
 *              request_data: {...}
 *          }
 *      }
 *    }
 *
 * 2. {
 *      task_id: ...,
 *      document: {...}
 *    }
 *
 * The request_data object itself is NEVER treated as
 * AssetPurchaseTaskDetails.
 */
function extractAssetPurchaseTaskDetails(
    response: unknown
): AssetPurchaseTaskDetails | null {
    if (
        !response ||
        typeof response !== "object"
    ) {
        return null;
    }

    const root =
        response as Record<string, unknown>;

    let candidate: unknown = root;

    /*
     * Normal API response:
     * { success: true, data: {...} }
     */
    if (
        root.data &&
        typeof root.data === "object"
    ) {
        candidate = root.data;
    }

    if (
        !candidate ||
        typeof candidate !== "object"
    ) {
        return null;
    }

    const candidateObject =
        candidate as Record<string, unknown>;

    /*
     * Some API wrappers may return:
     * { data: { data: {...} } }
     */
    if (
        candidateObject.data &&
        typeof candidateObject.data === "object" &&
        !candidateObject.document
    ) {
        candidate =
            candidateObject.data;
    }

    if (
        !candidate ||
        typeof candidate !== "object"
    ) {
        return null;
    }

    const details =
        candidate as Record<string, unknown>;

    /*
     * Verify that this is actually the complete
     * asset purchase task before converting it.
     */
    const hasTaskId =
        typeof details.task_id === "number";

    const hasTaskType =
        typeof details.task_type === "string";

    const hasDocument =
        details.document !== null &&
        typeof details.document === "object";

    /*
     * If the API returned the expected complete object,
     * use it.
     */
    if (
        hasTaskId &&
        hasTaskType &&
        hasDocument
    ) {
        return details as unknown as AssetPurchaseTaskDetails;
    }

    return null;
}

/* ======================================================
   Asset Request Field
====================================================== */

interface AssetRequestFieldProps {
    label: string;
    value: string;
    fullWidth?: boolean;
}

function AssetRequestField({
    label,
    value,
}: AssetRequestFieldProps) {
    return (
        <div>
            <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                {label}
            </p>

            <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                {value}
            </p>
        </div>
    );
}

/* ======================================================
   Date Info
====================================================== */

interface DateInfoProps {
    icon?: React.ReactNode;
    label: string;
    value: string | null;
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
   Quote Date Formatter
====================================================== */

function formatQuoteDate(
    date: string | undefined | null
) {
    if (!date) {
        return "-";
    }

    const parsedDate =
        new Date(date);

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return date;
    }

    return parsedDate.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

export default TaskDetails;