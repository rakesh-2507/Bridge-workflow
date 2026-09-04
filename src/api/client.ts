const API_BASE_URL =
    "https://bridgeworkflow.sidpz.com";

// --------------------------------------------------
// Error Message
// --------------------------------------------------

function getErrorMessage(
    data: unknown,
): string {
    if (typeof data === "string") {
        return data;
    }

    if (
        !data ||
        typeof data !== "object"
    ) {
        return "Something went wrong";
    }

    const errorData =
        data as Record<
            string,
            unknown
        >;

    // Simple message
    if (
        typeof errorData.message ===
        "string"
    ) {
        return errorData.message;
    }

    // Error
    if (
        typeof errorData.error ===
        "string"
    ) {
        return errorData.error;
    }

    // FastAPI detail
    if (
        typeof errorData.detail ===
        "string"
    ) {
        return errorData.detail;
    }

    // FastAPI / Pydantic validation errors
    if (
        Array.isArray(
            errorData.detail,
        )
    ) {
        return errorData.detail
            .map((item) => {
                if (
                    item &&
                    typeof item ===
                        "object"
                ) {
                    const validationError =
                        item as Record<
                            string,
                            unknown
                        >;

                    const location =
                        Array.isArray(
                            validationError.loc,
                        )
                            ? validationError.loc.join(
                                  ".",
                              )
                            : "";

                    const message =
                        typeof validationError.msg ===
                        "string"
                            ? validationError.msg
                            : "Validation error";

                    return location
                        ? `${location}: ${message}`
                        : message;
                }

                return String(item);
            })
            .join(", ");
    }

    // Fallback
    try {
        return JSON.stringify(
            data,
        );
    } catch {
        return "Something went wrong";
    }
}

// --------------------------------------------------
// Clear Authentication
// --------------------------------------------------

export function clearAuthentication(): void {
    localStorage.removeItem(
        "access_token",
    );

    localStorage.removeItem(
        "login_type",
    );

    localStorage.removeItem(
        "login_user",
    );
}
// --------------------------------------------------
// Build Request Headers
// --------------------------------------------------

function createHeaders(
    options: RequestInit,
    accessToken: string | null,
): Headers {
    const headers =
        new Headers(
            options.headers,
        );

    const isFormData =
        options.body instanceof
        FormData;

    // ----------------------------------------------
    // Content-Type
    // ----------------------------------------------

    if (isFormData) {
        /*
         * IMPORTANT:
         *
         * Never manually set Content-Type
         * for FormData.
         *
         * Browser automatically adds:
         *
         * multipart/form-data;
         * boundary=...
         */

        headers.delete(
            "Content-Type",
        );
    } else {
        headers.set(
            "Content-Type",
            "application/json",
        );
    }

    // ----------------------------------------------
    // Authorization
    // ----------------------------------------------

    if (accessToken) {
        headers.set(
            "Authorization",
            `Bearer ${accessToken}`,
        );
    } else {
        headers.delete(
            "Authorization",
        );
    }

    return headers;
}

// --------------------------------------------------
// Read Response
// --------------------------------------------------

async function readResponse(
    response: Response,
): Promise<unknown> {
    const contentType =
        response.headers.get(
            "content-type",
        );

    if (
        contentType?.includes(
            "application/json",
        )
    ) {
        return response.json();
    }

    return response.text();
}

// --------------------------------------------------
// API Request
// --------------------------------------------------

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const accessToken =
        localStorage.getItem(
            "access_token",
        );

    // ----------------------------------------------
    // Request
    // ----------------------------------------------

    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,

                headers:
                    createHeaders(
                        options,
                        accessToken,
                    ),
            },
        );

    // ----------------------------------------------
    // Read response
    // ----------------------------------------------

    const data =
        await readResponse(
            response,
        );

    // ----------------------------------------------
    // Unauthorized
    // ----------------------------------------------

    if (
        response.status === 401
    ) {
        console.error(
            "Authentication failed:",
            {
                endpoint,
                status:
                    response.status,
                hasAccessToken:
                    Boolean(
                        accessToken,
                    ),
            },
        );

        /*
         * Do not automatically redirect.
         *
         * Do not attempt refresh-token
         * because this authentication
         * system currently doesn't provide
         * a refresh token.
         */

        throw new Error(
            "Authentication failed. Please login again.",
        );
    }

    // ----------------------------------------------
    // Other API errors
    // ----------------------------------------------

    if (!response.ok) {
        const message =
            getErrorMessage(
                data,
            );

        console.error(
            `API Error ${response.status}:`,
            {
                endpoint,
                status:
                    response.status,
                response: data,
            },
        );

        throw new Error(
            message,
        );
    }

    // ----------------------------------------------
    // Success
    // ----------------------------------------------

    return data as T;
}