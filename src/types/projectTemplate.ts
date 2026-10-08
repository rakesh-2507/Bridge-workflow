export interface ProjectType {
  ptypeid: number;
  projecttype: string;
}

/* ----------------------------------------
 * Project Template
 * ---------------------------------------- */

export interface ProjectTemplate {
  tid: number;
  name: string;
  name_desc: string;
  projecttype: number;
  workflow_config_id?: string;
  workflow_scope?: "FOLDER";
  process_id?: number | null;
}

export interface ProjectTemplateListResponse {
  templates: ProjectTemplate[];
  total: number;
}

/* ----------------------------------------
 * Project Template Details
 * ---------------------------------------- */

export interface ProjectTemplateDetails {
  name: string;
  description: string;
  project_type_id: number;
  workflow_config_id: string;
  workflow_scope: "FOLDER";
}

/* ----------------------------------------
 * Project Template Folder
 *
 * Used by the existing create wizard.
 * ---------------------------------------- */

export interface ProjectTemplateFolder {
  id: string;
  name: string;
  description: string;
  parentFolderId: string | null;
  roles: string[];
}

/* ----------------------------------------
 * Create Project Template
 * ---------------------------------------- */

export interface CreateProjectTemplateFolder {
  name: string;
  description: string;
  parent_folder_index: number | null;
  roles: string[];
}

export interface CreateProjectTemplatePayload {
  project_template: ProjectTemplateDetails;
  folders: CreateProjectTemplateFolder[];
}

/* ----------------------------------------
 * Get Project Template API
 * ---------------------------------------- */

export interface GetProjectTemplateTemplate {
  tid: number;
  name: string;
  name_desc: string;
  projecttype: number;
  workflow_config_id: string;
  process_id: number | null;
  workflow_scope: "FOLDER";
}

export interface GetProjectTemplateProcess {
  process_id: number | null;
  process_name: string | null;
  number_of_tasks: number;
  connections: unknown[];
  tasks: unknown[];
}

export interface GetProjectTemplateWorkflowConfig {
  id: string;
  name: string;
  icon: string;
  configType: string;
  itemParams: unknown[];
  keyParam: string | null;
  status: string;
  version: number;
  levels: number;
  hasSubWorkflow: boolean;
}

export interface GetProjectTemplateFolder {
  fid: number;
  fname: string;
  pid: number | null;
  tid: number;
  fnamedesc: string;
  roles: string[];
}

export interface GetProjectTemplateResponse {
  success: boolean;
  code: string;
  message: string;
  data: {
    template: GetProjectTemplateTemplate;
    process: GetProjectTemplateProcess;
    workflow_config: GetProjectTemplateWorkflowConfig;
    folders: GetProjectTemplateFolder[];
  };
}

/* ----------------------------------------
 * Edit Project Template API
 * ---------------------------------------- */

export interface EditProjectTemplateFolder {
  fid: number;
  name: string;
  description: string;
  parent_folder_index: number | null;
  roles: string[];
}

export interface EditProjectTemplatePayload {
  project_template: ProjectTemplateDetails;
  folders: EditProjectTemplateFolder[];
}

/* ----------------------------------------
 * Workflow Process API
 * ---------------------------------------- */

export interface WorkflowProcessPosition {
  x: number;
  y: number;
}

export interface WorkflowProcessTask {
  TaskID: string | number;
  task_config_id: number | string;
  TaskTypeID?: number;
  TaskType?: string;
  position?: WorkflowProcessPosition;
  TaskDetails?: unknown;
}

export interface WorkflowProcessConnection {
  source: string;
  target: string;
}

export interface WorkflowProcessJson {
  Processid: number;
  ProcessName: string;
  NumberofTasks: number;
  Tasks: WorkflowProcessTask[];
  connections: WorkflowProcessConnection[];
}

export interface GetWorkflowProcessResponse {
  ProcessJson: WorkflowProcessJson;
}

/* ----------------------------------------
 * Update Workflow Process
 * ---------------------------------------- */

export interface UpdateWorkflowProcessTask {
  task_config_id: number | string;
  position: WorkflowProcessPosition;
}

export interface UpdateWorkflowProcessPayload {
  process_name: string;
  tasks: UpdateWorkflowProcessTask[];
  connections: WorkflowProcessConnection[];
}

/* ----------------------------------------
 * Workflow Config
 * ---------------------------------------- */

export interface WorkflowConfig {
  id: string;
  name: string;
  icon: string;
  configType: string;
  itemParams: string[];
  keyParam: string | null;
  status: string;
  version: number;
  levels: number;
  hasSubWorkflow: boolean;
}

export interface WorkflowConfigResponse {
  success: boolean;
  code: string;
  message: string;
  data: {
    configs: WorkflowConfig[];
  };
}

/* ----------------------------------------
 * Create Project From Template
 * ---------------------------------------- */

export interface CreateProjectFromTemplateDetails {
  template_id: number;
  company_id: number;

  project_name: string;
  project_description: string;

  start_date: string;
  end_date: string;

  member_ids: number[];
  coordinator: number;

  is_project_manage: number;

  projecttype: number;
}

/* ----------------------------------------
 * Folder Schedule
 * ---------------------------------------- */

export interface FolderSchedule {
  folder_id: number;
  start_date: string;
  end_date: string;
}

/* ----------------------------------------
 * Template Folder Roles
 * ---------------------------------------- */

export interface TemplateFolderRoleItem {
  fid: number;
  role: string;
  id: number;
}

export interface TemplateFolderRole {
  folder_id: number;
  folder_name: string;
  roles: TemplateFolderRoleItem[];
}

export interface TemplateFolderRolesResponse {
  template_id: number;
  folders: TemplateFolderRole[];
}

/* ----------------------------------------
 * Folder User Assignment
 * ---------------------------------------- */

export interface RoleAssignment {
  role: string;
  user_id: number;
  workflow_level: string;
}

export interface FolderAssignment {
  folder_id: number;
  start_date: string;
  end_date: string;
  role_assignments: RoleAssignment[];
}

/* ----------------------------------------
 * Final Create Project API Payload
 * ---------------------------------------- */

export interface CreateProjectFromTemplatePayload {
  project: CreateProjectFromTemplateDetails;
  folder_assignments: FolderAssignment[];
}

/* ----------------------------------------
 * Create Project Wizard State
 * ---------------------------------------- */

export interface CreateProjectWizardData {
  project: CreateProjectFromTemplateDetails;
  folderSchedules: FolderSchedule[];
  folderAssignments: FolderAssignment[];
}