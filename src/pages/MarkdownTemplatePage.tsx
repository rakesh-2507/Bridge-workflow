import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Braces,
  CheckCircle2,
  FileText,
  Loader2,
  Play,
  RotateCcw,
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
  start_date?: string;
  end_date?: string;
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
 * DEFAULT MARKDOWN
 * ========================================================= */

const DEFAULT_MARKDOWN = `# Template: Magazine Publishing

## Description
Workflow for publishing a magazine issue.

## Project Type
Magazine

## Workflow
Magazine Publishing Workflow

## Workflow Scope
PROJECT

## Folders

### MANUSCRIPT SUBMISSION
Roles: Author, Editor

### EDITORIAL REVIEW
Roles: Editor, Reviewer

#### CONTENT REVIEW
Roles: Reviewer

### FINAL APPROVAL
Roles: Editor, Publisher`;

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
 * ========================================================= */

function parseMarkdown(
  markdown: string
): ParsedTemplate {
  const lines =
    markdown.split(/\r?\n/);

  const result =
    emptyTemplate();

  let currentSection = "";

  let currentFolder:
    | ParsedFolder
    | null = null;

  const folderStack: {
    level: number;
    index: number;
  }[] = [];

  for (
    let i = 0;
    i < lines.length;
    i += 1
  ) {
    const rawLine = lines[i];

    const line =
      rawLine.trim();

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
      line
        .toLowerCase() ===
      "## description"
    ) {
      currentSection =
        "description";

      continue;
    }

    if (
      line
        .toLowerCase() ===
      "## project type"
    ) {
      currentSection =
        "project_type";

      continue;
    }

    if (
      line
        .toLowerCase() ===
      "## workflow"
    ) {
      currentSection =
        "workflow";

      continue;
    }

    if (
      line
        .toLowerCase() ===
      "## workflow scope"
    ) {
      currentSection =
        "workflow_scope";

      continue;
    }

    if (
      line
        .toLowerCase() ===
      "## folders"
    ) {
      currentSection =
        "folders";

      currentFolder = null;

      folderStack.length = 0;

      continue;
    }

    /* =====================================================
       FOLDER
    ===================================================== */

    if (
      currentSection ===
        "folders" &&
      /^#{3,}\s+/.test(line)
    ) {
      const match =
        line.match(
          /^(#{3,})\s+(.+)$/
        );

      if (!match) {
        continue;
      }

      const headingLevel =
        match[1].length;

      const folderName =
        match[2].trim();

      const folderLevel =
        headingLevel - 3;

      while (
        folderStack.length > 0 &&
        folderStack[
          folderStack.length - 1
        ].level >= folderLevel
      ) {
        folderStack.pop();
      }

      const parentFolderIndex =
        folderStack.length > 0
          ? folderStack[
              folderStack.length - 1
            ].index
          : null;

      const folder: ParsedFolder =
        {
          name: folderName,
          description: "",
          parent_folder_index:
            parentFolderIndex,
          roles: [],
        };

      result.folders.push(
        folder
      );

      const folderIndex =
        result.folders.length - 1;

      folderStack.push({
        level: folderLevel,
        index: folderIndex,
      });

      currentFolder = folder;

      continue;
    }

    /* =====================================================
       FOLDER ROLES
    ===================================================== */

    if (
      currentSection ===
        "folders" &&
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
          .map(
            (role) =>
              role.trim()
          )
          .filter(Boolean);

      continue;
    }

    /* =====================================================
       FOLDER DESCRIPTION
    ===================================================== */

    if (
      currentSection ===
        "folders" &&
      currentFolder &&
      line
        .toLowerCase()
        .startsWith(
          "description:"
        )
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
       FOLDER START DATE
    ===================================================== */

    if (
      currentSection ===
        "folders" &&
      currentFolder &&
      line
        .toLowerCase()
        .startsWith(
          "start date:"
        )
    ) {
      currentFolder.start_date =
        line
          .replace(
            /^start date:/i,
            ""
          )
          .trim();

      continue;
    }

    /* =====================================================
       FOLDER END DATE
    ===================================================== */

    if (
      currentSection ===
        "folders" &&
      currentFolder &&
      line
        .toLowerCase()
        .startsWith(
          "end date:"
        )
    ) {
      currentFolder.end_date =
        line
          .replace(
            /^end date:/i,
            ""
          )
          .trim();

      continue;
    }

    /* =====================================================
       DESCRIPTION
    ===================================================== */

    if (
      currentSection ===
      "description"
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
      currentSection ===
      "project_type"
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
      currentSection ===
      "workflow"
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
      currentSection ===
      "workflow_scope"
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

  return result;
}

/* =========================================================
 * COMPONENT
 * ========================================================= */

function MarkdownTemplatePage() {
  const navigate =
    useNavigate();

  const [markdown, setMarkdown] =
    useState(
      DEFAULT_MARKDOWN
    );


  const [parseError, setParseError] =
    useState("");

  /* =====================================================
     API DATA
  ===================================================== */

  const [projectTypes, setProjectTypes] =
    useState<ProjectType[]>([]);

  const [workflowConfigs, setWorkflowConfigs] =
    useState<WorkflowConfig[]>([]);

  const [
    loadingReferenceData,
    setLoadingReferenceData,
  ] = useState(true);

  const [
    referenceDataError,
    setReferenceDataError,
  ] = useState("");

  /* =====================================================
     CREATE STATE
  ===================================================== */

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

  /* =====================================================
     LOAD PROJECT TYPES + WORKFLOW CONFIGS
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadReferenceData =
      async () => {
        try {
          setLoadingReferenceData(
            true
          );

          setReferenceDataError(
            ""
          );

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

  /* =====================================================
     LIVE JSON
  ===================================================== */

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

  /* =====================================================
     PARSE
  ===================================================== */

const handleParse = () => {
  try {
    setParseError("");

    parseMarkdown(markdown);
  } catch (error) {
      console.error(
        "Failed to parse Markdown:",
        error
      );

      setParseError(
        "Unable to parse the Markdown. Please check the format."
      );
    }
  };

  /* =====================================================
     RESET
  ===================================================== */

  const handleReset = () => {
    setMarkdown(
      DEFAULT_MARKDOWN
    );

    setParseError("");
    setCreateError("");
    setCreateSuccess("");
  };

  /* =====================================================
     CLEAR
  ===================================================== */

  const handleClear = () => {
    setMarkdown("");

    setParseError("");
    setCreateError("");
    setCreateSuccess("");
  };

  /* =====================================================
     RESOLVE PROJECT TYPE
  ===================================================== */

  const findProjectType =
    (name: string) => {
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

  /* =====================================================
     RESOLVE WORKFLOW
  ===================================================== */

  const findWorkflowConfig =
    (name: string) => {
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

  /* =====================================================
     VALIDATE
  ===================================================== */

  const validateTemplate =
    async (
      template: ParsedTemplate
    ) => {
      const errors: string[] = [];

      if (
        !template.project_template.name.trim()
      ) {
        errors.push(
          "Template name is required."
        );
      }

      if (
        !template.project_template.description.trim()
      ) {
        errors.push(
          "Template description is required."
        );
      }

      if (
        !template.project_template.project_type.trim()
      ) {
        errors.push(
          "Project Type is required."
        );
      }

      if (
        !template.project_template.workflow_config.trim()
      ) {
        errors.push(
          "Workflow is required."
        );
      }

      const scope =
        template.project_template.workflow_scope.toUpperCase();

      if (
        scope !== "FOLDER" &&
        scope !== "PROJECT"
      ) {
        errors.push(
          "Workflow Scope must be FOLDER or PROJECT."
        );
      }

      if (
        template.folders.length === 0
      ) {
        errors.push(
          "At least one folder is required."
        );
      }

      const projectType =
        findProjectType(
          template.project_template.project_type
        );

      if (!projectType) {
        errors.push(
          `Project Type "${template.project_template.project_type}" was not found.`
        );
      }

      const workflowConfig =
        findWorkflowConfig(
          template.project_template.workflow_config
        );

      if (!workflowConfig) {
        errors.push(
          `Workflow "${template.project_template.workflow_config}" was not found.`
        );
      }

      if (errors.length > 0) {
        throw new Error(
          errors.join("\n")
        );
      }

      /*
       * Check template name against backend.
       */

      const name =
        template.project_template.name.trim();

      const nameResponse =
        await checkProjectTemplateName(
          name
        );

      if (!nameResponse.available) {
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

  /* =====================================================
     BUILD API PAYLOAD
  ===================================================== */

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
            template.project_template.workflow_scope.toUpperCase(),
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

              ...(folder.start_date
                ? {
                    start_date:
                      folder.start_date,
                  }
                : {}),

              ...(folder.end_date
                ? {
                    end_date:
                      folder.end_date,
                  }
                : {}),

              roles:
                folder.roles,
            })
          ),
      };
    };

  /* =====================================================
     CREATE TEMPLATE
  ===================================================== */

  const handleCreateTemplate =
    async () => {
      try {
        setCreateError("");
        setCreateSuccess("");

        /*
         * Always parse the current Markdown.
         *
         * This prevents submitting an older
         * parsedJson when the user edited the
         * Markdown after clicking Parse.
         */

        const currentTemplate =
          parseMarkdown(
            markdown
          );

        setParseError("");

        /*
         * Reference data must be loaded.
         */

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

        /*
         * Validate.
         */

        const {
          projectType,
          workflowConfig,
        } =
          await validateTemplate(
            currentTemplate
          );

        /*
         * Build backend payload.
         */

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

        /*
         * API call.
         */

        setCreatingTemplate(
          true
        );

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

        /*
         * Give the success message
         * a moment before redirecting.
         */

        setTimeout(() => {
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
        setCreatingTemplate(
          false
        );
      }
    };

  /* =====================================================
     RENDER
  ===================================================== */

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
                <FileText
                  size={21}
                />
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
              onClick={handleReset}
              disabled={
                creatingTemplate
              }
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RotateCcw
                size={16}
              />

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

            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">

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
                  Write your template definition here.
                </p>
              </div>

              <button
                type="button"
                onClick={handleParse}
                disabled={
                  creatingTemplate
                }
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play
                  size={15}
                />

                Parse
              </button>

            </div>

            <div className="min-h-0 flex-1 p-4">

              <textarea
                value={markdown}
                onChange={(e) => {
                  setMarkdown(
                    e.target.value
                  );

                  setParseError("");
                  setCreateError("");
                  setCreateSuccess("");
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
Description: Manuscript submission folder
Roles: Author, Editor

### Review
Roles: Reviewer

#### Content Review
Roles: Reviewer`}
              />

            </div>

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
                  Preview of the parsed template.
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                Valid JSON
              </span>

            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">

              <pre className="min-h-full rounded-lg bg-gray-950 p-5 font-mono text-sm leading-6 text-gray-100">
                {JSON.stringify(
                  liveJson,
                  null,
                  2
                )}
              </pre>

            </div>

            {/* =================================================
                STATUS
            ================================================= */}

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

            {/* =================================================
                CREATE
            ================================================= */}

            <div className="shrink-0 border-t border-gray-200 p-4 dark:border-gray-800">

              <button
                type="button"
                onClick={
                  handleCreateTemplate
                }
                disabled={
                  creatingTemplate ||
                  loadingReferenceData
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

                    Loading...
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
