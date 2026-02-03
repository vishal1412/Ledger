// ===================================
// STOCK SERVICE
// ===================================

class StockService {
    constructor() {
        this.storage = window.storage;
        this.calculator = window.calculator;
        this.lowStockThreshold = 10;
    }

    // Initialize or get stock item
    getOrCreateStockItem(itemName) {
        const stock = this.storage.getData('stock') || [];
        let item = stock.find(s => s.name.toLowerCase() === itemName.toLowerCase());

        if (!item) {
            item = {
                name: itemName,
                openingStock: 0,
                stockIn: 0,
                stockOut: 0,
                closingStock: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.storage.addItem('stock', item);
        }

        return item;
    }

    // Get all stock items
    getAllStock() {
        return this.storage.getData('stock') || [];
    }

    // Get stock item by ID
    getStockById(id) {
        return this.storage.getItemById('stock', id);
    }

    // Update stock on purchase (stock in)
    updateStockOnPurchase(items, purchaseId) {
        items.forEach(item => {
            const stockItem = this.getOrCreateStockItem(item.name);

            const updatedStock = {
                stockIn: stockItem.stockIn + item.quantity,
                closingStock: stockItem.closingStock + item.quantity,
                updatedAt: new Date().toISOString()
            };

            this.storage.updateItem('stock', stockItem.id, updatedStock);

            // Record movement
            this.recordStockMovement({
                stockId: stockItem.id,
                itemName: item.name,
                type: 'IN',
                quantity: item.quantity,
                reference: `Purchase ${purchaseId}`,
                date: new Date().toISOString()
            });
        });
    }

    // Update stock on sale (stock out)
    updateStockOnSale(items, saleId) {
        items.forEach(item => {
            const stockItem = this.getOrCreateStockItem(item.name);

            const updatedStock = {
                stockOut: stockItem.stockOut + item.quantity,
                closingStock: stockItem.closingStock - item.quantity,
                updatedAt: new Date().toISOString()
            };

            this.storage.updateItem('stock', stockItem.id, updatedStock);

            // Record movement
            this.recordStockMovement({
                stockId: stockItem.id,
                itemName: item.name,
                type: 'OUT',
                quantity: item.quantity,
                reference: `Sale ${saleId}`,
                date: new Date().toISOString()
            });

            // Check for low stock
            if (updatedStock.closingStock <= this.lowStockThreshold) {
                this.triggerLowStockAlert(stockItem.name, updatedStock.closingStock);
            }
        });
    }

    // Record stock movement
    recordStockMovement(movement) {
        let movements = this.storage.getData('stock_movements') || [];
        if (!movements) {
            movements = [];
            this.storage.saveData('stock_movements', movements);
        }
        movements.push({
            ...movement,
            id: this.storage.generateId(),
            createdAt: new Date().toISOString()
        });
        this.storage.saveData('stock_movements', movements);
    }

    // Get stock movement history
    getStockMovements(stockId = null) {
        const movements = this.storage.getData('stock_movements') || [];
        if (stockId) {
            return movements.filter(m => m.stockId === stockId);
        }
        return movements;
    }

    // Get low stock items
    getLowStockItems() {
        const stock = this.getAllStock();
        return stock.filter(item => item.closingStock <= this.lowStockThreshold && item.closingStock >= 0);
    }

    // Get out of stock items
    getOutOfStockItems() {
        const stock = this.getAllStock();
        return stock.filter(item => item.closingStock <= 0);
    }

    // Trigger low stock alert
    triggerLowStockAlert(itemName, quantity) {
        const alert = {
            type: 'LOW_STOCK',
            itemName,
            quantity,
            threshold: this.lowStockThreshold,
            date: new Date().toISOString()
        };

        // Dispatch event
        const event = new CustomEvent('low-stock-alert', { detail: alert });
        window.dispatchEvent(event);

        // Save to alerts
        let alerts = this.storage.getData('alerts') || [];
        alerts.push(alert);
        this.storage.saveData('alerts', alerts);
    }

    // Get stock statistics
    getStockStats() {
        const stock = this.getAllStock();

        return {
            totalItems: stock.length,
            lowStockItems: this.getLowStockItems().length,
            outOfStockItems: this.getOutOfStockItems().length,
            totalStockIn: stock.reduce((sum, item) => sum + item.stockIn, 0),
            totalStockOut: stock.reduce((sum, item) => sum + item.stockOut, 0),
            totalClosingStock: stock.reduce((sum, item) => sum + item.closingStock, 0)
        };
    }

    // Search stock items
    searchStock(query) {
        const stock = this.getAllStock();
        const lowerQuery = query.toLowerCase();
        return stock.filter(item => item.name.toLowerCase().includes(lowerQuery));
    }

    // Get item movement summary
    getItemMovementSummary(itemName) {
        const stockItem = this.getAllStock().find(s => s.name.toLowerCase() === itemName.toLowerCase());
        if (!stockItem) return null;

        const movements = this.getStockMovements(stockItem.id);

        return {
            item: stockItem,
            movements: movements.sort((a, b) => new Date(b.date) - new Date(a.date)),
            totalMovements: movements.length,
            inMovements: movements.filter(m => m.type === 'IN').length,
            outMovements: movements.filter(m => m.type === 'OUT').length
        };
    }

    // Update opening stock (one-time operation)
    updateOpeningStock(itemName, quantity) {
        const stockItem = this.getOrCreateStockItem(itemName);

        const updatedStock = {
            openingStock: quantity,
            closingStock: quantity + stockItem.stockIn - stockItem.stockOut,
            updatedAt: new Date().toISOString()
        };

        return this.storage.updateItem('stock', stockItem.id, updatedStock);
    }

    // Adjust stock (manual correction)
    adjustStock(itemName, quantity, reason) {
        const stockItem = this.getOrCreateStockItem(itemName);

        const adjustment = quantity - stockItem.closingStock;
        const updatedStock = {
            closingStock: quantity,
            updatedAt: new Date().toISOString()
        };

        this.storage.updateItem('stock', stockItem.id, updatedStock);

        // Record adjustment
        this.recordStockMovement({
            stockId: stockItem.id,
            itemName: stockItem.name,
            type: adjustment > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
            quantity: Math.abs(adjustment),
            reference: `Manual Adjustment: ${reason}`,
            date: new Date().toISOString()
        });

        return updatedStock;
    }
}

// Create global instance
window.stockService = new StockService();
