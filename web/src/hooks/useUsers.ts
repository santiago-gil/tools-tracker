import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { usersApi } from "../lib/api";
import toast from "react-hot-toast";

export function useUsers() {
    return useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const { users } = await usersApi.getAll();
            return users;
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ uid, data }: { uid: string; data: any }) =>
            usersApi.update(uid, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update user");
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (uid: string) => usersApi.delete(uid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete user");
        },
    });
}