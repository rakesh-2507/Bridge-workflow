import { apiRequest } from "./client";

import type {
    CreateAssetPurchaseRequestPayload,
    CreateAssetPurchaseRequestResponse,
} from "../types/assetPurchase";

import type {
    GetAssetPurchaseTaskResponse,
} from "../types/task";

/**
 * Create Asset Purchase Request
 */
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

/**
 * Get Asset Purchase Task Details
 *
 * GET /api/asset-purchase/tasks/{task_id}
 */
export const getAssetPurchaseTask = async (
    taskId: number
): Promise<GetAssetPurchaseTaskResponse> => {
    return apiRequest<GetAssetPurchaseTaskResponse>(
        `/api/asset-purchase/tasks/${taskId}`,
        {
            method: "GET",
        }
    );
};