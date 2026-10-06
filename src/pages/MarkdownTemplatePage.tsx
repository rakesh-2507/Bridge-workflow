import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  Braces,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Play,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  checkProjectTemplateName,
  createProjectTemplate,
  getWorkflowConfigs,
} from "../api/projectTemplates";

import {
  getProjectTypes,
} from "../api/projectTypes";

import type {
  CreateProjectTemplatePayload,
  ProjectType,
  WorkflowConfig,
} from "../types/projectTemplate";

/* =========================================================
 * MARKDOWN TYPES
 * ========================================================= */

interface ParsedFolder {
  name: string;
  description: string;
  parent_folder_index: number | null;
  roles: string[];
}

interface ParsedTemplate {
  project_template: {
    name: string;
    description: string;
    project_type: string;
    workflow_config: string;
    workflow_scope: string;
  };

  folders: ParsedFolder[];
}

/* =========================================================
 * INTERNAL FOLDER PARSER TYPE
 *
 * Parent is initially stored by name.
 * After the entire Markdown document is parsed,
 * the parent name is converted to parent_folder_index.
 * ========================================================= */

interface ParsedFolderSource {
  name: string;
  description: string;
  parentName: string | null;
  roles: string[];
}

/* =========================================================
 * REFERENCE MARKDOWN
 * ========================================================= */

const REFERENCE_MARKDOWN = `# Template: Magazine Publishing

## Description
Template for publishing a magazine.

## Project Type
Magazine

## Workflow
Magazine Publishing Workflow

## Workflow Scope
PROJECT

## Folders

### Manuscript
Parent: Root
Description: Manuscript submission folder
Roles: Author, Editor

### Review
Parent: Root
Description: Editorial review folder
Roles: Reviewer

### Content Review
Parent: Review
Description: Content review folder
Roles: Reviewer

### Copy Editing
Parent: Review
Description: Copy editing folder
Roles: Copy Editor

### Final Approval
Parent: Root
Description: Final approval folder
Roles: Editor
`;

/* =========================================================
 * EMPTY TEMPLATE
 * ========================================================= */

const emptyTemplate = (): ParsedTemplate => ({
  project_template: {
    name: "",
    description: "",
    project_type: "",
    workflow_config: "",
    workflow_scope: "FOLDER",
  },

  folders: [],
});

/* =========================================================
 * MARKDOWN PARSER
 *
 * Folder hierarchy is now decided by:
 *
 * Parent: Root
 *
 * OR
 *
 * Parent: Another Folder
 *
 * Heading levels no longer determine the parent.
 * ========================================================= */

