import { apiRequest } from "./client";

import type {
  CreateProcessRequest,
  CreateProcessResponse,
  GetProcessResponse,
  ProcessJson,
  ProcessListResponse,
  TaskTypesResponse,
  WorkflowConfigResponse,
  WorkflowConfigsResponse,
} from "../types/process";

// ============================================================
// CREATE PROCESS
// ============================================================
//
// Creates a complete workflow process.
//
// ProcessJson contains:
//
// - Processid
// - ProcessName
// - DocumentType
// - NumberofTasks
// - Tasks
//   - TaskTypeID
//   - TaskType
//   - TaskDetails
//   - position { x, y }
// - connections
//   - source
//   - target
//
// ============================================================

export async function createProcess(
  processData: CreateProcessRequest,
): Promise<CreateProcessResponse> {
  return apiRequest<CreateProcessResponse>(
    "/api/process/createprocess",
    {
      method: "POST",
      body: JSON.stringify(processData),
    },
  );
}

// ============================================================
// GET PROCESS LIST
// ============================================================

export async function getProcessList(): Promise<ProcessListResponse> {
  return apiRequest<ProcessListResponse>(
    "/api/process/getprocess-list",
    {
      method: "GET",
    },
  );
}

// ============================================================
// GET PROCESS BY ID
// ============================================================
//
// Returns the complete ProcessJson.
//
// ============================================================

export async function getProcess(
  processId: number,
): Promise<GetProcessResponse> {
  if (!Number.isInteger(processId)) {
    throw new Error("Valid process ID is required.");
  }

  return apiRequest<GetProcessResponse>(
    `/api/process/getprocess/${encodeURIComponent(processId)}`,
    {
      method: "GET",
    },
  );
}

// ============================================================
// UPDATE PROCESS
// ============================================================
//
// Updates the complete ProcessJson.
//
// Endpoint:
//
// PUT /api/process/updateprocess/{process_id}
//
// The current ReactFlow positions and connections are sent
// inside ProcessJson.
//
// Example:
//
// {
//   "ProcessJson": {
//     "Processid": 1,
//     "ProcessName": "Asset Purchase",
//     "DocumentType": "Asset",
//     "NumberofTasks": 3,
//     "Tasks": [
//       {
//         "TaskTypeID": 1,
//         "TaskType": "Raise Request",
//         "position": {
//           "x": 100,
//           "y": 200
//         },
//         "TaskDetails": {}
//       }
//     ],
//     "connections": [
//       {
//         "source": "task-1-0",
//         "target": "task-2-1"
//       }
//     ]
//   }
// }
//
// ============================================================

export async function updateProcess(
  processId: number,
  processData: {
    ProcessJson: ProcessJson;
  },
): Promise<unknown> {
  if (!Number.isInteger(processId)) {
    throw new Error("Valid process ID is required.");
  }

  return apiRequest<unknown>(
    `/api/process/updateprocess/${encodeURIComponent(processId)}`,
    {
      method: "PUT",
      body: JSON.stringify(processData),
    },
  );
}

// ============================================================
// GET TASK TYPES
// ============================================================
//
// Returns the available task types that can be added to a
// workflow process.
//
// ============================================================

export async function getTaskTypes(): Promise<TaskTypesResponse> {
  return apiRequest<TaskTypesResponse>(
    "/api/process/gettasktypes",
    {
      method: "GET",
    },
  );
}

// ============================================================
// GET WORKFLOW CONFIGS
// ============================================================
//
// Returns workflow configuration summaries.
//
// ============================================================

export async function getWorkflowConfigs(): Promise<WorkflowConfigsResponse> {
  return apiRequest<WorkflowConfigsResponse>(
    "/api/process/workflow-configs",
    {
      method: "GET",
    },
  );
}

// ============================================================
// GET WORKFLOW CONFIG BY ID
// ============================================================
//
// Returns the complete workflow configuration.
//
// ============================================================

export async function getWorkflowConfig(
  configId: string,
): Promise<WorkflowConfigResponse> {
  const normalizedConfigId = configId.trim();

  if (!normalizedConfigId) {
    throw new Error(
      "Workflow configuration ID is required.",
    );
  }

  return apiRequest<WorkflowConfigResponse>(
    `/api/process/workflow-configs/${encodeURIComponent(
      normalizedConfigId,
    )}`,
    {
      method: "GET",
    },
  );
}
