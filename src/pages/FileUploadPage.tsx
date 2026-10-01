import {
    ArrowLeft,
    CheckCircle2,
    Download,
    ExternalLink,
    File,
    FileAudio,
    FileImage,
    FileText,
    FileVideo,
    Folder,
    FolderOpen,
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

import type {
    ChangeEvent,
    ReactNode,
    RefObject,
} from "react";

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
    getTasks,
    type TaskFile,
} from "../api/tasks";

import type { Task } from "../types/task";

/* =========================================================
   Navigation
========================================================= */

type ViewLevel =
    | "tasks"
    | "project"
    | "folder"
    | "files";

/* =========================================================
   Helpers
========================================================= */

function toNumberId(value: unknown): number | null {
    const id = Number(value);

    return Number.isFinite(id) && id > 0
        ? id
        : null;
}

/* =========================================================
   Component
========================================================= */

function FileUploadPage() {
    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    /* =========================================================
       Data
    ========================================================= */

    const [tasks, setTasks] =
        useState<Task[]>([]);

    const [projects, setProjects] =
        useState<Project[]>([]);

    const [folders, setFolders] =
        useState<ProjectFolder[]>([]);

    const [folderFiles, setFolderFiles] =
        useState<TaskFile[]>([]);

    /* =========================================================
       Navigation
    ========================================================= */

    const [currentView, setCurrentView] =
        useState<ViewLevel>("tasks");

    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

    const [selectedProject, setSelectedProject] =
        useState<Project | null>(null);

    const [selectedFolder, setSelectedFolder] =
        useState<ProjectFolder | null>(null);

    /* =========================================================
       Loading
    ========================================================= */

    const [isLoadingTasks, setIsLoadingTasks] =
        useState(false);

    const [isLoadingProjects, setIsLoadingProjects] =
        useState(false);

    const [isLoadingFolders, setIsLoadingFolders] =
        useState(false);

    const [
        isLoadingFolderFiles,
        setIsLoadingFolderFiles,
    ] = useState(false);

    const [isUploading, setIsUploading] =
        useState(false);

    /* =========================================================
       Errors / Upload
    ========================================================= */

    const [error, setError] =
        useState("");

    const [
        folderFilesError,
        setFolderFilesError,
    ] = useState("");

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [uploadSuccess, setUploadSuccess] =
        useState(false);

    /* =========================================================
       Viewer
    ========================================================= */

    const [viewingFile, setViewingFile] =
        useState<TaskFile | null>(null);

    const [viewingFileUrl, setViewingFileUrl] =
        useState<string | null>(null);

    const [isViewingFile, setIsViewingFile] =
        useState(false);

    /* =========================================================
       Logged In User
       
       JWT sub is preferred.
       login_user is fallback.
    ========================================================= */

    const loggedInUserId = useMemo(() => {
        const token =
            localStorage.getItem("access_token");

        if (token) {
            try {
                const parts =
                    token.split(".");

                if (parts.length === 3) {
                    const payload =
                        JSON.parse(
                            atob(parts[1]),
                        );

                    const id =
                        toNumberId(
                            payload?.sub,
                        );

                    if (id !== null) {
                        return id;
                    }
                }
            } catch (err) {
                console.warn(
                    "Unable to read user ID from access token:",
                    err,
                );
            }
        }

        const loginUser =
            localStorage.getItem(
                "login_user",
            );

        if (loginUser) {
            try {
                const user =
                    JSON.parse(loginUser);

                const id =
                    toNumberId(
                        user?.uid ??
                        user?.user_id ??
                        user?.id,
                    );

                if (id !== null) {
                    return id;
                }
            } catch (err) {
                console.warn(
                    "Unable to read login_user:",
                    err,
                );
            }
        }

        return null;
    }, []);

    /* =========================================================
       Load Tasks
    ========================================================= */

    useEffect(() => {
        let cancelled = false;

        const loadTasks = async () => {
            setIsLoadingTasks(true);

            try {
                const response =
                    await getTasks();

                if (cancelled) {
                    return;
                }

                const loadedTasks =
                    Array.isArray(response)
                        ? response
                        : [];

                setTasks(loadedTasks);

                console.log(
                    "FileUploadPage - Tasks:",
                    loadedTasks,
                );
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        "Failed to load tasks:",
                        err,
                    );

                    setTasks([]);

                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load tasks.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingTasks(false);
                }
            }
        };

        void loadTasks();

        return () => {
            cancelled = true;
        };
    }, []);

    /* =========================================================
       Load Projects
    ========================================================= */

    useEffect(() => {
        let cancelled = false;

        const loadProjects = async () => {
            setIsLoadingProjects(true);

            try {
                const response =
                    await getProjects();

                if (cancelled) {
                    return;
                }

                const loadedProjects =
                    Array.isArray(
                        response?.projects,
                    )
                        ? response.projects
                        : [];

                setProjects(
                    loadedProjects,
                );

                console.log(
                    "FileUploadPage - Projects:",
                    loadedProjects,
                );
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        "Failed to load projects:",
                        err,
                    );

                    setProjects([]);

                    /*
                     * Functional state update avoids
                     * reading `error` inside the effect,
                     * so exhaustive-deps does not require
                     * `error` as a dependency.
                     */
                    setError(
                        (currentError) =>
                            currentError ||
                            (
                                err instanceof Error
                                    ? err.message
                                    : "Failed to load projects."
                            ),
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingProjects(
                        false,
                    );
                }
            }
        };

        void loadProjects();

        return () => {
            cancelled = true;
        };
    }, []);

    /* =========================================================
       Load Folders
    ========================================================= */

    useEffect(() => {
        let cancelled = false;

        const loadFolders = async () => {
            setIsLoadingFolders(true);

            try {
                const response =
                    await getFolders();

                if (cancelled) {
                    return;
                }

                const loadedFolders =
                    Array.isArray(
                        response?.folders,
                    )
                        ? response.folders
                        : [];

                setFolders(
                    loadedFolders,
                );

                console.log(
                    "FileUploadPage - Folders:",
                    loadedFolders,
                );
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        "Failed to load folders:",
                        err,
                    );

                    setFolders([]);

                    /*
                     * Functional state update avoids
                     * reading `error` inside the effect.
                     */
                    setError(
                        (currentError) =>
                            currentError ||
                            (
                                err instanceof Error
                                    ? err.message
                                    : "Failed to load folders."
                            ),
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingFolders(
                        false,
                    );
                }
            }
        };

        void loadFolders();

        return () => {
            cancelled = true;
        };
    }, []);

    /* =========================================================
       User Tasks
    ========================================================= */

    const userTasks = useMemo(() => {
        if (loggedInUserId === null) {
            return [];
        }

        return tasks.filter(
            (task) =>
                toNumberId(
                    task.assigned_to,
                ) === loggedInUserId,
        );
    }, [
        tasks,
        loggedInUserId,
    ]);

    /* =========================================================
       Selected Project
    ========================================================= */

    const taskProject = useMemo(() => {
        if (!selectedTask) {
            return null;
        }

        const taskProjectId =
            toNumberId(
                selectedTask.project_id,
            );

        if (taskProjectId === null) {
            return null;
        }

        return (
            projects.find(
                (project) =>
                    toNumberId(
                        project.project_id,
                    ) === taskProjectId,
            ) ?? null
        );
    }, [
        projects,
        selectedTask,
    ]);

    /* =========================================================
       Selected Folder
    ========================================================= */

    const taskFolder = useMemo(() => {
        if (!selectedTask) {
            return null;
        }

        const taskFolderId =
            toNumberId(
                selectedTask.folder_id,
            );

        if (taskFolderId === null) {
            return null;
        }

        return (
            folders.find(
                (folder) =>
                    toNumberId(
                        folder.fid,
                    ) === taskFolderId,
            ) ?? null
        );
    }, [
        folders,
        selectedTask,
    ]);

    /* =========================================================
       Project Name
    ========================================================= */

    const projectName =
        taskProject?.projectname ||
        `Project ${
            selectedTask?.project_id ?? ""
        }`;

    /* =========================================================
       Folder Name
    ========================================================= */

    const folderName =
        selectedFolder?.fname ||
        taskFolder?.fname ||
        `Folder ${
            selectedTask?.folder_id ?? ""
        }`;

    /* =========================================================
       Open Task
    ========================================================= */

    const handleOpenTask = (
        task: Task,
    ) => {
        setError("");
        setUploadSuccess(false);

        setSelectedTask(task);

        const taskProjectId =
            toNumberId(
                task.project_id,
            );

        const project =
            taskProjectId === null
                ? null
                : (
                    projects.find(
                        (item) =>
                            toNumberId(
                                item.project_id,
                            ) ===
                            taskProjectId,
                    ) ?? null
                );

        setSelectedProject(project);

        setSelectedFolder(null);

        setFolderFiles([]);
        setFolderFilesError("");

        setCurrentView("project");
    };

    /* =========================================================
       Open Project
    ========================================================= */

    const handleOpenProject = () => {
        if (!selectedTask) {
            return;
        }

        setError("");
        setUploadSuccess(false);

        const taskFolderId =
            toNumberId(
                selectedTask.folder_id,
            );

        const folder =
            taskFolderId === null
                ? null
                : (
                    folders.find(
                        (item) =>
                            toNumberId(
                                item.fid,
                            ) ===
                            taskFolderId,
                    ) ?? null
                );

        if (!folder) {
            setSelectedFolder(null);

            setError(
                "The folder associated with this task could not be found.",
            );

            setCurrentView("folder");

            return;
        }

        /*
         * Validate folder -> project relationship.
         */
        const taskProjectId =
            toNumberId(
                selectedTask.project_id,
            );

        const folderProjectId =
            toNumberId(folder.tid);

        if (
            taskProjectId !== null &&
            folderProjectId !== null &&
            taskProjectId !==
            folderProjectId
        ) {
            console.warn(
                "Folder/project relationship mismatch:",
                {
                    taskProjectId,
                    folderProjectId,
                    folder,
                },
            );
        }

        setSelectedFolder(folder);
        setFolderFiles([]);
        setFolderFilesError("");

        setCurrentView("folder");
    };

    /* =========================================================
       Open Folder
    ========================================================= */

    const handleOpenFolder = () => {
        if (
            !selectedTask ||
            !selectedFolder
        ) {
            return;
        }

        setError("");
        setUploadSuccess(false);

        setFolderFiles([]);
        setFolderFilesError("");

        setCurrentView("files");
    };

    /* =========================================================
       Filter Folder Files
    ========================================================= */

    const filterFilesForTaskProject = (
        files: TaskFile[],
        projectId: number | null,
    ): TaskFile[] => {
        /*
         * The folder endpoint already scopes files
         * to the selected folder.
         *
         * If the backend does not return a project
         * ID on a file, keep it because it came from
         * the selected folder.
         */
        return files.filter(
            (file) => {
                const fileProjectId =
                    toNumberId(
                        file.projectid ??
                        file.project_id,
                    );

                if (
                    fileProjectId === null
                ) {
                    return true;
                }

                if (
                    projectId === null
                ) {
                    return true;
                }

                return (
                    fileProjectId ===
                    projectId
                );
            },
        );
    };

    /* =========================================================
       Load Folder Files
    ========================================================= */

    useEffect(() => {
        if (
            currentView !== "files" ||
            !selectedFolder
        ) {
            return;
        }

        let cancelled = false;

        const loadFiles = async () => {
            setIsLoadingFolderFiles(true);
            setFolderFilesError("");

            try {
                const folderId =
                    toNumberId(
                        selectedFolder.fid,
                    );

                if (folderId === null) {
                    throw new Error(
                        "Invalid folder ID.",
                    );
                }

                const files =
                    await getFolderFiles(
                        folderId,
                    );

                if (cancelled) {
                    return;
                }

                const projectId =
                    toNumberId(
                        selectedTask?.project_id,
                    );

                const projectFiles =
                    filterFilesForTaskProject(
                        files,
                        projectId,
                    );

                setFolderFiles(
                    projectFiles,
                );

                console.log(
                    "Folder files:",
                    {
                        folderId:
                            selectedFolder.fid,
                        projectId,
                        files:
                            projectFiles,
                    },
                );
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
                    setIsLoadingFolderFiles(
                        false,
                    );
                }
            }
        };

        void loadFiles();

        return () => {
            cancelled = true;
        };
    }, [
        currentView,
        selectedFolder,
        selectedTask,
    ]);

    /* =========================================================
       Back Navigation
    ========================================================= */

    const handleBack = () => {
        setError("");
        setUploadSuccess(false);

        if (
            currentView === "files"
        ) {
            setFolderFiles([]);
            setFolderFilesError("");

            setSelectedFolder(
                taskFolder,
            );

            setCurrentView("folder");

            return;
        }

        if (
            currentView === "folder"
        ) {
            setSelectedFolder(null);

            setCurrentView("project");

            return;
        }

        if (
            currentView === "project"
        ) {
            setSelectedTask(null);
            setSelectedProject(null);
            setSelectedFolder(null);
            setFolderFiles([]);
            setFolderFilesError("");

            setCurrentView("tasks");
        }
    };

    /* =========================================================
       Breadcrumb - Tasks
    ========================================================= */

    const goToTasks = () => {
        setSelectedTask(null);
        setSelectedProject(null);
        setSelectedFolder(null);
        setFolderFiles([]);
        setFolderFilesError("");

        setError("");
        setUploadSuccess(false);

        setCurrentView("tasks");
    };

    /* =========================================================
       Breadcrumb - Project
    ========================================================= */

    const goToProject = () => {
        if (!selectedTask) {
            return;
        }

        setSelectedProject(
            taskProject,
        );

        setSelectedFolder(null);
        setFolderFiles([]);
        setFolderFilesError("");

        setError("");
        setUploadSuccess(false);

        setCurrentView("project");
    };

    /* =========================================================
       Breadcrumb - Folder
    ========================================================= */

    const goToFolder = () => {
        if (!selectedTask) {
            return;
        }

        const taskFolderId =
            toNumberId(
                selectedTask.folder_id,
            );

        const folder =
            taskFolderId === null
                ? null
                : (
                    folders.find(
                        (item) =>
                            toNumberId(
                                item.fid,
                            ) ===
                            taskFolderId,
                    ) ?? null
                );

        if (!folder) {
            setError(
                "The folder associated with this task could not be found.",
            );

            return;
        }

        setSelectedFolder(folder);
        setFolderFiles([]);
        setFolderFilesError("");

        setError("");
        setUploadSuccess(false);

        setCurrentView("folder");
    };

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
       Remove File
    ========================================================= */

    const handleRemoveFile = () => {
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value =
                "";
        }
    };

    /* =========================================================
       File Project ID
       
       Prefer file's own project ID.
       Fall back to selected task project.
    ========================================================= */

    const getFileProjectId = (
        file: TaskFile,
    ): number => {
        const fileProjectId =
            toNumberId(
                file.projectid ??
                file.project_id,
            );

        if (fileProjectId !== null) {
            return fileProjectId;
        }

        return (
            toNumberId(
                selectedTask?.project_id,
            ) ?? 0
        );
    };

    /* =========================================================
       File Folder ID
       
       Prefer file's own folder ID.
       Fall back to selected folder.
    ========================================================= */

    const getFileFolderId = (
        file: TaskFile,
    ): number => {
        const fileFolderId =
            toNumberId(
                file.fid ??
                file.folder_id,
            );

        if (fileFolderId !== null) {
            return fileFolderId;
        }

        return (
            toNumberId(
                selectedFolder?.fid,
            ) ?? 0
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
            toNumberId(file.pffid);

        if (
            projectId <= 0
        ) {
            setError(
                "Invalid project ID for this file.",
            );

            return;
        }

        if (
            folderId <= 0
        ) {
            setError(
                "Invalid folder ID for this file.",
            );

            return;
        }

        if (
            fileId === null
        ) {
            setError(
                "Invalid file ID.",
            );

            return;
        }

        try {
            setError("");
            setIsViewingFile(true);
            setViewingFile(file);

            if (viewingFileUrl) {
                URL.revokeObjectURL(
                    viewingFileUrl,
                );
            }

            setViewingFileUrl(null);

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
       Close Viewer
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
       Cleanup Viewer URL
    ========================================================= */

    useEffect(() => {
        return () => {
            if (viewingFileUrl) {
                URL.revokeObjectURL(
                    viewingFileUrl,
                );
            }
        };
    }, [viewingFileUrl]);

    /* =========================================================
       Download
    ========================================================= */

    const handleDownloadFile = async (
        file: TaskFile,
    ) => {
        const projectId =
            getFileProjectId(file);

        const folderId =
            getFileFolderId(file);

        const fileId =
            toNumberId(file.pffid);

        if (
            projectId <= 0
        ) {
            setError(
                "Invalid project ID for this file.",
            );

            return;
        }

        if (
            folderId <= 0
        ) {
            setError(
                "Invalid folder ID for this file.",
            );

            return;
        }

        if (
            fileId === null
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
       Refresh Files
    ========================================================= */

    const refreshFolderFiles =
        async () => {
            if (
                !selectedFolder ||
                !selectedTask
            ) {
                return;
            }

            try {
                setIsLoadingFolderFiles(
                    true,
                );

                setFolderFilesError("");

                const folderId =
                    toNumberId(
                        selectedFolder.fid,
                    );

                if (folderId === null) {
                    throw new Error(
                        "Invalid folder ID.",
                    );
                }

                const files =
                    await getFolderFiles(
                        folderId,
                    );

                const projectId =
                    toNumberId(
                        selectedTask.project_id,
                    );

                const projectFiles =
                    filterFilesForTaskProject(
                        files,
                        projectId,
                    );

                setFolderFiles(
                    projectFiles,
                );
            } catch (err) {
                console.error(
                    "Failed to refresh files:",
                    err,
                );

                setFolderFilesError(
                    err instanceof Error
                        ? err.message
                        : "Failed to refresh files.",
                );
            } finally {
                setIsLoadingFolderFiles(
                    false,
                );
            }
        };

    /* =========================================================
       Upload
    ========================================================= */

    const handleUpload = async () => {
        setError("");
        setUploadSuccess(false);

        if (
            !selectedTask ||
            !selectedFolder
        ) {
            setError(
                "Please open a folder first.",
            );

            return;
        }

        if (!selectedFile) {
            setError(
                "Please select a file.",
            );

            return;
        }

        const projectId =
            toNumberId(
                selectedTask.project_id,
            );

        const folderId =
            toNumberId(
                selectedFolder.fid,
            );

        if (
            projectId === null
        ) {
            setError(
                "Invalid project ID.",
            );

            return;
        }

        if (
            folderId === null
        ) {
            setError(
                "Invalid folder ID.",
            );

            return;
        }

        try {
            setIsUploading(true);

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

            await refreshFolderFiles();
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

                {/* Success */}

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
                            size={19}
                        />

                        <div>
                            <p className="font-semibold">
                                File uploaded
                                successfully.
                            </p>

                            <p className="text-xs">
                                The folder files have
                                been refreshed.
                            </p>
                        </div>
                    </div>
                )}

                {/* Error */}

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

                {/* Breadcrumb */}

                <div
                    className="
                        mb-5
                        flex
                        min-h-[42px]
                        flex-wrap
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        px-4
                        py-2
                        dark:border-gray-800
                        dark:bg-gray-900
                    "
                >
                    {currentView !==
                        "tasks" && (
                        <button
                            type="button"
                            onClick={
                                handleBack
                            }
                            className="
                                flex
                                items-center
                                gap-1.5
                                rounded-lg
                                px-2
                                py-1.5
                                text-sm
                                font-medium
                                text-gray-600
                                transition
                                hover:bg-gray-100
                                hover:text-gray-900
                                dark:text-gray-400
                                dark:hover:bg-gray-800
                                dark:hover:text-white
                            "
                        >
                            <ArrowLeft
                                size={16}
                            />
                            Back
                        </button>
                    )}

                    {/* Tasks */}

                    <button
                        type="button"
                        onClick={
                            goToTasks
                        }
                        className={`
                            text-sm
                            font-medium
                            transition
                            ${
                                currentView ===
                                "tasks"
                                    ? "text-sky-600 dark:text-sky-400"
                                    : "text-gray-600 hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
                            }
                        `}
                    >
                        My Tasks
                    </button>

                    {/* Task */}

                    {selectedTask && (
                        <>
                            <span className="text-gray-300 dark:text-gray-700">
                                /
                            </span>

                            <button
                                type="button"
                                onClick={
                                    goToProject
                                }
                                className={`
                                    max-w-[220px]
                                    truncate
                                    text-sm
                                    font-medium
                                    ${
                                        currentView ===
                                        "project"
                                            ? "text-sky-600 dark:text-sky-400"
                                            : "text-gray-600 hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
                                    }
                                `}
                                title={
                                    selectedTask.task_description ||
                                    selectedTask.task_type
                                }
                            >
                                {selectedTask.task_description ||
                                    selectedTask.task_type ||
                                    `Task ${selectedTask.task_id}`}
                            </button>
                        </>
                    )}

                    {/* Project */}

                    {selectedTask &&
                        currentView !==
                            "tasks" &&
                        currentView !==
                            "project" && (
                            <>
                                <span className="text-gray-300 dark:text-gray-700">
                                    /
                                </span>

                                <button
                                    type="button"
                                    onClick={
                                        goToProject
                                    }
                                    className="
                                        max-w-[220px]
                                        truncate
                                        text-sm
                                        font-medium
                                        text-gray-600
                                        hover:text-sky-600
                                        dark:text-gray-400
                                        dark:hover:text-sky-400
                                    "
                                    title={
                                        projectName
                                    }
                                >
                                    {projectName}
                                </button>
                            </>
                        )}

                    {/* Folder */}

                    {selectedFolder &&
                        currentView ===
                            "files" && (
                            <>
                                <span className="text-gray-300 dark:text-gray-700">
                                    /
                                </span>

                                <button
                                    type="button"
                                    onClick={
                                        goToFolder
                                    }
                                    className="
                                        max-w-[220px]
                                        truncate
                                        text-sm
                                        font-semibold
                                        text-sky-600
                                        hover:text-sky-700
                                        dark:text-sky-400
                                        dark:hover:text-sky-300
                                    "
                                    title={
                                        folderName
                                    }
                                >
                                    {
                                        folderName
                                    }
                                </button>
                            </>
                        )}
                </div>

                {/* Main Workspace */}

                <div
                    className={`
                        grid
                        grid-cols-1
                        gap-6
                        ${
                            currentView ===
                                "files" &&
                            selectedFolder
                                ? "lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
                                : ""
                        }
                    `}
                >
                    {/* Main */}

                    <div
                        className="
                            min-w-0
                            
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
                        {/* Header */}

                        <div
                            className="
                                mb-6
                                flex
                                items-start
                                justify-between
                                gap-4
                            "
                        >
                            <div>
                                <h2
                                    className="
                                        text-base
                                        font-semibold
                                        text-gray-900
                                        dark:text-white
                                    "
                                >
                                    {currentView ===
                                        "tasks" &&
                                        "My Tasks"}

                                    {currentView ===
                                        "project" &&
                                        projectName}

                                    {currentView ===
                                        "folder" &&
                                        folderName}

                                    {currentView ===
                                        "files" &&
                                        folderName}
                                </h2>

                                <p
                                    className="
                                        mt-1
                                        text-sm
                                        text-gray-500
                                        dark:text-gray-400
                                    "
                                >
                                    {currentView ===
                                        "tasks"}

                                    {currentView ===
                                        "project"}

                                    {currentView ===
                                        "folder"}

                                    {currentView ===
                                        "files" &&
                                        `${folderFiles.length} ${
                                            folderFiles.length ===
                                            1
                                                ? "file"
                                                : "files"
                                        }`}
                                </p>
                            </div>

                            {currentView ===
                                "files" &&
                                !isLoadingFolderFiles && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void refreshFolderFiles()
                                        }
                                        className="
                                            rounded-lg
                                            border
                                            border-gray-200
                                            px-3
                                            py-2
                                            text-xs
                                            font-medium
                                            text-gray-600
                                            hover:bg-gray-50
                                            dark:border-gray-700
                                            dark:text-gray-300
                                            dark:hover:bg-gray-800
                                        "
                                    >
                                        Refresh
                                    </button>
                                )}
                        </div>

                        {/* TASKS */}

                        {currentView ===
                            "tasks" && (
                            <>
                                {isLoadingTasks ? (
                                    <LoadingState text="Loading your tasks..." />
                                ) : loggedInUserId ===
                                    null ? (
                                    <EmptyState
                                        icon={
                                            <FileText
                                                size={
                                                    36
                                                }
                                            />
                                        }
                                        title="User not found"
                                        description="The logged-in user ID could not be determined."
                                    />
                                ) : userTasks.length ===
                                    0 ? (
                                    <EmptyState
                                        icon={
                                            <FileText
                                                size={
                                                    36
                                                }
                                            />
                                        }
                                        title="No tasks found"
                                        description={`No tasks are assigned to user ${loggedInUserId}.`}
                                    />
                                ) : (
                                    <div
                                        className="
                                            grid
                                            grid-cols-2
                                            gap-4
                                            sm:grid-cols-3
                                            md:grid-cols-6
                                            xl:grid-cols-8
                                        "
                                    >
                                        {userTasks.map(
                                            (
                                                task,
                                            ) => (
                                                <TaskCard
                                                    key={
                                                        task.task_id
                                                    }
                                                    task={
                                                        task
                                                    }
                                                    onClick={() =>
                                                        handleOpenTask(
                                                            task,
                                                        )
                                                    }
                                                />
                                            ),
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* PROJECT */}

                        {currentView ===
                            "project" && (
                            <>
                                {isLoadingProjects ? (
                                    <LoadingState text="Loading project..." />
                                ) : (
                                    <div
                                        className="
                                            grid
                                            grid-cols-2
                                            gap-4
                                            sm:grid-cols-3
                                            md:grid-cols-4
                                            xl:grid-cols-5
                                        "
                                    >
                                        <ProjectCard
                                            project={
                                                selectedProject ??
                                                taskProject
                                            }
                                            projectName={
                                                projectName
                                            }
                                            onClick={
                                                handleOpenProject
                                            }
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* FOLDER */}

                        {currentView ===
                            "folder" && (
                            <>
                                {isLoadingFolders ? (
                                    <LoadingState text="Loading folder..." />
                                ) : taskFolder ? (
                                    <div
                                        className="
                                            grid
                                            grid-cols-2
                                            gap-4
                                            sm:grid-cols-3
                                            md:grid-cols-4
                                            xl:grid-cols-5
                                        "
                                    >
                                        <FolderCard
                                            folder={
                                                taskFolder
                                            }
                                            onClick={
                                                handleOpenFolder
                                            }
                                        />
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={
                                            <Folder
                                                size={
                                                    36
                                                }
                                            />
                                        }
                                        title="Folder not found"
                                        description="The folder associated with this task could not be found."
                                    />
                                )}
                            </>
                        )}

                        {/* FILES */}

                        {currentView ===
                            "files" && (
                            <>
                                {isLoadingFolderFiles ? (
                                    <LoadingState text="Loading files..." />
                                ) : folderFilesError ? (
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
                                ) : folderFiles.length ===
                                    0 ? (
                                    <EmptyState
                                        icon={
                                            <File
                                                size={
                                                    36
                                                }
                                            />
                                        }
                                        title="This folder is empty"
                                        description="Upload a file using the panel on the right."
                                    />
                                ) : (
                                    <div
                                        className="
                                            grid
                                            grid-cols-2
                                            gap-4
                                            sm:grid-cols-3
                                            md:grid-cols-4
                                            xl:grid-cols-5
                                        "
                                    >
                                        {folderFiles.map(
                                            (
                                                file,
                                            ) => (
                                                <FileCard
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
                            </>
                        )}
                    </div>

                    {/* Upload Panel */}

                    {currentView ===
                        "files" &&
                        selectedFolder && (
                            <UploadPanel
                                selectedFile={
                                    selectedFile
                                }
                                fileInputRef={
                                    fileInputRef
                                }
                                isUploading={
                                    isUploading
                                }
                                folderName={
                                    folderName
                                }
                                projectName={
                                    projectName
                                }
                                onFileChange={
                                    handleFileChange
                                }
                                onRemoveFile={
                                    handleRemoveFile
                                }
                                onUpload={
                                    handleUpload
                                }
                            />
                        )}
                </div>
            </div>

            {/* Viewer */}

            {viewingFile && (
                <FileViewerModal
                    file={
                        viewingFile
                    }
                    fileUrl={
                        viewingFileUrl
                    }
                    isLoading={
                        isViewingFile
                    }
                    onClose={
                        handleCloseViewer
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

/* =========================================================
   Task Card
========================================================= */

interface TaskCardProps {
    task: Task;
    onClick: () => void;
}

function TaskCard({
    task,
    onClick,
}: TaskCardProps) {
    const taskName =
        task.task_description ||
        task.task_type ||
        `Task ${task.task_id}`;

    return (
        <button
            type="button"
            onClick={onClick}
            className="
                group
                min-w-0
                rounded-2xl
                border
                border-gray-200
                bg-gray-50
                p-2
                text-left
                transition
                hover:-translate-y-0.5
                hover:border-sky-300
                hover:bg-sky-50
                hover:shadow-md
                dark:border-gray-800
                dark:bg-gray-950
                dark:hover:border-sky-800
                dark:hover:bg-sky-950
            "
        >
            <div
                className="
                    flex
                    h-24
                    items-center
                    justify-center
                "
            >
                <div
                    className="
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center
                        rounded-2xl
                        bg-sky-100
                        text-sky-700
                        transition
                        group-hover:scale-105
                        dark:bg-sky-950
                        dark:text-sky-300
                    "
                >
                    <FileText
                        size={36}
                        strokeWidth={1.6}
                    />
                </div>
            </div>

            <div className="mt-3">
                <p
                    className="
                        truncate
                        text-sm
                        font-semibold
                        text-gray-900
                        dark:text-white
                    "
                    title={taskName}
                >
                    {taskName}
                </p>

                <p
                    className="
                        mt-1
                        truncate
                        text-xs
                        text-gray-500
                        dark:text-gray-400
                    "
                >
                    {task.task_type ||
                        "Task"}
                </p>
                 
            </div>
        </button>
    );
}

/* =========================================================
   Project Card
========================================================= */

interface ProjectCardProps {
    project: Project | null;
    projectName: string;
    onClick: () => void;
}

function ProjectCard({
    project,
    projectName,
    onClick,
}: ProjectCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="
                group
                min-w-0
                rounded-2xl
                border
                border-gray-200
                bg-gray-50
                p-4
                text-left
                transition
                hover:-translate-y-0.5
                hover:border-sky-300
                hover:bg-sky-50
                hover:shadow-md
                dark:border-gray-800
                dark:bg-gray-950
                dark:hover:border-sky-800
                dark:hover:bg-sky-950
            "
        >
            <div
                className="
                    flex
                    h-28
                    items-center
                    justify-center
                "
            >
                <div
                    className="
                        flex
                        h-20
                        w-20
                        items-center
                        justify-center
                        rounded-2xl
                        bg-amber-100
                        text-amber-600
                        transition
                        group-hover:scale-105
                        dark:bg-amber-950
                        dark:text-amber-300
                    "
                >
                    <Folder
                        size={48}
                        strokeWidth={1.5}
                    />
                </div>
            </div>

            <div className="mt-3">
                <p
                    className="
                        truncate
                        text-sm
                        font-semibold
                        text-gray-900
                        dark:text-white
                    "
                    title={projectName}
                >
                    {projectName}
                </p>

                <p
                    className="
                        mt-1
                        text-xs
                        text-gray-500
                        dark:text-gray-400
                    "
                >
                    {project
                        ? `Project ${project.project_id}`
                        : "Project"}
                </p>
            </div>
        </button>
    );
}

/* =========================================================
   Folder Card
========================================================= */

interface FolderCardProps {
    folder: ProjectFolder;
    onClick: () => void;
}

function FolderCard({
    folder,
    onClick,
}: FolderCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="
                group
                min-w-0
                rounded-2xl
                border
                border-gray-200
                bg-gray-50
                p-4
                text-left
                transition
                hover:-translate-y-0.5
                hover:border-sky-300
                hover:bg-sky-50
                hover:shadow-md
                dark:border-gray-800
                dark:bg-gray-950
                dark:hover:border-sky-800
                dark:hover:bg-sky-950
            "
        >
            <div
                className="
                    flex
                    h-28
                    items-center
                    justify-center
                "
            >
                <div
                    className="
                        flex
                        h-20
                        w-20
                        items-center
                        justify-center
                        rounded-2xl
                        bg-amber-100
                        text-amber-600
                        transition
                        group-hover:scale-105
                        dark:bg-amber-950
                        dark:text-amber-300
                    "
                >
                    <FolderOpen
                        size={48}
                        strokeWidth={1.5}
                    />
                </div>
            </div>

            <div className="mt-3">
                <p
                    className="
                        truncate
                        text-sm
                        font-semibold
                        text-gray-900
                        dark:text-white
                    "
                    title={folder.fname}
                >
                    {folder.fname}
                </p>

                <p
                    className="
                        mt-1
                        text-xs
                        text-gray-500
                        dark:text-gray-400
                    "
                >
                    Folder
                </p>
            </div>
        </button>
    );
}

/* =========================================================
   File Card
========================================================= */

interface FileCardProps {
    file: TaskFile;
    onView: (
        file: TaskFile,
    ) => void;
    onDownload: (
        file: TaskFile,
    ) => void;
}

function FileCard({
    file,
    onView,
    onDownload,
}: FileCardProps) {
    const mimeType =
        file.MIME?.toLowerCase() ||
        "";

    const filename =
        file.filename?.toLowerCase() ||
        "";

    const isImage =
        mimeType.startsWith(
            "image/",
        ) ||
        /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(
            filename,
        );

    const isPdf =
        mimeType.includes(
            "application/pdf",
        ) ||
        filename.endsWith(".pdf");

    const isVideo =
        mimeType.startsWith(
            "video/",
        );

    const isAudio =
        mimeType.startsWith(
            "audio/",
        );

    let Icon = File;

    if (isImage) {
        Icon = FileImage;
    } else if (isPdf) {
        Icon = FileText;
    } else if (isVideo) {
        Icon = FileVideo;
    } else if (isAudio) {
        Icon = FileAudio;
    } else if (
        mimeType.includes("word") ||
        /\.(doc|docx|txt|rtf)$/i.test(
            filename,
        )
    ) {
        Icon = FileText;
    }

    /*
     * File API may omit project/folder IDs.
     * The parent page already knows the selected
     * task and folder, so only pffid is required
     * for enabling the buttons.
     */
    const fileId =
        toNumberId(file.pffid);

    const canAccess =
        fileId !== null;

    return (
        <div
            className="
                group
                min-w-0
                rounded-2xl
                border
                border-gray-200
                bg-gray-50
                p-4
                transition
                hover:-translate-y-0.5
                hover:border-gray-300
                hover:shadow-md
                dark:border-gray-800
                dark:bg-gray-950
                dark:hover:border-gray-700
            "
        >
            <button
                type="button"
                onClick={() =>
                    canAccess &&
                    onView(file)
                }
                disabled={!canAccess}
                className="
                    block
                    w-full
                    text-left
                    disabled:cursor-not-allowed
                "
            >
                <div
                    className="
                        flex
                        h-28
                        items-center
                        justify-center
                    "
                >
                    <div
                        className="
                            flex
                            h-20
                            w-20
                            items-center
                            justify-center
                            rounded-2xl
                            bg-white
                            text-gray-500
                            transition
                            group-hover:scale-105
                            dark:bg-gray-900
                            dark:text-gray-400
                        "
                    >
                        <Icon
                            size={42}
                            strokeWidth={1.5}
                        />
                    </div>
                </div>

                <div className="mt-3">
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
                        {file.filename ||
                            "Unnamed file"}
                    </p>

                    <p
                        className="
                            mt-1
                            truncate
                            text-xs
                            text-gray-500
                            dark:text-gray-400
                        "
                    >
                        {formatFileSize(
                            Number(
                                file.filesize,
                            ),
                        )}
                    </p>
                </div>
            </button>

            <div
                className="
                    mt-3
                    flex
                    items-center
                    gap-2
                "
            >
                <button
                    type="button"
                    onClick={() =>
                        onView(file)
                    }
                    disabled={!canAccess}
                    className="
                        flex
                        flex-1
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        border
                        border-gray-200
                        bg-white
                        px-2
                        py-2
                        text-xs
                        font-medium
                        text-gray-700
                        hover:bg-gray-100
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                        dark:border-gray-700
                        dark:bg-gray-900
                        dark:text-gray-300
                        dark:hover:bg-gray-800
                    "
                >
                    <ExternalLink
                        size={13}
                    />

                    View
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onDownload(file)
                    }
                    disabled={!canAccess}
                    className="
                        flex
                        items-center
                        justify-center
                        rounded-lg
                        bg-sky-900
                        p-2
                        text-white
                        hover:bg-sky-800
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                        dark:bg-sky-200
                        dark:text-sky-950
                        dark:hover:bg-sky-300
                    "
                    title="Download"
                >
                    <Download
                        size={14}
                    />
                </button>
            </div>
        </div>
    );
}

/* =========================================================
   Upload Panel
========================================================= */

interface UploadPanelProps {
    selectedFile: File | null;
    fileInputRef: RefObject<
        HTMLInputElement | null
    >;
    isUploading: boolean;
    folderName: string;
    projectName: string;
    onFileChange: (
        event: ChangeEvent<HTMLInputElement>,
    ) => void;
    onRemoveFile: () => void;
    onUpload: () => void;
}

function UploadPanel({
    selectedFile,
    fileInputRef,
    isUploading,
    folderName,
    projectName,
    onFileChange,
    onRemoveFile,
    onUpload,
}: UploadPanelProps) {
    return (
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
            <div className="mb-6">
                <div
                    className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-xl
                        bg-sky-100
                        text-sky-700
                        dark:bg-sky-950
                        dark:text-sky-300
                    "
                >
                    <Upload
                        size={23}
                    />
                </div>

                <h2
                    className="
                        mt-4
                        text-base
                        font-semibold
                        text-gray-900
                        dark:text-white
                    "
                >
                    Upload Files
                </h2>

                <p
                    className="
                        mt-1
                        text-sm
                        text-gray-500
                        dark:text-gray-400
                    "
                >
                    Upload directly to the
                    folder you opened.
                </p>
            </div>

            {/* Destination */}

            <div
                className="
                    mb-5
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
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wider
                        text-sky-600
                        dark:text-sky-400
                    "
                >
                    Upload destination
                </p>

                <div
                    className="
                        mt-3
                        flex
                        items-center
                        gap-3
                    "
                >
                    <Folder
                        size={24}
                        className="
                            shrink-0
                            text-amber-500
                        "
                    />

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
                                folderName
                            }
                        >
                            {folderName}
                        </p>

                        <p
                            className="
                                mt-0.5
                                truncate
                                text-xs
                                text-gray-500
                                dark:text-gray-400
                            "
                            title={
                                projectName
                            }
                        >
                            {projectName}
                        </p>
                    </div>
                </div>
            </div>

            {/* Select File */}

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
                            min-h-[190px]
                            w-full
                            flex-col
                            items-center
                            justify-center
                            rounded-xl
                            border-2
                            border-dashed
                            border-gray-300
                            bg-gray-50
                            px-5
                            transition
                            hover:border-sky-400
                            hover:bg-sky-50
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                            dark:border-gray-700
                            dark:bg-gray-950
                            dark:hover:border-sky-700
                            dark:hover:bg-sky-950
                        "
                    >
                        <Upload
                            size={28}
                            className="
                                text-gray-400
                                dark:text-gray-500
                            "
                        />

                        <p
                            className="
                                mt-3
                                text-sm
                                font-semibold
                                text-gray-800
                                dark:text-gray-200
                            "
                        >
                            Select a file
                        </p>

                        <p
                            className="
                                mt-1
                                text-center
                                text-xs
                                text-gray-500
                                dark:text-gray-400
                            "
                        >
                            Click here to browse
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
                            onFileChange
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
                    <div
                        className="
                            flex
                            items-center
                            gap-3
                        "
                    >
                        <div
                            className="
                                flex
                                h-11
                                w-11
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
                            <FileText
                                size={21}
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
                                title={
                                    selectedFile.name
                                }
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
                                onRemoveFile
                            }
                            disabled={
                                isUploading
                            }
                            className="
                                rounded-lg
                                p-2
                                text-gray-400
                                hover:bg-red-50
                                hover:text-red-600
                                disabled:opacity-50
                                dark:hover:bg-red-950
                                dark:hover:text-red-400
                            "
                        >
                            <X
                                size={17}
                            />
                        </button>
                    </div>
                </div>
            )}

            {/* Upload */}

            <button
                type="button"
                onClick={onUpload}
                disabled={
                    isUploading ||
                    !selectedFile
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
    );
}

/* =========================================================
   Loading
========================================================= */

function LoadingState({
    text,
}: {
    text: string;
}) {
    return (
        <div
            className="
                flex
                min-h-[360px]
                flex-col
                items-center
                justify-center
                rounded-xl
                border
                border-dashed
                border-gray-300
                bg-gray-50
                dark:border-gray-700
                dark:bg-gray-950
            "
        >
            <Loader2
                size={30}
                className="
                    animate-spin
                    text-gray-400
                    dark:text-gray-500
                "
            />

            <p
                className="
                    mt-3
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                "
            >
                {text}
            </p>
        </div>
    );
}

/* =========================================================
   Empty
========================================================= */

function EmptyState({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div
            className="
                flex
                min-h-[360px]
                flex-col
                items-center
                justify-center
                rounded-xl
                border
                border-dashed
                border-gray-300
                bg-gray-50
                px-6
                text-center
                dark:border-gray-700
                dark:bg-gray-950
            "
        >
            <div
                className="
                    text-gray-400
                    dark:text-gray-500
                "
            >
                {icon}
            </div>

            <p
                className="
                    mt-4
                    text-sm
                    font-semibold
                    text-gray-700
                    dark:text-gray-300
                "
            >
                {title}
            </p>

            <p
                className="
                    mt-1
                    max-w-sm
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                "
            >
                {description}
            </p>
        </div>
    );
}

/* =========================================================
   File Viewer
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
                                hover:bg-sky-800
                                disabled:opacity-40
                                dark:bg-sky-200
                                dark:text-sky-950
                            "
                        >
                            <Download
                                size={14}
                            />
                            Download
                        </button>

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            className="
                                rounded-lg
                                p-2
                                text-gray-400
                                hover:bg-gray-100
                                hover:text-gray-700
                                dark:hover:bg-gray-800
                                dark:hover:text-gray-200
                            "
                        >
                            <X
                                size={19}
                            />
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
                    ) : !fileUrl ? (
                        <PreviewUnavailable
                            onDownload={
                                onDownload
                            }
                        />
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
                            onDownload={
                                onDownload
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   Preview Unavailable
========================================================= */

function PreviewUnavailable({
    onDownload,
}: {
    onDownload: () => void;
}) {
    return (
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
                <File
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
                    Preview is not available
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
                    "
                >
                    <Download
                        size={14}
                    />
                    Download File
                </button>
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