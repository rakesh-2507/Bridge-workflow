export interface AssetPurchaseRequestData {
    [key: string]: unknown;

    asset?: string;
    asset_type?: string;
    asset_description?: string;
    required_date?: string;
    purchase_reason?: string;

    // Alternative request format
    purpose?: string;
    quantity?: number;
    asset_name?: string;
    asset_category?: string;
    estimated_amount?: number;
}

export interface CreateAssetPurchaseRequestResponse {
  success: boolean;
  code: string;
  message: string;
  data: {
    document_id: number;
    document_type: string;
    document_no: string;
    request_data: AssetPurchaseRequestData;
    task_id: number;
    wf_task_id: string;
    assigned_to: number;
  };
}
