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

import {
    getProjects,
    type Project,
} from "../api/projects";

import {
    getFolders,
    type Folder as ProjectFolder,
} from "../api/folders";

import {
    getUsers,
    type User,
} from "../api/users";

import {
    uploadFileToFolder,
} from "../api/files";

// --------------------------------------------------
// Current User Helper
// --------------------------------------------------

function getCurrentUserId(): number | null {
    const possibleKeys = [
        "user",
        "current_user",
        "currentUser",
        "logged_in_user",
    ];

    for (const key of possibleKeys) {
        const stored = localStorage.getItem(key);

        if (!stored) {
            continue;
        }

        try {
            const parsed = JSON.parse(stored);

            const uid =
                parsed?.uid ??
                parsed?.user?.uid ??
                parsed?.id ??
                parsed?.user_id;

            if (typeof uid === "number") {
                return uid;
            }

            if (
                typeof uid === "string" &&
                uid.trim() !== ""
            ) {
                const numericUid = Number(uid);

                if (!Number.isNaN(numericUid)) {
                    return numericUid;
                }
            }
        } catch {
            // Ignore invalid localStorage data
        }
    }

    return null;
}

// --------------------------------------------------
// Component
// --------------------------------------------------

function FileUploadPage() {
    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    // --------------------------------------------------
    // Data
    // --------------------------------------------------

    const [projects, setProjects] =
        useState<Project[]>([]);

    const [folders, setFolders] =
        useState<ProjectFolder[]>([]);

    const [users, setUsers] =
        useState<User[]>([]);

    // --------------------------------------------------
    // Loading
    // --------------------------------------------------

    const [isLoadingProjects, setIsLoadingProjects] =
        useState(false);

    const [isLoadingFolders, setIsLoadingFolders] =
        useState(false);

    const [isLoadingUsers, setIsLoadingUsers] =
        useState(false);

    const [isUploading, setIsUploading] =
        useState(false);

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
    // Current user
    // --------------------------------------------------

    /*
     * This is derived from localStorage.
     * It does NOT need React state.
     */
    const currentUserId = useMemo(
        () => getCurrentUserId(),
        []
    );

    // --------------------------------------------------
    // Messages
    // --------------------------------------------------

    const [uploadSuccess, setUploadSuccess] =
        useState(false);

    const [error, setError] =
        useState("");

    // --------------------------------------------------
    // Load projects
    // --------------------------------------------------

    useEffect(() => {
        async function loadProjects() {
            try {
                setIsLoadingProjects(true);

                const response =
                    await getProjects();

                setProjects(
                    response.projects
                );
            } catch (err) {
                console.error(
                    "Failed to load projects:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load projects."
                );
            } finally {
                setIsLoadingProjects(false);
            }
        }

        loadProjects();
    }, []);

    // --------------------------------------------------
    // Load folders
    // --------------------------------------------------

    useEffect(() => {
        async function loadFolders() {
            try {
                setIsLoadingFolders(true);

                const response =
                    await getFolders();

                setFolders(
                    response.folders
                );
            } catch (err) {
                console.error(
                    "Failed to load folders:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load folders."
                );
            } finally {
                setIsLoadingFolders(false);
            }
        }

        loadFolders();
    }, []);

    // --------------------------------------------------
    // Load users
    // --------------------------------------------------

    useEffect(() => {
        async function loadUsers() {
            try {
                setIsLoadingUsers(true);

                const response =
                    await getUsers();

                setUsers(
                    response.users
                );
            } catch (err) {
                console.error(
                    "Failed to load users:",
                    err
                );
            } finally {
                setIsLoadingUsers(false);
            }
        }

        loadUsers();
    }, []);

    // --------------------------------------------------
    // Folders for selected project
    // --------------------------------------------------

    const availableFolders = useMemo(
        () => {
            if (selectedProjectId === "") {
                return [];
            }

            return folders.filter(
                (folder) =>
                    folder.pid ===
                    selectedProjectId
            );
        },
        [
            folders,
            selectedProjectId,
        ]
    );

    // --------------------------------------------------
    // Selected project
    // --------------------------------------------------

    const selectedProject = useMemo(
        () =>
            projects.find(
                (project) =>
                    project.project_id ===
                    selectedProjectId
            ),
        [
            projects,
            selectedProjectId,
        ]
    );

    // --------------------------------------------------
    // Selected folder
    // --------------------------------------------------

    const selectedFolder = useMemo(
        () =>
            folders.find(
                (folder) =>
                    folder.fid ===
                    selectedFolderId
            ),
        [
            folders,
            selectedFolderId,
        ]
    );

    // --------------------------------------------------
    // Current user
    // --------------------------------------------------

    const currentUser = useMemo(
        () =>
            users.find(
                (user) =>
                    user.uid ===
                    currentUserId
            ),
        [
            users,
            currentUserId,
        ]
    );

    // --------------------------------------------------
    // File selection
    // --------------------------------------------------

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
    };

    // --------------------------------------------------
    // Remove file
    // --------------------------------------------------

    const handleRemoveFile = () => {
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // --------------------------------------------------
    // Project selection
    // --------------------------------------------------

    const handleProjectChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const value =
            event.target.value;

        const projectId =
            value === ""
                ? ""
                : Number(value);

        setSelectedProjectId(
            projectId
        );

        // Reset folder
        setSelectedFolderId("");

        setUploadSuccess(false);
        setError("");
    };

    // --------------------------------------------------
    // Folder selection
    // --------------------------------------------------

    const handleFolderChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const value =
            event.target.value;

        const folderId =
            value === ""
                ? ""
                : Number(value);

        setSelectedFolderId(
            folderId
        );

        setUploadSuccess(false);
        setError("");
    };

    // --------------------------------------------------
    // Upload
    // --------------------------------------------------

    const handleUpload = async () => {
        setError("");
        setUploadSuccess(false);

        // ----------------------------------------------
        // File
        // ----------------------------------------------

        if (!selectedFile) {
            setError(
                "Please select a file."
            );
            return;
        }

        // ----------------------------------------------
        // Project
        // ----------------------------------------------

        if (selectedProjectId === "") {
            setError(
                "Please select a project."
            );
            return;
        }

        // ----------------------------------------------
        // Folder
        // ----------------------------------------------

        if (selectedFolderId === "") {
            setError(
                "Please select a folder."
            );
            return;
        }

        // ----------------------------------------------
        // User
        // ----------------------------------------------

        if (currentUserId === null) {
            setError(
                "Unable to identify the logged-in user."
            );
            return;
        }

        try {
            setIsUploading(true);

            await uploadFileToFolder(
                selectedProjectId,
                selectedFolderId,
                currentUserId,
                selectedFile
            );

            // ------------------------------------------
            // Success
            // ------------------------------------------

            setUploadSuccess(true);

            // ------------------------------------------
            // Reset form
            // ------------------------------------------

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
            <div
                className="
                    mx-auto
                    w-full
                    max-w-7xl
                "
            >
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
                        Upload a file to a
                        project folder.
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
                                File uploaded
                                successfully.
                            </p>

                            <p className="mt-0.5 text-xs">
                                The file has been
                                added to the
                                selected folder.
                            </p>
                        </div>
                    </div>
                )}

                {/* Error */}

                {error && (
                    <div
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
                    {/* LEFT */}

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
                                Choose the file
                                you want to
                                upload.
                            </p>
                        </div>

                        {/* File picker */}

                        {!selectedFile ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
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
                                        Click to
                                        select a
                                        file
                                    </p>

                                    <p
                                        className="
                                            mt-1
                                            text-xs
                                            text-gray-500
                                            dark:text-gray-400
                                        "
                                    >
                                        Select a
                                        file from
                                        your
                                        computer
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
                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-4
                                    "
                                >
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
                                                selectedFile.size
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            handleRemoveFile
                                        }
                                        className="
                                            rounded-lg
                                            p-2
                                            text-gray-400
                                            transition
                                            hover:bg-red-50
                                            hover:text-red-600
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

                        {/* Current user */}

                        {currentUser && (
                            <div
                                className="
                                    mt-5
                                    rounded-xl
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    p-4
                                    dark:border-gray-800
                                    dark:bg-gray-950
                                "
                            >
                                <p
                                    className="
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wider
                                        text-gray-500
                                        dark:text-gray-400
                                    "
                                >
                                    Uploaded By
                                </p>

                                <div className="mt-2">
                                    <p
                                        className="
                                            text-sm
                                            font-medium
                                            text-gray-900
                                            dark:text-white
                                        "
                                    >
                                        {
                                            currentUser.firstname
                                        }{" "}
                                        {
                                            currentUser.lastname
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
                                        User ID:{" "}
                                        {
                                            currentUser.uid
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT */}

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
                                Select the project
                                and folder.
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
                                            project
                                        ) => (
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
                                            folder
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
                                        )
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
                                    Upload
                                    Destination
                                </p>

                                {selectedProject && (
                                    <div
                                        className="
                                            flex
                                            items-start
                                            gap-3
                                        "
                                    >
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
                                    <div
                                        className="
                                            mt-4
                                            flex
                                            items-start
                                            gap-3
                                        "
                                    >
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
                                                {
                                                    selectedFolder.fname
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
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
                                isLoadingUsers
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
                                    <Upload
                                        size={17}
                                    />
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