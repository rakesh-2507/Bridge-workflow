import { useEffect, useMemo, useState } from "react";

import {
    CheckCircle2,
    Loader2,
    Search,
    User,
    Users,
} from "lucide-react";

import {
    createAssetPurchaseTask,
} from "../../api/assetPurchase";

import {
    getUsers,
} from "../../api/users";

import type {
    User as UserType,
} from "../../api/users";

interface AssignAssetRequestProps {
    documentNo: string;
    onBack: () => void;
    onComplete: () => void;
}

function AssignAssetRequest({
    documentNo,
    onBack,
    onComplete,
}: AssignAssetRequestProps) {

    const [users, setUsers] =
        useState<UserType[]>([]);

    const [selectedUser, setSelectedUser] =
        useState<number | null>(null);

    const [search, setSearch] =
        useState("");

    const [isLoadingUsers, setIsLoadingUsers] =
        useState(true);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    useEffect(() => {

        async function loadUsers() {

            try {

                setIsLoadingUsers(true);
                setErrorMessage("");

                const response = await getUsers();

                const assetExecutives = (response.users ?? []).filter((user) =>
                    user.mtype?.toLowerCase().replace(/\s+/g, "-") === "assets-executive"
                );
                setUsers(assetExecutives);

            } catch (error) {

                console.error(
                    "Failed to load users:",
                    error
                );

                setErrorMessage(
                    "Failed to load users."
                );

            } finally {
                setIsLoadingUsers(false);
            }
        }

        loadUsers();

    }, []);

    const filteredUsers = useMemo(() => {

        const searchValue =
            search.trim().toLowerCase();

        if (!searchValue) {
            return users;
        }

        return users.filter((user) => {

            const fullName =
                `${user.firstname} ${user.lastname}`
                    .toLowerCase();

            return (
                fullName.includes(searchValue) ||
                user.loginname
                    ?.toLowerCase()
                    .includes(searchValue) ||
                user.email
                    ?.toLowerCase()
                    .includes(searchValue)
            );
        });

    }, [users, search]);

    function getFullName(user: UserType) {

        const name =
            `${user.firstname} ${user.lastname}`
                .trim();

        return (
            name ||
            user.loginname ||
            `User ${user.uid}`
        );
    }

    async function handleCreateTask() {

        if (!selectedUser) {

            setErrorMessage(
                "Please select a user."
            );

            return;
        }

        try {

            setIsSubmitting(true);
            setErrorMessage("");

            await createAssetPurchaseTask({

                document_type:
                    "AssetPurchaseRequest",

                document_no:
                    documentNo,

                assigned_to:
                    selectedUser,
            });

            onComplete();

        } catch (error) {

            console.error(
                "Failed to create asset purchase task:",
                error
            );

            setErrorMessage(
                "Failed to create the task. Please try again."
            );

        } finally {

            setIsSubmitting(false);

        }
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">

                <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Users size={20} />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Assign User
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Assign this asset purchase request to a user.
                        </p>
                    </div>

                </div>

                {/* Request Number */}
                <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">

                    <div>

                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Asset Request
                        </div>

                        <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                            {documentNo}
                        </div>

                    </div>

                    <div className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Created
                    </div>

                </div>

            </div>

            <div className="p-6">

                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                    Asset purchase requests must initially be assigned to an
                    <strong> Assets-Executive</strong>.
                </div>

                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assign To
                    <span className="ml-1 text-red-500">
                        *
                    </span>
                </label>

                <div className="relative">

                    <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search users by name, login or email..."
                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />

                </div>

                {/* User list */}
                <div className="mt-3 max-h-[400px] space-y-2 overflow-y-auto rounded-lg">

                    {isLoadingUsers ? (

                        <div className="flex items-center justify-center py-12">

                            <Loader2
                                size={22}
                                className="animate-spin text-blue-600"
                            />

                            <span className="ml-2 text-sm text-gray-500">
                                Loading users...
                            </span>

                        </div>

                    ) : filteredUsers.length === 0 ? (

                        <div className="py-12 text-center">

                            <User
                                size={30}
                                className="mx-auto text-gray-400"
                            />

                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                No users found.
                            </p>

                        </div>

                    ) : (

                        filteredUsers.map((user) => {

                            const isSelected =
                                selectedUser === user.uid;

                            return (
                                <button
                                    key={user.uid}
                                    type="button"
                                    onClick={() => {
                                        setSelectedUser(
                                            user.uid
                                        );

                                        setErrorMessage("");
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${isSelected
                                        ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                                        }`}
                                >

                                    {/* Avatar */}
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isSelected
                                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            }`}
                                    >
                                        <User size={18} />
                                    </div>

                                    {/* User info */}
                                    <div className="min-w-0 flex-1">

                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {getFullName(user)}
                                        </div>

                                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                            @{user.loginname}
                                        </div>

                                        {user.email && (
                                            <div className="truncate text-xs text-gray-400 dark:text-gray-500">
                                                {user.email}
                                            </div>
                                        )}

                                    </div>

                                    {/* Selected */}
                                    {isSelected && (
                                        <CheckCircle2
                                            size={21}
                                            className="shrink-0 text-blue-600"
                                        />
                                    )}

                                </button>
                            );
                        })

                    )}

                </div>

                {/* Selected user */}
                {selectedUser && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-900/20">

                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Selected User
                        </div>

                        <div className="mt-1 text-sm font-semibold text-blue-900 dark:text-blue-300">
                            {
                                getFullName(
                                    users.find(
                                        (user) =>
                                            user.uid ===
                                            selectedUser
                                    )!
                                )
                            }
                        </div>

                    </div>
                )}

                {/* Error */}
                {errorMessage && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                        {errorMessage}
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">

                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                    Back
                </button>

                <button
                    type="button"
                    onClick={handleCreateTask}
                    disabled={
                        isSubmitting ||
                        isLoadingUsers ||
                        !selectedUser
                    }
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                    {isSubmitting ? (
                        <>
                            <Loader2
                                size={16}
                                className="animate-spin"
                            />

                            Creating Task...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={16} />

                            Create Task
                        </>
                    )}

                </button>

            </div>

        </div>
    );
}

export default AssignAssetRequest;