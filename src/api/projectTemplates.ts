import { apiRequest } from "./client";

import type {
  CreateProjectTemplatePayload,
  WorkflowConfigResponse,
} from "../types/projectTemplate";

export const createProjectTemplate = async (
  data: CreateProjectTemplatePayload
) => {
  return apiRequest("/api/createprojecttemplate", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/* ----------------------------------------
 * Check Project Template Name
 * ---------------------------------------- */

export interface CheckTemplateNameResponse {
  available: boolean;
  code?: string;
  message: string;
}

export const checkProjectTemplateName = async (
  name: string
): Promise<CheckTemplateNameResponse> => {
  return apiRequest(
    `/api/checkprojecttemplatename?name=${encodeURIComponent(name)}`,
    {
      method: "GET",
    }
  );
};

/* ----------------------------------------
 * Workflow Configs
 * ---------------------------------------- */

export const getWorkflowConfigs =
  async (): Promise<WorkflowConfigResponse> => {
    return apiRequest<WorkflowConfigResponse>(
      "/api/getworkflowconfigs",
      {
        method: "GET",
      }
    );
  };