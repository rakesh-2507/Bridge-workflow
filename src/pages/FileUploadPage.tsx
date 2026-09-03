import {
    CheckCircle2,
    File,
    Folder,
    Upload,
    X,
} from "lucide-react";

import {
    useRef,
    useState,
} from "react";

interface Project {
    id: number;
    name: string;
}

interface ProjectFolder {
    id: number;
    projectId: number;
    name: string;
}

const dummyProjects: Project[] = [
    {
        id: 1,
        name: "MuseIndia November-December 2026",
    },
    {
        id: 2,
        name: "Research Publication 2026",
    },
    {
        id: 3,
        name: "Annual Magazine Project",
    },
];

const dummyFolders: ProjectFolder[] = [
    {
        id: 101,
        projectId: 1,
        name: "Editorial",
    },
    {
        id: 102,
        projectId: 1,
        name: "Feature",
    },
    {
        id: 103,
        projectId: 1,
        name: "Interviews",
    },
    {
        id: 104,
        projectId: 1,
        name: "Poetry",
    },
    {
        id: 105,
        projectId: 1,
        name: "Book Reviews",
    },

    {
        id: 201,
        projectId: 2,
        name: "Research",
    },
    {
        id: 202,
        projectId: 2,
        name: "Documents",
    },
    {
        id: 203,
        projectId: 2,
        name: "References",
    },

    {
        id: 301,
        projectId: 3,
        name: "Content",
    },
    {
        id: 302,
        projectId: 3,
        name: "Design",
    },
    {
        id: 303,
        projectId: 3,
        name: "Final Files",
    },
];

function FileUploadPage() {
    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null
        );

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [selectedProjectId, setSelectedProjectId] =
        useState<number | "">("");

    const [selectedFolderId, setSelectedFolderId] =
        useState<number | "">("");

    const [isUploading, setIsUploading] =
        useState(false);

    const [uploadSuccess, setUploadSuccess] =
        useState(false);

    const [error, setError] =
        useState("");

    /*
     * Get folders belonging to
     * the selected project.
     */
    const availableFolders =
        dummyFolders.filter(
            (folder) =>
                folder.projectId ===
                selectedProjectId
        );

    /*
     * Handle file selection.
     */
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

    /*
     * Remove selected file.
     */
    const handleRemoveFile = () => {
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    /*
     * Project selection.
     *
     * When project changes, reset the
     * folder because folders belong
     * to a specific project.
     */
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

        setSelectedFolderId("");
        setUploadSuccess(false);
        setError("");
    };

    /*
     * Folder selection.
     */
    const handleFolderChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const value =
            event.target.value;

        setSelectedFolderId(
            value === ""
                ? ""
                : Number(value)
        );

        setUploadSuccess(false);
        setError("");
    };

    /*
     * Simulate file upload.
     *
     * Replace this later with your
     * actual upload API.
     */
    const handleUpload = async () => {
        setError("");
        setUploadSuccess(false);

        if (!selectedFile) {
            setError(
                "Please select a file."
            );
            return;
        }

        if (selectedProjectId === "") {
            setError(
                "Please select a project."
            );
            return;
        }

        if (selectedFolderId === "") {
            setError(
                "Please select a folder."
            );
            return;
        }

        try {
            setIsUploading(true);

            /*
             * Dummy API delay.
             */
            await new Promise(
                (resolve) =>
                    setTimeout(
                        resolve,
                        1000
                    )
            );

            console.log(
                "File upload payload:",
                {
                    file: selectedFile,
                    projectId:
                        selectedProjectId,
                    folderId:
                        selectedFolderId,
                }
            );

            setUploadSuccess(true);

            /*
             * Reset form after successful
             * dummy upload.
             */
            setSelectedFile(null);
            setSelectedProjectId("");
            setSelectedFolderId("");

            if (fileInputRef.current) {
                fileInputRef.current.value =
                    "";
            }
        } catch {
            setError(
                "Failed to upload file."
            );
        } finally {
            setIsUploading(false);
        }
    };

    const selectedProject =
        dummyProjects.find(
            (project) =>
                project.id ===
                selectedProjectId
        );

    const selectedFolder =
        dummyFolders.find(
            (folder) =>
                folder.id ===
                selectedFolderId
        );

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
                        Upload a file and
                        select the project
                        and folder where it
                        should be stored.
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

                        <span>
                            File uploaded
                            successfully.
                        </span>
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

                <div
                    className="
                        grid
                        grid-cols-1
                        gap-6
                        lg:grid-cols-[1fr_380px]
                    "
                >
                    {/* Left - Upload */}
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

                        {!selectedFile ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="
                                        flex
                                        min-h-[260px]
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
                                        <File
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
                    </div>

                    {/* Right - Destination */}
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
                                Choose where the
                                file should be
                                uploaded.
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

                            <select
                                id="project"
                                value={
                                    selectedProjectId
                                }
                                onChange={
                                    handleProjectChange
                                }
                                className="
                                    w-full
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
                                    dark:border-gray-700
                                    dark:bg-gray-950
                                    dark:text-white
                                "
                            >
                                <option value="">
                                    Select project
                                </option>

                                {dummyProjects.map(
                                    (
                                        project
                                    ) => (
                                        <option
                                            key={
                                                project.id
                                            }
                                            value={
                                                project.id
                                            }
                                        >
                                            {
                                                project.name
                                            }
                                        </option>
                                    )
                                )}
                            </select>
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
                                    ""
                                }
                                className="
                                    w-full
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
                                        : "Select folder"}
                                </option>

                                {availableFolders.map(
                                    (
                                        folder
                                    ) => (
                                        <option
                                            key={
                                                folder.id
                                            }
                                            value={
                                                folder.id
                                            }
                                        >
                                            {
                                                folder.name
                                            }
                                        </option>
                                    )
                                )}
                            </select>
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
                                        mb-3
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
                                        <File
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
                                                {
                                                    selectedProject.name
                                                }
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
                                                    selectedFolder.name
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
                                isUploading
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
                            <Upload
                                size={17}
                            />

                            {isUploading
                                ? "Uploading..."
                                : "Upload File"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/*
 * Convert bytes into a readable
 * file size.
 */
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
    ).toFixed(index === 0 ? 0 : 1)} ${
        units[index]
    }`;
}

export default FileUploadPage;
