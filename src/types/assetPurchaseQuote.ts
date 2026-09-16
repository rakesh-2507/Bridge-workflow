export interface AssetPurchaseQuoteData {
  additionalProp1?: {
    details?: string;
    [key: string]: unknown;
  };
}

/*
 * POST /api/asset-purchase/quotes
 */
export interface CreateAssetPurchaseQuotePayload {
  document_no: string;
  vendor_name: string;
  quote_no: string;
  quote_date: string;
  quoted_amount: number;
  currency: string;
  executive_rating: number;
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

/*
 * GET /api/asset-purchase/quotes/{document_no}
 */
export interface AssetPurchaseQuote {
  quote_id: number;
  document_id: number;
  document_no: string;
  vendor_name: string;
  quote_no: string;
  quote_date: string;
  quoted_amount: number;
  currency: string;
  executive_rating: number;
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

/*
 * POST /api/asset-purchase/tasks/{task_id}/quotes/{quote_id}/rating
 */
export interface UpdateAssetQuoteRatingResponse {
  success: boolean;
  code: string;
  message: string;

  task_id: number;
  document_no: string;

  quote: {
    quote_id: number;
    vendor_name: string;
    quote_no: string;
    quoted_amount: number;
    old_rating: number;
    rating: number;
  };

  updated_by: number;
}

/*
 * POST /api/asset-purchase/tasks/{task_id}/submit-ratings
 */
export interface SubmitAssetPurchaseRatingsResponse {
  success: boolean;
  code: string;
  message: string;

  task_id: number;
  wf_task_id: string;

  vijay_status: string;

  ratings: Record<string, number>;

  quotations_locked: boolean;
}

export interface SelectAssetPurchaseQuoteResponse {
  success: boolean;
  message: string;

  task_id: number;
  wf_task_id: string;
  document_no: string;
  status: number;

  selected_quote: {
    quote_id: number;
    vendor_name: string;
    quote_no: string;
    quoted_amount: number;
    quote_date: string;
  };

  vijay_status: string;

  vijay_response?: {
    id?: string;
    configName?: string;
    configType?: string;
    status?: string;
    [key: string]: unknown;
  };
}
