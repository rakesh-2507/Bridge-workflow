import {
    useEffect,
    useState,
} from "react";

import {
    Loader2,
} from "lucide-react";

import { useParams } from "react-router-dom";

import AssetPurchaseQuoteForm from "../../components/asset-purchase/AssetPurchaseQuoteForm";
import { getTask } from "../../api/tasks";

function AssetPurchaseQuote() {
    const { taskId } =
        useParams<{ taskId: string }>();

    const numericTaskId = Number(taskId);

    const [documentNo, setDocumentNo] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        const loadTask = async () => {
            if (
                !taskId ||
                Number.isNaN(numericTaskId)
            ) {
                setError(
                    "Invalid asset purchase task ID."
                );
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError("");

                const response =
                    await getTask(numericTaskId);

                const fetchedDocumentNo =
                    response.data?.document_no;

                if (!fetchedDocumentNo) {
                    throw new Error(
                        "Document number was not found for this task."
                    );
                }

                setDocumentNo(
                    fetchedDocumentNo
                );
            } catch (err) {
                console.error(
                    "Failed to load asset purchase task:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load asset purchase task."
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadTask();
    }, [taskId, numericTaskId]);

    if (
        !taskId ||
        Number.isNaN(numericTaskId)
    ) {
        return (
            <div className="min-h-full bg-gray-50 p-6 dark:bg-gray-900">
                <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                    Invalid asset purchase task ID.
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex min-h-full items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Loader2
                        size={20}
                        className="animate-spin"
                    />
                    Loading task...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-full bg-gray-50 p-6 dark:bg-gray-900">
                <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 p-6 dark:bg-gray-900">
            <div className="mx-auto max-w-4xl">
                <AssetPurchaseQuoteForm
                    taskId={numericTaskId}
                    documentNo={documentNo}
                    onSuccess={(responses) => {
                        console.log(
                            "Vendor quotes created:",
                            responses
                        );
                    }}
                />
            </div>
        </div>
    );
}

export default AssetPurchaseQuote;