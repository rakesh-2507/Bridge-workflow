import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Download,
  Loader2,
  X,
} from "lucide-react";

import {
  getProject,
  type AdminProjectDetails,
  type ProjectFolder,
  type ProjectMember,
  type ProjectFile,
} from "../api/projects";

import { apiRequest } from "../api/client";

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] =
    useState<AdminProjectDetails | null>(null);

  const [folders, setFolders] =
    useState<ProjectFolder[]>([]);

  const [members, setMembers] =
    useState<ProjectMember[]>([]);

  const [selectedFolder, setSelectedFolder] =
    useState<ProjectFolder | null>(null);

  const [foldersCount, setFoldersCount] =
    useState(0);

  const [totalFiles, setTotalFiles] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * File viewer modal state
   */
  const [viewingFile, setViewingFile] =
    useState<ProjectFile | null>(null);

  const [fileUrl, setFileUrl] =
    useState<string | null>(null);

  const [fileLoading, setFileLoading] =
    useState(false);

  const [fileError, setFileError] =
    useState("");

  /*
   * Load project details
   */
  useEffect(() => {
    let cancelled = false;

    const loadProject = async () => {
      const projectId = Number(id);

      if (!id || !Number.isInteger(projectId)) {
        setError("Invalid project ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getProject(projectId);

        if (cancelled) {
          return;
        }

        setProject(response.data.project);
        setFolders(response.data.folders ?? []);
        setMembers(response.data.members ?? []);
        setFoldersCount(
          response.data.folders_count ?? 0
        );
        setTotalFiles(
          response.data.total_files ?? 0
        );
      } catch (err) {
        console.error(
          "Failed to load project:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load project."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /*
   * Revoke Blob URL when it changes/unmounts.
   */
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  /*
   * Format file size
   */
  const formatFileSize = (size: number) => {
    if (!size || size <= 0) {
      return "0 B";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    if (size < 1024 * 1024 * 1024) {
      return `${(
        size /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }

    return `${(
      size /
      (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
  };

  /*
   * Open folder
   */
  const handleFolderClick = (
    folder: ProjectFolder
  ) => {
    setSelectedFolder(folder);
  };

  /*
   * Go back to folders
   */
  const handleBackToFolders = () => {
    setSelectedFolder(null);
  };

  /*
   * Open file in viewer modal.
   *
   * IMPORTANT:
   *
   * Do NOT use:
   *
   * window.open(file.view_url)
   * navigate(file.view_url)
   * <Link to={file.view_url}>
   *
   * The view URL is an API endpoint.
   *
   * apiRequest() handles:
   * - API base URL
   * - Authorization header
   * - token refresh
   * - 401 retry
   * - Blob response
   */
  const handleViewFile = async (
    file: ProjectFile
  ) => {
    if (!file.view_url) {
      return;
    }

    /*
     * Revoke old Blob URL.
     */
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

    setViewingFile(file);
    setFileUrl(null);
    setFileLoading(true);
    setFileError("");

    try {
      /*
       * Example endpoint:
       *
       * /api/80/folders/258/files/78/view
       *
       * apiRequest() turns this into:
       *
       * https://bridgeapi.sidpz.com/api/80/folders/258/files/78/view
       */
      const blob = await apiRequest<Blob>(
        file.view_url,
        {
          method: "GET",
          responseType: "blob",
        }
      );

      if (!blob || blob.size === 0) {
        throw new Error(
          "The server returned an empty file."
        );
      }

      const objectUrl =
        URL.createObjectURL(blob);

      setFileUrl(objectUrl);
    } catch (err) {
      console.error(
        "Failed to preview file:",
        err
      );

      setFileError(
        err instanceof Error
          ? err.message
          : "Failed to preview file."
      );
    } finally {
      setFileLoading(false);
    }
  };

  /*
   * Close file viewer
   */
  const handleCloseFileViewer = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

    setViewingFile(null);
    setFileUrl(null);
    setFileLoading(false);
    setFileError("");
  };

  /*
   * Download file
   */
  const handleDownloadFile = (
    file: ProjectFile
  ) => {
    if (!file.download_url) {
      return;
    }

    /*
     * Download URL may be:
     *
     * /api/80/folders/258/files/78/download
     *
     * For now keep existing download behavior.
     */
    const downloadUrl =
      file.download_url.startsWith(
        "http://"
      ) ||
        file.download_url.startsWith(
          "https://"
        )
        ? file.download_url
        : file.download_url;

    /*
     * If download_url is a backend API path,
     * use apiRequest so authentication and
     * token refresh work correctly.
     */
    if (
      downloadUrl.startsWith("/api/")
    ) {
      void (async () => {
        try {
          const blob =
            await apiRequest<Blob>(
              downloadUrl,
              {
                method: "GET",
                responseType: "blob",
              }
            );

          const objectUrl =
            URL.createObjectURL(blob);

          const anchor =
            document.createElement("a");

          anchor.href = objectUrl;
          anchor.download =
            file.filename || "download";

          document.body.appendChild(
            anchor
          );

          anchor.click();

          anchor.remove();

          URL.revokeObjectURL(
            objectUrl
          );
        } catch (err) {
          console.error(
            "Failed to download file:",
            err
          );
        }
      })();

      return;
    }

    /*
     * External/full URL.
     */
    window.open(
      downloadUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-950">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading project...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error
   */
  if (error) {
    return (
      <div className="mx-auto">
        <button
          type="button"
          onClick={() =>
            navigate("/projects")
          }
          className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>

          Back to Projects
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /*
   * Project not found
   */
  if (!project) {
    return (
      <div className="mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-950">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Project not found.
          </p>
        </div>
      </div>
    );
  }

  const projectStatus =
    project.status !== undefined &&
      project.status !== null
      ? String(project.status)
      : "—";

  return (
    <div className="mx-auto">
      {/* Back */}

      <button
        type="button"
        onClick={() =>
          navigate("/projects")
        }
        className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>

        Back to Projects
      </button>

      {/* Project Details */}

      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
        <div className="border-b border-gray-200 px-4 py-5 sm:px-6 dark:border-gray-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {project.project_name ||
                  "Unnamed Project"}
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Project #{project.project_id}
              </p>

              {project.template_name && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Template:{" "}
                  {project.template_name}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(`/projects/${project.project_id}/edit`, {
                    state: {
                      project,
                    },
                  })
                }
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Edit Project
              </button>

              <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Status: {projectStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
          <ProjectInfo
            label="Project ID"
            value={project.project_id}
          />

          <ProjectInfo
            label="Coordinator"
            value={project.coordinator}
          />

          <ProjectInfo
            label="Project Type"
            value={project.projecttype}
          />

          <ProjectInfo
            label="Company ID"
            value={project.company_id}
          />

          <ProjectInfo
            label="Template ID"
            value={project.template_id}
          />

          <ProjectInfo
            label="Project Management"
            value={
              project.is_project_manage
            }
          />

          <ProjectInfo
            label="Start Date"
            value={project.start_date}
          />

          <ProjectInfo
            label="End Date"
            value={project.end_date}
          />

          <ProjectInfo
            label="Folders"
            value={foldersCount}
          />

          <ProjectInfo
            label="Files"
            value={totalFiles}
          />

          <ProjectInfo
            label="Members"
            value={members.length}
          />
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Project Description
          </h2>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
            {project.project_description ||
              "No description available."}
          </p>
        </div>
      </div>

      {/* =====================================================
          FOLDER VIEW
          ===================================================== */}

      {!selectedFolder && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Project Folders
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {foldersCount}{" "}
              {foldersCount === 1
                ? "folder"
                : "folders"}{" "}
              · {totalFiles}{" "}
              {totalFiles === 1
                ? "file"
                : "files"}
            </p>
          </div>

          {folders.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No folders found for this
                project.
              </p>
            </div>
          )}

          {folders.length > 0 && (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Folder
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Description
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Start Date
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      End Date
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Files
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Assignments
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {folders.map(
                    (folder) => (
                      <tr
                        key={
                          folder.project_folder_id
                        }
                        onClick={() =>
                          handleFolderClick(
                            folder
                          )
                        }
                        className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                              <svg
                                className="h-5 w-5 text-gray-600 dark:text-gray-300"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" />
                              </svg>
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {
                                  folder.folder_name
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                Folder #
                                {
                                  folder.folder_id
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-xs px-6 py-4 text-gray-600 dark:text-gray-300">
                          <span className="line-clamp-2">
                            {
                              folder.folder_description ||
                              "—"
                            }
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-gray-600 dark:text-gray-300">
                          {folder.start_date ||
                            "—"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-gray-600 dark:text-gray-300">
                          {folder.end_date ||
                            "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {
                              folder.files_count
                            }
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {folder.assignments?.length ? (
                            <div className="space-y-1">
                              {folder.assignments.map(
                                (
                                  assignment
                                ) => (
                                  <div
                                    key={`${folder.project_folder_id}-${assignment.user_id}-${assignment.role}`}
                                    className="text-xs"
                                  >
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {
                                        assignment.user_name
                                      }
                                    </span>

                                    <span className="ml-1 text-gray-500 dark:text-gray-400">
                                      (
                                      {
                                        assignment.role
                                      }
                                      )
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No assignments
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {folders.length > 0 && (
            <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">
              {folders.map(
                (folder) => (
                  <button
                    type="button"
                    key={
                      folder.project_folder_id
                    }
                    onClick={() =>
                      handleFolderClick(
                        folder
                      )
                    }
                    className="block w-full p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                        <svg
                          className="h-5 w-5 text-gray-600 dark:text-gray-300"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {
                            folder.folder_name
                          }
                        </h3>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {
                            folder.files_count
                          }{" "}
                          files
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                      {
                        folder.folder_description ||
                        "No description available."
                      }
                    </p>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          FILE VIEW
          ===================================================== */}

      {selectedFolder && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6 dark:border-gray-700">
            <button
              type="button"
              onClick={
                handleBackToFolders
              }
              className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>

              Back to Folders
            </button>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {
                    selectedFolder.folder_name
                  }
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {
                    selectedFolder.folder_description ||
                    "No description available."
                  }
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {
                  selectedFolder.files_count
                }{" "}
                {
                  selectedFolder.files_count ===
                    1
                    ? "file"
                    : "files"
                }
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-b border-gray-200 p-4 sm:grid-cols-3 sm:p-6 dark:border-gray-700">
            <ProjectInfo
              label="Folder ID"
              value={
                selectedFolder.folder_id
              }
            />

            <ProjectInfo
              label="Start Date"
              value={
                selectedFolder.start_date
              }
            />

            <ProjectInfo
              label="End Date"
              value={
                selectedFolder.end_date
              }
            />
          </div>

          {selectedFolder.files.length ===
            0 && (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <svg
                    className="h-6 w-6 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7h4l2 2h12v10H3V7Z"
                    />
                  </svg>
                </div>

                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  No files in this folder.
                </p>
              </div>
            )}

          {selectedFolder.files.length >
            0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        File Name
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Type
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Size
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Uploaded By
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Date
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedFolder.files.map(
                      (file) => (
                        <tr
                          key={file.pffid}
                          className="transition hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                <svg
                                  className="h-5 w-5 text-gray-600 dark:text-gray-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                                  />

                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14 3v6h6"
                                  />
                                </svg>
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900 dark:text-white">
                                  {
                                    file.filename
                                  }
                                </p>

                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                  File #
                                  {file.pffid}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                            {file.MIME ||
                              "—"}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-gray-600 dark:text-gray-300">
                            {formatFileSize(
                              file.filesize
                            )}
                          </td>

                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                            User #
                            {file.uploaded_by ??
                              "—"}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-gray-600 dark:text-gray-300">
                            {file.createddate
                              ? new Date(
                                file.createddate
                              ).toLocaleDateString()
                              : "—"}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              {file.view_url && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleViewFile(
                                      file
                                    )
                                  }
                                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                  View
                                </button>
                              )}

                              {file.download_url && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadFile(
                                      file
                                    )
                                  }
                                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                                >
                                  Download
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* Members */}

      {members.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Project Members
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Users associated with this
              project.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {member.user_name}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  User #{member.user_id}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================
          FILE VIEWER MODAL
          ===================================================== */}

      {viewingFile && (
        <FileViewerModal
          file={viewingFile}
          fileUrl={fileUrl}
          isLoading={fileLoading}
          error={fileError}
          onClose={
            handleCloseFileViewer
          }
          onDownload={() =>
            handleDownloadFile(
              viewingFile
            )
          }
          onRetry={() =>
            void handleViewFile(
              viewingFile
            )
          }
        />
      )}
    </div>
  );
}

/*
 * File viewer modal
 */
interface FileViewerModalProps {
  file: ProjectFile;
  fileUrl: string | null;
  isLoading: boolean;
  error: string;
  onClose: () => void;
  onDownload: () => void;
  onRetry: () => void;
}

function FileViewerModal({
  file,
  fileUrl,
  isLoading,
  error,
  onClose,
  onDownload,
  onRetry,
}: FileViewerModalProps) {
  const mimeType =
    file.MIME?.toLowerCase() || "";

  const filename =
    file.filename?.toLowerCase() || "";

  const isPdf =
    mimeType.includes(
      "application/pdf"
    ) ||
    filename.endsWith(".pdf");

  const isImage =
    mimeType.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(
      filename
    );

  const isVideo =
    mimeType.startsWith("video/");

  const isAudio =
    mimeType.startsWith("audio/");

  /*
   * Close modal with Escape key.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/70
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          flex
          h-[90vh]
          w-full
          max-w-6xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-gray-700
          bg-white
          shadow-2xl
          dark:bg-gray-900
        "
      >
        {/* Header */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            gap-4
            border-b
            border-gray-200
            px-5
            py-3
            dark:border-gray-800
          "
        >
          <div className="min-w-0">
            <p
              className="
                truncate
                text-sm
                font-semibold
                text-gray-900
                dark:text-white
              "
              title={file.filename}
            >
              {file.filename}
            </p>

            <p
              className="
                mt-0.5
                text-xs
                text-gray-500
                dark:text-gray-400
              "
            >
              {file.MIME ||
                "Unknown file type"}
            </p>
          </div>

          <div
            className="
              flex
              shrink-0
              items-center
              gap-2
            "
          >
            <button
              type="button"
              onClick={onDownload}
              disabled={isLoading}
              className="
                flex
                items-center
                gap-2
                rounded-lg
                bg-sky-900
                px-3
                py-2
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-sky-800
                disabled:cursor-not-allowed
                disabled:opacity-40
                dark:bg-sky-200
                dark:text-sky-950
              "
            >
              <Download size={14} />
              Download
            </button>

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-lg
                p-2
                text-gray-400
                transition
                hover:bg-gray-100
                hover:text-gray-700
                dark:hover:bg-gray-800
                dark:hover:text-gray-200
              "
              aria-label="Close file viewer"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Content */}

        <div
          className="
            min-h-0
            flex-1
            overflow-auto
            bg-gray-100
            p-4
            dark:bg-gray-950
          "
        >
          {isLoading ? (
            <div
              className="
                flex
                h-full
                items-center
                justify-center
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                "
              >
                <Loader2
                  size={20}
                  className="animate-spin"
                />

                Loading file...
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900 dark:bg-gray-900">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
                  <X
                    size={22}
                    className="text-red-500"
                  />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Unable to preview file
                </h3>

                <p className="mt-2 break-words text-sm text-gray-500 dark:text-gray-400">
                  {error}
                </p>

                <div className="mt-5 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={onRetry}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                  >
                    Try Again
                  </button>

                  <button
                    type="button"
                    onClick={onDownload}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ) : !fileUrl ? (
            <PreviewUnavailable
              onDownload={onDownload}
            />
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title={file.filename}
              className="
                h-full
                min-h-[600px]
                w-full
                rounded-lg
                border
                border-gray-200
                bg-white
                dark:border-gray-800
              "
            />
          ) : isImage ? (
            <div
              className="
                flex
                min-h-full
                items-center
                justify-center
              "
            >
              <img
                src={fileUrl}
                alt={file.filename}
                className="
                  max-h-full
                  max-w-full
                  rounded-lg
                  object-contain
                  shadow-lg
                "
              />
            </div>
          ) : isVideo ? (
            <div
              className="
                flex
                min-h-full
                items-center
                justify-center
              "
            >
              <video
                src={fileUrl}
                controls
                className="
                  max-h-full
                  max-w-full
                  rounded-lg
                "
              />
            </div>
          ) : isAudio ? (
            <div
              className="
                flex
                h-full
                items-center
                justify-center
              "
            >
              <audio
                src={fileUrl}
                controls
              />
            </div>
          ) : (
            <PreviewUnavailable
              onDownload={onDownload}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/*
 * Preview unavailable component
 */
function PreviewUnavailable({
  onDownload,
}: {
  onDownload: () => void;
}) {
  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Download
            size={22}
            className="text-gray-500 dark:text-gray-400"
          />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
          Preview unavailable
        </h3>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This file type cannot be previewed
          in the browser. You can download
          the file instead.
        </p>

        <button
          type="button"
          onClick={onDownload}
          className="
            mt-5
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-gray-900
            px-4
            py-2
            text-xs
            font-semibold
            text-white
            transition
            hover:bg-gray-700
            dark:bg-white
            dark:text-gray-900
            dark:hover:bg-gray-200
          "
        >
          <Download size={14} />
          Download File
        </button>
      </div>
    </div>
  );
}

/*
 * Reusable project information field
 */
function ProjectInfo({
  label,
  value,
}: {
  label: string;
  value:
  | string
  | number
  | null
  | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
        {value !== null &&
          value !== undefined &&
          value !== ""
          ? String(value)
          : "—"}
      </p>
    </div>
  );
}

export default ProjectDetails;
