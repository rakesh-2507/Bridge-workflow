import { apiRequest } from "./client";
import type { CreateProjectFromTemplatePayload } from "../types/projectTemplate";

export interface Project {
  project_id: number;
  tid?: number;
  cid?: number;
  member_id?: number;
  projectname?: string;
  projectdesc?: string;
  status?: number;
  created_date?: string;
  updated_date?: string;
  coordinator?: number;
  is_project_manage?: number;
  po?: string;
  costhead?: string;
  projectno?: string;
  projecttype?: number;
  department?: string;
  [key: string]: unknown;
}

export interface ProjectsResponse {
  projects: Project[];
  total: number;
}

/**
 * Payload used when creating a project.
 */
export interface CreateProjectData {
  tid: number;
  cid: number;
  member_id?: number;
  projectname: string;
  projectdesc?: string;
  coordinator?: number;
  is_project_manage?: number;
  po?: string;
  costhead?: string;
  projectno?: string;
  projecttype?: number;
  department?: string;
}

export interface ProjectFile {
  pffid: number;
  project_id: number;
  folder_id: number;
  filename: string;
  filesize: number;
  MIME?: string;
  createddate?: string;
  uploaded_by?: number;
  download_url?: string;
  view_url?: string;
}

export interface ProjectFolderAssignment {
  user_id: number;
  user_name: string;
  role: string;
  workflow_level: string;
}

export interface ProjectFolder {
  project_folder_id: number;
  folder_id: number;
  folder_name: string;
  folder_description?: string;
  parent_folder_id?: number | null;
  start_date?: string;
  end_date?: string;
  assignments: ProjectFolderAssignment[];
  files: ProjectFile[];
  files_count: number;
}


export interface ProjectMember {
  user_id: number;
  user_name: string;
}

export interface AdminProjectDetails {
  project_id: number;
  template_id?: number;
  template_name?: string;
  company_id?: number;
  coordinator?: number;
  project_name?: string;
  project_description?: string;
  projecttype?: number;
  status?: number;
  start_date?: string;
  end_date?: string;
  is_project_manage?: number;
  [key: string]: unknown;
}

export interface AdminProjectResponse {
  success: boolean;
  message: string;
  data: {
    project: AdminProjectDetails;
    folders: ProjectFolder[];
    members: ProjectMember[];
    folders_count: number;
    total_files: number;
  };
}

/**
 * Get all projects
 */
export async function getProjects() {
  return apiRequest<ProjectsResponse>("/api/getprojects");
}

export async function getProject(projectId: number) {
  return apiRequest<AdminProjectResponse>(`/api/getadminproject/${projectId}`);
}

/**
 * Create project
 */
export async function createProject(data: CreateProjectData) {
  return apiRequest<Project>("/api/createproject", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update project
 */
export async function updateProject(
  projectId: number,
  data: Partial<CreateProjectData>,
) {
  return apiRequest<Project>(`/api/updateproject/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete project
 */
export async function deleteProject(projectId: number) {
  return apiRequest(`/api/deleteproject/${projectId}`, {
    method: "DELETE",
  });
}

/**
 * Create project from template
 */
export async function createProjectFromTemplate(
  data: CreateProjectFromTemplatePayload,
) {
  return apiRequest("/api/createprojectfromtemplate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
