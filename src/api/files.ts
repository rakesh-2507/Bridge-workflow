import { apiRequest } from "./client";

export interface UploadFileResponse {
    message?: string;
    [key: string]: unknown;
}

export async function uploadFileToFolder(
    projectId: number,
    folderId: number,
    uploadedBy: number,
    file: File
): Promise<UploadFileResponse> {
    const formData = new FormData();

    formData.append(
        "project_id",
        String(projectId)
    );

    formData.append(
        "folder_id",
        String(folderId)
    );

    formData.append(
        "uploaded_by",
        String(uploadedBy)
    );

    formData.append(
        "file",
        file
    );

    return apiRequest<UploadFileResponse>(
        "/api/uploadfiletofolder",
        {
            method: "POST",
            body: formData,
        }
    );
}
