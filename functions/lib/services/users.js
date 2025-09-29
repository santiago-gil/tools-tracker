import { getAuth } from "firebase-admin/auth";
import { db } from "../utils/firebase.js";
import logger from "../utils/logger/index.js";
const usersCol = db.collection("users");
export const DEFAULT_ROLE = "viewer";
export const DEFAULT_PERMISSIONS = Object.freeze({
    add: false,
    edit: false,
    delete: false,
    manageUsers: false,
});
export async function createUserDoc(uid, email) {
    logger.info({ uid, email }, "Creating Firestore user document");
    const userWithoutUid = {
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
export async function getUserByUid(uid) {
    logger.info({ uid }, "Fetching user document");
    const doc = await usersCol.doc(uid).get();
    if (!doc.exists) {
        logger.warn({ uid }, "User document not found");
        return null;
    }
    const user = { uid: doc.id, ...doc.data() };
    logger.info({ uid, role: user.role }, "Fetched user document");
    return user;
}
export async function listUsers() {
    logger.info("Listing all users");
    const snap = await usersCol.get();
    logger.info({ count: snap.size }, "Fetched user collection");
    return snap.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
    }));
}
export async function updateUser(uid, data) {
    logger.info({ uid, update: data }, "Updating user document");
    await usersCol.doc(uid).update({
        ...data,
        updatedAt: new Date(),
    });
    logger.info({ uid }, "User updated");
}
export async function deleteUser(uid) {
    logger.info({ uid }, "Deleting user from Firestore and Auth");
    await usersCol.doc(uid).delete();
    await getAuth().deleteUser(uid);
    logger.info({ uid }, "User deleted successfully");
}
//# sourceMappingURL=users.js.map