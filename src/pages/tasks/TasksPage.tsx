import {
    useEffect,
    useState,
} from "react";

import {
    CalendarDays,
    Loader2,
    Package,
    // User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { getTasks } from "../../api/tasks";

import type { Task } from "../../types/task";

import TaskList from "../../components/tasks/TaskList";
import TaskDetails from "../../components/tasks/TaskDetails";


// import { getUserLogs } from "../../api/userLogs";
// import type { UserLog } from "../../api/userLogs";


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

    /*
    const [logs, setLogs] =
        useState<UserLog[]>([]);

    const [logsLoading, setLogsLoading] =
        useState(false);

    const [logsError, setLogsError] =
        useState("");
    */

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

                const loadedTasks =
                    response ?? [];

                setTasks(
                    loadedTasks
                );


                const firstPendingTask =
                    loadedTasks.find(
                        (task) =>
                            task.status !== 3
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

        /*
        const loadLogs = async () => {
            try {
                setLogsLoading(true);
                setLogsError("");

                const response =
                    await getUserLogs();

                if (cancelled) {
                    return;
                }

                setLogs(
                    response
                );

            } catch (err) {

                if (!cancelled) {

                    setLogsError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load user logs."
                    );

                }

            } finally {

                if (!cancelled) {
                    setLogsLoading(false);
                }

            }
        };
        */


        void loadTasks();

        /*
        void loadLogs();
        */


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

        setTasks(
            (previous) =>
                previous.filter(
                    (task) =>
                        task.task_id !== taskId
                )
        );

        setSelectedTask(
            null
        );
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

            {error && (

                <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">

                    {error}

                </div>

            )}


            <div className="min-h-0 flex-1 p-5">

                <div className="grid h-full min-h-0 grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)_340px]">


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

                    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                        <div className="shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">

                                Task Details

                            </h2>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">

                                Selected task information

                            </p>

                        </div>

                        <div className="flex min-h-0 flex-1 overflow-y-auto scrollbar-hide">

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
                                onDeleted={
                                    handleDeleted
                                }
                            />

                        </div>

                    </section>

                    {/*

                    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                        <div className="shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">

                                Task Logs

                            </h2>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">

                                Activity and history

                            </p>

                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-hide">


                            {logsLoading ? (

                                <div className="flex h-full items-center justify-center">

                                    <div className="text-center">

                                        <Loader2
                                            size={24}
                                            className="mx-auto animate-spin text-gray-400"
                                        />

                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">

                                            Loading logs...

                                        </p>

                                    </div>

                                </div>

                            ) : logsError ? (

                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">

                                    {logsError}

                                </div>

                            ) : logs.length === 0 ? (

                                <div className="flex h-full items-center justify-center">

                                    <div className="text-center">

                                        <User
                                            size={28}
                                            className="mx-auto text-gray-300 dark:text-gray-600"
                                        />

                                        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">

                                            No activity yet

                                        </p>

                                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">

                                            User activity will appear here.

                                        </p>

                                    </div>

                                </div>

                            ) : (

                                <div className="space-y-3">

                                    {logs.map(
                                        (log, index) => (

                                            <div
                                                key={log.lid}
                                            >

                                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">

                                                    <div className="flex items-start gap-3">

                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">

                                                            <User
                                                                size={15}
                                                                className="text-gray-500 dark:text-gray-400"
                                                            />

                                                        </div>


                                                        <div className="min-w-0 flex-1">

                                                            <div className="flex items-start justify-between gap-2">

                                                                <p className="text-xs font-semibold text-gray-900 dark:text-white">

                                                                    User {log.userid}

                                                                </p>

                                                                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">

                                                                    {log.event}

                                                                </span>

                                                            </div>

                                                            <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-300">

                                                                {log.discription ||
                                                                    "No description"}

                                                            </p>

                                                            <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">

                                                                {new Date(
                                                                    log.datetime
                                                                ).toLocaleString()}

                                                            </p>

                                                        </div>

                                                    </div>

                                                </div>

                                                {index <
                                                    logs.length - 1 && (

                                                    <div className="flex h-7 items-center justify-center">

                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">

                                                            ↓

                                                        </div>

                                                    </div>

                                                )}

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                    </section>

                    */}




                    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                        <div className="shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                            <div className="flex items-center gap-3">


                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">

                                    <Package
                                        size={18}
                                        className="text-gray-600 dark:text-gray-300"
                                    />

                                </div>


                                <div>

                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">

                                        Asset Purchase Request

                                    </h2>

                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">

                                        Request details

                                    </p>

                                </div>

                            </div>

                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5 scrollbar-hide">

                            <div className="space-y-5">

                                <div>

                                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">

                                        Asset to be Purchased

                                    </p>

                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">

                                        MacBook Pro

                                    </p>

                                </div>

                                <div>

                                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">

                                        Asset Type

                                    </p>

                                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">

                                        Laptop

                                    </p>

                                </div>

                                <div>

                                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">

                                        Asset Description

                                    </p>

                                    <div className="mt-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">

                                        <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">

                                            MacBook Pro with 16GB RAM, 512GB SSD
                                            and suitable configuration for
                                            development work.

                                        </p>

                                    </div>

                                </div>

                                <div>

                                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">

                                        Required Date

                                    </p>

                                    <div className="mt-1 flex items-center gap-2">

                                        <CalendarDays
                                            size={14}
                                            className="text-gray-400"
                                        />

                                        <p className="text-sm text-gray-700 dark:text-gray-300">

                                            20 September 2026

                                        </p>

                                    </div>

                                </div>

                                <div>

                                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">

                                        Purchase Reason

                                    </p>

                                    <div className="mt-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">

                                        <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">

                                            Required for the development team
                                            to work on the new project.

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
