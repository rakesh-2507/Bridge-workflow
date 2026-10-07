import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";

import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    FileText,
    Folder,
    FolderPlus,
    Plus,
    RotateCcw,
    Upload,
    UserPlus,
    X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

type WizardStep = "source" | "details" | "folders" | "roles";

interface TemplateFolder {
    id: string;
    name: string;
    description: string;
    parentId: string | null;
    roles: string[];
}

interface TemplateDraft {
    name: string;
    description: string;
    projectTypeId: number | null;
    workflowConfigId: number | null;
    workflowScope: "PROJECT" | "FOLDER";
    folders: TemplateFolder[];
}

interface MockProjectType {
    id: number;
    name: string;
}

interface MockWorkflow {
    id: number;
    name: string;
    status: "ACTIVE" | "INACTIVE";
}

interface ParsedFolder {
    name: string;
    parentIndex: number | null;
}

interface ParsedSource {
    templateName: string;
    description: string;
    folders: ParsedFolder[];
}

const MOCK_TEXT = `# Magazine Publishing

## Manuscript
### Draft
### Final

## Review
### Content Review
### Copy Editing

## Approval
### Final Approval
`;

const MOCK_PROJECT_TYPES: MockProjectType[] = [
    {
        id: 1,
        name: "Magazine Publishing",
    },
    {
        id: 2,
        name: "Content Management",
    },
    {
        id: 3,
        name: "Document Review",
    },
    {
        id: 4,
        name: "Editorial Workflow",
    },
];

const MOCK_WORKFLOWS: MockWorkflow[] = [
    {
        id: 101,
        name: "Standard Publishing Workflow",
        status: "ACTIVE",
    },
    {
        id: 102,
        name: "Editorial Review Workflow",
        status: "ACTIVE",
    },
    {
        id: 103,
        name: "Document Approval Workflow",
        status: "ACTIVE",
    },
    {
        id: 104,
        name: "Archived Workflow",
        status: "INACTIVE",
    },
];

const MOCK_ROLES: string[] = [
    "Author",
    "Editor",
    "Reviewer",
    "Copy Editor",
    "Approver",
    "Project Manager",
];

const STEPS: Array<{
    id: WizardStep;
    label: string;
    description: string;
}> = [
    {
        id: "source",
        label: "Source",
        description: "Upload or enter structure",
    },
    {
        id: "details",
        label: "Template Details",
        description: "Review generated details",
    },
    {
        id: "folders",
        label: "Folders",
        description: "Review folder structure",
    },
    {
        id: "roles",
        label: "Roles",
        description: "Assign folder roles",
    },
];

function createId(): string {
    return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
}

/**
 * Parses a Markdown-style folder structure.
 *
 * Example:
 *
 * # Magazine Publishing
 *
 * ## Manuscript
 * ### Draft
 * ### Final
 *
 * ## Review
 * ### Content Review
 *
 * #### Nested Folder
 */
