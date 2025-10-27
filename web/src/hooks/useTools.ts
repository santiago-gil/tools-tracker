import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toolsApi } from '../lib/api.js';
import type { Tool } from '../types';
import toast from 'react-hot-toast';

export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const { tools } = await toolsApi.getAll();
      return tools;
    },
  });
}

export function useCreateTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>) =>
      toolsApi.create(tool),
    onSuccess: (response) => {
      // Update cache immediately with the new tool from server
      if (response.success && response.tool) {
        queryClient.setQueryData<Tool[]>(['tools'], (oldTools) => {
          // If cache is empty, keep it empty to avoid showing incomplete state
          // (there may be other tools in the database not yet in cache)
          if (!oldTools) return undefined;
          // Append the new tool to the list
          return [...oldTools, response.tool];
        });
      }

      // Note: No immediate invalidateQueries to avoid race condition
      // where background refetch might overwrite the fresh response.tool.
      // React Query will refetch on window focus or other triggers.

      toast.success(response.message || 'Tool created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tool');
    },
  });
}

export function useUpdateTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tool, expectedVersion }: { id: string; tool: Partial<Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | '_optimisticVersion'>>; expectedVersion?: number }) =>
      toolsApi.update(id, tool, expectedVersion),
    onSuccess: (response) => {
      // Update cache immediately with the updated tool from server
      if (response.success && response.tool) {
        queryClient.setQueryData<Tool[]>(['tools'], (oldTools) => {
          // If cache is empty, keep it empty to avoid showing incomplete state
          // (there may be other tools in the database not yet in cache)
          if (!oldTools) return undefined;

          // Check if the tool exists in the array
          const hasExistingTool = oldTools.some((t) => t.id === response.tool.id);

          if (hasExistingTool) {
            // Replace the existing tool
            return oldTools.map((t) => (t.id === response.tool.id ? response.tool : t));
          } else {
            // Tool not in cache (e.g., created in another tab), add it to the list
            return [...oldTools, response.tool];
          }
        });
      }

      // Note: No immediate invalidateQueries to avoid race condition
      // where background refetch might overwrite the fresh response.tool.
      // React Query will refetch on window focus or other triggers.

      toast.success(response.message || 'Tool updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tool');
    },
  });
}

export function useDeleteTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toolsApi.delete(id),
    onSuccess: (response, deletedId) => {
      // Update cache immediately by removing the deleted tool
      if (response.success) {
        queryClient.setQueryData<Tool[]>(['tools'], (oldTools) => {
          if (!oldTools) return undefined;
          // Remove the deleted tool from the list
          return oldTools.filter((t) => t.id !== deletedId);
        });
      }

      // Note: No immediate invalidateQueries to avoid race condition
      // where background refetch might overwrite the fresh tools list.
      // React Query will refetch on window focus or other triggers.

      toast.success(response.message || 'Tool deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete tool');
    },
  });
}

export function useRefreshTools() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toolsApi.refresh(),
    onSuccess: (response) => {
      // Update the cache with fresh data
      queryClient.setQueryData(['tools'], response.tools);
      toast.success('Tools refreshed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to refresh tools');
    },
    // Prevent multiple simultaneous refresh requests
    onMutate: () => {
      // Cancel any outgoing refetches
      queryClient.cancelQueries({ queryKey: ['tools'] });
    },
  });
}
