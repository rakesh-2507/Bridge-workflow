import { apiRequest } from "./client";

export interface UploadedFile {
    pffid: number;
    project_id: number;
    folder_id: number;
    filename: string;
    filesize: number;
    MIME: string;
    uploaded_by: number;
}

export interface UploadFileResponse {
    success: boolean;
    code?: string;
    message?: string;
    data?: {
        file?: UploadedFile;
    };
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