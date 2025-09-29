import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import logger from "./logger/index.js";
const app = initializeApp({ credential: applicationDefault() });
export const db = getFirestore(app);
// Log target DB
if (process.env.FIRESTORE_EMULATOR_HOST) {
    logger.info(`Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}
else {
    logger.info("Using Firestore PROD (no FIRESTORE_EMULATOR_HOST found)");
}
//# sourceMappingURL=firebase.js.map