import { useEffect, useMemo, useRef, useState } from "react";

import {
    CalendarDays,
    Check,
    Circle,
    Download,
    Eye,
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
    deleteTask,
    getTaskFiles,
    performTaskAction,
    saveFolderFile,
} from "../../api/tasks";

import type { TaskFile } from "../../api/tasks";
import type { Task as TaskType } from "../../types/task";

import TaskStatus from "./TaskStatus";

interface TaskDetailsProps {
    task: TaskType | null;
    onEdit: (task: TaskType) => void;
    onDeleted: (taskId: number) => void;
}

interface AttributeForm {
    task_id: number;
    task_type: string;
    project_id: number | null;
    folder_id: number | null;
    template_id: number | null;
    assigned_by: number;
    assigned_to: number;
    start_date: string;
    end_date: string | null;
    status: number;
    created_date: string;
    updated_date: string;
    task_description: string;
    levels: string[];
    key_params: Record<string, unknown>;
}

/* =========================================================
 * File Helpers
 * ========================================================= */

function getFileId(file: TaskFile): number | null {
    const value = Number(file.pffid);

    return Number.isInteger(value) && value > 0
        ? value
        : null;
}

function getFileProjectId(
    file: TaskFile,
    fallback?: number | null,
): number | null {
    const raw =
        file.projectid ??
        file.project_id ??
        fallback;

    const value = Number(raw);

    return Number.isInteger(value) && value > 0
        ? value
        : null;
}

function getFileFolderId(
    file: TaskFile,
    fallback?: number | null,
): number | null {
    const raw =
        file.fid ??
        file.folder_id ??
        fallback;

    const value = Number(raw);

    return Number.isInteger(value) && value > 0
        ? value
        : null;
}

/* =========================================================
 * Task Details
 * ========================================================= */

