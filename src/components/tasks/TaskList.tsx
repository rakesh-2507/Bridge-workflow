import type { Task } from "../../types/task";
import TaskCard from "./TaskCard";

interface TaskListProps {
    tasks: Task[];
    selectedTask: Task | null;
    onSelect: (task: Task | null) => void;
    title?: string;
}

function TaskList({
    tasks,
    selectedTask,
    onSelect,
}: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex min-h-[300px] items-center justify-center p-5 text-center">
                <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        No tasks found
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        There are no tasks to display.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-5 pb-5 pt-4">
            <div className="flex flex-col gap-0">
                {tasks.map((task, index) => {
                    const selected =
                        selectedTask?.task_id === task.task_id;

                    return (
                        <div
                            key={task.task_id}
                            className="sticky"
                            style={{
                                top: `${index * 25}px`,
                                zIndex: selected
                                    ? 50
                                    : index + 1,
                            }}
                        >
                            <div
                                className={[
                                    "transition-all duration-200",
                                    index > 0 ? "-mt-3" : "",
                                ].join(" ")}
                            >
                                <TaskCard
                                    task={task}
                                    selected={selected}
                                    onClick={() =>
                                        onSelect(
                                            selected
                                                ? null
                                                : task
                                        )
                                    }
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TaskList;