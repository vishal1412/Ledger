# Code Migration Reference - localStorage to MongoDB

## Quick Reference for Code Updates

### Storage Manager Changes

#### Before (localStorage)
```javascript
// Synchronous operations
const parties = storage.getData('parties');
const newParty = storage.addItem('parties', partyData);
storage.saveData('parties', updatedList);
```

#### After (MongoDB)
```javascript
// All operations are now async
const parties = await storage.getData('parties');
const newParty = await storage.addItem('parties', partyData);
await storage.saveData('parties', updatedList);
```

### Service Layer Changes

#### Before (PartyService)
```javascript
class PartyService {
    getAllParties() {
        return this.storage.getData('parties') || [];
    }
    
    createParty(partyData) {
        return this.storage.addItem('parties', party);
    }
}

// Usage
const parties = partyService.getAllParties();
const newParty = partyService.createParty(data);
```

#### After (PartyService)
```javascript
class PartyService {
    async getAllParties() {
        return await this.storage.getData('parties') || [];
    }
    
    async createParty(partyData) {
        return await this.storage.addItem('parties', party);
    }
}

// Usage
const parties = await partyService.getAllParties();
const newParty = await partyService.createParty(data);
```

### UI Component Changes

#### Pattern 1: Direct Async Function

**Before:**
```javascript
loadParties() {
    this.parties = this.partyService.getAllParties();
    this.render();
}
```

**After:**
```javascript
async loadParties() {
    this.parties = await this.partyService.getAllParties();
    this.render();
}
```

#### Pattern 2: Event Handler

**Before:**
```javascript
addEventListener('click', () => {
    const parties = this.partyService.getAllParties();
    this.display(parties);
});
```

**After:**
```javascript
addEventListener('click', async () => {
    const parties = await this.partyService.getAllParties();
    this.display(parties);
});
```

#### Pattern 3: Multiple Async Operations

**Before:**
```javascript
createSale(saleData) {
    const result = this.salesService.createSale(saleData);
    this.updateStock();
    this.updatePartyBalance();
    return result;
}
```

**After:**
```javascript
async createSale(saleData) {
    const result = await this.salesService.createSale(saleData);
    await this.updateStock();
    await this.updatePartyBalance();
    return result;
}
```

#### Pattern 4: Promise Chain (Alternative to await)

If you can't use `async/await` for some reason, use `.then()`:

**Before:**
```javascript
const parties = this.partyService.getAllParties();
console.log(parties.length);
```

**After (with .then()):**
```javascript
this.partyService.getAllParties().then(parties => {
    console.log(parties.length);
});
```

### Common UI Patterns

#### Pattern 1: List Loading

```javascript
// OLD ❌
class PartiesList {
    constructor() {
        this.parties = window.partyService.getAllParties();
        this.render();
    }
}

// NEW ✅
class PartiesList {
    constructor() {
        this.loadParties();
    }
    
    async loadParties() {
        this.parties = await window.partyService.getAllParties();
        this.render();
    }
}

// Alternative with .then()
class PartiesList {
    constructor() {
        window.partyService.getAllParties()
            .then(parties => {
                this.parties = parties;
                this.render();
            });
    }
}
```

#### Pattern 2: Form Submission

```javascript
// OLD ❌
document.getElementById('partyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const result = window.partyService.createParty(Object.fromEntries(formData));
    alert(result.success ? 'Party created!' : 'Error');
});

// NEW ✅
document.getElementById('partyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const result = await window.partyService.createParty(Object.fromEntries(formData));
    alert(result.success ? 'Party created!' : 'Error');
});
```

#### Pattern 3: Sequential Operations

```javascript
// OLD ❌
deleteParty(partyId) {
    const transactions = this.partyService.getPartyTransactions(partyId);
    if (transactions.length === 0) {
        this.partyService.deleteParty(partyId);
        alert('Deleted!');
    }
}

// NEW ✅
async deleteParty(partyId) {
    const transactions = await this.partyService.getPartyTransactions(partyId);
    if (transactions.length === 0) {
        await this.partyService.deleteParty(partyId);
        alert('Deleted!');
    }
}
```

