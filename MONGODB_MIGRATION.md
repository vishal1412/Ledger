# MongoDB Storage Migration Guide

## Overview
The application has been successfully migrated from hybrid storage (localStorage + file-based) to **MongoDB only**. All data is now persisted exclusively in MongoDB with no localStorage fallback.

## Changes Made

### 1. **server.js** - Updated to MongoDB
- Removed file system storage operations
- Now uses MongoDB via `mongodb-helper.js` for all data operations
- API endpoints `/api/storage/:collection` now read/write to MongoDB instead of JSON files
- Image uploads still saved to filesystem but linked in MongoDB

### 2. **js/core/storage.js** - Complete MongoDB Integration
- Replaced hybrid storage with MongoDB-only persistence
- **All methods are now async (Promise-based)**
- Removed all `localStorage` references and fallback logic
- Key changes:
  - `getData(key)` → async, reads from MongoDB
  - `saveData(key, value)` → async, writes to MongoDB
  - `addItem()` → async
  - `updateItem()` → async
  - `deleteItem()` → async
  - `getItemById()` → async
  - `filterItems()` → async
  - `saveImage()` → async, no localStorage fallback
  - `getImage()` → async
  - `exportToJSON()` → async
  - `importFromJSON()` → async
  - `clearAllData()` → async

### 3. **Service Files** - Updated to Async/Await
All service classes updated to use async/await:

#### **js/services/party.js**
- `createParty()` → async
- `getAllParties()` → async
- `getPartyById()` → async
- `updateParty()` → async
- `deleteParty()` → async
- `getPartyTransactions()` → async
- `calculatePartyBalance()` → async
- `updatePartyBalance()` → async
- `searchParties()` → async
- `getPartyStats()` → async
- `getVendors()` → async
- `getCustomers()` → async

#### **js/services/stock.js**
- `getOrCreateStockItem()` → async
- `getAllStock()` → async
- `getStockById()` → async
- `updateStockOnPurchase()` → async
- `updateStockOnSale()` → async
- `recordStockMovement()` → async
- `getStockMovements()` → async
- `getLowStockItems()` → async
- `getOutOfStockItems()` → async
- `triggerLowStockAlert()` → async
- `getStockStats()` → async
- `searchStock()` → async
- `getItemMovementSummary()` → async
- `updateOpeningStock()` → async
- `adjustStock()` → async

#### **js/services/purchase.js**
- `createPurchase()` → async
- `getAllPurchases()` → async
- `getPurchaseById()` → async
- `getPurchasesByVendor()` → async
- `getPurchasesByDateRange()` → async
- `deletePurchase()` → async
- `getPurchaseStats()` → async
- `processPurchaseFromOCR()` → async
- `getPurchaseImage()` → async
- `updatePurchase()` → async
- `searchPurchases()` → async

#### **js/services/sales.js**
- `createSale()` → async
- `getAllSales()` → async
- `getSaleById()` → async
- `getSalesByCustomer()` → async
- `getSalesByDateRange()` → async
- `deleteSale()` → async
- `getSaleStats()` → async
- `processSaleFromOCR()` → async
- `getSaleImage()` → async
- `updateSale()` → async
- `searchSales()` → async
- `getCustomerPending()` → async

#### **js/services/payment.js**
- `recordVendorPayment()` → async
- `recordCustomerPayment()` → async
- `getAllPayments()` → async
- `getPaymentById()` → async
- `getPaymentsByParty()` → async
- `getPaymentsByDateRange()` → async
- `getVendorPayments()` → async
- `getCustomerPayments()` → async
- `deletePayment()` → async
- `getPaymentStats()` → async
- `getPaymentModeStats()` → async
- `updatePayment()` → async
- `searchPayments()` → async

## Migration Impact

### Breaking Changes
**All service methods are now async.** Code calling these methods MUST use `await` or `.then()`:

```javascript
// OLD (No longer works) ❌
const parties = partyService.getAllParties();

// NEW (Required) ✅
const parties = await partyService.getAllParties();

// OR with .then()
partyService.getAllParties().then(parties => {
    // handle parties
});
```

### What Changed Under the Hood
1. **No localStorage**: All data is now exclusively in MongoDB
2. **Server Required**: The server must be running for all operations (no offline mode with local storage)
3. **Performance**: Slightly slower due to network I/O vs synchronous localStorage, but trades for scalability and multi-device sync
4. **Data Caching**: Storage manager includes in-memory cache for repeated reads within the same session

