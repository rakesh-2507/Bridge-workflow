import { apiRequest } from "./client";

import type {
    CreateDocumentPayload,
    DocumentResponse,
} from "../types/document";

/*
 * POST /api/documents
 *
 * Create Asset Purchase Request document
 */
export async function createDocument(
    payload: CreateDocumentPayload
): Promise<DocumentResponse> {
    return apiRequest<DocumentResponse>("/api/documents", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/*
 * GET /api/documents/{document_type}/{document_no}
 */
export async function getDocument(
    documentType: string,
    documentNo: string
): Promise<DocumentResponse> {
    return apiRequest<DocumentResponse>(
        `/api/documents/${documentType}/${documentNo}`
    );
}