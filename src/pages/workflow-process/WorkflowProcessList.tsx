import { useEffect, useState } from "react";
import {
    Eye,
    Loader2,
    Plus,
    RefreshCw,
    Workflow,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
    getProcesses,
    type ProcessListItem,
} from "../../api/process";

export default function WorkflowProcessList() {
    const navigate = useNavigate();

    const [processes, setProcesses] =
        useState<ProcessListItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        loadProcesses();
    }, []);

    async function loadProcesses() {
        try {
            setLoading(true);
            setError("");

            const response =
                await getProcesses();

            setProcesses(
                response.data?.processes || []
            );
        } catch (err) {
            console.error(
                "Failed to load processes",
                err
            );

            setError(
                "Failed to load workflow processes."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-7xl p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950">
                                <Workflow className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    Project Templates
                                </h1>

                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage workflow process and templates definitions.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/projecttemplate"
                            )
                        }
                        className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-cyan-700"
                    >
                        <Plus className="h-4 w-4" />
                        Add Template
                    </button>
                </div>

                {/* Content */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">
                                Templates
                            </h2>

                            {!loading && (
                                <p className="mt-0.5 text-xs text-gray-500">
                                    {processes.length} template
                                    {processes.length === 1
                                        ? ""
                                        : "s"}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={loadProcesses}
                            disabled={loading}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
                            title="Refresh"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${
                                    loading
                                        ? "animate-spin"
                                        : ""
                                }`}
                            />
                        </button>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="flex min-h-[300px] items-center justify-center">
                            <Loader2 className="h-7 w-7 animate-spin text-cyan-500" />
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="p-6">
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
                                <div className="flex items-center justify-between gap-4">
                                    <span>{error}</span>

                                    <button
                                        type="button"
                                        onClick={
                                            loadProcesses
                                        }
                                        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading &&
                        !error &&
                        processes.length === 0 && (
                            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                                <Workflow className="mb-3 h-10 w-10 text-gray-400" />

                                <h3 className="font-medium text-gray-900 dark:text-white">
                                    No processes found
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Create a workflow process
                                    to get started.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/workflow-process/create"
                                        )
                                    }
                                    className="mt-4 flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Process
                                </button>
                            </div>
                        )}

                    {/* Table */}
                    {!loading &&
                        !error &&
                        processes.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                                            <th className="px-5 py-3 font-medium">
                                                Process
                                            </th>

                                            <th className="px-5 py-3 font-medium">
                                                Process ID
                                            </th>

                                            <th className="px-5 py-3 font-medium">
                                                Tasks
                                            </th>

                                            <th className="px-5 py-3 text-right font-medium">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {processes.map(
                                            (process) => (
                                                <tr
                                                    key={
                                                        process.process_id
                                                    }
                                                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                                                <Workflow className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                            </div>

                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white">
                                                                    {
                                                                        process.process_name
                                                                    }
                                                                </div>

                                                                <div className="mt-0.5 text-xs text-gray-500">
                                                                    Workflow
                                                                    Process
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                        #
                                                        {
                                                            process.process_id
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                            {
                                                                process.number_of_tasks
                                                            }{" "}
                                                            {process.number_of_tasks ===
                                                            1
                                                                ? "Task"
                                                                : "Tasks"}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/workflow-process/${process.process_id}`
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}