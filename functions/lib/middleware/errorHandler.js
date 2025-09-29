import logger from "../utils/logger/index.js";
/**
 * Global error handler: ensures every error response is JSON,
 * and logs structured error context with pino.
 */
export function errorHandler(err, req, res, _next) {
    // Normalise error
    const status = err?.status && Number.isInteger(err.status)
        ? err.status
        : 500;
    const message = err?.message ||
        "An unknown error occurred. This is the global error handler";
    const errors = err?.errors;
    // Log full context (never crashes if err is not an object)
    logger.error({
        path: req.originalUrl,
        method: req.method,
        status,
        err, // includes stack if present
    }, err?.log || "Express error handler caught error");
    // Respond JSON
    res.status(status).type("application/json").json({
        error: message,
        ...(errors ? { errors } : {}),
    });
}
//# sourceMappingURL=errorHandler.js.map