function TaskDetails({
    task,
    onEdit,
    onDeleted,
}: TaskDetailsProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [deleteError, setDeleteError] =
        useState("");

    const [showAttributes, setShowAttributes] =
        useState(false);

    const [attributeForm, setAttributeForm] =
        useState<AttributeForm | null>(null);

    const [taskFiles, setTaskFiles] =
        useState<TaskFile[]>([]);

    const [filesLoading, setFilesLoading] =
        useState(false);

    const [filesError, setFilesError] =
        useState("");

    const [actionLoading, setActionLoading] =
        useState<"approve" | "reject" | null>(null);

    const [actionMessage, setActionMessage] =
        useState("");

    const [actionError, setActionError] =
        useState("");

    const [actionComment, setActionComment] = useState("");
    /* =====================================================
     * File Preview Modal
     * ===================================================== */

    const [viewingFile, setViewingFile] =
        useState<TaskFile | null>(null);

    const [viewingFileUrl, setViewingFileUrl] =
        useState<string | null>(null);

    const [viewingFileLoading, setViewingFileLoading] =
        useState(false);

    const [viewingFileError, setViewingFileError] =
        useState("");

    const viewingBlobUrlRef =
        useRef<string | null>(null);

    function replaceViewingBlobUrl(
        url: string | null,
    ) {
        if (viewingBlobUrlRef.current) {
            URL.revokeObjectURL(
                viewingBlobUrlRef.current,
            );
        }

        viewingBlobUrlRef.current = url;

        setViewingFileUrl(url);
    }

    useEffect(() => {
        return () => {
            if (viewingBlobUrlRef.current) {
                URL.revokeObjectURL(
                    viewingBlobUrlRef.current,
                );

                viewingBlobUrlRef.current = null;
            }
        };
    }, []);

    /* =====================================================
     * Workflow Actions
     * ===================================================== */

    const workflowActions = useMemo(() => {
        if (!task?.key_params) {
            return [];
        }

        const actions =
            task.key_params.workflow_actions;

        if (!Array.isArray(actions)) {
            return [];
        }

        return actions.filter(
            (action): action is string =>
                typeof action === "string",
        );
    }, [task]);

    const hasApproveAction =
        workflowActions.some(
            (action) =>
                action.toLowerCase() === "approve",
        );

    const hasRejectAction =
        workflowActions.some(
            (action) =>
                action.toLowerCase() === "reject",
        );

    const canTakeAction =
        task !== null &&
        task.status === 0 &&
        workflowActions.length > 0;

    /* =====================================================
     * Load Task Files
     * ===================================================== */

    useEffect(() => {
        let cancelled = false;

        async function loadFiles() {
            if (!task?.task_id) {
                if (!cancelled) {
                    setTaskFiles([]);
                    setFilesError("");
                    setFilesLoading(false);
                }

                return;
            }

            setFilesLoading(true);
            setFilesError("");

            try {
                const files =
                    await getTaskFiles(task.task_id);

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
        }

        void loadFiles();

        return () => {
            cancelled = true;
        };
    }, [task?.task_id]);

    /* =====================================================
     * Delete
     * ===================================================== */

    async function handleDelete() {
        if (!task) {
            return;
        }

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
    }

    /* =====================================================
     * Approve / Reject
     * ===================================================== */

    async function handleTaskAction(
        action: "approve" | "reject",
    ) {
        if (!task || !canTakeAction) {
            return;
        }

        setActionLoading(action);
        setActionMessage("");
        setActionError("");

        try {
            const response =
                await performTaskAction(
                    task.task_id,
                    {
                        action,
                        comment: actionComment.trim(),
                    },
                );

            setActionMessage(
                response?.message ||
                (action === "approve"
                    ? "Task approved successfully."
                    : "Task rejected successfully."),
            );

            setActionComment("");
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : `Failed to ${action} task.`,
            );
        } finally {
            setActionLoading(null);
        }
    }

    /* =====================================================
     * Attributes
     * ===================================================== */

    function openAttributes() {
        if (!task) {
            return;
        }

        setAttributeForm({
            task_id: task.task_id,
            task_type: task.task_type,
            project_id: task.project_id,
            folder_id: task.folder_id,
            template_id: task.template_id,
            assigned_by: task.assigned_by,
            assigned_to: task.assigned_to,
            start_date: task.start_date,
            end_date: task.end_date,
            status: task.status ?? 0,
            created_date: task.created_date ?? "",
            updated_date: task.updated_date ?? "",
            task_description: task.task_description,
            levels: [...task.levels],
            key_params: {
                ...task.key_params,
            },
        });

        setShowAttributes(true);
    }

    function updateAttribute<
        K extends keyof AttributeForm
    >(
        field: K,
        value: AttributeForm[K],
    ) {
        setAttributeForm((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                [field]: value,
            };
        });
    }

    function updateKeyParam(
        key: string,
        value: string,
    ) {
        setAttributeForm((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                key_params: {
                    ...current.key_params,
                    [key]: value,
                },
            };
        });
    }

    function handleUpdateAttributes() {
        /*
         * There is currently no attributes update API.
         * Keep this button as UI-only until the backend
         * endpoint is available.
         */
        setShowAttributes(false);
    }

    /* =====================================================
     * Open File Preview
     * ===================================================== */

    async function handleViewFile(
        file: TaskFile,
    ) {
        const projectId = getFileProjectId(
            file,
            task?.project_id,
        );

        const folderId = getFileFolderId(
            file,
            task?.folder_id,
        );

        const fileId = getFileId(file);

        if (
            projectId === null ||
            folderId === null ||
            fileId === null
        ) {
            setViewingFile(file);
            setViewingFileUrl(null);
            setViewingFileError(
                "Unable to determine the file information required to preview this file.",
            );
            return;
        }

        setViewingFile(file);
        setViewingFileUrl(null);
        setViewingFileError("");
        setViewingFileLoading(true);

        try {
            /*
             * viewFolderFile opens a new window, so we don't
             * use it here.
             *
             * Instead use save/download API indirectly through
             * the same endpoint and create a Blob URL locally.
             *
             * The helper below is implemented with fetch through
             * viewFolderFile's endpoint in api/tasks.ts.
             */

            const response = await fetch(
                `${getApiBaseUrl()}/api/${projectId}/folders/${folderId}/files/${fileId}/download`,
                {
                    method: "GET",
                    headers: getAuthHeaders(),
                },
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to load file (${response.status}).`,
                );
            }

            const blob = await response.blob();

            const blobUrl =
                URL.createObjectURL(blob);

            replaceViewingBlobUrl(blobUrl);
        } catch (error) {
            console.error(
                "Failed to preview file:",
                error,
            );

            replaceViewingBlobUrl(null);

            setViewingFileError(
                error instanceof Error
                    ? error.message
                    : "Failed to preview file.",
            );
        } finally {
            setViewingFileLoading(false);
        }
    }

    function closeFileViewer() {
        replaceViewingBlobUrl(null);

        setViewingFile(null);
        setViewingFileError("");
        setViewingFileLoading(false);
    }

    async function handleModalDownload() {
        if (!viewingFile) {
            return;
        }

        const projectId = getFileProjectId(
            viewingFile,
            task?.project_id,
        );

        const folderId = getFileFolderId(
            viewingFile,
            task?.folder_id,
        );

        const fileId = getFileId(viewingFile);

        if (
            projectId === null ||
            folderId === null ||
            fileId === null
        ) {
            return;
        }

        try {
            await saveFolderFile(
                projectId,
                folderId,
                fileId,
                viewingFile.filename,
            );
        } catch (error) {
            console.error(
                "Failed to download file:",
                error,
            );
        }
    }

    /* =====================================================
     * No Task Selected
     * ===================================================== */

    if (!task) {
        return (
            <div className="flex h-full min-h-[500px] items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="text-center">
                    <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />

                    <h3 className="text-lg font-semibold text-slate-700 dark:text-white">
                        No Task Selected
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Select a task to view its details.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                                Task #{task.task_id}
                            </h2>

                            <TaskStatus
                                status={task.status ?? 0}
                            />
                        </div>

                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                            {task.task_type}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                onEdit(task)
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={openAttributes}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Attributes
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setDeleteError("");
                                setShowDeleteConfirm(
                                    true,
                                );
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                            title="Delete task"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* =====================================================
                    CONTENT
                ====================================================== */}

                <div className="grid min-h-0 flex-1 grid-cols-1 overflow-auto lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="min-w-0 space-y-5 p-5">
                        {/* Dates */}

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <DateInfo
                                label="Start Date"
                                value={task.start_date}
                            />

                            <DateInfo
                                label="End Date"
                                value={task.end_date}
                            />
                        </div>

                        {/* Description */}

                        <section>
                            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                                Description
                            </h3>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                                {task.task_description ||
                                    "No description available."}
                            </div>
                        </section>

                        {/* Task Information */}

                        <section>
                            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                                Task Information
                            </h3>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                <ReadOnlyField
                                    label="Project ID"
                                    value={
                                        task.project_id
                                    }
                                />

                                <ReadOnlyField
                                    label="Folder ID"
                                    value={
                                        task.folder_id
                                    }
                                />

                                <ReadOnlyField
                                    label="Template ID"
                                    value={
                                        task.template_id
                                    }
                                />

                                <ReadOnlyField
                                    label="Assigned By"
                                    value={
                                        task.assigned_by
                                    }
                                />

                                <ReadOnlyField
                                    label="Assigned To"
                                    value={
                                        task.assigned_to
                                    }
                                />

                                <ReadOnlyField
                                    label="Document No"
                                    value={
                                        task.document_no
                                    }
                                />

                                <ReadOnlyField
                                    label="Workflow Task ID"
                                    value={
                                        task.wf_task_id
                                    }
                                />
                            </div>
                        </section>

                        {/* Task Files */}

                        <section>
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    Task Files
                                </h3>

                                {taskFiles.length > 0 && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {taskFiles.length} file
                                        {taskFiles.length !==
                                            1
                                            ? "s"
                                            : ""}
                                    </span>
                                )}
                            </div>

                            {filesLoading ? (
                                <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 py-8 dark:border-slate-700">
                                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />

                                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                                        Loading files...
                                    </span>
                                </div>
                            ) : filesError ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                                    {filesError}
                                </div>
                            ) : taskFiles.length ===
                                0 ? (
                                <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center dark:border-slate-700">
                                    <File className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />

                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        No files attached to
                                        this task.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {taskFiles.map(
                                        (file) => (
                                            <TaskFileItem
                                                key={`${file.pffid}-${file.filename}`}
                                                file={file}
                                                projectId={
                                                    task.project_id
                                                }
                                                folderId={
                                                    task.folder_id
                                                }
                                                onView={
                                                    handleViewFile
                                                }
                                            />
                                        ),
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Workflow Actions */}

                        {(hasApproveAction ||
                            hasRejectAction) && (
                                <section>
                                    <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                                        Actions
                                    </h3>

                                    {actionMessage && (
                                        <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0" />

                                            <span>
                                                {
                                                    actionMessage
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {actionError && (
                                        <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                                            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />

                                            <span>
                                                {actionError}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                            Comment
                                            <span className="ml-1 font-normal text-slate-400">
                                                (optional)
                                            </span>
                                        </label>

                                        <textarea
                                            value={actionComment}
                                            onChange={(event) =>
                                                setActionComment(event.target.value)
                                            }
                                            disabled={
                                                !canTakeAction ||
                                                actionLoading !== null
                                            }
                                            rows={3}
                                            placeholder="Add a comment for this approval or rejection..."
                                            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {hasApproveAction && (
                                            <button
                                                type="button"
                                                disabled={
                                                    !canTakeAction ||
                                                    actionLoading !==
                                                    null
                                                }
                                                onClick={() =>
                                                    void handleTaskAction(
                                                        "approve",
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {actionLoading ===
                                                    "approve" ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Check className="h-4 w-4" />
                                                )}

                                                Approve
                                            </button>
                                        )}

                                        {hasRejectAction && (
                                            <button
                                                type="button"
                                                disabled={
                                                    !canTakeAction ||
                                                    actionLoading !==
                                                    null
                                                }
                                                onClick={() =>
                                                    void handleTaskAction(
                                                        "reject",
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {actionLoading ===
                                                    "reject" ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <XCircle className="h-4 w-4" />
                                                )}

                                                Reject
                                            </button>
                                        )}
                                    </div>

                                    {!canTakeAction && (
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            This task is no longer
                                            available for action.
                                        </p>
                                    )}
                                </section>
                            )}
                    </div>

                    {/* RIGHT - WORKFLOW TRACKING */}

                    <div className="border-t border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/30 lg:border-l lg:border-t-0">
                        <WorkflowTracking
                            task={task}
                        />
                    </div>
                </div>

                {/* DELETE CONFIRMATION */}

                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Delete Task
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Are you sure you want
                                        to delete Task #
                                        {task.task_id}?
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowDeleteConfirm(
                                            false,
                                        )
                                    }
                                    disabled={
                                        deleteLoading
                                    }
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {deleteError && (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                                    {deleteError}
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowDeleteConfirm(
                                            false,
                                        )
                                    }
                                    disabled={
                                        deleteLoading
                                    }
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleDelete()
                                    }
                                    disabled={
                                        deleteLoading
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deleteLoading && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}

                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ATTRIBUTES MODAL */}

                {showAttributes &&
                    attributeForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900">
                                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            Task Attributes
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            View and edit task
                                            attributes.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowAttributes(
                                                false,
                                            )
                                        }
                                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <ReadOnlyField
                                            label="Task ID"
                                            value={
                                                attributeForm.task_id
                                            }
                                        />

                                        <AttributeInput
                                            label="Task Type"
                                            value={
                                                attributeForm.task_type
                                            }
                                            onChange={(
                                                value,
                                            ) =>
                                                updateAttribute(
                                                    "task_type",
                                                    value,
                                                )
                                            }
                                        />

                                        <ReadOnlyField
                                            label="Project ID"
                                            value={
                                                attributeForm.project_id
                                            }
                                        />

                                        <ReadOnlyField
                                            label="Folder ID"
                                            value={
                                                attributeForm.folder_id
                                            }
                                        />

                                        <ReadOnlyField
                                            label="Template ID"
                                            value={
                                                attributeForm.template_id
                                            }
                                        />

                                        <ReadOnlyField
                                            label="Assigned By"
                                            value={
                                                attributeForm.assigned_by
                                            }
                                        />

                                        <ReadOnlyField
                                            label="Assigned To"
                                            value={
                                                attributeForm.assigned_to
                                            }
                                        />

                                        <AttributeInput
                                            label="Start Date"
                                            type="date"
                                            value={
                                                attributeForm.start_date
                                            }
                                            onChange={(
                                                value,
                                            ) =>
                                                updateAttribute(
                                                    "start_date",
                                                    value,
                                                )
                                            }
                                        />

                                        <AttributeInput
                                            label="End Date"
                                            type="date"
                                            value={
                                                attributeForm.end_date ??
                                                ""
                                            }
                                            onChange={(
                                                value,
                                            ) =>
                                                updateAttribute(
                                                    "end_date",
                                                    value ||
                                                    null,
                                                )
                                            }
                                        />

                                        <ReadOnlyField
                                            label="Status"
                                            value={
                                                attributeForm.status
                                            }
                                        />

                                        <ReadOnlyField
                                            label="Created Date"
                                            value={
                                                attributeForm.created_date ||
                                                "-"
                                            }
                                        />

                                        <ReadOnlyField
                                            label="Updated Date"
                                            value={
                                                attributeForm.updated_date ||
                                                "-"
                                            }
                                        />

                                        <div className="md:col-span-2">
                                            <AttributeTextarea
                                                label="Task Description"
                                                value={
                                                    attributeForm.task_description
                                                }
                                                onChange={(
                                                    value,
                                                ) =>
                                                    updateAttribute(
                                                        "task_description",
                                                        value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <AttributeTextarea
                                                label="Levels"
                                                value={attributeForm.levels.join(
                                                    ", ",
                                                )}
                                                onChange={(
                                                    value,
                                                ) =>
                                                    updateAttribute(
                                                        "levels",
                                                        value
                                                            .split(
                                                                ",",
                                                            )
                                                            .map(
                                                                (
                                                                    item,
                                                                ) =>
                                                                    item.trim(),
                                                            )
                                                            .filter(
                                                                Boolean,
                                                            ),
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                                            Key Parameters
                                        </h4>

                                        {Object.keys(
                                            attributeForm.key_params,
                                        ).length ===
                                            0 ? (
                                            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                                No key parameters
                                                available.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {Object.entries(
                                                    attributeForm.key_params,
                                                ).map(
                                                    ([
                                                        key,
                                                        value,
                                                    ]) => (
                                                        <KeyParameterField
                                                            key={
                                                                key
                                                            }
                                                            label={
                                                                key
                                                            }
                                                            value={
                                                                value
                                                            }
                                                            onChange={(
                                                                newValue,
                                                            ) =>
                                                                updateKeyParam(
                                                                    key,
                                                                    newValue,
                                                                )
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowAttributes(
                                                false,
                                            )
                                        }
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleUpdateAttributes
                                        }
                                        className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                                    >
                                        Update Attributes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
            </div>

            {/* =====================================================
                FILE PREVIEW MODAL
            ====================================================== */}

            {viewingFile && (
                <FileViewerModal
                    file={viewingFile}
                    fileUrl={viewingFileUrl}
                    isLoading={
                        viewingFileLoading
                    }
                    error={viewingFileError}
                    onClose={closeFileViewer}
                    onDownload={() =>
                        void handleModalDownload()
                    }
                />
            )}
        </>
    );
}

/* =========================================================
 * Workflow Tracking
 * ========================================================= */

function WorkflowTracking({
    task,
}: {
    task: TaskType;
}) {
    const levels = Array.isArray(task.levels)
        ? task.levels
        : [];

    const keyParams = task.key_params ?? {};

    const workflowLevelIndex =
        typeof keyParams.workflow_level_index ===
            "number"
            ? keyParams.workflow_level_index
            : typeof keyParams.workflow_level_index ===
                "string"
                ? Number(
                    keyParams.workflow_level_index,
                )
                : 0;

    const workflowLevelLabel =
        typeof keyParams.workflow_level_label ===
            "string"
            ? keyParams.workflow_level_label
            : typeof keyParams.label === "string"
                ? keyParams.label
                : "";

    const workflowConfigId =
        typeof keyParams.workflow_config_id ===
            "string"
            ? keyParams.workflow_config_id
            : "";

    const currentLevelIndex = Math.max(
        0,
        Math.min(
            workflowLevelIndex,
            Math.max(levels.length - 1, 0),
        ),
    );

    const isCompleted =
        task.status === 1 ||
        task.status === 3;

    const isRejected =
        task.status === 2 ||
        Boolean(
            keyParams.workflow_rejected === true,
        );

    const progress =
        levels.length === 0
            ? 0
            : isCompleted
                ? 100
                : Math.round(
                    (currentLevelIndex /
                        Math.max(
                            levels.length - 1,
                            1,
                        )) *
                    100,
                );

    const statusLabel =
        task.status === 1
            ? "Completed"
            : task.status === 2
                ? "Rejected"
                : task.status === 3
                    ? "Completed"
                    : "In Progress";

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Workflow Tracking
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Current workflow progress and task
                    level.
                </p>
            </div>

            <div>
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Progress
                    </span>

                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {progress}%
                    </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                        className="h-full rounded-full bg-cyan-500 transition-all"
                        style={{
                            width: `${Math.min(
                                Math.max(
                                    progress,
                                    0,
                                ),
                                100,
                            )}%`,
                        }}
                    />
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Status
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {statusLabel}
                </p>

                {workflowLevelLabel && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Current level:{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                            {workflowLevelLabel}
                        </span>
                    </p>
                )}
            </div>

            <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Workflow Levels
                </h4>

                {levels.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        No workflow levels available.
                    </div>
                ) : (
                    <div className="space-y-0">
                        {levels.map(
                            (level, index) => {
                                const completed =
                                    isCompleted ||
                                    index <
                                    currentLevelIndex;

                                const current =
                                    !isCompleted &&
                                    index ===
                                    currentLevelIndex;

                                const rejected =
                                    isRejected &&
                                    index ===
                                    currentLevelIndex;

                                return (
                                    <div
                                        key={`${level}-${index}`}
                                        className="relative flex gap-3"
                                    >
                                        {index <
                                            levels.length -
                                            1 && (
                                                <div
                                                    className={`absolute left-[9px] top-5 h-[calc(100%-4px)] w-px ${completed
                                                        ? "bg-cyan-500"
                                                        : "bg-slate-200 dark:bg-slate-700"
                                                        }`}
                                                />
                                            )}

                                        <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                                            {rejected ? (
                                                <XCircle className="h-5 w-5 text-red-500" />
                                            ) : completed ? (
                                                <Check className="h-5 w-5 text-cyan-600" />
                                            ) : current ? (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-cyan-500 bg-white dark:bg-slate-900">
                                                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                                                </span>
                                            ) : (
                                                <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                                            )}
                                        </div>

                                        <div className="pb-5">
                                            <p
                                                className={`text-sm font-medium ${rejected
                                                    ? "text-red-600 dark:text-red-400"
                                                    : completed ||
                                                        current
                                                        ? "text-slate-800 dark:text-slate-200"
                                                        : "text-slate-400 dark:text-slate-500"
                                                    }`}
                                            >
                                                {level}
                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                                {rejected
                                                    ? "Rejected"
                                                    : completed
                                                        ? "Completed"
                                                        : current
                                                            ? "Current level"
                                                            : "Pending"}
                                            </p>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <ReadOnlyField
                    label="Task ID"
                    value={task.task_id}
                />

                {workflowConfigId && (
                    <ReadOnlyField
                        label="Workflow Config ID"
                        value={
                            workflowConfigId
                        }
                    />
                )}
            </div>
        </div>
    );
}

/* =========================================================
 * Task File
 * ========================================================= */

function TaskFileItem({
    file,
    projectId: taskProjectId,
    folderId: taskFolderId,
    onView,
}: {
    file: TaskFile;
    projectId: number | null;
    folderId: number | null;
    onView: (file: TaskFile) => void;
}) {
    const [loading, setLoading] =
        useState<
            "view" | "download" | null
        >(null);

    /*
     * IMPORTANT:
     *
     * API response uses:
     *   projectid
     *   fid
     *
     * not:
     *   project_id
     *   folder_id
     *
     * So resolve both formats.
     */

    const projectId = getFileProjectId(
        file,
        taskProjectId,
    );

    const folderId = getFileFolderId(
        file,
        taskFolderId,
    );

    const fileId = getFileId(file);

    async function handleView() {
        if (
            projectId === null ||
            folderId === null ||
            fileId === null
        ) {
            console.error(
                "Missing file information:",
                {
                    projectId,
                    folderId,
                    fileId,
                    file,
                },
            );

            return;
        }

        setLoading("view");

        try {
            onView(file);
        } finally {
            setLoading(null);
        }
    }

    async function handleDownload() {
        if (
            projectId === null ||
            folderId === null ||
            fileId === null
        ) {
            console.error(
                "Missing file information:",
                {
                    projectId,
                    folderId,
                    fileId,
                    file,
                },
            );

            return;
        }

        setLoading("download");

        try {
            await saveFolderFile(
                projectId,
                folderId,
                fileId,
                file.filename,
            );
        } catch (error) {
            console.error(
                "Failed to download file:",
                error,
            );
        } finally {
            setLoading(null);
        }
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <File className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>

            <div className="min-w-0 flex-1">
                <p
                    className="truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                    title={file.filename}
                >
                    {file.filename}
                </p>

                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {file.MIME && (
                        <span>
                            {file.MIME}
                        </span>
                    )}

                    {file.MIME &&
                        file.filesize !=
                        null && (
                            <span>•</span>
                        )}

                    {file.filesize !=
                        null && (
                            <span>
                                {formatFileSize(
                                    Number(
                                        file.filesize,
                                    ),
                                )}
                            </span>
                        )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    onClick={() =>
                        void handleView()
                    }
                    disabled={
                        loading !== null
                    }
                    title="View file"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {loading ===
                        "view" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}

                    <span className="hidden sm:inline">
                        View
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        void handleDownload()
                    }
                    disabled={
                        loading !== null
                    }
                    title="Download file"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan-600 px-3 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ===
                        "download" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}

                    <span className="hidden sm:inline">
                        Download
                    </span>
                </button>
            </div>
        </div>
    );
}

/* =========================================================
 * File Viewer Modal
 * ========================================================= */

function FileViewerModal({
    file,
    fileUrl,
    isLoading,
    error,
    onClose,
    onDownload,
}: {
    file: TaskFile;
    fileUrl: string | null;
    isLoading: boolean;
    error: string;
    onClose: () => void;
    onDownload: () => void;
}) {
    const mimeType =
        typeof file.MIME === "string"
            ? file.MIME.toLowerCase()
            : "";

    const filename =
        file.filename || "File";

    const isPdf =
        mimeType === "application/pdf" ||
        filename
            .toLowerCase()
            .endsWith(".pdf");

    const isImage =
        mimeType.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(
            filename,
        );

    const isVideo =
        mimeType.startsWith("video/") ||
        /\.(mp4|webm|ogg|mov)$/i.test(
            filename,
        );

    const isAudio =
        mimeType.startsWith("audio/") ||
        /\.(mp3|wav|ogg|m4a|aac)$/i.test(
            filename,
        );

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
            <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900">
                {/* Header */}

                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div className="min-w-0">
                        <h3
                            className="truncate text-base font-semibold text-slate-900 dark:text-white"
                            title={filename}
                        >
                            {filename}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {file.MIME ||
                                "Unknown file type"}

                            {file.filesize !=
                                null && (
                                    <>
                                        {" • "}
                                        {formatFileSize(
                                            Number(
                                                file.filesize,
                                            ),
                                        )}
                                    </>
                                )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={
                                onDownload
                            }
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />

                            Download
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            title="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}

                <div className="min-h-0 flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-500" />

                                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                    Loading file preview...
                                </p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex h-full items-center justify-center p-6">
                            <div className="max-w-md text-center">
                                <XCircle className="mx-auto h-10 w-10 text-red-500" />

                                <h4 className="mt-3 text-sm font-semibold text-slate-800 dark:text-white">
                                    Unable to preview
                                    file
                                </h4>

                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        onDownload
                                    }
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                                >
                                    <Download className="h-4 w-4" />

                                    Download File
                                </button>
                            </div>
                        </div>
                    ) : !fileUrl ? (
                        <div className="flex h-full items-center justify-center p-6">
                            <div className="text-center">
                                <File className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />

                                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                    Preview is not available
                                    for this file.
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        onDownload
                                    }
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                                >
                                    <Download className="h-4 w-4" />

                                    Download File
                                </button>
                            </div>
                        </div>
                    ) : isPdf ? (
                        <iframe
                            src={fileUrl}
                            title={filename}
                            className="h-full w-full border-0"
                        />
                    ) : isImage ? (
                        <div className="flex h-full items-center justify-center overflow-auto p-6">
                            <img
                                src={fileUrl}
                                alt={filename}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                    ) : isVideo ? (
                        <div className="flex h-full items-center justify-center p-6">
                            <video
                                src={fileUrl}
                                controls
                                className="max-h-full max-w-full"
                            >
                                Your browser does not
                                support video playback.
                            </video>
                        </div>
                    ) : isAudio ? (
                        <div className="flex h-full items-center justify-center p-6">
                            <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                                <FileText className="mx-auto h-12 w-12 text-slate-400" />

                                <p className="mt-3 text-center text-sm font-medium text-slate-800 dark:text-white">
                                    {filename}
                                </p>

                                <audio
                                    src={fileUrl}
                                    controls
                                    className="mt-5 w-full"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center p-6">
                            <div className="max-w-md text-center">
                                <File className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600" />

                                <h4 className="mt-4 text-base font-semibold text-slate-800 dark:text-white">
                                    Preview not supported
                                </h4>

                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    This file type cannot
                                    be displayed directly in
                                    the browser.
                                </p>

                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                    {file.MIME ||
                                        "Unknown file type"}
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        onDownload
                                    }
                                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-700"
                                >
                                    <Download className="h-4 w-4" />

                                    Download File
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================================================
 * API Helpers
 * ========================================================= */

function getApiBaseUrl(): string {
    return "https://bridgeapi.sidpz.com";
}

function getAuthHeaders(): HeadersInit {
    const token =
        localStorage.getItem(
            "access_token",
        );

    if (!token) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`,
    };
}

/* =========================================================
 * Attribute Input
 * ========================================================= */

function AttributeInput({
    label,
    value,
    onChange,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value,
                    )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
        </div>
    );
}

