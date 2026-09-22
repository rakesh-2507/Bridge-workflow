import {
    useCallback,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Loader2,
    Save,
    Settings,
} from "lucide-react";

import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    Handle,
    MarkerType,
    MiniMap,
    Position,
    useEdgesState,
    useNodesState,
} from "reactflow";

import type {
    Connection,
    Edge,
    Node,
    NodeProps,
} from "reactflow";

import "reactflow/dist/style.css";

import type {
    WorkflowDefinition,
} from "../../types/workflow";

/* =========================================================
   TYPES
========================================================= */

interface WorkflowNodeData {
    number: number;
    stage: string;
    details: string;
    status:
    | "completed"
    | "active"
    | "pending";
}

/*
 * This is the JSON structure that will eventually
 * be sent to your API.
 */
interface SavedWorkflowStage {
    id: string;
    stage: string;
    details: string;

    position: {
        x: number;
        y: number;
    };
}

interface SavedWorkflowConnection {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
}

interface SavedWorkflow {
    workflow_id: string;
    title: string;

    stages: SavedWorkflowStage[];

    connections: SavedWorkflowConnection[];
}

/* =========================================================
   NODE
========================================================= */

const WorkflowStageNode = ({
    data,
}: NodeProps<WorkflowNodeData>) => {
    const isCompleted =
        data.status === "completed";

    const isActive =
        data.status === "active";

    return (
        <div
            className="
                relative
                w-[300px]
                overflow-hidden
                rounded-2xl
                border
                border-gray-200
                bg-white
                shadow-xl
                transition-all
                hover:-translate-y-1
                hover:shadow-2xl
                dark:border-gray-700
                dark:bg-gray-900
            "
        >
            {/* TARGET HANDLE */}

            <Handle
                type="target"
                position={Position.Left}
                className="
                    !h-3
                    !w-3
                    !border-2
                    !border-white
                    !bg-gray-400
                    dark:!border-gray-900
                "
            />

            {/* SOURCE HANDLE */}

            <Handle
                type="source"
                position={Position.Right}
                className="
                    !h-3
                    !w-3
                    !border-2
                    !border-white
                    !bg-cyan-500
                    dark:!border-gray-900
                "
            />

            {/* ACCENT */}

            <div
                className={`
                    absolute
                    left-0
                    top-0
                    h-full
                    w-1
                    ${isCompleted
                        ? "bg-emerald-500"
                        : isActive
                            ? "bg-cyan-500"
                            : "bg-gray-400"
                    }
                `}
            />

            {/* HEADER */}

            <div className="flex items-center justify-between px-5 pt-5">
                <div
                    className={`
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-full
                        text-xs
                        font-bold
                        ${isCompleted
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : isActive
                                ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }
                    `}
                >
                    {String(data.number).padStart(2, "0")}
                </div>

                <span
                    className="
                        rounded-full
                        bg-gray-100
                        px-2.5
                        py-1
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-500
                        dark:bg-gray-800
                        dark:text-gray-400
                    "
                >
                    Stage {data.number}
                </span>
            </div>

            {/* ICON */}

            <div className="px-5 pt-5">
                <div
                    className={`
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-xl
                        ${isCompleted
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : isActive
                                ? "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }
                    `}
                >
                    {isCompleted ? (
                        <CheckCircle2 size={23} />
                    ) : isActive ? (
                        <Settings size={23} />
                    ) : (
                        <Circle size={23} />
                    )}
                </div>
            </div>

            {/* CONTENT */}

            <div className="px-5 pb-5 pt-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {data.stage}
                </h2>

                <p className="mt-1.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    {data.details ||
                        "No description available"}
                </p>
            </div>

            {/* STATUS */}

            <div
                className="
                    border-t
                    border-gray-100
                    px-5
                    py-3
                    dark:border-gray-800
                "
            >
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                        Workflow stage
                    </span>

                    <div className="flex items-center gap-1.5">
                        <span
                            className={`
                                h-1.5
                                w-1.5
                                rounded-full
                                ${isCompleted
                                    ? "bg-emerald-500"
                                    : isActive
                                        ? "bg-cyan-500"
                                        : "bg-gray-400"
                                }
                            `}
                        />

                        <span className="text-[10px] font-semibold capitalize text-gray-500 dark:text-gray-400">
                            {data.status}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const nodeTypes = {
    workflowStage: WorkflowStageNode,
};

/* =========================================================
   STORAGE KEY
========================================================= */

const getStorageKey = (
    workflowId: string,
) => {
    return `workflow-diagram-${workflowId}`;
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const WorkflowDiagram = () => {
    const navigate = useNavigate();

    const location = useLocation();

    const { workflowId } = useParams();

    const workflow =
        location.state?.workflow as
        | WorkflowDefinition
        | undefined;

    const [isSaving, setIsSaving] =
        useState(false);

    const [saved, setSaved] =
        useState(false);

    /* =======================================================
       DEFAULT NODES
    ======================================================= */

    const defaultNodes = useMemo(() => {
        if (!workflow) {
            return [];
        }

        return workflow.stages.map(
            (
                stage,
                index,
            ): Node<WorkflowNodeData> => ({
                id:
                    stage.id ||
                    `stage-${index + 1}`,

                type: "workflowStage",

                position: {
                    x:
                        150 +
                        (index % 4) * 380,

                    y:
                        150 +
                        Math.floor(
                            index / 4,
                        ) * 280,
                },

                data: {
                    number: index + 1,

                    stage: stage.stage,

                    details: stage.details,

                    status:
                        index === 0
                            ? "completed"
                            : index === 1
                                ? "active"
                                : "pending",
                },

                draggable: true,
            }),
        );
    }, [workflow]);

    /* =======================================================
       LOAD SAVED DATA
    ======================================================= */

    const loadSavedWorkflow =
        useCallback(() => {
            if (!workflow || !workflowId) {
                return null;
            }

            try {
                const storageKey =
                    getStorageKey(
                        workflowId,
                    );

                const stored =
                    localStorage.getItem(
                        storageKey,
                    );

                if (!stored) {
                    return null;
                }

                const parsed =
                    JSON.parse(
                        stored,
                    ) as SavedWorkflow;

                if (
                    !parsed ||
                    !Array.isArray(
                        parsed.stages,
                    )
                ) {
                    return null;
                }

                return parsed;
            } catch (error) {
                console.error(
                    "Failed to load saved workflow:",
                    error,
                );

                return null;
            }
        }, [
            workflow,
            workflowId,
        ]);

    /* =======================================================
       INITIAL NODES
    ======================================================= */

    const initialNodes = useMemo(() => {
        const savedWorkflow =
            loadSavedWorkflow();

        if (
            !savedWorkflow ||
            !savedWorkflow.stages.length
        ) {
            return defaultNodes;
        }

        return defaultNodes.map(
            (node) => {
                const savedStage =
                    savedWorkflow.stages.find(
                        (stage) =>
                            stage.id ===
                            node.id,
                    );

                if (!savedStage) {
                    return node;
                }

                return {
                    ...node,

                    position:
                        savedStage.position,

                    data: {
                        ...node.data,

                        stage:
                            savedStage.stage,

                        details:
                            savedStage.details,
                    },
                };
            },
        );
    }, [
        defaultNodes,
        loadSavedWorkflow,
    ]);

    /* =======================================================
       INITIAL EDGES
    ======================================================= */

    const initialEdges =
        useMemo<Edge[]>(() => {
            const savedWorkflow =
                loadSavedWorkflow();

            if (
                !savedWorkflow ||
                !Array.isArray(
                    savedWorkflow.connections,
                )
            ) {
                return [];
            }

            return savedWorkflow.connections.map(
                (connection) => ({
                    id:
                        connection.id ||
                        `edge-${connection.source}-${connection.target}`,

                    source:
                        connection.source,

                    target:
                        connection.target,

                    sourceHandle:
                        connection.sourceHandle,

                    targetHandle:
                        connection.targetHandle,

                    type: "bezier",

                    markerEnd: {
                        type:
                            MarkerType.ArrowClosed,

                        width: 18,

                        height: 18,

                        color: "#6366f1",
                    },

                    style: {
                        stroke: "#6366f1",

                        strokeWidth: 2.5,
                    },
                }),
            );
        }, [loadSavedWorkflow]);

    /* =======================================================
       REACT FLOW STATE
    ======================================================= */

    const [
        nodes,
        ,
        onNodesChange,
    ] = useNodesState<WorkflowNodeData>(
        initialNodes,
    );

    const [
        edges,
        setEdges,
        onEdgesChange,
    ] = useEdgesState(
        initialEdges,
    );


    /* =======================================================
       MANUAL CONNECTION
    ======================================================= */

    const onConnect = useCallback(
        (connection: Connection) => {
            if (
                !connection.source ||
                !connection.target
            ) {
                return;
            }

            /*
             * Prevent self connection.
             */
            if (
                connection.source ===
                connection.target
            ) {
                return;
            }

            /*
             * Prevent exact duplicate.
             */
            const alreadyExists =
                edges.some(
                    (edge) =>
                        edge.source ===
                        connection.source &&
                        edge.target ===
                        connection.target,
                );

            if (alreadyExists) {
                return;
            }

            const newEdge: Edge = {
                id: `edge-${Date.now()}`,

                source:
                    connection.source,

                target:
                    connection.target,

                sourceHandle:
                    connection.sourceHandle,

                targetHandle:
                    connection.targetHandle,

                /*
                 * BEZIER = curved line
                 */
                type: "bezier",

                /*
                 * Do NOT use animated: true.
                 * Animated edges appear dotted.
                 */
                markerEnd: {
                    type:
                        MarkerType.ArrowClosed,

                    width: 18,

                    height: 18,

                    color: "#6366f1",
                },

                style: {
                    stroke: "#6366f1",

                    strokeWidth: 2.5,
                },
            };

            setEdges(
                (currentEdges) => [
                    ...currentEdges,
                    newEdge,
                ],
            );

            setSaved(false);
        },
        [edges, setEdges],
    );

    /* =======================================================
       SAVE WORKFLOW
    ======================================================= */

    const handleSaveWorkflow =
        useCallback(async () => {
            if (!workflow || !workflowId) {
                return;
            }

            setIsSaving(true);

            setSaved(false);

            try {
                /*
                 * Convert React Flow nodes into
                 * clean API JSON.
                 */
                const savedStages =
                    nodes.map(
                        (node) => ({
                            id: node.id,

                            stage:
                                node.data.stage,

                            details:
                                node.data
                                    .details,

                            position: {
                                x: node.position.x,

                                y: node.position.y,
                            },
                        }),
                    );

                /*
                 * Convert React Flow edges into
                 * clean API JSON.
                 */
                const savedConnections =
                    edges.map(
                        (edge) => ({
                            id: edge.id,

                            source:
                                edge.source,

                            target:
                                edge.target,

                            sourceHandle:
                                edge.sourceHandle,

                            targetHandle:
                                edge.targetHandle,
                        }),
                    );

                /*
                 * THIS is the JSON you will
                 * eventually send to your API.
                 */
                const payload: SavedWorkflow =
                {
                    workflow_id:
                        workflowId,

                    title:
                        workflow.title,

                    stages:
                        savedStages,

                    connections:
                        savedConnections,
                };

                console.log(
                    "WORKFLOW JSON:",
                    JSON.stringify(
                        payload,
                        null,
                        2,
                    ),
                );

                /*
                 * TEMPORARY STORAGE
                 *
                 * This makes the diagram survive
                 * page refresh right now.
                 */
                localStorage.setItem(
                    getStorageKey(
                        workflowId,
                    ),

                    JSON.stringify(
                        payload,
                    ),
                );

                /*
                 * =================================================
                 * LATER REPLACE THE localStorage PART WITH API:
                 *
                 * await saveWorkflow(payload);
                 * =================================================
                 */

                setSaved(true);

                /*
                 * Remove "Saved" message after 3 seconds.
                 */
                window.setTimeout(() => {
                    setSaved(false);
                }, 3000);
            } catch (error) {
                console.error(
                    "Failed to save workflow:",
                    error,
                );
            } finally {
                setIsSaving(false);
            }
        }, [
            workflow,
            workflowId,
            nodes,
            edges,
        ]);

    /* =======================================================
       NO WORKFLOW
    ======================================================= */

    if (!workflow) {
        return (
            <div className="flex min-h-full items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Workflow not found
                    </h2>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/workflow-process",
                            )
                        }
                        className="
                            mt-3
                            rounded-lg
                            bg-cyan-600
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-white
                        "
                    >
                        Back to Workflows
                    </button>
                </div>
            </div>
        );
    }

    /* =======================================================
       RENDER
    ======================================================= */

    return (
        <div
            className="
                relative
                h-full
                min-h-[calc(100vh-64px)]
                w-full
                overflow-hidden
                bg-gray-50
                dark:bg-gray-950
            "
        >
            {/* =================================================
                TOP BAR
            ================================================= */}

            <div
                className="
                    absolute
                    left-0
                    right-0
                    top-0
                    z-20
                    flex
                    h-16
                    items-center
                    justify-between
                    border-b
                    border-gray-200
                    bg-white/95
                    px-5
                    shadow-sm
                    backdrop-blur
                    dark:border-gray-800
                    dark:bg-gray-900/95
                "
            >
                {/* LEFT */}

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/workflow-process",
                            )
                        }
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            border
                            border-gray-200
                            bg-white
                            text-gray-500
                            transition
                            hover:bg-gray-100
                            hover:text-gray-900
                            dark:border-gray-700
                            dark:bg-gray-900
                            dark:text-gray-400
                            dark:hover:bg-gray-800
                            dark:hover:text-white
                        "
                    >
                        <ArrowLeft
                            size={17}
                        />
                    </button>

                    <div>
                        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {workflow.title}
                        </h1>

                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {
                                workflow
                                    .stages
                                    .length
                            }{" "}
                            workflow stages
                        </p>
                    </div>
                </div>

                {/* RIGHT */}

                <div className="flex items-center gap-2">
                    {saved && (
                        <div
                            className="
                                flex
                                items-center
                                gap-1.5
                                rounded-lg
                                bg-emerald-50
                                px-3
                                py-2
                                text-xs
                                font-medium
                                text-emerald-600
                                dark:bg-emerald-950/40
                                dark:text-emerald-400
                            "
                        >
                            <CheckCircle2
                                size={14}
                            />

                            Saved
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={
                            handleSaveWorkflow
                        }
                        disabled={isSaving}
                        className="
                            flex
                            items-center
                            gap-2
                            rounded-lg
                            bg-cyan-600
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-cyan-700
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        {isSaving ? (
                            <Loader2
                                size={15}
                                className="animate-spin"
                            />
                        ) : (
                            <Save
                                size={15}
                            />
                        )}

                        {isSaving
                            ? "Saving..."
                            : "Save Workflow"}
                    </button>
                </div>
            </div>

            {/* =================================================
                REACT FLOW
            ================================================= */}

            <div className="absolute inset-0 pt-16">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={
                        onNodesChange
                    }
                    onEdgesChange={
                        onEdgesChange
                    }
                    onConnect={onConnect}
                    fitView
                    fitViewOptions={{
                        padding: 0.25,
                    }}
                    nodesDraggable
                    nodesConnectable
                    elementsSelectable
                    panOnDrag
                    zoomOnScroll
                    zoomOnPinch
                    zoomOnDoubleClick
                    minZoom={0.4}
                    maxZoom={1.8}
                    connectionLineStyle={{
                        stroke: "#6366f1",
                        strokeWidth: 2.5,
                    }}
                    deleteKeyCode={[
                        "Backspace",
                        "Delete",
                    ]}
                    proOptions={{
                        hideAttribution: true,
                    }}
                >
                    <Background
                        variant={
                            BackgroundVariant.Dots
                        }
                        gap={22}
                        size={1.2}
                        color="#cbd5e1"
                    />

                    <Controls
                        showInteractive={false}
                        className="
                            !overflow-hidden
                            !rounded-xl
                            !border
                            !border-gray-200
                            !bg-white
                            !shadow-lg
                            dark:!border-gray-700
                            dark:!bg-gray-900
                        "
                    />

                    <MiniMap
                        pannable
                        zoomable
                        nodeColor={() =>
                            "#6366f1"
                        }
                        maskColor="rgba(15, 23, 42, 0.08)"
                        className="
                            !overflow-hidden
                            !rounded-xl
                            !border
                            !border-gray-200
                            !bg-white
                            !shadow-lg
                            dark:!border-gray-700
                            dark:!bg-gray-900
                        "
                    />
                </ReactFlow>
            </div>

            {/* =================================================
                BOTTOM INFO
            ================================================= */}

            <div
                className="
                    absolute
                    bottom-5
                    left-5
                    z-10
                    rounded-xl
                    border
                    border-gray-200
                    bg-white/95
                    px-4
                    py-3
                    shadow-lg
                    backdrop-blur
                    dark:border-gray-800
                    dark:bg-gray-900/95
                "
            >
                <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Workflow
                </div>

                <div className="mt-1 flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {
                            workflow
                                .stages
                                .length
                        }{" "}
                        {workflow.stages
                            .length === 1
                            ? "Stage"
                            : "Stages"}
                    </span>

                    <span className="h-3 w-px bg-gray-300 dark:bg-gray-700" />

                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {edges.length}{" "}
                        {edges.length ===
                            1
                            ? "connection"
                            : "connections"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default WorkflowDiagram;