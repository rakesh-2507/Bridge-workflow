import { useMemo, useState } from "react";
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
type SourceFormat = "markdown" | "text";
type WorkflowScope = "PROJECT" | "FOLDER";

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
  projectTypeId: number;
  workflowConfigId: number;
  workflowScope: WorkflowScope;
  folders: TemplateFolder[];
}

interface MockProjectType {
  id: number;
  name: string;
  description: string;
}

interface MockWorkflow {
  id: number;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  description: string;
}

interface ParsedFolder {
  name: string;
  parentIndex: number | null;
  path: string;
}

interface ParsedRoleAssignment {
  role: string;
  folderTargets: string[];
}

interface ParsedSource {
  templateName: string;
  description: string;
  projectTypeName: string;
  workflowName: string;
  workflowScope: WorkflowScope;
  folders: ParsedFolder[];
  roles: string[];
  roleAssignments: ParsedRoleAssignment[];
}

const MOCK_TEXT = `Manuscript
  Draft
  Final
Review
  Content Review
  Copy Editing
Approval
  Final Approval`;

const MOCK_MARKDOWN = `# Magazine Publishing

Description: Magazine publishing project template
Project Type: Magazine Publishing
Workflow: Standard Publishing Workflow
Workflow Scope: PROJECT

## Folders

### Manuscript
#### Draft
#### Final

### Review
#### Content Review
#### Copy Editing

### Approval
#### Final Approval

## Roles

- Author
- Editor
- Reviewer
- Copy Editor
- Approver
- Project Manager

## Assignments

- Author: Manuscript, Manuscript/Draft
- Editor: Manuscript/Final
- Reviewer: Review, Review/Content Review
- Copy Editor: Review/Copy Editing
- Approver: Approval, Approval/Final Approval
- Project Manager: Manuscript, Review, Approval`;

const MOCK_PROJECT_TYPES: MockProjectType[] = [
  {
    id: 1,
    name: "Magazine Publishing",
    description: "Manage magazine content and publishing workflows.",
  },
  {
    id: 2,
    name: "Content Management",
    description: "Organize and manage content production.",
  },
  {
    id: 3,
    name: "Document Review",
    description: "Coordinate document review and approval.",
  },
  {
    id: 4,
    name: "Editorial Workflow",
    description: "Manage editorial production processes.",
  },
];

const MOCK_WORKFLOWS: MockWorkflow[] = [
  {
    id: 101,
    name: "Standard Publishing Workflow",
    status: "ACTIVE",
    description: "Standard workflow for publishing projects.",
  },
  {
    id: 102,
    name: "Editorial Review Workflow",
    status: "ACTIVE",
    description: "Editorial review and approval process.",
  },
  {
    id: 103,
    name: "Document Approval Workflow",
    status: "ACTIVE",
    description: "Document review and final approval process.",
  },
  {
    id: 104,
    name: "Archived Workflow",
    status: "INACTIVE",
    description: "Archived workflow configuration.",
  },
];

const STEPS: Array<{
  id: WizardStep;
  label: string;
  description: string;
}> = [
  {
    id: "source",
    label: "Source",
    description: "Choose template input",
  },
  {
    id: "details",
    label: "Details",
    description: "Review template details",
  },
  {
    id: "folders",
    label: "Folders",
    description: "Organize folder structure",
  },
  {
    id: "roles",
    label: "Roles",
    description: "Create and assign roles",
  },
];

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getIndentLevel(line: string): number {
  const leadingWhitespace = line.match(/^[\t ]*/)?.[0] ?? "";

  return leadingWhitespace.replace(/\t/g, "  ").length;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeFolderTarget(value: string): string {
  return value
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\s*\/\s*/g, "/")
    .toLowerCase();
}

function parseTextSource(
  text: string,
  templateNumber = 1,
): ParsedSource {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  const folders: ParsedFolder[] = [];
  const stack: Array<{ indent: number; index: number }> = [];

  for (const line of lines) {
    const name = line.trim();

    if (!name) {
      continue;
    }

    const indent = getIndentLevel(line);

    while (
      stack.length > 0 &&
      stack[stack.length - 1].indent >= indent
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
      path: "",
    });

    stack.push({
      indent,
      index: folderIndex,
    });
  }

  const folderPaths = buildParsedFolderPaths(folders);

  return {
    templateName: `Template ${templateNumber}`,
    description:
      folders.length > 0
        ? `Automatically generated project template containing ${folders.length} folder${folders.length === 1 ? "" : "s"}.`
        : "Automatically generated project template.",
    projectTypeName: MOCK_PROJECT_TYPES[0].name,
    workflowName:
      MOCK_WORKFLOWS.find((workflow) => workflow.status === "ACTIVE")
        ?.name ?? "",
    workflowScope: "PROJECT",
    folders: folderPaths,
    roles: [],
    roleAssignments: [],
  };
}

