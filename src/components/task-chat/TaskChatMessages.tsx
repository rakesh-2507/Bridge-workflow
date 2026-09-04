import type { TaskConversation } from "../../types/taskChat";

import TaskChatMessage from "./TaskChatMessage";

interface TaskChatMessagesProps {
    conversation: TaskConversation | null;
}

function TaskChatMessages({
    conversation,
}: TaskChatMessagesProps) {
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

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-6 dark:bg-gray-950">
            <div className="flex w-full flex-col gap-4">
                {conversation.messages.map(
                    (message) => (
                        <TaskChatMessage
                            key={message.task.task_id}
                            message={message}
                        />
                    )
                )}
            </div>
        </div>
    );
}

export default TaskChatMessages;
