import { apiRequest } from "./client";

import type {
  CreateProjectTemplatePayload,
  EditProjectTemplatePayload,
  GetProjectTemplateResponse,
  GetProjectTemplatesResponse,
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
 *
 * Gets the complete details of one selected template.
 *
 * Response contains:
 * - template
 * - process
 * - workflow_config
 * - folders
 *
 * The workflow_config.levels are used when assigning
 * project roles to workflow levels.
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
 * Get Project Templates
 *
 * Gets the list of available project templates.
 *
 * IMPORTANT:
 * The Swagger documentation currently does not expose the
 * actual 200-response schema for this endpoint. Therefore
 * this is intentionally typed as unknown for now instead
 * of incorrectly using GetProjectTemplateResponse.
 *
 * Once the actual successful response is available, we can
 * create the exact response type.
 * ========================================================= */

export const getProjectTemplates =
  async (): Promise<GetProjectTemplatesResponse> => {
    return apiRequest<GetProjectTemplatesResponse>(
      "/api/getprojecttemplates",
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
 *
 * Kept because other existing pages may still use this API.
 *
 * CreateProjectWizard does not need to use this API for
 * workflow levels once it loads the selected template using
 * getProjectTemplate().
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
