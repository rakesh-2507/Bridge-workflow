import { apiRequest } from "./client";

export interface Folder {
  fid: number;
  fname: string;
  pid: number | null;
  tid: number;
  fnamedesc: string;
}

export interface FoldersResponse {
  folders: Folder[];
  total: number;
}

export interface CreateFolderData {
  fname: string;
  pid: number | null;
  tid: number;
  fnamedesc: string;
}

export interface UpdateFolderData {
  fname: string;
  pid: number | null;
  tid: number;
  fnamedesc: string;
}

// ----------------------------------------
// Folder Roles
// ----------------------------------------

export interface FolderRoleItem {
  fid: number;
  role: string;
  id: number;
}

export interface FolderRole {
  folder_id: number;
  folder_name: string;
  roles: FolderRoleItem[];
}

export interface FolderRolesResponse {
  template_id: number;
  folders: FolderRole[];
}

// ----------------------------------------
// Folder List
// ----------------------------------------

export async function getFolders(): Promise<FoldersResponse> {
  return apiRequest<FoldersResponse>("/api/getfolders", {
    method: "GET",
  });
}

// ----------------------------------------
// Folder CRUD
// ----------------------------------------

export async function createFolder(
  data: CreateFolderData,
): Promise<Folder> {
  return apiRequest<Folder>("/api/createfolder", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFolder(
  fid: number,
  data: UpdateFolderData,
): Promise<Folder> {
  return apiRequest<Folder>(
    `/api/updatefolder/${fid}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

export async function deleteFolder(
  fid: number,
): Promise<string> {
  return apiRequest<string>(
    `/api/deletefolder/${fid}`,
    {
      method: "DELETE",
    },
  );
}

export async function getTemplateFolders(
  tid: number,
): Promise<FoldersResponse> {
  return apiRequest<FoldersResponse>(
    `/api/gettemplatefolders/${tid}`,
    {
      method: "GET",
    },
  );
}

// ----------------------------------------
// Folder Roles
// ----------------------------------------

export async function getTemplateFolderRoles(
  templateId: number,
): Promise<FolderRolesResponse> {
  return apiRequest<FolderRolesResponse>(
    `/api/folders/${templateId}/roles`,
    {
      method: "GET",
    },
  );
}