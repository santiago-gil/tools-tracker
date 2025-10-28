import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toolsApi } from '../lib/api.js';
import type { Tool } from '../types';
import type { CreateToolResponse } from '@shared/schemas';
import toast from 'react-hot-toast';

export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const { tools } = await toolsApi.getAll();
      return tools;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
  });
}

export function useCreateTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>) =>
      toolsApi.create(tool) as Promise<CreateToolResponse>,
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tools'] });
    },
    onSuccess: async (response) => {
      // Update cache immediately with the new tool from server
      if (response.success && response.tool) {
        queryClient.setQueryData<Tool[]>(['tools'], (oldTools) => {
          if (!oldTools) {
            // Initialize cache with the new tool if not already cached
            return [response.tool];
          }

          // Append the new tool to the list
          const updatedTools = [...oldTools, response.tool];
          return updatedTools;
        });
        toast.success(response.message || 'Tool created successfully');
      } else if (response.success && !response.tool) {
        // Server returned success but no tool object - this happens when the API
        // returns just an id instead of the full tool. Refresh the list to get the complete data.
        console.info('Create tool response missing tool object, refreshing list');

        // Invalidate to force refetch from server
        await queryClient.invalidateQueries({ queryKey: ['tools'] });

        toast.success(response.message || 'Tool created successfully');
      } else {
        // Response was not successful
        console.error('Create tool failed:', response);
        toast.error(response.message || 'Failed to create tool');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tool');
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}

export function useUpdateTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tool, expectedVersion }: { id: string; tool: Partial<Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | '_optimisticVersion'>>; expectedVersion?: number }) => {
      return toolsApi.update(id, tool, expectedVersion);
    },
    onMutate: async ({ id, tool }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tools'] });

      // Snapshot previous value for rollback
      const previousTools = queryClient.getQueryData<Tool[]>(['tools']);

      // Optimistically update the cache - only merge the fields that actually changed
      queryClient.setQueryData<Tool[]>(['tools'], (oldTools) => {
        if (!oldTools) return undefined;

        return oldTools.map((t) => {
          if (t.id === id) {
            // Merge only the changed tool data
            return {
              ...t,
              name: tool.name ?? t.name,
              category: tool.category ?? t.category,
              versions: tool.versions ?? t.versions,
              _optimisticVersion: (t._optimisticVersion || 0) + 1,
            };
          }
          return t;
        });
      });

      return { previousTools };
    },
    onSuccess: (response) => {
      // Update cache with the response from server (this will replace optimistic update)
      if (response.success && response.tool) {
        queryClient.setQueryData<Tool[]>(['tools'], (oldTools) => {
          if (!oldTools) return undefined;

          return oldTools.map((t) => (t.id === response.tool.id ? response.tool : t));
        });
      }

      toast.success(response.message || 'Tool updated successfully');
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousTools) {
        queryClient.setQueryData(['tools'], context.previousTools);
      }

      toast.error(error.message || 'Failed to update tool');
    },
  });
}

export function useDeleteTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toolsApi.delete(id),
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tools'] });

      // Snapshot the previous cache
      const previousTools = queryClient.getQueryData<Tool[]>(['tools']);

      // Optimistically remove the tool from cache
      queryClient.setQueryData<Tool[]>(['tools'], (oldTools) => {
        if (!oldTools) return undefined;
        // Remove the deleted tool from the list
        return oldTools.filter((t) => t.id !== id);
      });

      // Return snapshot for potential rollback
      return { previousTools };
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Tool deleted successfully');
    },
    onError: (error: Error, _deletedId, context) => {
      // Rollback on error - restore the previous cache
      if (context?.previousTools !== undefined) {
        try {
          queryClient.setQueryData<Tool[]>(['tools'], context.previousTools);
        } catch (rollbackError) {
          console.error('Failed to rollback cache during delete error:', rollbackError);
          // If rollback fails, invalidate to force refetch
          queryClient.invalidateQueries({ queryKey: ['tools'] });
        }
      }

      toast.error(error.message || 'Failed to delete tool');
    },
    onSettled: () => {
      // Invalidate or refetch to reconcile with server state
      queryClient.invalidateQueries({ queryKey: ['tools'] });
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
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tools'] });
    },
  });
}