## Deployment Requirements

### Prerequisites
1. **MongoDB Connection String** in environment variable: `MONGODB_URI`
   - Local: `mongodb://localhost:27017`
   - Cloud: MongoDB Atlas connection string
2. **Server Running** (Express server on port 3000 locally or Vercel serverless functions)
3. **Network Connectivity** between frontend and backend

### Configuration
Set the MongoDB URI in:
- **Local Development**: `.env` file or as system environment variable
- **Vercel Deployment**: Add `MONGODB_URI` to Vercel project settings → Environment Variables
- **API Layer**: `mongodb-helper.js` reads from `process.env.MONGODB_URI`

## Testing Checklist

- [ ] Create a new party and verify it appears in MongoDB
- [ ] Create a purchase with image and verify image is stored
- [ ] Create a sale with image and verify image is stored
- [ ] Update party information
- [ ] Delete a party (ensure no transactions exist first)
- [ ] Record payments
- [ ] Check stock movements
- [ ] Verify stock updates on purchase/sale
- [ ] Export data to JSON
- [ ] Import data from JSON
- [ ] Check all calculations (balances, totals, etc.)
- [ ] Test low stock alerts
- [ ] Verify search functionality works

## Error Handling

### Server Connection Failures
If the MongoDB server is not available, the app will:
1. Display an error notification at the top
2. Show message: "Cannot connect to MongoDB server"
3. Prevent all data operations

### Recovery
1. Ensure server is running
2. Check `MONGODB_URI` environment variable
3. Verify network connectivity
4. Reload the application

## Data Migration (If Upgrading from Old Version)

If you have existing data in localStorage or JSON files:

1. Export all data from old version to JSON
2. In new version, use Import function to restore data
3. Verify all data appears correctly in MongoDB

Example migration via browser console:
```javascript
// Export from old storage
const oldData = JSON.parse(localStorage.getItem('business_ledger_parties'));

// Import to new MongoDB storage
await storage.saveData('parties', oldData);
```

## Monitoring

### MongoDB Collections
The application creates and uses these collections:
- `parties` - Vendors and Customers
- `purchases` - Purchase transactions
- `sales` - Sales transactions
- `payments` - Payment records
- `stock` - Stock items
- `stock_movements` - Stock transaction history
- `settings` - Application settings
- `alerts` - System alerts
- `image_map` - Mapping of images to document IDs

### Indexing Recommendations
For production, consider adding indexes:
```javascript
// In MongoDB shell or Atlas GUI
db.parties.createIndex({ "type": 1, "name": 1 });
db.purchases.createIndex({ "vendorId": 1, "date": -1 });
db.sales.createIndex({ "customerId": 1, "date": -1 });
db.payments.createIndex({ "partyId": 1, "date": -1 });
db.stock.createIndex({ "name": 1 });
```

## Troubleshooting

### Issue: "Cannot read property 'getData' of undefined"
**Cause**: Storage manager not initialized yet
**Fix**: Ensure storage.js is loaded before service files, and wait for connection in app.js

### Issue: "async function returns undefined"
**Cause**: Not awaiting async calls
**Fix**: Add `await` keyword or use `.then()`

### Issue: Data not persisting
**Cause**: MongoDB not connected or wrong URI
**Fix**: Check `MONGODB_URI`, verify MongoDB is running, check network connectivity

### Issue: Images not loading
**Cause**: Server path incorrect or image upload failed
**Fix**: Check server logs, verify `/api/upload` endpoint, check image directory permissions

## Next Steps

1. **Update UI Components**: Page files (dashboard.js, parties.js, etc.) need to be updated to handle async service calls
2. **Add Loading States**: Display loading indicators while fetching from MongoDB
3. **Error Handling**: Add try-catch blocks in UI components
4. **Performance**: Consider implementing pagination for large datasets
5. **Testing**: Run full test suite with MongoDB

## Rollback Plan

If issues arise, original localStorage data structure is still in mongodb-helper.js with getters and setters. To revert:
1. Restore from backup
2. Switch to old storage.js version
3. Note: Data structure and API won't match new MongoDB schema

## Support

For issues or questions:
1. Check browser console for error messages
2. Check server logs for connection issues
3. Verify MongoDB connection string
4. Ensure all files are using `await` for async calls