/* =========================================================
 * Attribute Textarea
 * ========================================================= */

function AttributeTextarea({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {label}
            </label>

            <textarea
                rows={3}
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value,
                    )
                }
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
        </div>
    );
}

/* =========================================================
 * Key Parameter
 * ========================================================= */

function KeyParameterField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: unknown;
    onChange: (value: string) => void;
}) {
    const stringValue =
        typeof value === "string"
            ? value
            : Array.isArray(value)
                ? value.join(", ")
                : value !== null &&
                    typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value ?? "");

    return (
        <AttributeTextarea
            label={label}
            value={stringValue}
            onChange={onChange}
        />
    );
}

/* =========================================================
 * Read Only Field
 * ========================================================= */

function ReadOnlyField({
    label,
    value,
}: {
    label: string;
    value: unknown;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {label}
            </label>

            <div className="min-h-[38px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                {value === null ||
                    value === undefined ||
                    value === ""
                    ? "-"
                    : String(value)}
            </div>
        </div>
    );
}

/* =========================================================
 * Date Info
 * ========================================================= */

function DateInfo({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900">
                <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>

            <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {label}
                </p>

                <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {value || "-"}
                </p>
            </div>
        </div>
    );
}

/* =========================================================
 * File Size
 * ========================================================= */

function formatFileSize(
    bytes: number,
): string {
    if (
        !Number.isFinite(bytes) ||
        bytes <= 0
    ) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB",
    ];

    const index = Math.min(
        Math.floor(
            Math.log(bytes) /
            Math.log(1024),
        ),
        units.length - 1,
    );

    const size =
        bytes /
        Math.pow(1024, index);

    return `${size.toFixed(
        index === 0 ? 0 : 1,
    )} ${units[index]}`;
}

export default TaskDetails;
