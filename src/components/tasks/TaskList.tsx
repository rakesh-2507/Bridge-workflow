import { useMemo } from "react";

import type { Task } from "../../types/task";
import TaskCard from "./TaskCard";
import { getJwtPayload } from "../../api/auth";

interface TaskListProps {
    tasks: Task[];
    selectedTask: Task | null;
    onSelect: (task: Task) => void;
    title?: string;
}

function TaskList({
    tasks,
    selectedTask,
    onSelect,
}: TaskListProps) {
    const loggedInUserId = useMemo(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            return null;
        }

        const payload = getJwtPayload(token);

        if (!payload?.sub) {
            return null;
        }

        return Number(payload.sub);
    }, []);

    const userTasks = useMemo(() => {
        if (loggedInUserId === null) {
            return [];
        }

        return tasks.filter(
            (task) =>
                Number(task.assigned_to) === loggedInUserId
        );
    }, [tasks, loggedInUserId]);

    console.log("Logged-in user ID:", loggedInUserId);
    console.log("All tasks:", tasks);
    console.log("User tasks:", userTasks);

    return (
        <div className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
                {userTasks.length === 0 ? (
                    <div className="flex min-h-[300px] items-center justify-center p-5 text-center">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                No tasks found
                            </p>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                There are no tasks assigned to you.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="px-5 pb-5 pt-4">
                        <div className="flex flex-col gap-0">
                            {userTasks.map((task, index) => {
                                const selected =
                                    selectedTask?.task_id ===
                                    task.task_id;

                                return (
                                    <div
                                        key={task.task_id}
                                        className="sticky"
                                        style={{
                                            top: `${index * 25}px`,
                                            zIndex: selected
                                                ? 10
                                                : index + 1,
                                        }}
                                    >
                                        <div
                                            className={[
                                                "transition-all duration-200",
                                                index > 0
                                                    ? "-mt-3"
                                                    : "",
                                            ].join(" ")}
                                        >
                                            <TaskCard
                                                task={task}
                                                selected={selected}
                                                onClick={() =>
                                                    onSelect(task)
                                                }
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TaskList;