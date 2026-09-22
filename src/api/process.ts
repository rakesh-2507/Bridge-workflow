import { apiRequest } from "./client";

import type {
  CreateProcessRequest,
  CreateProcessResponse,
  GetProcessResponse,
  ProcessListResponse,
  TaskTypesResponse,
  WorkflowConfigResponse,
  WorkflowConfigsResponse,
} from "../types/process";

// ============================================================
// CREATE PROCESS
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

export async function getProcess(
  processId: number,
): Promise<GetProcessResponse> {
  return apiRequest<GetProcessResponse>(
    `/api/process/getprocess/${processId}`,
    {
      method: "GET",
    },
  );
}

// ============================================================
// GET TASK TYPES
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
// Returns available workflow configurations.
//
// Example:
//
// Approval
//   -> Asset Purchase Approval
//   -> Credit Approval
//
// Rating
//   -> Asset Quotation Rating
//
// Selection
//   -> Asset Quotation Selection
//
// ConfigID, ConfigType, KeyParam and ItemParams are
// obtained from the API instead of being manually entered.
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
// Returns complete configuration details.
//
// Includes:
//
// - levels
// - actions
// - conditions
// - assignments
// - backoffice sub-workflows
//
// ============================================================

export async function getWorkflowConfig(
  configId: string,
): Promise<WorkflowConfigResponse> {
  if (!configId.trim()) {
    throw new Error("Workflow configuration ID is required.");
  }

  return apiRequest<WorkflowConfigResponse>(
    `/api/process/workflow-configs/${encodeURIComponent(configId)}`,
    {
      method: "GET",
    },
  );
}