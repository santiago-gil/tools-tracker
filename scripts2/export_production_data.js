const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Get service account key from environment
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
  process.exit(1);
}

// Initialize Firebase Admin with service account
let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountKey);
} catch (error) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tool-tracker-c8180',
});

const db = admin.firestore();

async function exportProductionData() {
  try {
    console.log('🚀 Starting production data export...');
    console.log('📊 Connecting to PRODUCTION database...');

    // Export tools_v2 collection
    console.log('\n📥 Exporting tools_v2 collection...');
    const toolsSnapshot = await db.collection('tools_v2').get();

    const tools = [];
    toolsSnapshot.forEach((doc) => {
      tools.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`   ✅ Exported ${tools.length} tools`);

    // Export users collection
    console.log('\n📥 Exporting users collection...');
    const usersSnapshot = await db.collection('users').get();

    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`   ✅ Exported ${users.length} users`);

    // Create export data with timestamp
    const timestamp = new Date().toISOString();
    const exportData = {
      timestamp,
      collection: 'tools_v2',
      count: tools.length,
      tools,
      users,
      metadata: {
        exportDate: timestamp,
        totalTools: tools.length,
        totalUsers: users.length,
        environment: 'production',
      },
    };

    // Save to file in scripts2 directory
    const filePath = path.join(__dirname, 'production_export.json');
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

    console.log(`\n✅ Export completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Tools: ${tools.length}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`📁 Saved to: ${filePath}`);

    // Sample data analysis
    if (tools.length > 0) {
      console.log(`\n🔍 Sample Analysis:`);
      const sampleTool = tools[0];
      console.log(`   - Sample tool: ${sampleTool.name}`);
      console.log(`   - Has normalizedName: ${!!sampleTool.normalizedName}`);
      console.log(`   - Has slugVersions: ${!!sampleTool.slugVersions}`);
      if (sampleTool.slugVersions) {
        const versionKeys = Object.keys(sampleTool.slugVersions);
        console.log(`   - Version keys: ${versionKeys.join(', ')}`);
      }
    }
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.error('\n💡 Make sure you have:');
    console.error('   1. Firebase credentials properly configured');
    console.error('   2. Access to production database');
    console.error(
      '   3. Environment variable GOOGLE_APPLICATION_CREDENTIALS set if needed',
    );
    throw error;
  } finally {
    process.exit(0);
  }
}

exportProductionData();
