import {
    Search,
    User,
} from "lucide-react";

import {
    useMemo,
    useState,
} from "react";

import type {
    TaskChatUser,
} from "../../types/taskChat";

interface TaskChatUsersProps {
    users: TaskChatUser[];
    selectedUserId: number | null;
    onSelectUser: (userId: number) => void;
}

function formatLastTask(task?: TaskChatUser["lastTask"]) {
    if (!task) {
        return "No tasks";
    }

    return (
        task.task_description ||
        task.task_type ||
        "Task"
    );
}

function TaskChatUsers({
    users,
    selectedUserId,
    onSelectUser,
}: TaskChatUsersProps) {
    const [search, setSearch] =
        useState("");

    const filteredUsers = useMemo(() => {
        const value = search
            .trim()
            .toLowerCase();

        if (!value) {
            return users;
        }

        return users.filter((user) =>
            user.name
                .toLowerCase()
                .includes(value) ||
            user.loginname
                .toLowerCase()
                .includes(value) ||
            user.email
                .toLowerCase()
                .includes(value)
        );
    }, [users, search]);

    return (
        <aside className="flex h-full w-full flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:w-80 lg:w-96">

            {/* Header */}
            <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800 ">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Task Conversations
                </h1>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Tasks assigned between you and
                    other users
                </p>

                {/* Search */}
                <div className="relative mt-4">
                    <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search users..."
                        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-600 dark:focus:bg-gray-800"
                    />
                </div>
            </div>

            {/* Users */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {filteredUsers.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center px-6 text-center">
                        <User
                            size={24}
                            className="text-gray-300 dark:text-gray-600"
                        />

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            No users found
                        </p>
                    </div>
                ) : (
                    filteredUsers.map((user) => {
                        const isSelected =
                            selectedUserId ===
                            user.userId;

                        return (
                            <button
                                key={user.userId}
                                type="button"
                                onClick={() =>
                                    onSelectUser(
                                        user.userId
                                    )
                                }
                                className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition dark:border-gray-800 ${
                                    isSelected
                                        ? "bg-sky-100 dark:bg-gray-800"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                }`}
                            >
                                {/* Avatar */}
                                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                    {user.avatar ? (
                                        <img
                                            src={
                                                user.avatar
                                            }
                                            alt={
                                                user.name
                                            }
                                            className="h-11 w-11 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User
                                            size={20}
                                        />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {user.name}
                                        </h3>

                                        {user.unreadCount >
                                            0 && (
                                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gray-800 px-1.5 text-[10px] font-medium text-white dark:bg-gray-100 dark:text-gray-900">
                                                {
                                                    user.unreadCount
                                                }
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                                        {formatLastTask(
                                            user.lastTask
                                        )}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </aside>
    );
}

export default TaskChatUsers;
