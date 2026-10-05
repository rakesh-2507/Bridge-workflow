import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  ArrowLeft,
  Download,
  Eye,
  File,
  Folder as FolderIcon,
  Loader2,
  X,
} from "lucide-react";

import CreateFolderForm from "../components/forms/CreateFolderForm";

import {
  getFolders,
  type Folder,
} from "../api/folders";

import {
  getFolderFiles,
  saveFolderFile,
  type TaskFile,
} from "../api/tasks";

import { apiRequest } from "../api/client";

/* =========================================================
 * File Viewer Modal
 * ========================================================= */

interface FileViewerModalProps {
  file: TaskFile;
  fileUrl: string | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onDownload: () => void;
}

function FileViewerModal({
  file,
  fileUrl,
  loading,
  error,
  onClose,
  onDownload,
}: FileViewerModalProps) {
  const mime = (file.MIME || "").toLowerCase();
  const filename = file.filename || "File";

  const isPdf =
    mime === "application/pdf" ||
    filename.toLowerCase().endsWith(".pdf");

  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isAudio = mime.startsWith("audio/");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-950">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {filename}
            </h2>

            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              File #{file.pffid}
              {" · "}
              {file.MIME || "Unknown type"}
            </p>
          </div>

          <div className="ml-4 flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close file viewer"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 bg-gray-100 dark:bg-gray-900">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading file preview...
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="max-w-md text-center">
                <File className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />

                <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Unable to preview file
                </h3>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={onDownload}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  <Download className="h-4 w-4" />
                  Download File
                </button>
              </div>
            </div>
          ) : !fileUrl ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="text-center">
                <File className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />

                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  File preview is not available.
                </p>
              </div>
            </div>
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title={filename}
              className="h-full w-full border-0"
            />
          ) : isImage ? (
            <div className="flex h-full items-center justify-center overflow-auto p-6">
              <img
                src={fileUrl}
                alt={filename}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : isVideo ? (
            <div className="flex h-full items-center justify-center p-6">
              <video
                src={fileUrl}
                controls
                className="max-h-full max-w-full"
              >
                Your browser does not support video playback.
              </video>
            </div>
          ) : isAudio ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-950">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <File className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {filename}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Audio preview
                    </p>
                  </div>
                </div>

                <audio
                  src={fileUrl}
                  controls
                  className="w-full"
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <div className="max-w-md text-center">
                <File className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />

                <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Preview not supported
                </h3>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  This file type cannot be displayed directly in
                  the browser.
                </p>

                <button
                  type="button"
                  onClick={onDownload}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  <Download className="h-4 w-4" />
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
 * Folders
 * ========================================================= */

function Folders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
   * Selected folder
   * ======================================================= */

  const [selectedFolder, setSelectedFolder] =
    useState<Folder | null>(null);

  /* =======================================================
   * Files inside selected folder
   * ======================================================= */

  const [folderFiles, setFolderFiles] =
    useState<TaskFile[]>([]);

  const [filesLoading, setFilesLoading] =
    useState(false);

  const [filesError, setFilesError] = useState("");

  /* =======================================================
   * File action loading
   * ======================================================= */

  const [fileActionId, setFileActionId] =
    useState<number | null>(null);

  /* =======================================================
   * File viewer
   * ======================================================= */

  const [viewingFile, setViewingFile] =
    useState<TaskFile | null>(null);

  const [fileUrl, setFileUrl] =
    useState<string | null>(null);

  const [fileLoading, setFileLoading] =
    useState(false);

  const [fileError, setFileError] = useState("");

  /*
   * Used to invalidate an older preview request when:
   * - another file is opened
   * - the viewer is closed
   */
  const previewRequestId = useRef(0);

  const itemsPerPage = 10;

  /* =========================================================
   * Close file viewer
   *
   * Declared before effects that use it.
   * useCallback keeps the function reference stable.
   * ========================================================= */

  const handleCloseFileViewer = useCallback(() => {
    previewRequestId.current += 1;

    setViewingFile(null);
    setFileUrl(null);
    setFileError("");
    setFileLoading(false);
    setFileActionId(null);
  }, []);

  /* =========================================================
   * Clean up object URL
   * ========================================================= */

  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  /* =========================================================
   * Escape key for file viewer
   * ========================================================= */

  useEffect(() => {
    if (!viewingFile) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseFileViewer();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    viewingFile,
    handleCloseFileViewer,
  ]);

  /* =========================================================
   * Load folders
   * ========================================================= */

  const loadFolders = async (): Promise<Folder[]> => {
    try {
      const response = await getFolders();

      return response.folders;
    } catch (err) {
      console.error(
        "Failed to load folders:",
        err,
      );

      throw err;
    }
  };

  /* =========================================================
   * Initial folder loading
   * ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchFolders = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await loadFolders();

        if (!cancelled) {
          setFolders(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load folders.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchFolders();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
   * Open folder
   * ========================================================= */

  const handleOpenFolder = async (
    folder: Folder,
  ) => {
    setSelectedFolder(folder);
    setFolderFiles([]);
    setFilesError("");
    setFilesLoading(true);

    handleCloseFileViewer();

    try {
      const files = await getFolderFiles(
        folder.fid,
      );

      setFolderFiles(files);
    } catch (err) {
      console.error(
        `Failed to load files for folder ${folder.fid}:`,
        err,
      );

      setFilesError(
        err instanceof Error
          ? err.message
          : "Failed to load folder files.",
      );
    } finally {
      setFilesLoading(false);
    }
  };

  /* =========================================================
   * Back to folders
   * ========================================================= */

  const handleBackToFolders = () => {
    handleCloseFileViewer();

    setSelectedFolder(null);
    setFolderFiles([]);
    setFilesError("");
  };

  /* =========================================================
   * Search
   * ========================================================= */

  const filteredFolders = folders.filter(
    (folder) =>
      folder.fname
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(folder.fid).includes(search) ||
      String(folder.tid).includes(search) ||
      String(folder.pid).includes(search) ||
      folder.fnamedesc
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  /* =========================================================
   * Pagination
   * ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFolders.length /
        itemsPerPage,
    ),
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const currentFolders =
    filteredFolders.slice(
      startIndex,
      startIndex + itemsPerPage,
    );

  /* =========================================================
   * Search handler
   * ========================================================= */

  const handleSearch = (
    value: string,
  ) => {
    setSearch(value);
    setCurrentPage(1);
  };

  /* =========================================================
   * Previous page
   * ========================================================= */

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(
        (prev) => prev - 1,
      );
    }
  };

  /* =========================================================
   * Next page
   * ========================================================= */

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(
        (prev) => prev + 1,
      );
    }
  };

  /* =========================================================
   * Go to page
   * ========================================================= */

  const handleGoToPage = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;

    if (value === "") {
      return;
    }

    const page = Number(value);

    if (
      Number.isInteger(page) &&
      page >= 1 &&
      page <= totalPages
    ) {
      setCurrentPage(page);
    }
  };

  /* =========================================================
   * Folder successfully created
   * ========================================================= */

  const handleFolderCreated = async (
    data: unknown,
  ) => {
    console.log(
      "Folder created:",
      data,
    );

    setShowCreateForm(false);
    setCurrentPage(1);

    try {
      const updatedFolders =
        await loadFolders();

      setFolders(updatedFolders);
    } catch (err) {
      console.error(
        "Failed to refresh folders:",
        err,
      );
    }
  };

  /* =========================================================
   * Get file identifiers
   * ========================================================= */

  const getFileIdentifiers = (
    file: TaskFile,
  ): {
    projectId: number;
    folderId: number;
  } => {
    const projectId =
      file.projectid ??
      file.project_id;

    const folderId =
      file.fid ??
      file.folder_id;

    if (
      projectId === undefined ||
      folderId === undefined
    ) {
      throw new Error(
        "File is missing project or folder information.",
      );
    }

    return {
      projectId,
      folderId,
    };
  };

  /* =========================================================
   * View file
   *
   * The API request is made through apiRequest() so that:
   *
   * 1. The API base URL is added.
   * 2. Authorization is added.
   * 3. Refresh-token handling works.
   * 4. The API URL is NOT sent through React Router.
   *
   * Example endpoint:
   *
   * /api/80/folders/258/files/78/view
   * ========================================================= */

  const handleViewFile = async (
    file: TaskFile,
  ) => {
    const requestId =
      ++previewRequestId.current;

    setViewingFile(file);
    setFileUrl(null);
    setFileError("");
    setFileLoading(true);
    setFileActionId(file.pffid);

    try {
      const {
        projectId,
        folderId,
      } = getFileIdentifiers(file);

      const endpoint =
        `/api/${projectId}/folders/${folderId}/files/${file.pffid}/view`;

      const blob =
        await apiRequest<Blob>(
          endpoint,
          {
            responseType: "blob",
          },
        );

      /*
       * Ignore the response if the viewer has already
       * been closed or another file has been selected.
       */
      if (
        requestId !==
        previewRequestId.current
      ) {
        return;
      }

      if (!blob || blob.size === 0) {
        throw new Error(
          "The server returned an empty file.",
        );
      }

      const objectUrl =
        URL.createObjectURL(blob);

      setFileUrl(objectUrl);
    } catch (err) {
      if (
        requestId !==
        previewRequestId.current
      ) {
        return;
      }

      console.error(
        "Failed to view file:",
        err,
      );

      setFileError(
        err instanceof Error
          ? err.message
          : "Failed to load file preview.",
      );
    } finally {
      if (
        requestId ===
        previewRequestId.current
      ) {
        setFileLoading(false);
        setFileActionId(null);
      }
    }
  };

  /* =========================================================
   * Download file
   *
   * Keep using the existing saveFolderFile() helper because
   * its backend download implementation is already defined
   * in the project.
   * ========================================================= */

  const handleDownloadFile = async (
    file: TaskFile,
  ) => {
    try {
      setFileActionId(file.pffid);

      const {
        projectId,
        folderId,
      } = getFileIdentifiers(file);

      await saveFolderFile(
        projectId,
        folderId,
        file.pffid,
        file.filename,
      );
    } catch (err) {
      console.error(
        "Failed to download file:",
        err,
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to download file.",
      );
    } finally {
      setFileActionId(null);
    }
  };

  /* =========================================================
   * Format file size
   * ========================================================= */

  const formatFileSize = (
    size: number,
  ): string => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(
        size / 1024
      ).toFixed(1)} KB`;
    }

    if (
      size <
      1024 *
        1024 *
        1024
    ) {
      return `${(
        size /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }

    return `${(
      size /
      (1024 *
        1024 *
        1024)
    ).toFixed(1)} GB`;
  };

  /* =========================================================
   * Format MIME type
   * ========================================================= */

  const getFileType = (
    mime: string,
  ): string => {
    if (!mime) {
      return "Unknown";
    }

    const parts = mime.split("/");

    if (parts.length > 1) {
      return parts[1]
        .replace(
          "vnd.openxmlformats-officedocument.",
          "",
        )
        .replace(
          "presentationml.presentation",
          "PowerPoint",
        )
        .replace(
          "wordprocessingml.document",
          "Word",
        )
        .replace(
          "spreadsheetml.sheet",
          "Excel",
        );
    }

    return mime;
  };

  /* ========================================================
   * Folder Files View
   * ======================================================== */

  if (selectedFolder) {
    return (
      <div className="mx-auto text-gray-900 dark:text-white">
        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={
              handleBackToFolders
            }
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Folders
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <FolderIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {selectedFolder.fname}
                </h1>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Folder #
                  {selectedFolder.fid}
                  {" · "}
                  {folderFiles.length}{" "}
                  {folderFiles.length ===
                  1
                    ? "file"
                    : "files"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Files */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
          {filesLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading files...
              </div>
            </div>
          ) : filesError ? (
            <div className="p-6">
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {filesError}
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleOpenFolder(
                    selectedFolder,
                  )
                }
                className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        File
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Type
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Size
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Created
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {folderFiles.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <File className="h-10 w-10 text-gray-300 dark:text-gray-700" />

                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                              No files found in this
                              folder.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      folderFiles.map(
                        (file) => (
                          <tr
                            key={
                              file.pffid
                            }
                            className="transition hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                  <File className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-medium text-gray-900 dark:text-white">
                                    {
                                      file.filename
                                    }
                                  </p>

                                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    File #
                                    {
                                      file.pffid
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                              {getFileType(
                                file.MIME,
                              )}
                            </td>

                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                              {formatFileSize(
                                file.filesize,
                              )}
                            </td>

                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                              {file.createddate
                                ? new Date(
                                    file.createddate,
                                  ).toLocaleString()
                                : "—"}
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleViewFile(
                                      file,
                                    )
                                  }
                                  disabled={
                                    fileActionId ===
                                    file.pffid
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                  {fileActionId ===
                                  file.pffid ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}

                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDownloadFile(
                                      file,
                                    )
                                  }
                                  disabled={
                                    fileActionId ===
                                    file.pffid
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                                >
                                  <Download className="h-4 w-4" />
                                  Download
                                </button>
                              </div>
                            </td>
                          </tr>
                        ),
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">
                {folderFiles.length ===
                0 ? (
                  <div className="flex flex-col items-center p-10 text-center">
                    <File className="h-10 w-10 text-gray-300 dark:text-gray-700" />

                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                      No files found in this
                      folder.
                    </p>
                  </div>
                ) : (
                  folderFiles.map(
                    (file) => (
                      <div
                        key={
                          file.pffid
                        }
                        className="p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                            <File className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {
                                file.filename
                              }
                            </h3>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              File #
                              {
                                file.pffid
                              }
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Type
                                </p>

                                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                  {getFileType(
                                    file.MIME,
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Size
                                </p>

                                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                  {formatFileSize(
                                    file.filesize,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void handleViewFile(
                                file,
                              )
                            }
                            disabled={
                              fileActionId ===
                              file.pffid
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            {fileActionId ===
                            file.pffid ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}

                            View
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDownloadFile(
                                file,
                              )
                            }
                            disabled={
                              fileActionId ===
                              file.pffid
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* File Viewer */}
        {viewingFile && (
          <FileViewerModal
            file={viewingFile}
            fileUrl={fileUrl}
            loading={fileLoading}
            error={fileError}
            onClose={
              handleCloseFileViewer
            }
            onDownload={() =>
              void handleDownloadFile(
                viewingFile,
              )
            }
          />
        )}
      </div>
    );
  }

  /* ========================================================
   * Folder List View
   * ======================================================== */

  return (
    <div className="mx-auto text-gray-900 dark:text-white">
      {showCreateForm ? (
        <CreateFolderForm
          onCancel={() =>
            setShowCreateForm(false)
          }
          onSuccess={
            handleFolderCreated
          }
        />
      ) : (
        <>
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Folders
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Manage template folders and document
                sections.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCreateForm(true)
              }
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Add Folder
            </button>
          </div>

          {/* Search */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:max-w-md">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.05 6.05a7.5 7.5 0 0 0 10.6 10.6Z"
                />
              </svg>

              <input
                type="text"
                placeholder="Search folders..."
                value={search}
                onChange={(event) =>
                  handleSearch(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentPage(1)
              }
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              Search
            </button>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading folders...
                </div>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError("");

                      const data =
                        await loadFolders();

                      setFolders(data);
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Failed to load folders.",
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold">
                          Folder ID
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Folder Name
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Parent Folder
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Template ID
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Description
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {currentFolders.length ===
                      0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                          >
                            No folders found.
                          </td>
                        </tr>
                      ) : (
                        currentFolders.map(
                          (folder) => (
                            <tr
                              key={
                                folder.fid
                              }
                              onClick={() =>
                                void handleOpenFolder(
                                  folder,
                                )
                              }
                              className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                #
                                {
                                  folder.fid
                                }
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <FolderIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                  </div>

                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {
                                      folder.fname
                                    }
                                  </span>
                                </div>
                              </td>

                              <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                {folder.pid
                                  ? `#${folder.pid}`
                                  : "Root"}
                              </td>

                              <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                #
                                {
                                  folder.tid
                                }
                              </td>

                              <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                {
                                  folder.fnamedesc ||
                                  "—"
                                }
                              </td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">
                  {currentFolders.length ===
                  0 ? (
                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No folders found.
                    </div>
                  ) : (
                    currentFolders.map(
                      (folder) => (
                        <button
                          key={
                            folder.fid
                          }
                          type="button"
                          onClick={() =>
                            void handleOpenFolder(
                              folder,
                            )
                          }
                          className="block w-full p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                              <FolderIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Folder #
                                {
                                  folder.fid
                                }
                              </p>

                              <h3 className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                                {
                                  folder.fname
                                }
                              </h3>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Parent
                              </p>

                              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                {folder.pid
                                  ? `#${folder.pid}`
                                  : "Root"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Template
                              </p>

                              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                #
                                {
                                  folder.tid
                                }
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                            {
                              folder.fnamedesc ||
                              "No description"
                            }
                          </p>
                        </button>
                      ),
                    )
                  )}
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between dark:border-gray-700">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span>
                      Go to page
                    </span>

                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={
                        currentPage
                      }
                      onChange={
                        handleGoToPage
                      }
                      className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />

                    <span>
                      of {totalPages}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={
                        handlePrevious
                      }
                      disabled={
                        currentPage ===
                        1
                      }
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200"
                    >
                      Previous
                    </button>

                    <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
                      Page{" "}
                      {
                        currentPage
                      }{" "}
                      of{" "}
                      {
                        totalPages
                      }
                    </span>

                    <button
                      type="button"
                      onClick={
                        handleNext
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Folders;
