import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WritingWorkflow = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-gray-50 p-5 dark:bg-gray-950">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/workflow-process")}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-lg border border-gray-200
              bg-white text-gray-500
              transition-colors
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
              Writing Workflow
            </h1>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Configure the Writing Type workflow.
            </p>
          </div>
        </div>

        {/* Content */}
        <div
          className="
            rounded-xl border border-gray-200
            bg-white p-6 shadow-sm
            dark:border-gray-700
            dark:bg-gray-900
          "
        >
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Writing Type
          </h2>
        </div>
      </div>
    </div>
  );
};

export default WritingWorkflow;