export interface AssetPurchaseRequest {
    asset: string;
    asset_type: string;
    asset_description: string;
    required_date: string;
    purchase_reason: string;
}

export interface CreateDocumentPayload {
    document_type: string;
    document_no: string;
    document_json: AssetPurchaseRequest;
}

export interface DocumentResponse {
    success: boolean;
    code: string;
    message: string;
    data: {
        document_id?: number;
        document_type?: string;
        document_no: string;
        document_json?: AssetPurchaseRequest;
        created_by?: number;
        created_date?: string;
        updated_date?: string;
    };
}