import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  FileJson,
  Loader2,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";

import {
  createProcess,
  getTaskTypes,
  getWorkflowConfig,
  getWorkflowConfigs,
} from "../../api/process";

import type {
  ProcessAttribute,
  ProcessComparisonRating,
  ProcessLevel,
  ProcessTask,
  ProcessTaskDetails,
  TaskType,
  WorkflowConfig,
  WorkflowConfigSummary,
} from "../../types/process";

/* ============================================================
   PROPS
============================================================ */

interface CreateProcessProps {
  onCreated: () => void;
  onCancel: () => void;
}

/* ============================================================
   EDITABLE TASK
============================================================ */

interface EditableTask {
  id: number;

  TaskTypeID: number;
  TaskType: string;

  TaskName: string;
  DocumentType: string;

  ConfigID: string;
  ConfigType: string;

  KeyParam: string;

  ItemParams: string[];

  Attributes: ProcessAttribute[];

  Levels: ProcessLevel[];

  Level?: ProcessLevel;

  ComparisonRating?: ProcessComparisonRating;

  SelectionAttribute: string;

  MaximumQuotations?: number;
}

/* ============================================================
   TASK TYPE → CONFIG TYPE
============================================================ */

const TASK_CONFIG_TYPE_MAP: Record<string, string> = {
  approval: "approval",
  rating: "rating",
  selection: "shortlisting",
};

/* ============================================================
   DEFAULT ATTRIBUTES
   These are required by the process API.
============================================================ */

const EMPLOYEE_REQUEST_ATTRIBUTES: ProcessAttribute[] = [
  {
    Name: "request_data",
    DataType: "object",
  },
  {
    Name: "reference_file",
    DataType: "file",
    Required: false,
  },
];

const QUOTATION_CREATION_ATTRIBUTES: ProcessAttribute[] = [
  {
    Name: "vendor_name",
    DataType: "string",
  },
  {
    Name: "quote_no",
    DataType: "string",
  },
  {
    Name: "quoted_amount",
    DataType: "number",
  },
  {
    Name: "quote_date",
    DataType: "date",
  },
  {
    Name: "currency",
    DataType: "string",
  },
  {
    Name: "executive_rating",
    DataType: "integer",
    Min: 1,
    Max: 5,
  },
];

const RATING_ATTRIBUTES: ProcessAttribute[] = [
  {
    Name: "quote_id",
    DataType: "integer",
  },
  {
    Name: "vendor_name",
    DataType: "string",
  },
  {
    Name: "quote_no",
    DataType: "string",
  },
  {
    Name: "quoted_amount",
    DataType: "number",
  },
  {
    Name: "quote_date",
    DataType: "date",
  },
  {
    Name: "currency",
    DataType: "string",
  },
  {
    Name: "executive_rating",
    DataType: "integer",
    Min: 1,
    Max: 5,
  },
  {
    Name: "comparison_ratings",
    DataType: "object",
  },
];

const SELECTION_ATTRIBUTES: ProcessAttribute[] = [
  ...RATING_ATTRIBUTES,
  {
    Name: "is_selected",
    DataType: "boolean",
  },
];

/* ============================================================
   HELPERS
============================================================ */

