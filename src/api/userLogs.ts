import { apiRequest } from "./client";

export interface UserLog {
    lid: number;
    userid: number;
    event: string;
    discription: string;
    datetime: string;
    projid: number;
}

export async function getUserLogs(): Promise<UserLog[]> {
    const response = await apiRequest<UserLog[]>(
        "/api/userlogs/"
    );

    return response ?? [];
}
