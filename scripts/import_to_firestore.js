import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import admin from 'firebase-admin';
import fs from 'fs';

const DATA_FILE = 'scripts/tools.json';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}',
);

//initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const COLLECTION_NAME = process.env.FIREBASE_COLLECTION;

//delete collection
async function resetCollection(colName) {
  const snapshot = await db.collection(colName).get();
  const batch = db.batch();
  snapshot.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`🗑 Reset ${colName} collection (${snapshot.size} docs deleted).`);
}

//upload from JSON

async function upload() {
  const args = process.argv.slice(2);
  if (args.includes('--reset')) {
    await resetCollection(COLLECTION_NAME);
  }

  console.log('ENV exists?', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  console.log(process.env.FIREBASE_COLLECTION);

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log(
    `Preparing to upload ${data.length} records → ${COLLECTION_NAME}`,
  );

  const batch = db.batch();
  data.forEach((tool) => {
    const docRef = db.collection(COLLECTION_NAME).doc(); // auto ID
    batch.set(docRef, tool);
  });

  await batch.commit();
  console.log(
    `Uploaded ${data.length} docs into Firestore collection "${COLLECTION_NAME}"`,
  );
}

upload().catch((err) => {
  console.error('Error uploading to Firestore:', err);
  process.exit(1);
});
