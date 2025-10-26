import { getAuth } from "firebase-admin/auth";
import type { User } from "../types/Users.js";
import { db } from "../utils/firebase.js";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import logger from "../utils/logger/index.js";
import { invalidatePermissionCache } from "../middleware/perms.js";
import { COLLECTIONS } from "../config/collections.js";
import { validateUserUpdate } from "../utils/validate.js";

const usersCol = db.collection(COLLECTIONS.USERS);

export const DEFAULT_ROLE: User["role"] = "viewer";

export const DEFAULT_PERMISSIONS: Readonly<User["permissions"]> =
  Object.freeze({
    add: false,
    edit: false,
    delete: false,
    manageUsers: false,
  });

const ROLE_DEFAULT_PERMISSIONS: Record<User["role"], User["permissions"]> = {
  viewer: {
    add: false,
    edit: false,
    delete: false,
    manageUsers: false,
  },
  ops: {
    add: true,
    edit: true,
    delete: false,
    manageUsers: false,
  },
  admin: {
    add: true,
    edit: true,
    delete: true,
    manageUsers: true,
  },
};

export async function createUserDoc(
  uid: string,
  email: string,
  photoURL?: string,
  displayName?: string
): Promise<User> {
  logger.info({ uid, email, photoURL, displayName }, "Creating Firestore user document");

  const role: User["role"] = DEFAULT_ROLE;
  const permissions = ROLE_DEFAULT_PERMISSIONS[role];

  const userWithoutUid: Omit<User, "uid"> = {
    email,
    role,
    permissions,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...(photoURL && { photoURL }),
    ...(displayName && { displayName }),
  };

  await usersCol.doc(uid).set(userWithoutUid);

  // Firestore set() always returns a WriteResult, so no need to check

  logger.info(
    { uid, role: userWithoutUid.role, permissions: userWithoutUid.permissions, photoURL, displayName },
    "User document created"
  );

  return { uid, ...userWithoutUid };
}

export async function getUserByUid(uid: string): Promise<User | null> {
  logger.info({ uid }, "Fetching user document");
  const doc = await usersCol.doc(uid).get();

  if (!doc.exists) {
    logger.warn({ uid }, "User document not found");
    return null;
  }

  const user = { uid: doc.id, ...(doc.data() as Omit<User, "uid">) };
  logger.info({ uid, role: user.role }, "Fetched user document");
  return user;
}

export async function listUsers(): Promise<User[]> {
  logger.info("Listing all users");
  const snap = await usersCol.get();

  logger.info({ count: snap.size }, "Fetched user collection");

  return snap.docs.map((d: QueryDocumentSnapshot) => ({
    uid: d.id,
    ...(d.data() as Omit<User, "uid">),
  }));
}


export async function updateUser(
  uid: string,
  data: Partial<Omit<User, "uid" | "createdAt">>,
  requesterUid: string
): Promise<void> {
  logger.info({ uid, update: data, requester: requesterUid }, "Updating user document");

  // Security validation
  await validateUserUpdate(uid, data, requesterUid);

  // Automatically adjust permissions when role changes
  if (data.role && !data.permissions) {
    data.permissions = ROLE_DEFAULT_PERMISSIONS[data.role];
    logger.info(
      { uid, role: data.role, permissions: data.permissions },
      "Auto-set permissions based on new role"
    );
  }

  await usersCol.doc(uid).update({
    ...data,
    updatedAt: new Date(),
  });

  // Firestore update() always returns a WriteResult, so no need to check

  // Invalidate permission cache when user permissions change
  invalidatePermissionCache(uid);

  logger.info({ uid }, "User updated");
}

export async function deleteUser(uid: string): Promise<void> {
  logger.info({ uid }, "Deleting user from Auth and Firestore");

  try {
    // Delete Auth user first to prevent orphaned Auth users
    await getAuth().deleteUser(uid);
    logger.info({ uid }, "Auth user deleted successfully");
  } catch (error) {
    logger.error({ uid, error }, "Failed to delete Auth user");
    throw error; // Re-throw to prevent Firestore deletion
  }

  try {
    await usersCol.doc(uid).delete();
    logger.info({ uid }, "Firestore user document deleted successfully");
  } catch (error) {
    logger.error({ uid, error }, "Failed to delete Firestore user document after Auth deletion");
    // Note: Auth user is already deleted, so we can't rollback
    throw error;
  }

  logger.info({ uid }, "User deleted successfully from both Auth and Firestore");
}

