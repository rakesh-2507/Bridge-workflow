import { apiRequest } from "./client";

import type {
  Task,
  GetTaskResponse,
  CreateTaskPayload,
  UpdateTaskPayload,
} from "../types/task";

/**
 * Normalize different API response formats into Task[].
 *
 * Supported:
 * - Task[]
 * - { tasks: Task[] }
 * - { data: Task[] }
 * - { items: Task[] }
 */
function normalizeTasksResponse(response: unknown): Task[] {
  let tasks: Task[] = [];

  if (Array.isArray(response)) {
    tasks = response as Task[];
  } else if (
    response !== null &&
    typeof response === "object"
  ) {
    const data = response as Record<string, unknown>;

    if (Array.isArray(data.tasks)) {
      tasks = data.tasks as Task[];
    } else if (Array.isArray(data.data)) {
      tasks = data.data as Task[];
    } else if (Array.isArray(data.items)) {
      tasks = data.items as Task[];
    }
  }

  if (tasks.length === 0) {
    console.error(
      "Unexpected tasks API response:",
      response,
    );

    return [];
  }

  // Remove duplicate task IDs
  return Array.from(
    new Map(
      tasks.map((task) => [task.task_id, task]),
    ).values(),
  );
}

/**
 * Normalize Asset Purchase Task responses.
 *
 * Asset Purchase API can return document information
 * nested inside:
 *
 * task.document.document_no
 *
 * while the frontend expects:
 *
 * task.document_no
 *
 * This also preserves the rest of the task data.
 */
function normalizeAssetPurchaseTasksResponse(
  response: unknown,
): Task[] {
  const tasks = normalizeTasksResponse(response);

  return tasks.map((task) => {
    const rawTask = task as Task & {
      document?: {
        document_id?: number | null;
        document_type?: string | null;
        document_no?: string | null;
        request_data?: unknown;
      };
    };

    const document = rawTask.document;

    return {
      ...task,

      document_no:
        task.document_no ??
        document?.document_no ??
        undefined,

      document_type:
        task.document_type ??
        document?.document_type ??
        undefined,
    };
  });
}

/**
 * Create a new task
 */
export async function createTask(
  payload: CreateTaskPayload,
): Promise<Task> {
  return apiRequest<Task>("/api/createtask", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Get all tasks
 */
export async function getTasks(): Promise<Task[]> {
  const response = await apiRequest<unknown>(
    "/api/gettasks",
    {
      method: "GET",
    },
  );

  return normalizeTasksResponse(response);
}

/**
 * Get a single task
 */
export async function getTask(
  taskId: number,
): Promise<GetTaskResponse> {
  return apiRequest<GetTaskResponse>(
    `/api/gettask/${taskId}`,
    {
      method: "GET",
    },
  );
}

/**
 * Get tasks belonging to a project
 */
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

/**
 * Get tasks belonging to a folder
 */
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

/**
 * Update an existing task
 */
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

/**
 * Delete a task
 */
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

/**
 * Approve normal task
 */
export async function approveTask(
  taskId: number,
): Promise<string> {
  return apiRequest<string>(
    `/api/tasks/${taskId}/approve`,
    {
      method: "POST",
    },
  );
}

/**
 * Reject normal task
 */
export async function rejectTask(
  taskId: number,
): Promise<string> {
  return apiRequest<string>(
    `/api/tasks/${taskId}/reject`,
    {
      method: "POST",
    },
  );
}

/**
 * Approve Asset Purchase Task
 */
export async function approveAssetPurchaseTask(
  taskId: number,
): Promise<string> {
  return apiRequest<string>(
    `/api/asset-purchase/tasks/${taskId}/approve`,
    {
      method: "POST",
    },
  );
}

/**
 * Reject Asset Purchase Task
 */
export async function rejectAssetPurchaseTask(
  taskId: number,
): Promise<string> {
  return apiRequest<string>(
    `/api/asset-purchase/tasks/${taskId}/reject`,
    {
      method: "POST",
    },
  );
}

/**
 * Move Asset Purchase Task backward
 */
export async function backwardAssetPurchaseTask(
  taskId: number,
): Promise<string> {
  return apiRequest<string>(
    `/api/asset-purchase/tasks/${taskId}/backward`,
    {
      method: "POST",
    },
  );
}

/**
 * Get Asset Purchase Tasks
 *
 * GET /api/asset-purchase/tasks
 *
 * Normalizes nested document information so the frontend
 * can use:
 *
 * task.document_no
 * task.document_type
 *
 * instead of:
 *
 * task.document.document_no
 * task.document.document_type
 */
export async function getAssetPurchaseTasks(): Promise<Task[]> {
  const response = await apiRequest<unknown>(
    "/api/asset-purchase/tasks",
    {
      method: "GET",
    },
  );

  return normalizeAssetPurchaseTasksResponse(response);
}