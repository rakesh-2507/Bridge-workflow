import { apiRequest } from "./client";

export interface CreateAssetPurchaseTaskPayload {
    document_type: string;
    document_no: string;
    assigned_to: number;
}

export interface AssetPurchaseTaskResponse {
    success?: boolean;
    code?: string;
    message?: string;
    data?: unknown;
}

export async function createAssetPurchaseTask(
    payload: CreateAssetPurchaseTaskPayload
): Promise<AssetPurchaseTaskResponse> {
    return apiRequest<AssetPurchaseTaskResponse>(
        "/api/asset-purchase/tasks",
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
}