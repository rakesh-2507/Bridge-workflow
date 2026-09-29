const API_BASE_URL = "https://bridgeapi.sidpz.com";

interface RefreshResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

function getErrorMessage(data: unknown): string {
    if (typeof data === "string") {
        return data;
    }

    if (!data || typeof data !== "object") {
        return "Something went wrong";
    }

    const errorData = data as Record<string, unknown>;

    if (typeof errorData.message === "string") {
        return errorData.message;
    }

    if (typeof errorData.error === "string") {
        return errorData.error;
    }

    if (typeof errorData.detail === "string") {
        return errorData.detail;
    }

    if (Array.isArray(errorData.detail)) {
        return errorData.detail
            .map((item) => {
                if (
                    item &&
                    typeof item === "object"
                ) {
                    const validationError =
                        item as Record<string, unknown>;

                    const location =
                        Array.isArray(
                            validationError.loc
                        )
                            ? validationError.loc.join(".")
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

    try {
        return JSON.stringify(data);
    } catch {
        return "Something went wrong";
    }
}

async function refreshAccessToken(): Promise<string> {
    const refreshToken =
        localStorage.getItem("refresh_token");

    if (!refreshToken) {
        throw new Error(
            "No refresh token available"
        );
    }

    const response = await fetch(
        `${API_BASE_URL}/api/refresh-token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refresh_token: refreshToken,
            }),
        }
    );

    const contentType =
        response.headers.get("content-type");

    const data: unknown =
        contentType?.includes("application/json")
            ? await response.json()
            : await response.text();

    if (!response.ok) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_type");

        throw new Error(
            getErrorMessage(data) ||
                "Session expired"
        );
    }

    const tokenData =
        data as RefreshResponse;

    localStorage.setItem(
        "access_token",
        tokenData.access_token
    );

    localStorage.setItem(
        "refresh_token",
        tokenData.refresh_token
    );

    localStorage.setItem(
        "token_type",
        tokenData.token_type
    );

    return tokenData.access_token;
}

export interface ApiRequestOptions
    extends RequestInit {
    responseType?: "json" | "blob" | "text";
}

export async function apiRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {},
    retry = true
): Promise<T> {
    let accessToken =
        localStorage.getItem("access_token");

    const {
        responseType = "json",
        ...fetchOptions
    } = options;

    const isFormData =
        fetchOptions.body instanceof FormData;

    const headers: HeadersInit = {
        ...(isFormData
            ? {}
            : {
                  "Content-Type":
                      "application/json",
              }),

        ...(accessToken
            ? {
                  Authorization:
                      `Bearer ${accessToken}`,
              }
            : {}),

        ...fetchOptions.headers,
    };

    let response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...fetchOptions,
            headers,
        }
    );

    if (
        response.status === 401 &&
        retry
    ) {
        try {
            accessToken =
                await refreshAccessToken();

            const retryHeaders: HeadersInit = {
                ...(isFormData
                    ? {}
                    : {
                          "Content-Type":
                              "application/json",
                      }),

                Authorization:
                    `Bearer ${accessToken}`,

                ...fetchOptions.headers,
            };

            response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...fetchOptions,
                    headers: retryHeaders,
                }
            );
        } catch {
            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            localStorage.removeItem(
                "token_type"
            );

            window.location.href =
                "/login";

            throw new Error(
                "Session expired. Please login again."
            );
        }
    }

    if (!response.ok) {
        const contentType =
            response.headers.get(
                "content-type"
            );

        let errorData: unknown;

        if (
            contentType?.includes(
                "application/json"
            )
        ) {
            errorData =
                await response.json();
        } else {
            errorData =
                await response.text();
        }

        const message =
            getErrorMessage(errorData);

        console.error(
            `API Error ${response.status}:`,
            {
                endpoint,
                status: response.status,
                response: errorData,
            }
        );

        throw new Error(message);
    }

    if (responseType === "blob") {
        return (await response.blob()) as T;
    }

    if (responseType === "text") {
        return (await response.text()) as T;
    }

    const contentType =
        response.headers.get(
            "content-type"
        );

    if (
        contentType?.includes(
            "application/json"
        )
    ) {
        return (await response.json()) as T;
    }

    return (await response.text()) as T;
}