function buildParsedFolderPaths(
  folders: ParsedFolder[],
): ParsedFolder[] {
  return folders.map((folder, folderIndex) => ({
    ...folder,
    path: buildFolderPathFromIndexes(
      folders,
      folderIndex,
    ),
  }));
}
function buildFolderPathFromIndexes(
  folders: ParsedFolder[],
  index: number,
): string {
  const folder = folders[index];

  if (!folder) {
    return "";
  }

  if (folder.parentIndex === null) {
    return folder.name;
  }

  return `${buildFolderPathFromIndexes(
    folders,
    folder.parentIndex,
  )}/${folder.name}`;
}

function parseMarkdownSource(
  text: string,
  templateNumber = 1,
): ParsedSource {
  const lines = text.split(/\r?\n/);

  let templateName = "";
  let description = "";
  let projectTypeName = "";
  let workflowName = "";
  let workflowScope: WorkflowScope = "PROJECT";

  let section:
    | "root"
    | "folders"
    | "roles"
    | "assignments" = "root";

  const folders: ParsedFolder[] = [];
  const roles: string[] = [];
  const roleAssignments: ParsedRoleAssignment[] = [];

  const folderStack: Array<{
    level: number;
    index: number;
  }> = [];

  const addRole = (role: string) => {
    const cleanRole = role.trim();

    if (!cleanRole) {
      return;
    }

    if (
      !roles.some(
        (existingRole) =>
          normalizeText(existingRole) === normalizeText(cleanRole),
      )
    ) {
      roles.push(cleanRole);
    }
  };

  const addAssignment = (
    role: string,
    targets: string[],
  ) => {
    const cleanRole = role.trim();
    const cleanTargets = targets
      .map((target) => target.trim())
      .filter(Boolean);

    if (!cleanRole || cleanTargets.length === 0) {
      return;
    }

    addRole(cleanRole);

    const existing = roleAssignments.find(
      (assignment) =>
        normalizeText(assignment.role) ===
        normalizeText(cleanRole),
    );

    if (existing) {
      for (const target of cleanTargets) {
        if (
          !existing.folderTargets.some(
            (existingTarget) =>
              normalizeFolderTarget(existingTarget) ===
              normalizeFolderTarget(target),
          )
        ) {
          existing.folderTargets.push(target);
        }
      }

      return;
    }

    roleAssignments.push({
      role: cleanRole,
      folderTargets: cleanTargets,
    });
  };

  const addFolder = (
    name: string,
    level: number,
  ) => {
    const cleanName = name.trim();

    if (!cleanName) {
      return;
    }

    while (
      folderStack.length > 0 &&
      folderStack[folderStack.length - 1].level >= level
    ) {
      folderStack.pop();
    }

    const parentIndex =
      folderStack.length > 0
        ? folderStack[folderStack.length - 1].index
        : null;

    const index = folders.length;

    folders.push({
      name: cleanName,
      parentIndex,
      path: "",
    });

    folderStack.push({
      level,
      index,
    });
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      continue;
    }

    const metadataMatch = trimmed.match(
      /^(Description|Project Type|Workflow|Workflow Scope)\s*:\s*(.+)$/i,
    );

    if (metadataMatch) {
      const key = metadataMatch[1].toLowerCase();
      const value = metadataMatch[2].trim();

      if (key === "description") {
        description = value;
      } else if (key === "project type") {
        projectTypeName = value;
      } else if (key === "workflow") {
        workflowName = value;
      } else if (key === "workflow scope") {
        workflowScope =
          normalizeText(value) === "folder"
            ? "FOLDER"
            : "PROJECT";
      }

      continue;
    }

    const headingMatch = trimmed.match(
      /^(#{1,6})\s+(.+)$/,
    );

    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const normalizedTitle = normalizeText(title);

      if (level === 1) {
        templateName = title;
        continue;
      }

      if (
        level === 2 &&
        normalizedTitle === "folders"
      ) {
        section = "folders";
        folderStack.length = 0;
        continue;
      }

      if (
        level === 2 &&
        normalizedTitle === "roles"
      ) {
        section = "roles";
        folderStack.length = 0;
        continue;
      }

      if (
        level === 2 &&
        (
          normalizedTitle === "assignments" ||
          normalizedTitle === "role assignments" ||
          normalizedTitle === "role assignment"
        )
      ) {
        section = "assignments";
        folderStack.length = 0;
        continue;
      }

      if (
        section === "folders" ||
        (
          section === "root" &&
          level >= 2
        )
      ) {
        addFolder(title, level);
      }

      continue;
    }

    if (section === "roles") {
      const roleMatch = trimmed.match(
        /^[-*]\s+(.+)$/,
      );

      if (roleMatch) {
        const roleValue = roleMatch[1].trim();

        const inlineAssignment = roleValue.match(
          /^([^:]+):\s*(.+)$/,
        );

        if (inlineAssignment) {
          addAssignment(
            inlineAssignment[1],
            inlineAssignment[2].split(","),
          );
        } else {
          addRole(roleValue);
        }
      }

      continue;
    }

    if (section === "assignments") {
      const assignmentMatch = trimmed.match(
        /^[-*]\s+([^:]+):\s*(.+)$/,
      );

      if (assignmentMatch) {
        addAssignment(
          assignmentMatch[1],
          assignmentMatch[2].split(","),
        );
      }

      continue;
    }

    if (section === "folders") {
      const folderRoleMatch = trimmed.match(
        /^Roles?\s*:\s*(.+)$/i,
      );

      if (
        folderRoleMatch &&
        folders.length > 0
      ) {
        const currentFolder =
          folders[folders.length - 1];

        for (const role of folderRoleMatch[1].split(",")) {
          const cleanRole = role.trim();

          if (!cleanRole) {
            continue;
          }

          addAssignment(
            cleanRole,
            [currentFolder.name],
          );
        }
      }
    }
  }

  const parsedFolders =
    buildParsedFolderPaths(folders);

  return {
    templateName:
      templateName || `Template ${templateNumber}`,
    description:
      description ||
      `Project template for ${
        templateName || `Template ${templateNumber}`
      }.`,
    projectTypeName:
      projectTypeName || MOCK_PROJECT_TYPES[0].name,
    workflowName:
      workflowName ||
      MOCK_WORKFLOWS.find(
        (workflow) => workflow.status === "ACTIVE",
      )?.name ||
      "",
    workflowScope,
    folders: parsedFolders,
    roles,
    roleAssignments,
  };
}

