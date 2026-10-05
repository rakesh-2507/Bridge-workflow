import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  reconnectEdge,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  ArrowLeft,
  Loader2,
  Pencil,
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

/* =========================================================
 * Workflow Node Types
 * ========================================================= */

type WorkflowNodeData = {
  label: string;
  taskType: string;
  role: string;
  level: number;
  configType?: string;
  actions?: string[];
};

type WorkflowNode = Node<WorkflowNodeData>;

/* =========================================================
 * Custom Workflow Node
 *
 * Four connection points:
 *
 *              TOP
 *               ●
 *
 *       ●   WORKFLOW NODE   ●
 *      LEFT                RIGHT
 *
 *               ●
 *             BOTTOM
 *
 * TOP / LEFT       = target handles
 * RIGHT / BOTTOM   = source handles
 * ========================================================= */

function WorkflowNode({
  data,
}: NodeProps<WorkflowNode>) {
  return (
    <div
      className="
        relative
        min-w-[230px]
        rounded-xl
        border
        border-gray-300
        bg-white
        px-5
        py-4
        shadow-md
        dark:border-gray-700
        dark:bg-gray-900
      "
    >
      {/* TOP TARGET */}

      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="
          !h-3
          !w-3
          !border-2
          !border-white
          !bg-cyan-500
          dark:!border-gray-900
        "
      />

      {/* LEFT TARGET */}

      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="
          !h-3
          !w-3
          !border-2
          !border-white
          !bg-cyan-500
          dark:!border-gray-900
        "
      />

      {/* RIGHT SOURCE */}

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="
          !h-3
          !w-3
          !border-2
          !border-white
          !bg-cyan-600
          dark:!border-gray-900
        "
      />

      {/* BOTTOM SOURCE */}

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="
          !h-3
          !w-3
          !border-2
          !border-white
          !bg-cyan-600
          dark:!border-gray-900
        "
      />

      {/* NODE CONTENT */}

      <div
        className="
          text-sm
          font-semibold
          text-gray-900
          dark:text-white
        "
      >
        {data.label}
      </div>

      {data.taskType && (
        <div
          className="
            mt-1
            text-xs
            text-gray-500
            dark:text-gray-400
          "
        >
          Type: {data.taskType}
        </div>
      )}

      {data.role && (
        <div
          className="
            mt-1
            text-xs
            text-gray-500
            dark:text-gray-400
          "
        >
          Role: {data.role}
        </div>
      )}

      {data.level > 0 && (
        <div
          className="
            mt-1
            text-xs
            text-gray-500
            dark:text-gray-400
          "
        >
          Level: {data.level}
        </div>
      )}

      {data.configType && (
        <div
          className="
            mt-1
            text-xs
            text-gray-500
            dark:text-gray-400
          "
        >
          Config: {data.configType}
        </div>
      )}

      {data.actions &&
        data.actions.length > 0 && (
          <div
            className="
              mt-2
              flex
              flex-wrap
              gap-1
            "
          >
            {data.actions.map(
              (action) => (
                <span
                  key={action}
                  className="
                    rounded-md
                    bg-gray-100
                    px-2
                    py-0.5
                    text-[10px]
                    text-gray-600
                    dark:bg-gray-800
                    dark:text-gray-300
                  "
                >
                  {action}
                </span>
              ),
            )}
          </div>
        )}
    </div>
  );
}

/* =========================================================
 * React Flow Node Types
 * ========================================================= */

const nodeTypes = {
  workflow: WorkflowNode,
};

/* =========================================================
 * View Process
 * ========================================================= */