function normalize(value: string | undefined | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/* ============================================================
   TASK TYPE → CONFIG TYPE
============================================================ */

function getConfigTypeForTask(
  taskType: string,
): string | null {
  return (
    TASK_CONFIG_TYPE_MAP[normalize(taskType)] ??
    null
  );
}

/* ============================================================
   TASK TYPE → DEFAULT ATTRIBUTES
============================================================ */

function getDefaultAttributes(
  taskType: string,
): ProcessAttribute[] {
  switch (normalize(taskType)) {
    case "employee request":
      return EMPLOYEE_REQUEST_ATTRIBUTES.map(
        (attribute) => ({
          ...attribute,
        }),
      );

    case "quotation creation":
      return QUOTATION_CREATION_ATTRIBUTES.map(
        (attribute) => ({
          ...attribute,
        }),
      );

    case "rating":
      return RATING_ATTRIBUTES.map(
        (attribute) => ({
          ...attribute,
        }),
      );

    case "selection":
      return SELECTION_ATTRIBUTES.map(
        (attribute) => ({
          ...attribute,
        }),
      );

    default:
      return [];
  }
}

/* ============================================================
   TASK TYPE → DEFAULT MAX QUOTATIONS
============================================================ */

function getDefaultMaximumQuotations(
  taskType: string,
): number | undefined {
  if (
    normalize(taskType) ===
    "quotation creation"
  ) {
    return 5;
  }

  return undefined;
}

/* ============================================================
   TASK TYPE → DEFAULT SELECTION ATTRIBUTE
============================================================ */

function getDefaultSelectionAttribute(
  taskType: string,
): string {
  if (
    normalize(taskType) ===
    "selection"
  ) {
    return "quote_id";
  }

  return "";
}

/* ============================================================
   MAP WORKFLOW LEVEL
============================================================ */

function mapWorkflowLevel(
  level: WorkflowConfig["levels"][number],
  index: number,
): ProcessLevel {
  return {
    Label: level.label,

    Actions: Array.isArray(level.actions)
      ? level.actions
      : [],

    Sequence: index + 1,

    ...(level.condition
      ? {
          condition: level.condition,
        }
      : {}),

    ...(level.assignTo
      ? {
          assignTo: level.assignTo,
        }
      : {}),

    ...(level.backofficeSubWorkflow
      ? {
          backofficeSubWorkflow: {
            levels:
              level.backofficeSubWorkflow.levels.map(
                (subLevel, subIndex) =>
                  mapWorkflowLevel(
                    subLevel,
                    subIndex,
                  ),
              ),
          },
        }
      : {}),
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function CreateProcess({
  onCreated,
  onCancel,
}: CreateProcessProps) {
  /* ==========================================================
     PROCESS
  ========================================================== */

  const [processName, setProcessName] =
    useState("");

  const [documentType, setDocumentType] =
    useState("");

  /* ==========================================================
     API DATA
  ========================================================== */

  const [taskTypes, setTaskTypes] =
    useState<TaskType[]>([]);

  const [workflowConfigs, setWorkflowConfigs] =
    useState<WorkflowConfigSummary[]>([]);

  /* ==========================================================
     TASKS
  ========================================================== */

  const [tasks, setTasks] =
    useState<EditableTask[]>([]);

  /* ==========================================================
     LOADING
  ========================================================== */

  const [loadingTaskTypes, setLoadingTaskTypes] =
    useState(true);

  const [loadingConfigs, setLoadingConfigs] =
    useState(true);

  const [loadingConfigIds, setLoadingConfigIds] =
    useState<number[]>([]);

  const [saving, setSaving] =
    useState(false);

  /* ==========================================================
     ERROR
  ========================================================== */

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD API DATA
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoadingTaskTypes(true);
      setLoadingConfigs(true);
      setError("");

      try {
        const [
          taskTypeResponse,
          configResponse,
        ] = await Promise.all([
          getTaskTypes(),
          getWorkflowConfigs(),
        ]);

        if (cancelled) {
          return;
        }

        setTaskTypes(
          taskTypeResponse.data ?? [],
        );

        const activeConfigs = (
          configResponse.data ?? []
        )
          .filter(
            (config) =>
              normalize(config.status) ===
              "active",
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name),
          );

        setWorkflowConfigs(
          activeConfigs,
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load task types and workflow configurations.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingTaskTypes(false);
          setLoadingConfigs(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     CREATE EMPTY TASK
  ========================================================== */

  const createEmptyTask = (
    type: TaskType,
  ): EditableTask => {
    const attributes =
      getDefaultAttributes(
        type.TaskType,
      );

    return {
      id:
        Date.now() +
        Math.floor(
          Math.random() * 100000,
        ),

      TaskTypeID:
        type.TaskTypeID,

      TaskType:
        type.TaskType,

      TaskName: "",

      DocumentType:
        documentType,

      ConfigID: "",

      ConfigType: "",

      KeyParam: "",

      ItemParams: [],

      Attributes:
        attributes,

      Levels: [],

      Level: undefined,

      ComparisonRating:
        normalize(type.TaskType) ===
        "rating"
          ? {
              Min: 1,
              Max: 5,
            }
          : undefined,

      SelectionAttribute:
        getDefaultSelectionAttribute(
          type.TaskType,
        ),

      MaximumQuotations:
        getDefaultMaximumQuotations(
          type.TaskType,
        ),
    };
  };

  /* ==========================================================
     GET CONFIGS FOR TASK
  ========================================================== */

  const getConfigsForTask = (
    taskType: string,
  ): WorkflowConfigSummary[] => {
    const configType =
      getConfigTypeForTask(taskType);

    if (!configType) {
      return [];
    }

    return workflowConfigs.filter(
      (config) =>
        normalize(config.status) ===
          "active" &&
        normalize(
          config.configType,
        ) === normalize(configType),
    );
  };

  /* ==========================================================
     ADD TASK
  ========================================================== */

  const addTask = () => {
    if (taskTypes.length === 0) {
      return;
    }

    const firstType = taskTypes[0];

    setTasks((current) => [
      ...current,
      createEmptyTask(firstType),
    ]);
  };

  /* ==========================================================
     REMOVE TASK
  ========================================================== */

  const removeTask = (
    taskId: number,
  ) => {
    setTasks((current) =>
      current.filter(
        (task) =>
          task.id !== taskId,
      ),
    );
  };

  /* ==========================================================
     UPDATE TASK
  ========================================================== */

  const updateTask = (
    taskId: number,
    updates: Partial<EditableTask>,
  ) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
            }
          : task,
      ),
    );
  };

  /* ==========================================================
     LOAD CONFIG DETAILS
  ========================================================== */

  const loadConfigDetails = async (
    taskId: number,
    configId: string,
  ) => {
    if (!configId) {
      return;
    }

    setLoadingConfigIds(
      (current) =>
        current.includes(taskId)
          ? current
          : [...current, taskId],
    );

    setError("");

    try {
      const response =
        await getWorkflowConfig(
          configId,
        );

      const config: WorkflowConfig =
        response.data;

      const levels =
        (config.levels ?? []).map(
          (level, index) =>
            mapWorkflowLevel(
              level,
              index,
            ),
        );

      /*
       * Only update this task if the user
       * still has the same config selected.
       *
       * This prevents an old API response
       * from overwriting a newer selection.
       */
      setTasks((current) =>
        current.map((task) => {
          if (
            task.id !== taskId ||
            task.ConfigID !== configId
          ) {
            return task;
          }

          return {
            ...task,

            ConfigID:
              config.id,

            ConfigType:
              config.configType,

            KeyParam:
              config.keyParam ?? "",

            ItemParams:
              config.itemParams ?? [],

            Levels:
              levels,

            Level:
              levels.length === 1
                ? levels[0]
                : undefined,
          };
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load workflow configuration.",
      );
    } finally {
      setLoadingConfigIds(
        (current) =>
          current.filter(
            (id) =>
              id !== taskId,
          ),
      );
    }
  };

  /* ==========================================================
     CHANGE TASK TYPE
  ========================================================== */

  const handleTaskTypeChange =
    async (
      taskId: number,
      taskTypeId: number,
    ) => {
      const selectedType =
        taskTypes.find(
          (type) =>
            type.TaskTypeID ===
            taskTypeId,
        );

      if (!selectedType) {
        return;
      }

      const defaultAttributes =
        getDefaultAttributes(
          selectedType.TaskType,
        );

      const defaultComparisonRating =
        normalize(
          selectedType.TaskType,
        ) === "rating"
          ? {
              Min: 1,
              Max: 5,
            }
          : undefined;

      const defaultMaximumQuotations =
        getDefaultMaximumQuotations(
          selectedType.TaskType,
        );

      const defaultSelectionAttribute =
        getDefaultSelectionAttribute(
          selectedType.TaskType,
        );

      updateTask(taskId, {
        TaskTypeID:
          selectedType.TaskTypeID,

        TaskType:
          selectedType.TaskType,

        TaskName: "",

        DocumentType:
          documentType,

        ConfigID: "",

        ConfigType: "",

        KeyParam: "",

        ItemParams: [],

        Attributes:
          defaultAttributes,

        Levels: [],

        Level: undefined,

        ComparisonRating:
          defaultComparisonRating,

        SelectionAttribute:
          defaultSelectionAttribute,

        MaximumQuotations:
          defaultMaximumQuotations,
      });

      const matchingConfigs =
        getConfigsForTask(
          selectedType.TaskType,
        );

      /*
       * Automatically select a config
       * when exactly one matching config exists.
       */
      if (
        matchingConfigs.length === 1
      ) {
        const config =
          matchingConfigs[0];

        /*
         * Set summary data immediately.
         */
        updateTask(taskId, {
          ConfigID:
            config.id,

          ConfigType:
            config.configType,

          KeyParam:
            config.keyParam ?? "",

          ItemParams:
            config.itemParams ?? [],
        });

        /*
         * Then load complete details.
         */
        await loadConfigDetails(
          taskId,
          config.id,
        );
      }
    };

  /* ==========================================================
     SELECT CONFIG
  ========================================================== */

  const handleConfigChange =
    async (
      taskId: number,
      configId: string,
    ) => {
      if (!configId) {
        updateTask(taskId, {
          ConfigID: "",
          ConfigType: "",
          KeyParam: "",
          ItemParams: [],
          Levels: [],
          Level: undefined,
        });

        return;
      }

      const selectedConfig =
        workflowConfigs.find(
          (config) =>
            config.id === configId,
        );

      if (!selectedConfig) {
        return;
      }

      updateTask(taskId, {
        ConfigID:
          selectedConfig.id,

        ConfigType:
          selectedConfig.configType,

        KeyParam:
          selectedConfig.keyParam ??
          "",

        ItemParams:
          selectedConfig.itemParams ??
          [],

        Levels: [],

        Level: undefined,
      });

      await loadConfigDetails(
        taskId,
        selectedConfig.id,
      );
    };

  /* ==========================================================
     CONFIG STATUS
  ========================================================== */

  const getConfigStatus = (
    task: EditableTask,
  ):
    | "not-required"
    | "required"
    | "selected" => {
    const requiredConfigType =
      getConfigTypeForTask(
        task.TaskType,
      );

    if (!requiredConfigType) {
      return "not-required";
    }

    if (!task.ConfigID) {
      return "required";
    }

    return "selected";
  };

  /* ==========================================================
     BUILD BACKEND TASK
  ========================================================== */

  const buildProcessTask = (
    task: EditableTask,
  ): ProcessTask => {
    /*
     * Always ensure required attributes
     * exist for the selected task type.
     */
    const attributes =
      task.Attributes.length > 0
        ? task.Attributes
        : getDefaultAttributes(
            task.TaskType,
          );

    const taskDetails: ProcessTaskDetails =
      {
        TaskName:
          task.TaskName.trim(),

        ...(task.DocumentType.trim()
          ? {
              DocumentType:
                task.DocumentType.trim(),
            }
          : {}),
      };

    /*
     * Attributes
     */
    if (attributes.length > 0) {
      taskDetails.Attributes =
        attributes;
    }

    /*
     * Workflow configuration
     */
    if (task.ConfigID) {
      taskDetails.ConfigID =
        task.ConfigID;
    }

    if (task.ConfigType) {
      taskDetails.ConfigType =
        task.ConfigType;
    }

    if (task.KeyParam) {
      taskDetails.KeyParam =
        task.KeyParam;
    }

    if (task.ItemParams.length > 0) {
      taskDetails.ItemParams =
        task.ItemParams;
    }

    /*
     * Levels
     */
    if (task.Levels.length > 0) {
      taskDetails.Levels =
        task.Levels;
    }

    /*
     * Single-level configuration
     */
    if (task.Level) {
      taskDetails.Level =
        task.Level;
    }

    /*
     * Rating
     */
    if (
      task.ComparisonRating
    ) {
      taskDetails.ComparisonRating =
        task.ComparisonRating;
    }

    /*
     * Selection
     */
    if (
      task.SelectionAttribute
    ) {
      taskDetails.SelectionAttribute =
        task.SelectionAttribute;
    }

    /*
     * Maximum quotations
     */
    if (
      task.MaximumQuotations !==
        undefined &&
      task.MaximumQuotations !== null
    ) {
      taskDetails.MaximumQuotations =
        task.MaximumQuotations;
    }

    return {
      TaskTypeID:
        task.TaskTypeID,

      TaskType:
        task.TaskType,

      TaskDetails:
        taskDetails,
    };
  };

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const validationMessage =
    useMemo(() => {
      if (!processName.trim()) {
        return "Process name is required.";
      }

      if (!documentType.trim()) {
        return "Document type is required.";
      }

      if (tasks.length === 0) {
        return "Add at least one task.";
      }

      const invalidName =
        tasks.find(
          (task) =>
            !task.TaskName.trim(),
        );

      if (invalidName) {
        return `Task ${
          tasks.indexOf(
            invalidName,
          ) + 1
        } must have a task name.`;
      }

      /*
       * Employee Request, Quotation Creation,
       * Rating and Selection require attributes.
       */
      const invalidAttributes =
        tasks.find((task) => {
          const required =
            getDefaultAttributes(
              task.TaskType,
            );

          return (
            required.length > 0 &&
            task.Attributes.length === 0
          );
        });

      if (invalidAttributes) {
        return `Attributes are required for "${invalidAttributes.TaskType}".`;
      }

      /*
       * Workflow configuration validation.
       */
      const invalidConfig =
        tasks.find(
          (task) =>
            getConfigStatus(task) ===
            "required",
        );

      if (invalidConfig) {
        return `Please select a workflow configuration for "${invalidConfig.TaskType}".`;
      }

      if (
        loadingConfigIds.length > 0
      ) {
        return "Please wait until all workflow configurations are loaded.";
      }

      return "";
    }, [
      processName,
      documentType,
      tasks,
      loadingConfigIds,
    ]);

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit =
    async () => {
      setError("");

      if (validationMessage) {
        setError(
          validationMessage,
        );
        return;
      }

      try {
        setSaving(true);

        const processTasks =
          tasks.map(
            buildProcessTask,
          );

        const payload = {
          ProcessJson: {
            ProcessName:
              processName.trim(),

            DocumentType:
              documentType.trim(),

            NumberofTasks:
              processTasks.length,

            Tasks:
              processTasks,
          },
        };

        console.log(
          "CREATE PROCESS PAYLOAD:",
        );

        console.log(
          JSON.stringify(
            payload,
            null,
            2,
          ),
        );

        await createProcess(
          payload,
        );

        onCreated();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create process.",
        );
      } finally {
        setSaving(false);
      }
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">
      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ======================================================
          PROCESS DETAILS
      ======================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
            <Settings2 size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Process Details
            </h3>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Define the process name and
              document type.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Process Name */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Process Name
            </label>

            <input
              value={processName}
              onChange={(event) =>
                setProcessName(
                  event.target.value,
                )
              }
              placeholder="e.g. AssetPurchaseRequest"
              disabled={saving}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Document Type */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Document Type
            </label>

            <input
              value={documentType}
              onChange={(event) => {
                const value =
                  event.target.value;

                setDocumentType(value);

                setTasks((current) =>
                  current.map(
                    (task) => ({
                      ...task,
                      DocumentType:
                        value,
                    }),
                  ),
                );
              }}
              placeholder="e.g. AssetPurchaseRequest"
              disabled={saving}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          WORKFLOW TASKS
      ======================================================= */}

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Workflow Tasks
            </h3>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select task types and configure
              their workflow. Required
              attributes are populated
              automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={addTask}
            disabled={
              loadingTaskTypes ||
              loadingConfigs ||
              taskTypes.length === 0 ||
              saving
            }
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Add Task
          </button>
        </div>

        {/* ====================================================
            LOADING
        ===================================================== */}

        {loadingTaskTypes ||
        loadingConfigs ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 py-14 dark:border-slate-800">
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Loader2
                size={22}
                className="animate-spin text-cyan-500"
              />

              Loading task types and
              workflow configurations...
            </div>
          </div>
        ) : tasks.length === 0 ? (
          /* ==================================================
             EMPTY
          ================================================== */

          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-800">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
              <Plus size={22} />
            </div>

            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              No workflow tasks added
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add a task to start building
              this process.
            </p>

            <button
              type="button"
              onClick={addTask}
              disabled={saving}
              className="mt-4 text-sm font-semibold text-cyan-500 hover:text-cyan-600 disabled:opacity-50"
            >
              + Add your first task
            </button>
          </div>
        ) : (
          /* ==================================================
             TASK LIST
          ================================================== */

          <div className="space-y-4">
            {tasks.map(
              (task, index) => {
                const availableConfigs =
                  getConfigsForTask(
                    task.TaskType,
                  );

                const configType =
                  getConfigTypeForTask(
                    task.TaskType,
                  );

               
                const isLoadingConfig =
                  loadingConfigIds.includes(
                    task.id,
                  );

                const taskDescription =
                  taskTypes.find(
                    (type) =>
                      type.TaskTypeID ===
                      task.TaskTypeID,
                  )?.Description ??
                  "";

                return (
                  <div
                    key={task.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* =================================================
                        TASK HEADER
                    ================================================== */}

                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-sm font-bold text-cyan-500">
                          {index + 1}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            Task {index + 1}
                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {task.TaskType}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeTask(
                            task.id,
                          )
                        }
                        disabled={saving}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Remove task"
                      >
                        <Trash2
                          size={17}
                        />
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* =================================================
                            TASK TYPE
                        ================================================== */}

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Task Type
                          </label>

                          <div className="relative">
                            <select
                              value={
                                task.TaskTypeID
                              }
                              onChange={(
                                event,
                              ) =>
                                handleTaskTypeChange(
                                  task.id,
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                                )
                              }
                              disabled={
                                saving ||
                                isLoadingConfig
                              }
                              className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                              {taskTypes.map(
                                (
                                  type,
                                ) => (
                                  <option
                                    key={
                                      type.TaskTypeID
                                    }
                                    value={
                                      type.TaskTypeID
                                    }
                                  >
                                    {
                                      type.TaskType
                                    }
                                  </option>
                                ),
                              )}
                            </select>

                            <ChevronDown
                              size={17}
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                          </div>

                          {taskDescription && (
                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                              {
                                taskDescription
                              }
                            </p>
                          )}
                        </div>

                        {/* =================================================
                            TASK NAME
                        ================================================== */}

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Task Name
                          </label>

                          <input
                            value={
                              task.TaskName
                            }
                            onChange={(
                              event,
                            ) =>
                              updateTask(
                                task.id,
                                {
                                  TaskName:
                                    event
                                      .target
                                      .value,
                                },
                              )
                            }
                            placeholder="Enter task name"
                            disabled={
                              saving
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                        </div>

                        {/* =================================================
                            CONFIG TYPE
                        ================================================== */}

                        {configType && (
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Configuration Type
                            </label>

                            <div className="flex min-h-[42px] items-center rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 dark:border-cyan-900/50 dark:bg-cyan-950/20">
                              <span className="rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
                                {configType}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              Automatically
                              determined by
                              the task type.
                            </p>
                          </div>
                        )}

                        {/* =================================================
                            CONFIG
                        ================================================== */}

                        {configType && (
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Workflow Configuration
                            </label>

                            {availableConfigs.length ===
                            0 ? (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                  No active configuration
                                  available
                                </p>

                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                  The API requires a{" "}
                                  {configType}{" "}
                                  configuration
                                  for this task
                                  type.
                                </p>
                              </div>
                            ) : availableConfigs.length ===
                              1 ? (
                              <div className="flex min-h-[42px] items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-base shadow-sm dark:bg-slate-900">
                                  {
                                    availableConfigs[0]
                                      .icon ??
                                      "⚙️"
                                  }
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                    {
                                      availableConfigs[0]
                                        .name
                                    }
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    v
                                    {
                                      availableConfigs[0]
                                        .version
                                    }
                                    {" • "}
                                    {
                                      availableConfigs[0]
                                        .levels
                                    }{" "}
                                    level
                                    {availableConfigs[0]
                                      .levels !==
                                    1
                                      ? "s"
                                      : ""}
                                  </p>
                                </div>

                                {task.ConfigID &&
                                !isLoadingConfig ? (
                                  <CheckCircle2
                                    size={19}
                                    className="shrink-0 text-emerald-500"
                                  />
                                ) : isLoadingConfig ? (
                                  <Loader2
                                    size={19}
                                    className="shrink-0 animate-spin text-cyan-500"
                                  />
                                ) : null}
                              </div>
                            ) : (
                              <div className="relative">
                                <select
                                  value={
                                    task.ConfigID
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    handleConfigChange(
                                      task.id,
                                      event
                                        .target
                                        .value,
                                    )
                                  }
                                  disabled={
                                    isLoadingConfig ||
                                    saving
                                  }
                                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                >
                                  <option value="">
                                    Select workflow
                                    configuration
                                  </option>

                                  {availableConfigs.map(
                                    (
                                      config,
                                    ) => (
                                      <option
                                        key={
                                          config.id
                                        }
                                        value={
                                          config.id
                                        }
                                      >
                                        {config.icon ??
                                          "⚙️"}{" "}
                                        {
                                          config.name
                                        }{" "}
                                        — v
                                        {
                                          config.version
                                        }
                                      </option>
                                    ),
                                  )}
                                </select>

                                <ChevronDown
                                  size={17}
                                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* =================================================
                            ATTRIBUTES
                        ================================================== */}

                        {task.Attributes.length >
                          0 && (
                          <div className="md:col-span-2">
                            <div className="mb-2 flex items-center justify-between">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Attributes
                                </label>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  Automatically
                                  generated for
                                  this task type.
                                </p>
                              </div>

                              <span className="rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                                {
                                  task
                                    .Attributes
                                    .length
                                }{" "}
                                attributes
                              </span>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                              <div className="grid grid-cols-[minmax(0,1fr)_120px_100px] border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                                <span>
                                  Name
                                </span>

                                <span>
                                  Data Type
                                </span>

                                <span>
                                  Validation
                                </span>
                              </div>

                              {task.Attributes.map(
                                (
                                  attribute,
                                  attributeIndex,
                                ) => (
                                  <div
                                    key={`${task.id}-attribute-${attributeIndex}`}
                                    className="grid grid-cols-[minmax(0,1fr)_120px_100px] items-center border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800"
                                  >
                                    <div className="flex items-center gap-2">
                                      <FileJson
                                        size={
                                          15
                                        }
                                        className="shrink-0 text-cyan-500"
                                      />

                                      <span className="break-all text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {
                                          attribute.Name
                                        }
                                      </span>
                                    </div>

                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {
                                        attribute.DataType
                                      }
                                    </span>

                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {attribute.Min !==
                                        undefined &&
                                      attribute.Max !==
                                        undefined ? (
                                        <>
                                          {
                                            attribute.Min
                                          }
                                          {"–"}
                                          {
                                            attribute.Max
                                          }
                                        </>
                                      ) : attribute.Required ===
                                        false ? (
                                        "Optional"
                                      ) : (
                                        "Required"
                                      )}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {/* =================================================
                            MAX QUOTATIONS
                        ================================================== */}

                        {normalize(
                          task.TaskType,
                        ) ===
                          "quotation creation" && (
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Maximum Quotations
                            </label>

                            <input
                              type="number"
                              min={1}
                              value={
                                task.MaximumQuotations ??
                                ""
                              }
                              onChange={(
                                event,
                              ) => {
                                const value =
                                  event
                                    .target
                                    .value;

                                updateTask(
                                  task.id,
                                  {
                                    MaximumQuotations:
                                      value ===
                                      ""
                                        ? undefined
                                        : Number(
                                            value,
                                          ),
                                  },
                                );
                              }}
                              disabled={
                                saving
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />

                            <p className="mt-1 text-xs text-slate-400">
                              Maximum number of
                              quotations allowed.
                            </p>
                          </div>
                        )}

                        {/* =================================================
                            COMPARISON RATING
                        ================================================== */}

                        {normalize(
                          task.TaskType,
                        ) === "rating" && (
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Comparison Rating
                            </label>

                            <div className="flex items-center gap-2">
                              <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                                Min:{" "}
                                {
                                  task
                                    .ComparisonRating
                                    ?.Min
                                }
                              </div>

                              <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                                Max:{" "}
                                {
                                  task
                                    .ComparisonRating
                                    ?.Max
                                }
                              </div>
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              Rating range is
                              automatically set to
                              1–5.
                            </p>
                          </div>
                        )}

                        {/* =================================================
                            SELECTION ATTRIBUTE
                        ================================================== */}

                        {normalize(
                          task.TaskType,
                        ) === "selection" && (
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Selection Attribute
                            </label>

                            <div className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                              {
                                task.SelectionAttribute
                              }
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              Attribute used to identify
                              the selected quotation.
                            </p>
                          </div>
                        )}

                        {/* =================================================
                            CONFIG ID
                        ================================================== */}

                        {task.ConfigID && (
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Config ID
                            </label>

                            <div className="min-h-[42px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                              <span className="break-all">
                                {
                                  task.ConfigID
                                }
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              Automatically obtained
                              from the workflow
                              configuration API.
                            </p>
                          </div>
                        )}

                        {/* =================================================
                            KEY PARAM
                        ================================================== */}

                        {task.ConfigID && (
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Key Parameter
                            </label>

                            <div className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                              {task.KeyParam ||
                                "—"}
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              Automatically populated
                              from the selected
                              configuration.
                            </p>
                          </div>
                        )}

                        {/* =================================================
                            ITEM PARAMS
                        ================================================== */}

                        {task.ConfigID && (
                          <div className="md:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Item Parameters
                            </label>

                            {task.ItemParams
                              .length >
                            0 ? (
                              <div className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
                                {task.ItemParams.map(
                                  (
                                    item,
                                  ) => (
                                    <span
                                      key={
                                        item
                                      }
                                      className="rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-600 dark:text-cyan-400"
                                    >
                                      {
                                        item
                                      }
                                    </span>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950">
                                No item
                                parameters
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ====================================================
                          APPROVAL LEVELS
                      ===================================================== */}

                      {task.ConfigType ===
                        "approval" &&
                        task.Levels.length >
                          0 && (
                          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                            <div className="mb-4 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                  Approval Levels
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  Loaded directly from
                                  the selected workflow
                                  configuration.
                                </p>
                              </div>

                              <span className="rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                                {
                                  task
                                    .Levels
                                    .length
                                }{" "}
                                {task.Levels
                                  .length ===
                                1
                                  ? "Level"
                                  : "Levels"}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {task.Levels.map(
                                (
                                  level,
                                  levelIndex,
                                ) => (
                                  <div
                                    key={`${task.id}-${levelIndex}`}
                                    className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-bold text-cyan-500">
                                        {
                                          levelIndex +
                                            1
                                        }
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                            {String(
                                              level.Label ??
                                                `Level ${
                                                  levelIndex +
                                                  1
                                                }`,
                                            )}
                                          </p>

                                          {level.Sequence !==
                                            undefined && (
                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                              Sequence{" "}
                                              {
                                                level.Sequence
                                              }
                                            </span>
                                          )}
                                        </div>

                                        {Array.isArray(
                                          level.Actions,
                                        ) &&
                                          level.Actions
                                            .length >
                                            0 && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                              {level.Actions.map(
                                                (
                                                  action,
                                                ) => (
                                                  <span
                                                    key={
                                                      action
                                                    }
                                                    className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                  >
                                                    {
                                                      action
                                                    }
                                                  </span>
                                                ),
                                              )}
                                            </div>
                                          )}

                                        {level.condition && (
                                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-medium text-slate-600 dark:text-slate-300">
                                              Condition:
                                            </span>{" "}
                                            {
                                              level.condition
                                            }
                                          </p>
                                        )}

                                        {level.assignTo && (
                                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-medium text-slate-600 dark:text-slate-300">
                                              Assign to:
                                            </span>{" "}
                                            {
                                              level.assignTo
                                            }
                                          </p>
                                        )}

                                        {level
                                          .backofficeSubWorkflow
                                          ?.levels
                                          ?.length ? (
                                          <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900/50 dark:bg-purple-950/20">
                                            <p className="mb-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                              Backoffice
                                              Sub-Workflow
                                            </p>

                                            <div className="space-y-1.5">
                                              {level.backofficeSubWorkflow.levels.map(
                                                (
                                                  subLevel,
                                                  subIndex,
                                                ) => (
                                                  <div
                                                    key={`${task.id}-${levelIndex}-sub-${subIndex}`}
                                                    className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                                                  >
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/10 text-[10px] font-semibold text-purple-500">
                                                      {
                                                        subIndex +
                                                          1
                                                      }
                                                    </span>

                                                    <span>
                                                      {
                                                        subLevel.Label
                                                      }
                                                    </span>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* ====================================================
                          SINGLE LEVEL
                      ===================================================== */}

                      {task.ConfigType !==
                        "approval" &&
                        task.Level && (
                          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              Assigned Level
                            </p>

                            <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                                <CheckCircle2
                                  size={16}
                                />
                              </div>

                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-white">
                                  {
                                    task
                                      .Level
                                      .Label
                                  }
                                </p>

                                {task.Level
                                  .assignTo && (
                                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Assign to:{" "}
                                    {
                                      task
                                        .Level
                                        .assignTo
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                      {/* ====================================================
                          LOADING
                      ===================================================== */}

                      {isLoadingConfig && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-xs text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/20 dark:text-cyan-300">
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />

                          Loading complete workflow
                          configuration...
                        </div>
                      )}

                      {/* ====================================================
                          SUCCESS
                      ===================================================== */}

                      {task.ConfigID &&
                        !isLoadingConfig && (
                          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                            <CheckCircle2
                              size={16}
                            />

                            Workflow configuration
                            loaded successfully from
                            the API.
                          </div>
                        )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>

      {/* ======================================================
          FOOTER
      ======================================================= */}

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            saving ||
            loadingTaskTypes ||
            loadingConfigs ||
            loadingConfigIds.length >
              0
          }
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && (
            <Loader2
              size={17}
              className="animate-spin"
            />
          )}

          {saving
            ? "Creating..."
            : "Create Process"}
        </button>
      </div>
    </div>
  );
}