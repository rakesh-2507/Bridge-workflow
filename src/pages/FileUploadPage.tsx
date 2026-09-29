import {
    CheckCircle2,
    Download,
    ExternalLink,
    File as FileIcon,
    Folder,
    Loader2,
    Upload,
    X,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import type { ChangeEvent } from "react";

import {
    getProjects,
    type Project,
} from "../api/projects";

import {
    getFolders,
    type Folder as ProjectFolder,
} from "../api/folders";

import {
    getFolderFiles,
    uploadFileToFolder,
    downloadFolderFile,
    saveFolderFile,
    type TaskFile,
} from "../api/tasks";

/* =========================================================
   Component
========================================================= */

function FileUploadPage() {
    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    /* =========================================================
       Data
    ========================================================= */

    const [projects, setProjects] =
        useState<Project[]>([]);

    const [folders, setFolders] =
        useState<ProjectFolder[]>([]);

    const [folderFiles, setFolderFiles] =
        useState<TaskFile[]>([]);

    /* =========================================================
       Loading
    ========================================================= */

    const [
        isLoadingProjects,
        setIsLoadingProjects,
    ] = useState(false);

    const [
        isLoadingFolders,
        setIsLoadingFolders,
    ] = useState(false);

    const [
        isLoadingFolderFiles,
        setIsLoadingFolderFiles,
    ] = useState(false);

    const [isUploading, setIsUploading] =
        useState(false);

    /* =========================================================
       Selection
    ========================================================= */

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [
        selectedProjectId,
        setSelectedProjectId,
    ] = useState<number | "">("");

    const [
        selectedFolderId,
        setSelectedFolderId,
    ] = useState<number | "">("");

    /* =========================================================
       File Viewer
    ========================================================= */

    const [viewingFile, setViewingFile] =
        useState<TaskFile | null>(null);

    const [viewingFileUrl, setViewingFileUrl] =
        useState<string | null>(null);

    const [isViewingFile, setIsViewingFile] =
        useState(false);

    /* =========================================================
       Messages
    ========================================================= */

    const [uploadSuccess, setUploadSuccess] =
        useState(false);

    const [error, setError] =
        useState("");

    const [
        folderFilesError,
        setFolderFilesError,
    ] = useState("");

    /* =========================================================
       Load Projects + Folders
    ========================================================= */

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            setIsLoadingProjects(true);
            setIsLoadingFolders(true);
            setError("");

            try {
                const [
                    projectsResponse,
                    foldersResponse,
                ] = await Promise.all([
                    getProjects(),
                    getFolders(),
                ]);

                if (!isMounted) {
                    return;
                }

                setProjects(
                    projectsResponse?.projects ?? [],
                );

                setFolders(
                    foldersResponse?.folders ?? [],
                );
            } catch (err) {
                if (!isMounted) {
                    return;
                }

                console.error(
                    "Failed to load projects and folders:",
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load projects and folders.",
                );
            } finally {
                if (isMounted) {
                    setIsLoadingProjects(false);
                    setIsLoadingFolders(false);
                }
            }
        };

        void fetchData();

        return () => {
            isMounted = false;
        };
    }, []);

    /* =========================================================
       Selected Project
    ========================================================= */

    const selectedProject = useMemo(() => {
        if (selectedProjectId === "") {
            return undefined;
        }

        return projects.find(
            (project) =>
                Number(project.project_id) ===
                Number(selectedProjectId),
        );
    }, [
        projects,
        selectedProjectId,
    ]);

    /* =========================================================
       Available Folders
    ========================================================= */

    const availableFolders = useMemo(() => {
        if (!selectedProject) {
            return [];
        }

        const projectTid = Number(
            selectedProject.tid,
        );

        if (!Number.isInteger(projectTid)) {
            return [];
        }

        return folders.filter(
            (folder) =>
                Number(folder.tid) ===
                    projectTid &&
                (
                    folder.pid === null ||
                    folder.pid === undefined
                ),
        );
    }, [
        folders,
        selectedProject,
    ]);

    /* =========================================================
       Selected Folder
    ========================================================= */

    const selectedFolder = useMemo(() => {
        if (selectedFolderId === "") {
            return undefined;
        }

        return availableFolders.find(
            (folder) =>
                Number(folder.fid) ===
                Number(selectedFolderId),
        );
    }, [
        availableFolders,
        selectedFolderId,
    ]);

    /* =========================================================
       Load Files For Selected Folder
    ========================================================= */

    useEffect(() => {
        if (selectedFolderId === "") {
            return;
        }

        let cancelled = false;

        const loadFolderFiles = async () => {
            setIsLoadingFolderFiles(true);
            setFolderFilesError("");

            try {
                const files =
                    await getFolderFiles(
                        Number(selectedFolderId),
                    );

                if (!cancelled) {
                    /*
                     * The backend returns:
                     *
                     * pffid
                     * projectid
                     * fid
                     * filename
                     * filesize
                     * MIME
                     *
                     * Only display files belonging
                     * to the currently selected project.
                     */
                    const projectFiles =
                        selectedProjectId === ""
                            ? files
                            : files.filter(
                                  (file) =>
                                      Number(
                                          file.projectid ??
                                              file.project_id,
                                      ) ===
                                      Number(
                                          selectedProjectId,
                                      ),
                              );

                    setFolderFiles(
                        projectFiles,
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        "Failed to load folder files:",
                        err,
                    );

                    setFolderFiles([]);

                    setFolderFilesError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load folder files.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingFolderFiles(false);
                }
            }
        };

        void loadFolderFiles();

        return () => {
            cancelled = true;
        };
    }, [
        selectedFolderId,
        selectedProjectId,
    ]);

    /* =========================================================
       File Selection
    ========================================================= */

    const handleFileChange = (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setSelectedFile(file);
        setUploadSuccess(false);
        setError("");
    };

    /* =========================================================
       Remove Selected File
    ========================================================= */

    const handleRemoveFile = () => {
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    /* =========================================================
       Project Selection
    ========================================================= */

    const handleProjectChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ) => {
        const value =
            event.target.value;

        const projectId =
            value === ""
                ? ""
                : Number(value);

        setSelectedProjectId(projectId);
        setSelectedFolderId("");

        setFolderFiles([]);
        setFolderFilesError("");
        setUploadSuccess(false);
        setError("");
    };

    /* =========================================================
       Folder Selection
    ========================================================= */

    const handleFolderChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ) => {
        const value =
            event.target.value;

        const folderId =
            value === ""
                ? ""
                : Number(value);

        setSelectedFolderId(folderId);

        setFolderFiles([]);
        setFolderFilesError("");
        setUploadSuccess(false);
        setError("");
    };

    /* =========================================================
       Get Actual File Project ID
       
       IMPORTANT:
       The API returns `projectid`.
       Do NOT blindly use selectedProjectId.
    ========================================================= */

    const getFileProjectId = (
        file: TaskFile,
    ): number => {
        return Number(
            file.projectid ??
                file.project_id ??
                selectedProjectId,
        );
    };

    /* =========================================================
       Get Actual File Folder ID
       
       Backend returns `fid`.
    ========================================================= */

    const getFileFolderId = (
        file: TaskFile,
    ): number => {
        return Number(
            file.fid ??
                file.folder_id ??
                selectedFolderId,
        );
    };

    /* =========================================================
       View File
    ========================================================= */

    const handleViewFile = async (
        file: TaskFile,
    ) => {
        const projectId =
            getFileProjectId(file);

        const folderId =
            getFileFolderId(file);

        const fileId =
            Number(file.pffid);

        if (
            !Number.isInteger(projectId) ||
            projectId <= 0
        ) {
            setError(
                "Invalid project ID for this file.",
            );
            return;
        }

        if (
            !Number.isInteger(folderId) ||
            folderId <= 0
        ) {
            setError(
                "Invalid folder ID for this file.",
            );
            return;
        }

        if (
            !Number.isInteger(fileId) ||
            fileId <= 0
        ) {
            setError(
                "Invalid file ID.",
            );
            return;
        }

        try {
            setError("");

            /*
             * Release previous blob URL.
             */
            if (viewingFileUrl) {
                URL.revokeObjectURL(
                    viewingFileUrl,
                );
            }

            setViewingFile(file);
            setViewingFileUrl(null);
            setIsViewingFile(true);

            /*
             * IMPORTANT:
             *
             * Use the project's ID belonging
             * to the file.
             *
             * Example:
             *
             * projectid = 59
             * fid       = 237
             * pffid     = 63
             *
             * Request:
             *
             * /api/59/folders/237/files/63/download
             */
            const blob =
                await downloadFolderFile(
                    projectId,
                    folderId,
                    fileId,
                );

            const blobUrl =
                URL.createObjectURL(blob);

            setViewingFileUrl(
                blobUrl,
            );
        } catch (err) {
            console.error(
                "Failed to view file:",
                err,
            );

            setViewingFile(null);
            setViewingFileUrl(null);

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to open the file.",
            );
        } finally {
            setIsViewingFile(false);
        }
    };

    /* =========================================================
       Close File Viewer
    ========================================================= */

    const handleCloseViewer = () => {
        if (viewingFileUrl) {
            URL.revokeObjectURL(
                viewingFileUrl,
            );
        }

        setViewingFileUrl(null);
        setViewingFile(null);
        setIsViewingFile(false);
    };

    /* =========================================================
       Download File
    ========================================================= */

    const handleDownloadFile = async (
        file: TaskFile,
    ) => {
        const projectId =
            getFileProjectId(file);

        const folderId =
            getFileFolderId(file);

        const fileId =
            Number(file.pffid);

        if (
            !Number.isInteger(projectId) ||
            projectId <= 0
        ) {
            setError(
                "Invalid project ID for this file.",
            );
            return;
        }

        if (
            !Number.isInteger(folderId) ||
            folderId <= 0
        ) {
            setError(
                "Invalid folder ID for this file.",
            );
            return;
        }

        if (
            !Number.isInteger(fileId) ||
            fileId <= 0
        ) {
            setError(
                "Invalid file ID.",
            );
            return;
        }

        try {
            setError("");

            await saveFolderFile(
                projectId,
                folderId,
                fileId,
                file.filename ||
                    "download",
            );
        } catch (err) {
            console.error(
                "Failed to download file:",
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to download the file.",
            );
        }
    };

    /* =========================================================
       Upload
    ========================================================= */

    const handleUpload = async () => {
        setError("");
        setUploadSuccess(false);

        if (!selectedFile) {
            setError(
                "Please select a file.",
            );
            return;
        }

        if (selectedProjectId === "") {
            setError(
                "Please select a project.",
            );
            return;
        }

        if (selectedFolderId === "") {
            setError(
                "Please select a folder.",
            );
            return;
        }

        const projectId =
            Number(selectedProjectId);

        const folderId =
            Number(selectedFolderId);

        if (
            !Number.isInteger(projectId) ||
            projectId <= 0
        ) {
            setError(
                "Invalid project selected.",
            );
            return;
        }

        if (
            !Number.isInteger(folderId) ||
            folderId <= 0
        ) {
            setError(
                "Invalid folder selected.",
            );
            return;
        }

        const folderExists =
            availableFolders.some(
                (folder) =>
                    Number(folder.fid) ===
                    folderId,
            );

        if (!folderExists) {
            setError(
                "The selected folder does not belong to the selected project.",
            );
            return;
        }

        try {
            setIsUploading(true);

            /*
             * POST
             * /api/{projectId}/folders/{folderId}/files
             *
             * FormData:
             * files = selectedFile
             */
            await uploadFileToFolder(
                projectId,
                folderId,
                selectedFile,
            );

            setUploadSuccess(true);

            setSelectedFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value =
                    "";
            }

            /*
             * Refresh files after upload.
             */
            setIsLoadingFolderFiles(true);

            try {
                const files =
                    await getFolderFiles(
                        folderId,
                    );

                /*
                 * Again, only show files belonging
                 * to the selected project.
                 */
                const projectFiles =
                    files.filter(
                        (file) =>
                            Number(
                                file.projectid ??
                                    file.project_id,
                            ) ===
                            projectId,
                    );

                setFolderFiles(
                    projectFiles,
                );

                setFolderFilesError("");
            } catch (refreshError) {
                console.error(
                    "Failed to refresh folder files:",
                    refreshError,
                );
            } finally {
                setIsLoadingFolderFiles(
                    false,
                );
            }
        } catch (err) {
            console.error(
                "File upload failed:",
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to upload file. Please try again.",
            );
        } finally {
            setIsUploading(false);
        }
    };

    /* =========================================================
       Render
    ========================================================= */

    return (
        <div
            className="
                min-h-[calc(100vh-90px)]
                bg-gray-50
                px-4
                py-6
                dark:bg-gray-950
            "
        >
            <div className="mx-auto max-w-[1600px]">

                {/* =================================================
                    Header
                ================================================= */}

                <div className="mb-6">
                    <h1
                        className="
                            text-2xl
                            font-bold
                            text-gray-900
                            dark:text-white
                        "
                    >
                        Files
                    </h1>

                    <p
                        className="
                            mt-1
                            text-sm
                            text-gray-500
                            dark:text-gray-400
                        "
                    >
                        Upload files to a project folder
                        and manage the files already
                        stored in that folder.
                    </p>
                </div>

                {/* =================================================
                    Success
                ================================================= */}

                {uploadSuccess && (
                    <div
                        className="
                            mb-5
                            flex
                            items-center
                            gap-3
                            rounded-xl
                            border
                            border-green-200
                            bg-green-50
                            px-4
                            py-3
                            text-sm
                            text-green-700
                            dark:border-green-900
                            dark:bg-green-950
                            dark:text-green-300
                        "
                    >
                        <CheckCircle2
                            size={20}
                            className="shrink-0"
                        />

                        <div>
                            <p className="font-semibold">
                                File uploaded successfully.
                            </p>

                            <p className="mt-0.5 text-xs">
                                The folder files have been
                                refreshed.
                            </p>
                        </div>
                    </div>
                )}

                {/* =================================================
                    Error
                ================================================= */}

                {error && (
                    <div
                        role="alert"
                        className="
                            mb-5
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            px-4
                            py-3
                            text-sm
                            text-red-700
                            dark:border-red-900
                            dark:bg-red-950
                            dark:text-red-300
                        "
                    >
                        {error}
                    </div>
                )}

                {/* =================================================
                    ROW 1
                ================================================= */}

                <div
                    className="
                        grid
                        grid-cols-1
                        gap-6
                        lg:grid-cols-3
                    "
                >

                    {/* =================================================
                        FILE DESTINATION
                    ================================================= */}

                    <div
                        className="
                            h-fit
                            rounded-2xl
                            border
                            border-gray-200
                            bg-white
                            p-6
                            shadow-sm
                            dark:border-gray-800
                            dark:bg-gray-900
                        "
                    >
                        <div className="mb-5">
                            <h2
                                className="
                                    text-base
                                    font-semibold
                                    text-gray-900
                                    dark:text-white
                                "
                            >
                                File Destination
                            </h2>

                            <p
                                className="
                                    mt-1
                                    text-sm
                                    text-gray-500
                                    dark:text-gray-400
                                "
                            >
                                Select the project and folder.
                            </p>
                        </div>

                        {/* Project */}

                        <div>
                            <label
                                htmlFor="project"
                                className="
                                    mb-2
                                    block
                                    text-sm
                                    font-medium
                                    text-gray-700
                                    dark:text-gray-300
                                "
                            >
                                Project
                            </label>

                            <div className="relative">
                                <select
                                    id="project"
                                    value={
                                        selectedProjectId
                                    }
                                    onChange={
                                        handleProjectChange
                                    }
                                    disabled={
                                        isLoadingProjects ||
                                        isUploading
                                    }
                                    className="
                                        w-full
                                        appearance-none
                                        rounded-lg
                                        border
                                        border-gray-300
                                        bg-white
                                        px-3
                                        py-2.5
                                        text-sm
                                        text-gray-900
                                        outline-none
                                        transition
                                        focus:border-sky-500
                                        focus:ring-2
                                        focus:ring-sky-500/20
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                        dark:border-gray-700
                                        dark:bg-gray-950
                                        dark:text-white
                                    "
                                >
                                    <option value="">
                                        {isLoadingProjects
                                            ? "Loading projects..."
                                            : "Select project"}
                                    </option>

                                    {projects.map(
                                        (
                                            project,
                                        ) => (
                                            <option
                                                key={
                                                    project.project_id
                                                }
                                                value={
                                                    project.project_id
                                                }
                                            >
                                                {
                                                    project.projectname
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>

                                {isLoadingProjects && (
                                    <Loader2
                                        size={16}
                                        className="
                                            absolute
                                            right-3
                                            top-3
                                            animate-spin
                                            text-gray-400
                                        "
                                    />
                                )}
                            </div>
                        </div>

                        {/* Folder */}

                        <div className="mt-5">
                            <label
                                htmlFor="folder"
                                className="
                                    mb-2
                                    block
                                    text-sm
                                    font-medium
                                    text-gray-700
                                    dark:text-gray-300
                                "
                            >
                                Folder
                            </label>

                            <div className="relative">
                                <select
                                    id="folder"
                                    value={
                                        selectedFolderId
                                    }
                                    onChange={
                                        handleFolderChange
                                    }
                                    disabled={
                                        selectedProjectId ===
                                            "" ||
                                        isLoadingFolders ||
                                        isUploading
                                    }
                                    className="
                                        w-full
                                        appearance-none
                                        rounded-lg
                                        border
                                        border-gray-300
                                        bg-white
                                        px-3
                                        py-2.5
                                        text-sm
                                        text-gray-900
                                        outline-none
                                        transition
                                        focus:border-sky-500
                                        focus:ring-2
                                        focus:ring-sky-500/20
                                        disabled:cursor-not-allowed
                                        disabled:bg-gray-100
                                        disabled:opacity-60
                                        dark:border-gray-700
                                        dark:bg-gray-950
                                        dark:text-white
                                        dark:disabled:bg-gray-800
                                    "
                                >
                                    <option value="">
                                        {selectedProjectId ===
                                        ""
                                            ? "Select a project first"
                                            : isLoadingFolders
                                                ? "Loading folders..."
                                                : availableFolders.length ===
                                                    0
                                                    ? "No folders found"
                                                    : "Select folder"}
                                    </option>

                                    {availableFolders.map(
                                        (
                                            folder,
                                        ) => (
                                            <option
                                                key={
                                                    folder.fid
                                                }
                                                value={
                                                    folder.fid
                                                }
                                            >
                                                {
                                                    folder.fname
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>

                                {isLoadingFolders &&
                                    selectedProjectId !==
                                        "" && (
                                        <Loader2
                                            size={16}
                                            className="
                                                absolute
                                                right-3
                                                top-3
                                                animate-spin
                                                text-gray-400
                                            "
                                        />
                                    )}
                            </div>

                            {selectedProjectId !==
                                "" &&
                                !isLoadingFolders &&
                                availableFolders.length ===
                                    0 && (
                                    <p
                                        className="
                                            mt-2
                                            text-xs
                                            text-amber-600
                                            dark:text-amber-400
                                        "
                                    >
                                        No top-level folders
                                        are associated with
                                        this project.
                                    </p>
                                )}
                        </div>

                        {/* Destination Preview */}

                        {(selectedProject ||
                            selectedFolder) && (
                            <div
                                className="
                                    mt-6
                                    rounded-xl
                                    border
                                    border-sky-100
                                    bg-sky-50
                                    p-4
                                    dark:border-sky-900
                                    dark:bg-sky-950
                                "
                            >
                                <p
                                    className="
                                        mb-4
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wider
                                        text-sky-700
                                        dark:text-sky-300
                                    "
                                >
                                    Upload Destination
                                </p>

                                {selectedProject && (
                                    <div className="flex items-start gap-3">
                                        <FileIcon
                                            size={17}
                                            className="
                                                mt-0.5
                                                shrink-0
                                                text-sky-700
                                                dark:text-sky-300
                                            "
                                        />

                                        <div className="min-w-0">
                                            <p
                                                className="
                                                    text-xs
                                                    text-gray-500
                                                    dark:text-gray-400
                                                "
                                            >
                                                Project
                                            </p>

                                            <p
                                                className="
                                                    mt-0.5
                                                    break-words
                                                    text-sm
                                                    font-medium
                                                    text-gray-900
                                                    dark:text-white
                                                "
                                            >
                                                {
                                                    selectedProject.projectname
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {selectedFolder && (
                                    <div className="mt-4 flex items-start gap-3">
                                        <Folder
                                            size={17}
                                            className="
                                                mt-0.5
                                                shrink-0
                                                text-sky-700
                                                dark:text-sky-300
                                            "
                                        />

                                        <div className="min-w-0">
                                            <p
                                                className="
                                                    text-xs
                                                    text-gray-500
                                                    dark:text-gray-400
                                                "
                                            >
                                                Folder
                                            </p>

                                            <p
                                                className="
                                                    mt-0.5
                                                    break-words
                                                    text-sm
                                                    font-medium
                                                    text-gray-900
                                                    dark:text-white
                                                "
                                            >
                                                {
                                                    selectedFolder.fname
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* =================================================
                        FOLDER FILES
                    ================================================= */}

                    <div
                        className="
                            min-w-0
                            rounded-2xl
                            border
                            border-gray-200
                            bg-white
                            p-6
                            shadow-sm
                            lg:col-span-2
                            dark:border-gray-800
                            dark:bg-gray-900
                        "
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    className="
                                        text-base
                                        font-semibold
                                        text-gray-900
                                        dark:text-white
                                    "
                                >
                                    Folder Files
                                </h2>

                                <p
                                    className="
                                        mt-1
                                        text-sm
                                        text-gray-500
                                        dark:text-gray-400
                                    "
                                >
                                    {selectedFolder
                                        ? `Files in ${selectedFolder.fname}`
                                        : "Select a folder to view its files."}
                                </p>
                            </div>

                            {selectedFolderId !==
                                "" &&
                                !isLoadingFolderFiles &&
                                !folderFilesError && (
                                    <span
                                        className="
                                            shrink-0
                                            rounded-full
                                            bg-gray-100
                                            px-2.5
                                            py-1
                                            text-xs
                                            font-medium
                                            text-gray-600
                                            dark:bg-gray-800
                                            dark:text-gray-300
                                        "
                                    >
                                        {
                                            folderFiles.length
                                        }{" "}
                                        {folderFiles.length ===
                                        1
                                            ? "file"
                                            : "files"}
                                    </span>
                                )}
                        </div>

                        <div className="mt-5">

                            {/* No folder */}

                            {selectedFolderId ===
                                "" && (
                                <div
                                    className="
                                        flex
                                        min-h-[300px]
                                        flex-col
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-dashed
                                        border-gray-300
                                        bg-gray-50
                                        text-center
                                        dark:border-gray-700
                                        dark:bg-gray-950
                                    "
                                >
                                    <Folder
                                        size={32}
                                        className="
                                            text-gray-400
                                            dark:text-gray-500
                                        "
                                    />

                                    <p
                                        className="
                                            mt-3
                                            text-sm
                                            font-medium
                                            text-gray-600
                                            dark:text-gray-400
                                        "
                                    >
                                        No folder selected
                                    </p>

                                    <p
                                        className="
                                            mt-1
                                            text-xs
                                            text-gray-400
                                            dark:text-gray-500
                                        "
                                    >
                                        Select a folder on
                                        the left to view its
                                        files.
                                    </p>
                                </div>
                            )}

                            {/* Loading */}

                            {selectedFolderId !==
                                "" &&
                                isLoadingFolderFiles && (
                                <div
                                    className="
                                        flex
                                        min-h-[300px]
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-gray-200
                                        bg-gray-50
                                        dark:border-gray-800
                                        dark:bg-gray-950
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
                                            size={18}
                                            className="animate-spin"
                                        />

                                        Loading folder
                                        files...
                                    </div>
                                </div>
                            )}

                            {/* Error */}

                            {selectedFolderId !==
                                "" &&
                                !isLoadingFolderFiles &&
                                folderFilesError && (
                                <div
                                    className="
                                        rounded-xl
                                        border
                                        border-red-200
                                        bg-red-50
                                        px-4
                                        py-3
                                        text-sm
                                        text-red-700
                                        dark:border-red-900
                                        dark:bg-red-950
                                        dark:text-red-300
                                    "
                                >
                                    {
                                        folderFilesError
                                    }
                                </div>
                            )}

                            {/* Empty */}

                            {selectedFolderId !==
                                "" &&
                                !isLoadingFolderFiles &&
                                !folderFilesError &&
                                folderFiles.length ===
                                    0 && (
                                <div
                                    className="
                                        flex
                                        min-h-[300px]
                                        flex-col
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-dashed
                                        border-gray-300
                                        bg-gray-50
                                        text-center
                                        dark:border-gray-700
                                        dark:bg-gray-950
                                    "
                                >
                                    <FileIcon
                                        size={32}
                                        className="
                                            text-gray-400
                                            dark:text-gray-500
                                        "
                                    />

                                    <p
                                        className="
                                            mt-3
                                            text-sm
                                            font-medium
                                            text-gray-600
                                            dark:text-gray-400
                                        "
                                    >
                                        No files in this
                                        folder
                                    </p>
                                </div>
                            )}

                            {/* Files */}

                            {selectedFolderId !==
                                "" &&
                                !isLoadingFolderFiles &&
                                !folderFilesError &&
                                folderFiles.length >
                                    0 && (
                                <div
                                    className="
                                        grid
                                        grid-cols-1
                                        gap-2
                                        xl:grid-cols-2
                                    "
                                >
                                    {folderFiles.map(
                                        (
                                            file,
                                        ) => (
                                            <FolderFileRow
                                                key={
                                                    file.pffid
                                                }
                                                file={
                                                    file
                                                }
                                                onView={
                                                    handleViewFile
                                                }
                                                onDownload={
                                                    handleDownloadFile
                                                }
                                            />
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* =================================================
                    ROW 2 - SELECT FILE + UPLOAD
                ================================================= */}

                <div
                    className="
                        mt-6
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        p-6
                        shadow-sm
                        dark:border-gray-800
                        dark:bg-gray-900
                    "
                >
                    <div className="mb-5">
                        <h2
                            className="
                                text-base
                                font-semibold
                                text-gray-900
                                dark:text-white
                            "
                        >
                            Select File
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-gray-500
                                dark:text-gray-400
                            "
                        >
                            Choose the file you want to
                            upload.
                        </p>
                    </div>

                    {/* File Selection */}

                    {!selectedFile ? (
                        <>
                            <button
                                type="button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                disabled={
                                    isUploading
                                }
                                className="
                                    flex
                                    min-h-[220px]
                                    w-full
                                    flex-col
                                    items-center
                                    justify-center
                                    rounded-xl
                                    border-2
                                    border-dashed
                                    border-gray-300
                                    bg-gray-50
                                    px-6
                                    transition
                                    hover:border-sky-400
                                    hover:bg-sky-50
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                    dark:border-gray-700
                                    dark:bg-gray-950
                                    dark:hover:border-sky-700
                                    dark:hover:bg-sky-950
                                "
                            >
                                <div
                                    className="
                                        flex
                                        h-14
                                        w-14
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-sky-100
                                        text-sky-700
                                        dark:bg-sky-950
                                        dark:text-sky-300
                                    "
                                >
                                    <Upload
                                        size={25}
                                    />
                                </div>

                                <p
                                    className="
                                        mt-4
                                        text-sm
                                        font-semibold
                                        text-gray-800
                                        dark:text-gray-200
                                    "
                                >
                                    Click to select a file
                                </p>

                                <p
                                    className="
                                        mt-1
                                        text-xs
                                        text-gray-500
                                        dark:text-gray-400
                                    "
                                >
                                    Select a file from
                                    your computer
                                </p>
                            </button>

                            <input
                                ref={
                                    fileInputRef
                                }
                                type="file"
                                className="hidden"
                                onChange={
                                    handleFileChange
                                }
                            />
                        </>
                    ) : (
                        <div
                            className="
                                rounded-xl
                                border
                                border-gray-200
                                bg-gray-50
                                p-4
                                dark:border-gray-700
                                dark:bg-gray-950
                            "
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="
                                        flex
                                        h-12
                                        w-12
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-lg
                                        bg-sky-100
                                        text-sky-700
                                        dark:bg-sky-950
                                        dark:text-sky-300
                                    "
                                >
                                    <FileIcon
                                        size={22}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p
                                        className="
                                            truncate
                                            text-sm
                                            font-semibold
                                            text-gray-900
                                            dark:text-white
                                        "
                                    >
                                        {
                                            selectedFile.name
                                        }
                                    </p>

                                    <p
                                        className="
                                            mt-1
                                            text-xs
                                            text-gray-500
                                            dark:text-gray-400
                                        "
                                    >
                                        {formatFileSize(
                                            selectedFile.size,
                                        )}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        handleRemoveFile
                                    }
                                    disabled={
                                        isUploading
                                    }
                                    className="
                                        rounded-lg
                                        p-2
                                        text-gray-400
                                        transition
                                        hover:bg-red-50
                                        hover:text-red-600
                                        disabled:opacity-50
                                        dark:hover:bg-red-950
                                        dark:hover:text-red-400
                                    "
                                    aria-label="Remove file"
                                >
                                    <X
                                        size={18}
                                    />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Upload Button */}

                    <button
                        type="button"
                        onClick={
                            handleUpload
                        }
                        disabled={
                            isUploading ||
                            isLoadingProjects ||
                            isLoadingFolders ||
                            !selectedFile ||
                            selectedProjectId ===
                                "" ||
                            selectedFolderId ===
                                ""
                        }
                        className="
                            mt-5
                            flex
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            bg-sky-900
                            px-4
                            py-3
                            text-sm
                            font-semibold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-sky-800
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                            dark:bg-sky-200
                            dark:text-sky-950
                            dark:hover:bg-sky-300
                        "
                    >
                        {isUploading ? (
                            <>
                                <Loader2
                                    size={17}
                                    className="animate-spin"
                                />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload
                                    size={17}
                                />
                                Upload File
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* =================================================
                File Viewer
            ================================================= */}

            {viewingFile && (
                <FileViewerModal
                    file={viewingFile}
                    fileUrl={viewingFileUrl}
                    isLoading={
                        isViewingFile
                    }
                    onClose={
                        handleCloseViewer
                    }
                    onDownload={() =>
                        handleDownloadFile(
                            viewingFile,
                        )
                    }
                />
            )}
        </div>
    );
}

/* =========================================================
   Folder File Row
========================================================= */

interface FolderFileRowProps {
    file: TaskFile;
    onView: (file: TaskFile) => void;
    onDownload: (file: TaskFile) => void;
}

function FolderFileRow({
    file,
    onView,
    onDownload,
}: FolderFileRowProps) {
    const hasFileId =
        Number.isInteger(
            Number(file.pffid),
        ) &&
        Number(file.pffid) > 0;

    const hasProjectId =
        Number.isInteger(
            Number(
                file.projectid ??
                    file.project_id,
            ),
        ) &&
        Number(
            file.projectid ??
                file.project_id,
        ) > 0;

    const hasFolderId =
        Number.isInteger(
            Number(
                file.fid ??
                    file.folder_id,
            ),
        ) &&
        Number(
            file.fid ??
                file.folder_id,
        ) > 0;

    const canAccessFile =
        hasFileId &&
        hasProjectId &&
        hasFolderId;

    return (
        <div
            className="
                flex
                min-w-0
                items-center
                gap-3
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                px-4
                py-3
                transition
                hover:border-gray-300
                hover:bg-gray-100
                dark:border-gray-800
                dark:bg-gray-950
                dark:hover:border-gray-700
                dark:hover:bg-gray-900
            "
        >
            <div
                className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-white
                    dark:bg-gray-900
                "
            >
                <FileIcon
                    size={18}
                    className="
                        text-gray-500
                        dark:text-gray-400
                    "
                />
            </div>

            <div className="min-w-0 flex-1">
                <p
                    className="
                        truncate
                        text-sm
                        font-medium
                        text-gray-900
                        dark:text-white
                    "
                    title={
                        file.filename
                    }
                >
                    {file.filename}
                </p>

                <div
                    className="
                        mt-1
                        flex
                        items-center
                        gap-2
                    "
                >
                    <span
                        className="
                            truncate
                            text-[11px]
                            text-gray-500
                            dark:text-gray-400
                        "
                    >
                        {file.MIME ||
                            "Unknown type"}
                    </span>

                    <span className="text-gray-300 dark:text-gray-700">
                        •
                    </span>

                    <span
                        className="
                            shrink-0
                            text-[11px]
                            text-gray-500
                            dark:text-gray-400
                        "
                    >
                        {formatFileSize(
                            Number(
                                file.filesize,
                            ),
                        )}
                    </span>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">

                {/* View */}

                <button
                    type="button"
                    onClick={() =>
                        onView(file)
                    }
                    disabled={
                        !canAccessFile
                    }
                    title={
                        canAccessFile
                            ? "View file"
                            : "File information unavailable"
                    }
                    className="
                        flex
                        items-center
                        gap-1.5
                        rounded-lg
                        border
                        border-gray-300
                        bg-white
                        px-3
                        py-2
                        text-xs
                        font-medium
                        text-gray-700
                        transition
                        hover:bg-gray-50
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                        dark:border-gray-700
                        dark:bg-gray-900
                        dark:text-gray-300
                        dark:hover:bg-gray-800
                    "
                >
                    <ExternalLink
                        size={14}
                    />

                    View
                </button>

                {/* Download */}

                <button
                    type="button"
                    onClick={() =>
                        onDownload(file)
                    }
                    disabled={
                        !canAccessFile
                    }
                    title={
                        canAccessFile
                            ? "Download file"
                            : "File information unavailable"
                    }
                    className="
                        flex
                        items-center
                        justify-center
                        rounded-lg
                        bg-sky-900
                        p-2
                        text-white
                        transition
                        hover:bg-sky-800
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                        dark:bg-sky-200
                        dark:text-sky-950
                        dark:hover:bg-sky-300
                    "
                >
                    <Download
                        size={15}
                    />
                </button>
            </div>
        </div>
    );
}

/* =========================================================
   File Viewer Modal
========================================================= */

interface FileViewerModalProps {
    file: TaskFile;
    fileUrl: string | null;
    isLoading: boolean;
    onClose: () => void;
    onDownload: () => void;
}

function FileViewerModal({
    file,
    fileUrl,
    isLoading,
    onClose,
    onDownload,
}: FileViewerModalProps) {
    const mimeType =
        file.MIME?.toLowerCase() ||
        "";

    const filename =
        file.filename?.toLowerCase() ||
        "";

    const isPdf =
        mimeType.includes(
            "application/pdf",
        ) ||
        filename.endsWith(".pdf");

    const isImage =
        mimeType.startsWith(
            "image/",
        ) ||
        /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(
            filename,
        );

    const isVideo =
        mimeType.startsWith(
            "video/",
        );

    const isAudio =
        mimeType.startsWith(
            "audio/",
        );

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
                            title={
                                file.filename
                            }
                        >
                            {
                                file.filename
                            }
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

                    <div className="flex shrink-0 items-center gap-2">

                        {/* Download */}

                        <button
                            type="button"
                            onClick={
                                onDownload
                            }
                            disabled={
                                isLoading
                            }
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
                                dark:hover:bg-sky-300
                            "
                        >
                            <Download
                                size={14}
                            />

                            Download
                        </button>

                        {/* Close */}

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
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
                            aria-label="Close"
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

                    {/* Loading */}

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
                    ) : !fileUrl ? (
                        <div
                            className="
                                flex
                                h-full
                                items-center
                                justify-center
                                text-center
                            "
                        >
                            <div>
                                <FileIcon
                                    size={40}
                                    className="
                                        mx-auto
                                        text-gray-400
                                    "
                                />

                                <p
                                    className="
                                        mt-4
                                        text-sm
                                        font-medium
                                        text-gray-700
                                        dark:text-gray-300
                                    "
                                >
                                    File preview unavailable
                                </p>

                                <p
                                    className="
                                        mt-1
                                        text-xs
                                        text-gray-500
                                        dark:text-gray-400
                                    "
                                >
                                    The file could not
                                    be loaded from the
                                    server.
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        onDownload
                                    }
                                    className="
                                        mt-4
                                        inline-flex
                                        items-center
                                        gap-2
                                        rounded-lg
                                        bg-sky-900
                                        px-4
                                        py-2.5
                                        text-xs
                                        font-semibold
                                        text-white
                                        hover:bg-sky-800
                                        dark:bg-sky-200
                                        dark:text-sky-950
                                        dark:hover:bg-sky-300
                                    "
                                >
                                    <Download
                                        size={14}
                                    />

                                    Download File
                                </button>
                            </div>
                        </div>
                    ) : isPdf ? (
                        <iframe
                            src={fileUrl}
                            title={
                                file.filename
                            }
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
                                alt={
                                    file.filename
                                }
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
                            >
                                Your browser does not
                                support video playback.
                            </video>
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
                            >
                                Your browser does not
                                support audio playback.
                            </audio>
                        </div>
                    ) : (
                        <div
                            className="
                                flex
                                h-full
                                items-center
                                justify-center
                                text-center
                            "
                        >
                            <div>
                                <FileIcon
                                    size={40}
                                    className="
                                        mx-auto
                                        text-gray-400
                                    "
                                />

                                <p
                                    className="
                                        mt-4
                                        text-sm
                                        font-medium
                                        text-gray-700
                                        dark:text-gray-300
                                    "
                                >
                                    Preview is not
                                    available for
                                    this file type.
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        onDownload
                                    }
                                    className="
                                        mt-4
                                        inline-flex
                                        items-center
                                        gap-2
                                        rounded-lg
                                        bg-sky-900
                                        px-4
                                        py-2.5
                                        text-xs
                                        font-semibold
                                        text-white
                                        hover:bg-sky-800
                                        dark:bg-sky-200
                                        dark:text-sky-950
                                        dark:hover:bg-sky-300
                                    "
                                >
                                    <Download
                                        size={14}
                                    />

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
   File Size
========================================================= */

function formatFileSize(
    bytes: number,
): string {
    if (
        !Number.isFinite(bytes) ||
        bytes <= 0
    ) {
        return "Unknown size";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
    ];

    const index = Math.min(
        Math.floor(
            Math.log(bytes) /
                Math.log(1024),
        ),
        units.length - 1,
    );

    return `${(
        bytes /
        Math.pow(1024, index)
    ).toFixed(
        index === 0 ? 0 : 1,
    )} ${units[index]}`;
}

export default FileUploadPage;