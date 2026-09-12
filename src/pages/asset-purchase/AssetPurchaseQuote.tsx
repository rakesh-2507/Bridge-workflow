import { useParams } from "react-router-dom";

import AssetPurchaseQuoteForm from "../../components/asset-purchase/AssetPurchaseQuoteForm";

function AssetPurchaseQuote() {
    const { taskId } = useParams<{ taskId: string }>();

    const numericTaskId = Number(taskId);

    if (!taskId || Number.isNaN(numericTaskId)) {
        return (
            <div className="min-h-full bg-gray-50 p-6 dark:bg-gray-900">
                <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                    Invalid asset purchase task ID.
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 p-6 dark:bg-gray-900">
            <div className="mx-auto max-w-4xl">
                <AssetPurchaseQuoteForm
                    taskId={numericTaskId}
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