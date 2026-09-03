import {
    CalendarDays,
    Clock3,
    Folder,
} from "lucide-react";

import type { Task } from "../../types/task";
import TaskStatus from "./TaskStatus";

interface TaskCardProps {
    task: Task;
    selected?: boolean;
    onClick: () => void;
}

function TaskCard({
    task,
    selected = false,
    onClick,
}: TaskCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "w-full rounded-xl border p-4 text-left transition-all duration-200",

                selected
                    ? [
                        // Light mode - active
                        "border-sky-500 bg-sky-100 shadow-lg ring-2 ring-sky-500/20",

                        // Dark mode - active
                        "dark:border-sky-400 dark:bg-gray-700 dark:ring-sky-400/30 dark:shadow-sky-950/30",
                    ].join(" ")
                    : [
                        // Light mode - normal
                        "border-sky-200 bg-sky-50 hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-100 hover:shadow-md",

                        // Dark mode - normal
                        "dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700",
                    ].join(" "),
            ].join(" ")}
        >
            <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                    <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {task.task_type || "Untitled Task"}
                    </h3>

                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        Task #{task.task_id}
                    </p>

                </div>

                <TaskStatus status={task.status} />

            </div>

            <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-700 dark:text-gray-300">
                {task.task_description || "No description available."}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">

                <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">

                    <CalendarDays
                        size={14}
                        className="text-gray-500 dark:text-gray-400"
                    />

                    <span>
                        {task.start_date || "N/A"}
                    </span>

                    <span>→</span>

                    <span>
                        {task.end_date || "N/A"}
                    </span>

                </div>

            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">

                <Folder
                    size={14}
                    className="text-gray-500 dark:text-gray-400"
                />

                <span>
                    Folder #{task.folder_id}
                </span>

            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">

                <Clock3
                    size={13}
                />

                {task.status === 3
                    ? "Task completed"
                    : task.status === 2
                        ? "Currently in progress"
                        : "Waiting for completion"}

            </div>
        </button>
    );
}

export default TaskCard;
