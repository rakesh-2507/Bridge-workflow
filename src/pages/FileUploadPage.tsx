import {
    CheckCircle2,
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
    uploadFileToFolder,
} from "../api/tasks";

// --------------------------------------------------
// Component
// --------------------------------------------------

function FileUploadPage() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // --------------------------------------------------
    // Current User
    // --------------------------------------------------

    const currentUserId = useMemo(() => {
        try {
            const storedUser = localStorage.getItem("login_user");

            if (!storedUser) {
                return null;
            }

            const user = JSON.parse(storedUser) as Record<
                string,
                unknown
            >;

            const userId =
                user.uid ??
                user.user_id ??
                user.id;

            if (
                typeof userId === "number" &&
                Number.isInteger(userId)
            ) {
                return userId;
            }

            if (
                typeof userId === "string" &&
                userId.trim() !== ""
            ) {
                const parsedId = Number(userId);

                return Number.isInteger(parsedId)
                    ? parsedId
                    : null;
            }

            return null;
        } catch (err) {
            console.error(
                "Failed to read logged-in user:",
                err
            );

            return null;
        }
    }, []);

    // --------------------------------------------------
    // Data
    // --------------------------------------------------

    const [projects, setProjects] = useState<Project[]>([]);
    const [folders, setFolders] = useState<ProjectFolder[]>([]);

    // --------------------------------------------------
    // Loading
    // --------------------------------------------------

    const [isLoadingProjects, setIsLoadingProjects] =
        useState(false);

    const [isLoadingFolders, setIsLoadingFolders] =
        useState(false);

    const [isUploading, setIsUploading] = useState(false);

    // --------------------------------------------------
    // Selection
    // --------------------------------------------------

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [selectedProjectId, setSelectedProjectId] =
        useState<number | "">("");

    const [selectedFolderId, setSelectedFolderId] =
        useState<number | "">("");

    // --------------------------------------------------
    // Messages
    // --------------------------------------------------

    const [uploadSuccess, setUploadSuccess] =
        useState(false);

    const [error, setError] = useState("");

    // --------------------------------------------------
    // Load Projects and Folders
    // --------------------------------------------------

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
                    projectsResponse?.projects ?? []
                );

                setFolders(
                    foldersResponse?.folders ?? []
                );
            } catch (err) {
                if (!isMounted) {
                    return;
                }

                console.error(
                    "Failed to load upload data:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load projects and folders."
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

    // --------------------------------------------------
    // Selected Project
    // --------------------------------------------------

    const selectedProject = useMemo(() => {
        if (selectedProjectId === "") {
            return undefined;
        }

        return projects.find(
            (project) =>
                Number(project.project_id) ===
                Number(selectedProjectId)
        );
    }, [
        projects,
        selectedProjectId,
    ]);

    // --------------------------------------------------
    // Folders for Selected Project
    //
    // IMPORTANT:
    // folder.pid = parent folder ID
    // folder.tid = task/template/type ID
    //
    // Project also contains tid.
    //
    // Therefore folders are matched using:
    // project.tid === folder.tid
    //
    // Only pid === null folders are shown here
    // because they are top-level folders.
    // --------------------------------------------------

    const availableFolders = useMemo(() => {
        if (!selectedProject) {
            return [];
        }

        const projectTid = Number(
            selectedProject.tid
        );

        if (!Number.isInteger(projectTid)) {
            return [];
        }

        return folders.filter(
            (folder) =>
                Number(folder.tid) === projectTid &&
                (folder.pid === null ||
                    folder.pid === undefined)
        );
    }, [
        folders,
        selectedProject,
    ]);

    // --------------------------------------------------
    // Selected Folder
    // --------------------------------------------------

    const selectedFolder = useMemo(() => {
        if (selectedFolderId === "") {
            return undefined;
        }

        return availableFolders.find(
            (folder) =>
                Number(folder.fid) ===
                Number(selectedFolderId)
        );
    }, [
        availableFolders,
        selectedFolderId,
    ]);

    // --------------------------------------------------
    // File Selection
    // --------------------------------------------------

    const handleFileChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setSelectedFile(file);
        setUploadSuccess(false);
        setError("");
    };

    // --------------------------------------------------
    // Remove File
    // --------------------------------------------------

    const handleRemoveFile = () => {
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // --------------------------------------------------
    // Project Selection
    // --------------------------------------------------

    const handleProjectChange = (
        event: ChangeEvent<HTMLSelectElement>
    ) => {
        const value = event.target.value;

        const projectId =
            value === ""
                ? ""
                : Number(value);

        setSelectedProjectId(projectId);

        // Folder belongs to the selected project/template,
        // so reset it whenever the project changes.
        setSelectedFolderId("");

        setUploadSuccess(false);
        setError("");
    };

    // --------------------------------------------------
    // Folder Selection
    // --------------------------------------------------

    const handleFolderChange = (
        event: ChangeEvent<HTMLSelectElement>
    ) => {
        const value = event.target.value;

        const folderId =
            value === ""
                ? ""
                : Number(value);

        setSelectedFolderId(folderId);

        setUploadSuccess(false);
        setError("");
    };

    // --------------------------------------------------
    // Upload
    // --------------------------------------------------

    const handleUpload = async () => {
        setError("");
        setUploadSuccess(false);

        // Validate file.
        if (!selectedFile) {
            setError("Please select a file.");
            return;
        }

        // Validate project.
        if (selectedProjectId === "") {
            setError("Please select a project.");
            return;
        }

        // Validate folder.
        if (selectedFolderId === "") {
            setError("Please select a folder.");
            return;
        }

        // Validate user.
        if (currentUserId === null) {
            setError(
                "Unable to identify the logged-in user. Please login again."
            );
            return;
        }

        // Normalize IDs.
        const projectId = Number(
            selectedProjectId
        );

        const folderId = Number(
            selectedFolderId
        );

        if (
            !Number.isInteger(projectId) ||
            !Number.isInteger(folderId)
        ) {
            setError(
                "Invalid project or folder selected."
            );
            return;
        }

        // Confirm the folder is part of the currently
        // selected project's folder list.
        const folderExists =
            availableFolders.some(
                (folder) =>
                    Number(folder.fid) ===
                    folderId
            );

        if (!folderExists) {
            setError(
                "The selected folder does not belong to the selected project."
            );
            return;
        }

        try {
            setIsUploading(true);

            console.log(
                "UPLOAD REQUEST:",
                {
                    project_id: projectId,
                    folder_id: folderId,
                    uploaded_by: currentUserId,
                    file_name: selectedFile.name,
                    file_size: selectedFile.size,
                    project_tid:
                        selectedProject?.tid,
                    folder_tid:
                        selectedFolder?.tid,
                    selectedProject,
                    selectedFolder,
                }
            );

            const response =
                await uploadFileToFolder(
                    projectId,
                    folderId,
                    currentUserId,
                    selectedFile
                );

            console.log(
                "UPLOAD RESPONSE:",
                response
            );

            if (response?.success === false) {
                throw new Error(
                    response.message ||
                        "The server could not upload the file."
                );
            }

            // Success.
            setUploadSuccess(true);

            // Reset form.
            setSelectedFile(null);
            setSelectedProjectId("");
            setSelectedFolderId("");

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            console.error(
                "File upload failed:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to upload file. Please try again."
            );
        } finally {
            setIsUploading(false);
        }
    };

    // --------------------------------------------------
    // JSX
    // --------------------------------------------------

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
            <div className="mx-auto w-full max-w-7xl">

                {/* Header */}

                <div className="mb-6">
                    <h1
                        className="
                            text-2xl
                            font-bold
                            text-gray-900
                            dark:text-white
                        "
                    >
                        Upload File
                    </h1>

                    <p
                        className="
                            mt-1
                            text-sm
                            text-gray-500
                            dark:text-gray-400
                        "
                    >
                        Upload a file to a project folder.
                    </p>
                </div>

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
                            size={20}
                            className="shrink-0"
                        />

                        <div>
                            <p className="font-semibold">
                                File uploaded successfully.
                            </p>

                            <p className="mt-0.5 text-xs">
                                The file has been added to the selected folder.
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

                {/* Main */}

                <div
                    className="
                        grid
                        grid-cols-1
                        gap-6
                        lg:grid-cols-[1fr_380px]
                    "
                >

                    {/* LEFT: File Selection */}

                    <div
                        className="
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
                                Choose the file you want to upload.
                            </p>
                        </div>

                        {!selectedFile ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={isUploading}
                                    className="
                                        flex
                                        min-h-[300px]
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
                                        <Upload size={25} />
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
                                        Select a file from your computer
                                    </p>
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
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
                                        <FileIcon size={22} />
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
                                            {selectedFile.name}
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
                                                selectedFile.size
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        disabled={isUploading}
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
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: File Destination */}

                    <div
                        className="
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
                                    value={selectedProjectId}
                                    onChange={handleProjectChange}
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
                                        (project) => (
                                            <option
                                                key={
                                                    project.project_id
                                                }
                                                value={
                                                    project.project_id
                                                }
                                            >
                                                {project.projectname ||
                                                    "Unnamed project"}
                                            </option>
                                        )
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
                                    value={selectedFolderId}
                                    onChange={handleFolderChange}
                                    disabled={
                                        selectedProjectId === "" ||
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
                                        {selectedProjectId === ""
                                            ? "Select a project first"
                                            : isLoadingFolders
                                                ? "Loading folders..."
                                                : availableFolders.length === 0
                                                    ? "No folders found"
                                                    : "Select folder"}
                                    </option>

                                    {availableFolders.map(
                                        (folder) => (
                                            <option
                                                key={folder.fid}
                                                value={folder.fid}
                                            >
                                                {folder.fname}
                                            </option>
                                        )
                                    )}
                                </select>

                                {isLoadingFolders &&
                                    selectedProjectId !== "" && (
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

                            {selectedProjectId !== "" &&
                                !isLoadingFolders &&
                                availableFolders.length === 0 && (
                                    <p
                                        className="
                                            mt-2
                                            text-xs
                                            text-amber-600
                                            dark:text-amber-400
                                        "
                                    >
                                        No top-level folders are associated
                                        with this project.
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
                                                    text-sm
                                                    font-medium
                                                    text-gray-900
                                                    dark:text-white
                                                "
                                            >
                                                {selectedProject.projectname ||
                                                    "Unnamed project"}
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
                                                    text-sm
                                                    font-medium
                                                    text-gray-900
                                                    dark:text-white
                                                "
                                            >
                                                {selectedFolder.fname}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upload Button */}

                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={
                                isUploading ||
                                isLoadingProjects ||
                                isLoadingFolders
                            }
                            className="
                                mt-6
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
                                disabled:opacity-60
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
                                    <Upload size={17} />
                                    Upload File
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --------------------------------------------------
// File Size
// --------------------------------------------------

function formatFileSize(
    bytes: number
): string {
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
    ).toFixed(
        index === 0 ? 0 : 1
    )} ${units[index]}`;
}

export default FileUploadPage;
