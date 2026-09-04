import {
    MessageCircle,
    User,
} from "lucide-react";

function TaskChatEmpty() {
    return (
        <div className="flex flex-1 items-center justify-center bg-gray-50 p-8 dark:bg-gray-950">
            <div className="max-w-sm text-center">

                {/* Icon */}
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm dark:bg-gray-900 dark:text-gray-500">
                    <MessageCircle size={28} />
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Task Conversations
                </h2>

                {/* Description */}
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Select a user from the left to view
                    tasks assigned between you and that
                    user.
                </p>

                {/* Hint */}
                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <User size={14} />
                    <span>
                        Select a user to start
                    </span>
                </div>

            </div>
        </div>
    );
}

export default TaskChatEmpty;
