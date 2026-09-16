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
 *
 * POST /api/asset-purchase/requests
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

/**
 * Asset Purchase Tracking
 *
 * GET /api/asset-purchase/{asset_id}/tracking
 */
export interface AssetPurchaseTracking {
    success: boolean;
    code: string;
    message: string;
    asset_id: string;
    task_id: number;

    document: {
        document_type: string;
        document_no: string;
    };

    status: number;
    status_label: string;
    overall_status: string;

    current_stage: string;
    current_stage_status: string;

    flow: {
        stage: string;
        status: string;
    }[];

    workflow: string;
    workflow_stage: string;
    wf_task_id: string;

    vijay_status?: string;

    assigned_to?: {
        uid: number;
        name: string;
        mtype: string;
    } | null;

    quotation_count: number;
    quotations_locked: boolean;

    selected_quote_id?: number | null;

    selected_quote?: {
        quote_id: number;
        vendor_name: string;
        quote_no: string;
        quoted_amount: number;
        currency?: string;
        quote_date: string;
        executive_rating: number;
    } | null;

    start_date: string;
    end_date?: string | null;
    created_date: string;
    updated_date: string;
}

/**
 * Track Asset Purchase
 *
 * GET /api/asset-purchase/{asset_id}/tracking
 *
 * asset_id is the Asset Purchase Request document number,
 * for example: APR-20260916-65B2BC
 */
export const getAssetPurchaseTracking = async (
    assetId: string
): Promise<AssetPurchaseTracking> => {
    return apiRequest<AssetPurchaseTracking>(
        `/api/asset-purchase/${encodeURIComponent(assetId)}/tracking`,
        {
            method: "GET",
        }
    );
};