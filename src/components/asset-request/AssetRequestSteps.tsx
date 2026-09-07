interface AssetRequestStepsProps {
    currentStep: 1 | 2;
}

function AssetRequestSteps({
    currentStep,
}: AssetRequestStepsProps) {
    return (
        <div className="mb-8">

            <div className="flex items-center">

                {/* Step 1 */}
                <div className="flex items-center">

                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                            currentStep >= 1
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-500 dark:bg-gray-800"
                        }`}
                    >
                        1
                    </div>

                    <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Asset Request
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Request details
                        </div>
                    </div>

                </div>

                {/* Line */}
                <div
                    className={`mx-6 h-px flex-1 ${
                        currentStep >= 2
                            ? "bg-blue-600"
                            : "bg-gray-200 dark:bg-gray-800"
                    }`}
                />

                {/* Step 2 */}
                <div className="flex items-center">

                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                            currentStep >= 2
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-500 dark:bg-gray-800"
                        }`}
                    >
                        2
                    </div>

                    <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Assign User
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Create task
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default AssetRequestSteps;