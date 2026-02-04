const { MongoClient } = require('mongodb');

// MongoDB connection - Set MONGODB_URI in Vercel environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'business_ledger';

let cachedClient = null;
let cachedDb = null;

/**
 * Connect to MongoDB with connection pooling
 */
async function connectToDatabase() {
  // Reuse existing connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 5000,
  });

  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

/**
 * Get a collection by name
 */
async function getCollection(collectionName) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

// ===================================
// PARTIES OPERATIONS
// ===================================

async function getParties() {
  const collection = await getCollection('parties');
  return await collection.find({}).toArray();
}

async function addParty(party) {
  const collection = await getCollection('parties');
  const result = await collection.insertOne(party);
  return { ...party, _id: result.insertedId };
}

async function updateParty(id, updates) {
  const collection = await getCollection('parties');
  await collection.updateOne({ id }, { $set: updates });
}

async function deleteParty(id) {
  const collection = await getCollection('parties');
  await collection.deleteOne({ id });
}

// ===================================
// PURCHASES OPERATIONS
// ===================================

async function getPurchases() {
  const collection = await getCollection('purchases');
  return await collection.find({}).toArray();
}

async function addPurchase(purchase) {
  const collection = await getCollection('purchases');
  const result = await collection.insertOne(purchase);
  return { ...purchase, _id: result.insertedId };
}

async function updatePurchase(id, updates) {
  const collection = await getCollection('purchases');
  await collection.updateOne({ id }, { $set: updates });
}

async function deletePurchase(id) {
  const collection = await getCollection('purchases');
  await collection.deleteOne({ id });
}

// ===================================
// SALES OPERATIONS
// ===================================

async function getSales() {
  const collection = await getCollection('sales');
  return await collection.find({}).toArray();
}

async function addSale(sale) {
  const collection = await getCollection('sales');
  const result = await collection.insertOne(sale);
  return { ...sale, _id: result.insertedId };
}

async function updateSale(id, updates) {
  const collection = await getCollection('sales');
  await collection.updateOne({ id }, { $set: updates });
}

async function deleteSale(id) {
  const collection = await getCollection('sales');
  await collection.deleteOne({ id });
}

// ===================================
// PAYMENTS OPERATIONS
// ===================================

async function getPayments() {
  const collection = await getCollection('payments');
  return await collection.find({}).toArray();
}

async function addPayment(payment) {
  const collection = await getCollection('payments');
  const result = await collection.insertOne(payment);
  return { ...payment, _id: result.insertedId };
}

async function updatePayment(id, updates) {
  const collection = await getCollection('payments');
  await collection.updateOne({ id }, { $set: updates });
}

async function deletePayment(id) {
  const collection = await getCollection('payments');
  await collection.deleteOne({ id });
}

// ===================================
// STOCK OPERATIONS
// ===================================

async function getStock() {
  const collection = await getCollection('stock');
  return await collection.find({}).toArray();
}

async function addStockItem(item) {
  const collection = await getCollection('stock');
  const result = await collection.insertOne(item);
  return { ...item, _id: result.insertedId };
}

async function updateStockItem(id, updates) {
  const collection = await getCollection('stock');
  await collection.updateOne({ id }, { $set: updates });
}

async function deleteStockItem(id) {
  const collection = await getCollection('stock');
  await collection.deleteOne({ id });
}

// ===================================
// STOCK MOVEMENTS OPERATIONS
// ===================================

async function getStockMovements() {
  const collection = await getCollection('stock_movements');
  return await collection.find({}).toArray();
}

async function addStockMovement(movement) {
  const collection = await getCollection('stock_movements');
  const result = await collection.insertOne(movement);
  return { ...movement, _id: result.insertedId };
}

// ===================================
// SETTINGS OPERATIONS
// ===================================

async function getSettings() {
  const collection = await getCollection('settings');
  const docs = await collection.find({}).toArray();
  
  // Return default settings if none exist
  if (docs.length === 0) {
    return {
      lowStockThreshold: 10,
      currency: '₹',
      businessName: 'My Business',
      gstNumber: '',
      address: ''
    };
  }
  
  return docs[0];
}

async function updateSettings(settings) {
  const collection = await getCollection('settings');
  await collection.updateOne(
    {},
    { $set: settings },
    { upsert: true }
  );
}

// ===================================
// ALERTS OPERATIONS
// ===================================

async function getAlerts() {
  const collection = await getCollection('alerts');
  return await collection.find({}).toArray();
}

async function addAlert(alert) {
  const collection = await getCollection('alerts');
  const result = await collection.insertOne(alert);
  return { ...alert, _id: result.insertedId };
}

async function deleteAlert(id) {
  const collection = await getCollection('alerts');
  await collection.deleteOne({ id });
}

async function clearAlerts() {
  const collection = await getCollection('alerts');
  await collection.deleteMany({});
}

// ===================================
// BULK OPERATIONS
// ===================================

/**
 * Get all data from a collection by name
 */
async function getAllData(collectionName) {
  const collection = await getCollection(collectionName);
  return await collection.find({}).toArray();
}

/**
 * Replace all data in a collection
 */
async function replaceAllData(collectionName, data) {
  const collection = await getCollection(collectionName);
  await collection.deleteMany({});
  if (Array.isArray(data) && data.length > 0) {
    await collection.insertMany(data);
  } else if (typeof data === 'object' && !Array.isArray(data)) {
    await collection.insertOne(data);
  }
}

module.exports = {
  connectToDatabase,
  getCollection,
  
  // Parties
  getParties,
  addParty,
  updateParty,
  deleteParty,
  
  // Purchases
  getPurchases,
  addPurchase,
  updatePurchase,
  deletePurchase,
  
  // Sales
  getSales,
  addSale,
  updateSale,
  deleteSale,
  
  // Payments
  getPayments,
  addPayment,
  updatePayment,
  deletePayment,
  
  // Stock
  getStock,
  addStockItem,
  updateStockItem,
  deleteStockItem,
  
  // Stock Movements
  getStockMovements,
  addStockMovement,
  
  // Settings
  getSettings,
  updateSettings,
  
  // Alerts
  getAlerts,
  addAlert,
  deleteAlert,
  clearAlerts,
  
  // Bulk
  getAllData,
  replaceAllData,
};
