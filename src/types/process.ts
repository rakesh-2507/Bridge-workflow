// ============================================================
// PROCESS TYPES
// ============================================================

export interface ProcessAttribute {
  Name: string;
  DataType: string;
  Min?: number;
  Max?: number;
  Required?: boolean;
}

// ============================================================
// PROCESS LEVEL
// ============================================================

export interface ProcessLevel {
  Label?: string;
  Actions?: string[];
  Sequence?: number;

  // Optional workflow configuration metadata
  condition?: string;
  assignTo?: string;

  backofficeSubWorkflow?: {
    levels: ProcessLevel[];
  };
}

// ============================================================
// COMPARISON RATING
// ============================================================

export interface ProcessComparisonRating {
  Min?: number;
  Max?: number;
}

// ============================================================
// TASK DETAILS
// ============================================================

export interface ProcessTaskDetails {
  TaskName?: string;
  DocumentType?: string;

  // Workflow configuration
  ConfigID?: string;
  ConfigType?: string;
  KeyParam?: string;

  // Shortlisting / rating
  ItemParams?: string[];

  // Task fields
  Attributes?: ProcessAttribute[];

  // Approval workflow
  Levels?: ProcessLevel[];
  Level?: ProcessLevel;

  // Rating
  ComparisonRating?: ProcessComparisonRating;

  // Selection
  SelectionAttribute?: string;

  // Quotation creation
  MaximumQuotations?: number;
}

// ============================================================
// PROCESS TASK
// ============================================================

export interface ProcessTask {
  TaskTypeID: number;
  TaskType: string;
  TaskDetails: ProcessTaskDetails;
}

// ============================================================
// PROCESS JSON
// ============================================================
//
// Used when receiving an existing process from the API.
//
// Processid is required here because existing processes
// returned by the backend contain their ID.
// ============================================================

export interface ProcessJson {
  Processid: number;
  ProcessName: string;
  DocumentType: string;
  NumberofTasks: number;
  Tasks: ProcessTask[];
}

// ============================================================
// CREATE PROCESS JSON
// ============================================================
//
// IMPORTANT:
//
// The create-process API payload does NOT require Processid.
//
// Expected:
//
// {
//   "ProcessJson": {
//     "ProcessName": "...",
//     "DocumentType": "...",
//     "NumberofTasks": 5,
//     "Tasks": []
//   }
// }
// ============================================================

export interface CreateProcessJson {
  ProcessName: string;
  DocumentType: string;
  NumberofTasks: number;
  Tasks: ProcessTask[];
}

// ============================================================
// CREATE PROCESS REQUEST
// ============================================================

export interface CreateProcessRequest {
  ProcessJson: CreateProcessJson;
}

// ============================================================
// PROCESS LIST ITEM
// ============================================================

export interface ProcessListItem {
  Processid: number;
  ProcessName: string;
  DocumentType: string;
  NumberofTasks: number;
  Status: number;
  CreatedDate: string;
  UpdatedDate: string;
}

// ============================================================
// PROCESS LIST RESPONSE
// ============================================================

export interface ProcessListResponse {
  success: boolean;
  code: string;
  data: ProcessListItem[];
  total: number;
}

// ============================================================
// GET PROCESS RESPONSE
// ============================================================

export interface GetProcessResponse {
  ProcessJson: ProcessJson;
}

// ============================================================
// TASK TYPE
// ============================================================

export interface TaskType {
  TaskTypeID: number;
  TaskType: string;
  Description: string;
}

// ============================================================
// TASK TYPES RESPONSE
// ============================================================

export interface TaskTypesResponse {
  success: boolean;
  code: string;
  data: TaskType[];
  total: number;
}

// ============================================================
// WORKFLOW CONFIG SUMMARY
// ============================================================

export interface WorkflowConfigSummary {
  id: string;
  name: string;
  icon?: string;

  configType: string;

  itemParams: string[];

  keyParam?: string | null;

  status: string;

  version: number;

  /**
   * Summary API returns the number of levels.
   */
  levels: number;

  hasSubWorkflow: boolean;
}

// ============================================================
// WORKFLOW CONFIG LEVEL
// ============================================================
//
// API uses lowercase properties:
//
// {
//   "label": "...",
//   "actions": [...],
//   "condition": "...",
//   "assignTo": "...",
//   "backofficeSubWorkflow": {...}
// }
//
// ProcessLevel uses the backend ProcessJson naming:
//
// {
//   "Label": "...",
//   "Actions": [...],
//   "Sequence": 1
// }
//
// This interface supports both the API workflow structure
// and the ProcessLevel structure.
// ============================================================

export interface WorkflowConfigLevel extends ProcessLevel {
  label: string;
  actions: string[];

  condition?: string;
  assignTo?: string;

  backofficeSubWorkflow?: {
    levels: WorkflowConfigLevel[];
  };
}

// ============================================================
// WORKFLOW CONFIG
// ============================================================

export interface WorkflowConfig {
  id: string;
  name: string;
  icon?: string;

  configType: string;

  itemParams: string[];

  keyParam?: string | null;

  status: string;

  version: number;

  levels: WorkflowConfigLevel[];

  hasSubWorkflow: boolean;
}

// ============================================================
// WORKFLOW CONFIG LIST RESPONSE
// ============================================================

export interface WorkflowConfigsResponse {
  success: boolean;
  code: string;
  data: WorkflowConfigSummary[];
  total: number;
}

// ============================================================
// WORKFLOW CONFIG RESPONSE
// ============================================================

export interface WorkflowConfigResponse {
  success: boolean;
  code: string;
  data: WorkflowConfig;
}

// ============================================================
// CREATE PROCESS RESPONSE
// ============================================================

export type CreateProcessResponse =
  | string
  | Record<string, unknown>;