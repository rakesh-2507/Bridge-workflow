import { useState } from "react";
import type { SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
    login,
    generateToken,
    tokenLogin,
    getJwtPayload,
    getLoginType,
    isAdminUser,
} from "../api/auth";

function Login() {
    const navigate = useNavigate();

    // --------------------------------------------------
    // Login Mode
    // --------------------------------------------------

    const [loginMode, setLoginMode] = useState<
        "password" | "token"
    >("password");

    // --------------------------------------------------
    // Password Login State
    // --------------------------------------------------

    const [loginname, setLoginname] = useState("");
    const [password, setPassword] = useState("");

    // --------------------------------------------------
    // Token Login State
    // --------------------------------------------------

    const [userId, setUserId] = useState("");
    const [generatedToken, setGeneratedToken] = useState("");
    const [token, setToken] = useState("");
    const [copied, setCopied] = useState(false);

    // --------------------------------------------------
    // Common State
    // --------------------------------------------------

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ==================================================
    // Store Authentication
    // ==================================================

    function storeAuthentication(
        accessToken: string,
        user: {
            uid: number;
            loginname: string;
            firstname?: string;
            lastname?: string;
            email?: string;
            mtype?: string;
        },
    ) {
        // ----------------------------------------------
        // Get login type from JWT first
        // ----------------------------------------------

        let loginType = getLoginType(
            accessToken,
        );

        // ----------------------------------------------
        // JWT may not contain login_type.
        // Fall back to user.mtype from API response.
        // ----------------------------------------------

        if (!loginType && user?.mtype) {
            loginType = user.mtype
                .trim()
                .toLowerCase();
        }

        // ----------------------------------------------
        // Determine admin
        // ----------------------------------------------

        const adminFromJwt =
            isAdminUser(accessToken);

        const adminFromUser =
            loginType === "admin" ||
            loginType === "sysadmin" ||
            loginType === "administrator";

        const admin =
            adminFromJwt ||
            adminFromUser;

        // ----------------------------------------------
        // Debug
        // ----------------------------------------------

        console.log(
            "AUTHENTICATED USER:",
            user,
        );

        console.log(
            "LOGIN TYPE:",
            loginType,
        );

        console.log(
            "IS ADMIN:",
            admin,
        );

        // ----------------------------------------------
        // Store authentication
        // ----------------------------------------------

        localStorage.setItem(
            "access_token",
            accessToken,
        );

        localStorage.setItem(
            "login_type",
            loginType,
        );

        localStorage.setItem(
            "login_user",
            JSON.stringify(user),
        );

        // ----------------------------------------------
        // Remove stale authentication data
        // ----------------------------------------------

        localStorage.removeItem(
            "refresh_token",
        );

        localStorage.removeItem(
            "token_type",
        );

        return {
            loginType,
            admin,
        };
    }

    // ==================================================
    // Clear Authentication
    // ==================================================

    function clearAuthentication() {
        localStorage.removeItem(
            "access_token",
        );

        localStorage.removeItem(
            "login_type",
        );

        localStorage.removeItem(
            "login_user",
        );

        localStorage.removeItem(
            "refresh_token",
        );

        localStorage.removeItem(
            "token_type",
        );
    }

    // ==================================================
    // Password Login
    // ==================================================

    async function handlePasswordLogin(
        e: SubmitEvent<HTMLFormElement>,
    ) {
        e.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // ------------------------------------------
            // Login API
            //
            // Response:
            // {
            //     token: string,
            //     user: {...}
            // }
            // ------------------------------------------

            const response = await login({
                loginname:
                    loginname.trim(),
                password,
            });

            console.log(
                "LOGIN API RESPONSE:",
                response,
            );

            // ------------------------------------------
            // Get access token
            // ------------------------------------------

            const accessToken =
                response?.token;

            if (
                !accessToken ||
                typeof accessToken !==
                    "string"
            ) {
                throw new Error(
                    "Login successful but no valid token was returned.",
                );
            }

            // ------------------------------------------
            // Get user
            // ------------------------------------------

            const user =
                response?.user;

            if (!user) {
                throw new Error(
                    "Login successful but user information was not returned.",
                );
            }

            // ------------------------------------------
            // Decode JWT
            // ------------------------------------------

            const jwtPayload =
                getJwtPayload(
                    accessToken,
                );

            console.log(
                "JWT PAYLOAD:",
                jwtPayload,
            );

            // ------------------------------------------
            // Store authentication
            // ------------------------------------------

            const {
                admin,
                loginType,
            } =
                storeAuthentication(
                    accessToken,
                    user,
                );

            console.log(
                "LOGIN TYPE:",
                loginType,
            );

            console.log(
                "IS ADMIN:",
                admin,
            );

            // ------------------------------------------
            // Redirect
            // ------------------------------------------

            if (admin) {
                navigate("/", {
                    replace: true,
                });
            } else {
                navigate("/tasks", {
                    replace: true,
                });
            }
        } catch (err) {
            console.error(
                "LOGIN ERROR:",
                err,
            );

            clearAuthentication();

            setError(
                err instanceof Error
                    ? err.message
                    : "Invalid login credentials.",
            );
        } finally {
            setLoading(false);
        }
    }

    // ==================================================
    // Generate Token
    // ==================================================

    async function handleGenerateToken() {
        setError("");
        setSuccess("");
        setCopied(false);

        const uidText =
            userId.trim();

        if (!uidText) {
            setError(
                "Please enter a User ID.",
            );
            return;
        }

        const uid =
            Number(uidText);

        if (
            !Number.isInteger(uid) ||
            uid <= 0
        ) {
            setError(
                "User ID must be a valid number.",
            );
            return;
        }

        setLoading(true);

        try {
            // ------------------------------------------
            // Generate token API
            //
            // Response:
            // {
            //     token: string
            // }
            // ------------------------------------------

            const response =
                await generateToken(
                    uid,
                );

            console.log(
                "GENERATE TOKEN RESPONSE:",
                response,
            );

            // ------------------------------------------
            // Get token from response
            // ------------------------------------------

            const generated =
                response?.token;

            if (
                !generated ||
                typeof generated !==
                    "string"
            ) {
                throw new Error(
                    "Token was not returned by the server.",
                );
            }

            // ------------------------------------------
            // Store token in UI
            // ------------------------------------------

            setGeneratedToken(
                generated,
            );

            setToken(
                generated,
            );

            setSuccess(
                "Token generated successfully.",
            );
        } catch (err) {
            console.error(
                "TOKEN GENERATION ERROR:",
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to generate token.",
            );
        } finally {
            setLoading(false);
        }
    }

    // ==================================================
    // Copy Generated Token
    // ==================================================

    async function handleCopyToken() {
        if (!generatedToken) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                generatedToken,
            );

            setCopied(true);
            setError("");

            window.setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (err) {
            console.error(
                "COPY TOKEN ERROR:",
                err,
            );

            setError(
                "Unable to copy token.",
            );
        }
    }

    // ==================================================
    // Token Login
    // ==================================================

    async function handleTokenSubmit(
        e: SubmitEvent<HTMLFormElement>,
    ) {
        e.preventDefault();

        setError("");
        setSuccess("");

        const tokenValue =
            token.trim();

        if (!tokenValue) {
            setError(
                "Please enter a token.",
            );
            return;
        }

        setLoading(true);

        try {
            console.log(
                "TOKEN LOGIN REQUEST:",
                tokenValue,
            );

            // ------------------------------------------
            // Token Login API
            //
            // Response:
            // {
            //     token: string,
            //     user: {...}
            // }
            // ------------------------------------------

            const response =
                await tokenLogin(
                    tokenValue,
                );

            console.log(
                "TOKEN LOGIN RESPONSE:",
                response,
            );

            // ------------------------------------------
            // Get access token
            // ------------------------------------------

            const accessToken =
                response?.token;

            if (
                !accessToken ||
                typeof accessToken !==
                    "string"
            ) {
                throw new Error(
                    "Token login failed. No authentication token returned.",
                );
            }

            // ------------------------------------------
            // Get user
            // ------------------------------------------

            const user =
                response?.user;

            if (!user) {
                throw new Error(
                    "Token login successful but user information was not returned.",
                );
            }

            console.log(
                "AUTHENTICATED ACCESS TOKEN:",
                accessToken,
            );

            // ------------------------------------------
            // Decode JWT
            // ------------------------------------------

            const jwtPayload =
                getJwtPayload(
                    accessToken,
                );

            console.log(
                "TOKEN JWT PAYLOAD:",
                jwtPayload,
            );

            // ------------------------------------------
            // Store authentication
            // ------------------------------------------

            const {
                admin,
                loginType,
            } =
                storeAuthentication(
                    accessToken,
                    user,
                );

            console.log(
                "TOKEN LOGIN TYPE:",
                loginType,
            );

            console.log(
                "TOKEN IS ADMIN:",
                admin,
            );

            // ------------------------------------------
            // Success
            // ------------------------------------------

            setSuccess(
                "Token login successful.",
            );

            // ------------------------------------------
            // Redirect
            // ------------------------------------------

            if (admin) {
                navigate("/", {
                    replace: true,
                });
            } else {
                navigate("/tasks", {
                    replace: true,
                });
            }
        } catch (err) {
            console.error(
                "TOKEN LOGIN ERROR:",
                err,
            );

            clearAuthentication();

            setError(
                err instanceof Error
                    ? err.message
                    : "Invalid token.",
            );
        } finally {
            setLoading(false);
        }
    }

    // ==================================================
    // Switch Login Mode
    // ==================================================

    function switchLoginMode(
        mode: "password" | "token",
    ) {
        setLoginMode(mode);

        setError("");
        setSuccess("");
        setCopied(false);

        if (mode === "password") {
            setGeneratedToken("");
            setToken("");
            setUserId("");
        }
    }

    // ==================================================
    // Render
    // ==================================================

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
            <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900">

                {/* Header */}

                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Bridge
                    </h1>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {loginMode ===
                        "password"
                            ? "Sign in to your account"
                            : "Sign in using a token"}
                    </p>
                </div>

                {/* Login Mode Switch */}

                <div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                    <button
                        type="button"
                        onClick={() =>
                            switchLoginMode(
                                "password",
                            )
                        }
                        disabled={loading}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                            loginMode ===
                            "password"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        }`}
                    >
                        Password Login
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            switchLoginMode(
                                "token",
                            )
                        }
                        disabled={loading}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                            loginMode ===
                            "token"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        }`}
                    >
                        Login with Token
                    </button>
                </div>

                {/* Error */}

                {error && (
                    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* Success */}

                {success && (
                    <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                        {success}
                    </div>
                )}

                {/* ==================================================
                    PASSWORD LOGIN
                   ================================================== */}

                {loginMode ===
                    "password" && (
                    <form
                        onSubmit={
                            handlePasswordLogin
                        }
                        className="space-y-5"
                    >
                        {/* Login Name */}

                        <div>
                            <label
                                htmlFor="loginname"
                                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Login Name
                            </label>

                            <input
                                id="loginname"
                                type="text"
                                value={
                                    loginname
                                }
                                onChange={(
                                    e,
                                ) =>
                                    setLoginname(
                                        e.target
                                            .value,
                                    )
                                }
                                placeholder="Enter your login name"
                                autoComplete="username"
                                required
                                disabled={
                                    loading
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                            />
                        </div>

                        {/* Password */}

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                value={
                                    password
                                }
                                onChange={(
                                    e,
                                ) =>
                                    setPassword(
                                        e.target
                                            .value,
                                    )
                                }
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                                disabled={
                                    loading
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                            />
                        </div>

                        {/* Submit */}

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !loginname.trim() ||
                                !password
                            }
                            className="w-full rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                            {loading
                                ? "Signing in..."
                                : "Sign In"}
                        </button>
                    </form>
                )}

                {/* ==================================================
                    TOKEN LOGIN
                   ================================================== */}

                {loginMode ===
                    "token" && (
                    <form
                        onSubmit={
                            handleTokenSubmit
                        }
                        className="space-y-5"
                    >
                        {/* User ID */}

                        <div>
                            <label
                                htmlFor="userId"
                                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                User ID
                            </label>

                            <input
                                id="userId"
                                type="number"
                                value={
                                    userId
                                }
                                onChange={(
                                    e,
                                ) =>
                                    setUserId(
                                        e.target
                                            .value,
                                    )
                                }
                                placeholder="Enter your user ID"
                                required
                                disabled={
                                    loading
                                }
                                min="1"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                            />

                            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                Enter the user ID
                                for which you
                                want to generate
                                a token.
                            </p>
                        </div>

                        {/* Generate Token */}

                        <button
                            type="button"
                            onClick={
                                handleGenerateToken
                            }
                            disabled={
                                loading ||
                                !userId.trim()
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                        >
                            {loading
                                ? "Generating Token..."
                                : "Generate Token"}
                        </button>

                        {/* Generated Token */}

                        {generatedToken && (
                            <div className="space-y-2">
                                <label
                                    htmlFor="generatedToken"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Generated
                                    Token
                                </label>

                                <div className="flex gap-2">
                                    <input
                                        id="generatedToken"
                                        type="text"
                                        value={
                                            generatedToken
                                        }
                                        readOnly
                                        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                                    />

                                    <button
                                        type="button"
                                        onClick={
                                            handleCopyToken
                                        }
                                        className="shrink-0 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                                    >
                                        {copied
                                            ? "Copied"
                                            : "Copy"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Token */}

                        <div>
                            <label
                                htmlFor="token"
                                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Token
                            </label>

                            <textarea
                                id="token"
                                value={
                                    token
                                }
                                onChange={(
                                    e,
                                ) =>
                                    setToken(
                                        e.target
                                            .value,
                                    )
                                }
                                placeholder="Paste or enter your token"
                                rows={4}
                                required
                                disabled={
                                    loading
                                }
                                spellCheck={
                                    false
                                }
                                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                            />
                        </div>

                        {/* Submit Token */}

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !token.trim()
                            }
                            className="w-full rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                            {loading
                                ? "Signing in..."
                                : "Submit Token"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Login;