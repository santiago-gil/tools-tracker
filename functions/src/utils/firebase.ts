import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Settings } from "firebase-admin/firestore";
import logger from "./logger/index.js";

const app = initializeApp({ credential: applicationDefault() });

// Configure Firestore to ignore undefined values
// This allows us to send data with undefined fields without errors
const firestoreSettings: Settings = {
    ignoreUndefinedProperties: true,
};

export const db = getFirestore(app);
db.settings(firestoreSettings);

// Log target DB
if (process.env.FIRESTORE_EMULATOR_HOST) {
    logger.info(`Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
} else {
    logger.info("Using Firestore PROD (no FIRESTORE_EMULATOR_HOST found)");
}