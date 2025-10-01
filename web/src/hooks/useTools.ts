import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { toolsApi } from "../lib/api";
import type { Tool } from "../types";
import toast from "react-hot-toast";

export function useTools() {
    return useQuery({
        queryKey: ["tools"],
        queryFn: async () => {
            const { tools } = await toolsApi.getAll();
            return tools;
        },
    });
}

export function useCreateTool() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tool: Omit<Tool, "id">) => toolsApi.create(tool),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tools"] });
            toast.success("Tool created successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create tool");
        },
    });
}

export function useUpdateTool() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, tool }: { id: string; tool: Partial<Tool> }) =>
            toolsApi.update(id, tool),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tools"] });
            toast.success("Tool updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update tool");
        },
    });
}

export function useDeleteTool() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => toolsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tools"] });
            toast.success("Tool deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete tool");
        },
    });
}