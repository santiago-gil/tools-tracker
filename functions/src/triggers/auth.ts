import { auth } from "firebase-functions/v1";
import logger from "../utils/logger/index.js";
import { createUserDoc } from "../services/users.js";
import { db } from "../utils/firebase.js";
import { getAuth } from "firebase-admin/auth";
import { COLLECTIONS } from "../config/collections.js";
import { ALLOWED_EMAIL_DOMAINS } from "../config/auth.js";

export const onUserCreated = auth.user().onCreate(async (user) => {
  const { uid, email, photoURL, displayName } = user;

  logger.info({ uid, email, photoURL, displayName }, "onUserCreated trigger fired");

  if (!email) {
    logger.warn({ uid }, "Created user has no email — skipping Firestore doc");
    return;
  }

  const allowedDomains = ALLOWED_EMAIL_DOMAINS;

  // Check domain - always enforce, even in emulator
  if (!allowedDomains.some((d) => email.endsWith(d))) {
    logger.warn(
      { uid, email, allowedDomains },
      "Unauthorized domain detected, disabling account"
    );
    try {
      await getAuth().updateUser(uid, { disabled: true });
    } catch (err) {
      logger.error({ uid, email, err }, "Error disabling user account");
      throw err;
    }
    return;
  }

  try {
    const ref = db.collection(COLLECTIONS.USERS).doc(uid);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      logger.info({ uid }, "No user doc exists — creating new one");
      await createUserDoc(uid, email, photoURL, displayName);
      logger.info({ uid, email, photoURL, displayName }, "Bootstrapped user into Firestore");
    } else {
      logger.info({ uid }, "User doc already exists — skipping bootstrap");
    }
  } catch (err) {
    logger.error({ uid, email, err }, "Error in onUserCreated");
  }
});

export const onUserDeleted = auth.user().onDelete(async (user) => {
  const { uid, email } = user;
  logger.info({ uid, email }, "onUserDeleted trigger fired");
  try {
    await db.collection(COLLECTIONS.USERS).doc(uid).delete();
    logger.info({ uid, email }, "Deleted user doc from Firestore");
  } catch (err) {
    logger.error({ uid, email, err }, "Error deleting user doc");
  }
});