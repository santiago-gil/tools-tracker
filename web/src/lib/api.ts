import { auth } from './firebase';
import type {
  Tool,
  User,
  ToolsResponse,
  UserResponse,
  UsersResponse,
  CreateToolResponse,
  UpdateToolResponse,
  DeleteToolResponse,
} from '../types';

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}

export const toolsApi = {
  getAll: () => fetchApi<ToolsResponse>('/tools'),
  refresh: () => fetchApi<ToolsResponse>('/tools/refresh'),
  create: (tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>) =>
    fetchApi<CreateToolResponse>('/tools', {
      method: 'POST',
      body: JSON.stringify(tool),
    }),
  update: (id: string, tool: Partial<Tool>) =>
    fetchApi<UpdateToolResponse>(`/tools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tool),
    }),
  delete: (id: string) =>
    fetchApi<DeleteToolResponse>(`/tools/${id}`, { method: 'DELETE' }),
};

export const usersApi = {
  getCurrent: (uid: string) => fetchApi<UserResponse>(`/users/${uid}`),
  getAll: () => fetchApi<UsersResponse>('/users'),
  update: (uid: string, data: Partial<User>) =>
    fetchApi<UserResponse>(`/users/${uid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (uid: string) =>
    fetchApi<{ success: boolean; message: string }>(`/users/${uid}`, {
      method: 'DELETE',
    }),
};
