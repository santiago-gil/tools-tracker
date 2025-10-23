import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toolsApi } from '../lib/api';
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
      queryClient.invalidateQueries({ queryKey: ['tools'] });
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
    mutationFn: ({ id, tool }: { id: string; tool: Partial<Tool> }) =>
      toolsApi.update(id, tool),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
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
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
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
  });
}
