
import { useState } from "react";

import type { Task } from "../../types/task";
import type { TaskConversation } from "../../types/taskChat";

import TaskDetails from "../tasks/TaskDetails";
import TaskChatMessage from "./TaskChatMessage";

interface TaskChatMessagesProps {
    conversation: TaskConversation | null;
}

function TaskChatMessages({
    conversation,
}: TaskChatMessagesProps) {
    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

    if (!conversation) {
        return null;
    }

    if (conversation.messages.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center bg-white p-6 dark:bg-gray-950">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                    No tasks exchanged with this user.
                </p>
            </div>
        );
    }

    const handleEdit = (task: Task) => {
        console.log("Edit task:", task);

        // Connect your existing edit UI here.
    };

    const handleDeleted = (taskId: number) => {
        if (selectedTask?.task_id === taskId) {
            setSelectedTask(null);
        }
    };

    return (
        <div className="flex min-h-0 flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">

            {/* ==================================================
                Task Messages
            ================================================== */}

            <div
                className={`min-w-0 overflow-y-auto px-4 py-6 transition-all ${
                    selectedTask
                        ? "w-[55%]"
                        : "w-full"
                }`}
            >
                <div className="flex w-full flex-col gap-4">
                    {conversation.messages.map(
                        (message) => (
                            <TaskChatMessage
                                key={
                                    message.task.task_id
                                }
                                message={message}
                                onClick={() =>
                                    setSelectedTask(
                                        message.task
                                    )
                                }
                                isSelected={
                                    selectedTask?.task_id ===
                                    message.task.task_id
                                }
                            />
                        )
                    )}
                </div>
            </div>

            {/* ==================================================
                Task Details
                Only rendered when a task is selected
            ================================================== */}

            {selectedTask && (
                <div className="w-[45%] min-w-[380px] max-w-[600px]">
                    <TaskDetails
                        task={selectedTask}
                        onEdit={handleEdit}
                        onDeleted={handleDeleted}
                    />
                </div>
            )}
        </div>
    );
}

export default TaskChatMessages;

