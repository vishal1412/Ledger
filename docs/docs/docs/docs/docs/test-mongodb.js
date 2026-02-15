#!/usr/bin/env node

/**
 * MongoDB Connection Tester
 * Tests MongoDB connectivity before deployment
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'business_ledger';

async function testConnection() {
  console.log('\n📊 MongoDB Connection Test');
  console.log('═'.repeat(50));
  
  try {
    console.log(`\n🔌 Connecting to MongoDB...`);
    console.log(`📍 URI: ${MONGODB_URI.replace(/password:[^@]*/, 'password:***')}`);
    
    const client = await MongoClient.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
    });
    
    const db = client.db(DB_NAME);
    
    // Test connection
    console.log(`✅ Connected to MongoDB successfully!`);
    
    // Check database
    console.log(`\n📦 Database: ${DB_NAME}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📚 Collections (${collections.length}):`);
    collections.forEach(col => {
      console.log(`   • ${col.name}`);
    });
    
    // Check each collection for data
    console.log(`\n📊 Collection Status:`);
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   • ${col.name}: ${count} documents`);
    }
    
    // Test write capability
    console.log(`\n✍️  Testing write capability...`);
    const testCol = db.collection('_connection_test');
    const testDoc = { test: true, timestamp: new Date() };
    const result = await testCol.insertOne(testDoc);
    console.log(`   ✅ Write test successful (ID: ${result.insertedId})`);
    
    // Cleanup
    await testCol.deleteOne({ _id: result.insertedId });
    console.log(`   ✅ Cleanup successful`);
    
    await client.close();
    
    console.log(`\n✅ MongoDB Connection Test PASSED!`);
    console.log('═'.repeat(50) + '\n');
    
    return true;
    
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Test FAILED!`);
    console.error(`Error: ${error.message}`);
    console.error('═'.repeat(50) + '\n');
    
    console.log('💡 Troubleshooting steps:');
    console.log('   1. Verify MongoDB is running');
    console.log('   2. Check MONGODB_URI environment variable');
    console.log('   3. For local: mongodb://localhost:27017');
    console.log('   4. For Atlas: mongodb+srv://user:pass@cluster.mongodb.net/');
    console.log('   5. Ensure network access is allowed\n');
    
    return false;
  }
}

// Run test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
