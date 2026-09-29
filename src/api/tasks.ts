import { apiRequest } from "./client";

import type { Task, CreateTaskPayload, UpdateTaskPayload } from "../types/task";

/* =========================================================
 * Types
 * ========================================================= */

export interface UploadedFile {
  pffid: number;
  project_id: number;
  folder_id: number;
  filename: string;
  filesize: number;
  MIME: string;
  uploaded_by: number;

  /**
   * Possible file URL/path returned by the API.
   */
  file_url?: string;
  url?: string;
  download_url?: string;
  document_url?: string;
  path?: string;

  [key: string]: unknown;
}

export interface UploadFileResponse {
  success: boolean;
  code?: string;
  message?: string;
  data?: {
    file?: UploadedFile;
  };
}

export interface TaskFile extends UploadedFile {
  [key: string]: unknown;
}

/* =========================================================
 * Response Normalizers
 * ========================================================= */

function normalizeTasksResponse(response: unknown): Task[] {
  if (Array.isArray(response)) {
    return response as Task[];
  }

  if (response !== null && typeof response === "object") {
    const data = response as Record<string, unknown>;

    if (Array.isArray(data.tasks)) {
      return data.tasks as Task[];
    }

    if (Array.isArray(data.data)) {
      return data.data as Task[];
    }

    if (Array.isArray(data.items)) {
      return data.items as Task[];
    }
  }

  console.error("Unexpected tasks API response:", response);

  return [];
}

function normalizeFilesResponse(response: unknown): TaskFile[] {
  console.log("Raw folder/task files response:", response);

  // Direct array
  if (Array.isArray(response)) {
    return response as TaskFile[];
  }

  // String response - try to parse JSON
  if (typeof response === "string") {
    const trimmed = response.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);

      return normalizeFilesResponse(parsed);
    } catch {
      console.warn("File API returned a non-JSON string:", response);

      return [];
    }
  }

  if (response === null || typeof response !== "object") {
    console.error("Unexpected files API response:", response);

    return [];
  }

  const data = response as Record<string, unknown>;

  // { files: [...] }
  if (Array.isArray(data.files)) {
    return data.files as TaskFile[];
  }

  // { items: [...] }
  if (Array.isArray(data.items)) {
    return data.items as TaskFile[];
  }

  // { data: [...] }
  if (Array.isArray(data.data)) {
    return data.data as TaskFile[];
  }

  // { data: { files: [...] } }
  if (data.data !== null && typeof data.data === "object") {
    const nested = data.data as Record<string, unknown>;

    if (Array.isArray(nested.files)) {
      return nested.files as TaskFile[];
    }

    if (Array.isArray(nested.items)) {
      return nested.items as TaskFile[];
    }

    if (Array.isArray(nested.data)) {
      return nested.data as TaskFile[];
    }
  }

  /*
   * Some FastAPI endpoints may return:
   *
   * {
   *   "filename.pdf": {
   *      ...
   *   }
   * }
   *
   * or another object containing file records.
   */
  const objectValues = Object.values(data);

  const possibleFiles = objectValues.filter(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      ("filename" in (item as Record<string, unknown>) ||
        "pffid" in (item as Record<string, unknown>)),
  );

  if (possibleFiles.length > 0) {
    return possibleFiles as TaskFile[];
  }

  console.error("Unable to find files in API response:", response);

  return [];
}
/* =========================================================
 * Tasks
 * ========================================================= */

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  return apiRequest<Task>("/api/createtask", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTasks(): Promise<Task[]> {
  const response = await apiRequest<unknown>("/api/gettasks", {
    method: "GET",
  });

  return normalizeTasksResponse(response);
}

export async function getTask(taskId: number): Promise<Task> {
  return apiRequest<Task>(`/api/gettask/${taskId}`, {
    method: "GET",
  });
}

export async function getProjectTasks(projectId: number): Promise<Task[]> {
  const response = await apiRequest<unknown>(
    `/api/gettasks/project/${projectId}`,
    {
      method: "GET",
    },
  );

  return normalizeTasksResponse(response);
}

export async function getFolderTasks(folderId: number): Promise<Task[]> {
  const response = await apiRequest<unknown>(
    `/api/gettasks/folder/${folderId}`,
    {
      method: "GET",
    },
  );

  return normalizeTasksResponse(response);
}

export async function updateTask(
  taskId: number,
  payload: UpdateTaskPayload,
): Promise<Task> {
  return apiRequest<Task>(`/api/updatetask/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(taskId: number): Promise<unknown> {
  return apiRequest(`/api/deletetask/${taskId}`, {
    method: "DELETE",
  });
}

export async function approveTask(taskId: number): Promise<unknown> {
  return apiRequest(`/api/tasks/${taskId}/approve`, {
    method: "POST",
  });
}

export async function rejectTask(taskId: number): Promise<unknown> {
  return apiRequest(`/api/tasks/${taskId}/reject`, {
    method: "POST",
  });
}

export async function getTaskFiles(taskId: number): Promise<TaskFile[]> {
  const response = await apiRequest<unknown>(`/api/gettask/${taskId}`, {
    method: "GET",
  });

  return normalizeFilesResponse(response);
}


export async function getFolderFiles(folderId: number): Promise<TaskFile[]> {
  const response = await apiRequest<unknown>(
    `/api/getfolderfiles/${folderId}`,
    {
      method: "GET",
    },
  );

  console.log(`GET /api/getfolderfiles/${folderId} response:`, response);

  return normalizeFilesResponse(response);
}

/**
 * Upload file to a folder.
 *
 * POST /api/uploadfiletofolder
 */
export async function uploadFileToFolder(
  projectId: number,
  folderId: number,
  uploadedBy: number,
  file: File,
): Promise<UploadFileResponse> {
  const formData = new FormData();

  formData.append("project_id", String(projectId));

  formData.append("folder_id", String(folderId));

  formData.append("uploaded_by", String(uploadedBy));

  formData.append("file", file);

  return apiRequest<UploadFileResponse>("/api/uploadfiletofolder", {
    method: "POST",
    body: formData,
  });
}
