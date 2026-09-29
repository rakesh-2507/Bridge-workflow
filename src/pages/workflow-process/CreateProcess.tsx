import { useState } from "react";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
    createProcess,
    type ProcessTask,
} from "../../api/process";

interface TaskForm {
    taskType: string;
    role: string;
    level: number;
}

interface CreateProcessResponse {
    ProcessJson?: {
        Processid?: number;
    };
    data?: {
        ProcessJson?: {
            Processid?: number;
        };
        Processid?: number;
    };
    Processid?: number;
}

export default function CreateProcess() {
    const navigate = useNavigate();

    const [processName, setProcessName] = useState("");
    const [documentType, setDocumentType] = useState("");

    const [tasks, setTasks] = useState<TaskForm[]>([
        {
            taskType: "Writer",
            role: "Writer",
            level: 1,
        },
    ]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function addTask() {
        setTasks((current) => [
            ...current,
            {
                taskType: "",
                role: "",
                level: current.length + 1,
            },
        ]);
    }

    function removeTask(index: number) {
        setTasks((current) =>
            current.filter((_, i) => i !== index)
        );
    }

    function updateTask(
        index: number,
        field: keyof TaskForm,
        value: string | number
    ) {
        setTasks((current) =>
            current.map((task, i) =>
                i === index
                    ? {
                        ...task,
                        [field]: value,
                    }
                    : task
            )
        );
    }

    async function handleSubmit(
        event: React.FormEvent
    ) {
        event.preventDefault();

        if (!processName.trim()) {
            setError("Process name is required.");
            return;
        }

        if (tasks.length === 0) {
            setError("Add at least one task.");
            return;
        }

        if (
            tasks.some(
                (task) =>
                    !task.taskType.trim() ||
                    !task.role.trim()
            )
        ) {
            setError(
                "Task type and role are required for every task."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            const processTasks: ProcessTask[] =
                tasks.map((task, index) => ({
                    TaskID: `task-${index + 1}-${index}`,
                    task_config_id: index + 1,
                    TaskTypeID: 1,
                    TaskType: task.taskType,

                    position: {
                        x: 100 + index * 300,
                        y: 100,
                    },

                    TaskDetails: {
                        Level: {
                            role: task.role,
                            level: task.level,
                        },

                        Levels: [
                            {
                                role: task.role,
                                level: task.level,
                            },
                        ],

                        Actions: [
                            "Approve",
                            "Reject",
                        ],

                        ConfigID: "",
                        KeyParam: "",
                        TaskName: task.taskType,

                        position: {
                            x: 100 + index * 300,
                            y: 100,
                        },

                        Attributes: [],
                        ConfigType: "approval",
                        ItemParams: [],
                    },
                }));

            const processJson = {
                ProcessName: processName.trim(),
                DocumentType: documentType.trim(),
                NumberofTasks: processTasks.length,

                Tasks: processTasks,

                connections: processTasks
                    .slice(0, -1)
                    .map((task, index) => ({
                        source: task.TaskID,
                        target:
                            processTasks[index + 1].TaskID,
                    })),
            };

            const response = (await createProcess(
                processJson
            )) as CreateProcessResponse;

            const createdId =
                response?.ProcessJson?.Processid ??
                response?.data?.ProcessJson?.Processid ??
                response?.Processid ??
                response?.data?.Processid;

            if (createdId) {
                navigate(
                    `/workflow-process/${createdId}`
                );
            } else {
                navigate("/workflow-process");
            }
        } catch (err) {
            console.error(
                "Failed to create process",
                err
            );

            setError(
                "Failed to create process."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-5xl p-6">
                <div className="mb-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/workflow-process")
                        }
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            Create Process
                        </h1>

                        <p className="text-sm text-gray-500">
                            Define the workflow process and its tasks.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                        <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">
                            Process Details
                        </h2>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Process Name
                                </label>

                                <input
                                    value={processName}
                                    onChange={(e) =>
                                        setProcessName(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Stories Writing Workflow"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Document Type
                                </label>

                                <input
                                    value={documentType}
                                    onChange={(e) =>
                                        setDocumentType(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Writing"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Workflow Tasks
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Define the stages of the process.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={addTask}
                                className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                            >
                                <Plus className="h-4 w-4" />
                                Add Task
                            </button>
                        </div>

                        <div className="space-y-4">
                            {tasks.map((task, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Task {index + 1}
                                        </span>

                                        {tasks.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeTask(
                                                        index
                                                    )
                                                }
                                                className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div>
                                            <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                Task Type
                                            </label>

                                            <input
                                                value={
                                                    task.taskType
                                                }
                                                onChange={(e) =>
                                                    updateTask(
                                                        index,
                                                        "taskType",
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                placeholder="Writer"
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                Role
                                            </label>

                                            <input
                                                value={task.role}
                                                onChange={(e) =>
                                                    updateTask(
                                                        index,
                                                        "role",
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                placeholder="Writer"
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                Level
                                            </label>

                                            <input
                                                type="number"
                                                min={1}
                                                value={task.level}
                                                onChange={(e) =>
                                                    updateTask(
                                                        index,
                                                        "level",
                                                        Number(
                                                            e.target
                                                                .value
                                                        )
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/workflow-process"
                                )
                            }
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-60"
                        >
                            {saving && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}

                            {saving
                                ? "Creating..."
                                : "Create Process"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}