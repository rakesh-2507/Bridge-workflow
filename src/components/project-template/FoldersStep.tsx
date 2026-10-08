import { useRef, useState } from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import type { ProjectTemplateFolder } from "../../types/projectTemplate";

interface FoldersStepProps {
  folders: ProjectTemplateFolder[];
  setFolders: React.Dispatch<
    React.SetStateAction<ProjectTemplateFolder[]>
  >;
  onBack: () => void;
  onNext: () => void;
}

type ParsedFolder = {
  name: string;
  parentIndex: number | null;
};

function FoldersStep({
  folders,
  setFolders,
  onBack,
  onNext,
}: FoldersStepProps) {
  const [showForm, setShowForm] = useState(false);
  const [validationError, setValidationError] = useState("");

  /*
   * =====================================================
   * FOLDER IMPORT FORM STATE
   * =====================================================
   */

  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [formError, setFormError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /*
   * =====================================================
   * NORMALIZE FOLDER NAME
   * =====================================================
   */

  const normalizeName = (name: string) =>
    name.trim().replace(/\s+/g, " ").toLowerCase();

  /*
   * =====================================================
   * PARSE MARKDOWN
   *
   * # Folder
   * ## Subfolder
   * ### Child
   * =====================================================
   */

  const parseMarkdown = (text: string): ParsedFolder[] => {
    const lines = text.split(/\r?\n/);

    const result: ParsedFolder[] = [];

    const stack: {
      level: number;
      index: number;
    }[] = [];

    lines.forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        return;
      }

      const match = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);

      if (!match) {
        return;
      }

      const level = match[1].length;
      const name = match[2].trim();

      if (!name) {
        return;
      }

      while (
        stack.length > 0 &&
        stack[stack.length - 1].level >= level
      ) {
        stack.pop();
      }

      const parentIndex =
        stack.length > 0
          ? stack[stack.length - 1].index
          : null;

      const index = result.length;

      result.push({
        name,
        parentIndex,
      });

      stack.push({
        level,
        index,
      });
    });

    return result;
  };

  /*
   * =====================================================
   * PARSE PLAIN TEXT
   *
   * Folder
   *     Subfolder
   *         Child
   *
   * Tabs are also supported.
   * =====================================================
   */

  const parsePlainText = (text: string): ParsedFolder[] => {
    const lines = text.split(/\r?\n/);

    const result: ParsedFolder[] = [];

    const stack: {
      indent: number;
      index: number;
    }[] = [];

    lines.forEach((rawLine) => {
      if (!rawLine.trim()) {
        return;
      }

      // Convert tabs to 4 spaces.
      const expandedLine = rawLine.replace(/\t/g, "    ");

      const leadingSpaces =
        expandedLine.match(/^ */)?.[0].length ?? 0;

      const name = expandedLine.trim();

      if (!name) {
        return;
      }

      while (
        stack.length > 0 &&
        stack[stack.length - 1].indent >= leadingSpaces
      ) {
        stack.pop();
      }

      const parentIndex =
        stack.length > 0
          ? stack[stack.length - 1].index
          : null;

      const index = result.length;

      result.push({
        name,
        parentIndex,
      });

      stack.push({
        indent: leadingSpaces,
        index,
      });
    });

    return result;
  };

  /*
   * =====================================================
   * DETECT FORMAT
   * =====================================================
   */

  const parseContent = (
    text: string,
    sourceFileName = ""
  ): ParsedFolder[] => {
    const looksLikeMarkdown =
      /^(#{1,6})\s+.+/m.test(text);

    const isMarkdownFile =
      /\.(md|markdown)$/i.test(sourceFileName);

    if (looksLikeMarkdown || isMarkdownFile) {
      return parseMarkdown(text);
    }

    return parsePlainText(text);
  };

  /*
   * =====================================================
   * VALIDATE IMPORTED FOLDERS
   * =====================================================
   */

  const validateImportedFolders = (
    parsedFolders: ParsedFolder[]
  ): string | null => {
    const namesByParent = new Map<
      string,
      Set<string>
    >();

    // Include existing folders.
    folders.forEach((folder) => {
      const parentKey =
        folder.parentFolderId ?? "ROOT";

      if (!namesByParent.has(parentKey)) {
        namesByParent.set(
          parentKey,
          new Set()
        );
      }

      namesByParent
        .get(parentKey)!
        .add(normalizeName(folder.name));
    });

    const generatedIds: string[] = [];

    for (let i = 0; i < parsedFolders.length; i++) {
      const folder = parsedFolders[i];

      const parentKey =
        folder.parentIndex === null
          ? "ROOT"
          : generatedIds[folder.parentIndex];

      const normalizedName =
        normalizeName(folder.name);

      if (!normalizedName) {
        return `Folder on line ${i + 1} has no name.`;
      }

      if (!namesByParent.has(parentKey)) {
        namesByParent.set(
          parentKey,
          new Set()
        );
      }

      const siblings =
        namesByParent.get(parentKey)!;

      if (siblings.has(normalizedName)) {
        return `Duplicate folder "${folder.name}" found at the same level.`;
      }

      siblings.add(normalizedName);

      const generatedId = crypto.randomUUID();

      generatedIds[i] = generatedId;

      if (!namesByParent.has(generatedId)) {
        namesByParent.set(
          generatedId,
          new Set()
        );
      }
    }

    return null;
  };

  /*
   * =====================================================
   * IMPORT FOLDERS
   * =====================================================
   */

  const handleImportFolders = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setFormError("");

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setFormError(
        "Please upload a file or enter a folder structure."
      );
      return;
    }

    const parsed = parseContent(
      trimmedContent,
      fileName
    );

    if (parsed.length === 0) {
      setFormError(
        "No folders could be detected. Use Markdown headings or an indented text structure."
      );
      return;
    }

    const validationError =
      validateImportedFolders(parsed);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const generatedIds: string[] = [];

    const newFolders: ProjectTemplateFolder[] =
      parsed.map((folder) => {
        const id = crypto.randomUUID();

        generatedIds.push(id);

        return {
          id,
          name: folder.name.trim(),
          description: "",
          parentFolderId:
            folder.parentIndex === null
              ? null
              : generatedIds[folder.parentIndex],
          roles: [],
        };
      });

    setFolders((prev) => [
      ...prev,
      ...newFolders,
    ]);

    // Reset form.
    setContent("");
    setFileName("");
    setFormError("");
    setValidationError("");
    setShowForm(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
   * =====================================================
   * FILE UPLOAD
   * =====================================================
   */

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const validFile =
      /\.(txt|md|markdown)$/i.test(file.name);

    if (!validFile) {
      setFormError(
        "Please upload a .txt, .md, or .markdown file."
      );

      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const text =
        typeof reader.result === "string"
          ? reader.result
          : "";

      setContent(text);
      setFileName(file.name);
      setFormError("");
    };

    reader.onerror = () => {
      setFormError(
        "Unable to read the selected file."
      );
    };

    reader.readAsText(file);
  };

  /*
   * =====================================================
   * REMOVE FOLDER
   * =====================================================
   */

  const removeFolder = (id: string) => {
    const hasChildren = folders.some(
      (folder) =>
        folder.parentFolderId === id
    );

    if (hasChildren) {
      setValidationError(
        "This folder contains subfolders. Remove the subfolders first."
      );
      return;
    }

    setFolders((prev) =>
      prev.filter(
        (folder) => folder.id !== id
      )
    );

    setValidationError("");
  };

  /*
   * =====================================================
   * VALIDATE FOLDER TREE
   * =====================================================
   */

  const validateFolders = () => {
    if (folders.length === 0) {
      return "Please add at least one folder.";
    }

    const emptyFolder = folders.find(
      (folder) => !folder.name.trim()
    );

    if (emptyFolder) {
      return "Every folder must have a name.";
    }

    // Check duplicate names at the same level.
    for (let i = 0; i < folders.length; i++) {
      for (let j = i + 1; j < folders.length; j++) {
        const first = folders[i];
        const second = folders[j];

        const sameParent =
          first.parentFolderId ===
          second.parentFolderId;

        const sameName =
          first.name.trim().toLowerCase() ===
          second.name.trim().toLowerCase();

        if (sameParent && sameName) {
          if (first.parentFolderId === null) {
            return `Duplicate root folder: "${first.name}".`;
          }

          const parent = folders.find(
            (folder) =>
              folder.id === first.parentFolderId
          );

          return `Duplicate folder "${first.name}" under "${parent?.name}".`;
        }
      }
    }

    // Check that every parent exists.
    for (const folder of folders) {
      if (folder.parentFolderId) {
        const parentExists = folders.some(
          (item) =>
            item.id === folder.parentFolderId
        );

        if (!parentExists) {
          return `Invalid parent folder for "${folder.name}".`;
        }
      }
    }

    return "";
  };

  /*
   * =====================================================
   * NEXT
   * =====================================================
   */

  const handleNext = () => {
    const error = validateFolders();

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");
    onNext();
  };

  /*
   * =====================================================
   * FOLDER TREE
   * =====================================================
   */

  const renderFolder = (
    folder: ProjectTemplateFolder,
    level = 0
  ) => {
    const children = folders.filter(
      (item) =>
        item.parentFolderId === folder.id
    );

    const hasChildren = children.length > 0;

    return (
      <div
        key={folder.id}
        className="relative"
      >
        {level > 0 && (
          <div className="absolute bottom-0 left-[-18px] top-0 w-px bg-gray-200 dark:bg-gray-700" />
        )}

        <div
          className="group relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700"
          style={{
            marginLeft:
              level > 0
                ? `${level * 32}px`
                : "0px",
          }}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              hasChildren
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {hasChildren ? (
              <FolderOpen size={20} />
            ) : (
              <Folder size={20} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {level > 0 && (
                <ChevronRight
                  size={15}
                  className="shrink-0 text-gray-400"
                />
              )}

              <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {folder.name}
              </h3>
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {hasChildren ? (
                <span>
                  {children.length}{" "}
                  {children.length === 1
                    ? "subfolder"
                    : "subfolders"}
                </span>
              ) : (
                <span>Folder</span>
              )}

              {folder.roles.length > 0 && (
                <>
                  <span>•</span>
                  <span>
                    {folder.roles.length}{" "}
                    {folder.roles.length === 1
                      ? "role"
                      : "roles"}
                  </span>
                </>
              )}
            </div>

            {folder.description && (
              <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">
                {folder.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              removeFolder(folder.id)
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            title={
              hasChildren
                ? "Remove subfolders first"
                : "Remove folder"
            }
          >
            <Trash2 size={17} />
          </button>
        </div>

        {children.length > 0 && (
          <div className="mt-2 space-y-2">
            {children.map((child) =>
              renderFolder(
                child,
                level + 1
              )
            )}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = folders.filter(
    (folder) =>
      folder.parentFolderId === null
  );

  const rootCount = rootFolders.length;

  const subfolderCount =
    folders.length - rootCount;

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Folder Structure
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Import or define the folder structure
            for this project template.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
            <span className="font-semibold text-gray-900 dark:text-white">
              {folders.length}
            </span>{" "}
            <span className="text-gray-500 dark:text-gray-400">
              {folders.length === 1
                ? "folder"
                : "folders"}
            </span>
          </div>

          {subfolderCount > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
              <span className="font-semibold text-gray-900 dark:text-white">
                {subfolderCount}
              </span>{" "}
              <span className="text-gray-500 dark:text-gray-400">
                subfolders
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ERROR */}

      {validationError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/60 dark:bg-red-950/30">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-red-500"
          />

          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Folder validation failed
            </p>

            <p className="mt-0.5 text-sm text-red-600 dark:text-red-400">
              {validationError}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setValidationError("")
            }
            className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* IMPORT FORM */}

      {showForm ? (
        <form
          onSubmit={handleImportFolders}
          className="space-y-5 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800"
        >
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Add Folders
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Upload a Markdown/text file or paste
              your folder structure below.
            </p>
          </div>

          {/* FILE UPLOAD */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload Folder Structure
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              onChange={handleFileChange}
              className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2.5 file:text-sm file:font-medium dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:file:bg-gray-700 dark:file:text-gray-200"
            />

            {fileName && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Selected:{" "}
                <span className="font-medium">
                  {fileName}
                </span>
              </p>
            )}
          </div>

          {/* OR */}

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />

            <span className="text-xs font-medium uppercase text-gray-400">
              or
            </span>

            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* TEXT EDITOR */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Folder Structure
            </label>

            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setFileName("");
                setFormError("");
              }}
              placeholder={`Markdown example:

# Editorial
## Manuscript
### Draft
### Final
## Review
# Publishing
## Distribution

Plain text example:

Editorial
    Manuscript
        Draft
        Final
    Review
Publishing
    Distribution`}
              rows={14}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-mono text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-900"
            />

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Markdown uses <code>#</code> levels.
              Plain text uses spaces or tabs for
              nesting.
            </p>
          </div>

          {/* FORM ERROR */}

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm text-red-600 dark:text-red-400">
                ❌ {formError}
              </p>
            </div>
          )}

          {/* BUTTONS */}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setContent("");
                setFileName("");
                setFormError("");

                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!content.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Folders
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setValidationError("");
            setFormError("");
            setShowForm(true);
          }}
          className="group flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-left transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-blue-600 dark:hover:bg-blue-950/20"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/50 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
            <Plus size={22} />
          </div>

          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">
              Import Folder Structure
            </p>

            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Upload Markdown/text or paste your
              folder hierarchy
            </p>
          </div>

          <ChevronRight
            size={20}
            className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
          />
        </button>
      )}

      {/* FOLDER TREE */}

      {folders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-2 py-6 text-center dark:border-gray-700 dark:bg-gray-800/30">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
            <Folder size={30} />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
            No folders yet
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Import a Markdown or text file to
            automatically create your folder and
            subfolder hierarchy.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Folder Tree
              </p>

              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {rootCount}{" "}
                {rootCount === 1
                  ? "root folder"
                  : "root folders"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setValidationError("");
                setFormError("");
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-600 dark:hover:text-blue-400"
            >
              <Plus size={15} />
              Import More
            </button>
          </div>

          <div className="space-y-2">
            {rootFolders.map((folder) =>
              renderFolder(folder)
            )}
          </div>
        </div>
      )}

      {/* NAVIGATION */}

      <div className="flex items-center justify-between border-t border-gray-200 pt-5 dark:border-gray-700">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={folders.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next: Roles
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

export default FoldersStep;
