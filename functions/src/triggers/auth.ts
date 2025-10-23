import { auth } from "firebase-functions/v1";
import logger from "../utils/logger/index.js";
import { createUserDoc } from "../services/users.js";
import { db } from "../utils/firebase.js";
import { getAuth } from "firebase-admin/auth";

export const onUserCreated = auth.user().onCreate(async (user) => {
  const { uid, email, photoURL, displayName } = user;

  logger.info({ uid, email, photoURL, displayName }, "onUserCreated trigger fired");

  if (!email) {
    logger.warn({ uid }, "Created user has no email — skipping Firestore doc");
    return;
  }

  const allowedDomains = ["@searchkings.ca"];

  // relax auth in emulator
  if (
    process.env.FUNCTIONS_EMULATOR !== "true" &&
    !allowedDomains.some((d) => email.endsWith(d))
  ) {
    logger.warn(
      { uid, email, allowedDomains },
      "Unauthorized domain detected, disabling account"
    );
    await getAuth().updateUser(uid, { disabled: true });
    return;
  }

  try {
    const ref = db.collection("users").doc(uid);
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
    await db.collection("users").doc(uid).delete();
    logger.info({ uid, email }, "Deleted user doc from Firestore");
  } catch (err) {
    logger.error({ uid, email, err }, "Error deleting user doc");
  }
});