import {
    apiRequest,
} from "./client";

import type {
    Task,
    CreateTaskPayload,
    UpdateTaskPayload,
    TaskComment,
    TaskActionPayload,
    TaskActionResponse,
} from "../types/task";

/* =========================================================
 * File Types
 * ========================================================= */

export interface UploadedFile {
    pffid: number;
    project_id: number;
    folder_id: number;
    filename: string;
    filesize: number;
    MIME: string;
    uploaded_by?: number;

    file_url?: string;
    url?: string;
    download_url?: string;
    document_url?: string;
    path?: string;

    [key: string]: unknown;
}

export interface TaskFile
    extends UploadedFile {
    [key: string]: unknown;
}

/* =========================================================
 * File API
 * ========================================================= */

export async function getTaskFiles(
    taskId: number,
): Promise<TaskFile[]> {
    const response =
        await apiRequest<unknown>(
            `/api/gettask/${taskId}`,
            {
                method: "GET",
            },
        );

    return normalizeFilesResponse(
        response,
    );
}

export async function getFolderFiles(
    folderId: number,
): Promise<TaskFile[]> {
    const response =
        await apiRequest<unknown>(
            `/api/getfolderfiles/${folderId}`,
            {
                method: "GET",
            },
        );

    console.log(
        `GET /api/getfolderfiles/${folderId} response:`,
        response,
    );

    return normalizeFilesResponse(
        response,
    );
}

/*
 * New upload endpoint:
 *
 * POST
 * /api/{project_id}/folders/{folder_id}/files
 *
 * multipart/form-data:
 * files = file
 */
export async function uploadFileToFolder(
    projectId: number,
    folderId: number,
    file: File,
): Promise<unknown> {
    const formData =
        new FormData();

    formData.append(
        "files",
        file,
    );

    return apiRequest<unknown>(
        `/api/${projectId}/folders/${folderId}/files`,
        {
            method: "POST",
            body: formData,
        },
    );
}

/*
 * New download endpoint:
 *
 * GET
 * /api/{project_id}/folders/{folder_id}/files/{file_id}/download
 */
export async function downloadFolderFile(
    projectId: number,
    folderId: number,
    fileId: number,
): Promise<Blob> {
    return apiRequest<Blob>(
        `/api/${projectId}/folders/${folderId}/files/${fileId}/download`,
        {
            method: "GET",
            responseType: "blob",
        },
    );
}

/* =========================================================
 * File Response Normalizer
 * ========================================================= */

function normalizeFilesResponse(
    response: unknown,
): TaskFile[] {
    if (Array.isArray(response)) {
        return response as TaskFile[];
    }

    if (typeof response === "string") {
        const trimmed =
            response.trim();

        if (!trimmed) {
            return [];
        }

        try {
            const parsed =
                JSON.parse(trimmed);

            return normalizeFilesResponse(
                parsed,
            );
        } catch {
            console.warn(
                "File API returned a non-JSON string:",
                response,
            );

            return [];
        }
    }

    if (
        response === null ||
        typeof response !== "object"
    ) {
        return [];
    }

    const data =
        response as Record<
            string,
            unknown
        >;

    /*
     * Single file object.
     */
    if (
        "pffid" in data ||
        "filename" in data
    ) {
        return [
            data as TaskFile,
        ];
    }

    /*
     * { files: [...] }
     */
    if (Array.isArray(data.files)) {
        return data.files as TaskFile[];
    }

    /*
     * { items: [...] }
     */
    if (Array.isArray(data.items)) {
        return data.items as TaskFile[];
    }

    /*
     * { data: [...] }
     */
    if (Array.isArray(data.data)) {
        return data.data as TaskFile[];
    }

    /*
     * { data: { files: [...] } }
     */
    if (
        data.data !== null &&
        typeof data.data === "object"
    ) {
        const nested =
            data.data as Record<
                string,
                unknown
            >;

        if (
            Array.isArray(
                nested.files,
            )
        ) {
            return nested.files as TaskFile[];
        }

        if (
            Array.isArray(
                nested.items,
            )
        ) {
            return nested.items as TaskFile[];
        }

        if (
            Array.isArray(
                nested.data,
            )
        ) {
            return nested.data as TaskFile[];
        }
    }

    /*
     * Object containing file records.
     */
    const possibleFiles =
        Object.values(data).filter(
            (item) => {
                if (
                    item === null ||
                    typeof item !==
                        "object"
                ) {
                    return false;
                }

                const record =
                    item as Record<
                        string,
                        unknown
                    >;

                return (
                    "filename" in
                        record ||
                    "pffid" in
                        record
                );
            },
        );

    if (
        possibleFiles.length > 0
    ) {
        return possibleFiles as TaskFile[];
    }

    console.error(
        "Unable to find files in API response:",
        response,
    );

    return [];
}

