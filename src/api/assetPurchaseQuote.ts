import { apiRequest } from "./client";

import type {
  CreateAssetPurchaseQuotePayload,
  CreateAssetPurchaseQuoteResponse,
  GetAssetPurchaseQuotesResponse,
  UpdateAssetQuoteRatingResponse,
} from "../types/assetPurchaseQuote";

/**
 * Create Vendor Quote
 *
 * POST /api/asset-purchase/quotes
 *
 * Important:
 * This endpoint only creates a quote.
 *
 * It does NOT forward the task.
 *
 * Therefore it can be called:
 * - before the task is forwarded
 * - after the task has already been forwarded
 *
 * The frontend decides whether forwarding is required.
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
 * Update Asset Quote Rating
 *
 * Used by Assets Manager-Senior.
 *
 * POST /api/asset-purchase/tasks/{task_id}/quotes/{quote_id}/rating
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
 * Submit Asset Purchase Ratings
 *
 * Used when the manager has completed quote rating.
 *
 * POST /api/asset-purchase/tasks/{task_id}/submit-ratings
 */
export const submitAssetPurchaseRatings = async (
  taskId: number,
): Promise<string> => {
  return apiRequest<string>(
    `/api/asset-purchase/tasks/${taskId}/submit-ratings`,
    {
      method: "POST",
    },
  );
};

/**
 * Forward Asset Purchase Task To Selection
 *
 * POST /api/asset-purchase/tasks/{task_id}/forward-to-selection
 *
 * This is a separate workflow step from creating quotes.
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
 *
 * Used by Assets Manager-Senior after reviewing quotes.
 */
export const selectAssetPurchaseQuote = async (
  taskId: number,
  quoteId: number,
): Promise<string> => {
  return apiRequest<string>(
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
 * First executive submission:
 *
 *   Create Quote
 *        ↓
 *   Forward Task
 *        ↓
 *   Assets Manager-Senior
 *
 * IMPORTANT:
 * This function should NOT be called when the executive
 * adds additional quotes after the task has already been
 * forwarded.
 */
export const forwardAssetPurchaseTask = async (
  taskId: number,
): Promise<string> => {
  return apiRequest<string>(
    `/api/asset-purchase/tasks/${taskId}/forward`,
    {
      method: "POST",
    },
  );
};