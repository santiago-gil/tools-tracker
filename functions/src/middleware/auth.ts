import { getAuth } from "firebase-admin/auth";
import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/http.js";
import { getUserByUid, createUserDoc } from "../services/users.js";
import logger from "../utils/logger/index.js";

/**
 * Verifies Firebase ID token, restricts email domain,
 * ensures the user has a Firestore document, and attaches full user data.
 */
export async function authMiddleware(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
) {
  logger.info({
    path: req.path,
    method: req.method,
    url: req.url,
    hasAuthHeader: !!req.headers.authorization,
    userAgent: req.headers['user-agent']
  }, "Auth middleware called");

  const header = req.headers.authorization ?? "";
  const match = header.match(/^Bearer (.+)$/);

  if (!match) {
    logger.warn({ path: req.path, url: req.url }, "Missing token in request");
    return next({ status: 401, message: "Missing token" });
  }

  try {
    // Don't log auth headers in production
    logger.debug("Auth header received");

    const decoded = await getAuth().verifyIdToken(match[1]);

    logger.info(
      {
        uid: decoded.uid,
        email: decoded.email,
        path: req.path,
        // Don't log sensitive email
        iat: decoded.iat,
        exp: decoded.exp
      },
      "Token verified"
    );

    // Restrict to company emails
    if (typeof decoded.email !== 'string' || !decoded.email.endsWith("@searchkings.ca")) {
      logger.warn({ email: decoded.email, path: req.path }, "Invalid email domain or type");
      return next({ status: 403, message: "Invalid domain" });
    }

    // Get existing user - create if missing (only for authenticated user's own document)
    logger.info({ uid: decoded.uid, path: req.path }, "Fetching user document in auth middleware");
    let userDoc = await getUserByUid(decoded.uid);

    if (!userDoc) {
      logger.warn({ uid: decoded.uid, path: req.path }, "User document not found - auto-creating");

      // Only auto-create for the authenticated user's own document
      // This handles cases where trigger didn't fire (e.g., emulator)
      if (typeof decoded.email === 'string') {
        try {
          logger.info({ uid: decoded.uid }, "Creating user document");
          userDoc = await createUserDoc(
            decoded.uid,
            decoded.email,
            decoded.picture as string | undefined,
            decoded.name as string | undefined
          );
          logger.info({ uid: decoded.uid, role: userDoc.role }, "User document auto-created");
        } catch (createError) {
          // Check if user was created by another request (race condition)
          userDoc = await getUserByUid(decoded.uid);

          if (!userDoc) {
            logger.error({ uid: decoded.uid, error: createError }, "Failed to create user document");
            return next({ status: 500, message: "Failed to create user document" });
          }

          logger.info({ uid: decoded.uid, role: userDoc.role }, "User document created by another request");
        }
      } else {
        logger.error({ uid: decoded.uid }, "No email in token to create user doc");
        return next({ status: 500, message: "Email missing from token" });
      }
    } else {
      logger.info({ uid: decoded.uid, role: userDoc.role }, "Existing user document loaded");
    }

    // Attach user data to request
    req.user = {
      uid: userDoc.uid,
      email: userDoc.email,
      role: userDoc.role,
    };

    logger.info({ uid: req.user.uid, role: req.user.role, path: req.path }, "Auth middleware completed - proceeding to route");
    return next();
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : err }, "Auth failed");
    return next({
      status: err instanceof Error && err.message.includes('auth/argument-error') ? 401 : 401,
      message: "Unauthorized",
      err
    });
  }
}