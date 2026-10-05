import { apiRequest } from "./client";

import type {
  CreateProjectTemplatePayload,
  EditProjectTemplatePayload,
  GetProjectTemplateResponse,
  GetWorkflowProcessResponse,
  UpdateWorkflowProcessPayload,
  WorkflowConfigResponse,
} from "../types/projectTemplate";

/* =========================================================
 * Create Project Template
 * ========================================================= */

export const createProjectTemplate = async (
  data: CreateProjectTemplatePayload
) => {
  return apiRequest("/api/createprojecttemplate", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/* =========================================================
 * Get Project Template
 * ========================================================= */

export const getProjectTemplate = async (
  templateId: number
): Promise<GetProjectTemplateResponse> => {
  return apiRequest<GetProjectTemplateResponse>(
    `/api/getprojecttemplate/${templateId}`,
    {
      method: "GET",
    }
  );
};

/* =========================================================
 * Edit Project Template
 * ========================================================= */

export const editProjectTemplate = async (
  templateId: number,
  data: EditProjectTemplatePayload
) => {
  return apiRequest(
    `/api/editprojecttemplate/${templateId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
};

/* =========================================================
 * Get Workflow Process
 *
 * Used before updating the process name because the
 * designer API expects the existing tasks and connections
 * as part of the request.
 * ========================================================= */

export const getWorkflowProcess = async (
  processId: number
): Promise<GetWorkflowProcessResponse> => {
  return apiRequest<GetWorkflowProcessResponse>(
    `/api/process/${processId}`,
    {
      method: "GET",
    }
  );
};

/* =========================================================
 * Update Workflow Process Designer
 * ========================================================= */

export const updateWorkflowProcess = async (
  processId: number,
  data: UpdateWorkflowProcessPayload
) => {
  return apiRequest(
    `/api/process/${processId}/designer`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
};

/* =========================================================
 * Update Workflow Process Name
 *
 * IMPORTANT:
 *
 * This does not change the workflow structure.
 *
 * It first loads the existing process and then sends the
 * same tasks/connections back with only process_name changed.
 * ========================================================= */

export const updateWorkflowProcessName = async (
  processId: number,
  processName: string
) => {
  const processResponse =
    await getWorkflowProcess(processId);

  const processData =
    processResponse.ProcessJson;

  if (!processData) {
    throw new Error(
      "Workflow process data could not be loaded."
    );
  }

  const payload:
    UpdateWorkflowProcessPayload = {
    process_name: processName,

    tasks: processData.Tasks.map(
      (task) => ({
        task_config_id:
          task.task_config_id,

        position: {
          x:
            task.position?.x ??
            0,

          y:
            task.position?.y ??
            0,
        },
      })
    ),

    connections:
      processData.connections,
  };

  console.log(
    "Update workflow process payload:",
    payload
  );

  return updateWorkflowProcess(
    processId,
    payload
  );
};

/* =========================================================
 * Check Project Template Name
 * ========================================================= */

export interface CheckTemplateNameResponse {
  available: boolean;
  code?: string;
  message: string;
}

export const checkProjectTemplateName = async (
  name: string
): Promise<CheckTemplateNameResponse> => {
  return apiRequest(
    `/api/checkprojecttemplatename?name=${encodeURIComponent(
      name
    )}`,
    {
      method: "GET",
    }
  );
};

/* =========================================================
 * Workflow Configs
 * ========================================================= */

export const getWorkflowConfigs =
  async (): Promise<WorkflowConfigResponse> => {
    return apiRequest<WorkflowConfigResponse>(
      "/api/getworkflowconfigs",
      {
        method: "GET",
      }
    );
  };