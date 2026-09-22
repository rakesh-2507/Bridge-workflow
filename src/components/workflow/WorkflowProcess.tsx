import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  WorkflowDefinition,
} from "../../types/workflow";
/* =========================================================
   TYPES
========================================================= */



interface WorkflowCardProps {
  workflow: WorkflowDefinition;
  onClick: () => void;
}
interface NewStage {
  stage: string;
  details: string;
}

/* =========================================================
   WORKFLOW DATA
========================================================= */

const workflows: WorkflowDefinition[] = [{
  id: "asset-purchase-request",
  title: "Asset Purchase Request",
  description:
    "Asset procurement and approval workflow",
  accent: "cyan",

  stages: [
    {
      id: "asset-1",
      stage: "Raise Request",
      details:
        "Create asset purchase request",
    },
    {
      id: "asset-2",
      stage: "Collect Quotes",
      details:
        "Collect vendor quotations",
    },
    {
      id: "asset-3",
      stage: "Quotes & Rating",
      details:
        "Review and rate quotations",
    },
    {
      id: "asset-4",
      stage: "Manager Review",
      details:
        "Review selected quotation",
    },
    {
      id: "asset-5",
      stage: "Approve Request",
      details:
        "Approve the purchase request",
    },
  ],
},

{
  id: "writing-type",
  title: "Writing Type",
  description:
    "Content creation and review workflow",
  accent: "purple",

  stages: [
    {
      id: "writing-1",
      stage: "Writer",
      details: "Create content",
    },
    {
      id: "writing-2",
      stage: "Editor",
      details:
        "Edit and refine content",
    },
    {
      id: "writing-3",
      stage: "Reviewer",
      details:
        "Perform initial review",
    },
    {
      id: "writing-4",
      stage: "Quality Check",
      details:
        "Perform quality checks",
    },
    {
      id: "writing-5",
      stage: "Content Approval",
      details:
        "Approve final content",
    },
    {
      id: "writing-6",
      stage: "Formatting",
      details:
        "Finalize document formatting",
    },
    {
      id: "writing-7",
      stage: "Publishing",
      details:
        "Prepare content for publishing",
    },
    {
      id: "writing-8",
      stage: "Completed",
      details:
        "Complete the writing workflow",
    },
  ],
},
];

/* =========================================================
   WORKFLOW CARD
========================================================= */

