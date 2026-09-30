import { useCallback, useEffect, useState } from "react";

import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    addEdge,
    applyNodeChanges,
    type Connection,
    type Edge,
    type Node,
    type NodeChange,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
    ArrowLeft,
    Loader2,
    Save,
} from "lucide-react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getProcess,
    saveProcessDesigner,
    type ProcessDesignerPayload,
    type ProcessJson,
    type ProcessTask,
} from "../../api/process";

type WorkflowNodeData = {
    label: string;
    taskType: string;
    role: string;
    level: number;
    configType?: string;
    actions?: string[];
};

type WorkflowNode = Node<WorkflowNodeData>;

export default function ViewProcess() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const processId = Number(id);

    const [process, setProcess] =
        useState<ProcessJson | null>(null);

    const [nodes, setNodes] =
        useState<WorkflowNode[]>([]);

    const [edges, setEdges] =
        useState<Edge[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    /*
     * Load process whenever the route process ID changes.
     */
    useEffect(() => {
        let cancelled = false;

        async function fetchProcess() {
            setLoading(true);
            setError("");

            try {
                const response = await getProcess(processId);

                if (cancelled) {
                    return;
                }

                const processData = response.ProcessJson;

                setProcess(processData);

                /*
                 * Convert API tasks into React Flow nodes.
                 *
                 * The original ProcessTask remains in `process`.
                 * React Flow only stores the information required
                 * to display and edit the diagram.
                 */
                const flowNodes: WorkflowNode[] =
                    processData.Tasks.map(
                        (task: ProcessTask) => ({
                            id: String(task.TaskID),

                            position: task.position || {
                                x: 100,
                                y: 100,
                            },

                            data: {
                                label:
                                    task.TaskDetails?.TaskName ||
                                    task.TaskType ||
                                    "Task",

                                taskType:
                                    task.TaskType || "",

                                role:
                                    task.TaskDetails?.Level?.role ||
                                    "",

                                level:
                                    task.TaskDetails?.Level?.level ||
                                    0,

                                configType:
                                    task.TaskDetails?.ConfigType,

                                actions:
                                    task.TaskDetails?.Actions || [],
                            },
                        })
                    );

                /*
                 * Convert saved API connections into React Flow edges.
                 *
                 * IMPORTANT:
                 * We preserve source -> target exactly as returned
                 * by the API. React Flow will therefore display the
                 * same workflow direction that was saved.
                 */
                const flowEdges: Edge[] = (
                    processData.connections || []
                ).map((connection, index) => ({
                    id: `edge-${index}-${String(
                        connection.source
                    )}-${String(connection.target)}`,

                    source: String(connection.source),

                    target: String(connection.target),
                }));

                setNodes(flowNodes);
                setEdges(flowEdges);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "Failed to load process:",
                    err
                );

                setProcess(null);
                setNodes([]);
                setEdges([]);
                setError("Failed to load process.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        if (Number.isFinite(processId)) {
            void fetchProcess();
        }

        return () => {
            cancelled = true;
        };
    }, [processId]);

    /*
     * Handle React Flow node changes.
     *
     * This includes:
     * - dragging
     * - selecting
     * - deleting
     * - position changes
     */
    const onNodesChange = useCallback(
        (changes: NodeChange<WorkflowNode>[]) => {
            setNodes((currentNodes) =>
                applyNodeChanges(
                    changes,
                    currentNodes
                )
            );
        },
        []
    );

    /*
     * Handle a new React Flow connection.
     *
     * React Flow gives us:
     *
     * source = node where the connection starts
     * target = node where the connection ends
     *
     * We preserve that direction when saving.
     */
    const onConnect = useCallback(
        (connection: Connection) => {
            if (
                !connection.source ||
                !connection.target
            ) {
                return;
            }

            if (
                connection.source ===
                connection.target
            ) {
                return;
            }

            console.log(
                "New workflow connection:",
                connection
            );

            setEdges((currentEdges) => {
                /*
                 * Prevent duplicate connections.
                 */
                const alreadyExists =
                    currentEdges.some(
                        (edge) =>
                            edge.source ===
                            connection.source &&
                            edge.target ===
                            connection.target
                    );

                if (alreadyExists) {
                    return currentEdges;
                }

                const updatedEdges = addEdge(
                    connection,
                    currentEdges
                );

                console.log(
                    "Updated workflow edges:",
                    updatedEdges
                );

                return updatedEdges;
            });
        },
        []
    );

    /*
     * Save the current workflow designer state.
     */
    async function handleSave() {
        if (!process) {
            return;
        }

        if (!Number.isFinite(processId)) {
            setError("Invalid process ID.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            /*
             * Keep only tasks whose nodes still exist in React Flow.
             *
             * The original ProcessTask is retained here so that the
             * local process state does not lose TaskDetails.
             */
            const updatedTasks: ProcessTask[] =
                process.Tasks
                    .filter((task) =>
                        nodes.some(
                            (node) =>
                                node.id ===
                                String(task.TaskID)
                        )
                    )
                    .map((task) => {
                        const node = nodes.find(
                            (item) =>
                                item.id ===
                                String(task.TaskID)
                        );

                        if (!node) {
                            return task;
                        }

                        return {
                            ...task,

                            position: {
                                x: node.position.x,
                                y: node.position.y,
                            },

                            /*
                             * Preserve existing TaskDetails.
                             *
                             * We only update position here if the
                             * backend response contains this field.
                             */
                            TaskDetails: task.TaskDetails
                                ? {
                                    ...task.TaskDetails,
                                }
                                : task.TaskDetails,
                        };
                    });

            /*
             * IDs of tasks that still exist.
             */
            const remainingNodeIds = new Set(
                updatedTasks.map(
                    (task) =>
                        String(task.TaskID)
                )
            );

            /*
             * Keep only connections whose source and target
             * nodes still exist.
             *
             * Direction is NOT changed:
             *
             * source -> target
             */
            const updatedConnections =
                edges
                    .filter(
                        (edge) =>
                            remainingNodeIds.has(
                                String(edge.source)
                            ) &&
                            remainingNodeIds.has(
                                String(edge.target)
                            )
                    )
                    .map((edge) => ({
                        source: String(
                            edge.source
                        ),

                        target: String(
                            edge.target
                        ),
                    }));

            /*
             * IMPORTANT:
             *
             * The designer endpoint currently expects:
             *
             * {
             *     process_name,
             *     tasks: [
             *         {
             *             task_config_id,
             *             position
             *         }
             *     ],
             *     connections: [
             *         {
             *             source,
             *             target
             *         }
             *     ]
             * }
             *
             * Do not send ProcessJson here.
             */
            const designerPayload: ProcessDesignerPayload = {
                process_name:
                    process.ProcessName,

                tasks: updatedTasks.map(
                    (task) => ({
                        task_config_id:
                            task.task_config_id,

                        position:
                            task.position || {
                                x: 100,
                                y: 100,
                            },
                    })
                ),

                connections:
                    updatedConnections,
            };

            console.log(
                "DESIGNER SAVE PAYLOAD:",
                JSON.stringify(
                    designerPayload,
                    null,
                    2
                )
            );

            /*
             * Save to:
             *
             * PUT /api/process/{process_id}/designer
             */
            await saveProcessDesigner(
                processId,
                designerPayload
            );

            /*
             * Update local process state after
             * successful save.
             */
            const updatedProcess: ProcessJson = {
                ...process,

                NumberofTasks:
                    updatedTasks.length,

                Tasks: updatedTasks,

                connections:
                    updatedConnections,
            };

            setProcess(updatedProcess);

            console.log(
                "Process designer saved successfully."
            );
        } catch (err) {
            console.error(
                "Failed to save process:",
                err
            );

            setError(
                "Failed to save process."
            );
        } finally {
            setSaving(false);
        }
    }

    /*
     * Invalid route ID.
     */
    if (!Number.isFinite(processId)) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
                <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-950/30">
                    Invalid process ID.
                </div>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/workflow-process"
                        )
                    }
                    className="mt-4 flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Processes
                </button>
            </div>
        );
    }

    /*
     * Loading state.
     */
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="h-7 w-7 animate-spin text-cyan-500" />
            </div>
        );
    }

    /*
     * Process not found or API error.
     */
    if (!process) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
                <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-950/30">
                    {error ||
                        "Process not found."}
                </div>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/workflow-process"
                        )
                    }
                    className="mt-4 flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Processes
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/workflow-process"
                            )
                        }
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Back to processes"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div>
                        <h1 className="font-semibold text-gray-900 dark:text-white">
                            {process.ProcessName}
                        </h1>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Process ID:{" "}
                            {process.Processid}
                            {" · "}
                            {nodes.length} tasks
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}

                    {saving
                        ? "Saving..."
                        : "Save"}
                </button>
            </header>

            {/* Error notification */}
            {error && (
                <div
                    role="alert"
                    className="absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 shadow dark:border-red-900 dark:bg-red-950/90"
                >
                    {error}
                </div>
            )}

            {/* Workflow designer */}
            <div className="min-h-0 flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onConnect={onConnect}
                    fitView
                >
                    <MiniMap />
                    <Controls />
                    <Background />
                </ReactFlow>
            </div>
        </div>
    );
}