function parseMarkdown(
  markdown: string
): ParsedTemplate {
  const lines = markdown.split(/\r?\n/);

  const result = emptyTemplate();

  const folderSources: ParsedFolderSource[] = [];

  let currentSection = "";

  let currentFolder: ParsedFolderSource | null = null;
  for (
    let i = 0;
    i < lines.length;
    i += 1
  ) {
    const rawLine = lines[i];

    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    /* =====================================================
       TEMPLATE NAME
    ===================================================== */

    if (
      line
        .toLowerCase()
        .startsWith("# template:")
    ) {
      result.project_template.name =
        line
          .replace(
            /^#\s*template:/i,
            ""
          )
          .trim();

      currentSection = "";

      continue;
    }

    /* =====================================================
       SECTIONS
    ===================================================== */

    if (
      line.toLowerCase() ===
      "## description"
    ) {
      currentSection = "description";
      continue;
    }

    if (
      line.toLowerCase() ===
      "## project type"
    ) {
      currentSection = "project_type";
      continue;
    }

    if (
      line.toLowerCase() ===
      "## workflow"
    ) {
      currentSection = "workflow";
      continue;
    }

    if (
      line.toLowerCase() ===
      "## workflow scope"
    ) {
      currentSection = "workflow_scope";
      continue;
    }

    if (
      line.toLowerCase() ===
      "## folders"
    ) {
      currentSection = "folders";
      currentFolder = null;

      continue;
    }

    /* =====================================================
       FOLDER
    ===================================================== */

    if (
      currentSection === "folders" &&
      /^#{3,}\s+/.test(line)
    ) {
      const match = line.match(
        /^(#{3,})\s+(.+)$/
      );

      if (!match) {
        continue;
      }

      const folderName =
        match[2].trim();

      const folder: ParsedFolderSource = {
        name: folderName,
        description: "",
        parentName: null,
        roles: [],
      };

      folderSources.push(folder);

      currentFolder = folder;

      continue;
    }

    /* =====================================================
       PARENT FOLDER
    ===================================================== */

    if (
      currentSection === "folders" &&
      currentFolder &&
      line
        .toLowerCase()
        .startsWith("parent:")
    ) {
      const parentText =
        line
          .replace(
            /^parent:/i,
            ""
          )
          .trim();

      currentFolder.parentName =
        parentText || null;

      continue;
    }

    /* =====================================================
       FOLDER ROLES
    ===================================================== */

    if (
      currentSection === "folders" &&
      currentFolder &&
      line
        .toLowerCase()
        .startsWith("roles:")
    ) {
      const rolesText =
        line
          .replace(
            /^roles:/i,
            ""
          )
          .trim();

      currentFolder.roles =
        rolesText
          .split(",")
          .map((role) =>
            role.trim()
          )
          .filter(Boolean);

      continue;
    }

    /* =====================================================
       FOLDER DESCRIPTION
    ===================================================== */

    if (
      currentSection === "folders" &&
      currentFolder &&
      line
        .toLowerCase()
        .startsWith("description:")
    ) {
      currentFolder.description =
        line
          .replace(
            /^description:/i,
            ""
          )
          .trim();

      continue;
    }

    /* =====================================================
       TEMPLATE DESCRIPTION
    ===================================================== */

    if (
      currentSection === "description"
    ) {
      if (
        result.project_template
          .description
      ) {
        result.project_template.description +=
          `\n${line}`;
      } else {
        result.project_template.description =
          line;
      }

      continue;
    }

    /* =====================================================
       PROJECT TYPE
    ===================================================== */

    if (
      currentSection === "project_type"
    ) {
      result.project_template.project_type =
        line;

      currentSection = "";

      continue;
    }

    /* =====================================================
       WORKFLOW
    ===================================================== */

    if (
      currentSection === "workflow"
    ) {
      result.project_template.workflow_config =
        line;

      currentSection = "";

      continue;
    }

    /* =====================================================
       WORKFLOW SCOPE
    ===================================================== */

    if (
      currentSection === "workflow_scope"
    ) {
      const scope =
        line.toUpperCase();

      if (
        scope === "PROJECT" ||
        scope === "FOLDER"
      ) {
        result.project_template.workflow_scope =
          scope;
      }

      currentSection = "";

      continue;
    }
  }

  /* =======================================================
     RESOLVE PARENT NAMES
     
     This happens AFTER all folders have been parsed.
     
     Therefore this works even when the parent appears
     later in the Markdown file.
  ======================================================= */

  result.folders =
    folderSources.map(
      (folder) => {
        let parentFolderIndex:
          | number
          | null = null;

        if (
          folder.parentName &&
          folder.parentName
            .trim()
            .toLowerCase() !==
          "root"
        ) {
          const normalizedParent =
            folder.parentName
              .trim()
              .toLowerCase();

          const foundIndex =
            folderSources.findIndex(
              (candidate) =>
                candidate.name
                  .trim()
                  .toLowerCase() ===
                normalizedParent
            );

          parentFolderIndex =
            foundIndex >= 0
              ? foundIndex
              : null;
        }

        return {
          name: folder.name,
          description:
            folder.description,
          parent_folder_index:
            parentFolderIndex,
          roles: folder.roles,
        };
      }
    );

  return result;
}

/* =========================================================
 * COMPONENT
 * ========================================================= */

function MarkdownTemplatePage() {
  const navigate = useNavigate();

  /* =======================================================
     FILE INPUT
  ======================================================= */

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [
    uploadedFileName,
    setUploadedFileName,
  ] = useState("");

  /* =======================================================
     MARKDOWN
  ======================================================= */

  const [
    markdown,
    setMarkdown,
  ] = useState("");

  const [
    parseError,
    setParseError,
  ] = useState("");

  /* =======================================================
     API DATA
  ======================================================= */

  const [
    projectTypes,
    setProjectTypes,
  ] = useState<ProjectType[]>([]);

  const [
    workflowConfigs,
    setWorkflowConfigs,
  ] = useState<WorkflowConfig[]>([]);

  const [
    loadingReferenceData,
    setLoadingReferenceData,
  ] = useState(true);

  const [
    referenceDataError,
    setReferenceDataError,
  ] = useState("");

  /* =======================================================
     CREATE STATE
  ======================================================= */

  const [
    creatingTemplate,
    setCreatingTemplate,
  ] = useState(false);

  const [
    createError,
    setCreateError,
  ] = useState("");

  const [
    createSuccess,
    setCreateSuccess,
  ] = useState("");

  /* =======================================================
     LOAD REFERENCE DATA
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadReferenceData =
      async () => {
        try {
          setLoadingReferenceData(
            true
          );

          setReferenceDataError("");

          const [
            projectTypeResponse,
            workflowResponse,
          ] = await Promise.all([
            getProjectTypes(),
            getWorkflowConfigs(),
          ]);

          if (cancelled) {
            return;
          }

          setProjectTypes(
            projectTypeResponse.projecttypes
          );

          const activeConfigs =
            workflowResponse.data.configs.filter(
              (config) =>
                config.status
                  .toLowerCase() ===
                "active"
            );

          setWorkflowConfigs(
            activeConfigs
          );
        } catch (error) {
          console.error(
            "Failed to load template reference data:",
            error
          );

          if (!cancelled) {
            setReferenceDataError(
              "Unable to load project types and workflow configurations."
            );
          }
        } finally {
          if (!cancelled) {
            setLoadingReferenceData(
              false
            );
          }
        }
      };

    loadReferenceData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     LIVE JSON
  ======================================================= */

  const liveJson =
    useMemo(() => {
      try {
        return parseMarkdown(
          markdown
        );
      } catch {
        return emptyTemplate();
      }
    }, [markdown]);

  /* =======================================================
     CLEAR STATUS
  ======================================================= */

  const clearStatusMessages = () => {
    setParseError("");
    setCreateError("");
    setCreateSuccess("");
  };

  /* =======================================================
     UPLOAD MARKDOWN FILE
  ======================================================= */

  const handleMarkdownFileUpload =
    async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        clearStatusMessages();

        const lowerName =
          file.name.toLowerCase();

        const isMarkdownFile =
          lowerName.endsWith(".md") ||
          lowerName.endsWith(
            ".markdown"
          );

        if (!isMarkdownFile) {
          throw new Error(
            "Please select a Markdown (.md or .markdown) file."
          );
        }

        const content =
          await file.text();

        if (!content.trim()) {
          throw new Error(
            "The selected Markdown file is empty."
          );
        }

        setMarkdown(content);

        setUploadedFileName(
          file.name
        );
      } catch (error) {
        console.error(
          "Failed to read Markdown file:",
          error
        );

        setUploadedFileName("");

        setParseError(
          error instanceof Error
            ? error.message
            : "Unable to read the Markdown file."
        );
      } finally {
        event.target.value = "";
      }
    };

  /* =======================================================
     OPEN FILE SELECTOR
  ======================================================= */

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /* =======================================================
     REMOVE UPLOADED FILE
  ======================================================= */

  const handleRemoveUploadedFile =
    () => {
      setUploadedFileName("");
      setMarkdown("");
      clearStatusMessages();
    };

  /* =======================================================
     DOWNLOAD REFERENCE MARKDOWN
  ======================================================= */

  const handleDownloadReference =
    () => {
      const blob =
        new Blob(
          [REFERENCE_MARKDOWN],
          {
            type: "text/markdown;charset=utf-8",
          }
        );

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href = url;

      anchor.download =
        "project-template-reference.md";

      document.body.appendChild(
        anchor
      );

      anchor.click();

      document.body.removeChild(
        anchor
      );

      URL.revokeObjectURL(url);
    };

  /* =======================================================
     VALIDATE MARKDOWN PARSE
  ======================================================= */

  const validateParsedMarkdown =
    (
      parsed: ParsedTemplate
    ) => {
      if (
        !parsed.project_template.name.trim()
      ) {
        throw new Error(
          "Template name is required."
        );
      }

      if (
        !parsed.project_template.description.trim()
      ) {
        throw new Error(
          "Template description is required."
        );
      }

      if (
        !parsed.project_template.project_type.trim()
      ) {
        throw new Error(
          "Project Type is required."
        );
      }

      if (
        !parsed.project_template.workflow_config.trim()
      ) {
        throw new Error(
          "Workflow is required."
        );
      }

      const scope =
        parsed.project_template.workflow_scope
          .trim()
          .toUpperCase();

      if (
        scope !== "FOLDER" &&
        scope !== "PROJECT"
      ) {
        throw new Error(
          "Workflow Scope must be FOLDER or PROJECT."
        );
      }

      if (
        parsed.folders.length === 0
      ) {
        throw new Error(
          "At least one folder is required."
        );
      }

      /* ===================================================
         FOLDER VALIDATION
      =================================================== */

      const folderNames =
        new Map<string, number>();

      parsed.folders.forEach(
        (folder, index) => {
          const normalizedName =
            folder.name
              .trim()
              .toLowerCase();

          if (!folder.name.trim()) {
            throw new Error(
              `Folder ${index + 1} must have a name.`
            );
          }

          if (
            !folder.description.trim()
          ) {
            throw new Error(
              `Folder "${folder.name}" requires a description.`
            );
          }

          if (
            folder.roles.length === 0
          ) {
            throw new Error(
              `Folder "${folder.name}" requires at least one role.`
            );
          }

          /* ===============================================
             DUPLICATE FOLDER NAME
             
             Parent is selected by folder name in Markdown,
             therefore names must be unique.
          =============================================== */

          if (
            folderNames.has(
              normalizedName
            )
          ) {
            throw new Error(
              `Duplicate folder name "${folder.name}" is not allowed.`
            );
          }

          folderNames.set(
            normalizedName,
            index
          );
        }
      );

      /* ===================================================
         VALIDATE PARENT INDEX
      =================================================== */

      parsed.folders.forEach(
        (folder) => {
          if (
            folder.parent_folder_index ===
            null
          ) {
            return;
          }

          if (
            folder.parent_folder_index <
            0 ||
            folder.parent_folder_index >=
            parsed.folders.length
          ) {
            throw new Error(
              `Invalid parent folder for "${folder.name}".`
            );
          }

          const parent =
            parsed.folders[
            folder.parent_folder_index
            ];

          if (
            parent.name
              .trim()
              .toLowerCase() ===
            folder.name
              .trim()
              .toLowerCase()
          ) {
            throw new Error(
              `Folder "${folder.name}" cannot be its own parent.`
            );
          }
        }
      );

      /* ===================================================
         CYCLE DETECTION
      =================================================== */

      parsed.folders.forEach(
        (folder, folderIndex) => {
          const visited =
            new Set<number>();

          let currentIndex:
            | number
            | null =
            folderIndex;

          while (
            currentIndex !== null
          ) {
            if (
              visited.has(
                currentIndex
              )
            ) {
              throw new Error(
                `Circular parent relationship detected involving "${folder.name}".`
              );
            }

            visited.add(
              currentIndex
            );

            const folderAtIndex: ParsedFolder =
              parsed.folders[currentIndex];

            currentIndex =
              folderAtIndex.parent_folder_index;
          }
        }
      );
    };

  /* =======================================================
     PARSE
  ======================================================= */

  const handleParse = () => {
    try {
      setParseError("");

      const parsed =
        parseMarkdown(markdown);

      validateParsedMarkdown(
        parsed
      );
    } catch (error) {
      console.error(
        "Failed to parse Markdown:",
        error
      );

      setParseError(
        error instanceof Error
          ? error.message
          : "Unable to parse the Markdown. Please check the format."
      );
    }
  };

  /* =======================================================
     RESET
  ======================================================= */

  const handleReset = () => {
    setMarkdown("");
    setUploadedFileName("");

    clearStatusMessages();
  };

  /* =======================================================
     CLEAR
  ======================================================= */

  const handleClear = () => {
    setMarkdown("");
    setUploadedFileName("");

    clearStatusMessages();
  };

  /* =======================================================
     RESOLVE PROJECT TYPE
  ======================================================= */

  const findProjectType =
    (
      name: string
    ) => {
      const normalized =
        name
          .trim()
          .toLowerCase();

      return projectTypes.find(
        (type) =>
          type.projecttype
            .trim()
            .toLowerCase() ===
          normalized
      );
    };

  /* =======================================================
     RESOLVE WORKFLOW
  ======================================================= */

  const findWorkflowConfig =
    (
      name: string
    ) => {
      const normalized =
        name
          .trim()
          .toLowerCase();

      return workflowConfigs.find(
        (config) =>
          config.name
            .trim()
            .toLowerCase() ===
          normalized
      );
    };

  /* =======================================================
     VALIDATE TEMPLATE
  ======================================================= */

  const validateTemplate =
    async (
      template: ParsedTemplate
    ) => {
      const errors: string[] = [];

      try {
        validateParsedMarkdown(
          template
        );
      } catch (error) {
        errors.push(
          error instanceof Error
            ? error.message
            : "Invalid Markdown template."
        );
      }

      const projectType =
        findProjectType(
          template.project_template
            .project_type
        );

      if (
        !projectType &&
        template.project_template
          .project_type
          .trim()
      ) {
        errors.push(
          `Project Type "${template.project_template.project_type}" was not found in the API data.`
        );
      }

      const workflowConfig =
        findWorkflowConfig(
          template.project_template
            .workflow_config
        );

      if (
        !workflowConfig &&
        template.project_template
          .workflow_config
          .trim()
      ) {
        errors.push(
          `Workflow "${template.project_template.workflow_config}" was not found in the API data.`
        );
      }

      if (errors.length > 0) {
        throw new Error(
          errors.join("\n")
        );
      }

      /* ===================================================
         CHECK TEMPLATE NAME USING BACKEND
      =================================================== */

      const name =
        template.project_template.name.trim();

      const nameResponse =
        await checkProjectTemplateName(
          name
        );

      if (
        !nameResponse.available
      ) {
        throw new Error(
          nameResponse.message ||
          "Project template name already exists."
        );
      }

      return {
        projectType:
          projectType as ProjectType,

        workflowConfig:
          workflowConfig as WorkflowConfig,
      };
    };

  /* =======================================================
     BUILD API PAYLOAD
     
     IMPORTANT:
     No start_date / end_date are included here.
     
     Dates belong to actual project creation.
  ======================================================= */

  const buildPayload =
    (
      template: ParsedTemplate,
      projectType: ProjectType,
      workflowConfig: WorkflowConfig
    ): CreateProjectTemplatePayload => {
      return {
        project_template: {
          name:
            template.project_template.name.trim(),

          description:
            template.project_template.description.trim(),

          project_type_id:
            projectType.ptypeid,

          workflow_config_id:
            workflowConfig.id,

          workflow_scope:
            template.project_template.workflow_scope
              .trim()
              .toUpperCase(),
        },

        folders:
          template.folders.map(
            (folder) => ({
              name:
                folder.name.trim(),

              description:
                folder.description.trim(),

              parent_folder_index:
                folder.parent_folder_index,

              roles:
                folder.roles.map(
                  (role) =>
                    role.trim()
                ),
            })
          ),
      };
    };

  /* =======================================================
     CREATE TEMPLATE
  ======================================================= */

  const handleCreateTemplate =
    async () => {
      try {
        setCreateError("");
        setCreateSuccess("");
        setParseError("");

        /* ================================================
           CHECK REFERENCE DATA
        ================================================= */

        if (
          loadingReferenceData
        ) {
          setCreateError(
            "Please wait while project types and workflow configurations are loading."
          );

          return;
        }

        if (
          referenceDataError
        ) {
          setCreateError(
            referenceDataError
          );

          return;
        }

        /* ================================================
           CHECK MARKDOWN
        ================================================= */

        if (!markdown.trim()) {
          setCreateError(
            "Please enter or upload a Markdown template."
          );

          return;
        }

        /* ================================================
           PARSE CURRENT MARKDOWN
        ================================================= */

        const currentTemplate =
          parseMarkdown(markdown);

        /* ================================================
           VALIDATE + RESOLVE API IDS
        ================================================= */

        const {
          projectType,
          workflowConfig,
        } =
          await validateTemplate(
            currentTemplate
          );

        /* ================================================
           BUILD BACKEND PAYLOAD
        ================================================= */

        const payload =
          buildPayload(
            currentTemplate,
            projectType,
            workflowConfig
          );

        console.log(
          "Create project template payload:",
          payload
        );

        /* ================================================
           CREATE USING API
        ================================================= */

        setCreatingTemplate(true);

        const response =
          await createProjectTemplate(
            payload
          );

        console.log(
          "Create project template response:",
          response
        );

        setCreateSuccess(
          "Project template created successfully."
        );

        /* ================================================
           REDIRECT
        ================================================= */

        window.setTimeout(() => {
          navigate(
            "/workflow-process"
          );
        }, 800);
      } catch (error) {
        console.error(
          "Failed to create project template:",
          error
        );

        if (
          error instanceof Error
        ) {
          setCreateError(
            error.message ||
            "Unable to create project template."
          );
        } else {
          setCreateError(
            "Unable to create project template. Please try again."
          );
        }
      } finally {
        setCreatingTemplate(false);
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50 dark:bg-gray-950">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">

        <div className="flex items-center justify-between gap-4">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <FileText size={21} />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create Template from Markdown
                </h1>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Define your project template using Markdown and create it directly.
                </p>
              </div>

            </div>
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={
                handleDownloadReference
              }
              disabled={
                creatingTemplate
              }
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Download size={16} />
              Reference
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={
                creatingTemplate
              }
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={
                creatingTemplate
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Clear
            </button>

          </div>

        </div>
      </div>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div className="min-h-0 flex-1 overflow-hidden p-6">

        <div className="grid h-full min-h-0 grid-cols-1 gap-6 xl:grid-cols-2">

          {/* =================================================
              MARKDOWN
          ================================================= */}

          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

            <div className="shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-800">

              <div className="flex items-center justify-between gap-4">

                <div>
                  <div className="flex items-center gap-2">

                    <FileText
                      size={18}
                      className="text-blue-600 dark:text-blue-400"
                    />

                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Markdown
                    </h2>

                  </div>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Use <strong>Parent:</strong> to decide the folder hierarchy.
                  </p>
                </div>

                <div className="flex items-center gap-2">

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.markdown,text/markdown,text/plain"
                    className="hidden"
                    onChange={
                      handleMarkdownFileUpload
                    }
                  />

                  <button
                    type="button"
                    onClick={
                      handleUploadClick
                    }
                    disabled={
                      creatingTemplate
                    }
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Upload size={15} />
                    Upload
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleParse
                    }
                    disabled={
                      creatingTemplate ||
                      !markdown.trim()
                    }
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Play size={15} />
                    Parse
                  </button>

                </div>

              </div>

              {/* UPLOADED FILE */}

              {uploadedFileName && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/30">

                  <div className="flex min-w-0 items-center gap-2">

                    <FileText
                      size={15}
                      className="shrink-0 text-blue-600 dark:text-blue-400"
                    />

                    <span className="truncate text-xs font-medium text-blue-700 dark:text-blue-300">
                      {uploadedFileName}
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleRemoveUploadedFile
                    }
                    disabled={
                      creatingTemplate
                    }
                    title="Remove uploaded file"
                    className="rounded-md p-1 text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-900/40"
                  >
                    <X size={15} />
                  </button>

                </div>
              )}

            </div>

            {/* TEXTAREA */}

            <div className="min-h-0 flex-1 p-4">

              <textarea
                value={markdown}
                onChange={(event) => {
                  setMarkdown(
                    event.target.value
                  );

                  setUploadedFileName(
                    ""
                  );

                  clearStatusMessages();
                }}
                spellCheck={false}
                disabled={
                  creatingTemplate
                }
                className="h-full min-h-[500px] w-full resize-none rounded-lg border border-gray-300 bg-gray-50 p-5 font-mono text-sm leading-6 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                placeholder={`# Template: My Template

