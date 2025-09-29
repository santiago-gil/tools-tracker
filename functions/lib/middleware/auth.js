import { getAuth } from "firebase-admin/auth";
import { db } from "../utils/firebase.js";
import { createUserDoc } from "../services/users.js";
/**
 * Verifies Firebase ID token, restricts email domain,
 * and ensures the user has a Firestore document.
 */
export async function authMiddleware(req, _res, next) {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer (.+)$/);
    if (!match) {
        return next({ status: 401, message: "Missing token" });
    }
    try {
        const decoded = await getAuth().verifyIdToken(match[1]);
        // Restrict to company emails
        if (!decoded.email?.endsWith("@searchkings.ca")) {
            return next({ status: 403, message: "Invalid domain" });
        }
        // Defensive safety net:
        const ref = db.collection("users").doc(decoded.uid);
        const snapshot = await ref.get();
        if (!snapshot.exists && decoded.email) {
            await createUserDoc(decoded.uid, decoded.email);
        }
        // Attach current user info to request
        req.user = { uid: decoded.uid, email: decoded.email };
        return next();
    }
    catch (err) {
        return next({ status: 401, message: "Unauthorized", err });
    }
}
//# sourceMappingURL=auth.js.map