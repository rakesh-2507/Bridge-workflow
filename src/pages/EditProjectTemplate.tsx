import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";

import TemplateStep from "../components/project-template/TemplateStep";
import FoldersStep from "../components/project-template/FoldersStep";
import RolesStep from "../components/project-template/RolesStep";

import {
  editProjectTemplate,
  getProjectTemplate,
  updateWorkflowProcessName,
} from "../api/projectTemplates";

import type {
  EditProjectTemplateFolder,
  EditProjectTemplatePayload,
  ProjectTemplateDetails,
  ProjectTemplateFolder,
} from "../types/projectTemplate";

type Step = 1 | 2 | 3;

const emptyTemplateDetails: ProjectTemplateDetails = {
  name: "",
  description: "",
  project_type_id: 0,
  workflow_config_id: "",
  workflow_scope: "FOLDER",
};

function EditProjectTemplate() {
  const navigate = useNavigate();

  const { templateId } =
    useParams<{ templateId: string }>();

  const [searchParams] = useSearchParams();

  /*
   * Example URL:
   *
   * /project-template/56/edit?processId=12
   *
   * templateId = 56
   * processId  = 12
   */
  const processId =
    searchParams.get("processId");

  const [currentStep, setCurrentStep] =
    useState<Step>(1);

  const [template, setTemplate] =
    useState<ProjectTemplateDetails>(
      emptyTemplateDetails
    );

  const [folders, setFolders] =
    useState<ProjectTemplateFolder[]>([]);

  /*
   * Original template name.
   *
   * Used by TemplateStep to allow the existing
   * name without triggering a duplicate-name error.
   */
  const [
    originalTemplateName,
    setOriginalTemplateName,
  ] = useState("");

  /*
   * Existing roles from the backend.
   */
  const [availableRoles, setAvailableRoles] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /* =========================================================
   * LOAD TEMPLATE
   * ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadTemplate = async () => {
      if (!templateId) {
        setError(
          "Template ID is missing."
        );
        setLoading(false);
        return;
      }

      const id = Number(templateId);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        setError(
          "Invalid template ID."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await getProjectTemplate(id);

        if (cancelled) {
          return;
        }

        const data = response.data;

        /* -----------------------------------------
         * Template details
         * ----------------------------------------- */

        const loadedTemplateName =
          data.template.name ?? "";

        setOriginalTemplateName(
          loadedTemplateName
        );

        setTemplate({
          name: loadedTemplateName,

          description:
            data.template.name_desc ?? "",

          project_type_id:
            data.template.projecttype ?? 0,

          workflow_config_id:
            data.template.workflow_config_id ??
            "",

          workflow_scope:
            data.template.workflow_scope ??
            "FOLDER",
        });

        /* -----------------------------------------
         * Folders
         * ----------------------------------------- */

        const loadedFolders:
          ProjectTemplateFolder[] =
          data.folders.map(
            (folder) => ({
              id: String(
                folder.fid
              ),

              name:
                folder.fname ?? "",

              description:
                folder.fnamedesc ?? "",

              parentFolderId:
                folder.pid === null ||
                folder.pid === undefined
                  ? null
                  : String(
                      folder.pid
                    ),

              roles:
                Array.isArray(
                  folder.roles
                )
                  ? [
                      ...folder.roles,
                    ]
                  : [],
            })
          );

        setFolders(
          loadedFolders
        );

        /* -----------------------------------------
         * Existing roles
         * ----------------------------------------- */

        const roles =
          Array.from(
            new Set(
              loadedFolders.flatMap(
                (folder) =>
                  Array.isArray(
                    folder.roles
                  )
                    ? folder.roles
                    : []
              )
            )
          ).sort((a, b) =>
            a.localeCompare(b)
          );

        setAvailableRoles(
          roles
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load project template:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load project template."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  /* =========================================================
   * NAVIGATION
   * ========================================================= */

  const handleBack = () => {
    /*
     * On step 1 return to the workflow process.
     */
    if (currentStep === 1) {
      if (processId) {
        navigate(
          `/workflow-process/${processId}`
        );
      } else {
        navigate(-1);
      }

      return;
    }

    /*
     * Step 2 -> Step 1
     * Step 3 -> Step 2
     */
    setCurrentStep(
      (step) => (step - 1) as Step
    );
  };

  const handleTemplateNext = () => {
    setCurrentStep(2);
  };

  const handleFoldersNext = () => {
    setCurrentStep(3);
  };

  /* =========================================================
   * BUILD EDIT FOLDERS
   * ========================================================= */

  const buildEditFolders =
    (): EditProjectTemplateFolder[] => {
      return folders.map(
        (folder) => {
          let parentFolderIndex:
            | number
            | null = null;

          /*
           * Convert parentFolderId into
           * the array index expected by
           * the edit API.
           */
          if (
            folder.parentFolderId !==
            null
          ) {
            const parentIndex =
              folders.findIndex(
                (parentFolder) =>
                  parentFolder.id ===
                  folder.parentFolderId
              );

            if (
              parentIndex >= 0
            ) {
              parentFolderIndex =
                parentIndex;
            }
          }

          const parsedId =
            Number(folder.id);

          return {
            /*
             * Existing folder:
             * database ID.
             *
             * New folder:
             * 0.
             */
            fid:
              Number.isInteger(
                parsedId
              )
                ? parsedId
                : 0,

            name:
              folder.name.trim(),

            description:
              folder.description.trim(),

            parent_folder_index:
              parentFolderIndex,

            roles: [
              ...folder.roles,
            ],
          };
        }
      );
    };

  /* =========================================================
   * UPDATE TEMPLATE + PROCESS
   * ========================================================= */

  const handleSubmit = async () => {
    /* -----------------------------------------
     * Validate template ID
     * ----------------------------------------- */

    if (!templateId) {
      setError(
        "Template ID is missing."
      );
      return;
    }

    const id = Number(templateId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      setError(
        "Invalid template ID."
      );
      return;
    }

    /* -----------------------------------------
     * Validate template name
     * ----------------------------------------- */

    const templateName =
      template.name.trim();

    if (!templateName) {
      setError(
        "Template name is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      /* -----------------------------------------
       * Build template payload
       * ----------------------------------------- */

      const payload:
        EditProjectTemplatePayload = {
        project_template: {
          name: templateName,

          description:
            template.description.trim(),

          project_type_id:
            template.project_type_id,

          workflow_config_id:
            template.workflow_config_id,

          workflow_scope:
            template.workflow_scope,
        },

        folders:
          buildEditFolders(),
      };

      console.log(
        "Edit project template payload:",
        payload
      );

      /* =========================================
       * STEP 1
       *
       * Update project template
       * ========================================= */

      await editProjectTemplate(
        id,
        payload
      );

      console.log(
        "Project template updated successfully."
      );

      /* =========================================
       * STEP 2
       *
       * Update linked workflow process name
       * ========================================= */

      if (processId) {
        const parsedProcessId =
          Number(processId);

        if (
          Number.isInteger(
            parsedProcessId
          ) &&
          parsedProcessId > 0
        ) {
          console.log(
            "Updating workflow process:",
            {
              processId:
                parsedProcessId,

              processName:
                templateName,
            }
          );

          await updateWorkflowProcessName(
            parsedProcessId,
            templateName
          );

          console.log(
            "Workflow process name updated successfully."
          );
        }
      }

      /* =========================================
       * STEP 3
       *
       * Show success popup
       * ========================================= */

      setSuccessMessage(
        processId
          ? "Project template and workflow process updated successfully."
          : "Project template updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to update project template:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update project template."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
   * SUCCESS POPUP NAVIGATION
   * ========================================================= */

  const handleSuccessClose =
    () => {
      setSuccessMessage("");

      /*
       * Return to the exact workflow process
       * that opened the template editor.
       *
       * Example:
       *
       * processId = 12
       *
       * /workflow-process/12
       */
      if (processId) {
        navigate(
          `/workflow-process/${processId}`
        );
        return;
      }

      /*
       * Fallback for direct access.
       */
      navigate(
        "/workflow-process"
      );
    };

  /* =========================================================
   * LOADING
   * ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">

          <Loader2 className="h-5 w-5 animate-spin" />

          <span>
            Loading project template...
          </span>

        </div>
      </div>
    );
  }

  /* =========================================================
   * RENDER
   * ========================================================= */

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

        <div className="mx-auto max-w-7xl px-6 py-4">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={
                handleBack
              }
              className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>

              <h1 className="text-xl font-semibold">
                Edit Project Template
              </h1>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {template.name ||
                  "Project Template"}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          STEP INDICATOR
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-6 pt-6">

        <div className="flex items-center justify-center gap-3">

          <StepIndicator
            number={1}
            label="Template Details"
            active={
              currentStep === 1
            }
            completed={
              currentStep > 1
            }
          />

          <StepLine
            active={
              currentStep > 1
            }
          />

          <StepIndicator
            number={2}
            label="Folders & Subfolders"
            active={
              currentStep === 2
            }
            completed={
              currentStep > 2
            }
          />

          <StepLine
            active={
              currentStep > 2
            }
          />

          <StepIndicator
            number={3}
            label="Roles & Folder Assignments"
            active={
              currentStep === 3
            }
            completed={false}
          />

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mx-auto max-w-7xl px-6 pt-5">

          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>

        </div>
      )}

      {/* =====================================================
          WIZARD
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-6">

        {/* -----------------------------------------
            STEP 1
        ----------------------------------------- */}

        {currentStep === 1 && (
          <TemplateStep
            data={template}
            onChange={
              setTemplate
            }
            onNext={
              handleTemplateNext
            }
            editMode={true}
            originalName={
              originalTemplateName
            }
          />
        )}

        {/* -----------------------------------------
            STEP 2
        ----------------------------------------- */}

        {currentStep === 2 && (
          <FoldersStep
            folders={folders}
            setFolders={
              setFolders
            }
            onBack={
              handleBack
            }
            onNext={
              handleFoldersNext
            }
          />
        )}

        {/* -----------------------------------------
            STEP 3
        ----------------------------------------- */}

        {currentStep === 3 && (
          <RolesStep
            folders={folders}
            setFolders={
              setFolders
            }
            onBack={
              handleBack
            }
            onSubmit={
              handleSubmit
            }
            loading={saving}
            editMode={true}
            initialRoles={
              availableRoles
            }
          />
        )}

      </main>

      {/* =====================================================
          SAVING OVERLAY
      ===================================================== */}

      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">

          <div className="rounded-xl bg-white px-6 py-5 shadow-xl dark:bg-gray-900">

            <div className="flex items-center gap-3">

              <Loader2 className="h-5 w-5 animate-spin" />

              <span className="font-medium">
                Updating project template and workflow process...
              </span>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          SUCCESS POPUP
      ===================================================== */}

      {successMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">

            <div className="flex flex-col items-center text-center">

              {/* Success icon */}

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">

                <Check className="h-7 w-7 text-green-600 dark:text-green-400" />

              </div>

              {/* Title */}

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Successful
              </h2>

              {/* Message */}

              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {successMessage}
              </p>

              {/* OK */}

              <button
                type="button"
                onClick={
                  handleSuccessClose
                }
                className="mt-6 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700"
              >
                OK
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
 * STEP INDICATOR
 * ========================================================= */

interface StepIndicatorProps {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">

      <div
        className={[
          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",

          active
            ? "bg-cyan-600 text-white"

            : completed
              ? "bg-purple-600 text-white"

              : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        ].join(" ")}
      >
        {completed ? (
          <Check className="h-4 w-4" />
        ) : (
          number
        )}
      </div>

      <span
        className={[
          "hidden text-sm font-medium sm:block",

          active
            ? "text-gray-900 dark:text-white"

            : "text-gray-500 dark:text-gray-400",
        ].join(" ")}
      >
        {label}
      </span>

    </div>
  );
}

/* =========================================================
 * STEP LINE
 * ========================================================= */

function StepLine({
  active,
}: {
  active: boolean;
}) {
  return (
    <div
      className={[
        "h-px w-10 sm:w-20",

        active
          ? "bg-purple-500"
          : "bg-gray-200 dark:bg-gray-800",
      ].join(" ")}
    />
  );
}

export default EditProjectTemplate;