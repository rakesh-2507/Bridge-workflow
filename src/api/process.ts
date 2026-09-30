import { apiRequest } from "./client";

/*
 * React Flow / process designer position.
 */
export interface ProcessPosition {
    x: number;
    y: number;
}

/*
 * Workflow level information.
 */
export interface ProcessLevel {
    role: string;
    level: number;
}

/*
 * Details returned for each workflow task.
 */
export interface ProcessTaskDetails {
    Level?: ProcessLevel;
    Levels?: ProcessLevel[];
    Actions?: string[];
    ConfigID?: string;
    KeyParam?: string;
    TaskName?: string;
    position?: ProcessPosition;
    Attributes?: unknown[];
    ConfigType?: string;
    ItemParams?: unknown[];
}

/*
 * Complete task returned by:
 *
 * GET /api/process/{process_id}
 */
export interface ProcessTask {
    TaskID: string;
    task_config_id: number;
    TaskTypeID: number;
    TaskType: string;

    position: ProcessPosition;

    TaskDetails: ProcessTaskDetails;
}

/*
 * Workflow connection.
 *
 * source -> target
 */
export interface ProcessConnection {
    source: string;
    target: string;
}

/*
 * Task payload used by:
 *
 * PUT /api/process/{process_id}/designer
 *
 * The designer endpoint only needs the task configuration
 * and the updated React Flow position.
 */
export interface ProcessDesignerTask {
    task_config_id: number;
    position: ProcessPosition;
}

/*
 * Payload used by the process designer save endpoint.
 *
 * IMPORTANT:
 * This is intentionally different from ProcessTask.
 *
 * ProcessTask = complete GET response.
 * ProcessDesignerTask = compact designer save payload.
 */
export interface ProcessDesignerPayload {
    process_name: string;
    tasks: ProcessDesignerTask[];
    connections: ProcessConnection[];
}

/*
 * Complete process returned by:
 *
 * GET /api/process/{process_id}
 */
export interface ProcessJson {
    Processid?: number;
    ProcessName: string;
    DocumentType?: string;
    NumberofTasks: number;
    Tasks: ProcessTask[];
    connections: ProcessConnection[];
}

/*
 * Process list item returned by:
 *
 * GET /api/processes
 */
export interface ProcessListItem {
    process_id: number;
    process_name: string;
    number_of_tasks: number;
}

/*
 * GET /api/processes response.
 */
export interface ProcessListResponse {
    success: boolean;
    code: string;
    message: string;
    data: {
        processes: ProcessListItem[];
    };
}

/*
 * GET /api/process/{process_id} response.
 */
export interface GetProcessResponse {
    ProcessJson: ProcessJson;
}

/*
 * Generic create-process response.
 *
 * The backend may return additional fields, so keep the
 * response data flexible.
 */
export interface CreateProcessResponse {
    success?: boolean;
    code?: string;
    message?: string;
    data?: unknown;
}

/*
 * Response returned after saving the process designer.
 *
 * Example:
 *
 * {
 *   "success": true,
 *   "code": "PROCESS_DESIGNER_SAVED",
 *   "message": "Process designer saved successfully",
 *   "data": {
 *      "process_id": 7,
 *      "process_name": "Test template",
 *      "number_of_tasks": 3,
 *      "connections": [...]
 *   }
 * }
 */
export interface SaveProcessDesignerResponse {
    success: boolean;
    code: string;
    message: string;
    data?: {
        process_id?: number;
        process_name?: string;
        number_of_tasks?: number;
        connections?: ProcessConnection[];
    };
}

/*
 * Get all processes.
 */
export async function getProcesses(): Promise<ProcessListResponse> {
    return apiRequest<ProcessListResponse>(
        "/api/processes",
        {
            method: "GET",
        }
    );
}

/*
 * Get a single process.
 */
export async function getProcess(
    processId: number
): Promise<GetProcessResponse> {
    return apiRequest<GetProcessResponse>(
        `/api/process/${processId}`,
        {
            method: "GET",
        }
    );
}

/*
 * Create a process.
 *
 * POST /api/process/createprocess
 *
 * Backend expects:
 *
 * {
 *   "ProcessJson": {
 *      ...
 *   }
 * }
 */
export async function createProcess(
    processJson: ProcessJson
): Promise<CreateProcessResponse> {
    return apiRequest<CreateProcessResponse>(
        "/api/process/createprocess",
        {
            method: "POST",
            body: JSON.stringify({
                ProcessJson: processJson,
            }),
        }
    );
}

/*
 * Save process designer changes.
 *
 * PUT /api/process/{process_id}/designer
 *
 * Backend expects:
 *
 * {
 *   "process_name": "...",
 *   "tasks": [
 *      {
 *         "task_config_id": 20,
 *         "position": {
 *            "x": 100,
 *            "y": 100
 *         }
 *      }
 *   ],
 *   "connections": [
 *      {
 *         "source": "task-1-0",
 *         "target": "task-2-1"
 *      }
 *   ]
 * }
 */
export async function saveProcessDesigner(
    processId: number,
    payload: ProcessDesignerPayload
): Promise<SaveProcessDesignerResponse> {
    return apiRequest<SaveProcessDesignerResponse>(
        `/api/process/${processId}/designer`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        }
    );
}
