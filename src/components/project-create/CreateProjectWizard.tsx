import { useState } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ProjectDetailsForm from "./ProjectDetailsForm";
import FolderScheduleForm from "./FolderScheduleForm";
import FolderAssignmentForm from "./FolderAssignmentForm";

import { getProjectTemplate } from "../../api/projectTemplates";

import {
  getTemplateFolders,
  getTemplateFolderRoles,
} from "../../api/folders";

import {
  createProjectFromTemplate,
} from "../../api/projects";

import type {
  CreateProjectFromTemplateDetails,
  FolderAssignment,
  FolderSchedule,
  CreateProjectFromTemplatePayload,
  WorkflowLevel,
} from "../../types/projectTemplate";

import type {
  Folder,
  FolderRolesResponse,
} from "../../api/folders";

type Step = 1 | 2 | 3;

const initialProject: CreateProjectFromTemplateDetails = {
  template_id: 0,
  company_id: 0,

  project_name: "",
  project_description: "",

  start_date: "",
  end_date: "",

  member_ids: [],
  coordinator: 0,

  is_project_manage: 0,
  projecttype: 0,

  workflow_config_id: undefined,
};

export default function CreateProjectWizard() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);

  const [project, setProject] =
    useState<CreateProjectFromTemplateDetails>(
      initialProject
    );

  const [folders, setFolders] =
    useState<Folder[]>([]);

  const [folderRoles, setFolderRoles] =
    useState<FolderRolesResponse | null>(null);

  const [folderSchedules, setFolderSchedules] =
    useState<FolderSchedule[]>([]);

  const [folderAssignments, setFolderAssignments] =
    useState<FolderAssignment[]>([]);

  /*
   * Workflow levels belonging to the selected
   * template's workflow configuration.
   *
   * These are NOT template roles.
   *
   * Example:
   *
   * Writer
   * Reviewer
   * Editor
   */
  const [workflowLevels, setWorkflowLevels] =
    useState<WorkflowLevel[]>([]);

  const [isLoadingFolders, setIsLoadingFolders] =
    useState(false);

  const [isLoadingRoles, setIsLoadingRoles] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* ----------------------------------------
   * Step 1
   * ---------------------------------------- */

  const handleProjectSubmit = async (
    data: CreateProjectFromTemplateDetails
  ) => {
    setError(null);

    /*
     * A template is required.
     */
    if (!data.template_id) {
      setError(
        "Please select a project template."
      );

      return;
    }

    try {
      setIsLoadingFolders(true);

      /*
       * Load the COMPLETE selected template.
       *
       * This gives us:
       *
       * data.template
       * data.process
       * data.workflow_config
       * data.folders
       *
       * We specifically use:
       *
       * data.workflow_config.levels
       *
       * so the workflow levels always belong
       * to the selected template.
       */
      const templateResponse =
        await getProjectTemplate(
          data.template_id
        );

      const templateData =
        templateResponse.data;

      if (!templateData) {
        setError(
          "Unable to load the selected template details."
        );

        return;
      }

      /*
       * Extract workflow levels from the
       * selected template.
       *
       * Example:
       *
       * Writer
       * Reviewer
       * Editor
       */
      const levels =
        templateData.workflow_config?.levels ?? [];

      if (levels.length === 0) {
        setError(
          "The selected workflow does not contain any workflow levels."
        );

        return;
      }

      /*
       * Save workflow levels for Step 3.
       */
      setWorkflowLevels(levels);

      /*
       * Save project data.
       *
       * Use the workflow_config_id returned by
       * the actual template API rather than relying
       * only on the project form.
       */
      setProject({
        ...data,
        workflow_config_id:
          templateData.template.workflow_config_id,
      });

      /*
       * Load template folders.
       */
      const response =
        await getTemplateFolders(
          data.template_id
        );

      setFolders(response.folders);

      /*
       * Create initial folder schedules.
       */
      const schedules: FolderSchedule[] =
        response.folders.map((folder) => ({
          folder_id: folder.fid,
          start_date: "",
          end_date: "",
        }));

      setFolderSchedules(schedules);

      /*
       * Clear any old assignments when a
       * different template is selected.
       */
      setFolderAssignments([]);
      setFolderRoles(null);

      /*
       * Move to Step 2.
       */
      setStep(2);
    } catch (err) {
      console.error(
        "Failed to load template workflow/folders:",
        err
      );

      setError(
        "Unable to load the selected template details."
      );
    } finally {
      setIsLoadingFolders(false);
    }
  };

  /* ----------------------------------------
   * Step 2
   * ---------------------------------------- */

  const handleFolderScheduleSubmit = async (
    schedules: FolderSchedule[]
  ) => {
    setError(null);

    setFolderSchedules(schedules);

    try {
      setIsLoadingRoles(true);

      /*
       * Load roles configured on the template
       * folders.
       */
      const response =
        await getTemplateFolderRoles(
          project.template_id
        );

      setFolderRoles(response);

      /*
       * Create empty role assignments.
       *
       * IMPORTANT:
       *
       * We do NOT automatically map:
       *
       * role -> workflow level
       *
       * Workflow level selection happens
       * manually in Step 3.
       */
      const assignments: FolderAssignment[] =
        schedules.map((schedule) => ({
          folder_id: schedule.folder_id,
          start_date: schedule.start_date,
          end_date: schedule.end_date,
          role_assignments: [],
        }));

      setFolderAssignments(assignments);

      /*
       * Move to Step 3.
       */
      setStep(3);
    } catch (err) {
      console.error(
        "Failed to load folder roles:",
        err
      );

      setError(
        "Unable to load the roles for the selected template."
      );
    } finally {
      setIsLoadingRoles(false);
    }
  };

  /* ----------------------------------------
   * Step 3
   * ---------------------------------------- */

  const handleCreateProject = async (
    assignments: FolderAssignment[]
  ) => {
    setError(null);

    /*
     * Save the latest assignments in state.
     */
    setFolderAssignments(assignments);

    /*
     * Validate workflow levels before sending.
     *
     * Every role assignment must have:
     *
     * role
     * user_id
     * workflow_level
     *
     * The workflow level must be selected
     * manually in FolderAssignmentForm.
     */
    for (const folder of assignments) {
      for (const roleAssignment of folder.role_assignments) {
        if (
          !roleAssignment.workflow_level ||
          !roleAssignment.workflow_level.trim()
        ) {
          setError(
            `Please select a workflow level for role "${roleAssignment.role}".`
          );

          return;
        }
      }
    }

    /*
     * Build the exact API payload.
     *
     * IMPORTANT:
     *
     * workflow_level comes ONLY from the
     * manually selected workflow level.
     *
     * We do NOT do:
     *
     * workflow_level: role
     *
     * and we do NOT do:
     *
     * workflow_level:
     *   assignment.workflow_level ||
     *   assignment.role
     */
    const payload: CreateProjectFromTemplatePayload = {
      project: {
        template_id:
          project.template_id,

        company_id:
          project.company_id,

        project_name:
          project.project_name,

        project_description:
          project.project_description ?? "",

        start_date:
          project.start_date,

        end_date:
          project.end_date,

        member_ids:
          project.member_ids,

        coordinator:
          project.coordinator,

        is_project_manage:
          project.is_project_manage,

        projecttype:
          project.projecttype,
      },

      folder_assignments:
        assignments.map((assignment) => ({
          folder_id:
            assignment.folder_id,

          start_date:
            assignment.start_date,

          end_date:
            assignment.end_date,

          role_assignments:
            assignment.role_assignments.map(
              (roleAssignment) => ({
                role:
                  roleAssignment.role,

                user_id:
                  roleAssignment.user_id,

                workflow_level:
                  roleAssignment.workflow_level,
              })
            ),
        })),
    };

    /*
     * Debug the exact payload sent to the API.
     */
    console.log(
      "CREATE PROJECT PAYLOAD:",
      JSON.stringify(
        payload,
        null,
        2
      )
    );

    try {
      setIsSubmitting(true);

      await createProjectFromTemplate(
        payload
      );

      console.log(
        "Project created successfully"
      );

      alert(
        "Project created successfully!"
      );

      navigate("/projects");
    } catch (err) {
      console.error(
        "Failed to create project:",
        err
      );

      setError(
        "Unable to create the project. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ----------------------------------------
   * Back
   * ---------------------------------------- */

  const handleBack = () => {
    setError(null);

    if (step === 2) {
      setStep(1);
      return;
    }

    if (step === 3) {
      setStep(2);
    }
  };

  /* ----------------------------------------
   * Steps
   * ---------------------------------------- */

  const steps = [
    {
      number: 1,
      title: "Project Details",
    },
    {
      number: 2,
      title: "Folder Schedule",
    },
    {
      number: 3,
      title: "Members & Roles",
    },
  ];

  /* ----------------------------------------
   * UI
   * ---------------------------------------- */

  return (
    <div className="mx-auto w-full max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Create Project
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create a project from an existing
          template.
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center">

          {steps.map((item, index) => {
            const completed =
              step > item.number;

            const active =
              step === item.number;

            return (
              <div
                key={item.number}
                className="flex flex-1 items-center"
              >
                <div className="flex items-center gap-3">

                  <div
                    className={`
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-full
                      border
                      text-sm
                      font-medium
                      ${
                        completed
                          ? "border-green-600 bg-green-600 text-white"
                          : active
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 bg-white text-gray-500"
                      }
                    `}
                  >
                    {completed ? (
                      <Check size={18} />
                    ) : (
                      item.number
                    )}
                  </div>

                  <div className="hidden sm:block">
                    <p
                      className={`
                        text-sm
                        font-medium
                        ${
                          active
                            ? "text-gray-900"
                            : "text-gray-500"
                        }
                      `}
                    >
                      {item.title}
                    </p>
                  </div>
                </div>

                {index <
                  steps.length - 1 && (
                  <div
                    className={`
                      mx-4
                      h-px
                      flex-1
                      ${
                        step > item.number
                          ? "bg-green-600"
                          : "bg-gray-200"
                      }
                    `}
                  />
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* Step 1 */}
        {step === 1 && (
          <ProjectDetailsForm
            initialData={project}
            onSubmit={
              handleProjectSubmit
            }
          />
        )}

        {/* Step 2 */}
        {step === 2 && (
          <FolderScheduleForm
            folders={folders}
            projectStartDate={
              project.start_date
            }
            projectEndDate={
              project.end_date
            }
            initialSchedules={
              folderSchedules
            }
            isLoading={
              isLoadingFolders
            }
            onBack={handleBack}
            onSubmit={
              handleFolderScheduleSubmit
            }
          />
        )}

        {/* Step 3 */}
        {step === 3 && (
          <FolderAssignmentForm
            folders={folders}
            folderRoles={folderRoles}
            schedules={folderSchedules}
            initialAssignments={
              folderAssignments
            }

            /*
             * Workflow levels come from:
             *
             * GET /api/getprojecttemplate/{template_id}
             *
             * -> data.workflow_config.levels
             *
             * They are NOT derived from folder roles.
             */
            workflowLevels={
              workflowLevels
            }

            isLoading={
              isLoadingRoles
            }

            isSubmitting={
              isSubmitting
            }

            onBack={
              handleBack
            }

            onSubmit={
              handleCreateProject
            }
          />
        )}

      </div>
    </div>
  );
}