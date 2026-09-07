import { useState } from "react";

import {
    CheckCircle2,
    Package,
} from "lucide-react";

import AssetRequestSteps from "../../components/asset-request/AssetRequestSteps";
import AssetRequestForm from "../../components/asset-request/AssetRequestForm";
import AssignAssetRequest from "../../components/asset-request/AssignAssetRequest";

import type {
    AssetPurchaseRequest,
} from "../../types/document";

function CreateAssetRequest() {

    /*
     * Current wizard step.
     */
    const [step, setStep] =
        useState<1 | 2>(1);

    /*
     * Document number created in Step 1.
     */
    const [documentNo, setDocumentNo] =
        useState<string | null>(null);

    /*
     * Completion state.
     */
    const [isCompleted, setIsCompleted] =
        useState(false);

    /*
     * Keep Step 1 form data in the parent.
     *
     * This prevents the data from disappearing
     * when Step 1 is unmounted and Step 2 is shown.
     */
    const [formData, setFormData] =
        useState<AssetPurchaseRequest>({
            asset: "",
            asset_type: "",
            asset_description: "",
            required_date: "",
            purchase_reason: "",
        });

    /*
     * Called after Step 1 successfully
     * creates the AssetPurchaseRequest document.
     */
    function handleRequestCreated(
        createdDocumentNo: string
    ) {

        setDocumentNo(
            createdDocumentNo
        );

        setStep(2);
    }

    /*
     * Called after Step 2 successfully
     * creates the asset purchase task.
     */
    function handleTaskCreated() {

        setIsCompleted(true);
    }

    /*
     * Go back from Step 2 to Step 1.
     *
     * formData remains untouched.
     */
    function handleBack() {

        setStep(1);
    }

    /*
     * Reset the complete wizard.
     */
    function handleCreateAnother() {

        setStep(1);

        setDocumentNo(null);

        setIsCompleted(false);

        setFormData({
            asset: "",
            asset_type: "",
            asset_description: "",
            required_date: "",
            purchase_reason: "",
        });
    }

    return (
        <div className="max-h-190 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-950 scrollbar-hide">

            <div className="mx-auto max-w-4xl">

                {/* Page header */}
                <div className="mb-7">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Package size={22} />
                        </div>

                        <div>

                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Create Asset Purchase Request
                            </h1>

                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Create an asset request and assign it to a user.
                            </p>

                        </div>

                    </div>

                </div>

                {/* Steps */}
                {!isCompleted && (
                    <AssetRequestSteps
                        currentStep={step}
                    />
                )}

                {/* Step 1 */}
                {!isCompleted && step === 1 && (
                    <AssetRequestForm
                        formData={formData}
                        onDataChange={setFormData}
                        onCreated={
                            handleRequestCreated
                        }
                    />
                )}

                {/* Step 2 */}
                {!isCompleted &&
                    step === 2 &&
                    documentNo && (
                        <AssignAssetRequest
                            documentNo={
                                documentNo
                            }
                            onBack={
                                handleBack
                            }
                            onComplete={
                                handleTaskCreated
                            }
                        />
                    )}

                {/* Completed */}
                {isCompleted && (
                    <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">

                            <CheckCircle2
                                size={30}
                            />

                        </div>

                        <h2 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
                            Asset Request Created
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                            The asset purchase request has been created and assigned successfully.
                        </p>

                        {documentNo && (
                            <div className="mx-auto mt-5 w-fit rounded-lg bg-gray-50 px-5 py-3 dark:bg-gray-800">

                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Request Number
                                </div>

                                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                    {documentNo}
                                </div>

                            </div>
                        )}

                        <button
                            type="button"
                            onClick={
                                handleCreateAnother
                            }
                            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Create Another Request
                        </button>

                    </div>
                )}

            </div>

        </div>
    );
}

export default CreateAssetRequest;