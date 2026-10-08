import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

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
  editProject,
  getProject,
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

type WizardMode = "create" | "edit";

interface CreateProjectWizardProps {
  mode?: WizardMode;
}

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

export default function CreateProjectWizard({
  mode = "create",
}: CreateProjectWizardProps) {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = mode === "edit";

  const [step, setStep] = useState<Step>(1);

  const [project, setProject] =
    useState<CreateProjectFromTemplateDetails>(
      initialProject,
    );

  const [folders, setFolders] = useState<Folder[]>([]);

  const [folderRoles, setFolderRoles] =
    useState<FolderRolesResponse | null>(null);

  const [folderSchedules, setFolderSchedules] =
    useState<FolderSchedule[]>([]);

  const [folderAssignments, setFolderAssignments] =
    useState<FolderAssignment[]>([]);

  const [workflowLevels, setWorkflowLevels] =
    useState<WorkflowLevel[]>([]);

  const [isLoadingFolders, setIsLoadingFolders] =
    useState(false);

  const [isLoadingRoles, setIsLoadingRoles] =
    useState(false);

  const [isLoadingProject, setIsLoadingProject] =
    useState(isEditMode);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* =====================================================
     LOAD EXISTING PROJECT FOR EDIT MODE
     ===================================================== */

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    let cancelled = false;

    const loadExistingProject = async () => {
      const projectId = Number(id);

      if (!id || !Number.isInteger(projectId)) {
        setError("Invalid project ID.");
        setIsLoadingProject(false);
        return;
      }

      try {
        setIsLoadingProject(true);
        setError(null);

        /*
         * Get the complete existing project.
         */
        const projectResponse =
          await getProject(projectId);

        if (cancelled) {
          return;
        }

        const projectData =
          projectResponse.data?.project;

        const projectFolders =
          projectResponse.data?.folders ?? [];

        const members =
          projectResponse.data?.members ?? [];

        if (!projectData) {
          throw new Error(
            "Project details could not be loaded.",
          );
        }

        if (!projectData.template_id) {
          throw new Error(
            "The existing project does not have a valid template.",
          );
        }

        /*
         * Convert project details into the same
         * structure used by the create wizard.
         */
        const projectDetails: CreateProjectFromTemplateDetails =
        {
          template_id:
            projectData.template_id,

          company_id:
            projectData.company_id ?? 0,

          project_name:
            projectData.project_name ?? "",

          project_description:
            projectData.project_description ?? "",

          start_date:
            projectData.start_date ?? "",

          end_date:
            projectData.end_date ?? "",

          member_ids:
            members.map(
              (member) => member.user_id,
            ),

          coordinator:
            projectData.coordinator ?? 0,

          is_project_manage:
            projectData.is_project_manage ?? 0,

          projecttype:
            projectData.projecttype ?? 0,

          workflow_config_id:
            undefined,
        };

        /*
         * Get the complete template.
         *
         * This provides:
         * - workflow_config_id
         * - workflow levels
         * - template information
         */
        const templateResponse =
          await getProjectTemplate(
            projectDetails.template_id,
          );

        if (cancelled) {
          return;
        }

        const templateData =
          templateResponse.data;

        if (!templateData) {
          throw new Error(
            "Unable to load the project template.",
          );
        }

        /*
         * Save workflow configuration ID.
         */
        projectDetails.workflow_config_id =
          templateData.template.workflow_config_id;

        /*
         * Save workflow levels.
         *
         * These are independent from
         * folder roles.
         */
        const levels =
          templateData.workflow_config?.levels ?? [];

        setWorkflowLevels(levels);

        /*
         * Load actual template folders.
         */
        const templateFoldersResponse =
          await getTemplateFolders(
            projectDetails.template_id,
          );

        if (cancelled) {
          return;
        }

        setFolders(
          templateFoldersResponse.folders ?? [],
        );

        /*
         * Save project details.
         */
        setProject(projectDetails);

        /*
         * Build folder schedules from the
         * existing project.
         */
        const schedules: FolderSchedule[] =
          projectFolders.map((folder) => ({
            folder_id:
              folder.folder_id,

            start_date:
              folder.start_date ?? "",

            end_date:
              folder.end_date ?? "",
          }));

        setFolderSchedules(schedules);

        /*
         * Load roles configured on the template.
         */
        const rolesResponse =
          await getTemplateFolderRoles(
            projectDetails.template_id,
          );

        if (cancelled) {
          return;
        }

        setFolderRoles(rolesResponse);

        /*
         * Convert existing project assignments
         * into the wizard format.
         *
         * IMPORTANT:
         *
         * workflow_level comes directly from
         * the API response.
         *
         * We never derive it from role.
         */
        const assignments: FolderAssignment[] =
          projectFolders.map((folder) => ({
            folder_id:
              folder.folder_id,

            start_date:
              folder.start_date ?? "",

            end_date:
              folder.end_date ?? "",

            role_assignments:
              (folder.assignments ?? []).map(
                (assignment) => ({
                  role:
                    assignment.role,

                  user_id:
                    assignment.user_id,

                  workflow_level:
                    assignment.workflow_level ?? "",
                }),
              ),
          }));

        setFolderAssignments(assignments);
        setStep(1);
      } catch (err) {
        console.error(
          "Failed to load project for editing:",
          err,
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the project.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProject(false);
        }
      }
    };

    void loadExistingProject();

    return () => {
      cancelled = true;
    };
  }, [id, isEditMode]);

  /* =====================================================
     STEP 1
     ===================================================== */

  const handleProjectSubmit = async (
    data: CreateProjectFromTemplateDetails,
  ) => {
    setError(null);

    if (!data.template_id) {
      setError(
        "Please select a project template.",
      );

      return;
    }

    try {
      setIsLoadingFolders(true);

      /*
       * Remember which template was originally
       * loaded when editing.
       */
      const previousTemplateId =
        project.template_id;

      const templateChanged =
        isEditMode &&
        previousTemplateId !== 0 &&
        previousTemplateId !== data.template_id;

      /*
       * Load complete template details.
       */
      const templateResponse =
        await getProjectTemplate(
          data.template_id,
        );

      const templateData =
        templateResponse.data;

      if (!templateData) {
        setError(
          "Unable to load the selected template details.",
        );

        return;
      }

      /*
       * Extract workflow levels.
       */
      const levels =
        templateData.workflow_config?.levels ?? [];

      if (levels.length === 0) {
        setError(
          "The selected workflow does not contain any workflow levels.",
        );

        return;
      }

      setWorkflowLevels(levels);

      /*
       * Save project details.
       */
      const updatedProject: CreateProjectFromTemplateDetails =
      {
        ...data,
        workflow_config_id:
          templateData.template.workflow_config_id,
      };

      setProject(updatedProject);

      /*
       * Load folders belonging to the selected
       * template.
       */
      const foldersResponse =
        await getTemplateFolders(
          data.template_id,
        );

      const templateFolders =
        foldersResponse.folders ?? [];

      setFolders(templateFolders);

      /*
       * If this is CREATE mode, create empty
       * schedules.
       *
       * If this is EDIT mode with the same template,
       * preserve the existing dates.
       *
       * If the template changed, reset everything
       * because the old folders belong to another
       * template.
       */
      if (!isEditMode || templateChanged) {
        const schedules: FolderSchedule[] =
          templateFolders.map((folder) => ({
            folder_id:
              folder.fid,

            start_date: "",
            end_date: "",
          }));

        setFolderSchedules(schedules);

        setFolderAssignments([]);

        setFolderRoles(null);
      } else {
        /*
         * Same template during edit.
         *
         * Keep the existing schedules and assignments.
         *
         * Add empty entries for any newly available
         * template folders.
         */
        const updatedSchedules: FolderSchedule[] =
          templateFolders.map((folder) => {
            const existing =
              folderSchedules.find(
                (schedule) =>
                  schedule.folder_id ===
                  folder.fid,
              );

            return {
              folder_id:
                folder.fid,

              start_date:
                existing?.start_date ?? "",

              end_date:
                existing?.end_date ?? "",
            };
          });

        setFolderSchedules(
          updatedSchedules,
        );

        setFolderAssignments(
          (currentAssignments) =>
            templateFolders.map((folder) => {
              const existing =
                currentAssignments.find(
                  (assignment) =>
                    assignment.folder_id ===
                    folder.fid,
                );

              const schedule =
                updatedSchedules.find(
                  (item) =>
                    item.folder_id ===
                    folder.fid,
                );

              return {
                folder_id:
                  folder.fid,

                start_date:
                  schedule?.start_date ?? "",

                end_date:
                  schedule?.end_date ?? "",

                role_assignments:
                  existing?.role_assignments ??
                  [],
              };
            }),
        );
      }

      /*
       * Move to Step 2.
       */
      setStep(2);
    } catch (err) {
      console.error(
        "Failed to load template workflow/folders:",
        err,
      );

      setError(
        "Unable to load the selected template details.",
      );
    } finally {
      setIsLoadingFolders(false);
    }
  };

  /* =====================================================
     STEP 2
     ===================================================== */

  const handleFolderScheduleSubmit = async (
    schedules: FolderSchedule[],
  ) => {
    setError(null);

    setFolderSchedules(schedules);

    try {
      setIsLoadingRoles(true);

      /*
       * Load roles configured on the template.
       */
      const response =
        await getTemplateFolderRoles(
          project.template_id,
        );

      setFolderRoles(response);

      /*
       * Preserve existing assignments when
       * editing.
       */
      setFolderAssignments(
        (current) =>
          schedules.map((schedule) => {
            const existing =
              current.find(
                (assignment) =>
                  assignment.folder_id ===
                  schedule.folder_id,
              );

            return {
              folder_id:
                schedule.folder_id,

              start_date:
                schedule.start_date,

              end_date:
                schedule.end_date,

              role_assignments:
                existing?.role_assignments ??
                [],
            };
          }),
      );

      setStep(3);
    } catch (err) {
      console.error(
        "Failed to load folder roles:",
        err,
      );

      setError(
        "Unable to load the roles for the selected template.",
      );
    } finally {
      setIsLoadingRoles(false);
    }
  };

  /* =====================================================
     STEP 3
     ===================================================== */

  const handleCreateProject = async (
    assignments: FolderAssignment[],
  ) => {
    setError(null);

    /*
     * Save the latest assignments.
     */
    setFolderAssignments(assignments);

    /*
     * Every assignment must have a manually
     * selected workflow level.
     */
    for (const folder of assignments) {
      for (const roleAssignment of folder.role_assignments) {
        if (
          !roleAssignment.workflow_level ||
          !roleAssignment.workflow_level.trim()
        ) {
          setError(
            `Please select a workflow level for role "${roleAssignment.role}".`,
          );

          return;
        }
      }
    }

    /*
     * Build the common payload used by both:
     *
     * CREATE
     * EDIT
     */
    const payload: CreateProjectFromTemplatePayload =
    {
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
        assignments.map(
          (assignment) => ({
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
                }),
              ),
          }),
        ),
    };

    console.log(
      isEditMode
        ? "EDIT PROJECT PAYLOAD:"
        : "CREATE PROJECT PAYLOAD:",
      JSON.stringify(
        payload,
        null,
        2,
      ),
    );

    try {
      setIsSubmitting(true);

      /* =================================================
         CREATE
         ================================================= */

      if (!isEditMode) {
        await createProjectFromTemplate(
          payload,
        );

        console.log(
          "Project created successfully.",
        );

        alert(
          "Project created successfully!",
        );

        navigate("/projects");

        return;
      }

      /* =================================================
         EDIT
         ================================================= */

      const projectId = Number(id);

      if (
        !id ||
        !Number.isInteger(projectId)
      ) {
        setError(
          "Invalid project ID.",
        );

        return;
      }

      /*
       * PUT /api/editproject/{project_id}
       */
      await editProject(
        projectId,
        payload,
      );

      console.log(
        "Project updated successfully.",
      );

      alert(
        "Project updated successfully!",
      );

      navigate(
        `/projects/${projectId}`,
      );
    } catch (err) {
      console.error(
        isEditMode
          ? "Failed to update project:"
          : "Failed to create project:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? "Unable to update the project. Please try again."
            : "Unable to create the project. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =====================================================
     BACK
     ===================================================== */

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

  /* =====================================================
     LOADING EDIT PROJECT
     ===================================================== */

  if (isLoadingProject) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2
              size={18}
              className="animate-spin"
            />

            Loading project...
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     STEPS
     ===================================================== */

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

  /* =====================================================
     UI
     ===================================================== */

  return (
    <div className="mx-auto w-full px-8">

      {/* Header */}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode
            ? "Edit Project"
            : "Create Project"}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {isEditMode
            ? "Update the project details, folder schedules, members and roles."
            : "Create a project from an existing template."}
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
                      ${completed
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
                        ${active
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
                      ${step > item.number
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
            isEditMode={isEditMode}
            onSubmit={handleProjectSubmit}
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
            workflowLevels={
              workflowLevels
            }
            isEditMode={
              isEditMode
            }
            isLoading={
              isLoadingRoles
            }
            isSubmitting={
              isSubmitting
            }
            onBack={handleBack}
            onSubmit={
              handleCreateProject
            }
          />
        )}

      </div>
    </div>
  );
}