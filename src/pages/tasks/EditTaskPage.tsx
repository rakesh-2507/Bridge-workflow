import {
    useEffect,
    useState,
} from "react";

import {
    ArrowLeft,
    CheckCircle2,
    File,
    Loader2,
    Trash2,
    Upload,
    X,
} from "lucide-react";

import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getTask,
} from "../../api/tasks";

import type { Task } from "../../types/task";

import TaskForm from "../../components/tasks/TaskForm";

interface TaskFile {
    id: number;
    name: string;
    size: number;
    type: string;
}

/*
 * Dummy files for now.
 *
 * Later these can come from your API using task.task_id.
 */
const dummyTaskFiles: TaskFile[] = [
    {
        id: 1,
        name: "project-document.pdf",
        size: 2457600,
        type: "application/pdf",
    },
    {
        id: 2,
        name: "reference-image.png",
        size: 1048576,
        type: "image/png",
    },
];

function TaskFiles({
    task,
}: {
    task: Task;
}) {
    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [files, setFiles] =
        useState<TaskFile[]>(
            dummyTaskFiles
        );

    const [isUploading, setIsUploading] =
        useState(false);

    const [uploadSuccess, setUploadSuccess] =
        useState(false);

    const [error, setError] =
        useState("");

    const formatFileSize = (
        bytes: number
    ) => {
        if (bytes === 0) {
            return "0 Bytes";
        }

        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB",
        ];

        const index = Math.floor(
            Math.log(bytes) /
                Math.log(1024)
        );

        return `${(
            bytes /
            Math.pow(1024, index)
        ).toFixed(2)} ${units[index]}`;
    };

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
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
         * Allow selecting the same file again.
         */
        event.target.value = "";
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError(
                "Please select a file first."
            );
            return;
        }

        try {
            setIsUploading(true);
            setUploadSuccess(false);
            setError("");

            /*
             * Dummy upload.
             *
             * Later replace this with your API call
             * and pass task.task_id.
             */
            await new Promise((resolve) =>
                setTimeout(resolve, 1000)
            );

            const newFile: TaskFile = {
                id:
                    Date.now(),
                name: selectedFile.name,
                size: selectedFile.size,
                type: selectedFile.type,
            };

            setFiles((currentFiles) => [
                ...currentFiles,
                newFile,
            ]);

            console.log(
                "Uploading file for task:",
                task.task_id,
                selectedFile
            );

            setSelectedFile(null);
            setUploadSuccess(true);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to upload file."
            );
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveFile = (
        fileId: number
    ) => {
        setFiles((currentFiles) =>
            currentFiles.filter(
                (file) =>
                    file.id !== fileId
            )
        );
    };

    return (
        <div className="flex min-h-full flex-col">
            {/* Section Header */}
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
                            Attach files to this
                            task.
                        </p>
                    </div>
                </div>
            </div>

            {/* Files Content */}
            <div
                className="
                    flex
                    flex-1
                    flex-col
                    p-6
                "
            >
                {/* Upload Area */}
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
                        Select a file from your
                        computer
                    </p>
                </label>

                {/* Selected File */}
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
                                <File
                                    size={18}
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
                                        selectedFile.size
                                    )}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedFile(
                                        null
                                    )
                                }
                                className="
                                    rounded-lg
                                    p-1.5
                                    text-gray-400
                                    transition
                                    hover:bg-gray-200
                                    hover:text-red-500
                                    dark:hover:bg-gray-800
                                    dark:hover:text-red-400
                                "
                                aria-label="Remove selected file"
                            >
                                <X
                                    size={16}
                                />
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

                {/* Success Message */}
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

                        File uploaded
                        successfully.
                    </div>
                )}

                {/* Error */}
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

                {/* Existing Files */}
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

                    {files.length === 0 ? (
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
                                No files attached
                                to this task.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {files.map(
                                (file) => (
                                    <div
                                        key={
                                            file.id
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
                                                size={
                                                    17
                                                }
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
                                            >
                                                {
                                                    file.name
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
                                                    file.size
                                                )}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveFile(
                                                    file.id
                                                )
                                            }
                                            className="
                                                rounded-lg
                                                p-1.5
                                                text-gray-400
                                                transition
                                                hover:bg-red-50
                                                hover:text-red-500
                                                dark:hover:bg-red-950
                                                dark:hover:text-red-400
                                            "
                                            aria-label={`Delete ${file.name}`}
                                        >
                                            <Trash2
                                                size={
                                                    16
                                                }
                                            />
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function EditTaskPage() {
    const {
        taskId,
    } = useParams();

    const navigate = useNavigate();

    const location = useLocation();

    const existingTask =
        location.state?.task as
            | Task
            | undefined;

    const [task, setTask] =
        useState<Task | null>(
            existingTask ?? null
        );

    const [loading, setLoading] =
        useState(!existingTask);

    const [error, setError] =
        useState("");

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
                        Number(taskId)
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
                        : "Failed to load task."
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
                                "/tasks"
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
                        "
                    >
                        Loading task...
                    </p>
                </div>
            </div>
        );
    }

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
                                "/tasks"
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
                                "/tasks"
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
                            Update task
                            information and
                            manage its files.
                        </p>
                    </div>
                </div>

                {/* Unified Update Task Workspace */}
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
                        <div
                            className="
                                min-w-0
                            "
                        >
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
                                            size={
                                                19
                                            }
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
                                            Task
                                            Information
                                        </h2>

                                        <p
                                            className="
                                                mt-0.5
                                                text-xs
                                                text-gray-500
                                                dark:text-gray-400
                                            "
                                        >
                                            Update
                                            the
                                            details
                                            of this
                                            task.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <TaskForm
                                task={task}
                                onCancel={() =>
                                    navigate(
                                        "/tasks"
                                    )
                                }
                                onSuccess={() =>
                                    navigate(
                                        "/tasks"
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