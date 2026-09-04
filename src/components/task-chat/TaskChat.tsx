import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Loader2,
} from "lucide-react";

import {
    getTasks,
} from "../../api/tasks";

import {
    getUsers,
} from "../../api/users";

import type { Task } from "../../types/task";

import type {
    TaskChatMessage,
    TaskChatUser,
    TaskConversation,
} from "../../types/taskChat";

import TaskChatUsers from "./TaskChatUsers";
import TaskChatHeader from "./TaskChatHeader";
import TaskChatMessages from "./TaskChatMessages";
import TaskChatEmpty from "./TaskChatEmpty";


/**
 * Get logged-in user's ID from JWT.
 */
function getCurrentUserId(): number | null {
    const token =
        localStorage.getItem("access_token");

    if (!token) {
        return null;
    }

    try {
        const parts = token.split(".");

        if (parts.length < 2) {
            return null;
        }

        const payload = JSON.parse(
            atob(parts[1])
        );

        if (!payload.uid) {
            return null;
        }

        return Number(payload.uid);
    } catch (error) {
        console.error(
            "Unable to read current user from token:",
            error
        );

        return null;
    }
}


/**
 * Convert API user into display name.
 */
function getUserName(user: {
    firstname: string;
    lastname: string;
    loginname: string;
}) {
    const fullName =
        `${user.firstname} ${user.lastname}`.trim();

    return (
        fullName ||
        user.loginname ||
        "Unknown User"
    );
}


/**
 * Convert task date into timestamp.
 */
function getTaskTimestamp(task: Task) {
    const value =
        task.start_date ||
        task.end_date ||
        "";

    const timestamp =
        new Date(value).getTime();

    return Number.isNaN(timestamp)
        ? 0
        : timestamp;
}


/**
 * Build the user list.
 *
 * IMPORTANT:
 * Users are NOT derived from tasks.
 *
 * This means the left sidebar will always show
 * users returned by GET /api/getusers.
 */
function buildChatUsers(
    users: Awaited<
        ReturnType<typeof getUsers>
    >["users"],
    tasks: Task[],
    currentUserId: number
): TaskChatUser[] {
    return users
        .filter(
            (user) =>
                user.uid !== currentUserId
        )
        .map((user) => {
            const userTasks =
                tasks.filter(
                    (task) =>
                        (
                            task.assigned_by ===
                            currentUserId &&
                            task.assigned_to ===
                            user.uid
                        ) ||
                        (
                            task.assigned_by ===
                            user.uid &&
                            task.assigned_to ===
                            currentUserId
                        )
                );

            const sortedTasks =
                [...userTasks].sort(
                    (a, b) =>
                        getTaskTimestamp(b) -
                        getTaskTimestamp(a)
                );

            /**
             * Tasks assigned TO me by this user.
             *
             * These are treated as unread.
             */
            const unreadCount =
                userTasks.filter(
                    (task) =>
                        task.assigned_by ===
                        user.uid &&
                        task.assigned_to ===
                        currentUserId &&
                        task.status === 1
                ).length;

            return {
                userId: user.uid,

                name: getUserName(user),

                loginname:
                    user.loginname,

                email: user.email,

                unreadCount,

                lastTask:
                    sortedTasks[0],
            };
        });
}


/**
 * Build the conversation for one selected user.
 */
function buildConversation(
    user: TaskChatUser,
    tasks: Task[],
    currentUserId: number
): TaskConversation {
    const conversationTasks =
        tasks.filter(
            (task) =>
                (
                    task.assigned_by ===
                    currentUserId &&
                    task.assigned_to ===
                    user.userId
                ) ||
                (
                    task.assigned_by ===
                    user.userId &&
                    task.assigned_to ===
                    currentUserId
                )
        );

    const sortedTasks =
        [...conversationTasks].sort(
            (a, b) =>
                getTaskTimestamp(a) -
                getTaskTimestamp(b)
        );

    const messages: TaskChatMessage[] =
        sortedTasks.map((task) => ({
            task,

            isAssignedByMe:
                task.assigned_by ===
                currentUserId,

            isAssignedToMe:
                task.assigned_to ===
                currentUserId,
        }));

    return {
        user,
        messages,
    };
}


