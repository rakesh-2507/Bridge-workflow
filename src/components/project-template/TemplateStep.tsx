import { useEffect, useState } from "react";

import type {
  ProjectTemplateDetails,
  ProjectType,
  WorkflowConfig,
} from "../../types/projectTemplate";

import {
  checkProjectTemplateName,
  getWorkflowConfigs,
} from "../../api/projectTemplates";

import {
  getProjectTypes,
  createProjectType,
} from "../../api/projectTypes";

interface TemplateStepProps {
  data: ProjectTemplateDetails;
  onChange: (data: ProjectTemplateDetails) => void;
  onNext: () => void;
  editMode?: boolean;
  originalName?: string;
}

type ValidationStatus =
  | "idle"
  | "checking"
  | "valid"
  | "invalid";

function TemplateStep({
  data,
  onChange,
  onNext,
  editMode = false,
  originalName = "",
}: TemplateStepProps) {
  /* =====================================================
     TEMPLATE NAME
  ===================================================== */

  const [nameStatus, setNameStatus] =
    useState<ValidationStatus>("idle");

  const [nameError, setNameError] =
    useState("");

  const [validatedName, setValidatedName] =
    useState("");

  /* =====================================================
     PROJECT TYPES
  ===================================================== */

  const [projectTypes, setProjectTypes] =
    useState<ProjectType[]>([]);

  const [loadingProjectTypes, setLoadingProjectTypes] =
    useState(true);

  const [projectTypeLoadError, setProjectTypeLoadError] =
    useState("");

  /* =====================================================
     WORKFLOW CONFIGS
  ===================================================== */

  const [workflowConfigs, setWorkflowConfigs] =
    useState<WorkflowConfig[]>([]);

  const [loadingWorkflowConfigs, setLoadingWorkflowConfigs] =
    useState(true);

  const [workflowConfigLoadError, setWorkflowConfigLoadError] =
    useState("");

  /* =====================================================
     CREATE PROJECT TYPE
  ===================================================== */

  const [showAddType, setShowAddType] =
    useState(false);

  const [newProjectType, setNewProjectType] =
    useState("");

  const [projectTypeStatus, setProjectTypeStatus] =
    useState<ValidationStatus>("idle");

  const [createTypeError, setCreateTypeError] =
    useState("");

  const [validatedProjectType, setValidatedProjectType] =
    useState("");

  const [creatingProjectType, setCreatingProjectType] =
    useState(false);

  /* =====================================================
     LOAD PROJECT TYPES
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadProjectTypes = async () => {
      try {
        const response = await getProjectTypes();

        if (!cancelled) {
          setProjectTypes(
            response.projecttypes
          );
        }
      } catch (error) {
        console.error(
          "Failed to load project types:",
          error
        );

        if (!cancelled) {
          setProjectTypeLoadError(
            "Unable to load project types."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProjectTypes(false);
        }
      }
    };

    loadProjectTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     LOAD WORKFLOW CONFIGS
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadWorkflowConfigs = async () => {
      try {
        setLoadingWorkflowConfigs(true);
        setWorkflowConfigLoadError("");

        const response =
          await getWorkflowConfigs();

        if (!cancelled) {
          const activeConfigs =
            response.data.configs.filter(
              (config) =>
                config.status.toLowerCase() ===
                "active"
            );

          setWorkflowConfigs(activeConfigs);
        }
      } catch (error) {
        console.error(
          "Failed to load workflow configs:",
          error
        );

        if (!cancelled) {
          setWorkflowConfigLoadError(
            "Unable to load workflow configurations."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingWorkflowConfigs(false);
        }
      }
    };

    loadWorkflowConfigs();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     TEMPLATE NAME VALIDATION

     CREATE:
       Check the name against backend.

     EDIT:
       If the current name is unchanged from the original
       template name, it is automatically valid.

       If the name has changed, check the backend.
  ===================================================== */

  useEffect(() => {
    const name = data.name.trim();

    if (!name) {
      return;
    }

    const unchangedOriginalName =
      editMode &&
      originalName.trim() !== "" &&
      name.toLowerCase() ===
        originalName.trim().toLowerCase();

    if (unchangedOriginalName) {
      return;
    }

    const timer = setTimeout(
      async () => {
        try {
          setNameStatus("checking");
          setNameError("");

          const response =
            await checkProjectTemplateName(
              name
            );

          if (
            name !== data.name.trim()
          ) {
            return;
          }

          if (!response.available) {
            setNameStatus("invalid");

            setNameError(
              response.message ||
                "Project template name already exists."
            );

            setValidatedName("");
          } else {
            setNameStatus("valid");

            setNameError("");

            setValidatedName(name);
          }
        } catch (error) {
          console.error(
            "Failed to validate template name:",
            error
          );

          if (
            name === data.name.trim()
          ) {
            setNameStatus("invalid");

            setNameError(
              "Unable to validate template name. Please try again."
            );

            setValidatedName("");
          }
        }
      },
      500
    );

    return () => {
      clearTimeout(timer);
    };
  }, [
    data.name,
    editMode,
    originalName,
  ]);

  /* =====================================================
     PROJECT TYPE DUPLICATE VALIDATION

     Validation happens after 500ms.
  ===================================================== */

  useEffect(() => {
    const typeName =
      newProjectType.trim();

    if (!typeName) {
      return;
    }

    const timer = setTimeout(
      () => {
        const duplicate =
          projectTypes.some(
            (type) =>
              type.projecttype
                .trim()
                .toLowerCase() ===
              typeName.toLowerCase()
          );

        if (
          typeName !==
          newProjectType.trim()
        ) {
          return;
        }

        if (duplicate) {
          setProjectTypeStatus(
            "invalid"
          );

          setCreateTypeError(
            "This project type already exists. Please select it from the dropdown."
          );

          setValidatedProjectType("");
        } else {
          setProjectTypeStatus(
            "valid"
          );

          setCreateTypeError("");

          setValidatedProjectType(
            typeName
          );
        }
      },
      500
    );

    return () => {
      clearTimeout(timer);
    };
  }, [
    newProjectType,
    projectTypes,
  ]);

  /* =====================================================
     TEMPLATE FIELD CHANGE
  ===================================================== */

  const handleChange = (
    field: keyof ProjectTemplateDetails,
    value: string | number
  ) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  /* =====================================================
     PROJECT TYPE INPUT CHANGE
  ===================================================== */

  const handleNewProjectTypeChange = (
    value: string
  ) => {
    setNewProjectType(value);
  };

  /* =====================================================
     CREATE PROJECT TYPE
  ===================================================== */

  const handleCreateProjectType =
    async () => {
      const typeName =
        newProjectType.trim();

      if (!typeName) {
        setCreateTypeError(
          "Project type name is required."
        );

        return;
      }

      if (
        projectTypeStatus ===
        "checking"
      ) {
        return;
      }

      if (
        projectTypeStatus !==
        "valid"
      ) {
        return;
      }

      if (
        validatedProjectType !==
        typeName
      ) {
        return;
      }

      try {
        setCreatingProjectType(true);
        setCreateTypeError("");

        const created =
          await createProjectType({
            projecttype: typeName,
          });

        setProjectTypes((prev) => [
          ...prev,
          created,
        ]);

        handleChange(
          "project_type_id",
          created.ptypeid
        );

        setShowAddType(false);
        setNewProjectType("");
        setValidatedProjectType("");
        setCreateTypeError("");
        setProjectTypeStatus("idle");
      } catch (error) {
        console.error(
          "Failed to create project type:",
          error
        );

        if (
          error instanceof Error
        ) {
          setCreateTypeError(
            error.message ||
              "Unable to create project type."
          );
        } else {
          setCreateTypeError(
            "Unable to create project type. Please try again."
          );
        }

        setProjectTypeStatus(
          "invalid"
        );
      } finally {
        setCreatingProjectType(false);
      }
    };

  /* =====================================================
     CLOSE ADD PROJECT TYPE
  ===================================================== */

  const handleCancelAddType = () => {
    if (creatingProjectType) {
      return;
    }

    setShowAddType(false);
    setNewProjectType("");
    setCreateTypeError("");
    setValidatedProjectType("");
    setProjectTypeStatus("idle");
  };

  /* =====================================================
     TEMPLATE NAME STATUS
  ===================================================== */

  const templateName =
    data.name.trim();

  const isTemplateNameEmpty =
    templateName === "";

  const isOriginalName =
    editMode &&
    originalName.trim() !== "" &&
    templateName.toLowerCase() ===
      originalName.trim().toLowerCase();

  const isNameChecking =
    !isTemplateNameEmpty &&
    !isOriginalName &&
    nameStatus === "checking";

  const isNameValid =
    !isTemplateNameEmpty &&
    (
      isOriginalName ||
      (
        nameStatus === "valid" &&
        validatedName ===
          templateName &&
        !nameError
      )
    );

  /* =====================================================
     PROJECT TYPE STATUS
  ===================================================== */

  const projectTypeName =
    newProjectType.trim();

  const isProjectTypeEmpty =
    projectTypeName === "";

  const isProjectTypeChecking =
    !isProjectTypeEmpty &&
    projectTypeStatus ===
      "checking";

  const isProjectTypeValid =
    !isProjectTypeEmpty &&
    projectTypeStatus ===
      "valid" &&
    validatedProjectType ===
      projectTypeName &&
    !createTypeError;

  /* =====================================================
     WORKFLOW CONFIG STATUS
  ===================================================== */

  const hasWorkflowConfig =
    Boolean(
      data.workflow_config_id
    );

  /* =====================================================
     STEP VALIDATION
  ===================================================== */

  const canGoNext =
    isNameValid &&
    Boolean(data.project_type_id) &&
    hasWorkflowConfig &&
    !loadingWorkflowConfigs &&
    workflowConfigs.length > 0;

  const canAddProjectType =
    isProjectTypeValid &&
    !creatingProjectType;

  /* =====================================================
     SUBMIT STEP
  ===================================================== */

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    /* Template name */

    if (!templateName) {
      setNameError(
        "Template name is required."
      );

      setNameStatus("invalid");

      return;
    }

    /* Template name still checking */

    if (isNameChecking) {
      return;
    }

    /* Template name wasn't validated */

    if (!isNameValid) {
      return;
    }

    /* Project type */

    if (!data.project_type_id) {
      setProjectTypeLoadError(
        "Please select a project type."
      );

      return;
    }

    /* Workflow configuration */

    if (!data.workflow_config_id) {
      setWorkflowConfigLoadError(
        "Please select a workflow configuration."
      );

      return;
    }

    if (
      loadingWorkflowConfigs ||
      workflowConfigs.length === 0
    ) {
      setWorkflowConfigLoadError(
        "Workflow configurations are not available."
      );

      return;
    }

    onNext();
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* HEADER */}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {editMode
            ? "Edit Project Template"
            : "Create Project Template"}
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {editMode
            ? "Update the basic details for your project template."
            : "Enter the basic details for your project template."}
        </p>
      </div>

      {/* TEMPLATE NAME */}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Template Name
        </label>

        <input
          type="text"
          value={data.name}
          onChange={(e) =>
            handleChange(
              "name",
              e.target.value
            )
          }
          placeholder="Enter template name"
          className={`w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 dark:bg-gray-800 dark:text-white ${
            nameError
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
        />

        {isNameChecking && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Checking template name...
          </p>
        )}

        {!isNameChecking &&
          nameError && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm text-red-600 dark:text-red-400">
                ❌ {nameError}
              </p>
            </div>
          )}

        {isNameValid && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            ✓{" "}
            {isOriginalName
              ? "Current template name"
              : "Template name is available"}
          </p>
        )}
      </div>

      {/* DESCRIPTION */}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>

        <textarea
          value={data.description}
          onChange={(e) =>
            handleChange(
              "description",
              e.target.value
            )
          }
          placeholder="Enter template description"
          rows={4}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* PROJECT TYPE */}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Project Type
        </label>

        <select
          value={
            data.project_type_id || ""
          }
          onChange={(e) => {
            handleChange(
              "project_type_id",
              Number(e.target.value)
            );

            setProjectTypeLoadError("");
          }}
          disabled={
            loadingProjectTypes
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">
            {loadingProjectTypes
              ? "Loading project types..."
              : "Select project type"}
          </option>

          {projectTypes.map(
            (type) => (
              <option
                key={type.ptypeid}
                value={type.ptypeid}
              >
                {type.projecttype}{" "}
                (ID: {type.ptypeid})
              </option>
            )
          )}
        </select>

        {projectTypeLoadError && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm text-red-600 dark:text-red-400">
              ❌{" "}
              {projectTypeLoadError}
            </p>
          </div>
        )}

        {!showAddType && (
          <button
            type="button"
            onClick={() => {
              setShowAddType(true);
              setNewProjectType("");
              setCreateTypeError("");
              setValidatedProjectType("");
              setProjectTypeStatus("idle");
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            + Add Project Type
          </button>
        )}

        {showAddType && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
              Add New Project Type
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newProjectType}
                onChange={(e) =>
                  handleNewProjectTypeChange(
                    e.target.value
                  )
                }
                placeholder="Enter project type"
                disabled={
                  creatingProjectType
                }
                className={`flex-1 rounded-lg border bg-white px-3 py-2 text-gray-900 dark:bg-gray-900 dark:text-white ${
                  createTypeError
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />

              <button
                type="button"
                onClick={
                  handleCreateProjectType
                }
                disabled={
                  !canAddProjectType
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingProjectType
                  ? "Adding..."
                  : "Add"}
              </button>

              <button
                type="button"
                onClick={
                  handleCancelAddType
                }
                disabled={
                  creatingProjectType
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                Cancel
              </button>
            </div>

            {isProjectTypeChecking && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Checking project type...
              </p>
            )}

            {!isProjectTypeChecking &&
              createTypeError && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    ❌{" "}
                    {createTypeError}
                  </p>
                </div>
              )}

            {isProjectTypeValid && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                ✓ Project type name is
                available
              </p>
            )}
          </div>
        )}
      </div>

      {/* WORKFLOW CONFIGURATION */}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Workflow Configuration
        </label>

        <select
          value={
            data.workflow_config_id
          }
          onChange={(e) => {
            handleChange(
              "workflow_config_id",
              e.target.value
            );

            setWorkflowConfigLoadError("");
          }}
          disabled={
            loadingWorkflowConfigs
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">
            {loadingWorkflowConfigs
              ? "Loading workflow configurations..."
              : "Select workflow configuration"}
          </option>

          {workflowConfigs.map(
            (config) => (
              <option
                key={config.id}
                value={config.id}
              >
                {config.icon}{" "}
                {config.name}
              </option>
            )
          )}
        </select>

        {workflowConfigLoadError && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm text-red-600 dark:text-red-400">
              ❌{" "}
              {workflowConfigLoadError}
            </p>
          </div>
        )}

        {data.workflow_config_id && (
          <p className="mt-2 break-all text-xs text-gray-500 dark:text-gray-400">
            Config ID:{" "}
            {data.workflow_config_id}
          </p>
        )}
      </div>

      {/* WORKFLOW SCOPE */}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Workflow Scope
        </label>

        <select
          value={
            data.workflow_scope ||
            "FOLDER"
          }
          onChange={(e) =>
            handleChange(
              "workflow_scope",
              e.target.value
            )
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 dark:bg-gray-800 dark:text-white"
          required
        >
          <option value="FOLDER">
            Folder
          </option>

          <option value="PROJECT">
            Project
          </option>
        </select>

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Select whether the workflow should apply
          at the folder level or project level.
        </p>
      </div>

      {/* NEXT */}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={!canGoNext}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next: Folders →
        </button>
      </div>
    </form>
  );
}

export default TemplateStep;