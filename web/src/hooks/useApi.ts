import { useQuery, useMutation } from "@tanstack/react-query";
import type {
    UseQueryOptions,
    UseMutationOptions,
    UseQueryResult,
    UseMutationResult,
} from "@tanstack/react-query";
import { ApiError } from "../types/api";

/**
 * Wraps useQuery, enforcing ApiError as error type.
 */
export function useApiQuery<TData>(
    options: Omit<UseQueryOptions<TData, ApiError>, "queryFn"> & {
        queryFn: () => Promise<TData>;
    }
): UseQueryResult<TData, ApiError> {
    return useQuery<TData, ApiError>(options);
}

/**
 * Wraps useMutation, enforcing ApiError as error type.
 */
export function useApiMutation<TRes, TVariables = void>(
    fn: (vars: TVariables) => Promise<TRes>,
    options?: Omit<UseMutationOptions<TRes, ApiError, TVariables>, "mutationFn">
): UseMutationResult<TRes, ApiError, TVariables> {
    return useMutation<TRes, ApiError, TVariables>({
        mutationFn: fn,
        ...options,
    });
}