#### Pattern 4: Conditional Operations

```javascript
// OLD ❌
updateBalance() {
    const balance = this.partyService.calculatePartyBalance(this.partyId);
    if (balance < 0) {
        this.showWarning('Negative balance!');
    }
}

// NEW ✅
async updateBalance() {
    const balance = await this.partyService.calculatePartyBalance(this.partyId);
    if (balance < 0) {
        this.showWarning('Negative balance!');
    }
}
```

### Service Method Reference

All service methods are now async. Common patterns:

```javascript
// Reading data
const parties = await partyService.getAllParties();
const party = await partyService.getPartyById(id);
const vendors = await partyService.getVendors();

// Creating data
const newParty = await partyService.createParty(data);
const newPurchase = await purchaseService.createPurchase(data);
const newSale = await salesService.createSale(data);

// Updating data
await partyService.updateParty(id, updates);
await stockService.updateOpeningStock(itemName, qty);

// Deleting data
await partyService.deleteParty(id);
await salesService.deleteSale(saleId);

// Searching/Filtering
const results = await partyService.searchParties(query);
const purchases = await purchaseService.getPurchasesByVendor(vendorId);

// Statistics
const stats = await stockService.getStockStats();
const paymentStats = await paymentService.getPaymentStats();
```

### Error Handling

#### Basic Try-Catch

```javascript
// NEW ✅
async loadData() {
    try {
        this.parties = await partyService.getAllParties();
        this.render();
    } catch (error) {
        console.error('Failed to load parties:', error);
        this.showError('Could not load parties');
    }
}
```

#### With Promise Chain

```javascript
// Alternative with .catch()
loadData() {
    partyService.getAllParties()
        .then(parties => {
            this.parties = parties;
            this.render();
        })
        .catch(error => {
            console.error('Failed to load parties:', error);
            this.showError('Could not load parties');
        });
}
```

### Loading States

```javascript
async loadData() {
    this.showLoading(true);  // Show spinner
    
    try {
        this.parties = await partyService.getAllParties();
        this.render();
    } catch (error) {
        this.showError('Failed to load');
    } finally {
        this.showLoading(false);  // Hide spinner
    }
}
```

### Parallel Operations

```javascript
// Multiple independent async operations
async loadDashboard() {
    // Load all in parallel
    const [parties, sales, stock] = await Promise.all([
        partyService.getAllParties(),
        salesService.getAllSales(),
        stockService.getAllStock()
    ]);
    
    this.updateDashboard(parties, sales, stock);
}
```

## Checklist for Updating Components

- [ ] Identify all calls to storage methods
- [ ] Identify all calls to service methods
- [ ] Add `async` keyword to functions
- [ ] Add `await` keyword before method calls
- [ ] Add error handling (try-catch or .catch())
- [ ] Add loading states if applicable
- [ ] Test all functionality
- [ ] Verify data persists in MongoDB
- [ ] Check browser console for async errors

## Files That Need Updates

These page components need to be updated to handle async:
- `js/pages/dashboard.js`
- `js/pages/parties.js`
- `js/pages/vendors.js`
- `js/pages/customers.js`
- `js/pages/stock.js`

Also check any custom components in:
- `js/components/*.js`

## Testing Tips

```javascript
// Test in browser console
// Make sure to use await or .then()

// ✅ Correct
await partyService.getAllParties();

// ❌ Wrong (will return Promise, not data)
partyService.getAllParties();

// ✅ Also correct (with .then())
partyService.getAllParties().then(data => console.log(data));
```

## Debugging

If you see errors like:
- "Cannot read property 'map' of [object Promise]"
- "undefined is not iterable"
- Promise { <pending> }

**Solution**: Add `await` before the service method call!

```javascript
// ❌ Wrong
const parties = partyService.getAllParties();  // Returns Promise
parties.map(...);  // ERROR!

// ✅ Correct
const parties = await partyService.getAllParties();  // Returns array
parties.map(...);  // Works!
```

---

Need more help? See [MONGODB_MIGRATION.md](./MONGODB_MIGRATION.md) for full documentation.
