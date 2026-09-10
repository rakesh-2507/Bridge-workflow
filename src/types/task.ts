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
    document_no?: string;
    document_type?: string;
    wf_task_id?: string;

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

/**
 * Asset Purchase Request data
 */
export interface AssetPurchaseRequestData {
    asset: string;
    asset_type: string;
    asset_description: string;
    required_date: string;
    purchase_reason: string;
}

/**
 * Document attached to an Asset Purchase Task
 */
export interface AssetPurchaseTaskDocument {
    document_id: number;
    document_type: string;
    document_no: string;

    request_data: AssetPurchaseRequestData;

    created_by: number;
    created_date: string;
    updated_date: string;
}

/**
 * Response data from:
 * GET /api/asset-purchase/tasks/{task_id}
 */
export interface AssetPurchaseTaskDetails {
    task_id: number;
    wf_task_id: string;

    task_type: string;
    task_description: string;

    document: AssetPurchaseTaskDocument;

    status: number;

    assigned_by: number;
    assigned_to: number;

    levels: string[];

    selected_quote_id: number | null;

    start_date: string;
    end_date: string | null;

    key_params: Record<string, unknown>;

    created_date: string;
    updated_date: string;
}

export interface GetAssetPurchaseTaskResponse {
    success: boolean;
    code: string;
    message: string;
    data: AssetPurchaseTaskDetails;
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

export interface GetAssetPurchaseTasksResponse {
    success: boolean;
    code: string;
    message: string;
    data: AssetPurchaseTaskDetails[];
}