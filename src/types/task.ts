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
     * 1 / undefined = Pending
     * 2 = In Progress
     * 3 = Completed
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
    wf_task_id: string;

    folder_id: number | null;
    project_id: number | null;

    task_description: string;
    document_no: string;

    status: number;

    start_date: string;

    assigned_by: number;
    created_date: string;

    task_id: number;

    template_id: number | null;

    task_type: string;
    document_type: string;

    key_params: Record<string, unknown>;

    levels: string[];

    end_date: string | null;

    assigned_to: number;

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

export interface UpdateTaskPayload
    extends CreateTaskPayload {
    status: number;
}