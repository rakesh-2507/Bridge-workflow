import { apiRequest } from "./client";

import type {
    CreateAssetPurchaseQuotePayload,
    CreateAssetPurchaseQuoteResponse,
} from "../types/assetPurchaseQuote";

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