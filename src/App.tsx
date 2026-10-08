import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./components/shared/ProtectedRoute";

import Navbar from "./components/shared/Navbar";
import Sidebar from "./components/shared/Sidebar";
import Footer from "./components/shared/Footer";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import MembersList from "./pages/MembersList";
import FileUploadPage from "./pages/FileUploadPage";

import ProjectTypes from "./pages/ProjectTypes";
import Templates from "./pages/Templates";
import Folders from "./pages/Folders";
import Companies from "./pages/Companies";
import CreateProjectTemplate from "./pages/CreateProjectTemplate";
import ProjectCreation from "./pages/CreateProject";

import TasksPage from "./pages/tasks/TasksPage";
import TodayTasksPage from "./pages/tasks/TodayTasksPage";
import CreateTaskPage from "./pages/tasks/CreateTaskPage";
import EditTaskPage from "./pages/tasks/EditTaskPage";

import WorkflowProcessList from "./pages/workflow-process/WorkflowProcessList";
import CreateProcess from "./pages/workflow-process/CreateProcess";
import ViewProcess from "./pages/workflow-process/ViewProcess";

import EditProjectTemplate from "./pages/EditProjectTemplate";
import MarkdownTemplatePage from "./pages/MarkdownTemplatePage";
import TemplateCreationWizard from "./pages/TemplateCreationWizard";
import CreateProjectWizard from "./components/project-create/CreateProjectWizard";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      darkMode
    );
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC ROUTE
        ========================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =========================
            PROTECTED ROUTES
        ========================== */}

        <Route element={<ProtectedRoute />}>

          <Route
            element={
              <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-white">

                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />

                <div className="flex flex-1">

                  <Sidebar
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                  />

                  <main className="flex-1 bg-gray-50 transition-colors dark:bg-gray-950">
                    <Outlet />
                  </main>

                </div>

                <Footer />

              </div>
            }
          >

            {/* =========================
                HOME
            ========================== */}

            <Route
              path="/"
              element={<Home />}
            />

            {/* =========================
                DASHBOARD
            ========================== */}

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* =========================
                TASKS
            ========================== */}

            <Route
              path="/tasks"
              element={<TasksPage />}
            />

            <Route
              path="/tasks/today"
              element={<TodayTasksPage />}
            />

            <Route
              path="/tasks/create"
              element={<CreateTaskPage />}
            />

            <Route
              path="/tasks/:taskId/edit"
              element={<EditTaskPage />}
            />

            {/* =========================
                FILES
            ========================== */}

            <Route
              path="/files"
              element={<FileUploadPage />}
            />

            {/* =========================
                WORKFLOW PROCESS
            ========================== */}

            <Route
              path="/workflow-process"
              element={<WorkflowProcessList />}
            />

            <Route
              path="/workflow-process/create"
              element={<CreateProcess />}
            />

            <Route
              path="/workflow-process/:id"
              element={<ViewProcess />}
            />

            <Route
              path="/create-template"
              element={<TemplateCreationWizard />}
            />

            {/* =========================
                PROJECT TEMPLATE
            ========================== */}

            <Route
              path="/project-template/:templateId/edit"
              element={<EditProjectTemplate />}
            />

            <Route
              path="/projecttemplate"
              element={<CreateProjectTemplate />}
            />

            {/* =========================
                PROJECTS
            ========================== */}

            <Route
              path="/projects"
              element={<Projects />}
            />

            <Route
              path="/projects/:id"
              element={<ProjectDetails />}
            />

            <Route
              path="/project-create"
              element={<ProjectCreation />}
            />

            <Route
              path="/projects/:id/edit"
              element={<CreateProjectWizard mode="edit" />}
            />

            {/* =========================
                MEMBERS
            ========================== */}

            <Route
              path="/members"
              element={<MembersList />}
            />

            {/* =========================
                PROJECT TYPES
            ========================== */}

            <Route
              path="/project-types"
              element={<ProjectTypes />}
            />

            {/* =========================
                TEMPLATES
            ========================== */}

            <Route
              path="/templates"
              element={<Templates />}
            />

            {/* =========================
                FOLDERS
            ========================== */}

            <Route
              path="/folders"
              element={<Folders />}
            />

            {/* =========================
                COMPANIES
            ========================== */}

            <Route
              path="/companies"
              element={<Companies />}
            />

            <Route
              path="/create-markdown"
              element={<MarkdownTemplatePage />}
            />

          </Route>

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
