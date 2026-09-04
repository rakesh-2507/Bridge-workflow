import type { Task } from "./task";

export interface TaskChatUser {
    userId: number;
    name: string;
    loginname: string;
    email: string;
    avatar?: string;
    unreadCount: number;
    lastTask?: Task;
}

export interface TaskChatMessage {
    task: Task;
    isAssignedByMe: boolean;
    isAssignedToMe: boolean;
}

export interface TaskConversation {
    user: TaskChatUser;
    messages: TaskChatMessage[];
}