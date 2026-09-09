export interface AssetPurchaseQuoteData {
    additionalProp1?: {
        details?: string;
        [key: string]: unknown;
    };
}

export interface CreateAssetPurchaseQuotePayload {
    document_no: string;
    vendor_name: string;
    quote_no: string;
    quote_date: string;
    quoted_amount: number;
    currency: string;
    quote_data: AssetPurchaseQuoteData;
}

export interface CreateAssetPurchaseQuoteResponse {
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

/* GET /api/asset-purchase/quotes/{document_no} */

export interface AssetPurchaseQuote {
    quote_id: number;
    document_id: number;
    document_no: string;
    vendor_name: string;
    quote_no: string;
    quote_date: string;
    quoted_amount: number;
    currency: string;
    quote_data: AssetPurchaseQuoteData;
    created_by: number;
    created_date: string;
    updated_date: string;
}

export interface GetAssetPurchaseQuotesResponse {
    success: boolean;
    code: string;
    message: string;
    data: AssetPurchaseQuote[];
}