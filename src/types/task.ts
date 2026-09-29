export interface Task {
  task_id: number;

  project_id: number | null;
  template_id: number | null;
  folder_id: number | null;

  task_type: string;
  task_description: string;

  key_params: Record<string, unknown>;

  levels: string[];

  start_date: string;
  end_date: string | null;

  assigned_by: number;
  assigned_to: number;

  /**
   * Task status
   */
  status?: number;

  /**
   * Asset Purchase / document related fields
   */
  document_no?: string | null;
  document_type?: string | null;
  wf_task_id?: string | null;

  /**
   * Selected quotation, if applicable
   */
  selected_quote_id?: number | null;

  created_date?: string;
  updated_date?: string;
}

export interface TaskDetails {
  wf_task_id: string | null;

  folder_id: number | null;
  project_id: number | null;

  task_description: string;
  document_no: string | null;

  status: number;

  start_date: string;

  assigned_by: number;
  created_date: string;

  task_id: number;

  template_id: number | null;

  task_type: string;
  document_type: string | null;

  key_params: Record<string, unknown>;

  levels: string[];

  end_date: string | null;

  assigned_to: number;

  selected_quote_id: number | null;

  updated_date: string;
}

export interface GetTaskResponse {
  success: boolean;
  data: TaskDetails;
}

export interface CreateTaskPayload {
  project_id: number;
  template_id: number;
  folder_id: number;

  task_type: string;
  task_description: string;

  key_params: Record<string, unknown>;

  levels: string[];

  start_date: string;
  end_date: string;

  assigned_by: number;
  assigned_to: number;
}

export interface UpdateTaskPayload extends CreateTaskPayload {
  status: number;
}

/* =========================================================
 * Task Comments
 * ========================================================= */

export interface TaskComment {
  id?: number;
  task_id?: number;
  user_id?: number;
  username?: string;
  comment: string;
  action?: string;
  created_at?: string;
  datetime?: string;

  [key: string]: unknown;
}

/* =========================================================
 * Task Actions
 * ========================================================= */

export interface TaskActionPayload {
  action: string;
  comment: string;
}

export interface TaskActionResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}
