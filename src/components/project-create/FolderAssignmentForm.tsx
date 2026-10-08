import { useEffect, useMemo, useState } from "react";

import FolderTree, {
    type FolderNode,
} from "../project-create/FolderTree";

import {
    ChevronLeft,
    Check,
    ChevronDown,
    Search,
    X,
    Users,
    Folder as FolderIcon,
    CalendarDays,
    Loader2,
    Lock,
} from "lucide-react";

import type {
    FolderAssignment,
    FolderSchedule,
    TemplateFolderRolesResponse,
    WorkflowLevel,
} from "../../types/projectTemplate";

import type { Folder } from "../../api/folders";
import { getUsers } from "../../api/users";

interface FolderAssignmentFormProps {
    folders: Folder[];

    folderRoles:
    | TemplateFolderRolesResponse
    | null;

    schedules: FolderSchedule[];

    initialAssignments:
    FolderAssignment[];

    workflowLevels: WorkflowLevel[];

    isEditMode?: boolean;

    isLoading?: boolean;
    isSubmitting?: boolean;

    onBack: () => void;

    onSubmit: (
        assignments: FolderAssignment[],
    ) => void | Promise<void>;
}

interface User {
    uid: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    name?: string;
}

interface UserResponse {
    users: User[];
    total?: number;
}

interface RoleRow {
    folderId: number;
    folderName: string;
    role: string;
}

/*
 * Build workflow-level selections from
 * the existing assignments.
 *
 * IMPORTANT:
 *
 * Workflow level is always taken directly
 * from the existing assignment.
 *
 * It is never derived from the role name.
 */
function buildWorkflowLevelSelections(
    assignments: FolderAssignment[],
): Record<string, string> {
    const selections: Record<string, string> = {};

    for (const assignment of assignments) {
        for (const roleAssignment of assignment.role_assignments) {
            const key =
                `${assignment.folder_id}__${roleAssignment.role}`;

            if (roleAssignment.workflow_level) {
                selections[key] =
                    roleAssignment.workflow_level;
            }
        }
    }

    return selections;
}