function parseFolderText(text: string): ParsedSource {
    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    let templateName = "Untitled Template";

    const folders: ParsedFolder[] = [];

    const stack: Array<{
        level: number;
        index: number;
    }> = [];

    for (const line of lines) {
        const heading = line.match(/^(#{1,6})\s+(.+)$/);

        if (!heading) {
            continue;
        }

        const level = heading[1].length;
        const name = heading[2].trim();

        if (level === 1 && folders.length === 0) {
            templateName = name;
            continue;
        }

        while (
            stack.length > 0 &&
            stack[stack.length - 1].level >= level
        ) {
            stack.pop();
        }

        const parentIndex =
            stack.length > 0
                ? stack[stack.length - 1].index
                : null;

        const folderIndex = folders.length;

        folders.push({
            name,
            parentIndex,
        });

        stack.push({
            level,
            index: folderIndex,
        });
    }

    return {
        templateName,
        description: `Project template for ${templateName}.`,
        folders,
    };
}

function buildDraftFromText(text: string): TemplateDraft {
    const parsed: ParsedSource = parseFolderText(text);

    /*
     * First pass:
     * Create all folder objects without parentId.
     *
     * This avoids the previous:
     * "Cannot access 'folders' before initialization"
     * error.
     */
    const folders: TemplateFolder[] = parsed.folders.map(
        (folder: ParsedFolder) => ({
            id: createId(),
            name: folder.name,
            description: `${folder.name} folder for ${parsed.templateName}.`,
            parentId: null,
            roles: [],
        }),
    );

    /*
     * Second pass:
     * Now that folders exists, resolve parent references.
     */
    parsed.folders.forEach(
        (folder: ParsedFolder, index: number) => {
            if (folder.parentIndex === null) {
                return;
            }

            const parent = folders[folder.parentIndex];
            const currentFolder = folders[index];

            if (!parent || !currentFolder) {
                return;
            }

            currentFolder.parentId = parent.id;
            currentFolder.description =
                `${currentFolder.name} folder under ${parent.name}.`;
        },
    );

    const defaultProjectType =
        MOCK_PROJECT_TYPES[0] ?? null;

    const defaultWorkflow =
        MOCK_WORKFLOWS.find(
            workflow =>
                workflow.status === "ACTIVE",
        ) ?? null;

    return {
        name: parsed.templateName,
        description: parsed.description,
        projectTypeId:
            defaultProjectType?.id ?? null,
        workflowConfigId:
            defaultWorkflow?.id ?? null,
        workflowScope: "PROJECT",
        folders,
    };
}

export default function TemplateCreationWizard() {
    const navigate = useNavigate();

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    const [currentStep, setCurrentStep] =
        useState<WizardStep>("source");

    const [sourceText, setSourceText] =
        useState<string>(MOCK_TEXT);

    const [uploadedFileName, setUploadedFileName] =
        useState<string>("");

    const [draft, setDraft] =
        useState<TemplateDraft>(() =>
            buildDraftFromText(MOCK_TEXT),
        );

    const [roles, setRoles] =
        useState<string[]>(MOCK_ROLES);

    const [newRole, setNewRole] =
        useState<string>("");

    const [selectedFolderId, setSelectedFolderId] =
        useState<string | null>(() =>
            buildDraftFromText(MOCK_TEXT)
                .folders[0]?.id ?? null,
        );

    const [creatingTemplate, setCreatingTemplate] =
        useState<boolean>(false);

    const [error, setError] =
        useState<string>("");

    const [success, setSuccess] =
        useState<string>("");

    const [expandedFolders, setExpandedFolders] =
        useState<Record<string, boolean>>(() => {
            const initialDraft =
                buildDraftFromText(MOCK_TEXT);

            return Object.fromEntries(
                initialDraft.folders.map(
                    folder => [
                        folder.id,
                        true,
                    ],
                ),
            );
        });

    const currentStepIndex = STEPS.findIndex(
        step => step.id === currentStep,
    );

    const selectedFolder = useMemo(
        () =>
            draft.folders.find(
                folder =>
                    folder.id ===
                    selectedFolderId,
            ),
        [
            draft.folders,
            selectedFolderId,
        ],
    );

    const activeWorkflows = useMemo(
        () =>
            MOCK_WORKFLOWS.filter(
                workflow =>
                    workflow.status ===
                    "ACTIVE",
            ),
        [],
    );

    function getChildren(
        parentId: string,
    ): TemplateFolder[] {
        return draft.folders.filter(
            folder =>
                folder.parentId ===
                parentId,
        );
    }

    function updateDraft<
        K extends keyof TemplateDraft,
    >(
        field: K,
        value: TemplateDraft[K],
    ) {
        setDraft(previous => ({
            ...previous,
            [field]: value,
        }));
    }

    async function handleFileUpload(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");
        setSuccess("");

        const extension =
            file.name
                .split(".")
                .pop()
                ?.toLowerCase();

        if (
            extension !== "md" &&
            extension !== "markdown" &&
            extension !== "txt"
        ) {
            setError(
                "Please upload a Markdown (.md) or text (.txt) file.",
            );

            event.target.value = "";
            return;
        }

        try {
            const content =
                await file.text();

            setSourceText(content);
            setUploadedFileName(
                file.name,
            );
        } catch {
            setError(
                "Unable to read the selected file.",
            );
        }

        event.target.value = "";
    }

    function loadMockData() {
        setSourceText(MOCK_TEXT);
        setUploadedFileName("");
        setError("");
        setSuccess("");
    }

    function handleGenerateTemplate() {
        setError("");
        setSuccess("");

        if (!sourceText.trim()) {
            setError(
                "Please enter a folder structure or upload a file.",
            );
            return;
        }

        const parsed =
            buildDraftFromText(
                sourceText,
            );

        if (!parsed.name.trim()) {
            setError(
                "Template name could not be detected.",
            );
            return;
        }

        if (
            parsed.folders.length === 0
        ) {
            setError(
                "No folders were found. Use ## for folders and ### for subfolders.",
            );
            return;
        }

        setDraft(parsed);

        const initialExpanded: Record<
            string,
            boolean
        > = {};

        parsed.folders.forEach(
            folder => {
                initialExpanded[
                    folder.id
                ] = true;
            },
        );

        setExpandedFolders(
            initialExpanded,
        );

        setSelectedFolderId(
            parsed.folders[0]?.id ??
                null,
        );

        setCurrentStep("details");
    }

    function updateFolderName(
        folderId: string,
        value: string,
    ) {
        setDraft(previous => ({
            ...previous,
            folders:
                previous.folders.map(
                    folder =>
                        folder.id ===
                        folderId
                            ? {
                                ...folder,
                                name: value,
                            }
                            : folder,
                ),
        }));
    }

    function updateFolderDescription(
        folderId: string,
        value: string,
    ) {
        setDraft(previous => ({
            ...previous,
            folders:
                previous.folders.map(
                    folder =>
                        folder.id ===
                        folderId
                            ? {
                                ...folder,
                                description:
                                    value,
                            }
                            : folder,
                ),
        }));
    }

    function toggleFolder(
        folderId: string,
    ) {
        setExpandedFolders(
            previous => ({
                ...previous,
                [folderId]:
                    !previous[
                        folderId
                    ],
            }),
        );
    }

    function addRootFolder() {
        const folder: TemplateFolder = {
            id: createId(),
            name: "New Folder",
            description: "New folder",
            parentId: null,
            roles: [],
        };

        setDraft(previous => ({
            ...previous,
            folders: [
                ...previous.folders,
                folder,
            ],
        }));

        setExpandedFolders(
            previous => ({
                ...previous,
                [folder.id]: true,
            }),
        );

        setSelectedFolderId(
            folder.id,
        );
    }

    function addChildFolder(
        parentId: string,
    ) {
        const parent =
            draft.folders.find(
                folder =>
                    folder.id ===
                    parentId,
            );

        const folder: TemplateFolder = {
            id: createId(),
            name: "New Subfolder",
            description: parent
                ? `New subfolder under ${parent.name}.`
                : "New subfolder",
            parentId,
            roles: [],
        };

        setDraft(previous => ({
            ...previous,
            folders: [
                ...previous.folders,
                folder,
            ],
        }));

        setExpandedFolders(
            previous => ({
                ...previous,
                [parentId]: true,
                [folder.id]: true,
            }),
        );

        setSelectedFolderId(
            folder.id,
        );
    }

    function deleteFolder(
        folderId: string,
    ) {
        const idsToDelete =
            new Set<string>([
                folderId,
            ]);

        let changed = true;

        while (changed) {
            changed = false;

            for (const folder of draft.folders) {
                if (
                    folder.parentId &&
                    idsToDelete.has(
                        folder.parentId,
                    ) &&
                    !idsToDelete.has(
                        folder.id,
                    )
                ) {
                    idsToDelete.add(
                        folder.id,
                    );

                    changed = true;
                }
            }
        }

        setDraft(previous => ({
            ...previous,
            folders:
                previous.folders.filter(
                    folder =>
                        !idsToDelete.has(
                            folder.id,
                        ),
                ),
        }));

        setExpandedFolders(
            previous => {
                const next = {
                    ...previous,
                };

                idsToDelete.forEach(
                    id => {
                        delete next[id];
                    },
                );

                return next;
            },
        );

        if (
            selectedFolderId &&
            idsToDelete.has(
                selectedFolderId,
            )
        ) {
            const remaining =
                draft.folders.find(
                    folder =>
                        !idsToDelete.has(
                            folder.id,
                        ),
                );

            setSelectedFolderId(
                remaining?.id ??
                    null,
            );
        }
    }

    function addRole() {
        const role =
            newRole.trim();

        if (!role) {
            return;
        }

        const exists =
            roles.some(
                existing =>
                    existing.toLowerCase() ===
                    role.toLowerCase(),
            );

        if (exists) {
            setNewRole("");
            return;
        }

        setRoles(previous => [
            ...previous,
            role,
        ]);

        setNewRole("");
    }

    function removeRole(
        role: string,
    ) {
        setRoles(previous =>
            previous.filter(
                item =>
                    item !== role,
            ),
        );

        setDraft(previous => ({
            ...previous,
            folders:
                previous.folders.map(
                    folder => ({
                        ...folder,
                        roles:
                            folder.roles.filter(
                                item =>
                                    item !==
                                    role,
                            ),
                    }),
                ),
        }));
    }

    function toggleRole(
        folderId: string,
        role: string,
    ) {
        setDraft(previous => ({
            ...previous,
            folders:
                previous.folders.map(
                    folder => {
                        if (
                            folder.id !==
                            folderId
                        ) {
                            return folder;
                        }

                        const assigned =
                            folder.roles.includes(
                                role,
                            );

                        return {
                            ...folder,
                            roles: assigned
                                ? folder.roles.filter(
                                    item =>
                                        item !==
                                        role,
                                )
                                : [
                                    ...folder.roles,
                                    role,
                                ],
                        };
                    },
                ),
        }));
    }

    function resetWizard() {
        const initialDraft =
            buildDraftFromText(
                MOCK_TEXT,
            );

        setSourceText(MOCK_TEXT);
        setUploadedFileName("");
        setDraft(initialDraft);
        setRoles(MOCK_ROLES);
        setNewRole("");

        setSelectedFolderId(
            initialDraft
                .folders[0]?.id ??
                null,
        );

        setExpandedFolders(
            Object.fromEntries(
                initialDraft.folders.map(
                    folder => [
                        folder.id,
                        true,
                    ],
                ),
            ),
        );

        setError("");
        setSuccess("");
        setCreatingTemplate(false);
        setCurrentStep("source");
    }

    function validateDetails(): boolean {
        if (!draft.name.trim()) {
            setError(
                "Template name is required.",
            );
            return false;
        }

        if (
            !draft.description.trim()
        ) {
            setError(
                "Template description is required.",
            );
            return false;
        }

        if (
            draft.projectTypeId ===
            null
        ) {
            setError(
                "Please select a project type.",
            );
            return false;
        }

        if (
            draft.workflowConfigId ===
            null
        ) {
            setError(
                "Please select a workflow.",
            );
            return false;
        }

        return true;
    }

    function validateFolders(): boolean {
        if (
            draft.folders.length ===
            0
        ) {
            setError(
                "At least one folder is required.",
            );
            return false;
        }

        for (const folder of draft.folders) {
            if (
                !folder.name.trim()
            ) {
                setError(
                    "Every folder must have a name.",
                );
                return false;
            }
        }

        return true;
    }

    function validateRoles(): boolean {
        if (roles.length === 0) {
            setError(
                "Please add at least one role.",
            );
            return false;
        }

        const foldersWithoutRoles =
            draft.folders.filter(
                folder =>
                    folder.roles.length ===
                    0,
            );

        if (
            foldersWithoutRoles.length >
            0
        ) {
            setError(
                `Please assign at least one role to: ${foldersWithoutRoles
                    .map(
                        folder =>
                            folder.name,
                    )
                    .join(", ")}`,
            );

            return false;
        }

        return true;
    }

    async function handleCreateTemplate() {
        setError("");
        setSuccess("");

        if (!validateDetails()) {
            setCurrentStep("details");
            return;
        }

        if (!validateFolders()) {
            setCurrentStep("folders");
            return;
        }

        if (!validateRoles()) {
            setCurrentStep("roles");
            return;
        }

        setCreatingTemplate(true);

        try {
            await new Promise<void>(
                resolve =>
                    setTimeout(
                        resolve,
                        1200,
                    ),
            );

            console.log(
                "MOCK PROJECT TEMPLATE CREATED:",
                {
                    project_template: {
                        name: draft.name.trim(),
                        description:
                            draft.description.trim(),
                        project_type_id:
                            draft.projectTypeId,
                        workflow_config_id:
                            draft.workflowConfigId,
                        workflow_scope:
                            draft.workflowScope,
                    },
                    folders:
                        draft.folders.map(
                            folder => ({
                                name: folder.name.trim(),
                                description:
                                    folder.description.trim(),
                                parent_folder_index:
                                    folder.parentId ===
                                    null
                                        ? null
                                        : draft.folders.findIndex(
                                            item =>
                                                item.id ===
                                                folder.parentId,
                                        ),
                                roles: folder.roles,
                            }),
                        ),
                },
            );

            setSuccess(
                "Project template created successfully using mock data.",
            );

            setTimeout(() => {
                navigate(
                    "/workflow-process",
                );
            }, 1000);
        } catch {
            setError(
                "Unable to create the mock project template.",
            );
        } finally {
            setCreatingTemplate(false);
        }
    }

    function goNext() {
        setError("");

        if (
            currentStep ===
            "source"
        ) {
            handleGenerateTemplate();
            return;
        }

        if (
            currentStep ===
            "details"
        ) {
            if (
                !validateDetails()
            ) {
                return;
            }

            setCurrentStep(
                "folders",
            );
            return;
        }

        if (
            currentStep ===
            "folders"
        ) {
            if (
                !validateFolders()
            ) {
                return;
            }

            setSelectedFolderId(
                draft.folders[0]?.id ??
                    null,
            );

            setCurrentStep(
                "roles",
            );
        }
    }

    function goBack() {
        setError("");

        if (
            currentStep ===
            "details"
        ) {
            setCurrentStep(
                "source",
            );
            return;
        }

        if (
            currentStep ===
            "folders"
        ) {
            setCurrentStep(
                "details",
            );
            return;
        }

        if (
            currentStep ===
            "roles"
        ) {
            setCurrentStep(
                "folders",
            );
        }
    }

    function renderFolderTree(
        parentId: string | null,
        level = 0,
    ): ReactNode {
        const folders =
            draft.folders.filter(
                folder =>
                    folder.parentId ===
                    parentId,
            );

        return folders.map(
            folder => {
                const children =
                    getChildren(
                        folder.id,
                    );

                const expanded =
                    expandedFolders[
                        folder.id
                    ] ?? true;

                return (
                    <div
                        key={
                            folder.id
                        }
                    >
                        <div
                            className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                            style={{
                                paddingLeft: `${level * 24 + 8}px`,
                            }}
                        >
                            {children.length >
                            0 ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleFolder(
                                            folder.id,
                                        )
                                    }
                                    className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                    {expanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </button>
                            ) : (
                                <span className="w-6" />
                            )}

                            <Folder className="h-4 w-4 text-amber-500" />

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedFolderId(
                                        folder.id,
                                    )
                                }
                                className={`flex-1 text-left text-sm ${
                                    selectedFolderId ===
                                    folder.id
                                        ? "font-semibold text-blue-600"
                                        : "text-slate-700 dark:text-slate-200"
                                }`}
                            >
                                {
                                    folder.name
                                }
                            </button>

                            <span className="text-xs text-slate-400">
                                {
                                    folder
                                        .roles
                                        .length
                                }{" "}
                                roles
                            </span>
                        </div>

                        {expanded &&
                            renderFolderTree(
                                folder.id,
                                level + 1,
                            )}
                    </div>
                );
            },
        );
    }

    const selectedProjectType =
        MOCK_PROJECT_TYPES.find(
            type =>
                type.id ===
                draft.projectTypeId,
        );

    const selectedWorkflow =
        activeWorkflows.find(
            workflow =>
                workflow.id ===
                draft.workflowConfigId,
        );

    return (
        <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Create Project
                                Template
                            </h1>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Build a
                                template from
                                a Markdown or
                                text folder
                                structure,
                                configure its
                                details,
                                review
                                folders, and
                                assign roles.
                            </p>

                            <div className="mt-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                Demo Mode —
                                Mock Data Only
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={
                                resetWizard
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset
                        </button>
                    </div>
                </div>

                <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid grid-cols-4 gap-2">
                        {STEPS.map(
                            (
                                step,
                                stepIndex,
                            ) => {
                                const active =
                                    stepIndex ===
                                    currentStepIndex;

                                const completed =
                                    stepIndex <
                                    currentStepIndex;

                                return (
                                    <button
                                        key={
                                            step.id
                                        }
                                        type="button"
                                        onClick={() => {
                                            if (
                                                stepIndex <=
                                                currentStepIndex
                                            ) {
                                                setCurrentStep(
                                                    step.id,
                                                );
                                            }
                                        }}
                                        disabled={
                                            stepIndex >
                                            currentStepIndex
                                        }
                                        className="text-left disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                                    completed
                                                        ? "bg-green-600 text-white"
                                                        : active
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                                }`}
                                            >
                                                {completed ? (
                                                    <Check className="h-4 w-4" />
                                                ) : (
                                                    stepIndex +
                                                    1
                                                )}
                                            </div>

                                            <div className="hidden min-w-0 sm:block">
                                                <div
                                                    className={`text-sm font-semibold ${
                                                        active
                                                            ? "text-blue-600"
                                                            : "text-slate-700 dark:text-slate-200"
                                                    }`}
                                                >
                                                    {
                                                        step.label
                                                    }
                                                </div>

                                                <div className="text-xs text-slate-400">
                                                    {
                                                        step.description
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        {stepIndex <
                                            STEPS.length -
                                            1 && (
                                            <div className="mt-4 hidden h-px bg-slate-200 dark:bg-slate-800 lg:block" />
                                        )}
                                    </button>
                                );
                            },
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                        <X className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                            {error}
                        </span>
                    </div>
                )}

                {success && (
                    <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                            {success}
                        </span>
                    </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {currentStep ===
                        "source" && (
                        <div className="p-6">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Define Folder
                                    Structure
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Upload a
                                    Markdown/text
                                    file or enter
                                    your folder
                                    structure
                                    manually.
                                </p>
                            </div>

                            <div className="mb-5 flex flex-wrap gap-3">
                                <input
                                    ref={
                                        fileInputRef
                                    }
                                    type="file"
                                    accept=".md,.markdown,.txt,text/plain,text/markdown"
                                    className="hidden"
                                    onChange={
                                        handleFileUpload
                                    }
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload File
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        loadMockData
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                                >
                                    <FileText className="h-4 w-4" />
                                    Load Mock
                                    Data
                                </button>

                                {uploadedFileName && (
                                    <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        <FileText className="h-4 w-4" />
                                        {
                                            uploadedFileName
                                        }
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Folder
                                        Structure
                                    </label>

                                    <textarea
                                        value={
                                            sourceText
                                        }
                                        onChange={event =>
                                            setSourceText(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        rows={20}
                                        className="w-full resize-none rounded-xl border border-slate-300 bg-slate-950 px-4 py-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
                                    />
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                    <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
                                        Text Format
                                    </h3>

                                    <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                        <div>
                                            <code className="rounded bg-slate-200 px-2 py-1 dark:bg-slate-800">
                                                # Template
                                                Name
                                            </code>
                                        </div>

                                        <div>
                                            <code className="rounded bg-slate-200 px-2 py-1 dark:bg-slate-800">
                                                ## Folder
                                            </code>
                                        </div>

                                        <div>
                                            <code className="rounded bg-slate-200 px-2 py-1 dark:bg-slate-800">
                                                ###
                                                Subfolder
                                            </code>
                                        </div>

                                        <div>
                                            <code className="rounded bg-slate-200 px-2 py-1 dark:bg-slate-800">
                                                ####
                                                Nested
                                                Folder
                                            </code>
                                        </div>
                                    </div>

                                    <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                                        <strong>
                                            How it
                                            works
                                        </strong>

                                        <p className="mt-2">
                                            The first
                                            # heading
                                            becomes
                                            the
                                            template
                                            name.
                                            ##, ###,
                                            #### etc.
                                            become
                                            folders
                                            and
                                            nested
                                            folders.
                                        </p>

                                        <p className="mt-2">
                                            Project
                                            type,
                                            workflow,
                                            descriptions,
                                            and roles
                                            are
                                            populated
                                            from mock
                                            data.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep ===
                        "details" && (
                        <div className="p-6">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Template
                                    Details
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Review the
                                    automatically
                                    generated
                                    template
                                    details.
                                </p>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium">
                                        Template Name
                                    </label>

                                    <input
                                        value={
                                            draft.name
                                        }
                                        onChange={event =>
                                            updateDraft(
                                                "name",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium">
                                        Description
                                    </label>

                                    <textarea
                                        value={
                                            draft.description
                                        }
                                        onChange={event =>
                                            updateDraft(
                                                "description",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        rows={4}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Project Type
                                    </label>

                                    <select
                                        value={
                                            draft.projectTypeId ??
                                            ""
                                        }
                                        onChange={event =>
                                            updateDraft(
                                                "projectTypeId",
                                                event
                                                    .target
                                                    .value
                                                    ? Number(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                    : null,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                                    >
                                        <option value="">
                                            Select Project
                                            Type
                                        </option>

                                        {MOCK_PROJECT_TYPES.map(
                                            type => (
                                                <option
                                                    key={
                                                        type.id
                                                    }
                                                    value={
                                                        type.id
                                                    }
                                                >
                                                    {
                                                        type.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Workflow
                                    </label>

                                    <select
                                        value={
                                            draft.workflowConfigId ??
                                            ""
                                        }
                                        onChange={event =>
                                            updateDraft(
                                                "workflowConfigId",
                                                event
                                                    .target
                                                    .value
                                                    ? Number(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                    : null,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                                    >
                                        <option value="">
                                            Select Workflow
                                        </option>

                                        {activeWorkflows.map(
                                            workflow => (
                                                <option
                                                    key={
                                                        workflow.id
                                                    }
                                                    value={
                                                        workflow.id
                                                    }
                                                >
                                                    {
                                                        workflow.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Workflow Scope
                                    </label>

                                    <select
                                        value={
                                            draft.workflowScope
                                        }
                                        onChange={event =>
                                            updateDraft(
                                                "workflowScope",
                                                event
                                                    .target
                                                    .value as
                                                    | "PROJECT"
                                                    | "FOLDER",
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                                    >
                                        <option value="PROJECT">
                                            Project
                                        </option>

                                        <option value="FOLDER">
                                            Folder
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="mb-4 text-sm font-semibold">
                                    Mock Generated
                                    Summary
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <div className="text-xs text-slate-400">
                                            Project Type
                                        </div>

                                        <div className="mt-1 font-semibold">
                                            {selectedProjectType?.name ??
                                                "Not selected"}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-400">
                                            Workflow
                                        </div>

                                        <div className="mt-1 font-semibold">
                                            {selectedWorkflow?.name ??
                                                "Not selected"}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-400">
                                            Folders
                                        </div>

                                        <div className="mt-1 text-xl font-bold">
                                            {
                                                draft
                                                    .folders
                                                    .length
                                            }
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-400">
                                            Roles
                                        </div>

                                        <div className="mt-1 text-xl font-bold">
                                            {
                                                roles.length
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep ===
                        "folders" && (
                        <div className="p-6">
                            <div className="mb-6 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Folders &
                                        Subfolders
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Review and
                                        modify the
                                        generated
                                        folder
                                        hierarchy.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        addRootFolder
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    <FolderPlus className="h-4 w-4" />
                                    Add Folder
                                </button>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                                    <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Folder Tree
                                    </div>

                                    {draft.folders
                                        .length ===
                                    0 ? (
                                        <div className="p-5 text-center text-sm text-slate-400">
                                            No folders
                                        </div>
                                    ) : (
                                        renderFolderTree(
                                            null,
                                        )
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {draft.folders.map(
                                        folder => {
                                            const children =
                                                getChildren(
                                                    folder.id,
                                                );

                                            const parent =
                                                folder.parentId
                                                    ? draft.folders.find(
                                                        item =>
                                                            item.id ===
                                                            folder.parentId,
                                                    )
                                                    : null;

                                            return (
                                                <div
                                                    key={
                                                        folder.id
                                                    }
                                                    className={`rounded-xl border p-5 ${
                                                        selectedFolderId ===
                                                        folder.id
                                                            ? "border-blue-400 bg-blue-50/30 dark:border-blue-700 dark:bg-blue-950/10"
                                                            : "border-slate-200 dark:border-slate-800"
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Folder className="mt-2 h-5 w-5 shrink-0 text-amber-500" />

                                                        <div className="min-w-0 flex-1">
                                                            <label className="mb-2 block text-xs font-medium uppercase text-slate-400">
                                                                Folder
                                                                Name
                                                            </label>

                                                            <input
                                                                value={
                                                                    folder.name
                                                                }
                                                                onChange={event =>
                                                                    updateFolderName(
                                                                        folder.id,
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                            />

                                                            <label className="mb-2 mt-4 block text-xs font-medium uppercase text-slate-400">
                                                                Description
                                                            </label>

                                                            <input
                                                                value={
                                                                    folder.description
                                                                }
                                                                onChange={event =>
                                                                    updateFolderDescription(
                                                                        folder.id,
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                            />

                                                            <div className="mt-4 flex flex-wrap gap-2">
                                                                {parent && (
                                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                        Parent:{" "}
                                                                        {
                                                                            parent.name
                                                                        }
                                                                    </span>
                                                                )}

                                                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                                                                    {
                                                                        children.length
                                                                    }{" "}
                                                                    subfolder
                                                                    {children.length !==
                                                                    1
                                                                        ? "s"
                                                                        : ""}
                                                                </span>

                                                                <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-600 dark:bg-green-950/30 dark:text-green-300">
                                                                    {
                                                                        folder
                                                                            .roles
                                                                            .length
                                                                    }{" "}
                                                                    roles
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    addChildFolder(
                                                                        folder.id,
                                                                    )
                                                                }
                                                                title="Add subfolder"
                                                                className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    deleteFolder(
                                                                        folder.id,
                                                                    )
                                                                }
                                                                title="Delete folder"
                                                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep ===
                        "roles" && (
                        <div className="p-6">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Roles &
                                    Assignment
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Select a folder
                                    and assign
                                    one or more
                                    mock roles.
                                </p>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                                    <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Folders
                                    </div>

                                    {draft.folders.map(
                                        folder => (
                                            <button
                                                key={
                                                    folder.id
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setSelectedFolderId(
                                                        folder.id,
                                                    )
                                                }
                                                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${
                                                    selectedFolderId ===
                                                    folder.id
                                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                                        : "hover:bg-white dark:hover:bg-slate-900"
                                                }`}
                                            >
                                                <Folder className="h-4 w-4 text-amber-500" />

                                                <span className="flex-1 truncate text-sm font-medium">
                                                    {
                                                        folder.name
                                                    }
                                                </span>

                                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-800">
                                                    {
                                                        folder
                                                            .roles
                                                            .length
                                                    }
                                                </span>
                                            </button>
                                        ),
                                    )}
                                </div>

                                <div>
                                    {selectedFolder ? (
                                        <>
                                            <div className="mb-5">
                                                <div className="text-xs uppercase tracking-wide text-slate-400">
                                                    Assigning
                                                    roles
                                                    to
                                                </div>

                                                <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                                                    {
                                                        selectedFolder.name
                                                    }
                                                </h3>
                                            </div>

                                            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {roles.map(
                                                    role => {
                                                        const assigned =
                                                            selectedFolder.roles.includes(
                                                                role,
                                                            );

                                                        return (
                                                            <button
                                                                key={
                                                                    role
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleRole(
                                                                        selectedFolder.id,
                                                                        role,
                                                                    )
                                                                }
                                                                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                                                                    assigned
                                                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                                                        : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                                                                }`}
                                                            >
                                                                <div
                                                                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                                                                        assigned
                                                                            ? "border-blue-600 bg-blue-600 text-white"
                                                                            : "border-slate-300 dark:border-slate-600"
                                                                    }`}
                                                                >
                                                                    {assigned && (
                                                                        <Check className="h-3 w-3" />
                                                                    )}
                                                                </div>

                                                                <UserPlus className="h-4 w-4 text-slate-400" />

                                                                <span className="text-sm font-medium">
                                                                    {
                                                                        role
                                                                    }
                                                                </span>
                                                            </button>
                                                        );
                                                    },
                                                )}
                                            </div>

                                            <div className="rounded-xl border border-dashed border-slate-300 p-5 dark:border-slate-700">
                                                <div className="mb-3 text-sm font-semibold">
                                                    Add New
                                                    Role
                                                </div>

                                                <div className="flex gap-3">
                                                    <input
                                                        value={
                                                            newRole
                                                        }
                                                        onChange={event =>
                                                            setNewRole(
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                        onKeyDown={event => {
                                                            if (
                                                                event.key ===
                                                                "Enter"
                                                            ) {
                                                                event.preventDefault();
                                                                addRole();
                                                            }
                                                        }}
                                                        placeholder="e.g. Legal Reviewer"
                                                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            addRole
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        Add Role
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-5">
                                                <div className="mb-3 text-sm font-semibold">
                                                    Available
                                                    Roles
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {roles.map(
                                                        role => (
                                                            <div
                                                                key={
                                                                    role
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                            >
                                                                {
                                                                    role
                                                                }

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeRole(
                                                                            role,
                                                                        )
                                                                    }
                                                                    className="text-slate-400 hover:text-red-500"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 dark:border-slate-700">
                                            Select a
                                            folder to
                                            assign
                                            roles.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="mb-4 font-semibold">
                                    Assignment
                                    Summary
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    {draft.folders.map(
                                        folder => (
                                            <div
                                                key={
                                                    folder.id
                                                }
                                                className="flex items-center justify-between rounded-lg bg-white px-4 py-3 dark:bg-slate-900"
                                            >
                                                <span className="text-sm font-medium">
                                                    {
                                                        folder.name
                                                    }
                                                </span>

                                                <div className="flex max-w-[60%] flex-wrap justify-end gap-1">
                                                    {folder.roles
                                                        .length ===
                                                    0 ? (
                                                        <span className="text-xs text-red-500">
                                                            No
                                                            roles
                                                        </span>
                                                    ) : (
                                                        folder.roles.map(
                                                            role => (
                                                                <span
                                                                    key={
                                                                        role
                                                                    }
                                                                    className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                                                                >
                                                                    {
                                                                        role
                                                                    }
                                                                </span>
                                                            ),
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={
                            goBack
                        }
                        disabled={
                            currentStepIndex ===
                                0 ||
                            creatingTemplate
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="text-sm text-slate-400">
                        Step{" "}
                        {currentStepIndex +
                            1}{" "}
                        of{" "}
                        {STEPS.length}
                    </div>

                    {currentStep !==
                    "roles" ? (
                        <button
                            type="button"
                            onClick={
                                goNext
                            }
                            disabled={
                                creatingTemplate
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Continue
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={
                                handleCreateTemplate
                            }
                            disabled={
                                creatingTemplate
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {creatingTemplate ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Create
                                    Template
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}