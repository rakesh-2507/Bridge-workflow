import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectTable from "../components/shared/ProjectTable";
import {
  getProjects,
  type Project,
} from "../api/projects";

function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Load projects
   */
  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        const response = await getProjects();

        if (cancelled) {
          return;
        }

        setProjects(response.projects ?? []);
        setError("");
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Failed to fetch projects:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load projects."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Filter projects
   */
  const filteredProjects = projects.filter((project) =>
    (project.projectname ?? "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /**
   * Retry loading
   */
  const handleRetry = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getProjects();

      setProjects(response.projects ?? []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load projects."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto text-gray-900 dark:text-white">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Projects
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
            Manage and view all your projects.
          </p>
        </div>

        {/* Navigate to Project Creation */}
        <button
          type="button"
          onClick={() => navigate("/project-create")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <span className="text-lg leading-none">
            +
          </span>

          Add Project
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-md">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.05 6.05a7.5 7.5 0 0 0 10.6 10.6Z"
            />
          </svg>

          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
          Loading projects...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <ProjectTable projects={filteredProjects} />
      )}
    </div>
  );
}

export default Projects;