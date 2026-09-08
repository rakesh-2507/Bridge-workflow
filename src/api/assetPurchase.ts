import { apiRequest } from "./client";

import type {
    CreateAssetPurchaseRequestPayload,
    CreateAssetPurchaseRequestResponse,
} from "../types/assetPurchase";

export const createAssetPurchaseRequest = async (
    payload: CreateAssetPurchaseRequestPayload
): Promise<CreateAssetPurchaseRequestResponse> => {
    return apiRequest<CreateAssetPurchaseRequestResponse>(
        "/api/asset-purchase/requests",
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
};