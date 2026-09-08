import {
    useEffect,
    useState,
} from "react";

import {
    ChevronDown,
    Loader2,
    Package,
    User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { getTasks } from "../../api/tasks";
import type { Task } from "../../types/task";

import TaskList from "../../components/tasks/TaskList";
import TaskDetails from "../../components/tasks/TaskDetails";

import AssetPurchaseQuoteForm from "../../components/asset-purchase/AssetPurchaseQuoteForm";

import { getUserLogs } from "../../api/userLogs";
import type { UserLog } from "../../api/userLogs";


function TasksPage() {

    const navigate = useNavigate();


    // =========================================================
    // TASK STATE
    // =========================================================

    const [tasks, setTasks] =
        useState<Task[]>([]);

    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // =========================================================
    // LOG STATE
    // =========================================================

    const [logs, setLogs] =
        useState<UserLog[]>([]);

    const [logsLoading, setLogsLoading] =
        useState(false);

    const [logsError, setLogsError] =
        useState("");


    // =========================================================
    // ACCORDION STATE
    //
    // null = use role-based default
    // =========================================================

    const [activePanel, setActivePanel] =
        useState<"logs" | "quote" | null>(null);


    // =========================================================
    // LOAD TASKS
    // =========================================================

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

        void loadTasks();

        return () => {

            cancelled = true;

        };

    }, []);


    // =========================================================
    // LOAD USER LOGS
    // =========================================================

    useEffect(() => {

        let cancelled = false;

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
                    response ?? []
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

        void loadLogs();

        return () => {

            cancelled = true;

        };

    }, []);


    // =========================================================
    // PENDING TASKS
    // =========================================================

    const pendingTasks =
        tasks.filter(
            (task) =>
                task.status !== 3
        );


    // =========================================================
    // CHECK WHETHER QUOTE IS ALLOWED
    //
    // ONLY Assets-Executive can see Vendor Quote.
    //
    // null / undefined / other roles:
    // quote remains hidden.
    // =========================================================

    const canPrepareQuote =
        selectedTask?.key_params?.role ===
        "Assets-Executive";


    // =========================================================
    // DEFAULT PANEL
    //
    // Assets-Executive -> Quote
    // Everyone else     -> Logs
    // =========================================================

    const defaultPanel: "logs" | "quote" =
        canPrepareQuote
            ? "quote"
            : "logs";


    // =========================================================
    // CURRENT PANEL
    // =========================================================

    const currentPanel =
        activePanel ?? defaultPanel;


    // =========================================================
    // DELETE TASK
    // =========================================================

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

        setActivePanel(
            null
        );

    };


    // =========================================================
    // SELECT TASK
    //
    // TaskList expects:
    // (task: Task | null) => void
    //
    // So this handler MUST also accept null.
    // =========================================================

    const handleSelectTask = (
        task: Task | null
    ) => {

        setSelectedTask(
            task
        );

        // Reset manual accordion selection.
        // The next render will use the correct
        // role-based default panel.
        setActivePanel(
            null
        );

    };


    // =========================================================
    // ACCORDION TOGGLE
    // =========================================================

    const togglePanel = (
        panel: "logs" | "quote"
    ) => {

        setActivePanel(
            (current) =>
                current === panel
                    ? null
                    : panel
        );

    };


    // =========================================================
    // LOADING
    // =========================================================

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


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="flex h-[calc(100vh-90px)] flex-col bg-gray-50 dark:bg-gray-950">


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">

                    {error}

                </div>

            )}


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <div className="min-h-0 flex-1 p-5">

                <div className="grid h-full min-h-0 grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)_340px]">


                    {/* =================================================
                        LEFT - TASK LIST
                    ================================================= */}

                    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                        {/* HEADER */}

                        <div className="shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Tasks ({pendingTasks.length})
                            </h1>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Manage task details and track progress
                            </p>

                        </div>


                        {/* TASK LIST */}

                        <div className="min-h-0 flex-1 overflow-y-auto">

                            <TaskList
                                tasks={pendingTasks}
                                selectedTask={selectedTask}
                                onSelect={handleSelectTask}
                            />

                        </div>

                    </section>


                    {/* =================================================
                        MIDDLE - TASK DETAILS
                    ================================================= */}

                    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                        {/* HEADER */}

                        <div className="shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Task Details
                            </h2>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Selected task information
                            </p>

                        </div>


                        {/* DETAILS */}

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


                    {/* =================================================
                        RIGHT SIDE
                    ================================================= */}

                    <section className="min-h-0 overflow-y-auto scrollbar-hide">

                        <div className="space-y-4">


                            {/* =================================================
                                TASK LOGS CARD
                            ================================================= */}

                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                                {/* LOG HEADER */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        togglePanel("logs")
                                    }
                                    className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">

                                            <User
                                                size={17}
                                                className="text-gray-500 dark:text-gray-400"
                                            />

                                        </div>

                                        <div>

                                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Task Logs
                                            </h2>

                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Activity and history
                                            </p>

                                        </div>

                                    </div>


                                    <ChevronDown
                                        size={18}
                                        className={`shrink-0 text-gray-400 transition-transform duration-200 ${
                                            currentPanel === "logs"
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />

                                </button>


                                {/* LOG CONTENT */}

                                {currentPanel === "logs" && (

                                    <div className="border-t border-gray-100 dark:border-gray-800">

                                        <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-4 scrollbar-hide">

                                            {logsLoading && (

                                                <div className="flex items-center justify-center py-10">

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

                                            )}


                                            {!logsLoading && logsError && (

                                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">

                                                    {logsError}

                                                </div>

                                            )}


                                            {!logsLoading &&
                                                !logsError &&
                                                logs.length === 0 && (

                                                    <div className="flex flex-col items-center justify-center py-10 text-center">

                                                        <User
                                                            size={28}
                                                            className="text-gray-300 dark:text-gray-600"
                                                        />

                                                        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            No activity yet
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                            User activity will appear here.
                                                        </p>

                                                    </div>

                                                )}


                                            {!logsLoading &&
                                                !logsError &&
                                                logs.length > 0 && (

                                                    <div className="space-y-3">

                                                        {logs.map(
                                                            (
                                                                log,
                                                                index
                                                            ) => (

                                                                <div
                                                                    key={
                                                                        log.lid ??
                                                                        `${log.userid}-${log.datetime}-${index}`
                                                                    }
                                                                >

                                                                    {/* LOG ITEM */}

                                                                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">

                                                                        <div className="flex items-start gap-3">

                                                                            {/* USER ICON */}

                                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">

                                                                                <User
                                                                                    size={15}
                                                                                    className="text-gray-500 dark:text-gray-400"
                                                                                />

                                                                            </div>


                                                                            {/* CONTENT */}

                                                                            <div className="min-w-0 flex-1">

                                                                                <div className="flex items-start justify-between gap-2">

                                                                                    <p className="text-xs font-semibold text-gray-900 dark:text-white">

                                                                                        User{" "}
                                                                                        {
                                                                                            log.userid
                                                                                        }

                                                                                    </p>


                                                                                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">

                                                                                        {
                                                                                            log.event
                                                                                        }

                                                                                    </span>

                                                                                </div>


                                                                                <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-300">

                                                                                    {
                                                                                        log.discription ||
                                                                                        "No description"
                                                                                    }

                                                                                </p>


                                                                                <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">

                                                                                    {new Date(
                                                                                        log.datetime
                                                                                    ).toLocaleString()}

                                                                                </p>

                                                                            </div>

                                                                        </div>

                                                                    </div>


                                                                    {/* CONNECTOR */}

                                                                    {index <
                                                                        logs.length -
                                                                            1 && (

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

                                    </div>

                                )}

                            </div>


                            {/* =================================================
                                VENDOR QUOTE CARD
                                ONLY FOR Assets-Executive
                            ================================================= */}

                            {canPrepareQuote && (

                                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                                    {/* QUOTE HEADER */}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            togglePanel("quote")
                                        }
                                        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">

                                                <Package
                                                    size={17}
                                                    className="text-gray-500 dark:text-gray-400"
                                                />

                                            </div>


                                            <div>

                                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    Vendor Quote
                                                </h2>

                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Prepare and forward vendor quote
                                                </p>

                                            </div>

                                        </div>


                                        <ChevronDown
                                            size={18}
                                            className={`shrink-0 text-gray-400 transition-transform duration-200 ${
                                                currentPanel === "quote"
                                                    ? "rotate-180"
                                                    : ""
                                            }`}
                                        />

                                    </button>


                                    {/* QUOTE CONTENT */}

                                    {currentPanel === "quote" && (

                                        <div className="border-t border-gray-100 dark:border-gray-800">

                                            {selectedTask ? (

                                                <div className="max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-hide">

                                                    <AssetPurchaseQuoteForm
                                                        taskId={
                                                            selectedTask.task_id
                                                        }

                                                        onSuccess={(
                                                            response
                                                        ) => {

                                                            console.log(
                                                                "Vendor quote created:",
                                                                response
                                                            );

                                                        }}
                                                    />

                                                </div>

                                            ) : (

                                                <div className="flex items-center justify-center px-5 py-12 text-center">

                                                    <div>

                                                        <Package
                                                            size={28}
                                                            className="mx-auto text-gray-300 dark:text-gray-600"
                                                        />

                                                        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            Select a task
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                            Select a task to complete its workflow action.
                                                        </p>

                                                    </div>

                                                </div>

                                            )}

                                        </div>

                                    )}

                                </div>

                            )}

                        </div>

                    </section>

                </div>

            </div>

        </div>

    );

}


export default TasksPage;
