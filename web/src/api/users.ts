import { apiFetch } from "./client";
import type { User } from "../types";

export async function listUsers(): Promise<User[]> {
    return apiFetch("/users");
}

export async function getUserByUid(uid: string): Promise<User> {
    return apiFetch(`/users/${uid}`);
}

export async function updateUser(uid: string, data: Partial<User>) {
    return apiFetch(`/users/${uid}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteUser(uid: string) {
    return apiFetch(`/users/${uid}`, {
        method: "DELETE",
    });
}