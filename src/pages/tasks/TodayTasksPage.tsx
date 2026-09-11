import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Loader2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
    getTasks,
    getAssetPurchaseTasks,
} from "../../api/tasks";

import type { Task } from "../../types/task";

import TaskDateStrip from "../../components/tasks/TaskDateStrip";
import TaskList from "../../components/tasks/TaskList";
import TaskDetails from "../../components/tasks/TaskDetails";

function TodayTasksPage() {
    const navigate = useNavigate();

    const today =
        getDateKey(new Date());

    const [selectedDate, setSelectedDate] =
        useState(today);

    const [tasks, setTasks] =
        useState<Task[]>([]);

    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /*
     * Get number of tasks for a specific date.
     */
    const getTaskCount = (
        date: string
    ): number => {
        return tasks.filter((task) => {
            if (!task.start_date) {
                return false;
            }

            const start =
                normalizeDate(task.start_date);

            // Normal task: use start → end
            // Purchase task: no end date, so start is the only date
            const end = task.end_date
                ? normalizeDate(task.end_date)
                : start;

            return (
                date >= start &&
                date <= end
            );
        }).length;
    };
    /*
     * Load tasks.
     */
    useEffect(() => {
        let cancelled = false;

        const loadTasks = async () => {
            try {
                setLoading(true);
                setError("");

                const [
                    normalTasks,
                    assetPurchaseTasks,
                ] = await Promise.all([
                    getTasks(),
                    getAssetPurchaseTasks(),
                ]);

                if (!cancelled) {
                    setTasks([
                        ...(normalTasks ?? []),
                        ...(assetPurchaseTasks ?? []),
                    ]);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load tasks."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadTasks();

        return () => {
            cancelled = true;
        };

    }, []);


    /*
     * Tasks that belong to the currently
     * selected date.
     */
    const dateTasks =
        useMemo(() => {
            return tasks.filter((task) => {
                if (!task.start_date) {
                    return false;
                }

                const start =
                    normalizeDate(task.start_date);

                // Normal task:
                //   start_date → end_date
                //
                // Purchase task:
                //   start_date only
                const end = task.end_date
                    ? normalizeDate(task.end_date)
                    : start;

                return (
                    selectedDate >= start &&
                    selectedDate <= end
                );
            });
        }, [
            tasks,
            selectedDate,
        ]);    /*
     * The task displayed as active.
     *
     * If the user has selected a task and
     * that task belongs to the current date,
     * keep it selected.
     *
     * Otherwise, automatically use the
     * first pending task for the selected date.
     */
    const activeTask =
        useMemo(() => {
            if (selectedTask) {
                const selectedTaskStillVisible =
                    dateTasks.some(
                        (task) =>
                            task.task_id ===
                            selectedTask.task_id
                    );

                if (
                    selectedTaskStillVisible
                ) {
                    return selectedTask;
                }
            }

            return (
                dateTasks.find(
                    (task) =>
                        task.status !== 3
                ) ?? null
            );
        }, [
            dateTasks,
            selectedTask,
        ]);

    /*
     * Delete task.
     */
    const handleDeleted = (
        taskId: number
    ) => {
        setTasks((previous) =>
            previous.filter(
                (task) =>
                    task.task_id !==
                    taskId
            )
        );

        setSelectedTask(null);
    };

    /*
     * Change selected date.
     *
     * We intentionally do not call
     * setSelectedTask here.
     *
     * activeTask is derived from dateTasks,
     * so when the date changes it will
     * automatically fall back to the first
     * pending task for that date.
     */
    const handleDateChange = (
        date: string
    ) => {
        setSelectedDate(date);
        setSelectedTask(null);
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center">
                    <Loader2
                        size={30}
                        className="mx-auto animate-spin text-gray-400"
                    />

                    <p className="mt-3 text-sm text-gray-500">
                        Loading today's tasks...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-85px)] min-w-0 flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">

            {/* Date Strip */}
            <TaskDateStrip
                selectedDate={
                    selectedDate
                }
                onDateChange={
                    handleDateChange
                }
                getTaskCount={
                    getTaskCount
                }
            />

            {/* Error */}
            {error && (
                <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="min-h-0 flex-1">
                <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)]">

                    {/* =================================================
            TASK LIST
            Parent owns scrolling
        ================================================= */}
                    <div className="min-h-0 overflow-y-auto scrollbar-hide">
                        <TaskList
                            tasks={dateTasks}
                            selectedTask={activeTask}
                            onSelect={setSelectedTask}
                            title={`Tasks for ${formatShortDate(
                                selectedDate
                            )}`}
                        />
                    </div>

                    {/* =================================================
            TASK DETAILS
        ================================================= */}
                    <div className="min-h-0 overflow-y-auto scrollbar-hide">
                        <TaskDetails
                            task={activeTask}
                            onEdit={(task) =>
                                navigate(
                                    `/tasks/${task.task_id}/edit`,
                                    {
                                        state: {
                                            task,
                                        },
                                    }
                                )
                            }
                            onDeleted={handleDeleted}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}

/*
 * Convert Date to YYYY-MM-DD.
 */
function getDateKey(
    date: Date
): string {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/*
 * Normalize API date values to YYYY-MM-DD.
 */
function normalizeDate(
    date: string
): string {
    return date.slice(0, 10);
}

/*
 * Format selected date for the task
 * list heading.
 */
function formatShortDate(
    dateKey: string
): string {
    const date =
        new Date(
            `${dateKey}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
        }
    );
}

export default TodayTasksPage;
