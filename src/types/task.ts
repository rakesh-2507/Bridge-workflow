export interface UploadedFile {
  pffid: number;
  projectid: number;
  fid: number;
  filename: string;
  filesize: number;
  MIME: string;
  createddate?: string;
  createduid?: number;
  isActive?: number;
  project_id?: number;
  folder_id?: number;
  uploaded_by?: number;
  file_url?: string;
  url?: string;
  download_url?: string;
  document_url?: string;
  view_url?: string;
  path?: string;
  [key: string]: unknown;
}

export interface TaskFile extends UploadedFile {
  [key: string]: unknown;
}

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
  status?: number;
  document_no?: string | null;
  document_type?: string | null;
  wf_task_id?: string | null;
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

export interface GetTaskData {
  task: TaskDetails;
  bridge_task_files: TaskFile[];
  bridge_task_files_count: number;
  project_folder_files: TaskFile[];
  project_folder_files_count: number;
}

export interface GetTaskResponse {
  success: boolean;
  data: GetTaskData;
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

export interface UpdateTaskPayload
  extends CreateTaskPayload {
  status: number;
}

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

export interface TaskActionPayload {
  action: string;
  comment: string;
}

export interface TaskActionResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}