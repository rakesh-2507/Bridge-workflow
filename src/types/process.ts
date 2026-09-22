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
// PROCESS POSITION
// ============================================================
//
// Position of a task/node inside the workflow diagram.
//

export interface ProcessPosition {
  x: number;
  y: number;
}

// ============================================================
// PROCESS CONNECTION
// ============================================================
//
// Connection between two workflow task nodes.
//

export interface ProcessConnection {
  source: string;
  target: string;
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

  // Allows additional backend workflow properties
  [key: string]: unknown;
}

// ============================================================
// COMPARISON RATING
// ============================================================

export interface ProcessComparisonRating {
  Min?: number;
  Max?: number;

  // Allows additional backend properties
  [key: string]: unknown;
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

  // Allows additional backend task properties
  [key: string]: unknown;
}

// ============================================================
// PROCESS TASK
// ============================================================

export interface ProcessTask {
  TaskTypeID: number;
  TaskType: string;

  // Position of this task in the workflow diagram
  position: ProcessPosition;

  TaskDetails: ProcessTaskDetails;
}

// ============================================================
// PROCESS JSON
// ============================================================
//
// Used for both:
// - Existing process responses
// - Create process request
//
// Swagger now expects Processid in ProcessJson.
//

export interface ProcessJson {
  Processid: number;
  ProcessName: string;
  DocumentType: string;
  NumberofTasks: number;

  Tasks: ProcessTask[];

  // Workflow diagram connections
  connections: ProcessConnection[];
}

// ============================================================
// CREATE PROCESS JSON
// ============================================================
//
// The current Swagger schema expects:
//
// {
//   "ProcessJson": {
//     "Processid": 0,
//     "ProcessName": "...",
//     "DocumentType": "...",
//     "NumberofTasks": 5,
//     "Tasks": [],
//     "connections": []
//   }
// }
//
// Processid can normally be sent as 0 when creating a new
// process, if that is what the backend expects.
//

export interface CreateProcessJson {
  Processid: number;
  ProcessName: string;
  DocumentType: string;
  NumberofTasks: number;

  Tasks: ProcessTask[];

  connections: ProcessConnection[];
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
// This interface supports both structures.
//

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
