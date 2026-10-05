import { useState } from "react";

import RoleSelector from "./RoleSelector";

import type {
  ProjectTemplateFolder,
} from "../../types/projectTemplate";

interface RolesStepProps {
  folders: ProjectTemplateFolder[];
  setFolders: React.Dispatch<
    React.SetStateAction<ProjectTemplateFolder[]>
  >;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  editMode?: boolean;
  initialRoles?: string[];
}

function RolesStep({
  folders,
  setFolders,
  onBack,
  onSubmit,
  loading,
  editMode = false,
  initialRoles = [],
}: RolesStepProps) {
  /* =====================================================
     NEW ROLES CREATED IN THIS SESSION
  ===================================================== */

  const [addedRoles, setAddedRoles] =
    useState<string[]>([]);

  /* =====================================================
     AVAILABLE ROLES

     Existing roles come from initialRoles.

     New roles created during this session are stored
     in addedRoles.

     Set removes duplicates.
  ===================================================== */

  const availableRoles = Array.from(
    new Set([
      ...initialRoles,
      ...addedRoles,
    ])
  ).sort((a, b) =>
    a.localeCompare(b)
  );

  /* =====================================================
     ROLE FORM
  ===================================================== */

  const [showRoleForm, setShowRoleForm] =
    useState(false);

  const [newRole, setNewRole] =
    useState("");

  const [roleError, setRoleError] =
    useState("");

  const [assignmentError, setAssignmentError] =
    useState("");

  /* =====================================================
     ADD ROLE
  ===================================================== */

  const handleAddRole = () => {
    const trimmedRole =
      newRole.trim();

    if (!trimmedRole) {
      setRoleError(
        "Role name is required."
      );

      return;
    }

    const duplicateRole =
      availableRoles.some(
        (role) =>
          role.toLowerCase() ===
          trimmedRole.toLowerCase()
      );

    if (duplicateRole) {
      setRoleError(
        `Role "${trimmedRole}" already exists.`
      );

      return;
    }

    setAddedRoles((prev) => [
      ...prev,
      trimmedRole,
    ]);

    setNewRole("");
    setRoleError("");
    setShowRoleForm(false);
  };

  /* =====================================================
     UPDATE FOLDER ROLES
  ===================================================== */

  const updateRoles = (
    folderId: string,
    roles: string[]
  ) => {
    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              roles,
            }
          : folder
      )
    );

    setAssignmentError("");
  };

  /* =====================================================
     VALIDATE ROLES
  ===================================================== */

  const validateRoles = () => {
    if (availableRoles.length === 0) {
      return "Please create at least one role.";
    }

    const foldersWithoutRoles =
      folders.filter(
        (folder) =>
          folder.roles.length === 0
      );

    if (
      foldersWithoutRoles.length > 0
    ) {
      const names =
        foldersWithoutRoles
          .map(
            (folder) =>
              folder.name
          )
          .join(", ");

      return `No role assigned to: ${names}.`;
    }

    return "";
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = () => {
    const error =
      validateRoles();

    if (error) {
      setAssignmentError(error);
      return;
    }

    setAssignmentError("");
    onSubmit();
  };

  /* =====================================================
     RENDER FOLDER
  ===================================================== */

  const renderFolder = (
    folder: ProjectTemplateFolder,
    level = 0
  ) => {
    const children =
      folders.filter(
        (item) =>
          item.parentFolderId ===
          folder.id
      );

    const hasNoRoles =
      folder.roles.length === 0;

    return (
      <div
        key={folder.id}
        className="space-y-3"
      >
        <div
          style={{
            marginLeft:
              `${level * 32}px`,
          }}
          className={`rounded-xl border bg-white p-5 ${
            hasNoRoles
              ? "border-red-300"
              : "border-gray-200"
          } dark:bg-gray-800 dark:border-gray-700`}
        >
          {/* FOLDER NAME */}

          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
            {folder.name}
          </h3>

          {/* ROLE BUTTONS */}

          {availableRoles.length >
          0 ? (
            <RoleSelector
              roles={availableRoles}
              selectedRoles={
                folder.roles
              }
              onChange={(roles) =>
                updateRoles(
                  folder.id,
                  roles
                )
              }
            />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No roles created yet.
            </p>
          )}

          {/* SELECTED ROLES */}

          {folder.roles.length >
            0 && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Selected:{" "}
              {folder.roles.join(
                ", "
              )}
            </p>
          )}
        </div>

        {/* SUBFOLDERS */}

        {children.map(
          (child) =>
            renderFolder(
              child,
              level + 1
            )
        )}
      </div>
    );
  };

  /* =====================================================
     ROOT FOLDERS
  ===================================================== */

  const rootFolders =
    folders.filter(
      (folder) =>
        folder.parentFolderId ===
        null
    );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {editMode
            ? "Edit Roles & Assign Folders"
            : "Create Roles & Assign Folders"}
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {editMode
            ? "Update roles and folder assignments for this project template."
            : "Create roles and assign one or more roles to every folder and subfolder."}
        </p>
      </div>

      {/* ROLES SECTION */}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Available Roles
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create roles that can be
              assigned to folders.
            </p>
          </div>

          {!showRoleForm && (
            <button
              type="button"
              onClick={() => {
                setShowRoleForm(true);
                setRoleError("");
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              + Add Role
            </button>
          )}
        </div>

        {/* ADD ROLE FORM */}

        {showRoleForm && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role Name
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newRole}
                onChange={(e) => {
                  setNewRole(
                    e.target.value
                  );
                  setRoleError("");
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    e.preventDefault();
                    handleAddRole();
                  }
                }}
                placeholder="e.g. Editor"
                className={`flex-1 rounded-lg border bg-white px-3 py-2 text-gray-900 dark:bg-gray-800 dark:text-white ${
                  roleError
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                autoFocus
              />

              <button
                type="button"
                onClick={
                  handleAddRole
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Add
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRoleForm(false);
                  setNewRole("");
                  setRoleError("");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                Cancel
              </button>
            </div>

            {roleError && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm text-red-600 dark:text-red-400">
                  ❌ {roleError}
                </p>
              </div>
            )}
          </div>
        )}

        {/* CREATED ROLES */}

        {availableRoles.length >
          0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Available Roles
            </p>

            <div className="flex flex-wrap gap-2">
              {availableRoles.map(
                (role) => (
                  <span
                    key={role}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                  >
                    {role}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* ASSIGNMENT ERROR */}

      {assignmentError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">
            ❌ {assignmentError}
          </p>
        </div>
      )}

      {/* FOLDER ASSIGNMENTS */}

      <div>
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
          Assign Roles to Folders
        </h3>

        {rootFolders.length >
        0 ? (
          <div className="space-y-4">
            {rootFolders.map(
              (folder) =>
                renderFolder(folder)
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-600">
            No folders available.
          </div>
        )}
      </div>

      {/* NAVIGATION */}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            loading ||
            folders.length === 0
          }
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? editMode
              ? "Updating..."
              : "Creating..."
            : editMode
              ? "Update Template"
              : "Create Template"}
        </button>
      </div>
    </div>
  );
}

export default RolesStep;