import { apiRequest } from "./client";

export interface ProcessPosition {
    x: number;
    y: number;
}

export interface ProcessLevel {
    role: string;
    level: number;
}

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

export interface ProcessTask {
    TaskID: string;
    task_config_id: number;
    TaskTypeID: number;
    TaskType: string;
    position: ProcessPosition;
    TaskDetails: ProcessTaskDetails;
}

export interface ProcessConnection {
    source: string;
    target: string;
}

export interface ProcessDesignerTask {
    task_config_id: number;
    position: ProcessPosition;
}

export interface ProcessDesignerPayload {
    process_name: string;
    tasks: ProcessDesignerTask[];
    connections: ProcessConnection[];
}

export interface ProcessJson {
    Processid?: number;
    ProcessName: string;
    DocumentType?: string;
    NumberofTasks: number;
    Tasks: ProcessTask[];
    connections: ProcessConnection[];
}

export interface ProcessListItem {
    process_id: number;
    process_name: string;
    number_of_tasks: number;
}

export interface ProcessListResponse {
    success: boolean;
    code: string;
    message: string;
    data: {
        processes: ProcessListItem[];
    };
}

export interface GetProcessResponse {
    ProcessJson: ProcessJson;
}

export async function getProcesses(): Promise<ProcessListResponse> {
    return apiRequest<ProcessListResponse>(
        "/api/processes",
        {
            method: "GET",
        }
    );
}

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

export async function createProcess(
    processJson: ProcessJson
) {
    return apiRequest(
        "/api/process/createprocess",
        {
            method: "POST",
            body: JSON.stringify({
                ProcessJson: processJson,
            }),
        }
    );
}

export async function saveProcessDesigner(
    processId: number,
    payload: ProcessDesignerPayload
) {
    return apiRequest(
        `/api/process/${processId}/designer`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        }
    );
}