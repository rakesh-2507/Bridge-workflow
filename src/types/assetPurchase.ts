export interface AssetPurchaseRequestData {
    asset: string;
    asset_type: string;
    asset_description: string;
    required_date: string;
    purchase_reason: string;
}

export interface CreateAssetPurchaseRequestPayload {
    document_no: string;
    request_data: AssetPurchaseRequestData;
}

export interface CreateAssetPurchaseRequestResponse {
    success: boolean;
    code: string;
    message: string;
    data: {
        document_id: number;
        document_type: string;
        document_no: string;
        task_id: number;
        wf_task_id: string;
        assigned_to: number;
    };
}