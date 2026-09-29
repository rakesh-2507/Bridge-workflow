
import { useEffect, useState } from "react";

import {
    CalendarDays,
    Check,
    File,
    FileText,
    Loader2,
    Pencil,
    SlidersHorizontal,
    Trash2,
    X,
    XCircle,
} from "lucide-react";

import {
    approveTask,
    deleteTask,
    getTaskFiles,
    rejectTask,
} from "../../api/tasks";

import type { TaskFile } from "../../api/tasks";
import type { Task } from "../../types/task";

import TaskStatus from "./TaskStatus";

/* =========================================================
   Types
========================================================= */

interface TaskDetailsProps {
    task: Task | null;
    onEdit: (task: Task) => void;
    onDeleted: (taskId: number) => void;
}

type WorkflowAction = string;

/* =========================================================
   Component
========================================================= */

function TaskDetails({
    task,
    onEdit,
    onDeleted,
}: TaskDetailsProps) {
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const [showAttributes, setShowAttributes] = useState(false);
    const [attributeForm, setAttributeForm] = useState<Task | null>(null);

    const [taskFiles, setTaskFiles] = useState<TaskFile[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [filesError, setFilesError] = useState("");

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");

    /* =========================================================
       Workflow Actions
    ========================================================= */

    const workflowActions: WorkflowAction[] = Array.isArray(
        task?.key_params?.workflow_actions,
    )
        ? task.key_params.workflow_actions.filter(
            (action): action is string =>
                typeof action === "string" && action.trim().length > 0,
        )
        : [];

    const hasApproveAction = workflowActions.some(
        (action) => action.trim().toLowerCase() === "approve",
    );

    const hasRejectAction = workflowActions.some(
        (action) => action.trim().toLowerCase() === "reject",
    );

    /* =========================================================
       Load Task Files
    ========================================================= */

    useEffect(() => {
        if (!task) return;

        let cancelled = false;

        const loadTaskFiles = async () => {
            setFilesLoading(true);
            setFilesError("");

            try {
                const files = await getTaskFiles(task.task_id);

                if (!cancelled) {
                    setTaskFiles(files);
                }
            } catch (error) {
                if (!cancelled) {
                    setTaskFiles([]);
                    setFilesError(
                        error instanceof Error
                            ? error.message
                            : "Failed to load task files.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setFilesLoading(false);
                }
            }
        };

        void loadTaskFiles();

        return () => {
            cancelled = true;
        };
    }, [task]);

    /* =========================================================
       No Task Selected
    ========================================================= */

    if (!task) {
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center border-l border-gray-200 bg-gray-50 px-6 text-center dark:border-gray-800 dark:bg-gray-950">
                <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-gray-900">
                        <Pencil
                            size={20}
                            className="text-gray-400"
                        />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Select a task
                    </h3>

                    <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Select a task from the list to view its details.
                    </p>
                </div>
            </div>
        );
    }

    const canTakeAction = task.status === 0;

    const handleDelete = async () => {
        if (deleteLoading) return;

        setDeleteLoading(true);
        setDeleteError("");

        try {
            await deleteTask(task.task_id);

            setShowDeleteConfirm(false);
            onDeleted(task.task_id);
        } catch (error) {
            setDeleteError(
                error instanceof Error
                    ? error.message
                    : "Failed to delete task.",
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    /* =========================================================
       Approve
    ========================================================= */

    const handleApprove = async () => {
        if (actionLoading !== null || !canTakeAction) return;

        setActionLoading("Approve");
        setActionMessage("");
        setActionError("");

        try {
            const response = await approveTask(task.task_id);

            setActionMessage(
                getResponseMessage(
                    response,
                    "Task approved successfully.",
                ),
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : "Failed to approve task.",
            );
        } finally {
            setActionLoading(null);
        }
    };

    /* =========================================================
       Reject
    ========================================================= */

    const handleReject = async () => {
        if (actionLoading !== null || !canTakeAction) return;

        setActionLoading("Reject");
        setActionMessage("");
        setActionError("");

        try {
            const response = await rejectTask(task.task_id);

            setActionMessage(
                getResponseMessage(
                    response,
                    "Task rejected successfully.",
                ),
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : "Failed to reject task.",
            );
        } finally {
            setActionLoading(null);
        }
    };

    /* =========================================================
       Attributes
    ========================================================= */

    const openAttributes = () => {
        setAttributeForm({
            ...task,
            levels: task.levels ? [...task.levels] : [],
            key_params: task.key_params
                ? { ...task.key_params }
                : {},
        });

        setShowAttributes(true);
    };

    const closeAttributes = () => {
        setShowAttributes(false);
        setAttributeForm(null);
    };

    const updateAttribute = (
        field: keyof Task,
        value: unknown,
    ) => {
        setAttributeForm((previous) =>
            previous
                ? {
                    ...previous,
                    [field]: value,
                }
                : previous,
        );
    };

    const updateKeyParam = (key: string, value: string) => {
        setAttributeForm((previous) =>
            previous
                ? {
                    ...previous,
                    key_params: {
                        ...(previous.key_params ?? {}),
                        [key]: value,
                    },
                }
                : previous,
        );
    };

    /* =========================================================
       Render
    ========================================================= */

    return (
        <div className="flex min-h-0 flex-1 flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            {/* Header */}
            <div className="shrink-0 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {task.task_type || "Untitled Task"}
                            </h2>

                            <TaskStatus status={task.status} />
                        </div>

                        <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-gray-400">
                                Task #{task.task_id}
                            </p>

                            {/* {workflowConfigId && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    <span className="font-medium">
                                        {workflowConfigId}
                                    </span>
                                </p>
                            )} */}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={openAttributes}
                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            <SlidersHorizontal size={14} />
                            Attributes
                        </button>

                        <button
                            type="button"
                            onClick={() => onEdit(task)}
                            className="flex items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                            <Pencil size={14} />
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setDeleteError("");
                                setShowDeleteConfirm(true);
                            }}
                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950"
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
                <div className="flex flex-col gap-5 p-4 xl:flex-row xl:items-start xl:gap-6">
                    {/* LEFT: Task Details */}
                    <div className="min-w-0 flex-1 space-y-7 xl:w-2/3">
                        {/* Delete Error */}
                        {deleteError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                {deleteError}
                            </div>
                        )}

                        {/* Delete Confirmation */}
                        {showDeleteConfirm && (
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
                                        disabled={deleteLoading}
                                        onClick={() =>
                                            setShowDeleteConfirm(false)
                                        }
                                        className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={deleteLoading}
                                        onClick={() => void handleDelete()}
                                        className="flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
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

                        {/* Dates */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <DateInfo
                                label="Start Date"
                                value={task.start_date || "N/A"}
                            />

                            <DateInfo
                                label="End Date"
                                value={task.end_date || "N/A"}
                            />
                        </div>

                        {/* Description */}
                        <section>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Description:
                            </h3>

                            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950">
                                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
                                    {task.task_description ||
                                        "No description available."}
                                </p>
                            </div>
                        </section>

                        {/* Task Files */}
                        <section>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Task Files:
                                    </h3>

                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Files associated with this task.
                                    </p>
                                </div>

                                {!filesLoading && taskFiles.length > 0 && (
                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        {taskFiles.length}{" "}
                                        {taskFiles.length === 1 ? "file" : "files"}
                                    </span>
                                )}
                            </div>

                            <div className="mt-4">
                                {filesLoading && (
                                    <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 dark:border-gray-800 dark:bg-gray-950">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                            Loading files...
                                        </div>
                                    </div>
                                )}

                                {!filesLoading && filesError && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                        {filesError}
                                    </div>
                                )}

                                {!filesLoading &&
                                    !filesError &&
                                    taskFiles.length === 0 && (
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center dark:border-gray-700 dark:bg-gray-950">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-gray-900">
                                                <File
                                                    size={18}
                                                    className="text-gray-400"
                                                />
                                            </div>

                                            <p className="mt-3 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                No files attached
                                            </p>

                                            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                                                Files uploaded for this task will
                                                appear here.
                                            </p>
                                        </div>
                                    )}

                                {!filesLoading &&
                                    !filesError &&
                                    taskFiles.length > 0 && (
                                        <div className="space-y-2">
                                            {taskFiles.map((file) => (
                                                <TaskFileItem
                                                    key={file.pffid}
                                                    file={file}
                                                />
                                            ))}
                                        </div>
                                    )}
                            </div>
                        </section>

                        {/* Approve / Reject - After All Task Information */}
                        {(hasApproveAction || hasRejectAction) && (
                            <section className="border-t border-gray-200 pt-6 dark:border-gray-800">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Task Actions
                                        </h3>

                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Take action on this task.
                                        </p>
                                    </div>

                                    {!canTakeAction && (
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                            Actions unavailable
                                        </span>
                                    )}
                                </div>

                                {actionMessage && (
                                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                                        {actionMessage}
                                    </div>
                                )}

                                {actionError && (
                                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                        {actionError}
                                    </div>
                                )}

                                <div className="mt-4 flex flex-wrap gap-3">
                                    {hasApproveAction && (
                                        <button
                                            type="button"
                                            disabled={
                                                !canTakeAction ||
                                                actionLoading !== null
                                            }
                                            onClick={() =>
                                                void handleApprove()
                                            }
                                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {actionLoading === "Approve" ? (
                                                <Loader2
                                                    size={16}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Check size={16} />
                                            )}

                                            {actionLoading === "Approve"
                                                ? "Approving..."
                                                : "Approve"}
                                        </button>
                                    )}

                                    {hasRejectAction && (
                                        <button
                                            type="button"
                                            disabled={
                                                !canTakeAction ||
                                                actionLoading !== null
                                            }
                                            onClick={() => void handleReject()}
                                            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {actionLoading === "Reject" ? (
                                                <Loader2
                                                    size={16}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <XCircle size={16} />
                                            )}

                                            {actionLoading === "Reject"
                                                ? "Rejecting..."
                                                : "Reject"}
                                        </button>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT: Workflow Tracking */}
                    <aside className="w-full shrink-0 xl:sticky xl:top-4 xl:w-[32%]">
                        <WorkflowTracking task={task} />
                    </aside>
                </div>
            </div>

            {/* Attributes Modal */}
            {showAttributes && attributeForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeAttributes();
                        }
                    }}
                >
                    <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                        {/* Modal Header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Task Attributes
                                </h2>

                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    View and edit task attributes.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeAttributes}
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="min-h-0 flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <ReadOnlyField
                                    label="Task ID"
                                    value={String(attributeForm.task_id)}
                                />

                                <AttributeInput
                                    label="Task Type"
                                    value={attributeForm.task_type ?? ""}
                                    onChange={(value) =>
                                        updateAttribute("task_type", value)
                                    }
                                />

                                <AttributeInput
                                    label="Project ID"
                                    type="number"
                                    value={attributeForm.project_id ?? ""}
                                    onChange={(value) =>
                                        updateAttribute(
                                            "project_id",
                                            value === "" ? null : Number(value),
                                        )
                                    }
                                />

                                <AttributeInput
                                    label="Folder ID"
                                    type="number"
                                    value={attributeForm.folder_id ?? ""}
                                    onChange={(value) =>
                                        updateAttribute(
                                            "folder_id",
                                            value === "" ? null : Number(value),
                                        )
                                    }
                                />

                                <AttributeInput
                                    label="Template ID"
                                    type="number"
                                    value={attributeForm.template_id ?? ""}
                                    onChange={(value) =>
                                        updateAttribute(
                                            "template_id",
                                            value === "" ? null : Number(value),
                                        )
                                    }
                                />

                                <AttributeInput
                                    label="Assigned By"
                                    type="number"
                                    value={attributeForm.assigned_by ?? ""}
                                    onChange={(value) =>
                                        updateAttribute(
                                            "assigned_by",
                                            value === "" ? 0 : Number(value),
                                        )
                                    }
                                />

                                <AttributeInput
                                    label="Assigned To"
                                    type="number"
                                    value={attributeForm.assigned_to ?? ""}
                                    onChange={(value) =>
                                        updateAttribute(
                                            "assigned_to",
                                            value === "" ? 0 : Number(value),
                                        )
                                    }
                                />

                                <AttributeInput
                                    label="Start Date"
                                    type="date"
                                    value={attributeForm.start_date ?? ""}
                                    onChange={(value) =>
                                        updateAttribute("start_date", value)
                                    }
                                />

                                <AttributeInput
                                    label="End Date"
                                    type="date"
                                    value={attributeForm.end_date ?? ""}
                                    onChange={(value) =>
                                        updateAttribute("end_date", value)
                                    }
                                />

                                <AttributeInput
                                    label="Status"
                                    type="number"
                                    value={attributeForm.status ?? ""}
                                    onChange={(value) =>
                                        updateAttribute(
                                            "status",
                                            value === ""
                                                ? undefined
                                                : Number(value),
                                        )
                                    }
                                />

                                <ReadOnlyField
                                    label="Created Date"
                                    value={
                                        attributeForm.created_date || "N/A"
                                    }
                                />

                                <ReadOnlyField
                                    label="Updated Date"
                                    value={
                                        attributeForm.updated_date || "N/A"
                                    }
                                />

                                <div className="md:col-span-2">
                                    <AttributeTextarea
                                        label="Task Description"
                                        value={
                                            attributeForm.task_description ?? ""
                                        }
                                        onChange={(value) =>
                                            updateAttribute(
                                                "task_description",
                                                value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <AttributeInput
                                        label="Levels"
                                        value={
                                            attributeForm.levels?.join(", ") ??
                                            ""
                                        }
                                        onChange={(value) =>
                                            updateAttribute(
                                                "levels",
                                                value
                                                    .split(",")
                                                    .map((item) => item.trim())
                                                    .filter(Boolean),
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            {/* Key Params */}
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Key Parameters
                                </h3>

                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Edit the task key parameters.
                                </p>

                                <div className="mt-3 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                                    {Object.entries(
                                        attributeForm.key_params ?? {},
                                    ).length === 0 ? (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            No key parameters available.
                                        </p>
                                    ) : (
                                        Object.entries(
                                            attributeForm.key_params ?? {},
                                        ).map(([key, value]) => (
                                            <div
                                                key={key}
                                                className="grid grid-cols-1 gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center"
                                            >
                                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    {key}
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        value == null
                                                            ? ""
                                                            : String(value)
                                                    }
                                                    onChange={(event) =>
                                                        updateKeyParam(
                                                            key,
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-500"
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={closeAttributes}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    // Update Attributes API will be added later.
                                }}
                                className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                            >
                                <SlidersHorizontal size={14} />
                                Update Attributes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


/* =========================================================
   Workflow Tracking
========================================================= */

interface WorkflowTrackingProps {
    task: Task;
}

function WorkflowTracking({ task }: WorkflowTrackingProps) {
    const levels = Array.isArray(task.levels)
        ? task.levels.filter(
            (level): level is string =>
                typeof level === "string" && level.trim().length > 0,
        )
        : [];

    const currentLevel = String(
        task.key_params?.workflow_level_label ?? "",
    ).trim();

    const currentLevelIndex = levels.findIndex(
        (level) => level.toLowerCase() === currentLevel.toLowerCase(),
    );

    const isCompleted = task.status === 3;
    const isRejected = task.status === 2;

    const completedCount = isCompleted
        ? levels.length
        : currentLevelIndex >= 0
            ? currentLevelIndex
            : 0;

    const progress =
        levels.length > 0
            ? Math.round((completedCount / levels.length) * 100)
            : 0;

    const statusLabel = isCompleted
        ? "Completed"
        : isRejected
            ? "Rejected"
            : task.status === 0
                ? "In Progress"
                : task.status === 1
                    ? "Accepted"
                    : "Unknown";

    const statusClass = isCompleted
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        : isRejected
            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Workflow Tracking
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Progress and approval levels
                    </p>
                </div>
                <span className="rounded-lg bg-gray-100 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <SlidersHorizontal size={16} />
                </span>
            </div>

            {/* Overall task status and progress */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Task Status
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass}`}>
                        {statusLabel}
                    </span>
                </div>

                <div className="mt-4 flex items-end justify-between">
                    <div>
                        <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {completedCount}
                            <span className="text-lg font-medium text-gray-400">
                                {" "}/ {levels.length}
                            </span>
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Levels completed
                        </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {progress}%
                    </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Current level */}
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
                <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    Current Level
                </p>
                <p className="mt-1 text-base font-semibold text-blue-900 dark:text-blue-200">
                    {currentLevel || "Not assigned"}
                </p>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                    {isCompleted
                        ? "Workflow completed"
                        : isRejected
                            ? "Workflow rejected"
                            : "Awaiting action"}
                </p>
            </div>

            {/* Ordered workflow levels */}
            <div className="mt-5">
                <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                        Workflow Levels
                    </h4>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {levels.length} total
                    </span>
                </div>

                {levels.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            No workflow levels available.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0">
                        {levels.map((level, index) => {
                            const isCurrent =
                                index === currentLevelIndex &&
                                !isCompleted &&
                                !isRejected;
                            const isLevelCompleted =
                                isCompleted ||
                                (currentLevelIndex >= 0 &&
                                    index < currentLevelIndex);
                            const isLevelRejected =
                                isRejected && index === currentLevelIndex;
                            const isPending =
                                !isLevelCompleted &&
                                !isCurrent &&
                                !isLevelRejected;

                            return (
                                <div
                                    key={`${level}-${index}`}
                                    className="relative flex gap-3 pb-5 last:pb-0"
                                >
                                    {index < levels.length - 1 && (
                                        <div
                                            className={`absolute left-[13px] top-7 h-full w-px ${isLevelCompleted
                                                    ? "bg-emerald-400"
                                                    : "bg-gray-200 dark:bg-gray-700"
                                                }`}
                                        />
                                    )}

                                    <div
                                        className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${isLevelCompleted
                                                ? "border-emerald-500 bg-emerald-500 text-white"
                                                : isCurrent
                                                    ? "border-blue-500 bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-950"
                                                    : isLevelRejected
                                                        ? "border-red-500 bg-red-500 text-white"
                                                        : "border-gray-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                                            }`}
                                    >
                                        {isLevelCompleted ? (
                                            <Check size={14} />
                                        ) : isLevelRejected ? (
                                            <X size={14} />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <p
                                            className={`text-xs font-semibold ${isCurrent
                                                    ? "text-blue-700 dark:text-blue-300"
                                                    : "text-gray-800 dark:text-gray-200"
                                                }`}
                                        >
                                            {level}
                                        </p>
                                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                            {isLevelCompleted
                                                ? "Completed"
                                                : isLevelRejected
                                                    ? "Rejected"
                                                    : isCurrent
                                                        ? "Current Level"
                                                        : isPending
                                                            ? "Pending"
                                                            : "Not started"}
                                        </p>
                                    </div>

                                    {isCurrent && (
                                        <span className="h-fit rounded-full bg-blue-100 px-2 py-1 text-[9px] font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                            Current
                                        </span>
                                    )}
                                    {isLevelCompleted && (
                                        <Check
                                            size={15}
                                            className="shrink-0 text-emerald-500"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Task and workflow identifiers */}
            <div className="mt-5 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                        Task ID
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                        #{task.task_id}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                        Workflow Config
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {getWorkflowConfigId(task) || "N/A"}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   Task File Item
========================================================= */

interface TaskFileItemProps {
    file: TaskFile;
}

function TaskFileItem({ file }: TaskFileItemProps) {
    const fileSize = formatFileSize(file.filesize);
    const fileType = file.MIME || "Unknown file type";

    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition hover:border-gray-300 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700 dark:hover:bg-gray-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-900">
                <FileText
                    size={18}
                    className="text-gray-500 dark:text-gray-400"
                />
            </div>

            <div className="min-w-0 flex-1">
                <p
                    className="truncate text-sm font-medium text-gray-900 dark:text-white"
                    title={file.filename}
                >
                    {file.filename}
                </p>

                <div className="mt-1 flex items-center gap-2">
                    <span
                        className="truncate text-[11px] text-gray-500 dark:text-gray-400"
                        title={fileType}
                    >
                        {fileType}
                    </span>

                    <span className="text-gray-300 dark:text-gray-700">
                        •
                    </span>

                    <span className="shrink-0 text-[11px] text-gray-500 dark:text-gray-400">
                        {fileSize}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   Helpers
========================================================= */

function getWorkflowConfigId(task: Task): string {
    const value = task.key_params?.workflow_config_id;

    return value == null ? "" : String(value);
}

function getResponseMessage(
    response: unknown,
    fallback: string,
): string {
    if (typeof response === "string" && response.trim()) {
        return response;
    }

    if (
        response !== null &&
        typeof response === "object" &&
        "message" in response &&
        typeof response.message === "string"
    ) {
        return response.message;
    }

    return fallback;
}

function formatFileSize(size: number | undefined): string {
    if (
        size === undefined ||
        size === null ||
        Number.isNaN(Number(size)) ||
        Number(size) <= 0
    ) {
        return "Unknown size";
    }

    const bytes = Number(size);

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/* =========================================================
   Attribute Input
========================================================= */

interface AttributeInputProps {
    label: string;
    value: string | number;
    type?: "text" | "number" | "date";
    onChange: (value: string) => void;
}

function AttributeInput({
    label,
    value,
    type = "text",
    onChange,
}: AttributeInputProps) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-500"
            />
        </div>
    );
}

/* =========================================================
   Attribute Textarea
========================================================= */

interface AttributeTextareaProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

function AttributeTextarea({
    label,
    value,
    onChange,
}: AttributeTextareaProps) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {label}
            </label>

            <textarea
                value={value}
                rows={3}
                onChange={(event) => onChange(event.target.value)}
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-500"
            />
        </div>
    );
}

/* =========================================================
   Read Only Field
========================================================= */

interface ReadOnlyFieldProps {
    label: string;
    value: string;
}

function ReadOnlyField({
    label,
    value,
}: ReadOnlyFieldProps) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {label}
            </label>

            <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                {value}
            </div>
        </div>
    );
}

/* =========================================================
   Date Info
========================================================= */

interface DateInfoProps {
    label: string;
    value: string;
}

function DateInfo({
    label,
    value,
}: DateInfoProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
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

export default TaskDetails;