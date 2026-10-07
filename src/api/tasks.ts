import { apiRequest } from "./client";

import type {
  Task,
  TaskFile,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskComment,
  TaskActionPayload,
  TaskActionResponse,
} from "../types/task";

export async function getTaskFiles(taskId: number): Promise<TaskFile[]> {
  const response = await apiRequest<unknown>(
    `/api/gettask/${taskId}`,
    {
      method: "GET",
    },
  );

  return normalizeFilesResponse(response);
}

export async function getFolderFiles(
  folderId: number,
): Promise<TaskFile[]> {
  const response = await apiRequest<unknown>(
    `/api/getfolderfiles/${folderId}`,
    {
      method: "GET",
    },
  );

  return normalizeFilesResponse(response);
}

export async function uploadFileToFolder(
  projectId: number,
  folderId: number,
  file: File,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("files", file);

  return apiRequest<unknown>(
    `/api/${projectId}/folders/${folderId}/files`,
    {
      method: "POST",
      body: formData,
    },
  );
}

function normalizeFilesResponse(response: unknown): TaskFile[] {
  if (Array.isArray(response)) {
    return response as TaskFile[];
  }

  if (typeof response === "string") {
    const value = response.trim();

    if (!value) {
      return [];
    }

    try {
      return normalizeFilesResponse(JSON.parse(value));
    } catch {
      return [];
    }
  }

  if (
    response === null ||
    typeof response !== "object"
  ) {
    return [];
  }

  const data = response as Record<string, unknown>;

  if (
    data.data !== null &&
    typeof data.data === "object" &&
    !Array.isArray(data.data)
  ) {
    const nested = data.data as Record<string, unknown>;

    if (Array.isArray(nested.bridge_task_files)) {
      return nested.bridge_task_files as TaskFile[];
    }

    if (Array.isArray(nested.project_folder_files)) {
      return nested.project_folder_files as TaskFile[];
    }

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

  if (Array.isArray(data.bridge_task_files)) {
    return data.bridge_task_files as TaskFile[];
  }

  if (Array.isArray(data.project_folder_files)) {
    return data.project_folder_files as TaskFile[];
  }

  if (Array.isArray(data.files)) {
    return data.files as TaskFile[];
  }

  if (Array.isArray(data.items)) {
    return data.items as TaskFile[];
  }

  if ("pffid" in data || "filename" in data) {
    return [data as TaskFile];
  }

  const files = Object.values(data).filter((value) => {
    if (
      value === null ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return false;
    }

    const item = value as Record<string, unknown>;

    return (
      "pffid" in item ||
      "filename" in item
    );
  });

  return files as TaskFile[];
}

export async function createTask(
  payload: CreateTaskPayload,
): Promise<Task> {
  return apiRequest<Task>(
    "/api/createtask",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function getTasks(): Promise<Task[]> {
  const response = await apiRequest<unknown>(
    "/api/gettasks",
    {
      method: "GET",
    },
  );

  return normalizeTasksResponse(response);
}

export async function getTask(
  taskId: number,
): Promise<Task> {
  const response = await apiRequest<unknown>(
    `/api/gettask/${taskId}`,
    {
      method: "GET",
    },
  );

  return normalizeSingleTaskResponse(response);
}

export async function getProjectTasks(
  projectId: number,
): Promise<Task[]> {
  const response = await apiRequest<unknown>(
    `/api/gettasks/project/${projectId}`,
    {
      method: "GET",
    },
  );

  return normalizeTasksResponse(response);
}

export async function getFolderTasks(
  folderId: number,
): Promise<Task[]> {
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
  return apiRequest<Task>(
    `/api/updatetask/${taskId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
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

export async function getTaskComments(
  taskId: number,
): Promise<TaskComment[]> {
  const response = await apiRequest<unknown>(
    `/api/tasks/${taskId}/comments`,
    {
      method: "GET",
    },
  );

  return normalizeCommentsResponse(response);
}

export async function performTaskAction(
  taskId: number,
  payload: TaskActionPayload,
): Promise<TaskActionResponse> {
  return apiRequest<TaskActionResponse>(
    `/api/tasks/${taskId}/action`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

function normalizeTasksResponse(
  response: unknown,
): Task[] {
  if (Array.isArray(response)) {
    return response as Task[];
  }

  if (
    response === null ||
    typeof response !== "object"
  ) {
    return [];
  }

  const data = response as Record<string, unknown>;

  if (Array.isArray(data.tasks)) {
    return data.tasks as Task[];
  }

  if (Array.isArray(data.items)) {
    return data.items as Task[];
  }

  if (Array.isArray(data.data)) {
    return data.data as Task[];
  }

  if (
    data.data !== null &&
    typeof data.data === "object" &&
    !Array.isArray(data.data)
  ) {
    const nested = data.data as Record<string, unknown>;

    if (Array.isArray(nested.tasks)) {
      return nested.tasks as Task[];
    }

    if (Array.isArray(nested.items)) {
      return nested.items as Task[];
    }
  }

  return [];
}

function normalizeSingleTaskResponse(
  response: unknown,
): Task {
  if (
    response === null ||
    typeof response !== "object" ||
    Array.isArray(response)
  ) {
    throw new Error(
      "Unable to find task in API response.",
    );
  }

  const data = response as Record<string, unknown>;

  if (
    data.task !== null &&
    typeof data.task === "object" &&
    !Array.isArray(data.task)
  ) {
    return data.task as Task;
  }

  if (
    data.data !== null &&
    typeof data.data === "object" &&
    !Array.isArray(data.data)
  ) {
    const nested = data.data as Record<string, unknown>;

    if (
      nested.task !== null &&
      typeof nested.task === "object" &&
      !Array.isArray(nested.task)
    ) {
      return nested.task as Task;
    }

    if ("task_id" in nested) {
      return nested as unknown as Task;
    }
  }

  if ("task_id" in data) {
    return data as unknown as Task;
  }

  throw new Error(
    "Unable to find task in API response.",
  );
}
function normalizeCommentsResponse(
  response: unknown,
): TaskComment[] {
  if (Array.isArray(response)) {
    return response as TaskComment[];
  }

  if (
    response === null ||
    typeof response !== "object"
  ) {
    return [];
  }

  const data = response as Record<string, unknown>;

  if (Array.isArray(data.comments)) {
    return data.comments as TaskComment[];
  }

  if (Array.isArray(data.items)) {
    return data.items as TaskComment[];
  }

  if (Array.isArray(data.data)) {
    return data.data as TaskComment[];
  }

  if (
    data.data !== null &&
    typeof data.data === "object" &&
    !Array.isArray(data.data)
  ) {
    const nested = data.data as Record<string, unknown>;

    if (Array.isArray(nested.comments)) {
      return nested.comments as TaskComment[];
    }

    if (Array.isArray(nested.items)) {
      return nested.items as TaskComment[];
    }
  }

  return [];
}

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

export async function viewFolderFile(
  projectId: number,
  folderId: number,
  fileId: number,
): Promise<void> {
  const newWindow = window.open("", "_blank");

  if (!newWindow) {
    throw new Error(
      "Unable to open file viewer. Please allow popups for this site.",
    );
  }

  try {
    const blob = await downloadFolderFile(
      projectId,
      folderId,
      fileId,
    );

    const blobUrl = URL.createObjectURL(blob);
    newWindow.location.href = blobUrl;

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60_000);
  } catch (error) {
    newWindow.close();
    throw error;
  }
}

export async function saveFolderFile(
  projectId: number,
  folderId: number,
  fileId: number,
  filename: string,
): Promise<void> {
  const blob = await downloadFolderFile(
    projectId,
    folderId,
    fileId,
  );

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = filename || "download";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1_000);
}

