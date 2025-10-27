/**
 * OpenAPI documentation for the Tools API
 */

import { createDocument } from 'zod-openapi';
import { z } from 'zod';
import { toolSchema, userSchema, toolVersionSchema } from '../utils/validate.js';

// Response schemas
const ToolResponseSchema = z.object({
    tools: z.array(toolSchema),
});

const SingleToolResponseSchema = z.object({
    tool: toolSchema,
});

const UserResponseSchema = z.object({
    users: z.array(userSchema),
});

const SingleUserResponseSchema = z.object({
    user: userSchema,
});

const SuccessResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    id: z.string().optional(),
    version: z.number().optional(),
});

// Error detail schema based on Zod validation errors
const ErrorDetailSchema = z.object({
    message: z.string(),
    path: z.array(z.union([z.string(), z.number()])).optional(),
    code: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
});

// Export the error detail type for use elsewhere
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

const ErrorResponseSchema = z.object({
    error: z.string(),
    code: z.string().optional(),
    errors: z.array(ErrorDetailSchema).optional(),
    requestId: z.string().optional(),
});

/**
 * Gets the project ID from environment variables
 * @throws {Error} If the project ID is not found in environment variables
 * @returns The project ID
 */
export function getProjectId(): string {
    const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID;

    if (!projectId) {
        throw new Error(
            'Project ID is required but not found in environment variables. ' +
            'Please set either GCLOUD_PROJECT or FIREBASE_PROJECT_ID environment variable. ' +
            'This is required to construct valid API URLs.'
        );
    }

    // Log the project ID for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
        console.log('API Documentation - Project ID:', projectId);
        console.log('Available env vars:', {
            GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
            NODE_ENV: process.env.NODE_ENV
        });
    }

    return projectId;
}

let _apiDocument: ReturnType<typeof createDocument> | null = null;

/**
 * Gets the API document, creating it on first access
 * @throws {Error} If the project ID is not available
 */
