import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "reactflow";

import type {
  Connection,
  Edge,
  Node,
  NodeProps,
} from "reactflow";

import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Save,
  Settings,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import "reactflow/dist/style.css";

import {
  getProcess,
  updateProcess,
} from "../../api/process";

import type {
  ProcessConnection,
  ProcessJson,
  ProcessTask,
} from "../../types/process";

/* =========================================================
   TYPES
========================================================= */

interface ProcessNodeData {
  number: number;
  taskType: string;
  taskName: string;
  details: string;
  configType?: string;
  configId?: string;
  status: "completed" | "active" | "pending";
}

interface SavedProcessNode {
  id: string;
  position: {
    x: number;
    y: number;
  };
}

interface SavedProcessConnection {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

interface SavedProcess {
  processId: string;
  nodes: SavedProcessNode[];
  connections: SavedProcessConnection[];
}

/* =========================================================
   STORAGE
========================================================= */

const getStorageKey = (processId: string) => {
  return `process-diagram-${processId}`;
};

/* =========================================================
   HELPERS
========================================================= */

/**
 * ReactFlow node IDs are generated from the task type and
 * task index because the Process API does not expose a
 * separate node ID.
 */
const getTaskNodeId = (
  task: ProcessTask,
  index: number,
) => {
  return `task-${task.TaskTypeID}-${index}`;
};

/**
 * Checks whether a backend position is valid.
 */
const isValidPosition = (
  position:
    | {
      x: number;
      y: number;
    }
    | undefined,
) => {
  return (
    position !== undefined &&
    Number.isFinite(position.x) &&
    Number.isFinite(position.y)
  );
};

/**
 * Returns a readable task name.
 */
const getTaskName = (
  task: ProcessTask,
) => {
  return (
    task.TaskDetails?.TaskName ||
    task.TaskType ||
    `Task ${task.TaskTypeID}`
  );
};

/**
 * Creates the description displayed inside
 * each ReactFlow task card.
 */
const getTaskDetails = (
  task: ProcessTask,
) => {
  const details = task.TaskDetails;

  const parts: string[] = [];

  if (details?.DocumentType) {
    parts.push(
      `Document: ${details.DocumentType}`,
    );
  }

  if (details?.ConfigType) {
    parts.push(
      `Config: ${details.ConfigType}`,
    );
  }

  if (details?.KeyParam) {
    parts.push(
      `Key: ${details.KeyParam}`,
    );
  }

  if (
    details?.MaximumQuotations !== undefined
  ) {
    parts.push(
      `Maximum quotations: ${details.MaximumQuotations}`,
    );
  }

  if (details?.Levels?.length) {
    parts.push(
      `${details.Levels.length} workflow ${details.Levels.length === 1
        ? "level"
        : "levels"
      }`,
    );
  }

  if (details?.Attributes?.length) {
    parts.push(
      `${details.Attributes.length} ${details.Attributes.length === 1
        ? "attribute"
        : "attributes"
      }`,
    );
  }

  return (
    parts.join(" • ") ||
    "No additional configuration"
  );
};

/**
 * Visual status for the process cards.
 */
const getTaskStatus = (
  index: number,
): ProcessNodeData["status"] => {
  if (index === 0) {
    return "completed";
  }

  if (index === 1) {
    return "active";
  }

  return "pending";
};

/**
 * Shared edge styling.
 */
const getEdgeStyle = () => ({
  type: "bezier" as const,

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
});

/* =========================================================
   PROCESS NODE
========================================================= */

const ProcessTaskNode = ({
  data,
}: NodeProps<ProcessNodeData>) => {
  const isCompleted =
    data.status === "completed";

  const isActive =
    data.status === "active";

  return (
    <div
      className="
        relative
        w-[240px]
        overflow-hidden
        rounded-xl
        border
        border-gray-200
        bg-white
        shadow-lg
        transition-all
        hover:-translate-y-0.5
        hover:shadow-xl
        dark:border-gray-700
        dark:bg-gray-900
      "
    >
      {/* TARGET HANDLE */}

      <Handle
        type="target"
        position={Position.Left}
        className="
          !h-2.5
          !w-2.5
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
          !h-2.5
          !w-2.5
          !border-2
          !border-white
          !bg-cyan-500
          dark:!border-gray-900
        "
      />

      {/* LEFT ACCENT */}

      <div
        className={`
absolute
left - 0
top - 0
h - full
w - 1
          ${isCompleted
            ? "bg-emerald-500"
            : isActive
              ? "bg-cyan-500"
              : "bg-gray-400"
          }
`}
      />

      {/* HEADER */}

      <div className="flex items-center justify-between px-4 pt-4">
        <div
          className={`
flex
h - 8
w - 8
items - center
justify - center
rounded - full
text - [10px]
font - bold
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
            px-2
            py-0.5
            text-[9px]
            font-semibold
            uppercase
            tracking-wider
            text-gray-500
            dark:bg-gray-800
            dark:text-gray-400
          "
        >
          Task {data.number}
        </span>
      </div>

      {/* ICON */}

      <div className="px-4 pt-3">
        <div
          className={`
flex
h - 9
w - 9
items - center
justify - center
rounded - lg
            ${isCompleted
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
              : isActive
                ? "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }
`}
        >
          {isCompleted ? (
            <CheckCircle2 size={18} />
          ) : isActive ? (
            <Settings size={18} />
          ) : (
            <Circle size={18} />
          )}
        </div>
      </div>

      {/* CONTENT */}

      <div className="px-4 pb-4 pt-3">
        <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
          {data.taskType}
        </div>

        <h2 className="text-sm font-semibold leading-5 text-gray-900 dark:text-white">
          {data.taskName}
        </h2>

        <p className="mt-1.5 text-[10px] leading-4 text-gray-500 dark:text-gray-400">
          {data.details}
        </p>

        {/* CONFIG */}

        {data.configType && (
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="
                rounded-md
                bg-purple-50
                px-1.5
                py-0.5
                text-[9px]
                font-semibold
                text-purple-700
                dark:bg-purple-950/40
                dark:text-purple-300
              "
            >
              {data.configType}
            </span>

            {data.configId && (
              <span
                className="
                  max-w-[120px]
                  truncate
                  rounded-md
                  bg-gray-100
                  px-1.5
                  py-0.5
                  text-[9px]
                  font-medium
                  text-gray-500
                  dark:bg-gray-800
                  dark:text-gray-400
                "
                title={data.configId}
              >
                {data.configId}
              </span>
            )}
          </div>
        )}
      </div>

      {/* STATUS */}

      <div
        className="
          border-t
          border-gray-100
          px-4
          py-2.5
          dark:border-gray-800
        "
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500">
            Process task
          </span>

          <div className="flex items-center gap-1.5">
            <span
              className={`
h - 1.5
w - 1.5
rounded - full
                ${isCompleted
                  ? "bg-emerald-500"
                  : isActive
                    ? "bg-cyan-500"
                    : "bg-gray-400"
                }
`}
            />

            <span className="text-[9px] font-semibold capitalize text-gray-500 dark:text-gray-400">
              {data.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  processTask: ProcessTaskNode,
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const OpenProcess = () => {
  const navigate = useNavigate();

  const { processId } = useParams();

  const [process, setProcess] =
    useState<ProcessJson | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  /* =======================================================
     LOAD PROCESS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProcess = async () => {
      if (!processId) {
        setError(
          "Process ID is missing.",
        );

        setIsLoading(false);

        return;
      }

      setIsLoading(true);

      setError(null);

      try {
        const numericProcessId =
          Number(processId);

        if (
          !Number.isInteger(
            numericProcessId,
          )
        ) {
          throw new Error(
            "Invalid process ID.",
          );
        }

        const response =
          await getProcess(
            numericProcessId,
          );

        if (cancelled) {
          return;
        }

        if (!response?.ProcessJson) {
          throw new Error(
            "Process data was not returned by the API.",
          );
        }

        setProcess(
          response.ProcessJson,
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load process:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load process.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProcess();

    return () => {
      cancelled = true;
    };
  }, [processId]);

  /* =======================================================
     DEFAULT NODES
  ======================================================= */

  const defaultNodes = useMemo(() => {
    if (!process) {
      return [];
    }

    return process.Tasks.map(
      (
        task,
        index,
      ): Node<ProcessNodeData> => ({
        id: getTaskNodeId(
          task,
          index,
        ),

        type: "processTask",

        position: isValidPosition(
          task.position,
        )
          ? {
            x: task.position.x,
            y: task.position.y,
          }
          : {
            x:
              150 +
              (index % 3) * 430,

            y:
              150 +
              Math.floor(index / 3) *
              330,
          },

        data: {
          number: index + 1,

          taskType:
            task.TaskType,

          taskName:
            getTaskName(task),

          details:
            getTaskDetails(task),

          configType:
            task.TaskDetails
              ?.ConfigType,

          configId:
            task.TaskDetails
              ?.ConfigID,

          status:
            getTaskStatus(index),
        },

        draggable: true,
      }),
    );
  }, [process]);

  /* =======================================================
     LOAD LOCAL CACHED POSITIONS
  ======================================================= */

  const initialNodes = useMemo(() => {
    if (!processId) {
      return defaultNodes;
    }

    try {
      const stored =
        localStorage.getItem(
          getStorageKey(processId),
        );

      if (!stored) {
        return defaultNodes;
      }

      const parsed =
        JSON.parse(
          stored,
        ) as SavedProcess;

      if (
        !parsed ||
        !Array.isArray(
          parsed.nodes,
        )
      ) {
        return defaultNodes;
      }

      return defaultNodes.map(
        (node) => {
          const savedNode =
            parsed.nodes.find(
              (item) =>
                item.id ===
                node.id,
            );

          if (
            !savedNode ||
            !isValidPosition(
              savedNode.position,
            )
          ) {
            return node;
          }

          return {
            ...node,

            position: {
              x:
                savedNode.position.x,

              y:
                savedNode.position.y,
            },
          };
        },
      );
    } catch (err) {
      console.error(
        "Failed to load saved process positions:",
        err,
      );

      return defaultNodes;
    }
  }, [
    processId,
    defaultNodes,
  ]);

  /* =======================================================
     DEFAULT EDGES
  ======================================================= */

  const defaultEdges = useMemo<Edge[]>(
    () => {
      if (
        !process ||
        process.Tasks.length < 2
      ) {
        return [];
      }

      /*
       * If the backend already has connections,
       * use them first.
       */
      if (
        Array.isArray(
          process.connections,
        ) &&
        process.connections.length > 0
      ) {
        return process.connections.map(
          (
            connection,
            index,
          ): Edge => ({
            id:
              `edge-${connection.source}-${connection.target}-${index}`,

            source:
              connection.source,

            target:
              connection.target,

            ...getEdgeStyle(),
          }),
        );
      }

      /*
       * Otherwise create the initial
       * sequential workflow:
       *
       * Task 1 -> Task 2 -> Task 3
       */
      return process.Tasks
        .slice(0, -1)
        .map(
          (
            _task,
            index,
          ): Edge => {
            const source =
              getTaskNodeId(
                process.Tasks[
                index
                ],
                index,
              );

            const target =
              getTaskNodeId(
                process.Tasks[
                index + 1
                ],
                index + 1,
              );

            return {
              id: `edge-${source}-${target}`,

              source,

              target,

              ...getEdgeStyle(),
            };
          },
        );
    },
    [process],
  );

  /* =======================================================
     LOAD LOCAL CACHED EDGES
  ======================================================= */

  const initialEdges = useMemo<Edge[]>(
    () => {
      if (!processId) {
        return defaultEdges;
      }

      try {
        const stored =
          localStorage.getItem(
            getStorageKey(processId),
          );

        if (!stored) {
          return defaultEdges;
        }

        const parsed =
          JSON.parse(
            stored,
          ) as SavedProcess;

        if (
          !parsed ||
          !Array.isArray(
            parsed.connections,
          ) ||
          parsed.connections.length === 0
        ) {
          return defaultEdges;
        }

        return parsed.connections.map(
          (
            connection,
            index,
          ) => ({
            id:
              connection.id ||
              `edge-${connection.source}-${connection.target}-${index}`,

            source:
              connection.source,

            target:
              connection.target,

            sourceHandle:
              connection.sourceHandle,

            targetHandle:
              connection.targetHandle,

            ...getEdgeStyle(),
          }),
        );
      } catch (err) {
        console.error(
          "Failed to load saved process connections:",
          err,
        );

        return defaultEdges;
      }
    },
    [
      processId,
      defaultEdges,
    ],
  );

  /* =======================================================
     REACT FLOW STATE
  ======================================================= */

  const [
    nodes,
    setNodes,
    onNodesChange,
  ] = useNodesState<ProcessNodeData>(
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
     REFRESH REACT FLOW AFTER API LOAD
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
     CREATE CONNECTION
  ======================================================= */

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(
        (currentEdges) =>
          addEdge(
            {
              ...connection,

              ...getEdgeStyle(),
            },
            currentEdges,
          ),
      );

      setSaved(false);
    },
    [setEdges],
  );

  /* =======================================================
     SAVE PROCESS DIAGRAM
  ======================================================= */

  const handleSave = useCallback(
    async () => {
      if (!processId || !process) {
        return;
      }

      const numericProcessId =
        Number(processId);

      if (
        !Number.isInteger(
          numericProcessId,
        )
      ) {
        setError(
          "Invalid process ID.",
        );

        return;
      }

      setIsSaving(true);

      setSaved(false);

      setError(null);

      try {
        /* =================================================
           1. CREATE POSITION MAP
        ================================================= */

        const positionMap =
          new Map<
            string,
            {
              x: number;
              y: number;
            }
          >();

        nodes.forEach((node) => {
          positionMap.set(
            node.id,
            {
              x: node.position.x,
              y: node.position.y,
            },
          );
        });

        /* =================================================
           2. UPDATE TASK POSITIONS
        ================================================= */

        const updatedTasks =
          process.Tasks.map(
            (
              task,
              index,
            ): ProcessTask => {
              const nodeId =
                getTaskNodeId(
                  task,
                  index,
                );

              const currentPosition =
                positionMap.get(
                  nodeId,
                );

              return {
                ...task,

                position:
                  currentPosition
                    ? {
                      x: currentPosition.x,
                      y: currentPosition.y,
                    }
                    : isValidPosition(
                      task.position,
                    )
                      ? {
                        x: task.position.x,
                        y: task.position.y,
                      }
                      : {
                        x:
                          150 +
                          (index % 3) *
                          430,

                        y:
                          150 +
                          Math.floor(
                            index / 3,
                          ) *
                          330,
                      },
              };
            },
          );

        /* =================================================
           3. CONVERT REACT FLOW EDGES TO API CONNECTIONS
        ================================================= */

        const connections: ProcessConnection[] =
          edges
            .filter(
              (edge) =>
                Boolean(
                  edge.source,
                ) &&
                Boolean(
                  edge.target,
                ),
            )
            .map(
              (edge) => ({
                source:
                  edge.source,

                target:
                  edge.target,
              }),
            );

        /* =================================================
           4. CREATE COMPLETE PROCESS JSON
        ================================================= */

        const processJson: ProcessJson =
        {
          ...process,

          Processid:
            numericProcessId,

          NumberofTasks:
            updatedTasks.length,

          Tasks: updatedTasks,

          connections,
        };

        /* =================================================
           5. UPDATE BACKEND
        ================================================= */

        console.log(
          "Updating process:",
          JSON.stringify(
            {
              ProcessJson:
                processJson,
            },
            null,
            2,
          ),
        );

        await updateProcess(
          numericProcessId,
          {
            ProcessJson:
              processJson,
          },
        );

        /* =================================================
           6. UPDATE LOCAL COMPONENT STATE
        ================================================= */

        setProcess(
          processJson,
        );

        /* =================================================
           7. KEEP LOCAL STORAGE AS CACHE
        ================================================= */

        const localPayload:
          SavedProcess = {
          processId,

          nodes: nodes.map(
            (node) => ({
              id: node.id,

              position: {
                x:
                  node.position.x,

                y:
                  node.position.y,
              },
            }),
          ),

          connections:
            edges.map(
              (edge) => ({
                id:
                  edge.id,

                source:
                  edge.source,

                target:
                  edge.target,

                sourceHandle:
                  edge.sourceHandle,

                targetHandle:
                  edge.targetHandle,
              }),
            ),
        };

        localStorage.setItem(
          getStorageKey(processId),
          JSON.stringify(
            localPayload,
          ),
        );

        /* =================================================
           8. SHOW SAVED STATUS
        ================================================= */

        setSaved(true);

        window.setTimeout(() => {
          setSaved(false);
        }, 3000);
      } catch (err) {
        console.error(
          "Failed to update process:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to save process diagram.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [
      processId,
      process,
      nodes,
      edges,
    ],
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading) {
    return (
      <div
        className="
          flex
          min-h-[calc(100vh-64px)]
          items-center
          justify-center
          bg-gray-50
          dark:bg-gray-950
        "
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={28}
            className="animate-spin text-cyan-500"
          />

          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Loading process...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !process) {
    return (
      <div
        className="
          flex
          min-h-[calc(100vh-64px)]
          items-center
          justify-center
          bg-gray-50
          dark:bg-gray-950
        "
      >
        <div className="max-w-md px-6 text-center">
          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-red-50
              text-red-500
              dark:bg-red-950/40
              dark:text-red-400
            "
          >
            <FileText size={25} />
          </div>

          <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
            Unable to open process
          </h2>

          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {error ||
              "The requested process could not be found."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/processes",
              )
            }
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-cyan-600
              px-4
              py-2
              text-xs
              font-semibold
              text-white
              transition
              hover:bg-cyan-700
            "
          >
            <ArrowLeft size={15} />

            Back to Processes
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
                "/processes",
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
            <ArrowLeft size={17} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                {process.ProcessName}
              </h1>

              <span
                className="
                  rounded-md
                  bg-cyan-50
                  px-2
                  py-1
                  text-[10px]
                  font-semibold
                  text-cyan-700
                  dark:bg-cyan-950/40
                  dark:text-cyan-300
                "
              >
                #{process.Processid}
              </span>
            </div>

            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
              {process.DocumentType}{" "}
              •{" "}
              {process.NumberofTasks}{" "}
              {process.NumberofTasks === 1
                ? "task"
                : "tasks"}
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
              <CheckCircle2 size={14} />

              Saved
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              void handleSave();
            }}
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
              <Save size={15} />
            )}

            {isSaving
              ? "Saving..."
              : "Save Diagram"}
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
          deleteKeyCode={null}
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
          Process
        </div>

        <div className="mt-1 flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {process.Tasks.length}{" "}
            {process.Tasks.length === 1
              ? "Task"
              : "Tasks"}
          </span>

          <span className="h-3 w-px bg-gray-300 dark:bg-gray-700" />

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {edges.length}{" "}
            {edges.length === 1
              ? "connection"
              : "connections"}
          </span>
        </div>
      </div>

      {/* =================================================
          SAVE ERROR TOAST
      ================================================= */}

      {error && (
        <div
          className="
            absolute
            bottom-5
            right-5
            z-30
            max-w-sm
            rounded-xl
            border
            border-red-200
            bg-white
            px-4
            py-3
            shadow-xl
            dark:border-red-900
            dark:bg-gray-900
          "
        >
          <div className="flex items-start gap-3">
            <div
              className="
                mt-0.5
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-red-50
                text-red-500
                dark:bg-red-950/40
                dark:text-red-400
              "
            >
              <FileText size={14} />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                Save failed
              </p>

              <p className="mt-1 text-[11px] leading-5 text-gray-500 dark:text-gray-400">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenProcess;
