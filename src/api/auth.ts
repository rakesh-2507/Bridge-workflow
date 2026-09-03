import { apiRequest } from "./client";

// --------------------------------------------------
// Types
// --------------------------------------------------

export interface LoginCredentials {
    loginname: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: Record<string, unknown>;
}

export interface GenerateTokenResponse {
    token: string;
}

export interface TokenLoginResponse {
    token: string;
    user: Record<string, unknown>;
}

// --------------------------------------------------
// Normal Login
// POST /api/login
// --------------------------------------------------

export async function login(
    credentials: LoginCredentials
): Promise<LoginResponse> {
    return apiRequest<LoginResponse>(
        "/api/login",
        {
            method: "POST",
            body: JSON.stringify(credentials),
        },
        false
    );
}

// --------------------------------------------------
// Generate Token
// POST /api/token
// --------------------------------------------------

export async function generateToken(
    uid: string
): Promise<GenerateTokenResponse> {
    return apiRequest<GenerateTokenResponse>(
        "/api/token",
        {
            method: "POST",
            body: JSON.stringify({
                uid,
            }),
        },
        false
    );
}

// --------------------------------------------------
// Token Login
// POST /api/token/login
// --------------------------------------------------

export async function tokenLogin(
    token: string
): Promise<TokenLoginResponse> {
    return apiRequest<TokenLoginResponse>(
        "/api/token/login",
        {
            method: "POST",
            body: JSON.stringify({
                token,
            }),
        },
        false
    );
}

// --------------------------------------------------
// JWT Payload
// --------------------------------------------------

export function getJwtPayload(
    token: string
): Record<string, unknown> | null {
    try {
        const parts = token.split(".");

        if (parts.length !== 3) {
            return null;
        }

        const payload = parts[1];

        // Add padding if required
        const paddedPayload =
            payload +
            "=".repeat(
                (4 - (payload.length % 4)) % 4
            );

        const decoded = atob(
            paddedPayload
                .replace(/-/g, "+")
                .replace(/_/g, "/")
        );

        return JSON.parse(decoded);
    } catch (error) {
        console.error(
            "JWT DECODE ERROR:",
            error
        );

        return null;
    }
}

// --------------------------------------------------
// Get Login Type
// --------------------------------------------------

export function getLoginType(
    token: string
): string {
    const payload = getJwtPayload(token);

    if (!payload) {
        return "";
    }

    const loginType =
        payload.login_type ??
        payload.loginType ??
        payload.type ??
        payload.role;

    return typeof loginType === "string"
        ? loginType.trim().toLowerCase()
        : "";
}

// --------------------------------------------------
// Check Admin
// --------------------------------------------------

export function isAdminUser(
    token: string
): boolean {
    const loginType = getLoginType(token);

    return (
        loginType === "admin" ||
        loginType === "sysadmin" ||
        loginType === "administrator"
    );
}