export default function ViewProcess() {
  const { id } =
    useParams<{ id: string }>();

  const navigate = useNavigate();

  const processId = Number(id);

  const [process, setProcess] =
    useState<ProcessJson | null>(
      null,
    );

  const [nodes, setNodes] =
    useState<WorkflowNode[]>([]);

  const [edges, setEdges] =
    useState<Edge[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================================================
   * Load Process
   * ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function fetchProcess() {
      setLoading(true);
      setError("");

      try {
        const response =
          await getProcess(
            processId,
          );

        if (cancelled) {
          return;
        }

        const processData =
          response.ProcessJson;

        setProcess(
          processData,
        );

        /* ===================================================
         * Convert API Tasks -> React Flow Nodes
         * =================================================== */

        const flowNodes: WorkflowNode[] =
          processData.Tasks.map(
            (
              task: ProcessTask,
            ) => ({
              id: String(
                task.TaskID,
              ),

              type: "workflow",

              position:
                task.position || {
                  x: 100,
                  y: 100,
                },

              data: {
                label:
                  task.TaskDetails
                    ?.TaskName ||
                  task.TaskType ||
                  "Task",

                taskType:
                  task.TaskType ||
                  "",

                role:
                  task.TaskDetails
                    ?.Level?.role ||
                  "",

                level:
                  task.TaskDetails
                    ?.Level?.level ||
                  0,

                configType:
                  task.TaskDetails
                    ?.ConfigType,

                actions:
                  task.TaskDetails
                    ?.Actions || [],
              },
            }),
          );

        /* ===================================================
         * Convert API Connections -> React Flow Edges
         * =================================================== */

        const flowEdges: Edge[] =
          (
            processData.connections ||
            []
          ).map(
            (
              connection,
              index,
            ) => ({
              id:
                `edge-${index}-${String(
                  connection.source,
                )}-${String(
                  connection.target,
                )}`,

              source: String(
                connection.source,
              ),

              target: String(
                connection.target,
              ),
            }),
          );

        setNodes(
          flowNodes,
        );

        setEdges(
          flowEdges,
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load process:",
          err,
        );

        setProcess(null);
        setNodes([]);
        setEdges([]);

        setError(
          "Failed to load process.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (
      Number.isFinite(
        processId,
      )
    ) {
      void fetchProcess();
    }

    return () => {
      cancelled = true;
    };
  }, [processId]);

  /* =========================================================
   * Handle Node Changes
   *
   * IMPORTANT:
   *
   * When a node is deleted, React Flow updates the nodes
   * but our edges are stored separately.
   *
   * Therefore we explicitly remove every edge connected
   * to the deleted node.
   * ========================================================= */

  const onNodesChange =
    useCallback(
      (
        changes: NodeChange<WorkflowNode>[],
      ) => {
        /* ===============================================
         * Find nodes being removed
         * =============================================== */

        const removedNodeIds =
          new Set(
            changes
              .filter(
                (change) =>
                  change.type ===
                  "remove",
              )
              .map(
                (change) =>
                  change.id,
              ),
          );

        /* ===============================================
         * Update nodes
         * =============================================== */

        setNodes(
          (currentNodes) =>
            applyNodeChanges(
              changes,
              currentNodes,
            ),
        );

        /* ===============================================
         * Remove edges connected to deleted nodes
         * =============================================== */

        if (
          removedNodeIds.size > 0
        ) {
          setEdges(
            (currentEdges) =>
              currentEdges.filter(
                (edge) =>
                  !removedNodeIds.has(
                    edge.source,
                  ) &&
                  !removedNodeIds.has(
                    edge.target,
                  ),
              ),
          );
        }
      },
      [],
    );

  /* =========================================================
   * Handle Edge Changes
   *
   * This allows:
   *
   * - selecting edges
   * - deleting edges
   * - updating edge state
   *
   * Delete / Backspace will now remove the selected edge.
   * ========================================================= */

  const onEdgesChange =
    useCallback(
      (
        changes: EdgeChange[],
      ) => {
        setEdges(
          (currentEdges) =>
            applyEdgeChanges(
              changes,
              currentEdges,
            ),
        );
      },
      [],
    );

  /* =========================================================
   * Handle New Connection
   *
   * RIGHT  -> TOP
   * RIGHT  -> LEFT
   * BOTTOM -> TOP
   * BOTTOM -> LEFT
   *
   * Self-connections are prevented.
   * ========================================================= */

  const onConnect =
    useCallback(
      (
        connection: Connection,
      ) => {
        if (
          !connection.source ||
          !connection.target
        ) {
          return;
        }

        /* Prevent task -> same task */

        if (
          connection.source ===
          connection.target
        ) {
          return;
        }

        setEdges(
          (currentEdges) => {
            /* ===========================================
             * Prevent exact duplicate connection
             * =========================================== */

            const duplicate =
              currentEdges.some(
                (edge) =>
                  edge.source ===
                    connection.source &&
                  edge.target ===
                    connection.target &&
                  edge.sourceHandle ===
                    connection.sourceHandle &&
                  edge.targetHandle ===
                    connection.targetHandle,
              );

            if (duplicate) {
              return currentEdges;
            }

            return addEdge(
              {
                ...connection,

                id:
                  `edge-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,
              },
              currentEdges,
            );
          },
        );
      },
      [],
    );

  /* =========================================================
   * Reconnect Existing Edge
   * ========================================================= */

  const onReconnect =
    useCallback(
      (
        oldEdge: Edge,
        newConnection: Connection,
      ) => {
        if (
          !newConnection.source ||
          !newConnection.target
        ) {
          return;
        }

        /* Prevent self-connection */

        if (
          newConnection.source ===
          newConnection.target
        ) {
          return;
        }

        setEdges(
          (currentEdges) => {
            /* ===========================================
             * Prevent duplicate connection
             * =========================================== */

            const duplicate =
              currentEdges.some(
                (edge) =>
                  edge.id !==
                    oldEdge.id &&
                  edge.source ===
                    newConnection.source &&
                  edge.target ===
                    newConnection.target &&
                  edge.sourceHandle ===
                    newConnection.sourceHandle &&
                  edge.targetHandle ===
                    newConnection.targetHandle,
              );

            if (duplicate) {
              return currentEdges;
            }

            return reconnectEdge(
              oldEdge,
              newConnection,
              currentEdges,
            );
          },
        );
      },
      [],
    );

  /* =========================================================
   * Navigate To Template
   * ========================================================= */

  function handleEditTemplate() {
    if (!process?.tid) {
      setError(
        "Template ID is not available for this process.",
      );

      return;
    }

    navigate(
      `/project-template/${process.tid}/edit?processId=${process.Processid}`,
    );
  }

  /* =========================================================
   * Save Process Designer
   * ========================================================= */

  async function handleSave() {
    if (!process) {
      return;
    }

    if (
      !Number.isFinite(
        processId,
      )
    ) {
      setError(
        "Invalid process ID.",
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      /* =====================================================
       * Keep only tasks whose nodes still exist
       * ===================================================== */

      const updatedTasks: ProcessTask[] =
        process.Tasks
          .filter((task) =>
            nodes.some(
              (node) =>
                node.id ===
                String(
                  task.TaskID,
                ),
            ),
          )
          .map((task) => {
            const node =
              nodes.find(
                (item) =>
                  item.id ===
                  String(
                    task.TaskID,
                  ),
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

              TaskDetails:
                task.TaskDetails
                  ? {
                      ...task.TaskDetails,
                    }
                  : task.TaskDetails,
            };
          });

      /* =====================================================
       * IDs of remaining tasks
       * ===================================================== */

      const remainingNodeIds =
        new Set(
          updatedTasks.map(
            (task) =>
              String(
                task.TaskID,
              ),
          ),
        );

      /* =====================================================
       * Save Connections
       *
       * Any edge connected to a deleted node is automatically
       * removed here as a second safety check.
       * ===================================================== */

      const updatedConnections =
        edges
          .filter(
            (edge) =>
              remainingNodeIds.has(
                String(
                  edge.source,
                ),
              ) &&
              remainingNodeIds.has(
                String(
                  edge.target,
                ),
              ),
          )
          .map((edge) => ({
            source: String(
              edge.source,
            ),

            target: String(
              edge.target,
            ),
          }));

      /* =====================================================
       * Designer Payload
       * ===================================================== */

      const designerPayload:
        ProcessDesignerPayload = {
        process_name:
          process.ProcessName,

        tasks:
          updatedTasks.map(
            (task) => ({
              task_config_id:
                task.task_config_id,

              position:
                task.position || {
                  x: 100,
                  y: 100,
                },
            }),
          ),

        connections:
          updatedConnections,
      };

      console.log(
        "DESIGNER SAVE PAYLOAD:",
        JSON.stringify(
          designerPayload,
          null,
          2,
        ),
      );

      /* =====================================================
       * Save To Backend
       * ===================================================== */

      await saveProcessDesigner(
        processId,
        designerPayload,
      );

      /* =====================================================
       * Update Local Process State
       * ===================================================== */

      const updatedProcess:
        ProcessJson = {
        ...process,

        NumberofTasks:
          updatedTasks.length,

        Tasks:
          updatedTasks,

        connections:
          updatedConnections,
      };

      setProcess(
        updatedProcess,
      );

      console.log(
        "Process designer saved successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to save process:",
        err,
      );

      setError(
        "Failed to save process.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
   * Invalid Route ID
   * ========================================================= */

  if (
    !Number.isFinite(
      processId,
    )
  ) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
        <div
          className="
            rounded-lg
            bg-red-50
            p-4
            text-red-600
            dark:bg-red-950/30
          "
        >
          Invalid process ID.
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/workflow-process",
            )
          }
          className="
            mt-4
            flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            px-4
            py-2
            text-sm
            font-medium
            text-gray-700
            hover:bg-gray-100
            dark:border-gray-700
            dark:text-gray-200
            dark:hover:bg-gray-800
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Processes
        </button>
      </div>
    );
  }

  /* =========================================================
   * Loading
   * ========================================================= */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-gray-50
          dark:bg-gray-950
        "
      >
        <Loader2
          className="
            h-7
            w-7
            animate-spin
            text-cyan-500
          "
        />
      </div>
    );
  }

  /* =========================================================
   * Process Not Found
   * ========================================================= */

  if (!process) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
        <div
          className="
            rounded-lg
            bg-red-50
            p-4
            text-red-600
            dark:bg-red-950/30
          "
        >
          {error ||
            "Process not found."}
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/workflow-process",
            )
          }
          className="
            mt-4
            flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            px-4
            py-2
            text-sm
            font-medium
            text-gray-700
            hover:bg-gray-100
            dark:border-gray-700
            dark:text-gray-200
            dark:hover:bg-gray-800
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Processes
        </button>
      </div>
    );
  }

  /* =========================================================
   * Main UI
   * ========================================================= */

  return (
    <div
      className="
        flex
        h-screen
        flex-col
        bg-gray-50
        dark:bg-gray-950
      "
    >
      {/* =====================================================
       * Header
       * ===================================================== */}

      <header
        className="
          flex
          h-16
          shrink-0
          items-center
          justify-between
          border-b
          border-gray-200
          bg-white
          px-5
          dark:border-gray-800
          dark:bg-gray-900
        "
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/workflow-process",
              )
            }
            className="
              rounded-lg
              p-2
              text-gray-500
              hover:bg-gray-100
              dark:hover:bg-gray-800
            "
            aria-label="Back to processes"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1
              className="
                font-semibold
                text-gray-900
                dark:text-white
              "
            >
              {process.ProcessName}
            </h1>

            <p
              className="
                text-xs
                text-gray-500
                dark:text-gray-400
              "
            >
              Process ID:{" "}
              {process.Processid}
              {" · "}
              Template ID:{" "}
              {process.tid}
              {" · "}
              {nodes.length} tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Template */}

          <button
            type="button"
            onClick={
              handleEditTemplate
            }
            disabled={!process.tid}
            className="
              flex
              items-center
              gap-2
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-2
              text-sm
              font-medium
              text-gray-700
              transition
              hover:bg-gray-50
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:border-gray-700
              dark:bg-gray-900
              dark:text-gray-200
              dark:hover:bg-gray-800
            "
          >
            <Pencil className="h-4 w-4" />

            Edit Template
          </button>

          {/* Save */}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-cyan-600
              px-4
              py-2
              text-sm
              font-medium
              text-white
              hover:bg-cyan-700
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
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
        </div>
      </header>

      {/* =====================================================
       * Error Notification
       * ===================================================== */}

      {error && (
        <div
          role="alert"
          className="
            absolute
            left-1/2
            top-20
            z-50
            -translate-x-1/2
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-4
            py-2
            text-sm
            text-red-600
            shadow
            dark:border-red-900
            dark:bg-red-950/90
          "
        >
          {error}
        </div>
      )}

      {/* =====================================================
       * Workflow Designer
       * ===================================================== */}

      <div className="min-h-0 flex-1">
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
          onReconnect={onReconnect}
          fitView
          deleteKeyCode={[
            "Backspace",
            "Delete",
          ]}
          defaultEdgeOptions={{
            animated: false,
            reconnectable: true,
          }}
        >
          <MiniMap />

          <Controls />

          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}