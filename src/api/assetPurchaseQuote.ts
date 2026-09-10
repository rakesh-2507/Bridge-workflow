import { apiRequest } from "./client";

import type {
    CreateAssetPurchaseQuotePayload,
    CreateAssetPurchaseQuoteResponse,
    GetAssetPurchaseQuotesResponse,
    UpdateAssetQuoteRatingResponse,
} from "../types/assetPurchaseQuote";

/*
 * Create Vendor Quote
 */
export const createAssetPurchaseQuote = async (
    payload: CreateAssetPurchaseQuotePayload
): Promise<CreateAssetPurchaseQuoteResponse> => {
    return apiRequest<CreateAssetPurchaseQuoteResponse>(
        "/api/asset-purchase/quotes",
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
};

/*
 * Get Vendor Quotes
 */
export const getAssetPurchaseQuotes = async (
    documentNo: string
): Promise<GetAssetPurchaseQuotesResponse> => {
    return apiRequest<GetAssetPurchaseQuotesResponse>(
        `/api/asset-purchase/quotes/${encodeURIComponent(documentNo)}`
    );
};

/*
 * Update Asset Quote Rating
 */
export const updateAssetQuoteRating = async (
    taskId: number,
    quoteId: number,
    rating: number
): Promise<UpdateAssetQuoteRatingResponse> => {
    return apiRequest<UpdateAssetQuoteRatingResponse>(
        `/api/asset-purchase/tasks/${taskId}/quotes/${quoteId}/rating`,
        {
            method: "POST",
            body: JSON.stringify({
                rating,
            }),
        }
    );
};

/*
 * Submit Asset Purchase Ratings
 */
export const submitAssetPurchaseRatings = async (
    taskId: number
): Promise<string> => {
    return apiRequest<string>(
        `/api/asset-purchase/tasks/${taskId}/submit-ratings`,
        {
            method: "POST",
        }
    );
};

/*
 * Forward Asset Purchase To Selection
 *
 * Step 1 before selecting a quote.
 */
export const forwardAssetPurchaseTaskToSelection = async (
    taskId: number
): Promise<string> => {
    return apiRequest<string>(
        `/api/asset-purchase/tasks/${taskId}/forward-to-selection`,
        {
            method: "POST",
        }
    );
};

/*
 * Select Asset Purchase Quote
 *
 * Step 2 after forwarding the task to selection.
 */
export const selectAssetPurchaseQuote = async (
    taskId: number,
    quoteId: number
): Promise<string> => {
    return apiRequest<string>(
        `/api/asset-purchase/tasks/${taskId}/select`,
        {
            method: "POST",
            body: JSON.stringify({
                quote_id: quoteId,
            }),
        }
    );
};

/*
 * Forward Asset Purchase Task
 */
export const forwardAssetPurchaseTask = async (
    taskId: number
): Promise<string> => {
    return apiRequest<string>(
        `/api/asset-purchase/tasks/${taskId}/forward`,
        {
            method: "POST",
        }
    );
};