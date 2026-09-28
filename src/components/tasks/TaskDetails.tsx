import { useEffect, useState } from "react";

import {
    CalendarDays,
    File,
    FileText,
    Loader2,
    Pencil,
    SlidersHorizontal,
    Trash2,
    User,
    X,
} from "lucide-react";

import {
    deleteTask,
    getTaskFiles,
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

/* =========================================================
   Component
========================================================= */

function TaskDetails({
    task,
    onEdit,
    onDeleted,
}: TaskDetailsProps) {
    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    const [deleteError, setDeleteError] =
        useState("");

    const [showAttributes, setShowAttributes] =
        useState(false);

    const [attributeForm, setAttributeForm] =
        useState<Task | null>(null);

    const [taskFiles, setTaskFiles] =
        useState<TaskFile[]>([]);

    const [filesLoading, setFilesLoading] =
        useState(false);

    const [filesError, setFilesError] =
        useState("");

    /* =========================================================
       Load Task Files
    ========================================================= */

    useEffect(() => {
        if (!task) {
            return;
        }

        let cancelled = false;

        const loadTaskFiles = async () => {
            setFilesLoading(true);
            setFilesError("");

            try {
                const files = await getTaskFiles(
                    task.task_id,
                );

                if (!cancelled) {
                    setTaskFiles(files);
                }
            } catch (err) {
                if (!cancelled) {
                    setTaskFiles([]);

                    setFilesError(
                        err instanceof Error
                            ? err.message
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
                        Select a task from the list to view
                        its details.
                    </p>
                </div>
            </div>
        );
    }

    /* =========================================================
       Delete
    ========================================================= */

    const handleDelete = async () => {
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
                    : "Failed to delete task.",
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    /* =========================================================
       Attributes
    ========================================================= */

    const openAttributes = () => {
        setAttributeForm({
            ...task,
            levels: task.levels
                ? [...task.levels]
                : [],
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

    const updateKeyParam = (
        key: string,
        value: string,
    ) => {
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

            {/* =================================================
                Header
            ================================================= */}

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
                    </div>

                    <div className="flex shrink-0 items-center gap-2">

                        {/* Attributes */}
                        <button
                            type="button"
                            onClick={openAttributes}
                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            <SlidersHorizontal
                                size={14}
                            />

                            Attributes
                        </button>

                        {/* Edit */}
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

                        {/* Delete */}
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

            {/* =================================================
                Content
            ================================================= */}

            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">

                <div className="space-y-7 p-6">

                    {/* Delete error */}
                    {deleteError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                            {deleteError}
                        </div>
                    )}

                    {/* Delete confirmation */}
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
                                    onClick={handleDelete}
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

                    {/* =================================================
                        Dates
                    ================================================= */}

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

                    {/* =================================================
                        Description
                    ================================================= */}

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

                    {/* =================================================
                        Task Files
                    ================================================= */}

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

                            {!filesLoading &&
                                taskFiles.length > 0 && (
                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        {taskFiles.length}{" "}
                                        {taskFiles.length === 1
                                            ? "file"
                                            : "files"}
                                    </span>
                                )}

                        </div>

                        <div className="mt-4">

                            {/* Loading */}
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

                            {/* Error */}
                            {!filesLoading &&
                                filesError && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                        {filesError}
                                    </div>
                                )}

                            {/* Empty */}
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
                                            Files uploaded for this task will appear here.
                                        </p>

                                    </div>
                                )}

                            {/* Files */}
                            {!filesLoading &&
                                !filesError &&
                                taskFiles.length > 0 && (
                                    <div className="space-y-2">

                                        {taskFiles.map(
                                            (file) => (
                                                <TaskFileItem
                                                    key={
                                                        file.pffid
                                                    }
                                                    file={file}
                                                />
                                            ),
                                        )}

                                    </div>
                                )}

                        </div>

                    </section>

                    {/* =================================================
                        Task Users
                    ================================================= */}

                    <section>

                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Task Users:
                        </h3>

                        <div className="mt-4 space-y-3">

                            <TaskUser
                                label="Assigned By"
                                value={String(
                                    task.assigned_by ??
                                    "N/A",
                                )}
                            />

                            <TaskUser
                                label="Assigned To"
                                value={String(
                                    task.assigned_to ??
                                    "N/A",
                                )}
                            />

                        </div>

                    </section>

                </div>
            </div>

            {/* =================================================
                Attributes Modal
            ================================================= */}

            {showAttributes &&
                attributeForm && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
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

                                    {/* Task ID */}
                                    <ReadOnlyField
                                        label="Task ID"
                                        value={String(
                                            attributeForm.task_id,
                                        )}
                                    />

                                    {/* Task Type */}
                                    <AttributeInput
                                        label="Task Type"
                                        value={
                                            attributeForm.task_type ??
                                            ""
                                        }
                                        onChange={(value) =>
                                            updateAttribute(
                                                "task_type",
                                                value,
                                            )
                                        }
                                    />

                                    {/* Project ID */}
                                    <AttributeInput
                                        label="Project ID"
                                        type="number"
                                        value={
                                            attributeForm.project_id ??
                                            ""
                                        }
                                        onChange={(value) =>
                                            updateAttribute(
                                                "project_id",
                                                value === ""
                                                    ? null
                                                    : Number(value),
                                            )
                                        }
                                    />

                                    {/* Folder ID */}
                                    <AttributeInput
                                        label="Folder ID"
                                        type="number"
                                        value={
                                            attributeForm.folder_id ??
                                            ""
                                        }
                                        onChange={(value) =>
                                            updateAttribute(
                                                "folder_id",
                                                value === ""
                                                    ? null
                                                    : Number(value),
                                            )
                                        }
                                    />

                                    {/* Template ID */}
                                    <AttributeInput
                                        label="Template ID"
                                        type="number"
                                        value={
                                            attributeForm.template_id ??
                                            ""
                                        }
                                        onChange={(value) =>
                                            updateAttribute(
                                                "template_id",
                                                value === ""
                                                    ? null
                                                    : Number(value),
                                            )
                                        }
                                    />

                                    {/* Assigned By */}
                                    <AttributeInput
                                        label="Assigned By"
                                        type="number"
                                        value={
                                            attributeForm.assigned_by ??
                                            ""
                                        }
                                        onChange={(value) =>
                                            updateAttribute(
                                                "assigned_by",
                                                value === ""
                                                    ? 0
                                                    : Number(value),
                                            )
                                        }
                                    />

                                    {/* Assigned To */}
                                    <AttributeInput
                                        label="Assigned To"
                                        type="number"
                                        value={
                                            attributeForm.assigned_to ??
                                            ""
                                        }
                                        onChange={(value) =>
                                            updateAttribute(
                                                "assigned_to",
                                                value === ""
                                                    ? 0
                                                    : Number(value),
                                            )
                                        }
                                    />

                                    {/* Start Date */}
                                    <AttributeInput
                                        label="Start Date"
                                        type="date"
                                        value={
                                            attributeForm.start_date ??
                                            ""
                                        }
                                        onChange={(value) =>
                                            updateAttribute(
                                                "start_date",
                                                value,
                                            )
                                        }
                                    />

                                    {/* End Date */}
                                    <AttributeInput
                                        label="End Date"
                                        type="date"
                                        value={
                                            attributeForm.end_date ??
                                            ""
                                        }
                                        onChange={(value) =>
                                            updateAttribute(
                                                "end_date",
                                                value,
                                            )
                                        }
                                    />

                                    {/* Status */}
                                    <AttributeInput
                                        label="Status"
                                        type="number"
                                        value={
                                            attributeForm.status ??
                                            ""
                                        }
                                        onChange={(value) =>
                                            updateAttribute(
                                                "status",
                                                value === ""
                                                    ? undefined
                                                    : Number(value),
                                            )
                                        }
                                    />

                                    {/* Created Date */}
                                    <ReadOnlyField
                                        label="Created Date"
                                        value={
                                            attributeForm.created_date ||
                                            "N/A"
                                        }
                                    />

                                    {/* Updated Date */}
                                    <ReadOnlyField
                                        label="Updated Date"
                                        value={
                                            attributeForm.updated_date ||
                                            "N/A"
                                        }
                                    />

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <AttributeTextarea
                                            label="Task Description"
                                            value={
                                                attributeForm.task_description ??
                                                ""
                                            }
                                            onChange={(value) =>
                                                updateAttribute(
                                                    "task_description",
                                                    value,
                                                )
                                            }
                                        />
                                    </div>

                                    {/* Levels */}
                                    <div className="md:col-span-2">
                                        <AttributeInput
                                            label="Levels"
                                            value={
                                                attributeForm.levels?.join(
                                                    ", ",
                                                ) ?? ""
                                            }
                                            onChange={(value) =>
                                                updateAttribute(
                                                    "levels",
                                                    value
                                                        .split(",")
                                                        .map(
                                                            (item) =>
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
                                            attributeForm.key_params ??
                                            {},
                                        ).length === 0 ? (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                No key parameters available.
                                            </p>
                                        ) : (
                                            Object.entries(
                                                attributeForm.key_params ??
                                                {},
                                            ).map(
                                                ([key, value]) => (
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
                                                                    : String(
                                                                        value,
                                                                    )
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateKeyParam(
                                                                    key,
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-500"
                                                        />
                                                    </div>
                                                ),
                                            )
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
                                        // API will be added later.
                                    }}
                                    className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                                >
                                    <SlidersHorizontal
                                        size={14}
                                    />

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
   Task File Item
========================================================= */

interface TaskFileItemProps {
    file: TaskFile;
}

function TaskFileItem({
    file,
}: TaskFileItemProps) {
    const fileSize = formatFileSize(
        file.filesize,
    );

    const fileType =
        file.MIME ||
        "Unknown file type";

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
   Format File Size
========================================================= */

function formatFileSize(
    size: number | undefined,
): string {
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
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    }

    return `${(
        bytes /
        (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
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
                onChange={(event) =>
                    onChange(event.target.value)
                }
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
                onChange={(event) =>
                    onChange(event.target.value)
                }
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

/* =========================================================
   Task User
========================================================= */

interface TaskUserProps {
    label: string;
    value: string;
}

function TaskUser({
    label,
    value,
}: TaskUserProps) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">

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

export default TaskDetails;