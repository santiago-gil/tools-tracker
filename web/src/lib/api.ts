import { auth } from "./firebase";

class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

async function getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
}

async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getAuthToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
            if (typeof value === "string") {
                headers[key] = value;
            }
        });
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            response.status,
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
    }

    return response.json();
}

// Tools API
export const toolsApi = {
    getAll: () => fetchApi<{ tools: any[] }>("/tools"),
    create: (tool: any) =>
        fetchApi("/tools", {
            method: "POST",
            body: JSON.stringify(tool),
        }),
    update: (id: string, tool: any) =>
        fetchApi(`/tools/${id}`, {
            method: "PUT",
            body: JSON.stringify(tool),
        }),
    delete: (id: string) => fetchApi(`/tools/${id}`, { method: "DELETE" }),
};

// Users API
export const usersApi = {
    getCurrent: (uid: string) => fetchApi<{ user: any }>(`/users/${uid}`),
    getAll: () => fetchApi<{ users: any[] }>("/users"),
    update: (uid: string, data: any) =>
        fetchApi(`/users/${uid}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    delete: (uid: string) => fetchApi(`/users/${uid}`, { method: "DELETE" }),
};