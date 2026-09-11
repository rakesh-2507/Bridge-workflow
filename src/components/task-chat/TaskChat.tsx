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
    getAssetPurchaseTasks,
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

import {
    getJwtPayload,
} from "../../api/auth";


/* -------------------------------------------------------------------------- */
/* Current logged-in user                                                     */
/* -------------------------------------------------------------------------- */

function getCurrentUserId(): number | null {
    const token =
        localStorage.getItem("access_token");

    if (!token) {
        console.error(
            "No access token found."
        );

        return null;
    }

    try {
        const payload =
            getJwtPayload(token);

        console.log(
            "JWT payload:",
            payload
        );

        if (!payload) {
            console.error(
                "Unable to decode JWT payload."
            );

            return null;
        }

        const userId =
            payload.uid ??
            payload.user_id ??
            payload.id ??
            payload.sub;

        if (
            userId === undefined ||
            userId === null
        ) {
            console.error(
                "JWT does not contain a user ID:",
                payload
            );

            return null;
        }

        const numericUserId =
            Number(userId);

        if (
            !Number.isFinite(
                numericUserId
            )
        ) {
            console.error(
                "Invalid user ID in JWT:",
                userId
            );

            return null;
        }

        return numericUserId;
    } catch (error) {
        console.error(
            "Unable to read current user from token:",
            error
        );

        return null;
    }
}


/* -------------------------------------------------------------------------- */
/* User helpers                                                               */
/* -------------------------------------------------------------------------- */

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


/* -------------------------------------------------------------------------- */
/* Task helpers                                                               */
/* -------------------------------------------------------------------------- */

function getTaskTimestamp(
    task: Task
): number {
    const taskWithDates =
        task as Task & {
            created_date?: string;
            createddt?: string;
            created_at?: string;
        };

    const value =
        task.start_date ||
        task.end_date ||
        taskWithDates.created_date ||
        taskWithDates.createddt ||
        taskWithDates.created_at ||
        "";

    const timestamp =
        new Date(value).getTime();

    return Number.isNaN(timestamp)
        ? 0
        : timestamp;
}


/* -------------------------------------------------------------------------- */
/* Build chat users                                                           */
/* -------------------------------------------------------------------------- */

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

                name:
                    getUserName(user),

                loginname:
                    user.loginname,

                email:
                    user.email,

                unreadCount,

                lastTask:
                    sortedTasks[0],
            };
        });
}


/* -------------------------------------------------------------------------- */
/* Build selected conversation                                                */
/* -------------------------------------------------------------------------- */

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


/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

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


    /* ---------------------------------------------------------------------- */
    /* Current user                                                            */
    /* ---------------------------------------------------------------------- */

    const currentUserId =
        useMemo(
            () => getCurrentUserId(),
            []
        );


    /* ---------------------------------------------------------------------- */
    /* Load tasks + asset purchase tasks + users                              */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        let mounted = true;

        async function loadData() {
            try {
                setIsLoading(true);
                setError(null);

                if (
                    currentUserId === null
                ) {
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
                    assetPurchaseTasksResponse,
                    usersResponse,
                ] = await Promise.all([
                    getTasks(),
                    getAssetPurchaseTasks(),
                    getUsers(),
                ]);


                /* ---------------------------------------------------------- */
                /* Debug API responses                                         */
                /* ---------------------------------------------------------- */

                console.log(
                    "Normal tasks:",
                    tasksResponse
                );

                console.log(
                    "Asset purchase tasks:",
                    assetPurchaseTasksResponse
                );

                console.log(
                    "Users:",
                    usersResponse
                );


                if (!mounted) {
                    return;
                }


                /* ---------------------------------------------------------- */
                /* Combine both task APIs                                      */
                /* ---------------------------------------------------------- */

                const allTasks: Task[] = [
                    ...tasksResponse,
                    ...assetPurchaseTasksResponse,
                ];

                console.log(
                    "All conversation tasks:",
                    allTasks
                );


                /* ---------------------------------------------------------- */
                /* Store combined tasks                                        */
                /* ---------------------------------------------------------- */

                setTasks(
                    allTasks
                );


                /* ---------------------------------------------------------- */
                /* Build chat users from combined tasks                       */
                /* ---------------------------------------------------------- */

                const users =
                    buildChatUsers(
                        usersResponse.users,
                        allTasks,
                        currentUserId
                    );

                console.log(
                    "Chat users:",
                    users
                );

                setChatUsers(
                    users
                );


                /* ---------------------------------------------------------- */
                /* Select first user                                           */
                /* ---------------------------------------------------------- */

                if (
                    users.length > 0
                ) {
                    setSelectedUserId(
                        users[0].userId
                    );
                } else {
                    setSelectedUserId(
                        null
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


    /* ---------------------------------------------------------------------- */
    /* Selected conversation                                                  */
    /* ---------------------------------------------------------------------- */

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


    /* ---------------------------------------------------------------------- */
    /* Loading                                                                 */
    /* ---------------------------------------------------------------------- */

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


    /* ---------------------------------------------------------------------- */
    /* Error                                                                   */
    /* ---------------------------------------------------------------------- */

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


    /* ---------------------------------------------------------------------- */
    /* Main UI                                                                 */
    /* ---------------------------------------------------------------------- */

    return (
        <div className="flex h-full min-h-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-950">

            {/* -------------------------------------------------------------- */}
            {/* Users                                                            */}
            {/* -------------------------------------------------------------- */}

            <div
                className={`
                    ${
                        selectedConversation
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


            {/* -------------------------------------------------------------- */}
            {/* Conversation                                                    */}
            {/* -------------------------------------------------------------- */}

            <div
                className={`
                    ${
                        selectedConversation
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
