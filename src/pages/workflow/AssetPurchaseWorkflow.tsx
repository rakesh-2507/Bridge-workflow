import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WorkflowStage {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  accent: "cyan" | "purple" | "emerald";
}

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

const accentStyles = {
  cyan: {
    border: "border-cyan-200 dark:border-cyan-900/60",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    icon: "text-cyan-600 dark:text-cyan-400",
    number: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
  },
  purple: {
    border: "border-purple-200 dark:border-purple-900/60",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    icon: "text-purple-600 dark:text-purple-400",
    number:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  },
  emerald: {
    border: "border-emerald-200 dark:border-emerald-900/60",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    icon: "text-emerald-600 dark:text-emerald-400",
    number:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  },
};

const AssetPurchaseWorkflow = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-gray-50 p-5 dark:bg-gray-950">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate("/workflow-process")}
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-lg border border-gray-200
              bg-white text-gray-500
              shadow-sm transition-all
              hover:bg-gray-100 hover:text-gray-800
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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Asset Purchase Workflow
            </h1>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Configure the stages for the Asset Purchase Request workflow.
            </p>
          </div>
        </div>

        {/* Workflow stages */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const styles = accentStyles[stage.accent];

            return (
              <div
                key={stage.number}
                className={`
                  group relative overflow-hidden rounded-2xl
                  border bg-white p-5 shadow-sm
                  transition-all duration-200
                  hover:-translate-y-1 hover:shadow-lg
                  dark:bg-gray-900
                  ${styles.border}
                `}
              >
                {/* Stage number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`
                      flex h-8 w-8 items-center justify-center
                      rounded-full text-xs font-bold
                      ${styles.number}
                    `}
                  >
                    {String(stage.number).padStart(2, "0")}
                  </span>

                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Stage {stage.number}
                  </span>
                </div>

                {/* Icon */}
                <div
                  className={`
                    mt-5 flex h-11 w-11 items-center justify-center
                    rounded-xl ${styles.bg} ${styles.icon}
                  `}
                >
                  <Icon size={21} />
                </div>

                {/* Content */}
                <div className="mt-4">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {stage.title}
                  </h2>

                  <p className="mt-1.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    {stage.description}
                  </p>
                </div>

                {/* Bottom */}
                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                  <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                    Workflow stage
                  </span>

                  <div
                    className={`
                      flex h-7 w-7 items-center justify-center
                      rounded-full ${styles.bg} ${styles.icon}
                    `}
                  >
                    <ArrowRight size={14} />
                  </div>
                </div>

                {/* Connector */}
                {index < stages.length - 1 && (
                  <div className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500">
                      <ArrowRight size={15} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssetPurchaseWorkflow;