import AssetPurchaseQuoteForm from "../../components/asset-purchase/AssetPurchaseQuoteForm";

interface AssetPurchaseQuoteProps {
    taskId: number;
}

function AssetPurchaseQuote({
    taskId,
}: AssetPurchaseQuoteProps) {
    return (
        <div className="min-h-full bg-gray-50 p-6 dark:bg-gray-900">
            <div className="mx-auto max-w-4xl">
                <AssetPurchaseQuoteForm
                    taskId={taskId}
                    onSuccess={(response) => {
                        console.log(
                            "Vendor quote created:",
                            response
                        );
                    }}
                />
            </div>
        </div>
    );
}

export default AssetPurchaseQuote;