function applyRoleAssignments(
  folders: TemplateFolder[],
  assignments: ParsedRoleAssignment[],
): TemplateFolder[] {
  const result = folders.map((folder) => ({
    ...folder,
    roles: [] as string[],
  }));

  for (const assignment of assignments) {
    for (const target of assignment.folderTargets) {
      const normalizedTarget =
        normalizeFolderTarget(target);

      const exactPathMatches = result.filter(
        (folder) =>
          normalizeFolderTarget(
            getFolderPathFromTemplateFolders(
              result,
              folder.id,
            ),
          ) === normalizedTarget,
      );

      const matches =
        exactPathMatches.length > 0
          ? exactPathMatches
          : result.filter(
              (folder) =>
                normalizeText(folder.name) ===
                normalizeText(target),
            );

      for (const folder of matches) {
        const roleAlreadyAssigned = folder.roles.some(
          (role) =>
            normalizeText(role) ===
            normalizeText(assignment.role),
        );

        if (!roleAlreadyAssigned) {
          folder.roles = [
            ...folder.roles,
            assignment.role,
          ];
        }
      }
    }
  }

  return result;
}

function getFolderPathFromTemplateFolders(
  folders: TemplateFolder[],
  folderId: string,
): string {
  const folder = folders.find(
    (item) => item.id === folderId,
  );

  if (!folder) {
    return "";
  }

  if (!folder.parentId) {
    return folder.name;
  }

  return `${getFolderPathFromTemplateFolders(
    folders,
    folder.parentId,
  )}/${folder.name}`;
}

function buildDraftFromParsed(
  parsed: ParsedSource,
  templateNumber = 1,
): TemplateDraft {
  const projectType =
    MOCK_PROJECT_TYPES.find(
      (item) =>
        normalizeText(item.name) ===
        normalizeText(parsed.projectTypeName),
    ) ?? MOCK_PROJECT_TYPES[0];

  const activeWorkflows =
    MOCK_WORKFLOWS.filter(
      (workflow) => workflow.status === "ACTIVE",
    );

  const workflow =
    activeWorkflows.find(
      (item) =>
        normalizeText(item.name) ===
        normalizeText(parsed.workflowName),
    ) ??
    activeWorkflows[0] ??
    MOCK_WORKFLOWS[0];

  const folders: TemplateFolder[] =
    parsed.folders.map((folder) => ({
      id: createId(),
      name: folder.name,
      description: `Folder for ${folder.name}.`,
      parentId:
        folder.parentIndex === null
          ? null
          : "",
      roles: [],
    }));

  parsed.folders.forEach((parsedFolder, index) => {
    if (parsedFolder.parentIndex !== null) {
      folders[index].parentId =
        folders[parsedFolder.parentIndex]?.id ?? null;
    }
  });

  const foldersWithAssignments =
    applyRoleAssignments(
      folders,
      parsed.roleAssignments,
    );

  return {
    name:
      parsed.templateName ||
      `Template ${templateNumber}`,
    description:
      parsed.description ||
      `Project template containing ${folders.length} folders.`,
    projectTypeId: projectType.id,
    workflowConfigId: workflow.id,
    workflowScope: parsed.workflowScope,
    folders: foldersWithAssignments,
  };
}

function buildInitialDraft(): TemplateDraft {
  return buildDraftFromParsed(
    parseTextSource(MOCK_TEXT, 1),
    1,
  );
}

