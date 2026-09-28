import { useMemo } from "react";

import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    Handle,
    Position,
    type Edge,
    type Node,
    type NodeProps,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

/* =========================================================
   DEMO PROCESS JSON
========================================================= */

const processData = {
    ProcessJson: {
        Processid: 48,
        ProcessName: "Stories Writing Workflow",
        DocumentType: "Writing",
        NumberofTasks: 3,

        Tasks: [
            {
                TaskTypeID: 1,
                TaskType: "Writing",

                position: {
                    x: 100,
                    y: 100,
                },

                TaskDetails: {
                    TaskName: "Writer",
                    DocumentType: "Writing",
                    ConfigID: "b5a5d5d5-ebce-4575-bcd5-fa44b295d1e4",
                    ConfigType: "approval",
                    KeyParam: "",
                    ItemParams: [],
                    Attributes: [],

                    Levels: [
                        {
                            level: 1,
                            role: "Writer",
                        },
                    ],

                    Level: {
                        level: 1,
                        role: "Writer",
                    },
                },
            },

            {
                TaskTypeID: 1,
                TaskType: "Writing",

                position: {
                    x: 400,
                    y: 100,
                },

                TaskDetails: {
                    TaskName: "Reviewer",
                    DocumentType: "Writing",
                    ConfigID: "b5a5d5d5-ebce-4575-bcd5-fa44b295d1e4",
                    ConfigType: "approval",
                    KeyParam: "",
                    ItemParams: [],
                    Attributes: [],

                    Levels: [
                        {
                            level: 2,
                            role: "Reviewer",
                        },
                    ],

                    Level: {
                        level: 2,
                        role: "Reviewer",
                    },
                },
            },

            {
                TaskTypeID: 1,
                TaskType: "Writing",

                position: {
                    x: 700,
                    y: 100,
                },

                TaskDetails: {
                    TaskName: "Editor",
                    DocumentType: "Writing",
                    ConfigID: "b5a5d5d5-ebce-4575-bcd5-fa44b295d1e4",
                    ConfigType: "approval",
                    KeyParam: "",
                    ItemParams: [],
                    Attributes: [],

                    Levels: [
                        {
                            level: 3,
                            role: "Editor",
                        },
                    ],

                    Level: {
                        level: 3,
                        role: "Editor",
                    },
                },
            },
        ],

        connections: [
            {
                source: "task-1",
                target: "task-2",
            },
            {
                source: "task-2",
                target: "task-3",
            },
        ],
    },
};

/* =========================================================
   CUSTOM NODE
========================================================= */

interface WorkflowNodeData extends Record<string, unknown> {
    taskNumber: number;
    taskName: string;
    taskType: string;
    documentType: string;
    configType: string;
    level: number;
    role: string;
}

function WorkflowNode({
    data,
}: NodeProps<Node<WorkflowNodeData>>) {
    return (
        <div className="w-[250px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">

            {/* Incoming connection */}
            <Handle
                type="target"
                position={Position.Left}
                className="!h-3 !w-3 !border-2 !border-white !bg-cyan-500 dark:!border-slate-900"
            />

            {/* Header */}
            <div className="flex items-center justify-between bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 text-sm font-bold text-white">
                        {data.taskNumber}
                    </div>

                    <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                            {data.taskName}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {data.taskType}
                        </div>
                    </div>
                </div>

                <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-medium uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    {data.configType}
                </span>
            </div>

            {/* Body */}
            <div className="space-y-3 px-4 py-4">

                <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Document Type
                    </div>

                    <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                        {data.documentType}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div>
                        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Level
                        </div>

                        <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                            Level {data.level}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Role
                        </div>

                        <div className="mt-1 text-sm font-medium text-cyan-600 dark:text-cyan-400">
                            {data.role}
                        </div>
                    </div>
                </div>
            </div>

            {/* Outgoing connection */}
            <Handle
                type="source"
                position={Position.Right}
                className="!h-3 !w-3 !border-2 !border-white !bg-cyan-500 dark:!border-slate-900"
            />
        </div>
    );
}

/* =========================================================
   NODE TYPES
========================================================= */

const nodeTypes = {
    workflow: WorkflowNode,
};

/* =========================================================
   COMPONENT
========================================================= */

export default function StoriesWorkflowDiagram() {
    const { Tasks, connections } = processData.ProcessJson;

    /* -----------------------------------------------------
       Convert Tasks -> React Flow Nodes
    ----------------------------------------------------- */

    const nodes = useMemo<Node<WorkflowNodeData>[]>(() => {
        return Tasks.map((task, index) => {
            const level = task.TaskDetails.Level;

            return {
                id: `task-${index + 1}`,

                type: "workflow",

                position: {
                    x: task.position.x,
                    y: task.position.y,
                },

                data: {
                    taskNumber: index + 1,
                    taskName: task.TaskDetails.TaskName,
                    taskType: task.TaskType,
                    documentType: task.TaskDetails.DocumentType,
                    configType: task.TaskDetails.ConfigType,
                    level: level.level,
                    role: level.role,
                },

                sourcePosition: Position.Right,
                targetPosition: Position.Left,
            };
        });
    }, [Tasks]);

    /* -----------------------------------------------------
       Convert connections -> React Flow Edges
    ----------------------------------------------------- */

    const edges = useMemo<Edge[]>(() => {
        return connections.map((connection, index) => ({
            id: `edge-${index + 1}`,

            source: connection.source,
            target: connection.target,

            type: "smoothstep",

            animated: true,

            style: {
                strokeWidth: 2,
            },
        }));
    }, [connections]);

    return (
        <div className="h-[650px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">

            {/* Header */}
            <div className="absolute z-10 m-4 rounded-xl border border-slate-200 bg-white/95 px-5 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">

                <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {processData.ProcessJson.ProcessName}
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                        Document: {processData.ProcessJson.DocumentType}
                    </span>

                    <span>•</span>

                    <span>
                        {processData.ProcessJson.NumberofTasks} Tasks
                    </span>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{
                    padding: 0.25,
                }}
                minZoom={0.5}
                maxZoom={1.5}
                nodesConnectable={false}
                nodesDraggable={true}
                elementsSelectable={true}
            >
                <Background gap={20} size={1} />

                <Controls />

                <MiniMap
                    pannable
                    zoomable
                    nodeColor={() => "#06b6d4"}
                />
            </ReactFlow>
        </div>
    );
}