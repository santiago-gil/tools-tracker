// import { getAuth } from "firebase-admin/auth";
// import type { Response, NextFunction } from "express";
// import type { AuthedRequest } from "../types/http.js";
// import { db } from "../utils/firebase.js";
// import { createUserDoc, getUserByUid } from "../services/users.js";
// import logger from "../utils/logger/index.js";

// /**
//  * Verifies Firebase ID token, restricts email domain,
//  * ensures the user has a Firestore document, and attaches full user data.
//  */
// export async function authMiddleware(
//   req: AuthedRequest,
//   _res: Response,
//   next: NextFunction
// ) {
//   const header = req.headers.authorization || "";
//   const match = header.match(/^Bearer (.+)$/);

//   if (!match) {
//     return next({ status: 401, message: "Missing token" });
//   }

//   try {
//     const decoded = await getAuth().verifyIdToken(match[1]);

//     // Restrict to company emails
//     if (!decoded.email?.endsWith("@searchkings.ca")) {
//       logger.warn({ email: decoded.email }, "Invalid email domain");
//       return next({ status: 403, message: "Invalid domain" });
//     }

//     // Ensure user document exists (defensive safety net)
//     let userDoc = await getUserByUid(decoded.uid);

//     if (!userDoc && decoded.email) {
//       logger.info({ uid: decoded.uid }, "User doc missing, creating");
//       await createUserDoc(decoded.uid, decoded.email);
//       userDoc = await getUserByUid(decoded.uid);
//     }

//     if (!userDoc) {
//       logger.error({ uid: decoded.uid }, "Failed to load/create user doc");
//       return next({ status: 500, message: "User document error" });
//     }

//     // Attach user data to request
//     req.user = {
//       uid: userDoc.uid,
//       email: userDoc.email,
//       role: userDoc.role,
//     };

//     logger.debug({ uid: req.user.uid, role: req.user.role }, "Auth success");
//     return next();
//   } catch (err) {
//     logger.error({ err }, "Auth failed");
//     return next({ status: 401, message: "Unauthorized", err });
//   }
// }

import { getAuth } from "firebase-admin/auth";
import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/http.js";
import { db } from "../utils/firebase.js";
import { createUserDoc, getUserByUid } from "../services/users.js";
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
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);

  if (!match) {
    return next({ status: 401, message: "Missing token" });
  }

  try {
    // Don't log auth headers in production
    logger.debug("Auth header received");

    const decoded = await getAuth().verifyIdToken(match[1]);

    logger.info(
      {
        uid: decoded.uid,
        // Don't log sensitive email
        iat: decoded.iat,
        exp: decoded.exp
      },
      "Token verified"
    );

    // Restrict to company emails
    if (!decoded.email?.endsWith("@searchkings.ca")) {
      logger.warn({ email: decoded.email }, "Invalid email domain");
      return next({ status: 403, message: "Invalid domain" });
    }

    // Try to get existing user
    let userDoc = await getUserByUid(decoded.uid);

    if (!userDoc) {
      logger.warn({ uid: decoded.uid }, "User document not found");

      if (decoded.email) {
        // Create user document with atomic operation
        try {
          logger.info({ uid: decoded.uid }, "Creating user document");

          // Use atomic operation to prevent race conditions
          const newUser = await createUserDoc(decoded.uid, decoded.email);
          userDoc = newUser;

          logger.info({ uid: decoded.uid, role: userDoc.role }, "User document successfully created");
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

    logger.debug({ uid: req.user.uid, role: req.user.role }, "Auth success");
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