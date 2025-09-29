import { apiFetch } from "./client";
import type { Tool } from "../types";

export async function listTools(): Promise<Tool[]> {
    return apiFetch("/tools");
}

export async function createTool(data: Partial<Tool>) {
    return apiFetch<{ id: string }>("/tools", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateTool(id: string, data: Partial<Tool>) {
    return apiFetch(`/tools/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteTool(id: string) {
    return apiFetch(`/tools/${id}`, {
        method: "DELETE",
    });
}