import {
    useEffect,
    useState,
} from "react";

import type {
    ChangeEvent,
} from "react";

import {
    ArrowLeft,
    CheckCircle2,
    Download,
    File,
    Loader2,
    Upload,
    X,
} from "lucide-react";

import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    downloadFolderFile,
    getFolderFiles,
    getTask,
    uploadFileToFolder,
} from "../../api/tasks";

import type {
    TaskFile,
} from "../../api/tasks";

import type {
    Task,
} from "../../types/task";

import TaskForm from "../../components/tasks/TaskForm";

/* =========================================================
 * Task Files
 * ========================================================= */

interface TaskFilesProps {
    task: Task;
}

function TaskFiles({
    task,
}: TaskFilesProps) {
    const [
        selectedFile,
        setSelectedFile,
    ] = useState<File | null>(null);

    const [
        files,
        setFiles,
    ] = useState<TaskFile[]>([]);

    const [
        isLoadingFiles,
        setIsLoadingFiles,
    ] = useState(false);

    const [
        isUploading,
        setIsUploading,
    ] = useState(false);

    const [
        downloadingFileId,
        setDownloadingFileId,
    ] = useState<number | null>(null);

    const [
        uploadSuccess,
        setUploadSuccess,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        fileLoadError,
        setFileLoadError,
    ] = useState("");

    /* =====================================================
     * FORMAT FILE SIZE
     * ===================================================== */

    const formatFileSize = (
        bytes: number,
    ): string => {
        if (!bytes || bytes <= 0) {
            return "0 Bytes";
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
        ).toFixed(2)} ${units[index]}`;
    };

    /* =====================================================
     * LOAD FOLDER FILES
     * ===================================================== */

    useEffect(() => {
        const folderId = task.folder_id;

        if (
            folderId === null ||
            folderId === undefined
        ) {
            return;
        }

        let cancelled = false;

        const loadFiles = async () => {
            try {
                setIsLoadingFiles(true);
                setFileLoadError("");

                const folderFiles =
                    await getFolderFiles(
                        folderId,
                    );

                if (cancelled) {
                    return;
                }

                setFiles(folderFiles);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                setFileLoadError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load attached files.",
                );
            } finally {
                if (!cancelled) {
                    setIsLoadingFiles(false);
                }
            }
        };

        void loadFiles();

        return () => {
            cancelled = true;
        };
    }, [task.folder_id]);
    /* =====================================================
     * SELECT FILE
     * ===================================================== */

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

        /*
         * Allow selecting the same file
         * again later.
         */
        event.target.value = "";
    };

    /* =====================================================
     * UPLOAD FILE
     * ===================================================== */

    const handleUpload = async () => {
        if (!selectedFile) {
            setError(
                "Please select a file first.",
            );
            return;
        }

        if (
            task.project_id === null ||
            task.project_id === undefined
        ) {
            setError(
                "This task does not have a project assigned.",
            );
            return;
        }

        if (
            task.folder_id === null ||
            task.folder_id === undefined
        ) {
            setError(
                "This task does not have a folder assigned.",
            );
            return;
        }

        try {
            setIsUploading(true);
            setUploadSuccess(false);
            setError("");
            setFileLoadError("");

            /*
             * New backend API:
             *
             * POST
             * /api/{project_id}/folders/{folder_id}/files
             *
             * multipart/form-data:
             * files = selectedFile
             *
             * No uploaded_by field is required.
             */
            await uploadFileToFolder(
                task.project_id,
                task.folder_id,
                selectedFile,
            );

            /*
             * Reload the files from the backend
             * after a successful upload.
             */
            const refreshedFiles =
                await getFolderFiles(
                    task.folder_id,
                );

            setFiles(refreshedFiles);
            setSelectedFile(null);
            setUploadSuccess(true);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to upload file.",
            );
        } finally {
            setIsUploading(false);
        }
    };

    /* =====================================================
     * DOWNLOAD FILE
     * ===================================================== */

    const handleDownload = async (
        file: TaskFile,
    ) => {
        if (
            task.project_id === null ||
            task.project_id === undefined
        ) {
            setError(
                "This task does not have a project assigned.",
            );
            return;
        }

        if (
            task.folder_id === null ||
            task.folder_id === undefined
        ) {
            setError(
                "This task does not have a folder assigned.",
            );
            return;
        }

        if (
            file.pffid === null ||
            file.pffid === undefined
        ) {
            setError(
                "File ID is missing. Unable to download this file.",
            );
            return;
        }

        try {
            setDownloadingFileId(
                file.pffid,
            );

            setError("");

            const blob =
                await downloadFolderFile(
                    task.project_id,
                    task.folder_id,
                    file.pffid,
                );

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                file.filename ||
                `file-${file.pffid}`;

            document.body.appendChild(
                link,
            );

            link.click();

            link.remove();

            /*
             * Give the browser a moment to
             * start the download before
             * releasing the object URL.
             */
            window.setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to download file.",
            );
        } finally {
            setDownloadingFileId(null);
        }
    };

    /* =====================================================
     * RENDER
     * ===================================================== */

    return (
        <div className="flex min-h-full flex-col">
            {/* =================================================
             * HEADER
             * ================================================= */}

            <div
                className="
                    border-b
                    border-gray-200
                    px-6
                    py-5
                    dark:border-gray-800
                "
            >
                <div className="flex items-center gap-3">
                    <div
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            bg-sky-50
                            text-sky-700
                            dark:bg-sky-950
                            dark:text-sky-400
                        "
                    >
                        <File
                            size={19}
                            strokeWidth={1.8}
                        />
                    </div>

                    <div>
                        <h2
                            className="
                                text-sm
                                font-semibold
                                text-gray-900
                                dark:text-white
                            "
                        >
                            Task Files
                        </h2>

                        <p
                            className="
                                mt-0.5
                                text-xs
                                text-gray-500
                                dark:text-gray-400
                            "
                        >
                            Attach files to this task.
                        </p>
                    </div>
                </div>
            </div>

            {/* =================================================
             * CONTENT
             * ================================================= */}

            <div
                className="
                    flex
                    flex-1
                    flex-col
                    p-6
                "
            >
                {/* =================================================
                 * UPLOAD AREA
                 * ================================================= */}

                <label
                    className="
                        flex
                        min-h-[190px]
                        cursor-pointer
                        flex-col
                        items-center
                        justify-center
                        rounded-xl
                        border-2
                        border-dashed
                        border-gray-300
                        bg-gray-50
                        px-5
                        text-center
                        transition
                        hover:border-sky-400
                        hover:bg-sky-50
                        dark:border-gray-700
                        dark:bg-gray-950
                        dark:hover:border-sky-600
                        dark:hover:bg-gray-900
                    "
                >
                    <input
                        type="file"
                        className="hidden"
                        onChange={
                            handleFileChange
                        }
                        disabled={
                            isUploading
                        }
                    />

                    <div
                        className="
                            mb-3
                            flex
                            h-12
                            w-12
                            items-center
                            justify-center
                            rounded-full
                            bg-white
                            text-sky-600
                            shadow-sm
                            dark:bg-gray-900
                            dark:text-sky-400
                        "
                    >
                        <Upload
                            size={22}
                            strokeWidth={1.7}
                        />
                    </div>

                    <p
                        className="
                            text-sm
                            font-medium
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
                        Select a file from your computer
                    </p>
                </label>

                {/* =================================================
                 * SELECTED FILE
                 * ================================================= */}

                {selectedFile && (
                    <div className="mt-4">
                        <div
                            className="
                                flex
                                items-center
                                gap-3
                                rounded-lg
                                border
                                border-gray-200
                                bg-gray-50
                                p-3
                                dark:border-gray-700
                                dark:bg-gray-950
                            "
                        >
                            <div
                                className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    bg-white
                                    text-sky-600
                                    shadow-sm
                                    dark:bg-gray-900
                                    dark:text-sky-400
                                "
                            >
                                <File size={18} />
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
                                >
                                    {
                                        selectedFile.name
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
                                    {formatFileSize(
                                        selectedFile.size,
                                    )}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedFile(
                                        null,
                                    )
                                }
                                disabled={
                                    isUploading
                                }
                                className="
                                    rounded-lg
                                    p-1.5
                                    text-gray-400
                                    transition
                                    hover:bg-gray-200
                                    hover:text-red-500
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                    dark:hover:bg-gray-800
                                    dark:hover:text-red-400
                                "
                                aria-label="Remove selected file"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={
                                handleUpload
                            }
                            disabled={
                                isUploading
                            }
                            className="
                                mt-3
                                flex
                                w-full
                                items-center
                                justify-center
                                gap-2
                                rounded-lg
                                bg-sky-900
                                px-4
                                py-2.5
                                text-sm
                                font-medium
                                text-white
                                transition
                                hover:bg-sky-800
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                                dark:bg-sky-700
                                dark:hover:bg-sky-600
                            "
                        >
                            {isUploading ? (
                                <>
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload
                                        size={16}
                                    />
                                    Upload File
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* =================================================
                 * SUCCESS
                 * ================================================= */}

                {uploadSuccess && (
                    <div
                        className="
                            mt-4
                            flex
                            items-center
                            gap-2
                            rounded-lg
                            border
                            border-green-200
                            bg-green-50
                            px-4
                            py-3
                            text-xs
                            text-green-700
                            dark:border-green-900
                            dark:bg-green-950
                            dark:text-green-400
                        "
                    >
                        <CheckCircle2
                            size={16}
                        />

                        File uploaded successfully.
                    </div>
                )}

                {/* =================================================
                 * ERROR
                 * ================================================= */}

                {error && (
                    <div
                        className="
                            mt-4
                            rounded-lg
                            border
                            border-red-200
                            bg-red-50
                            px-4
                            py-3
                            text-xs
                            text-red-700
                            dark:border-red-900
                            dark:bg-red-950
                            dark:text-red-400
                        "
                    >
                        {error}
                    </div>
                )}

                {/* =================================================
                 * ATTACHED FILES
                 * ================================================= */}

                <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                        <h3
                            className="
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-gray-500
                                dark:text-gray-400
                            "
                        >
                            Attached Files
                        </h3>

                        <span
                            className="
                                rounded-full
                                bg-gray-100
                                px-2
                                py-0.5
                                text-[11px]
                                font-medium
                                text-gray-600
                                dark:bg-gray-800
                                dark:text-gray-300
                            "
                        >
                            {files.length}
                        </span>
                    </div>

                    {/* File load error */}

                    {fileLoadError && (
                        <div
                            className="
                                mb-3
                                rounded-lg
                                border
                                border-red-200
                                bg-red-50
                                px-4
                                py-3
                                text-xs
                                text-red-700
                                dark:border-red-900
                                dark:bg-red-950
                                dark:text-red-400
                            "
                        >
                            {fileLoadError}
                        </div>
                    )}

                    {/* Loading */}

                    {task.folder_id === null ||
                        task.folder_id === undefined ? (
                        <div
                            className="
            rounded-lg
            border
            border-gray-200
            px-4
            py-6
            text-center
            dark:border-gray-800
        "
                        >
                            <File
                                size={24}
                                className="
                mx-auto
                text-gray-300
                dark:text-gray-600
            "
                            />

                            <p
                                className="
                mt-2
                text-xs
                text-gray-500
                dark:text-gray-400
            "
                            >
                                No folder is assigned to this task.
                            </p>
                        </div>
                    ) : isLoadingFiles ? (
                        <div
                            className="
                                rounded-lg
                                border
                                border-gray-200
                                px-4
                                py-8
                                text-center
                                dark:border-gray-800
                            "
                        >
                            <Loader2
                                size={22}
                                className="
                                    mx-auto
                                    animate-spin
                                    text-gray-400
                                "
                            />

                            <p
                                className="
                                    mt-2
                                    text-xs
                                    text-gray-500
                                    dark:text-gray-400
                                "
                            >
                                Loading files...
                            </p>
                        </div>
                    ) : files.length === 0 ? (
                        <div
                            className="
                                rounded-lg
                                border
                                border-gray-200
                                px-4
                                py-6
                                text-center
                                dark:border-gray-800
                            "
                        >
                            <File
                                size={24}
                                className="
                                    mx-auto
                                    text-gray-300
                                    dark:text-gray-600
                                "
                            />

                            <p
                                className="
                                    mt-2
                                    text-xs
                                    text-gray-500
                                    dark:text-gray-400
                                "
                            >
                                No files attached to this
                                task.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {files.map(
                                (file) => {
                                    const isDownloading =
                                        downloadingFileId ===
                                        file.pffid;

                                    return (
                                        <div
                                            key={
                                                file.pffid
                                            }
                                            className="
                                                flex
                                                items-center
                                                gap-3
                                                rounded-lg
                                                border
                                                border-gray-200
                                                bg-white
                                                p-3
                                                dark:border-gray-800
                                                dark:bg-gray-900
                                            "
                                        >
                                            <div
                                                className="
                                                    flex
                                                    h-9
                                                    w-9
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-lg
                                                    bg-gray-100
                                                    text-gray-500
                                                    dark:bg-gray-800
                                                    dark:text-gray-400
                                                "
                                            >
                                                <File
                                                    size={17}
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className="
                                                        truncate
                                                        text-sm
                                                        font-medium
                                                        text-gray-800
                                                        dark:text-gray-200
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
                                                        text-[11px]
                                                        text-gray-500
                                                        dark:text-gray-400
                                                    "
                                                >
                                                    {formatFileSize(
                                                        file.filesize,
                                                    )}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleDownload(
                                                        file,
                                                    )
                                                }
                                                disabled={
                                                    isDownloading
                                                }
                                                className="
                                                    flex
                                                    shrink-0
                                                    items-center
                                                    gap-1.5
                                                    rounded-lg
                                                    border
                                                    border-gray-200
                                                    px-2.5
                                                    py-1.5
                                                    text-xs
                                                    font-medium
                                                    text-gray-600
                                                    transition
                                                    hover:border-sky-300
                                                    hover:bg-sky-50
                                                    hover:text-sky-700
                                                    disabled:cursor-not-allowed
                                                    disabled:opacity-50
                                                    dark:border-gray-700
                                                    dark:text-gray-300
                                                    dark:hover:border-sky-700
                                                    dark:hover:bg-sky-950
                                                    dark:hover:text-sky-400
                                                "
                                                title="Download file"
                                            >
                                                {isDownloading ? (
                                                    <Loader2
                                                        size={14}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Download
                                                        size={14}
                                                    />
                                                )}

                                                {isDownloading
                                                    ? "Downloading..."
                                                    : "Download"}
                                            </button>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================================================
 * Edit Task Page
 * ========================================================= */

function EditTaskPage() {
    const {
        taskId,
    } = useParams();

    const navigate =
        useNavigate();

    const location =
        useLocation();

    const existingTask =
        location.state?.task as
        | Task
        | undefined;

    const [
        task,
        setTask,
    ] = useState<Task | null>(
        existingTask ?? null,
    );

    const [
        loading,
        setLoading,
    ] = useState(
        !existingTask,
    );

    const [
        error,
        setError,
    ] = useState("");

    /* =====================================================
     * LOAD TASK
     * ===================================================== */

    useEffect(() => {
        if (!taskId || existingTask) {
            return;
        }

        let cancelled = false;

        const loadTask = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await getTask(
                        Number(taskId),
                    );

                if (cancelled) {
                    return;
                }

                setTask(response);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load task.",
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadTask();

        return () => {
            cancelled = true;
        };
    }, [
        taskId,
        existingTask,
    ]);

    /* =====================================================
     * MISSING TASK ID
     * ===================================================== */

    if (!taskId) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
                <div className="mx-auto max-w-3xl">
                    <div
                        className="
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            p-5
                            text-sm
                            text-red-700
                            dark:border-red-900
                            dark:bg-red-950
                            dark:text-red-300
                        "
                    >
                        Task ID is missing.
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/tasks",
                            )
                        }
                        className="
                            mt-4
                            flex
                            items-center
                            gap-2
                            rounded-lg
                            border
                            border-gray-300
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-gray-700
                            dark:border-gray-700
                            dark:text-gray-300
                        "
                    >
                        <ArrowLeft size={16} />
                        Back to Tasks
                    </button>
                </div>
            </div>
        );
    }

    /* =====================================================
     * LOADING
     * ===================================================== */

    if (loading) {
        return (
            <div
                className="
                    flex
                    min-h-screen
                    items-center
                    justify-center
                    bg-gray-50
                    dark:bg-gray-950
                "
            >
                <div className="text-center">
                    <Loader2
                        size={30}
                        className="
                            mx-auto
                            animate-spin
                            text-gray-400
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
                        Loading task...
                    </p>
                </div>
            </div>
        );
    }

    /* =====================================================
     * ERROR
     * ===================================================== */

    if (error || !task) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
                <div className="mx-auto w-full">
                    <div
                        className="
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            p-5
                            text-sm
                            text-red-700
                            dark:border-red-900
                            dark:bg-red-950
                            dark:text-red-300
                        "
                    >
                        {error ||
                            "Task not found."}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/tasks",
                            )
                        }
                        className="
                            mt-4
                            flex
                            items-center
                            gap-2
                            rounded-lg
                            border
                            border-gray-300
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-gray-700
                            dark:border-gray-700
                            dark:text-gray-300
                        "
                    >
                        <ArrowLeft size={16} />
                        Back to Tasks
                    </button>
                </div>
            </div>
        );
    }

    /* =====================================================
     * PAGE
     * ===================================================== */

    return (
        <div
            className="
                min-h-screen
                bg-gray-50
                p-6
                dark:bg-gray-950
            "
        >
            <div className="mx-auto">
                {/* Header */}

                <div
                    className="
                        mb-6
                        flex
                        items-center
                        gap-3
                    "
                >
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/tasks",
                            )
                        }
                        className="
                            rounded-lg
                            p-2
                            text-gray-500
                            transition
                            hover:bg-gray-100
                            dark:hover:bg-gray-800
                        "
                    >
                        <ArrowLeft
                            size={19}
                        />
                    </button>

                    <div>
                        <h1
                            className="
                                text-xl
                                font-semibold
                                text-gray-900
                                dark:text-white
                            "
                        >
                            Update Task
                        </h1>

                        <p
                            className="
                                mt-1
                                text-xs
                                text-gray-500
                                dark:text-gray-400
                            "
                        >
                            Update task information
                            and manage its files.
                        </p>
                    </div>
                </div>

                {/* Unified workspace */}

                <div
                    className="
                        overflow-hidden
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        shadow-sm
                        dark:border-gray-800
                        dark:bg-gray-900
                    "
                >
                    <div
                        className="
                            grid
                            grid-cols-1
                            items-stretch
                            xl:grid-cols-[minmax(0,1fr)_380px]
                        "
                    >
                        {/* Task Information */}

                        <div className="min-w-0">
                            <div
                                className="
                                    border-b
                                    border-gray-200
                                    px-6
                                    py-5
                                    dark:border-gray-800
                                    xl:border-b-0
                                "
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="
                                            flex
                                            h-9
                                            w-9
                                            items-center
                                            justify-center
                                            rounded-lg
                                            bg-gray-100
                                            text-gray-600
                                            dark:bg-gray-800
                                            dark:text-gray-300
                                        "
                                    >
                                        <File
                                            size={19}
                                        />
                                    </div>

                                    <div>
                                        <h2
                                            className="
                                                text-sm
                                                font-semibold
                                                text-gray-900
                                                dark:text-white
                                            "
                                        >
                                            Task Information
                                        </h2>

                                        <p
                                            className="
                                                mt-0.5
                                                text-xs
                                                text-gray-500
                                                dark:text-gray-400
                                            "
                                        >
                                            Update the
                                            details of
                                            this task.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <TaskForm
                                task={task}
                                onCancel={() =>
                                    navigate(
                                        "/tasks",
                                    )
                                }
                                onSuccess={() =>
                                    navigate(
                                        "/tasks",
                                    )
                                }
                            />
                        </div>

                        {/* Task Files */}

                        <div
                            className="
                                border-t
                                border-gray-200
                                xl:border-l
                                xl:border-t-0
                                dark:border-gray-800
                            "
                        >
                            <TaskFiles
                                task={task}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditTaskPage;