function TaskChat() {
    const [tasks, setTasks] =
        useState<Task[]>([]);

    const [chatUsers, setChatUsers] =
        useState<TaskChatUser[]>([]);

    const [selectedUserId, setSelectedUserId] =
        useState<number | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const currentUserId =
        getCurrentUserId();


    /**
     * Load users and tasks.
     */
    useEffect(() => {
        let mounted = true;

        async function loadData() {
            try {
                setIsLoading(true);
                setError(null);

                if (!currentUserId) {
                    throw new Error(
                        "Unable to identify the logged-in user."
                    );
                }

                console.log(
                    "Current User ID:",
                    currentUserId
                );

                const [
                    tasksResponse,
                    usersResponse,
                ] = await Promise.all([
                    getTasks(),
                    getUsers(),
                ]);

                console.log(
                    "Tasks from API:",
                    tasksResponse
                );

                console.log(
                    "Users from API:",
                    usersResponse
                );

                if (!mounted) {
                    return;
                }

                setTasks(tasksResponse);

                const users =
                    buildChatUsers(
                        usersResponse.users,
                        tasksResponse,
                        currentUserId
                    );

                console.log(
                    "Chat users:",
                    users
                );

                setChatUsers(users);

                /**
                 * Select first user automatically.
                 */
                if (
                    users.length > 0
                ) {
                    setSelectedUserId(
                        users[0].userId
                    );
                }
            } catch (err) {
                if (!mounted) {
                    return;
                }

                console.error(
                    "Failed to load task conversations:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load task conversations."
                );
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadData();

        return () => {
            mounted = false;
        };
    }, [currentUserId]);


    /**
     * Build conversation only for
     * the selected user.
     */
    const selectedConversation =
        useMemo(() => {
            if (
                selectedUserId === null ||
                currentUserId === null
            ) {
                return null;
            }

            const user =
                chatUsers.find(
                    (item) =>
                        item.userId ===
                        selectedUserId
                );

            if (!user) {
                return null;
            }

            return buildConversation(
                user,
                tasks,
                currentUserId
            );
        }, [
            chatUsers,
            currentUserId,
            selectedUserId,
            tasks,
        ]);


    /**
     * Loading state
     */
    if (isLoading) {
        return (
            <div className="flex h-full min-h-[500px] items-center justify-center bg-white dark:bg-gray-950">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Loader2
                        size={18}
                        className="animate-spin"
                    />

                    Loading task conversations...
                </div>
            </div>
        );
    }


    /**
     * Error state
     */
    if (error) {
        return (
            <div className="flex h-full min-h-[500px] items-center justify-center bg-white p-6 dark:bg-gray-950">
                <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-center dark:border-red-900/50 dark:bg-red-950/30">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        {error}
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div className="flex h-full min-h-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-950 ">

            {/* LEFT SIDEBAR */}

            <div
                className={`
                    ${selectedConversation
                        ? "hidden md:flex"
                        : "flex"
                    }
                    h-full
                    shrink-0 
                `}
            >
                <TaskChatUsers
                    users={chatUsers}
                    selectedUserId={
                        selectedUserId
                    }
                    onSelectUser={
                        setSelectedUserId
                    }
                />
            </div>


            {/* RIGHT CHAT */}

            <div
                className={`
                    ${selectedConversation
                        ? "flex"
                        : "hidden md:flex"
                    }
                    min-w-0
                    flex-1
                    flex-col
                    bg-white
                    dark:bg-gray-950
                `}
            >
                {selectedConversation ? (
                    <>
                        <TaskChatHeader
                            user={
                                selectedConversation.user
                            }
                            onBack={() =>
                                setSelectedUserId(
                                    null
                                )
                            }
                        />

                        <TaskChatMessages
                            conversation={
                                selectedConversation
                            }
                        />
                    </>
                ) : (
                    <TaskChatEmpty />
                )}
            </div>
        </div>
    );
}

export default TaskChat;