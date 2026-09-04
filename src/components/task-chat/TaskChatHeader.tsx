import {
    ArrowLeft,
    Mail,
    User,
} from "lucide-react";

import type { TaskChatUser } from "../../types/taskChat";

interface TaskChatHeaderProps {
    user: TaskChatUser;
    onBack?: () => void;
}

function TaskChatHeader({
    user,
    onBack,
}: TaskChatHeaderProps) {
    return (
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-sky-50 px-4 dark:border-gray-800 dark:bg-gray-900">

            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 md:hidden"
                    aria-label="Back"
                >
                    <ArrowLeft size={19} />
                </button>
            )}

            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {user.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                    />
                ) : (
                    <User size={20} />
                )}
            </div>

            {/* User details */}
            <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {user.name}
                </h2>

                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Mail size={12} />

                    <span className="truncate">
                        {user.email ||
                            user.loginname}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default TaskChatHeader;