export default function FolderAssignmentForm({
    folders,
    folderRoles,
    schedules,
    initialAssignments,
    workflowLevels,
    isEditMode = false,
    isLoading = false,
    isSubmitting = false,
    onBack,
    onSubmit,
}: FolderAssignmentFormProps) {
    /* =====================================================
       USERS
       ===================================================== */

    const [users, setUsers] =
        useState<User[]>([]);

    const [userLoading, setUserLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    /* =====================================================
       ASSIGNMENTS
       ===================================================== */

    const [assignments, setAssignments] =
        useState<FolderAssignment[]>(
            initialAssignments,
        );

    /* =====================================================
       WORKFLOW LEVEL SELECTIONS
       ===================================================== */

    const [
        workflowLevelSelections,
        setWorkflowLevelSelections,
    ] = useState<Record<string, string>>(
        () =>
            buildWorkflowLevelSelections(
                initialAssignments,
            ),
    );

    /* =====================================================
       VALIDATION
       ===================================================== */

    const [
        validationErrors,
        setValidationErrors,
    ] = useState<Record<string, string>>({});

    /* =====================================================
       CREATE MODE DROPDOWN STATE
       ===================================================== */

    const [openRole, setOpenRole] =
        useState<string | null>(null);

    const [searchValues, setSearchValues] =
        useState<Record<string, string>>({});

    /* =====================================================
       EDIT MODE USER / FOLDER ACCESS STATE
       ===================================================== */

    /*
     * Selected user in edit mode.
     */
    const [selectedEditUserId, setSelectedEditUserId] =
        useState<number | null>(null);

    /*
     * Search users on the left side of
     * the edit-mode access screen.
     */
    const [editUserSearch, setEditUserSearch] =
        useState("");

    /* =====================================================
       LOAD USERS
       ===================================================== */

    useEffect(() => {
        let cancelled = false;

        async function loadUsers() {
            try {
                setUserLoading(true);
                setError(null);

                const response =
                    (await getUsers()) as UserResponse;

                if (cancelled) {
                    return;
                }

                setUsers(
                    response.users ?? [],
                );
            } catch (err) {
                console.error(
                    "Failed to load users:",
                    err,
                );

                if (!cancelled) {
                    setError(
                        "Unable to load users.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setUserLoading(false);
                }
            }
        }

        void loadUsers();

        return () => {
            cancelled = true;
        };
    }, []);

    /* =====================================================
       ROLE ROWS
       ===================================================== */

    const roleRows = useMemo<RoleRow[]>(
        () => {
            if (!folderRoles) {
                return [];
            }

            return folderRoles.folders.flatMap(
                (folder) =>
                    folder.roles.map(
                        (role) => ({
                            folderId:
                                folder.folder_id,

                            folderName:
                                folder.folder_name,

                            role:
                                role.role,
                        }),
                    ),
            );
        },
        [folderRoles],
    );

    /* =====================================================
       EDIT MODE PROJECT USERS
       ===================================================== */

    /*
     * Users currently assigned anywhere in the project.
     *
     * We intentionally do NOT use all users from
     * getUsers() here because edit mode is about
     * changing folder access for existing project
     * members.
     */
    const assignedEditUsers = useMemo<User[]>(
        () => {
            const userIds =
                new Set<number>();

            for (const assignment of assignments) {
                for (const roleAssignment of assignment.role_assignments) {
                    userIds.add(
                        roleAssignment.user_id,
                    );
                }
            }

            return Array.from(userIds)
                .map((userId) =>
                    users.find(
                        (user) =>
                            user.uid ===
                            userId,
                    ),
                )
                .filter(
                    (
                        user,
                    ): user is User =>
                        Boolean(user),
                );
        },
        [assignments, users],
    );

    /*
     * Filter project users in edit mode.
     */
    const filteredEditUsers =
        useMemo<User[]>(
            () => {
                const search =
                    editUserSearch
                        .trim()
                        .toLowerCase();

                if (!search) {
                    return assignedEditUsers;
                }

                return assignedEditUsers.filter(
                    (user) =>
                        getUserName(user)
                            .toLowerCase()
                            .includes(search),
                );
            },
            [
                assignedEditUsers,
                editUserSearch,
            ],
        );

    /* =====================================================
       USER NAME
       ===================================================== */

    function getUserName(
        user: User,
    ): string {
        if (user.name) {
            return user.name;
        }

        const fullName = [
            user.firstname,
            user.lastname,
        ]
            .filter(Boolean)
            .join(" ");

        if (fullName) {
            return fullName;
        }

        if (user.username) {
            return user.username;
        }

        return `User ${user.uid}`;
    }

    /* =====================================================
       FIND USER
       ===================================================== */

    function getUser(
        userId: number,
    ): User | undefined {
        return users.find(
            (user) =>
                user.uid === userId,
        );
    }

    /* =====================================================
       ROLE KEY
       ===================================================== */

    function getRoleKey(
        folderId: number,
        role: string,
    ): string {
        return `${folderId}__${role}`;
    }

    /* =====================================================
       GET FOLDER ASSIGNMENT
       ===================================================== */

    function getFolderAssignment(
        folderId: number,
    ): FolderAssignment {
        const existing =
            assignments.find(
                (assignment) =>
                    assignment.folder_id ===
                    folderId,
            );

        if (existing) {
            return existing;
        }

        const schedule =
            schedules.find(
                (item) =>
                    item.folder_id ===
                    folderId,
            );

        return {
            folder_id: folderId,

            start_date:
                schedule?.start_date ?? "",

            end_date:
                schedule?.end_date ?? "",

            role_assignments: [],
        };
    }

    /* =====================================================
       GET SELECTED WORKFLOW LEVEL
       ===================================================== */

    function getSelectedWorkflowLevel(
        folderId: number,
        role: string,
    ): string {
        const key =
            getRoleKey(
                folderId,
                role,
            );

        return (
            workflowLevelSelections[key] ??
            ""
        );
    }

    /* =====================================================
       GET SELECTED USERS
       ===================================================== */

    function getSelectedUserIds(
        folderId: number,
        role: string,
    ): number[] {
        const assignment =
            getFolderAssignment(
                folderId,
            );

        return assignment.role_assignments
            .filter(
                (item) =>
                    item.role === role,
            )
            .map(
                (item) =>
                    item.user_id,
            );
    }

    /* =====================================================
       CHECK WHETHER USER HAS FOLDER ACCESS
       ===================================================== */

    function userHasFolderAccess(
        userId: number,
        folderId: number,
    ): boolean {
        const assignment =
            assignments.find(
                (item) =>
                    item.folder_id ===
                    folderId,
            );

        if (!assignment) {
            return false;
        }

        return assignment.role_assignments.some(
            (item) =>
                item.user_id ===
                userId,
        );
    }

    /* =====================================================
       GET USER'S EXISTING ROLE
       ===================================================== */

    function getUserExistingRole(
        userId: number,
    ): {
        role: string;
        workflow_level: string;
    } | null {
        /*
         * First try to find an existing role
         * for this user.
         */
        for (const assignment of assignments) {
            const roleAssignment =
                assignment.role_assignments.find(
                    (item) =>
                        item.user_id ===
                        userId,
                );

            if (roleAssignment) {
                return {
                    role:
                        roleAssignment.role,

                    workflow_level:
                        roleAssignment.workflow_level,
                };
            }
        }

        return null;
    }

    /* =====================================================
       GET ROLE FOR USER + FOLDER
       ===================================================== */

    function getRoleForUserFolder(
        userId: number,
        folderId: number,
    ): {
        role: string;
        workflow_level: string;
    } | null {
        /*
         * If the user already has an assignment
         * in this folder, preserve it exactly.
         */
        const existingFolder =
            assignments.find(
                (assignment) =>
                    assignment.folder_id ===
                    folderId,
            );

        const existingRole =
            existingFolder?.role_assignments.find(
                (item) =>
                    item.user_id ===
                    userId,
            );

        if (existingRole) {
            return {
                role:
                    existingRole.role,

                workflow_level:
                    existingRole.workflow_level,
            };
        }

        /*
         * When granting access to a new folder,
         * use the user's existing project role.
         */
        const userRole =
            getUserExistingRole(
                userId,
            );

        if (userRole) {
            return userRole;
        }

        /*
         * Final fallback:
         *
         * Use the first role configured on
         * the target folder.
         *
         * This is only relevant if the user
         * has no existing assignment anywhere.
         */
        const folderRoleData =
            folderRoles?.folders.find(
                (item) =>
                    item.folder_id ===
                    folderId,
            );

        const firstRole =
            folderRoleData?.roles?.[0];

        if (!firstRole) {
            return null;
        }

        const workflowLevel =
            getSelectedWorkflowLevel(
                folderId,
                firstRole.role,
            );

        return {
            role:
                firstRole.role,

            workflow_level:
                workflowLevel,
        };
    }

    /* =====================================================
       UPDATE WORKFLOW LEVEL
       ===================================================== */

    function updateWorkflowLevel(
        folderId: number,
        role: string,
        workflowLevel: string,
    ) {
        /*
         * Workflow mappings are completely
         * locked while editing.
         */
        if (isEditMode) {
            return;
        }

        const key =
            getRoleKey(
                folderId,
                role,
            );

        setWorkflowLevelSelections(
            (current) => ({
                ...current,
                [key]:
                    workflowLevel,
            }),
        );

        setAssignments(
            (current) =>
                current.map(
                    (assignment) => {
                        if (
                            assignment.folder_id !==
                            folderId
                        ) {
                            return assignment;
                        }

                        return {
                            ...assignment,

                            role_assignments:
                                assignment.role_assignments.map(
                                    (item) =>
                                        item.role === role
                                            ? {
                                                ...item,
                                                workflow_level:
                                                    workflowLevel,
                                            }
                                            : item,
                                ),
                        };
                    },
                ),
        );

        setValidationErrors(
            (current) => {
                if (!current[key]) {
                    return current;
                }

                const updated = {
                    ...current,
                };

                delete updated[key];

                return updated;
            },
        );
    }

    /* =====================================================
       TOGGLE USER
       ===================================================== */

    function toggleUser(
        folderId: number,
        role: string,
        userId: number,
    ) {
        const workflowLevel =
            getSelectedWorkflowLevel(
                folderId,
                role,
            );

        setAssignments(
            (current) => {
                const assignmentIndex =
                    current.findIndex(
                        (item) =>
                            item.folder_id ===
                            folderId,
                    );

                /*
                 * Folder does not have an assignment yet.
                 */
                if (
                    assignmentIndex ===
                    -1
                ) {
                    const schedule =
                        schedules.find(
                            (item) =>
                                item.folder_id ===
                                folderId,
                        );

                    const newAssignment:
                        FolderAssignment = {
                        folder_id:
                            folderId,

                        start_date:
                            schedule?.start_date ??
                            "",

                        end_date:
                            schedule?.end_date ??
                            "",

                        role_assignments: [
                            {
                                role,

                                user_id:
                                    userId,

                                workflow_level:
                                    workflowLevel,
                            },
                        ],
                    };

                    return [
                        ...current,
                        newAssignment,
                    ];
                }

                /*
                 * Update existing folder.
                 */
                return current.map(
                    (
                        assignment,
                        index,
                    ) => {
                        if (
                            index !==
                            assignmentIndex
                        ) {
                            return assignment;
                        }

                        const alreadySelected =
                            assignment.role_assignments.some(
                                (item) =>
                                    item.role ===
                                    role &&
                                    item.user_id ===
                                    userId,
                            );

                        /*
                         * Remove user.
                         */
                        if (
                            alreadySelected
                        ) {
                            return {
                                ...assignment,

                                role_assignments:
                                    assignment.role_assignments.filter(
                                        (item) =>
                                            !(
                                                item.role ===
                                                role &&
                                                item.user_id ===
                                                userId
                                            ),
                                    ),
                            };
                        }

                        /*
                         * Add user.
                         */
                        return {
                            ...assignment,

                            role_assignments: [
                                ...assignment.role_assignments,

                                {
                                    role,

                                    user_id:
                                        userId,

                                    workflow_level:
                                        workflowLevel,
                                },
                            ],
                        };
                    },
                );
            },
        );

        const key =
            getRoleKey(
                folderId,
                role,
            );

        setValidationErrors(
            (current) => {
                if (!current[key]) {
                    return current;
                }

                const updated = {
                    ...current,
                };

                delete updated[key];

                return updated;
            },
        );
    }

    /* =====================================================
       REMOVE USER
       ===================================================== */

    function removeUser(
        folderId: number,
        role: string,
        userId: number,
    ) {
        toggleUser(
            folderId,
            role,
            userId,
        );
    }

    /* =====================================================
       FILTER USERS
       ===================================================== */

    function getFilteredUsers(
        folderId: number,
        role: string,
    ): User[] {
        const key =
            getRoleKey(
                folderId,
                role,
            );

        const search =
            searchValues[key]
                ?.trim()
                .toLowerCase() ?? "";

        if (!search) {
            return users;
        }

        return users.filter(
            (user) =>
                getUserName(user)
                    .toLowerCase()
                    .includes(search),
        );
    }

    /* =====================================================
       SEARCH
       ===================================================== */

    function updateSearch(
        folderId: number,
        role: string,
        value: string,
    ) {
        const key =
            getRoleKey(
                folderId,
                role,
            );

        setSearchValues(
            (current) => ({
                ...current,
                [key]:
                    value,
            }),
        );
    }

    /* =====================================================
       EDIT MODE: TOGGLE FOLDER ACCESS
       ===================================================== */

    function toggleFolderAccess(
        userId: number,
        folderId: number,
        hasAccess: boolean,
    ) {
        if (isSubmitting) {
            return;
        }

        /*
         * REMOVE ACCESS
         */
        if (hasAccess) {
            setAssignments(
                (current) =>
                    current.map(
                        (assignment) => {
                            if (
                                assignment.folder_id !==
                                folderId
                            ) {
                                return assignment;
                            }

                            return {
                                ...assignment,

                                role_assignments:
                                    assignment.role_assignments.filter(
                                        (item) =>
                                            item.user_id !==
                                            userId,
                                    ),
                            };
                        },
                    ),
            );

            return;
        }

        /*
         * GRANT ACCESS
         */

        const roleMapping =
            getRoleForUserFolder(
                userId,
                folderId,
            );

        if (!roleMapping) {
            setError(
                "Unable to determine a role for this user on the selected folder.",
            );

            return;
        }

        if (
            !roleMapping.workflow_level
        ) {
            setError(
                "Unable to determine the existing workflow level for this user.",
            );

            return;
        }

        setError(null);

        setAssignments(
            (current) => {
                const existingIndex =
                    current.findIndex(
                        (assignment) =>
                            assignment.folder_id ===
                            folderId,
                    );

                /*
                 * Create folder assignment.
                 */
                if (
                    existingIndex ===
                    -1
                ) {
                    const schedule =
                        schedules.find(
                            (item) =>
                                item.folder_id ===
                                folderId,
                        );

                    const newAssignment:
                        FolderAssignment = {
                        folder_id:
                            folderId,

                        start_date:
                            schedule?.start_date ??
                            "",

                        end_date:
                            schedule?.end_date ??
                            "",

                        role_assignments: [
                            {
                                role:
                                    roleMapping.role,

                                user_id:
                                    userId,

                                workflow_level:
                                    roleMapping.workflow_level,
                            },
                        ],
                    };

                    return [
                        ...current,
                        newAssignment,
                    ];
                }

                /*
                 * Add user to existing folder.
                 */
                return current.map(
                    (
                        assignment,
                        index,
                    ) => {
                        if (
                            index !==
                            existingIndex
                        ) {
                            return assignment;
                        }

                        const alreadyExists =
                            assignment.role_assignments.some(
                                (item) =>
                                    item.user_id ===
                                    userId,
                            );

                        if (
                            alreadyExists
                        ) {
                            return assignment;
                        }

                        return {
                            ...assignment,

                            role_assignments: [
                                ...assignment.role_assignments,

                                {
                                    role:
                                        roleMapping.role,

                                    user_id:
                                        userId,

                                    workflow_level:
                                        roleMapping.workflow_level,
                                },
                            ],
                        };
                    },
                );
            },
        );
    }

    /* =====================================================
       EDIT MODE: USER FOLDER ACCESS COUNT
       ===================================================== */

    function getUserAccessCount(
        userId: number,
    ): number {
        return folders.filter(
            (folder) =>
                userHasFolderAccess(
                    userId,
                    folder.fid,
                ),
        ).length;
    }

    /* =====================================================
       EDIT MODE: CURRENT USER
       ===================================================== */

    const effectiveSelectedEditUserId =
        selectedEditUserId !== null &&
            assignedEditUsers.some(
                (user) => user.uid === selectedEditUserId,
            )
            ? selectedEditUserId
            : assignedEditUsers[0]?.uid ?? null;

    const selectedEditUser =
        effectiveSelectedEditUserId !== null
            ? getUser(effectiveSelectedEditUserId)
            : undefined;

    /* =====================================================
       VALIDATE
       ===================================================== */

    function validate(): boolean {
        /*
         * Edit mode uses folder-access
         * selection instead of role-level
         * validation.
         */
        if (isEditMode) {
            if (
                assignedEditUsers.length ===
                0
            ) {
                setError(
                    "No assigned users were found for this project.",
                );

                return false;
            }

            return true;
        }

        const errors:
            Record<string, string> = {};

        roleRows.forEach(
            (row) => {
                const key =
                    getRoleKey(
                        row.folderId,
                        row.role,
                    );

                const selectedUsers =
                    getSelectedUserIds(
                        row.folderId,
                        row.role,
                    );

                const workflowLevel =
                    getSelectedWorkflowLevel(
                        row.folderId,
                        row.role,
                    );

                if (
                    !workflowLevel &&
                    selectedUsers.length ===
                    0
                ) {
                    errors[key] =
                        `Please select a workflow level and at least one user for ${row.role}.`;

                    return;
                }

                if (!workflowLevel) {
                    errors[key] =
                        `Please select a workflow level for ${row.role}.`;

                    return;
                }

                if (
                    selectedUsers.length ===
                    0
                ) {
                    errors[key] =
                        `Please select at least one user for ${row.role}.`;

                    return;
                }
            },
        );

        setValidationErrors(
            errors,
        );

        return (
            Object.keys(errors)
                .length === 0
        );
    }

    /* =====================================================
       SUBMIT
       ===================================================== */

    async function handleSubmit() {
        if (!validate()) {
            return;
        }

        /*
         * Build complete assignments from
         * current folders + schedules + selected
         * users/workflow levels.
         *
         * In edit mode, workflow levels are
         * ALWAYS preserved from the current
         * assignment.
         */
        const completeAssignments:
            FolderAssignment[] =
            folders.map(
                (folder) => {
                    const existing =
                        getFolderAssignment(
                            folder.fid,
                        );

                    const schedule =
                        schedules.find(
                            (item) =>
                                item.folder_id ===
                                folder.fid,
                        );

                    return {
                        folder_id:
                            folder.fid,

                        start_date:
                            schedule?.start_date ??
                            existing.start_date,

                        end_date:
                            schedule?.end_date ??
                            existing.end_date,

                        role_assignments:
                            existing.role_assignments.map(
                                (
                                    assignment,
                                ) => {
                                    const workflowLevel =
                                        getSelectedWorkflowLevel(
                                            folder.fid,
                                            assignment.role,
                                        );

                                    return {
                                        role:
                                            assignment.role,

                                        user_id:
                                            assignment.user_id,

                                        workflow_level:
                                            isEditMode
                                                ? assignment.workflow_level
                                                : workflowLevel,
                                    };
                                },
                            ),
                    };
                },
            );

        console.log(
            "FINAL PROJECT ASSIGNMENTS:",
            JSON.stringify(
                completeAssignments,
                null,
                2,
            ),
        );

        await onSubmit(
            completeAssignments,
        );
    }

    /* =====================================================
       RENDER WORKFLOW LEVEL SELECTOR
       ===================================================== */

    function renderWorkflowLevelSelector(
        folderId: number,
        role: string,
    ) {
        const key =
            getRoleKey(
                folderId,
                role,
            );

        const selectedWorkflowLevel =
            getSelectedWorkflowLevel(
                folderId,
                role,
            );

        const selectedLevel =
            workflowLevels.find(
                (level) =>
                    level.label ===
                    selectedWorkflowLevel,
            );

        const roleError =
            validationErrors[key];

        return (
            <div className="mb-3">
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Workflow Level{" "}
                    <span className="text-red-500">
                        *
                    </span>
                </label>

                <select
                    value={
                        selectedWorkflowLevel
                    }
                    onChange={(event) =>
                        updateWorkflowLevel(
                            folderId,
                            role,
                            event.target.value,
                        )
                    }
                    disabled={
                        isEditMode ||
                        isSubmitting
                    }
                    className={`
            w-full
            rounded-lg
            border
            bg-white
            px-3
            py-2
            text-sm
            text-gray-800
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
            disabled:cursor-not-allowed
            disabled:bg-gray-100
            ${roleError &&
                            !selectedWorkflowLevel
                            ? "border-red-400"
                            : "border-gray-300"
                        }
          `}
                >
                    <option value="">
                        Select workflow level
                    </option>

                    {workflowLevels.map(
                        (level) => (
                            <option
                                key={
                                    level.label
                                }
                                value={
                                    level.label
                                }
                            >
                                {level.label}
                            </option>
                        ),
                    )}
                </select>

                {selectedLevel && (
                    <p className="mt-1.5 text-xs text-gray-500">
                        Actions:{" "}
                        {selectedLevel.actions
                            ?.length
                            ? selectedLevel.actions.join(
                                ", ",
                            )
                            : "No actions configured"}
                    </p>
                )}
            </div>
        );
    }

    /* =====================================================
       RENDER ROLE SELECTOR - CREATE MODE
       ===================================================== */

    function renderRoleSelector(
        folderId: number,
        role: string,
    ) {
        const key =
            getRoleKey(
                folderId,
                role,
            );

        const selectedUserIds =
            getSelectedUserIds(
                folderId,
                role,
            );

        const selectedUsers =
            selectedUserIds
                .map((userId) =>
                    getUser(userId),
                )
                .filter(
                    (
                        user,
                    ): user is User =>
                        Boolean(user),
                );

        const filteredUsers =
            getFilteredUsers(
                folderId,
                role,
            );

        const selectedWorkflowLevel =
            getSelectedWorkflowLevel(
                folderId,
                role,
            );

        const isOpen =
            openRole === key;

        const roleError =
            validationErrors[key];

        return (
            <div
                key={key}
                className="rounded-lg border border-gray-200 bg-white"
            >
                <div className="px-4 py-3">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-800">
                                {role}
                            </label>

                            <p className="mt-0.5 text-xs text-gray-400">
                                Select workflow level
                                and users
                            </p>
                        </div>

                        {selectedUsers.length >
                            0 && (
                                <span className="text-xs text-gray-500">
                                    {
                                        selectedUsers.length
                                    }{" "}
                                    selected
                                </span>
                            )}
                    </div>

                    {renderWorkflowLevelSelector(
                        folderId,
                        role,
                    )}

                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Users{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <div className="relative">
                        <button
                            type="button"
                            disabled={
                                isSubmitting
                            }
                            onClick={() =>
                                setOpenRole(
                                    isOpen
                                        ? null
                                        : key,
                                )
                            }
                            className={`
                flex
                min-h-[42px]
                w-full
                items-center
                justify-between
                rounded-lg
                border
                bg-white
                px-3
                py-2
                text-left
                text-sm
                transition
                hover:border-gray-400
                disabled:cursor-not-allowed
                disabled:bg-gray-100
                ${roleError &&
                                    selectedUsers.length ===
                                    0
                                    ? "border-red-400"
                                    : "border-gray-300"
                                }
              `}
                        >
                            <div className="min-w-0 flex-1">
                                {selectedUsers.length ===
                                    0 ? (
                                    <span className="text-gray-400">
                                        Select users...
                                    </span>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedUsers
                                            .slice(
                                                0,
                                                3,
                                            )
                                            .map(
                                                (
                                                    user,
                                                ) => (
                                                    <span
                                                        key={
                                                            user.uid
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                                    >
                                                        {
                                                            getUserName(
                                                                user,
                                                            )
                                                        }

                                                        <X
                                                            size={
                                                                12
                                                            }
                                                            className="cursor-pointer"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();

                                                                if (
                                                                    !isSubmitting
                                                                ) {
                                                                    removeUser(
                                                                        folderId,
                                                                        role,
                                                                        user.uid,
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    </span>
                                                ),
                                            )}

                                        {selectedUsers.length >
                                            3 && (
                                                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                                    +
                                                    {selectedUsers.length -
                                                        3}{" "}
                                                    more
                                                </span>
                                            )}
                                    </div>
                                )}
                            </div>

                            <ChevronDown
                                size={17}
                                className={`
                  ml-2
                  shrink-0
                  text-gray-400
                  transition-transform
                  ${isOpen
                                        ? "rotate-180"
                                        : ""
                                    }
                `}
                            />
                        </button>

                        {isOpen && (
                            <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                                <div className="border-b border-gray-100 p-2">
                                    <div className="relative">
                                        <Search
                                            size={16}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="text"
                                            autoFocus
                                            value={
                                                searchValues[
                                                key
                                                ] ??
                                                ""
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateSearch(
                                                    folderId,
                                                    role,
                                                    event.target
                                                        .value,
                                                )
                                            }
                                            onClick={(
                                                event,
                                            ) =>
                                                event.stopPropagation()
                                            }
                                            placeholder="Search users..."
                                            className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>

                                <div className="max-h-64 overflow-y-auto p-1">
                                    {filteredUsers.length ===
                                        0 ? (
                                        <div className="px-3 py-6 text-center text-sm text-gray-500">
                                            No users
                                            found.
                                        </div>
                                    ) : (
                                        filteredUsers.map(
                                            (
                                                user,
                                            ) => {
                                                const selected =
                                                    selectedUserIds.includes(
                                                        user.uid,
                                                    );

                                                return (
                                                    <button
                                                        key={
                                                            user.uid
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            toggleUser(
                                                                folderId,
                                                                role,
                                                                user.uid,
                                                            )
                                                        }
                                                        className={`
                              flex
                              w-full
                              items-center
                              gap-3
                              rounded-md
                              px-3
                              py-2.5
                              text-left
                              transition
                              ${selected
                                                                ? "bg-blue-50"
                                                                : "hover:bg-gray-50"
                                                            }
                            `}
                                                    >
                                                        <span
                                                            className={`
                                flex
                                h-4
                                w-4
                                shrink-0
                                items-center
                                justify-center
                                rounded
                                border
                                ${selected
                                                                    ? "border-blue-600 bg-blue-600"
                                                                    : "border-gray-300 bg-white"
                                                                }
                              `}
                                                        >
                                                            {selected && (
                                                                <Check
                                                                    size={
                                                                        12
                                                                    }
                                                                    strokeWidth={
                                                                        3
                                                                    }
                                                                    className="text-white"
                                                                />
                                                            )}
                                                        </span>

                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                                            {getUserName(
                                                                user,
                                                            )
                                                                .charAt(
                                                                    0,
                                                                )
                                                                .toUpperCase()}
                                                        </span>

                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate text-sm font-medium text-gray-800">
                                                                {getUserName(
                                                                    user,
                                                                )}
                                                            </span>

                                                            {user.username && (
                                                                <span className="block truncate text-xs text-gray-400">
                                                                    {
                                                                        user.username
                                                                    }
                                                                </span>
                                                            )}
                                                        </span>

                                                        {selected && (
                                                            <span className="text-xs font-medium text-blue-600">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            },
                                        )
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2">
                                    <span className="text-xs text-gray-500">
                                        {
                                            selectedUsers.length
                                        }{" "}
                                        selected
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpenRole(
                                                null,
                                            );

                                            setSearchValues(
                                                (
                                                    current,
                                                ) => ({
                                                    ...current,
                                                    [key]:
                                                        "",
                                                }),
                                            );
                                        }}
                                        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {roleError && (
                        <p className="mt-2 text-xs text-red-600">
                            {roleError}
                        </p>
                    )}

                    {selectedWorkflowLevel && (
                        <div className="mt-3 rounded-md bg-gray-50 px-3 py-2">
                            <p className="text-xs text-gray-500">
                                Workflow mapping
                            </p>

                            <p className="mt-0.5 text-xs font-medium text-gray-700">
                                {role}{" "}
                                <span className="mx-1 text-gray-400">
                                    →
                                </span>

                                <span className="text-blue-600">
                                    {
                                        selectedWorkflowLevel
                                    }
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* =====================================================
       FOLDER RENDERER - CREATE MODE
       ===================================================== */

    function renderFolder(
        node: FolderNode,
        level: number,
    ): React.ReactNode {
        const folder =
            node.folder;

        const folderRoleData =
            folderRoles?.folders.find(
                (item) =>
                    item.folder_id ===
                    folder.fid,
            );

        const schedule =
            schedules.find(
                (item) =>
                    item.folder_id ===
                    folder.fid,
            );

        return (
            <div key={folder.fid}>
                <div className="overflow-visible rounded-xl border border-gray-200 bg-white">
                    <div
                        className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-4"
                        style={{
                            paddingLeft:
                                `${16 +
                                level * 28
                                }px`,
                        }}
                    >
                        <FolderIcon
                            size={19}
                            className="shrink-0 text-blue-600"
                        />

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                                {folder.fname}
                            </p>

                            {folder.fnamedesc && (
                                <p className="mt-0.5 text-xs text-gray-500">
                                    {
                                        folder.fnamedesc
                                    }
                                </p>
                            )}
                        </div>

                        {schedule && (
                            <div className="hidden items-center gap-3 text-xs text-gray-500 md:flex">
                                <span className="inline-flex items-center gap-1">
                                    <CalendarDays
                                        size={13}
                                    />

                                    {
                                        schedule.start_date
                                    }
                                </span>

                                <span>
                                    →
                                </span>

                                <span>
                                    {
                                        schedule.end_date
                                    }
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 p-4">
                        {!folderRoleData ||
                            folderRoleData.roles
                                .length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center">
                                <p className="text-sm text-gray-500">
                                    No roles configured
                                    for this folder.
                                </p>
                            </div>
                        ) : (
                            folderRoleData.roles.map(
                                (
                                    roleItem,
                                ) =>
                                    renderRoleSelector(
                                        folder.fid,
                                        roleItem.role,
                                    ),
                            )
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* =====================================================
       EDIT MODE USER ACCESS UI
       ===================================================== */

    function renderEditMode() {
        return (
            <div className="p-6 sm:p-8">
                {/* HEADER */}

                <div className="mb-6">
                    <div className="flex items-center gap-2">
                        <Users
                            size={20}
                            className="text-blue-600"
                        />

                        <h2 className="text-lg font-semibold text-gray-900">
                            Members & Folder Access
                        </h2>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                        Select a project member on the left,
                        then choose which folders that user
                        can access.
                    </p>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* WORKFLOW LOCK NOTICE */}

                <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                    <Lock
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <div>
                        <p className="text-sm font-medium text-amber-900">
                            Workflow configuration is locked
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-700">
                            Existing roles and workflow levels
                            are preserved. You can only change
                            folder access for project members.
                        </p>
                    </div>
                </div>

                {/* ACCESS EDITOR */}

                <div className="grid min-h-[520px] grid-cols-1 overflow-hidden rounded-xl border border-gray-200 bg-white lg:grid-cols-[300px_minmax(0,1fr)]">
                    {/* LEFT - USERS */}

                    <div className="border-b border-gray-200 bg-gray-50 lg:border-b-0 lg:border-r">
                        <div className="border-b border-gray-200 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        Project Members
                                    </p>

                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {
                                            assignedEditUsers.length
                                        }{" "}
                                        assigned users
                                    </p>
                                </div>

                                <Users
                                    size={18}
                                    className="text-blue-600"
                                />
                            </div>

                            {/* SEARCH */}

                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    value={
                                        editUserSearch
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setEditUserSearch(
                                            event.target
                                                .value,
                                        )
                                    }
                                    placeholder="Search members..."
                                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        {/* USER LIST */}

                        <div className="max-h-[560px] overflow-y-auto p-2">
                            {filteredEditUsers.length ===
                                0 ? (
                                <div className="px-4 py-10 text-center">
                                    <Users
                                        size={28}
                                        className="mx-auto mb-2 text-gray-300"
                                    />

                                    <p className="text-sm text-gray-500">
                                        No project members
                                        found.
                                    </p>
                                </div>
                            ) : (
                                filteredEditUsers.map(
                                    (
                                        user,
                                    ) => {
                                        const selected =
                                            effectiveSelectedEditUserId === user.uid;

                                        const accessCount =
                                            getUserAccessCount(
                                                user.uid,
                                            );

                                        return (
                                            <button
                                                key={
                                                    user.uid
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setSelectedEditUserId(
                                                        user.uid,
                                                    )
                                                }
                                                className={`
                          mb-1 flex
                          w-full
                          items-center
                          gap-3
                          rounded-lg
                          px-3
                          py-3
                          text-left
                          transition
                          ${selected
                                                        ? "bg-blue-50 ring-1 ring-blue-200"
                                                        : "hover:bg-white"
                                                    }
                        `}
                                            >
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                                    {getUserName(
                                                        user,
                                                    )
                                                        .charAt(
                                                            0,
                                                        )
                                                        .toUpperCase()}
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium text-gray-800">
                                                        {getUserName(
                                                            user,
                                                        )}
                                                    </span>

                                                    {user.username && (
                                                        <span className="block truncate text-xs text-gray-400">
                                                            {
                                                                user.username
                                                            }
                                                        </span>
                                                    )}

                                                    <span className="mt-0.5 block text-xs text-gray-500">
                                                        {
                                                            accessCount
                                                        }{" "}
                                                        of{" "}
                                                        {
                                                            folders.length
                                                        }{" "}
                                                        folders
                                                    </span>
                                                </span>

                                                {selected && (
                                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                                                )}
                                            </button>
                                        );
                                    },
                                )
                            )}
                        </div>
                    </div>

                    {/* RIGHT - FOLDERS */}

                    <div className="min-w-0 bg-white">
                        <div className="border-b border-gray-200 px-5 py-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        Folder Access
                                    </p>

                                    {selectedEditUser && (
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Set folder access
                                            for{" "}
                                            <span className="font-medium text-gray-700">
                                                {
                                                    getUserName(
                                                        selectedEditUser,
                                                    )
                                                }
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {selectedEditUser && (
                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                        {
                                            getUserAccessCount(
                                                selectedEditUser.uid,
                                            )
                                        }{" "}
                                        /{" "}
                                        {
                                            folders.length
                                        }{" "}
                                        accessible
                                    </span>
                                )}
                            </div>
                        </div>

                        {!selectedEditUser ? (
                            <div className="flex min-h-[430px] items-center justify-center p-8 text-center">
                                <div>
                                    <Users
                                        size={36}
                                        className="mx-auto mb-3 text-gray-300"
                                    />

                                    <p className="text-sm font-medium text-gray-600">
                                        Select a project member
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Choose a user from the
                                        left to manage folder
                                        access.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <div className="min-w-[620px]">
                                    {/* TABLE HEADER */}

                                    <div className="grid grid-cols-[minmax(0,1fr)_120px_120px] items-center border-b border-gray-100 bg-gray-50 px-5 py-3">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Folder
                                        </div>

                                        <div className="text-center text-xs font-semibold uppercase tracking-wide text-green-600">
                                            Access
                                        </div>

                                        <div className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            No Access
                                        </div>
                                    </div>

                                    {/* FOLDER ROWS */}

                                    <div className="divide-y divide-gray-100">
                                        {folders.map(
                                            (
                                                folder,
                                            ) => {
                                                const hasAccess =
                                                    userHasFolderAccess(
                                                        selectedEditUser.uid,
                                                        folder.fid,
                                                    );

                                                const schedule =
                                                    schedules.find(
                                                        (item) =>
                                                            item.folder_id ===
                                                            folder.fid,
                                                    );

                                                return (
                                                    <div
                                                        key={
                                                            folder.fid
                                                        }
                                                        className="grid grid-cols-[minmax(0,1fr)_120px_120px] items-center px-5 py-4 transition hover:bg-gray-50"
                                                    >
                                                        {/* FOLDER */}

                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                                                                <FolderIcon
                                                                    size={
                                                                        18
                                                                    }
                                                                    className="text-blue-600"
                                                                />
                                                            </span>

                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium text-gray-800">
                                                                    {
                                                                        folder.fname
                                                                    }
                                                                </p>

                                                                {folder.fnamedesc && (
                                                                    <p className="mt-0.5 truncate text-xs text-gray-400">
                                                                        {
                                                                            folder.fnamedesc
                                                                        }
                                                                    </p>
                                                                )}

                                                                {schedule && (
                                                                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                                                        <CalendarDays
                                                                            size={
                                                                                12
                                                                            }
                                                                        />

                                                                        {
                                                                            schedule.start_date
                                                                        }

                                                                        <span>
                                                                            →
                                                                        </span>

                                                                        {
                                                                            schedule.end_date
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* ACCESS */}

                                                        <div className="flex justify-center">
                                                            <label className="inline-flex cursor-pointer items-center justify-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`folder-access-${selectedEditUser.uid}-${folder.fid}`}
                                                                    checked={
                                                                        hasAccess
                                                                    }
                                                                    disabled={
                                                                        isSubmitting
                                                                    }
                                                                    onChange={() =>
                                                                        toggleFolderAccess(
                                                                            selectedEditUser.uid,
                                                                            folder.fid,
                                                                            false,
                                                                        )
                                                                    }
                                                                    className="h-5 w-5 accent-green-600"
                                                                />
                                                            </label>
                                                        </div>

                                                        {/* NO ACCESS */}

                                                        <div className="flex justify-center">
                                                            <label className="inline-flex cursor-pointer items-center justify-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`folder-access-${selectedEditUser.uid}-${folder.fid}`}
                                                                    checked={
                                                                        !hasAccess
                                                                    }
                                                                    disabled={
                                                                        isSubmitting
                                                                    }
                                                                    onChange={() =>
                                                                        toggleFolderAccess(
                                                                            selectedEditUser.uid,
                                                                            folder.fid,
                                                                            true,
                                                                        )
                                                                    }
                                                                    className="h-5 w-5 accent-gray-500"
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>

                                    {folders.length ===
                                        0 && (
                                            <div className="px-6 py-12 text-center">
                                                <FolderIcon
                                                    size={32}
                                                    className="mx-auto mb-3 text-gray-300"
                                                />

                                                <p className="text-sm text-gray-500">
                                                    No folders found
                                                    for this project.
                                                </p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* =====================================================
       LOADING
       ===================================================== */

    if (
        isLoading ||
        userLoading
    ) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Loader2
                        size={20}
                        className="animate-spin"
                    />

                    {isLoading
                        ? "Loading folder roles..."
                        : "Loading users..."}
                </div>
            </div>
        );
    }

    /* =====================================================
       EDIT MODE
       ===================================================== */

    if (isEditMode) {
        return (
            <>
                {renderEditMode()}

                {/* FOOTER */}

                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={
                            isSubmitting
                        }
                        className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-medium
              text-gray-700
              transition
              hover:bg-gray-50
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
                    >
                        <ChevronLeft
                            size={17}
                        />

                        Back
                    </button>

                    <button
                        type="button"
                        onClick={
                            handleSubmit
                        }
                        disabled={
                            isSubmitting ||
                            userLoading ||
                            isLoading
                        }
                        className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-blue-600
              px-5
              py-2.5
              text-sm
              font-medium
              text-white
              transition
              hover:bg-blue-700
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2
                                    size={17}
                                    className="animate-spin"
                                />

                                Updating Project...
                            </>
                        ) : (
                            <>
                                <Check
                                    size={17}
                                />

                                Update Project
                            </>
                        )}
                    </button>
                </div>
            </>
        );
    }

    /* =====================================================
       CREATE MODE
       ===================================================== */

    return (
        <>
            <div className="p-6 sm:p-8">
                {/* HEADER */}

                <div className="mb-8">
                    <div className="flex items-center gap-2">
                        <Users
                            size={20}
                            className="text-blue-600"
                        />

                        <h2 className="text-lg font-semibold text-gray-900">
                            Members & Roles
                        </h2>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                        Assign users to each role
                        and manually select the
                        workflow level for that role.
                    </p>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* WORKFLOW LEVELS */}

                {workflowLevels.length ===
                    0 && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            No workflow levels are
                            available for the selected
                            template.
                        </div>
                    )}

                {/* SUMMARY */}

                <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
                    <div className="flex items-start gap-3">
                        <Users
                            size={19}
                            className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div>
                            <p className="text-sm font-medium text-blue-900">
                                Assign users and workflow levels
                            </p>

                            <p className="mt-1 text-xs leading-5 text-blue-700">
                                For every role, first
                                select the workflow
                                level that the role
                                should use, then select
                                one or more users. The
                                role name and workflow
                                level are independent.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FOLDER TREE */}

                <FolderTree
                    folders={folders}
                    renderFolder={
                        renderFolder
                    }
                />

                {/* NO ROLES */}

                {roleRows.length === 0 && (
                    <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                        <p className="text-sm font-medium text-yellow-900">
                            No roles found
                        </p>

                        <p className="mt-1 text-sm text-yellow-700">
                            The selected template
                            does not have any
                            roles configured
                            for its folders.
                        </p>
                    </div>
                )}
            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={
                        isSubmitting
                    }
                    className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-gray-700
            transition
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
                >
                    <ChevronLeft
                        size={17}
                    />

                    Back
                </button>

                <button
                    type="button"
                    onClick={
                        handleSubmit
                    }
                    disabled={
                        isSubmitting ||
                        userLoading ||
                        isLoading ||
                        workflowLevels.length ===
                        0
                    }
                    className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-blue-600
            px-5
            py-2.5
            text-sm
            font-medium
            text-white
            transition
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
                >
                    {isSubmitting ? (
                        <>
                            <Loader2
                                size={17}
                                className="animate-spin"
                            />

                            Creating Project...
                        </>
                    ) : (
                        <>
                            <Check
                                size={17}
                            />

                            Create Project
                        </>
                    )}
                </button>
            </div>
        </>
    );
}
