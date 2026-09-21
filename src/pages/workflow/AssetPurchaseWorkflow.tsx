import { useCallback, useMemo } from "react";
import type { ElementType } from "react";
import { ArrowLeft, CheckCircle2, FileText, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

/* =========================================================
   TYPES
========================================================= */

interface WorkflowStage {
    number: number;
    title: string;
    description: string;
    icon: ElementType;
    accent: "cyan" | "purple" | "emerald";
}

interface WorkflowStageNodeData extends WorkflowStage {
    status: "completed" | "active" | "pending";
}

/* =========================================================
   WORKFLOW STAGES
========================================================= */

const stages: WorkflowStage[] = [
    {
        number: 1,
        title: "Raise Request",
        description: "Create asset purchase request",
        icon: FileText,
        accent: "cyan",
    },
    {
        number: 2,
        title: "Quotes & Rating",
        description: "Collect and rate quotations",
        icon: Star,
        accent: "purple",
    },
    {
        number: 3,
        title: "Approve Request",
        description: "Review and approve request",
        icon: CheckCircle2,
        accent: "emerald",
    },
];

/* =========================================================
   ACCENT STYLES
========================================================= */

const accentStyles: Record<
    WorkflowStageDataAccent,
    {
        border: string;
        bg: string;
        icon: string;
        number: string;
        glow: string;
        line: string;
    }
> = {
    cyan: {
        border: "border-cyan-300 dark:border-cyan-700",
        bg: "bg-cyan-50 dark:bg-cyan-950/40",
        icon: "text-cyan-600 dark:text-cyan-400",
        number:
            "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
        glow: "shadow-cyan-500/10",
        line: "#06b6d4",
    },

    purple: {
        border: "border-purple-300 dark:border-purple-700",
        bg: "bg-purple-50 dark:bg-purple-950/40",
        icon: "text-purple-600 dark:text-purple-400",
        number:
            "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
        glow: "shadow-purple-500/10",
        line: "#a855f7",
    },

    emerald: {
        border: "border-emerald-300 dark:border-emerald-700",
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        icon: "text-emerald-600 dark:text-emerald-400",
        number:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        glow: "shadow-emerald-500/10",
        line: "#10b981",
    },
};

type WorkflowStageDataAccent = WorkflowStage["accent"];

/* =========================================================
   WORKFLOW NODE
========================================================= */

const WorkflowStageNode = ({
    data,
}: NodeProps<WorkflowStageNodeData>) => {
    const Icon = data.icon;
    const styles = accentStyles[data.accent];

    return (
        <div
            className={`
        relative
        w-[300px]
        overflow-hidden
        rounded-2xl
        border
        bg-white
        shadow-xl
        transition-all
        duration-200
        hover:-translate-y-1
        hover:shadow-2xl
        dark:bg-gray-900
        ${styles.border}
        ${styles.glow}
      `}
        >
            {/* =================================================
          TARGET HANDLE
      ================================================= */}

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

            {/* =================================================
          SOURCE HANDLE
      ================================================= */}

            <Handle
                type="source"
                position={Position.Right}
                className="
          !h-3
          !w-3
          !border-2
          !border-white
          dark:!border-gray-900
        "
                style={{
                    background: styles.line,
                }}
            />

            {/* =================================================
          ACCENT LINE
      ================================================= */}

            <div
                className="absolute left-0 top-0 h-full w-1"
                style={{
                    background: styles.line,
                }}
            />

            {/* =================================================
          HEADER
      ================================================= */}

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
            ${styles.number}
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

            {/* =================================================
          ICON
      ================================================= */}

            <div className="px-5 pt-5">
                <div
                    className={`
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            ${styles.bg}
            ${styles.icon}
          `}
                >
                    <Icon size={23} strokeWidth={2} />
                </div>
            </div>

            {/* =================================================
          CONTENT
      ================================================= */}

            <div className="px-5 pb-5 pt-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {data.title}
                </h2>

                <p className="mt-1.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    {data.description}
                </p>
            </div>

            {/* =================================================
          STATUS
      ================================================= */}

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
                ${data.status === "completed"
                                    ? "bg-emerald-500"
                                    : data.status === "active"
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

/* =========================================================
   NODE TYPES
========================================================= */

const nodeTypes = {
    workflowStage: WorkflowStageNode,
};

/* =========================================================
   INITIAL NODES
========================================================= */

const createInitialNodes = (): Node<WorkflowStageNodeData>[] => {
    return stages.map((stage, index) => ({
        id: `stage-${stage.number}`,

        type: "workflowStage",

        position: {
            x: index * 420 + 100,
            y: 180,
        },

        data: {
            ...stage,

            status:
                stage.number === 1
                    ? "completed"
                    : stage.number === 2
                        ? "active"
                        : "pending",
        },

        draggable: true,
    }));
};

/* =========================================================
   INITIAL EDGES
========================================================= */

const createInitialEdges = (): Edge[] => {
    return [
        {
            id: "stage-1-to-stage-2",

            source: "stage-1",
            target: "stage-2",

            type: "smoothstep",

            animated: true,

            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 18,
                height: 18,
                color: "#8b5cf6",
            },

            style: {
                stroke: "#8b5cf6",
                strokeWidth: 2.5,
            },
        },

        {
            id: "stage-2-to-stage-3",

            source: "stage-2",
            target: "stage-3",

            type: "smoothstep",

            animated: true,

            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 18,
                height: 18,
                color: "#10b981",
            },

            style: {
                stroke: "#10b981",
                strokeWidth: 2.5,
            },
        },
    ];
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const AssetPurchaseWorkflow = () => {
    const navigate = useNavigate();

    const initialNodes = useMemo(
        () => createInitialNodes(),
        [],
    );

    const initialEdges = useMemo(
        () => createInitialEdges(),
        [],
    );

    const [nodes, , onNodesChange] =
        useNodesState<WorkflowStageNodeData>(initialNodes);

    const [edges, setEdges, onEdgesChange] =
        useEdgesState(initialEdges);

    /* =======================================================
       CONNECT NODES
    ======================================================= */

    const onConnect = useCallback(
        (connection: Connection) => {
            if (!connection.source || !connection.target) {
                return;
            }

            const newEdge: Edge = {
                id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
                source: connection.source,
                target: connection.target,
                sourceHandle: connection.sourceHandle,
                targetHandle: connection.targetHandle,
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
   SAVE WORKFLOW
======================================================= */

    const handleSave = useCallback(() => {
        const workflow = {
            workflowName: "Asset Purchase Workflow",

            nodes: nodes.map(
                (node: Node<WorkflowStageNodeData>) => ({
                    id: node.id,

                    stage: node.data.number,

                    title: node.data.title,

                    description: node.data.description,

                    position: {
                        x: node.position.x,
                        y: node.position.y,
                    },
                }),
            ),

            connections: edges.map((edge: Edge) => ({
                id: edge.id,

                source: edge.source,

                target: edge.target,
            })),
        };

        console.log(
            "Asset Purchase Workflow:",
            workflow,
        );

        /*
          Later replace this with your API:
    
          await apiRequest("/api/workflows", {
            method: "POST",
            body: JSON.stringify(workflow),
          });
        */

        alert("Workflow saved successfully!");
    }, [nodes, edges]);

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
            {/* ===================================================
          TOP BAR
      =================================================== */}

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
                        title="Back"
                    >
                        <ArrowLeft size={17} />
                    </button>

                    <div>
                        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Asset Purchase Workflow
                        </h1>

                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Configure workflow stages and connections
                        </p>
                    </div>
                </div>

                {/* RIGHT */}

                <button
                    type="button"
                    onClick={handleSave}
                    className="
            rounded-lg
            bg-gray-900
            px-4
            py-2
            text-xs
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-gray-800
            dark:bg-white
            dark:text-gray-900
            dark:hover:bg-gray-100
          "
                >
                    Save Workflow
                </button>
            </div>

            {/* ===================================================
          REACT FLOW CANVAS
      =================================================== */}

            <div className="h-full w-full pt-16">
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
                    {/* =================================================
              BACKGROUND
          ================================================= */}

                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={22}
                        size={1.2}
                        color="#cbd5e1"
                    />

                    {/* =================================================
              CONTROLS
          ================================================= */}

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

                    {/* =================================================
              MINI MAP
          ================================================= */}

                    <MiniMap
                        pannable
                        zoomable
                        nodeColor={(
                            node: Node<WorkflowStageNodeData>,
                        ) => {
                            const accent = node.data?.accent;

                            if (accent === "cyan") {
                                return "#06b6d4";
                            }

                            if (accent === "purple") {
                                return "#a855f7";
                            }

                            if (accent === "emerald") {
                                return "#10b981";
                            }

                            return "#94a3b8";
                        }}
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

            {/* ===================================================
          CANVAS LEGEND
      =================================================== */}

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
                <div className="flex items-center gap-4">
                    {/* REQUEST */}

                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-500" />

                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            Request
                        </span>
                    </div>

                    {/* QUOTATION */}

                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-purple-500" />

                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            Quotation
                        </span>
                    </div>

                    {/* APPROVAL */}

                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            Approval
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetPurchaseWorkflow;