import {
    useEffect,
    useState,
} from "react";


import {
    Loader2,
    User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { getTasks } from "../../api/tasks";

import type { Task } from "../../types/task";

import TaskList from "../../components/tasks/TaskList";
import TaskDetails from "../../components/tasks/TaskDetails";

function TasksPage() {
    const navigate = useNavigate();

    const [tasks, setTasks] =
        useState<Task[]>([]);

    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        let cancelled = false;

        const loadTasks = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await getTasks();

                if (cancelled) {
                    return;
                }

                const loadedTasks = response ?? [];

                setTasks(loadedTasks);

                const firstPendingTask =
                    loadedTasks.find(
                        (task) => task.status !== 3
                    );

                setSelectedTask(
                    firstPendingTask ?? null
                );
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

    const pendingTasks =
        tasks.filter(
            (task) =>
                task.status !== 3
        );

    const handleDeleted = (
        taskId: number
    ) => {
        setTasks((previous) =>
            previous.filter(
                (task) =>
                    task.task_id !== taskId
            )
        );

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
                        Loading tasks...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-90px)] flex-col bg-gray-50 dark:bg-gray-950">

            {/* Error */}
            {error && (
                <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="min-h-0 flex-1 p-5">

                <div className="grid h-full min-h-0 grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)_340px]">

                    {/* =========================
            TASK LIST CARD
        ========================== */}
                    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                        <div className="shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Tasks ({pendingTasks.length})
                            </h1>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Manage task details and track progress
                            </p>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <TaskList
                                tasks={pendingTasks}
                                selectedTask={selectedTask}
                                onSelect={setSelectedTask}
                            />
                        </div>

                    </section>


                    {/* =========================
            TASK DETAILS CARD
        ========================== */}
                    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                        <div className="shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Task Details
                            </h2>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Selected task information
                            </p>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide flex">
                            <TaskDetails
                                task={selectedTask}
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

                    </section>


                    {/* =========================
            TASK LOGS CARD
        ========================== */}
                    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                        {/* Logs Header */}
                        <div className="shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Task Logs
                            </h2>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Activity and history
                            </p>
                        </div>

                        {/* Logs Content */}
                        <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-hide">

                            {/* TASK CREATED */}
                            <div className="rounded-xl border border-green-300 bg-white p-4 shadow-sm dark:border-green-800 dark:bg-gray-900">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
                                        <User
                                            size={15}
                                            className="text-green-600 dark:text-green-400"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                            Task created by: Admin
                                        </p>

                                        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                                            Sep 4, 2026 · 09:30 AM
                                        </p>
                                    </div>

                                </div>

                            </div>


                            {/* Arrow */}
                            <div className="flex h-7 items-center justify-center">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-400">
                                    ↓
                                </div>
                            </div>


                            {/* USER 1 */}
                            <div className="rounded-xl border border-green-300 bg-white p-4 shadow-sm dark:border-green-800 dark:bg-gray-900">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
                                        <User
                                            size={15}
                                            className="text-green-600 dark:text-green-400"
                                        />
                                    </div>

                                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                        User 1001
                                    </p>

                                </div>

                                <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/70">

                                    <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                                        uploaded-file.pdf
                                    </p>

                                    <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                                        Sep 4, 2026 · 10:15 AM
                                    </p>

                                </div>

                                <div className="mt-3">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                        ✓ Accepted
                                    </span>
                                </div>

                            </div>


                            {/* Arrow */}
                            <div className="flex h-7 items-center justify-center">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-400">
                                    ↓
                                </div>
                            </div>


                            {/* USER 2 - CURRENT */}
                            <div className="rounded-xl border border-yellow-300 bg-white p-4 shadow-sm dark:border-yellow-700 dark:bg-gray-900">

                                <div className="flex items-center justify-between gap-3">

                                    <div className="flex min-w-0 items-center gap-2.5">

                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-900/20">
                                            <User
                                                size={15}
                                                className="text-yellow-600 dark:text-yellow-400"
                                            />
                                        </div>

                                        <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                                            User 1002
                                        </p>

                                    </div>

                                    <span className="shrink-0 rounded-full bg-yellow-50 px-2.5 py-1 text-[10px] font-semibold text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                                        Pending
                                    </span>

                                </div>

                                <div className="mt-3 flex min-w-0 items-center gap-1.5">

                                    <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                                        second-file.pdf
                                    </p>

                                    <span className="shrink-0 text-xs text-gray-300 dark:text-gray-600">
                                        :
                                    </span>

                                    <p className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                                        Sep 4, 2026 · 11:05 AM
                                    </p>

                                </div>

                            </div>


                            {/* Arrow */}
                            <div className="flex h-7 items-center justify-center">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                                    ↓
                                </div>
                            </div>


                            {/* USER 3 */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                        <User
                                            size={15}
                                            className="text-gray-400 dark:text-gray-500"
                                        />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            User 1003
                                        </p>

                                        <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                                            In queue
                                        </p>
                                    </div>

                                </div>

                            </div>


                            {/* Arrow */}
                            <div className="flex h-7 items-center justify-center">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600">
                                    ↓
                                </div>
                            </div>


                            {/* USER 4 */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                        <User
                                            size={15}
                                            className="text-gray-400 dark:text-gray-500"
                                        />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            User 1004
                                        </p>

                                        <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                                            In queue
                                        </p>
                                    </div>

                                </div>

                            </div>


                            {/* Arrow */}
                            <div className="flex h-7 items-center justify-center">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600">
                                    ↓
                                </div>
                            </div>


                            {/* USER 5 */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                        <User
                                            size={15}
                                            className="text-gray-400 dark:text-gray-500"
                                        />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            User 1005
                                        </p>

                                        <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                                            In queue
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </section>

                </div>
            </div>
        </div>
    );
}

export default TasksPage;