const WorkflowCard = ({
  workflow,
  onClick,
}: WorkflowCardProps) => {
  const {
    title,
    description,
    stages,
    accent,
  } = workflow;

  const accentClasses =
    accent === "cyan"
      ? {
        border: "border-l-cyan-500",
        iconBg:
          "bg-cyan-50 dark:bg-cyan-950/40",
        icon:
          "text-cyan-600 dark:text-cyan-400",
        arrow:
          "group-hover:bg-cyan-500 group-hover:text-white",
      }
      : {
        border: "border-l-purple-500",
        iconBg:
          "bg-purple-50 dark:bg-purple-950/40",
        icon:
          "text-purple-600 dark:text-purple-400",
        arrow:
          "group-hover:bg-purple-500 group-hover:text-white",
      };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        relative
        w-full
        overflow-hidden
        rounded-xl
        border
        border-gray-200
        border-l-4
        ${accentClasses.border}
        bg-white
        p-5
        text-left
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-lg
        dark:border-gray-700
        dark:bg-gray-900
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-lg
            ${accentClasses.iconBg}
            ${accentClasses.icon}
          `}
        >
          <ClipboardList size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-y-2">
          {stages.map((stage, index) => {

            return (
              <div
                key={stage.id}
                className="flex items-center"
              >
                <div className="flex items-center gap-1.5">

                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {stage.stage}
                  </span>
                </div>

                {index < stages.length - 1 && (
                  <ArrowRight
                    size={14}
                    className="
                      mx-2
                      shrink-0
                      text-gray-300
                      dark:text-gray-600
                    "
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <span
          className="
            inline-flex
            items-center
            gap-1
            rounded-full
            bg-gray-100
            px-2.5
            py-1
            text-[11px]
            font-medium
            text-gray-600
            dark:bg-gray-800
            dark:text-gray-300
          "
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

          Active
        </span>

        <span
          className="
            inline-flex
            items-center
            gap-1
            rounded-full
            bg-gray-100
            px-2.5
            py-1
            text-[11px]
            font-medium
            text-gray-600
            dark:bg-gray-800
            dark:text-gray-300
          "
        >
          <span className="text-gray-400">
            ✦
          </span>

          {stages.length}{" "}
          {stages.length === 1
            ? "Stage"
            : "Stages"}
        </span>

        <div
          className={`
            ml-auto
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-full
            bg-gray-50
            text-gray-400
            transition-all
            group-hover:translate-x-1
            dark:bg-gray-800
            dark:text-gray-500
            ${accentClasses.arrow}
          `}
        >
          <ArrowRight size={15} />
        </div>
      </div>
    </button>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const WorkflowProcess = () => {
  const navigate = useNavigate();

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [processType, setProcessType] =
    useState("");

  const [stages, setStages] = useState<
    NewStage[]
  >([
    {
      stage: "",
      details: "",
    },
  ]);

  /* =======================================================
     ADD STAGE
  ======================================================= */

  const addStage = () => {
    setStages((current) => [
      ...current,
      {
        stage: "",
        details: "",
      },
    ]);
  };

  /* =======================================================
     REMOVE STAGE
  ======================================================= */

  const removeStage = (index: number) => {
    setStages((current) =>
      current.filter((_, i) => i !== index),
    );
  };

  /* =======================================================
     UPDATE STAGE
  ======================================================= */

  const updateStage = (
    index: number,
    field: keyof NewStage,
    value: string,
  ) => {
    setStages((current) =>
      current.map((item, i) =>
        i === index
          ? {
            ...item,
            [field]: value,
          }
          : item,
      ),
    );
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeForm = () => {
    setShowAddForm(false);
    setProcessType("");

    setStages([
      {
        stage: "",
        details: "",
      },
    ]);
  };

  /* =======================================================
     CREATE PROCESS
  ======================================================= */

  const handleCreateProcess = () => {
    if (!processType.trim()) {
      return;
    }

    const validStages = stages.filter(
      (item) => item.stage.trim() !== "",
    );

    if (validStages.length === 0) {
      return;
    }

    console.log({
      process_type: processType,
      stages: validStages,
    });

    closeForm();
  };

  /* =======================================================
     OPEN WORKFLOW DIAGRAM
  ======================================================= */
  const openWorkflow = (workflow: WorkflowDefinition) => {
    navigate(`/workflow-process/diagram/${workflow.id}`, {
      state: {
        workflow,
      },
    });
  };  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        min-h-full
        bg-gray-50
        p-5
        dark:bg-gray-950
      "
    >
      <div className="mx-auto">
        <div
          className="
            mb-6
            flex
            items-start
            justify-between
            gap-4
          "
        >
          <div>
            <h1
              className="
                text-xl
                font-semibold
                text-gray-900
                dark:text-white
              "
            >
              Workflow Process
            </h1>

            <p
              className="
                mt-1
                text-xs
                text-gray-500
                dark:text-gray-400
              "
            >
              Select a workflow process to manage
              its stages.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowAddForm(true)
            }
            className="
              inline-flex
              shrink-0
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
              transition-all
              hover:bg-cyan-700
              hover:shadow-md
              focus:outline-none
              focus:ring-2
              focus:ring-cyan-500/30
              dark:bg-cyan-500
              dark:hover:bg-cyan-600
            "
          >
            <Plus size={16} />
            Add Process
          </button>
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-5
            lg:grid-cols-2
            xl:grid-cols-3
          "
        >
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onClick={() =>
                openWorkflow(workflow)
              }
            />
          ))}
        </div>
      </div>

      {showAddForm && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/40
            p-4
            backdrop-blur-[2px]
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div
            className="
              flex
              max-h-[90vh]
              w-full
              max-w-2xl
              flex-col
              overflow-hidden
              rounded-2xl
              border
              border-gray-200
              bg-white
              shadow-2xl
              dark:border-gray-700
              dark:bg-gray-900
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-gray-200
                px-5
                py-4
                dark:border-gray-700
              "
            >
              <div>
                <h2
                  className="
                    text-base
                    font-semibold
                    text-gray-900
                    dark:text-white
                  "
                >
                  Add Workflow Process
                </h2>

                <p
                  className="
                    mt-0.5
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Create a process and define its
                  workflow stages.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  text-gray-400
                  transition-colors
                  hover:bg-gray-100
                  hover:text-gray-700
                  dark:hover:bg-gray-800
                  dark:hover:text-gray-200
                "
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <div>
                <label
                  className="
                    mb-1.5
                    block
                    text-xs
                    font-semibold
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  Process Type
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={processType}
                  onChange={(event) =>
                    setProcessType(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Asset Purchase Request"
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                    text-gray-900
                    outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-cyan-500
                    focus:ring-2
                    focus:ring-cyan-500/10
                    dark:border-gray-600
                    dark:bg-gray-800
                    dark:text-white
                    dark:placeholder:text-gray-500
                  "
                />
              </div>

              <div className="mt-6">
                <div
                  className="
                    mb-3
                    flex
                    items-center
                    justify-between
                  "
                >
                  <div>
                    <h3
                      className="
                        text-sm
                        font-semibold
                        text-gray-900
                        dark:text-white
                      "
                    >
                      Workflow Stages
                    </h3>

                    <p
                      className="
                        mt-0.5
                        text-[11px]
                        text-gray-500
                        dark:text-gray-400
                      "
                    >
                      Add the stages in the order
                      they should run.
                    </p>
                  </div>

                  <span
                    className="
                      rounded-full
                      bg-gray-100
                      px-2.5
                      py-1
                      text-[11px]
                      font-medium
                      text-gray-600
                      dark:bg-gray-800
                      dark:text-gray-300
                    "
                  >
                    {stages.length}{" "}
                    {stages.length === 1
                      ? "Stage"
                      : "Stages"}
                  </span>
                </div>

                <div className="space-y-3">
                  {stages.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="
                          rounded-xl
                          border
                          border-gray-200
                          bg-gray-50
                          p-4
                          dark:border-gray-700
                          dark:bg-gray-800/60
                        "
                      >
                        <div
                          className="
                            mb-3
                            flex
                            items-center
                            justify-between
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-2
                            "
                          >
                            <span
                              className="
                                flex
                                h-6
                                w-6
                                items-center
                                justify-center
                                rounded-full
                                bg-cyan-100
                                text-[11px]
                                font-bold
                                text-cyan-700
                                dark:bg-cyan-950/60
                                dark:text-cyan-400
                              "
                            >
                              {index + 1}
                            </span>

                            <span
                              className="
                                text-xs
                                font-semibold
                                text-gray-700
                                dark:text-gray-300
                              "
                            >
                              Stage {index + 1}
                            </span>
                          </div>

                          {stages.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeStage(
                                  index,
                                )
                              }
                              className="
                                flex
                                h-7
                                w-7
                                items-center
                                justify-center
                                rounded-md
                                text-gray-400
                                transition-colors
                                hover:bg-red-50
                                hover:text-red-500
                                dark:hover:bg-red-950/30
                              "
                              title="Remove stage"
                            >
                              <Trash2
                                size={14}
                              />
                            </button>
                          )}
                        </div>

                        <div
                          className="
                            grid
                            grid-cols-1
                            gap-3
                            md:grid-cols-2
                          "
                        >
                          <div>
                            <label
                              className="
                                mb-1.5
                                block
                                text-[11px]
                                font-medium
                                text-gray-600
                                dark:text-gray-400
                              "
                            >
                              Stage
                              <span className="ml-1 text-red-500">
                                *
                              </span>
                            </label>

                            <input
                              type="text"
                              value={item.stage}
                              onChange={(
                                event,
                              ) =>
                                updateStage(
                                  index,
                                  "stage",
                                  event.target.value,
                                )
                              }
                              placeholder="e.g. Manager Approval"
                              className="
                                w-full
                                rounded-lg
                                border
                                border-gray-300
                                bg-white
                                px-3
                                py-2
                                text-xs
                                text-gray-900
                                outline-none
                                transition
                                placeholder:text-gray-400
                                focus:border-cyan-500
                                focus:ring-2
                                focus:ring-cyan-500/10
                                dark:border-gray-600
                                dark:bg-gray-900
                                dark:text-white
                                dark:placeholder:text-gray-500
                              "
                            />
                          </div>

                          <div>
                            <label
                              className="
                                mb-1.5
                                block
                                text-[11px]
                                font-medium
                                text-gray-600
                                dark:text-gray-400
                              "
                            >
                              Stage Details
                            </label>

                            <input
                              type="text"
                              value={
                                item.details
                              }
                              onChange={(
                                event,
                              ) =>
                                updateStage(
                                  index,
                                  "details",
                                  event.target.value,
                                )
                              }
                              placeholder="Describe what happens here"
                              className="
                                w-full
                                rounded-lg
                                border
                                border-gray-300
                                bg-white
                                px-3
                                py-2
                                text-xs
                                text-gray-900
                                outline-none
                                transition
                                placeholder:text-gray-400
                                focus:border-cyan-500
                                focus:ring-2
                                focus:ring-cyan-500/10
                                dark:border-gray-600
                                dark:bg-gray-900
                                dark:text-white
                                dark:placeholder:text-gray-500
                              "
                            />
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={addStage}
                  className="
                    mt-3
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    border
                    border-dashed
                    border-cyan-300
                    bg-cyan-50/50
                    px-4
                    py-2.5
                    text-xs
                    font-semibold
                    text-cyan-600
                    transition-all
                    hover:border-cyan-500
                    hover:bg-cyan-50
                    dark:border-cyan-800
                    dark:bg-cyan-950/20
                    dark:text-cyan-400
                    dark:hover:bg-cyan-950/40
                  "
                >
                  <Plus size={15} />
                  Add Stage
                </button>
              </div>
            </div>

            <div
              className="
                flex
                items-center
                justify-end
                gap-2
                border-t
                border-gray-200
                bg-gray-50
                px-5
                py-3
                dark:border-gray-700
                dark:bg-gray-900
              "
            >
              <button
                type="button"
                onClick={closeForm}
                className="
                  rounded-lg
                  border
                  border-gray-300
                  px-4
                  py-2
                  text-xs
                  font-semibold
                  text-gray-600
                  transition-colors
                  hover:bg-white
                  dark:border-gray-600
                  dark:text-gray-300
                  dark:hover:bg-gray-800
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateProcess}
                disabled={
                  !processType.trim() ||
                  stages.every(
                    (item) =>
                      !item.stage.trim(),
                  )
                }
                className="
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
                  shadow-sm
                  transition-all
                  hover:bg-cyan-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:bg-cyan-500
                  dark:hover:bg-cyan-600
                "
              >
                <CheckCircle2 size={15} />
                Create Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowProcess;
