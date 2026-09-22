import {
    useCallback,
    useEffect,
    useMemo,
} from "react";

import {
    ArrowLeft,
    CheckCircle2,
    Circle,
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
            {/* TARGET */}

            {data.number > 1 && (
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
            )}

            {/* SOURCE */}

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
                    {String(data.number).padStart(
                        2,
                        "0",
                    )}
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

    console.log("Workflow ID:", workflowId);
    console.log("Workflow:", workflow);
    /* =======================================================
       NODES
    ======================================================= */

    const initialNodes = useMemo(() => {
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
                    x: index * 380 + 80,
                    y: 180,
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
       EDGES
    ======================================================= */

    const initialEdges = useMemo(() => {
        if (!workflow) {
            return [];
        }

        return workflow.stages
            .slice(0, -1)
            .map(
                (stage, index): Edge => ({
                    id: `edge-${index + 1}-${index + 2}`,

                    source:
                        stage.id ||
                        `stage-${index + 1}`,

                    target:
                        workflow.stages[index + 1]
                            .id ||
                        `stage-${index + 2}`,

                    type: "smoothstep",

                    animated: true,

                    markerEnd: {
                        type: MarkerType.ArrowClosed,
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
    }, [workflow]);

    /* =======================================================
       REACT FLOW STATE
    ======================================================= */

    const [
        nodes,
        setNodes,
        onNodesChange,
    ] = useNodesState<WorkflowNodeData>(
        initialNodes,
    );

    const [
        edges,
        setEdges,
        onEdgesChange,
    ] = useEdgesState(initialEdges);

    /* =======================================================
       RESET WHEN WORKFLOW CHANGES
    ======================================================= */

    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [
        initialNodes,
        initialEdges,
        setNodes,
        setEdges,
    ]);

    /* =======================================================
       CONNECT
    ======================================================= */

    const onConnect = useCallback(
        (connection: Connection) => {
            const {
                source,
                target,
                sourceHandle,
                targetHandle,
            } = connection;

            if (!source || !target) {
                return;
            }

            const newEdge: Edge = {
                id: `edge-${Date.now()}`,
                source,
                target,
                sourceHandle,
                targetHandle,
                type: "smoothstep",
                animated: true,

                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 18,
                    height: 18,
                    color: "#6366f1",
                },

                style: {
                    stroke: "#6366f1",
                    strokeWidth: 2.5,
                },
            };

            setEdges((currentEdges) => [
                ...currentEdges,
                newEdge,
            ]);
        },
        [setEdges],
    );

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
                            navigate("/workflow-process")
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
            {/* TOP BAR */}

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
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/workflow-process")
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
                        <ArrowLeft size={17} />
                    </button>

                    <div>
                        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {workflow.title}
                        </h1>

                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {workflow.stages.length} workflow stages
                        </p>
                    </div>
                </div>
            </div>

            {/* REACT FLOW */}

            {/* REACT FLOW */}

            <div className="absolute inset-0 pt-16">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
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
                    proOptions={{
                        hideAttribution: true,
                    }}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
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
                        nodeColor={() => "#6366f1"}
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

            {/* STAGE COUNT */}

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

                <div className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {workflow.stages.length}{" "}
                    {workflow.stages.length === 1
                        ? "Stage"
                        : "Stages"}
                </div>
            </div>
        </div>
    );
};

export default WorkflowDiagram;