/* =========================================================
 * Tasks
 * ========================================================= */

export async function createTask(
    payload: CreateTaskPayload,
): Promise<Task> {
    return apiRequest<Task>(
        "/api/createtask",
        {
            method: "POST",
            body: JSON.stringify(
                payload,
            ),
        },
    );
}

export async function getTasks(): Promise<Task[]> {
    const response =
        await apiRequest<unknown>(
            "/api/gettasks",
            {
                method: "GET",
            },
        );

    return normalizeTasksResponse(
        response,
    );
}

export async function getTask(
    taskId: number,
): Promise<Task> {
    return apiRequest<Task>(
        `/api/gettask/${taskId}`,
        {
            method: "GET",
        },
    );
}

export async function getProjectTasks(
    projectId: number,
): Promise<Task[]> {
    const response =
        await apiRequest<unknown>(
            `/api/gettasks/project/${projectId}`,
            {
                method: "GET",
            },
        );

    return normalizeTasksResponse(
        response,
    );
}

export async function getFolderTasks(
    folderId: number,
): Promise<Task[]> {
    const response =
        await apiRequest<unknown>(
            `/api/gettasks/folder/${folderId}`,
            {
                method: "GET",
            },
        );

    return normalizeTasksResponse(
        response,
    );
}

export async function updateTask(
    taskId: number,
    payload: UpdateTaskPayload,
): Promise<Task> {
    return apiRequest<Task>(
        `/api/updatetask/${taskId}`,
        {
            method: "PUT",
            body: JSON.stringify(
                payload,
            ),
        },
    );
}

export async function deleteTask(
    taskId: number,
): Promise<unknown> {
    return apiRequest(
        `/api/deletetask/${taskId}`,
        {
            method: "DELETE",
        },
    );
}

export async function approveTask(
    taskId: number,
): Promise<unknown> {
    return apiRequest(
        `/api/tasks/${taskId}/approve`,
        {
            method: "POST",
        },
    );
}

export async function rejectTask(
    taskId: number,
): Promise<unknown> {
    return apiRequest(
        `/api/tasks/${taskId}/reject`,
        {
            method: "POST",
        },
    );
}

/* =========================================================
 * Comments
 * ========================================================= */

export async function getTaskComments(
    taskId: number,
): Promise<TaskComment[]> {
    const response =
        await apiRequest<unknown>(
            `/api/tasks/${taskId}/comments`,
            {
                method: "GET",
            },
        );

    return normalizeCommentsResponse(
        response,
    );
}

export async function performTaskAction(
    taskId: number,
    payload: TaskActionPayload,
): Promise<TaskActionResponse> {
    return apiRequest<TaskActionResponse>(
        `/api/tasks/${taskId}/action`,
        {
            method: "POST",
            body: JSON.stringify(
                payload,
            ),
        },
    );
}

/* =========================================================
 * Task Response Normalizer
 * ========================================================= */

function normalizeTasksResponse(
    response: unknown,
): Task[] {
    if (Array.isArray(response)) {
        return response as Task[];
    }

    if (
        response !== null &&
        typeof response === "object"
    ) {
        const data =
            response as Record<
                string,
                unknown
            >;

        if (
            Array.isArray(
                data.tasks,
            )
        ) {
            return data.tasks as Task[];
        }

        if (
            Array.isArray(
                data.data,
            )
        ) {
            return data.data as Task[];
        }

        if (
            Array.isArray(
                data.items,
            )
        ) {
            return data.items as Task[];
        }
    }

    console.error(
        "Unexpected tasks API response:",
        response,
    );

    return [];
}

/* =========================================================
 * Comments Response Normalizer
 * ========================================================= */

function normalizeCommentsResponse(
    response: unknown,
): TaskComment[] {
    if (Array.isArray(response)) {
        return response as TaskComment[];
    }

    if (
        response !== null &&
        typeof response === "object"
    ) {
        const data =
            response as Record<
                string,
                unknown
            >;

        if (
            Array.isArray(
                data.comments,
            )
        ) {
            return data.comments as TaskComment[];
        }

        if (
            Array.isArray(
                data.data,
            )
        ) {
            return data.data as TaskComment[];
        }

        if (
            Array.isArray(
                data.items,
            )
        ) {
            return data.items as TaskComment[];
        }
    }

    console.error(
        "Unexpected comments API response:",
        response,
    );

    return [];
}