## Description
Describe your template.

## Project Type
Magazine

## Workflow
Magazine Publishing Workflow

## Workflow Scope
PROJECT

## Folders

### Manuscript
Parent: Root
Description: Manuscript submission folder
Roles: Author, Editor

### Review
Parent: Root
Description: Editorial review folder
Roles: Reviewer

### Content Review
Parent: Review
Description: Content review folder
Roles: Reviewer`}
              />

            </div>

            {/* PARSE ERROR */}

            {parseError && (
              <div className="mx-4 mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">

                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <p className="whitespace-pre-line text-sm text-red-600 dark:text-red-400">
                  {parseError}
                </p>

              </div>
            )}

          </div>

          {/* =================================================
              JSON
          ================================================= */}

          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">

              <div>

                <div className="flex items-center gap-2">

                  <Braces
                    size={18}
                    className="text-purple-600 dark:text-purple-400"
                  />

                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Generated JSON
                  </h2>

                </div>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Preview of the parsed Markdown template.
                </p>

              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                Live
              </span>

            </div>

            {/* JSON */}

            <div className="min-h-0 flex-1 overflow-auto p-4">

              <pre className="min-h-full rounded-lg bg-gray-950 p-5 font-mono text-sm leading-6 text-gray-100">
                {JSON.stringify(
                  liveJson,
                  null,
                  2
                )}
              </pre>

            </div>

            {/* REFERENCE DATA ERROR */}

            {referenceDataError && (
              <div className="mx-4 mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">

                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <p className="text-sm text-red-600 dark:text-red-400">
                  {referenceDataError}
                </p>

              </div>
            )}

            {/* CREATE ERROR */}

            {createError && (
              <div className="mx-4 mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">

                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <p className="whitespace-pre-line text-sm text-red-600 dark:text-red-400">
                  {createError}
                </p>

              </div>
            )}

            {/* SUCCESS */}

            {createSuccess && (
              <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">

                <CheckCircle2
                  size={17}
                  className="shrink-0 text-green-500"
                />

                <p className="text-sm text-green-600 dark:text-green-400">
                  {createSuccess}
                </p>

              </div>
            )}

            {/* CREATE */}

            <div className="shrink-0 border-t border-gray-200 p-4 dark:border-gray-800">

              <button
                type="button"
                onClick={
                  handleCreateTemplate
                }
                disabled={
                  creatingTemplate ||
                  loadingReferenceData ||
                  !markdown.trim()
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {creatingTemplate ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Creating Template...
                  </>
                ) : loadingReferenceData ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Loading API Data...
                  </>
                ) : (
                  <>
                    <FileText
                      size={18}
                    />

                    Create Template
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default MarkdownTemplatePage;