function createApiDocument() {
    if (!_apiDocument) {
        const projectId = getProjectId();
        _apiDocument = createDocument({
            openapi: '3.0.0',
            info: {
                title: 'Tools API',
                version: '1.0.0',
                description: 'API for managing tools and users in the Tools Tracker application',
            },
            servers: [
                {
                    url: `https://${projectId}.cloudfunctions.net/api`,
                    description: 'Production server',
                },
                {
                    url: `http://localhost:5001/${projectId}/us-central1/api`,
                    description: 'Local development server',
                },
            ],
            security: [
                {
                    BearerAuth: [],
                },
            ],
            components: {
                securitySchemes: {
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'Firebase ID token',
                    },
                },
                schemas: {
                    Tool: toolSchema,
                    User: userSchema,
                    ToolResponse: ToolResponseSchema,
                    SingleToolResponse: SingleToolResponseSchema,
                    UserResponse: UserResponseSchema,
                    SingleUserResponse: SingleUserResponseSchema,
                    SuccessResponse: SuccessResponseSchema,
                    ErrorResponse: ErrorResponseSchema,
                },
            },
            paths: {
                '/tools': {
                    get: {
                        summary: 'Get all tools',
                        description: 'Retrieve all tools with caching',
                        tags: ['Tools'],
                        security: [{ BearerAuth: [] }],
                        responses: {
                            '200': {
                                description: 'List of tools',
                                content: {
                                    'application/json': {
                                        schema: ToolResponseSchema,
                                    },
                                },
                            },
                            '401': {
                                description: 'Unauthorized',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                        },
                    },
                    post: {
                        summary: 'Create a new tool',
                        description: 'Add a new tool to the system',
                        tags: ['Tools'],
                        security: [{ BearerAuth: [] }],
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: toolSchema,
                                },
                            },
                        },
                        responses: {
                            '201': {
                                description: 'Tool created successfully',
                                content: {
                                    'application/json': {
                                        schema: SuccessResponseSchema,
                                    },
                                },
                            },
                            '400': {
                                description: 'Validation error',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '401': {
                                description: 'Unauthorized',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '403': {
                                description: 'Insufficient permissions',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                        },
                    },
                },
                '/tools/refresh': {
                    get: {
                        summary: 'Refresh tools cache',
                        description: 'Force refresh the tools cache (rate limited)',
                        tags: ['Tools'],
                        security: [{ BearerAuth: [] }],
                        responses: {
                            '200': {
                                description: 'Cache refreshed successfully',
                                content: {
                                    'application/json': {
                                        schema: ToolResponseSchema.extend({
                                            message: z.string(),
                                        }),
                                    },
                                },
                            },
                            '429': {
                                description: 'Rate limit exceeded',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                        },
                    },
                },
                '/tools/slug/{slug}': {
                    get: {
                        summary: 'Find tool by slug',
                        description: 'Lookup a tool and version by URL-friendly slug (format: tool-name--version-name)',
                        tags: ['Tools'],
                        security: [{ BearerAuth: [] }],
                        parameters: [
                            {
                                name: 'slug',
                                in: 'path',
                                required: true,
                                schema: {
                                    type: 'string',
                                },
                                description: 'URL-friendly slug (e.g., "google-analytics--ga4")',
                            },
                        ],
                        responses: {
                            '200': {
                                description: 'Tool and version found',
                                content: {
                                    'application/json': {
                                        schema: z.object({
                                            success: z.boolean(),
                                            tool: toolSchema,
                                            version: toolVersionSchema,
                                        }),
                                    },
                                },
                            },
                            '404': {
                                description: 'Tool not found',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '400': {
                                description: 'Invalid slug format',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                        },
                    },
                },
                '/tools/{id}': {
                    get: {
                        summary: 'Get tool by ID',
                        description: 'Retrieve a single tool by its ID (always fresh, bypasses cache for individual tool)',
                        tags: ['Tools'],
                        security: [{ BearerAuth: [] }],
                        parameters: [
                            {
                                name: 'id',
                                in: 'path',
                                required: true,
                                schema: {
                                    type: 'string',
                                },
                                description: 'Tool ID (UUID)',
                            },
                        ],
                        responses: {
                            '200': {
                                description: 'Tool found',
                                content: {
                                    'application/json': {
                                        schema: z.object({
                                            success: z.boolean(),
                                            tool: toolSchema,
                                        }),
                                    },
                                },
                            },
                            '401': {
                                description: 'Unauthorized',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '404': {
                                description: 'Tool not found',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                        },
                    },
                    put: {
                        summary: 'Update a tool',
                        description: 'Update an existing tool with optimistic locking',
                        tags: ['Tools'],
                        security: [{ BearerAuth: [] }],
                        parameters: [
                            {
                                name: 'id',
                                in: 'path',
                                required: true,
                                schema: {
                                    type: 'string',
                                },
                            },
                            {
                                name: 'x-expected-version',
                                in: 'header',
                                required: false,
                                schema: {
                                    type: 'integer',
                                    format: 'int32',
                                },
                                description: 'Expected version for optimistic locking',
                            },
                        ],
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: toolSchema,
                                },
                            },
                        },
                        responses: {
                            '200': {
                                description: 'Tool updated successfully',
                                content: {
                                    'application/json': {
                                        schema: SuccessResponseSchema,
                                    },
                                },
                            },
                            '409': {
                                description: 'Optimistic lock conflict',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema.extend({
                                            code: z.literal('OPTIMISTIC_LOCK_CONFLICT'),
                                            currentVersion: z.number(),
                                        }),
                                    },
                                },
                            },
                        },
                    },
                    delete: {
                        summary: 'Delete a tool',
                        description: 'Remove a tool from the system',
                        tags: ['Tools'],
                        security: [{ BearerAuth: [] }],
                        parameters: [
                            {
                                name: 'id',
                                in: 'path',
                                required: true,
                                schema: {
                                    type: 'string',
                                },
                            },
                        ],
                        responses: {
                            '200': {
                                description: 'Tool deleted successfully',
                                content: {
                                    'application/json': {
                                        schema: SuccessResponseSchema,
                                    },
                                },
                            },
                            '401': {
                                description: 'Unauthorized',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '403': {
                                description: 'Insufficient permissions',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '404': {
                                description: 'Tool not found',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                        },
                    },
                },
                '/users': {
                    get: {
                        summary: 'Get all users',
                        description: 'Admin-only: List all users',
                        tags: ['Users'],
                        security: [{ BearerAuth: [] }],
                        responses: {
                            '200': {
                                description: 'List of users',
                                content: {
                                    'application/json': {
                                        schema: UserResponseSchema,
                                    },
                                },
                            },
                            '401': {
                                description: 'Unauthorized',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '403': {
                                description: 'Insufficient permissions',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                        },
                    },
                },
                '/users/{uid}': {
                    get: {
                        summary: 'Get user by UID',
                        description: 'Get user details by UID (admins can access any user, others only their own)',
                        tags: ['Users'],
                        security: [{ BearerAuth: [] }],
                        parameters: [
                            {
                                name: 'uid',
                                in: 'path',
                                required: true,
                                schema: {
                                    type: 'string',
                                },
                            },
                        ],
                        responses: {
                            '200': {
                                description: 'User details',
                                content: {
                                    'application/json': {
                                        schema: SingleUserResponseSchema,
                                    },
                                },
                            },
                            '404': {
                                description: 'User not found',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '401': {
                                description: 'Unauthorized',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '403': {
                                description: 'Insufficient permissions',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                        },
                    },
                    put: {
                        summary: 'Update user',
                        description: 'Admin-only: Update user role and permissions',
                        tags: ['Users'],
                        security: [{ BearerAuth: [] }],
                        parameters: [
                            {
                                name: 'uid',
                                in: 'path',
                                required: true,
                                schema: {
                                    type: 'string',
                                },
                            },
                        ],
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: userSchema.partial(),
                                },
                            },
                        },
                        responses: {
                            '200': {
                                description: 'User updated successfully',
                                content: {
                                    'application/json': {
                                        schema: SingleUserResponseSchema,
                                    },
                                },
                            },
                            '401': {
                                description: 'Unauthorized',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '403': {
                                description: 'Insufficient permissions',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '404': {
                                description: 'User not found',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                        },
                    },
                    delete: {
                        summary: 'Delete user',
                        description: 'Admin-only: Delete user from system',
                        tags: ['Users'],
                        security: [{ BearerAuth: [] }],
                        parameters: [
                            {
                                name: 'uid',
                                in: 'path',
                                required: true,
                                schema: {
                                    type: 'string',
                                },
                            },
                        ],
                        responses: {
                            '200': {
                                description: 'User deleted successfully',
                                content: {
                                    'application/json': {
                                        schema: SuccessResponseSchema,
                                    },
                                },
                            },
                            '401': {
                                description: 'Unauthorized',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '403': {
                                description: 'Insufficient permissions',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                            '404': {
                                description: 'User not found',
                                content: {
                                    'application/json': {
                                        schema: ErrorResponseSchema,
                                    },
                                },
                            },
                        },
                    },
                },
                '/healthcheck': {
                    get: {
                        summary: 'Health check',
                        description: 'Basic health check endpoint',
                        tags: ['System'],
                        responses: {
                            '200': {
                                description: 'Service is healthy',
                                content: {
                                    'application/json': {
                                        schema: z.object({
                                            status: z.string(),
                                            timestamp: z.string(),
                                            version: z.string(),
                                        }),
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    return _apiDocument;
}

/**
 * Gets the API document
 * @throws {Error} If the project ID is not available
 */
export function getApiDocument() {
    return createApiDocument();
}

// Export apiDocument as a getter for backward compatibility
export const apiDocument = new Proxy({} as ReturnType<typeof createDocument>, {
    get(target, prop): unknown {
        return createApiDocument()[prop as keyof ReturnType<typeof createDocument>];
    },
    ownKeys(): (string | symbol)[] {
        return Reflect.ownKeys(createApiDocument());
    },
    getOwnPropertyDescriptor(target, prop): PropertyDescriptor | undefined {
        return Reflect.getOwnPropertyDescriptor(createApiDocument(), prop);
    },
    has(target, prop): boolean {
        return Reflect.has(createApiDocument(), prop);
    },
    getPrototypeOf(): object | null {
        return Reflect.getPrototypeOf(createApiDocument());
    }
});
