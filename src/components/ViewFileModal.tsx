import { useEffect } from "react";
import { Download, ExternalLink, X } from "lucide-react";

interface ViewFileModalProps {
  open: boolean;
  fileUrl: string | null;
  fileName?: string;
  onClose: () => void;
}

function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split(".").pop()?.toLowerCase() || "";
  } catch {
    return "";
  }
}

function isImageFile(extension: string): boolean {
  return [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp",
    "svg",
  ].includes(extension);
}

function isPdfFile(extension: string): boolean {
  return extension === "pdf";
}

function isTextFile(extension: string): boolean {
  return ["txt", "csv", "json", "xml"].includes(extension);
}

export default function ViewFileModal({
  open,
  fileUrl,
  fileName,
  onClose,
}: ViewFileModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !fileUrl) {
    return null;
  }

  const extension = getFileExtension(fileUrl);

  const displayName =
    fileName ||
    (() => {
      try {
        return decodeURIComponent(
          new URL(fileUrl).pathname.split("/").pop() || "File",
        );
      } catch {
        return "File";
      }
    })();

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={handleBackdropClick}
    >
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {displayName}
            </h3>

            <p className="mt-0.5 text-xs uppercase text-gray-400">
              {extension || "file"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ExternalLink size={14} />
              Open
            </a>

            <a
              href={fileUrl}
              download
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Download size={14} />
              Download
            </a>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="min-h-0 flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
          {isPdfFile(extension) && (
            <iframe
              src={fileUrl}
              title={displayName}
              className="h-full w-full border-0"
            />
          )}

          {isImageFile(extension) && (
            <div className="flex min-h-full items-center justify-center p-6">
              <img
                src={fileUrl}
                alt={displayName}
                className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>
          )}

          {isTextFile(extension) && (
            <iframe
              src={fileUrl}
              title={displayName}
              className="h-full w-full border-0 bg-white"
            />
          )}

          {!isPdfFile(extension) &&
            !isImageFile(extension) &&
            !isTextFile(extension) && (
              <div className="flex h-full items-center justify-center p-8">
                <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                    <Download
                      size={24}
                      className="text-gray-500 dark:text-gray-400"
                    />
                  </div>

                  <h4 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Preview not available
                  </h4>

                  <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    This file type cannot be previewed directly in the
                    browser.
                  </p>

                  <a
                    href={fileUrl}
                    download
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                  >
                    <Download size={14} />
                    Download File
                  </a>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}