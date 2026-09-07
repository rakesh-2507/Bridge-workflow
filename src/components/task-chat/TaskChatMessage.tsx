import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    FolderKanban,
} from "lucide-react";

import type { TaskChatMessage as TaskChatMessageType } from "../../types/taskChat";

interface TaskChatMessageProps {
    message: TaskChatMessageType;
    onClick: () => void;
    isSelected?: boolean;
}

function getStatus(status?: number) {
    switch (status) {
        case 2:
            return {
                label: "Rejected",
                className:
                    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400",
                icon: Clock3,
            };

        case 1:
            return {
                label: "Completed",
                className:
                    "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-400",
                icon: CheckCircle2,
            };

        default:
            return {
                label: "Pending",
                className:
                    "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-400",
                icon: Clock3,
            };
    }
}

function formatDate(dateString?: string) {
    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString([], {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function TaskChatMessage({
    message,
    onClick,
    isSelected = false,
}: TaskChatMessageProps) {
    const { task, isAssignedByMe } = message;

    const status = getStatus(task.status);
    const StatusIcon = status.icon;

    return (
        <div
            className={`flex w-full ${
                isAssignedByMe
                    ? "justify-end"
                    : "justify-start"
            }`}
        >
            <button
                type="button"
                onClick={onClick}
                className={`w-1/2 cursor-pointer text-left transition ${
                    isSelected
                        ? "scale-[1.01]"
                        : "hover:scale-[1.005]"
                }`}
            >
                <div
                    className={`rounded-2xl border px-4 py-3 shadow-sm transition ${
                        isSelected
                            ? "border-sky-400 ring-2 ring-sky-100 dark:border-sky-600 dark:ring-sky-950"
                            : "border-gray-200 dark:border-gray-800"
                    } ${
                        isAssignedByMe
                            ? "rounded-br-md bg-gray-50 dark:bg-gray-900"
                            : "rounded-bl-md bg-white dark:bg-gray-900"
                    }`}
                >
                    {/* Task type + Status */}
                    <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <FileText
                                size={16}
                                className="shrink-0 text-gray-500 dark:text-gray-400"
                            />

                            <span className="truncate text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {task.task_type || "Task"}
                            </span>
                        </div>

                        <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${status.className}`}
                        >
                            <StatusIcon size={13} />
                            {status.label}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-800 dark:text-gray-200">
                        {task.task_description ||
                            "No description"}
                    </p>

                    {/* Project / Folder */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        <div className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            <FolderKanban size={13} />

                            Project #{task.project_id}
                        </div>

                        <div className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Folder #{task.folder_id}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-2 dark:border-gray-800">
                        {task.start_date && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <CalendarDays size={13} />

                                <span>
                                    Start:{" "}
                                    {formatDate(
                                        task.start_date
                                    )}
                                </span>
                            </div>
                        )}

                        {task.end_date && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <CalendarDays size={13} />

                                <span>
                                    End:{" "}
                                    {formatDate(
                                        task.end_date
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Task time */}
                    <div className="mt-2 text-right text-[11px] text-gray-400 dark:text-gray-500">
                        {formatDate(task.start_date)}
                    </div>
                </div>
            </button>
        </div>
    );
}

export default TaskChatMessage;
