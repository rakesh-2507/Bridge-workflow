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
 *
 * Used by Manager / Assets Manager-Senior
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