import { apiRequest } from "./client";

import type {
  CreateAssetPurchaseQuotePayload,
  CreateAssetPurchaseQuoteResponse,
  GetAssetPurchaseQuotesResponse,
  UpdateAssetQuoteRatingResponse,
  SubmitAssetPurchaseRatingsResponse,
  SelectAssetPurchaseQuoteResponse,
} from "../types/assetPurchaseQuote";

/**
 * Create Vendor Quote
 *
 * POST /api/asset-purchase/quotes
 *
 * This only creates a quote.
 * It does NOT forward the task.
 */
export const createAssetPurchaseQuote = async (
  payload: CreateAssetPurchaseQuotePayload,
): Promise<CreateAssetPurchaseQuoteResponse> => {
  return apiRequest<CreateAssetPurchaseQuoteResponse>(
    "/api/asset-purchase/quotes",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
};

/**
 * Get all Vendor Quotes for a document
 *
 * GET /api/asset-purchase/quotes/{document_no}
 */
export const getAssetPurchaseQuotes = async (
  documentNo: string,
): Promise<GetAssetPurchaseQuotesResponse> => {
  return apiRequest<GetAssetPurchaseQuotesResponse>(
    `/api/asset-purchase/quotes/${encodeURIComponent(documentNo)}`,
    {
      method: "GET",
    },
  );
};

/**
 * Update individual quotation rating
 *
 * POST /api/asset-purchase/tasks/{task_id}/quotes/{quote_id}/rating
 *
 * This updates only one quotation rating.
 * It does NOT submit/lock all ratings.
 */
export const updateAssetQuoteRating = async (
  taskId: number,
  quoteId: number,
  rating: number,
): Promise<UpdateAssetQuoteRatingResponse> => {
  return apiRequest<UpdateAssetQuoteRatingResponse>(
    `/api/asset-purchase/tasks/${taskId}/quotes/${quoteId}/rating`,
    {
      method: "POST",
      body: JSON.stringify({
        rating,
      }),
    },
  );
};

/**
 * Submit all quotation ratings
 *
 * POST /api/asset-purchase/tasks/{task_id}/submit-ratings
 *
 * Body:
 *
 * {
 *   "ratings": {
 *     "148": 5,
 *     "149": 3,
 *     "156": 1
 *   }
 * }
 */
export const submitAssetPurchaseRatings = async (
  taskId: number,
  ratings: Record<number, number>,
): Promise<SubmitAssetPurchaseRatingsResponse> => {
  return apiRequest<SubmitAssetPurchaseRatingsResponse>(
    `/api/asset-purchase/tasks/${taskId}/submit-ratings`,
    {
      method: "POST",
      body: JSON.stringify({
        ratings,
      }),
    },
  );
};

/**
 * Forward Asset Purchase Task To Selection
 *
 * POST /api/asset-purchase/tasks/{task_id}/forward-to-selection
 */
export const forwardAssetPurchaseTaskToSelection = async (
  taskId: number,
): Promise<string> => {
  return apiRequest<string>(
    `/api/asset-purchase/tasks/${taskId}/forward-to-selection`,
    {
      method: "POST",
    },
  );
};

/**
 * Select Asset Purchase Quote
 *
 * POST /api/asset-purchase/tasks/{task_id}/select
 */
export const selectAssetPurchaseQuote = async (
  taskId: number,
  quoteId: number,
): Promise<SelectAssetPurchaseQuoteResponse> => {
  return apiRequest<SelectAssetPurchaseQuoteResponse>(
    `/api/asset-purchase/tasks/${taskId}/select`,
    {
      method: "POST",
      body: JSON.stringify({
        quote_id: quoteId,
      }),
    },
  );
};

/**
 * Forward Asset Purchase Task
 *
 * Used for the first executive submission.
 *
 * Additional quotes created after forwarding should NOT
 * call this endpoint again.
 */
export const forwardAssetPurchaseTask = async (
  taskId: number,
): Promise<string> => {
  return apiRequest<string>(`/api/asset-purchase/tasks/${taskId}/forward`, {
    method: "POST",
  });
};

export interface SaveCompareQuoteRatingsPayload {
  ratings: Record<string, Record<string, number>>;
}

export interface SaveCompareQuoteRatingsResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

/**
 * Save Compare Quote Ratings
 *
 * PUT /api/asset-purchase/{task_id}/compare-quotes/ratings
 */
export async function saveCompareQuoteRatings(
  taskId: number,
  payload: SaveCompareQuoteRatingsPayload,
): Promise<SaveCompareQuoteRatingsResponse> {
  return apiRequest<SaveCompareQuoteRatingsResponse>(
    `/api/asset-purchase/${taskId}/compare-quotes/ratings`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}
