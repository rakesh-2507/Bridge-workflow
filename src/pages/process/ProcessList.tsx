import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getProcessList } from "../../api/process";
import type { ProcessListItem } from "../../types/process";
import CreateProcess from "./CreateProcess";

export default function ProcessList() {
  const navigate = useNavigate();

  const [processes, setProcesses] = useState<ProcessListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // ==========================================================
  // LOAD PROCESSES
  // ==========================================================

  const loadProcesses = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await getProcessList();

      setProcesses(response.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load processes",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadInitialProcesses = async () => {
      try {
        setError("");

        const response = await getProcessList();

        if (cancelled) {
          return;
        }

        setProcesses(response.data ?? []);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load processes",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialProcesses();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // PROCESS CREATED
  // ==========================================================

  const handleProcessCreated = async () => {
    setShowCreate(false);

    await loadProcesses(false);
  };

  // ==========================================================
  // VIEW PROCESS
  // ==========================================================

  const handleViewProcess = (processId: number) => {
    navigate(`/workflow-process/diagram/${processId}`);
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString();
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
            <ClipboardList size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Processes
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage and create workflow processes
            </p>
          </div>
        </div>

        {/* ====================================================
            HEADER ACTIONS
        ===================================================== */}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadProcesses(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-600"
          >
            <Plus size={18} />

            Add Process
          </button>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadProcesses(true)}
            className="shrink-0 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================================
          LOADING
      ======================================================= */}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <Loader2
              size={22}
              className="animate-spin"
            />

            Loading processes...
          </div>
        </div>
      ) : processes.length === 0 ? (
        /* ====================================================
           EMPTY STATE
        ===================================================== */

        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
            <ClipboardList size={30} />
          </div>

          <h2 className="text-lg font-semibold">
            No processes found
          </h2>

          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Create your first workflow process to define its
            tasks and workflow configuration.
          </p>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-600"
          >
            <Plus size={18} />

            Create Process
          </button>
        </div>
      ) : (
        /* ====================================================
           PROCESS GRID
        ===================================================== */

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {processes.map((process) => (
            <div
              key={process.Processid}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              {/* ==================================================
                  CARD HEADER
              =================================================== */}

              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                    <ClipboardList size={21} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {process.ProcessName}
                    </h2>

                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {process.DocumentType}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    process.Status === 1
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-slate-500/10 text-slate-500"
                  }`}
                >
                  {process.Status === 1
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              {/* ==================================================
                  DETAILS
              =================================================== */}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Process ID
                  </p>

                  <p className="mt-1 font-semibold">
                    #{process.Processid}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tasks
                  </p>

                  <p className="mt-1 font-semibold">
                    {process.NumberofTasks}
                  </p>
                </div>
              </div>

              {/* ==================================================
                  CREATED DATE
              =================================================== */}

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <CalendarDays size={15} />

                Created {formatDate(process.CreatedDate)}
              </div>

              {/* ==================================================
                  VIEW PROCESS
              =================================================== */}

              <button
                type="button"
                onClick={() =>
                  handleViewProcess(process.Processid)
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Eye size={17} />

                View Process
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================
          CREATE PROCESS MODAL
      ======================================================= */}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            {/* ==================================================
                MODAL HEADER
            =================================================== */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold">
                  Create New Process
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Define the process and its workflow tasks
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* ==================================================
                MODAL BODY
            =================================================== */}

            <div className="overflow-y-auto p-6">
              <CreateProcess
                onCreated={handleProcessCreated}
                onCancel={() => setShowCreate(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}