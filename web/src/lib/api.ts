import { auth } from './firebase';
import type {
  Tool,
  User,
  ToolsResponse,
  SingleToolResponse,
  SingleUserResponse,
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

/**
 * Extracts an error message from API error data using a fallback chain.
 * Tries multiple strategies to get the most informative error message.
 */
function extractErrorMessage(errorData: unknown, response: Response): string {
  // Try direct error property
  let errorMessage = (errorData && typeof errorData === 'object' && 'error' in errorData)
    ? (errorData as { error?: string }).error
    : undefined;

  // Try validation errors array
  if (!errorMessage && errorData && typeof errorData === 'object' && 'errors' in errorData) {
    const errors = (errorData as { errors?: unknown[] }).errors;
    if (Array.isArray(errors)) {
      // Get the most relevant error message (usually the first one)
      const firstError = errors[0];
      if (firstError && typeof firstError === 'object') {
        if ('message' in firstError && typeof firstError.message === 'string') {
          errorMessage = firstError.message;
        } else if ('path' in firstError) {
          const path = (firstError as { path?: unknown }).path;
          let field: string;

          if (Array.isArray(path)) {
            // Check if all elements are string or number
            if (path.every(elem => typeof elem === 'string' || typeof elem === 'number')) {
              field = path.join('.');
            } else {
              // Try to safely represent the array
              try {
                field = JSON.stringify(path);
              } catch {
                field = String(path);
              }
            }
          } else if (typeof path === 'string') {
            field = path;
          } else {
            // For objects or other types, produce a safe representation
            try {
              field = JSON.stringify(path);
            } catch {
              field = path !== null && path !== undefined ? String(path) : 'unknown';
            }
          }

          errorMessage = `Validation failed on ${field}`;
        }
      }
    }
  }

  // Fallback to generic message
  return errorMessage || `HTTP ${response.status}: ${response.statusText}`;
}


async function getAuthToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    // Get token with optional force refresh
    const token = await user.getIdToken(forceRefresh);

    // Check if token is close to expiration (within 5 minutes)
    // Validate JWT token structure before parsing
    if (!token || typeof token !== 'string') {
      console.warn('Invalid token: not a non-empty string');
      return null;
    }

    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('Invalid token: does not have 3 parts');
      return null;
    }

    const payloadSegment = tokenParts[1];
    if (!payloadSegment || payloadSegment.length === 0) {
      console.warn('Invalid token: payload segment is empty');
      return null;
    }

    let tokenPayload;
    try {
      // Convert base64url to standard base64
      let base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding to make length a multiple of 4
      while (base64.length % 4) {
        base64 += '=';
      }
      tokenPayload = JSON.parse(atob(base64));
    } catch (error) {
      console.warn('Failed to parse token payload:', error);
      return null;
    }

    const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // If token expires within 5 minutes, refresh it
    if (timeUntilExpiry < 5 * 60 * 1000) {
      console.debug('Token expires soon, refreshing...');
      return await user.getIdToken(true);
    }

    return token;
  } catch (error) {
    console.warn('Failed to get auth token:', error);
    return null;
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}, retryCount = 0, forceTokenRefresh = false): Promise<T> {
  const maxRetries = 2;
  const token = await getAuthToken(forceTokenRefresh);

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

  try {
    const url = `/api${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle rate limiting (429) - don't retry, respect the lockout
      if (response.status === 429) {
        const retryAfter = errorData.retryAfter || response.headers.get('retry-after');
        const message = retryAfter
          ? `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
          : 'Rate limit exceeded. Please wait before trying again.';

        throw new ApiError(
          response.status,
          message,
        );
      }

      // Don't retry on client errors (4xx) except for auth errors
      if (response.status >= 400 && response.status < 500) {
        // Only retry auth errors (401/403) with fresh token
        if ((response.status === 401 || response.status === 403) && retryCount < maxRetries) {
          console.debug(`Auth error ${response.status}, retrying with fresh token...`);
          return fetchApi<T>(endpoint, options, retryCount + 1, true);
        }

        throw new ApiError(
          response.status,
          extractErrorMessage(errorData, response),
        );
      }

      // For server errors (5xx), we can retry
      if (response.status >= 500 && retryCount < maxRetries) {
        console.debug(`Server error ${response.status}, retrying... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchApi<T>(endpoint, options, retryCount + 1, false);
      }

      throw new ApiError(
        response.status,
        extractErrorMessage(errorData, response),
      );
    }

    return response.json();
  } catch (error) {
    // Handle network errors vs auth errors
    if (error instanceof ApiError) {
      throw error; // Re-throw API errors as-is
    }

    // Network errors - retry if we haven't exceeded max retries
    if (error instanceof TypeError) {
      if (retryCount < maxRetries) {
        console.debug(`Network error, retrying... (${retryCount + 1}/${maxRetries})`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchApi<T>(endpoint, options, retryCount + 1, false);
      }
      throw new ApiError(0, 'Network error - please check your connection');
    }

    // Log unexpected errors for debugging
    console.error('Unexpected error in fetchApi:', error);
    throw new ApiError(0, `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const toolsApi = {
  getAll: () => fetchApi<ToolsResponse>('/tools'),
  getById: (id: string) => fetchApi<SingleToolResponse>(`/tools/${id}`),
  refresh: () => fetchApi<ToolsResponse>('/tools/refresh'),
  create: (tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>) =>
    fetchApi<CreateToolResponse>('/tools', {
      method: 'POST',
      body: JSON.stringify(tool),
    }),
  update: (id: string, tool: Partial<Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | '_optimisticVersion'>>, expectedVersion?: number) =>
    fetchApi<UpdateToolResponse>(`/tools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tool),
      headers: expectedVersion !== undefined ? { 'x-expected-version': expectedVersion.toString() } : {},
    }),
  delete: (id: string) =>
    fetchApi<DeleteToolResponse>(`/tools/${id}`, { method: 'DELETE' }),
};

export const usersApi = {
  getCurrent: (uid: string) => fetchApi<SingleUserResponse>(`/users/${uid}`),
  getAll: () => fetchApi<UsersResponse>('/users'),
  update: (uid: string, data: Partial<Omit<User, 'uid' | 'createdAt' | 'updatedAt'>>) =>
    fetchApi<SingleUserResponse>(`/users/${uid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (uid: string) =>
    fetchApi<{ success: boolean; message: string }>(`/users/${uid}`, {
      method: 'DELETE',
    }),
};