export default function TemplateCreationWizard() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] =
    useState<WizardStep>("source");

  const [sourceFormat, setSourceFormat] =
    useState<SourceFormat>("text");

  const [sourceContents, setSourceContents] =
    useState<Record<SourceFormat, string>>({
      text: MOCK_TEXT,
      markdown: MOCK_MARKDOWN,
    });

  const [uploadedFileName, setUploadedFileName] =
    useState("");

  const [templateNumber, setTemplateNumber] =
    useState(1);

  const [draft, setDraft] =
    useState<TemplateDraft>(() =>
      buildInitialDraft(),
    );

  const [roles, setRoles] = useState<string[]>(
    [],
  );

  const [newRole, setNewRole] =
    useState("");

  const [selectedFolderId, setSelectedFolderId] =
    useState<string | null>(null);

  const [creatingTemplate, setCreatingTemplate] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [expandedFolders, setExpandedFolders] =
    useState<Record<string, boolean>>({});

  const sourceText = sourceContents[sourceFormat];

  const activeWorkflows = useMemo(
    () =>
      MOCK_WORKFLOWS.filter(
        (workflow) => workflow.status === "ACTIVE",
      ),
    [],
  );

  const selectedProjectType = useMemo(
    () =>
      MOCK_PROJECT_TYPES.find(
        (projectType) =>
          projectType.id === draft.projectTypeId,
      ),
    [draft.projectTypeId],
  );

  const selectedWorkflow = useMemo(
    () =>
      MOCK_WORKFLOWS.find(
        (workflow) =>
          workflow.id === draft.workflowConfigId,
      ),
    [draft.workflowConfigId],
  );

  const selectedFolder = useMemo(
    () =>
      draft.folders.find(
        (folder) =>
          folder.id === selectedFolderId,
      ),
    [draft.folders, selectedFolderId],
  );

  const currentStepIndex = STEPS.findIndex(
    (step) => step.id === currentStep,
  );

  const updateSourceText = (value: string) => {
    setSourceContents((previous) => ({
      ...previous,
      [sourceFormat]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSourceFormatChange = (
    format: SourceFormat,
  ) => {
    setSourceFormat(format);
    setUploadedFileName("");
    setError("");
    setSuccess("");
  };

  const handleFileUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase();

    const format: SourceFormat =
      extension === "md" ||
      extension === "markdown"
        ? "markdown"
        : "text";

    try {
      const content = await file.text();

      setSourceFormat(format);

      setSourceContents((previous) => ({
        ...previous,
        [format]: content,
      }));

      setUploadedFileName(file.name);
      setError("");
      setSuccess("");
    } catch {
      setError(
        "Unable to read the selected file.",
      );
    }

    event.target.value = "";
  };

  const loadMockData = () => {
    const mockContent =
      sourceFormat === "markdown"
        ? MOCK_MARKDOWN
        : MOCK_TEXT;

    setSourceContents((previous) => ({
      ...previous,
      [sourceFormat]: mockContent,
    }));

    setUploadedFileName("");
    setError("");
    setSuccess("");
  };

  const getNextTemplateNumber = () =>
    templateNumber + 1;

  const handleGenerateTemplate = () => {
    setError("");
    setSuccess("");

    if (!sourceText.trim()) {
      setError(
        sourceFormat === "markdown"
          ? "Enter Markdown content before continuing."
          : "Enter a folder structure before continuing.",
      );
      return;
    }

    const nextTemplateNumber =
      getNextTemplateNumber();

    const parsed =
      sourceFormat === "markdown"
        ? parseMarkdownSource(
            sourceText,
            nextTemplateNumber,
          )
        : parseTextSource(
            sourceText,
            nextTemplateNumber,
          );

    if (parsed.folders.length === 0) {
      setError(
        sourceFormat === "markdown"
          ? "No folders were found in the Markdown source. Add a Folders section with at least one folder."
          : "No folders were found. Add at least one folder to the text input.",
      );
      return;
    }

    const nextDraft =
      buildDraftFromParsed(
        parsed,
        nextTemplateNumber,
      );

    setDraft(nextDraft);

    setRoles(
      sourceFormat === "markdown"
        ? parsed.roles
        : [],
    );

    setTemplateNumber(
      nextTemplateNumber,
    );

    setSelectedFolderId(
      nextDraft.folders[0]?.id ?? null,
    );

    setExpandedFolders(
      Object.fromEntries(
        nextDraft.folders.map((folder) => [
          folder.id,
          true,
        ]),
      ),
    );

    setCurrentStep("details");
  };

  const handleReset = () => {
    const initialDraft =
      buildInitialDraft();

    setCurrentStep("source");
    setSourceFormat("text");

    setSourceContents({
      text: MOCK_TEXT,
      markdown: MOCK_MARKDOWN,
    });

    setUploadedFileName("");
    setTemplateNumber(1);
    setDraft(initialDraft);
    setRoles([]);
    setNewRole("");
    setSelectedFolderId(
      initialDraft.folders[0]?.id ?? null,
    );
    setCreatingTemplate(false);
    setError("");
    setSuccess("");
    setExpandedFolders(
      Object.fromEntries(
        initialDraft.folders.map((folder) => [
          folder.id,
          true,
        ]),
      ),
    );
  };

  const updateDraft = (
    updates: Partial<TemplateDraft>,
  ) => {
    setDraft((previous) => ({
      ...previous,
      ...updates,
    }));
  };

  const updateFolder = (
    folderId: string,
    updates: Partial<TemplateFolder>,
  ) => {
    setDraft((previous) => ({
      ...previous,
      folders: previous.folders.map(
        (folder) =>
          folder.id === folderId
            ? {
                ...folder,
                ...updates,
              }
            : folder,
      ),
    }));
  };

  const addFolder = (
    parentId: string | null = null,
  ) => {
    const newFolder: TemplateFolder = {
      id: createId(),
      name: "New Folder",
      description: "New template folder.",
      parentId,
      roles: [],
    };

    setDraft((previous) => ({
      ...previous,
      folders: [
        ...previous.folders,
        newFolder,
      ],
    }));

    setSelectedFolderId(newFolder.id);

    if (parentId) {
      setExpandedFolders((previous) => ({
        ...previous,
        [parentId]: true,
      }));
    }
  };

  const deleteFolder = (
    folderId: string,
  ) => {
    const folderIdsToDelete = new Set<string>([
      folderId,
    ]);

    let changed = true;

    while (changed) {
      changed = false;

      for (const folder of draft.folders) {
        if (
          folder.parentId &&
          folderIdsToDelete.has(
            folder.parentId,
          ) &&
          !folderIdsToDelete.has(folder.id)
        ) {
          folderIdsToDelete.add(folder.id);
          changed = true;
        }
      }
    }

    const remainingFolders =
      draft.folders.filter(
        (folder) =>
          !folderIdsToDelete.has(folder.id),
      );

    setDraft((previous) => ({
      ...previous,
      folders: remainingFolders,
    }));

    if (
      selectedFolderId &&
      folderIdsToDelete.has(selectedFolderId)
    ) {
      setSelectedFolderId(
        remainingFolders[0]?.id ?? null,
      );
    }
  };

  const toggleFolderExpanded = (
    folderId: string,
  ) => {
    setExpandedFolders((previous) => ({
      ...previous,
      [folderId]: !previous[folderId],
    }));
  };

  const addRole = () => {
    const role = newRole.trim();

    if (!role) {
      return;
    }

    const alreadyExists = roles.some(
      (existingRole) =>
        normalizeText(existingRole) ===
        normalizeText(role),
    );

    if (alreadyExists) {
      setError(
        "A role with this name already exists.",
      );
      return;
    }

    setRoles((previous) => [
      ...previous,
      role,
    ]);

    setNewRole("");
    setError("");
  };

  const removeRole = (
    roleToRemove: string,
  ) => {
    setRoles((previous) =>
      previous.filter(
        (role) => role !== roleToRemove,
      ),
    );

    setDraft((previous) => ({
      ...previous,
      folders: previous.folders.map(
        (folder) => ({
          ...folder,
          roles: folder.roles.filter(
            (role) =>
              role !== roleToRemove,
          ),
        }),
      ),
    }));
  };

  const toggleRoleAssignment = (
    folderId: string,
    role: string,
  ) => {
    setDraft((previous) => ({
      ...previous,
      folders: previous.folders.map(
        (folder) => {
          if (folder.id !== folderId) {
            return folder;
          }

          const hasRole =
            folder.roles.includes(role);

          return {
            ...folder,
            roles: hasRole
              ? folder.roles.filter(
                  (item) => item !== role,
                )
              : [...folder.roles, role],
          };
        },
      ),
    }));
  };

  const validateStep = (
    step: WizardStep,
  ): boolean => {
    setError("");

    if (step === "source") {
      if (!sourceText.trim()) {
        setError(
          "Please provide source content.",
        );
        return false;
      }

      return true;
    }

    if (step === "details") {
      if (!draft.name.trim()) {
        setError(
          "Template name is required.",
        );
        return false;
      }

      if (!draft.description.trim()) {
        setError(
          "Template description is required.",
        );
        return false;
      }

      if (!draft.projectTypeId) {
        setError(
          "Please select a project type.",
        );
        return false;
      }

      if (!draft.workflowConfigId) {
        setError(
          "Please select a workflow.",
        );
        return false;
      }

      return true;
    }

    if (step === "folders") {
      if (draft.folders.length === 0) {
        setError(
          "At least one folder is required.",
        );
        return false;
      }

      const invalidFolder =
        draft.folders.find(
          (folder) => !folder.name.trim(),
        );

      if (invalidFolder) {
        setError(
          "Every folder must have a name.",
        );
        return false;
      }

      return true;
    }

    if (step === "roles") {
      if (roles.length === 0) {
        setError(
          "Create at least one role.",
        );
        return false;
      }

      const unassignedFolder =
        draft.folders.find(
          (folder) =>
            folder.roles.length === 0,
        );

      if (unassignedFolder) {
        setError(
          `Assign at least one role to "${unassignedFolder.name}".`,
        );
        return false;
      }

      return true;
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    const nextIndex =
      currentStepIndex + 1;

    if (nextIndex >= STEPS.length) {
      return;
    }

    const nextStep =
      STEPS[nextIndex].id;

    if (
      nextStep === "roles" &&
      !selectedFolderId
    ) {
      setSelectedFolderId(
        draft.folders[0]?.id ?? null,
      );
    }

    setCurrentStep(nextStep);
    setError("");
  };

  const goBack = () => {
    const previousIndex =
      currentStepIndex - 1;

    if (previousIndex < 0) {
      return;
    }

    setCurrentStep(
      STEPS[previousIndex].id,
    );
    setError("");
  };

  const handleCreateTemplate = async () => {
    if (!validateStep("roles")) {
      return;
    }

    setCreatingTemplate(true);
    setError("");
    setSuccess("");

    const payload = {
      ...draft,
      sourceFormat,
      roles,
    };

    console.log(
      "Mock template creation payload:",
      payload,
    );

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 1200);
    });

    setCreatingTemplate(false);
    setSuccess(
      "Template created successfully.",
    );

    window.setTimeout(() => {
      navigate("/workflow-process");
    }, 700);
  };

  const getChildFolders = (
    parentId: string | null,
  ) =>
    draft.folders.filter(
      (folder) =>
        folder.parentId === parentId,
    );

  const renderFolderTree = (
    parentId: string | null,
    depth = 0,
  ): ReactNode => {
    const children =
      getChildFolders(parentId);

    if (children.length === 0) {
      return null;
    }

    return children.map((folder) => {
      const hasChildren =
        draft.folders.some(
          (child) =>
            child.parentId === folder.id,
        );

      const expanded =
        expandedFolders[folder.id] ?? true;

      const isSelected =
        selectedFolderId === folder.id;

      return (
        <div key={folder.id}>
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
              isSelected
                ? "bg-blue-50 ring-1 ring-blue-200"
                : "hover:bg-gray-50"
            }`}
            style={{
              marginLeft: depth * 24,
            }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() =>
                  toggleFolderExpanded(
                    folder.id,
                  )
                }
                className="rounded p-1 text-gray-500 hover:bg-gray-200"
              >
                {expanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}

            <button
              type="button"
              onClick={() =>
                setSelectedFolderId(
                  folder.id,
                )
              }
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <Folder
                size={17}
                className="shrink-0 text-amber-500"
              />

              <span className="truncate font-medium text-gray-800">
                {folder.name}
              </span>

              {folder.roles.length > 0 && (
                <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {folder.roles.length} role
                  {folder.roles.length === 1
                    ? ""
                    : "s"}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                addFolder(folder.id)
              }
              title="Add child folder"
              className="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
            >
              <Plus size={15} />
            </button>

            <button
              type="button"
              onClick={() =>
                deleteFolder(folder.id)
              }
              title="Delete folder"
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              <X size={15} />
            </button>
          </div>

          {hasChildren &&
            expanded &&
            renderFolderTree(
              folder.id,
              depth + 1,
            )}
        </div>
      );
    });
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        {STEPS.map((step, index) => {
          const isActive =
            step.id === currentStep;

          const isCompleted =
            index < currentStepIndex;

          return (
            <div
              key={step.id}
              className="flex flex-1 items-start"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                    isCompleted
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isActive
                        ? "border-blue-600 bg-white text-blue-600"
                        : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={18} />
                  ) : (
                    index + 1
                  )}
                </div>

                <div className="mt-2 text-center">
                  <div
                    className={`text-sm font-semibold ${
                      isActive ||
                      isCompleted
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </div>

                  <div className="hidden text-xs text-gray-500 md:block">
                    {step.description}
                  </div>
                </div>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`mt-5 h-0.5 flex-1 ${
                    index < currentStepIndex
                      ? "bg-blue-600"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSourceStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Choose template source
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Select how the template structure
          should be created.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() =>
            handleSourceFormatChange(
              "markdown",
            )
          }
          className={`rounded-xl border-2 p-5 text-left transition ${
            sourceFormat === "markdown"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`rounded-lg p-3 ${
                sourceFormat === "markdown"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <FileText size={22} />
            </div>

            <div>
              <div className="font-semibold text-gray-900">
                Markdown
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Define the template, folders,
                roles, and optional role
                assignments in Markdown.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            handleSourceFormatChange("text")
          }
          className={`rounded-xl border-2 p-5 text-left transition ${
            sourceFormat === "text"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`rounded-lg p-3 ${
                sourceFormat === "text"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Folder size={22} />
            </div>

            <div>
              <div className="font-semibold text-gray-900">
                Text
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Define only the folder
                hierarchy. Template details
                are generated automatically
                and roles are created in the
                final step.
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              {sourceFormat === "markdown"
                ? "Markdown template definition"
                : "Folder structure"}
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              {uploadedFileName ||
                "Paste content or upload a file."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Upload size={16} />
              Upload
              <input
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={loadMockData}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw size={16} />
              Load mock
            </button>
          </div>
        </div>

        <div className="p-5">
          <textarea
            value={sourceText}
            onChange={(event) =>
              updateSourceText(
                event.target.value,
              )
            }
            rows={18}
            spellCheck={false}
            className="w-full resize-y rounded-lg border border-gray-300 bg-gray-50 p-4 font-mono text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder={
              sourceFormat === "markdown"
                ? "# Template Name\n\nDescription: ...\nProject Type: ...\nWorkflow: ...\n\n## Folders\n### Folder\n#### Subfolder\n\n## Roles\n- Author\n- Editor\n\n## Assignments\n- Author: Folder\n- Editor: Folder/Subfolder"
                : "Folder\n  Subfolder\n    Nested Folder"
            }
          />
        </div>
      </div>

      {sourceFormat === "markdown" ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="font-semibold text-blue-900">
            Markdown format
          </h3>

          <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-4 text-xs leading-6 text-gray-700">
{`# Template Name

Description: Template description
Project Type: Magazine Publishing
Workflow: Standard Publishing Workflow
Workflow Scope: PROJECT

## Folders

### Manuscript
#### Draft
#### Final

### Review
#### Content Review

## Roles

- Author
- Editor
- Reviewer

## Assignments

- Author: Manuscript, Manuscript/Draft
- Editor: Review
- Reviewer: Review/Content Review`}
          </pre>

          <p className="mt-3 text-xs text-blue-800">
            Roles from Markdown are carried
            into the final Roles step, where
            their folder assignments can still
            be changed.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="font-semibold text-gray-900">
            Text format
          </h3>

          <pre className="mt-3 rounded-lg bg-white p-4 text-xs leading-6 text-gray-700">
{`Manuscript
  Draft
  Final
Review
  Content Review
  Copy Editing
Approval
  Final Approval`}
          </pre>

          <p className="mt-3 text-xs text-gray-600">
            Indentation determines folder
            nesting. Template details are
            generated automatically, and roles
            start empty so they can be created
            and assigned in the final step.
          </p>
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Template details
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Review and edit the generated or
          Markdown-provided template details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Template name
          </label>

          <input
            value={draft.name}
            onChange={(event) =>
              updateDraft({
                name: event.target.value,
              })
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Template name"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Description
          </label>

          <textarea
            value={draft.description}
            onChange={(event) =>
              updateDraft({
                description:
                  event.target.value,
              })
            }
            rows={4}
            className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Template description"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Project type
          </label>

          <select
            value={draft.projectTypeId}
            onChange={(event) =>
              updateDraft({
                projectTypeId: Number(
                  event.target.value,
                ),
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {MOCK_PROJECT_TYPES.map(
              (projectType) => (
                <option
                  key={projectType.id}
                  value={projectType.id}
                >
                  {projectType.name}
                </option>
              ),
            )}
          </select>

          {selectedProjectType && (
            <p className="mt-2 text-xs text-gray-500">
              {selectedProjectType.description}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Workflow
          </label>

          <select
            value={draft.workflowConfigId}
            onChange={(event) =>
              updateDraft({
                workflowConfigId: Number(
                  event.target.value,
                ),
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {activeWorkflows.map(
              (workflow) => (
                <option
                  key={workflow.id}
                  value={workflow.id}
                >
                  {workflow.name}
                </option>
              ),
            )}
          </select>

          {selectedWorkflow && (
            <p className="mt-2 text-xs text-gray-500">
              {selectedWorkflow.description}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Workflow scope
          </label>

          <select
            value={draft.workflowScope}
            onChange={(event) =>
              updateDraft({
                workflowScope:
                  event.target.value as WorkflowScope,
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="PROJECT">
              Project
            </option>
            <option value="FOLDER">
              Folder
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Source
          </label>

          <div className="flex h-[46px] items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700">
            {sourceFormat === "markdown" ? (
              <>
                <FileText
                  size={17}
                  className="text-blue-600"
                />
                Markdown
              </>
            ) : (
              <>
                <Folder
                  size={17}
                  className="text-amber-500"
                />
                Text
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Folders
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {draft.folders.length}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Roles
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {roles.length}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Workflow
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-gray-900">
            {selectedWorkflow?.name ??
              "Not selected"}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFoldersStep = () => (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Folder structure
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review the generated folder
            hierarchy and make any required
            changes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => addFolder(null)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <FolderPlus size={17} />
          Add root folder
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          {draft.folders.length > 0 ? (
            renderFolderTree(null)
          ) : (
            <div className="flex min-h-48 items-center justify-center text-center text-sm text-gray-500">
              No folders yet.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          {selectedFolder ? (
            <>
              <div className="flex items-center gap-2">
                <Folder
                  size={19}
                  className="text-amber-500"
                />

                <h3 className="font-semibold text-gray-900">
                  Folder details
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Name
                  </label>

                  <input
                    value={selectedFolder.name}
                    onChange={(event) =>
                      updateFolder(
                        selectedFolder.id,
                        {
                          name: event.target.value,
                        },
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Description
                  </label>

                  <textarea
                    value={
                      selectedFolder.description
                    }
                    onChange={(event) =>
                      updateFolder(
                        selectedFolder.id,
                        {
                          description:
                            event.target.value,
                        },
                      )
                    }
                    rows={5}
                    className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Parent
                  </label>

                  <select
                    value={
                      selectedFolder.parentId ??
                      ""
                    }
                    onChange={(event) => {
                      const newParentId =
                        event.target.value ||
                        null;

                      if (
                        newParentId ===
                        selectedFolder.id
                      ) {
                        return;
                      }

                      updateFolder(
                        selectedFolder.id,
                        {
                          parentId:
                            newParentId,
                        },
                      );
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Root folder
                    </option>

                    {draft.folders
                      .filter(
                        (folder) =>
                          folder.id !==
                          selectedFolder.id,
                      )
                      .map((folder) => (
                        <option
                          key={folder.id}
                          value={folder.id}
                        >
                          {folder.name}
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    addFolder(
                      selectedFolder.id,
                    )
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <Plus size={16} />
                  Add child folder
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteFolder(
                      selectedFolder.id,
                    )
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <X size={16} />
                  Delete folder
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-64 items-center justify-center text-center text-sm text-gray-500">
              Select a folder to edit its
              details.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRolesStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Roles and assignments
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {sourceFormat === "markdown"
            ? "Markdown roles have been loaded below. You can add, remove, and reassign them before creating the template."
            : "Create the project roles here and assign at least one role to every folder."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <UserPlus
                size={18}
                className="text-blue-600"
              />

              <h3 className="font-semibold text-gray-900">
                Roles
              </h3>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {roles.length} role
              {roles.length === 1 ? "" : "s"}{" "}
              created
            </p>
          </div>

          <div className="p-4">
            <div className="flex gap-2">
              <input
                value={newRole}
                onChange={(event) =>
                  setNewRole(
                    event.target.value,
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addRole();
                  }
                }}
                placeholder="Role name"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={addRole}
                className="rounded-lg bg-blue-600 px-3 text-white hover:bg-blue-700"
                title="Add role"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {roles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
                  No roles yet.
                  <br />
                  Add the first role above.
                </div>
              ) : (
                roles.map((role) => (
                  <div
                    key={role}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5"
                  >
                    <span className="truncate text-sm font-medium text-gray-800">
                      {role}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeRole(role)
                      }
                      className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title={`Remove ${role}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">
              Folder assignments
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Select the roles that should have
              access to each folder.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {draft.folders.map((folder) => (
              <div
                key={folder.id}
                className="p-4"
              >
                <div className="flex items-center gap-2">
                  <Folder
                    size={17}
                    className="text-amber-500"
                  />

                  <div>
                    <div className="font-medium text-gray-900">
                      {folder.name}
                    </div>

                    <div className="text-xs text-gray-500">
                      {getFolderPathFromTemplateFolders(
                        draft.folders,
                        folder.id,
                      )}
                    </div>
                  </div>
                </div>

                {roles.length === 0 ? (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                    Create a role to assign
                    it to this folder.
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {roles.map((role) => {
                      const assigned =
                        folder.roles.includes(
                          role,
                        );

                      return (
                        <button
                          key={`${folder.id}-${role}`}
                          type="button"
                          onClick={() =>
                            toggleRoleAssignment(
                              folder.id,
                              role,
                            )
                          }
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            assigned
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          {assigned && (
                            <Check size={13} />
                          )}
                          {role}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Total roles
            </div>

            <div className="mt-1 text-xl font-semibold text-gray-900">
              {roles.length}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Folders
            </div>

            <div className="mt-1 text-xl font-semibold text-gray-900">
              {draft.folders.length}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Assigned folders
            </div>

            <div className="mt-1 text-xl font-semibold text-gray-900">
              {
                draft.folders.filter(
                  (folder) =>
                    folder.roles.length > 0,
                ).length
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "source":
        return renderSourceStep();

      case "details":
        return renderDetailsStep();

      case "folders":
        return renderFoldersStep();

      case "roles":
        return renderRolesStep();

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create Template
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Build a reusable project template
              from Markdown or a folder structure.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <X
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>{success}</div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-5 sm:p-8">
            {renderCurrentStep()}
          </div>

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:px-8">
            <div>
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={creatingTemplate}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft size={17} />
                  Back
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {currentStep === "source" && (
                <button
                  type="button"
                  onClick={handleGenerateTemplate}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Generate Template
                  <ArrowRight size={17} />
                </button>
              )}

              {currentStep !== "source" &&
                currentStep !== "roles" && (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Continue
                    <ArrowRight size={17} />
                  </button>
                )}

              {currentStep === "roles" && (
                <button
                  type="button"
                  onClick={handleCreateTemplate}
                  disabled={creatingTemplate}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingTemplate ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      Create Template
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}