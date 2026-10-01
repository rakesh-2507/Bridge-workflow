import {
    useEffect,
    useState,
} from "react";

import {
    Loader2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { getTasks } from "../../api/tasks";

import type { Task } from "../../types/task";

import TaskList from "../../components/tasks/TaskList";
import TaskDetails from "../../components/tasks/TaskDetails";

function getLoggedInUserId(): number | null {
    try {
        const loginUser = localStorage.getItem("login_user");

        if (!loginUser) {
            return null;
        }

        const user = JSON.parse(loginUser);

        const userId =
            user.uid ??
            user.user_id ??
            user.id;

        return userId != null
            ? Number(userId)
            : null;
    } catch {
        return null;
    }
}

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

                setTasks(response ?? []);
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

    const loggedInUserId = getLoggedInUserId();

    const userTasks = tasks.filter(
        (task) =>
            Number(task.assigned_to) === loggedInUserId
    );

    const pendingTasks = userTasks.filter(
        (task) =>
            task.status !== 3
    );

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
        <div className="flex h-[calc(100vh-64px)] flex-col bg-gray-50 dark:bg-gray-950">

            <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">

                <div className="flex items-center justify-between gap-4">

                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Tasks
                            <span className="rounded-full bg-gray-100 p-2 m-2 text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                               {userTasks.length}
                            </span>
                        </h1>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Manage and track your pending tasks.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {error}
                </div>
            )}

            <div className="min-h-0 flex-1">

                <div className="grid h-full grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">

                    <TaskList
                        tasks={pendingTasks}
                        selectedTask={selectedTask}
                        onSelect={setSelectedTask}
                    />

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
            </div>
        </div>
    );
}

export default TasksPage;