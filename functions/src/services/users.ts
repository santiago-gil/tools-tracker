import { getAuth } from "firebase-admin/auth";
import type { User } from "../types/Users.js";
import { db } from "../utils/firebase.js";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import logger from "../utils/logger/index.js";

const usersCol = db.collection("users");

export const DEFAULT_ROLE: User["role"] = "viewer";

export const DEFAULT_PERMISSIONS: Readonly<User["permissions"]> =
  Object.freeze({
    add: false,
    edit: false,
    delete: false,
    manageUsers: false,
  });

export async function createUserDoc(
  uid: string,
  email: string
): Promise<User> {
  logger.info({ uid, email }, "Creating Firestore user document");

  const userWithoutUid: Omit<User, "uid"> = {
    email,
    role: DEFAULT_ROLE,
    permissions: DEFAULT_PERMISSIONS,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await usersCol.doc(uid).set(userWithoutUid);

  logger.info({ uid, role: userWithoutUid.role }, "User document created");

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
  data: Partial<Omit<User, "uid" | "createdAt">>
): Promise<void> {
  logger.info({ uid, update: data }, "Updating user document");
  await usersCol.doc(uid).update({
    ...data,
    updatedAt: new Date(),
  });
  logger.info({ uid }, "User updated");
}

export async function deleteUser(uid: string): Promise<void> {
  logger.info({ uid }, "Deleting user from Firestore and Auth");
  await usersCol.doc(uid).delete();
  await getAuth().deleteUser(uid);
  logger.info({ uid }, "User deleted successfully");
}