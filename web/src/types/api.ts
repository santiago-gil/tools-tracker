export interface ApiErrorResponse {
    error: string; // human message
    errors?: unknown; // optional 
}

export class ApiError extends Error {
    status: number;
    details?: unknown;

    constructor(status: number, message: string, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}