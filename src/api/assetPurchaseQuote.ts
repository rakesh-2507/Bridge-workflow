import { apiRequest } from "./client";

import type {
    CreateAssetPurchaseQuotePayload,
    CreateAssetPurchaseQuoteResponse,
    GetAssetPurchaseQuotesResponse,
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

export const getAssetPurchaseQuotes = async (
    documentNo: string
): Promise<GetAssetPurchaseQuotesResponse> => {
    return apiRequest<GetAssetPurchaseQuotesResponse>(
        `/api/asset-purchase/quotes/${encodeURIComponent(documentNo)}`
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