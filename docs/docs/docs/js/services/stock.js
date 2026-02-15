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
    async getOrCreateStockItem(itemName) {
        const stock = await this.storage.getData('stock') || [];
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
            await this.storage.addItem('stock', item);
        }

        return item;
    }

    // Get all stock items
    async getAllStock() {
        return await this.storage.getData('stock') || [];
    }

    // Get stock item by ID
    async getStockById(id) {
        return await this.storage.getItemById('stock', id);
    }

    // Update stock on purchase (stock in)
    async updateStockOnPurchase(items, purchaseId) {
        for (const item of items) {
            const stockItem = await this.getOrCreateStockItem(item.name);

            const updatedStock = {
                stockIn: stockItem.stockIn + item.quantity,
                closingStock: stockItem.closingStock + item.quantity,
                updatedAt: new Date().toISOString()
            };

            await this.storage.updateItem('stock', stockItem.id, updatedStock);

            // Record movement
            await this.recordStockMovement({
                stockId: stockItem.id,
                itemName: item.name,
                type: 'IN',
                quantity: item.quantity,
                reference: `Purchase ${purchaseId}`,
                date: new Date().toISOString()
            });
        }
    }

    // Update stock on sale (stock out)
    async updateStockOnSale(items, saleId) {
        for (const item of items) {
            const stockItem = await this.getOrCreateStockItem(item.name);

            const updatedStock = {
                stockOut: stockItem.stockOut + item.quantity,
                closingStock: stockItem.closingStock - item.quantity,
                updatedAt: new Date().toISOString()
            };

            await this.storage.updateItem('stock', stockItem.id, updatedStock);

            // Record movement
            await this.recordStockMovement({
                stockId: stockItem.id,
                itemName: item.name,
                type: 'OUT',
                quantity: item.quantity,
                reference: `Sale ${saleId}`,
                date: new Date().toISOString()
            });

            // Check for low stock
            if (updatedStock.closingStock <= this.lowStockThreshold) {
                await this.triggerLowStockAlert(stockItem.name, updatedStock.closingStock);
            }
        }
    }

    // Record stock movement
    async recordStockMovement(movement) {
        let movements = await this.storage.getData('stock_movements') || [];
        if (!movements) {
            movements = [];
        }
        movements.push({
            ...movement,
            id: this.storage.generateId(),
            createdAt: new Date().toISOString()
        });
        await this.storage.saveData('stock_movements', movements);
    }

    // Get stock movement history
    async getStockMovements(stockId = null) {
        const movements = await this.storage.getData('stock_movements') || [];
        if (stockId) {
            return movements.filter(m => m.stockId === stockId);
        }
        return movements;
    }

    // Get low stock items
    async getLowStockItems() {
        const stock = await this.getAllStock();
        return stock.filter(item => item.closingStock <= this.lowStockThreshold && item.closingStock >= 0);
    }

    // Get out of stock items
    async getOutOfStockItems() {
        const stock = await this.getAllStock();
        return stock.filter(item => item.closingStock <= 0);
    }

    // Trigger low stock alert
    async triggerLowStockAlert(itemName, quantity) {
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
        let alerts = await this.storage.getData('alerts') || [];
        alerts.push(alert);
        await this.storage.saveData('alerts', alerts);
    }

    // Get stock statistics
    async getStockStats() {
        const stock = await this.getAllStock();
        const lowStockItems = await this.getLowStockItems();
        const outOfStockItems = await this.getOutOfStockItems();

        return {
            totalItems: stock.length,
            lowStockItems: lowStockItems.length,
            outOfStockItems: outOfStockItems.length,
            totalStockIn: stock.reduce((sum, item) => sum + item.stockIn, 0),
            totalStockOut: stock.reduce((sum, item) => sum + item.stockOut, 0),
            totalClosingStock: stock.reduce((sum, item) => sum + item.closingStock, 0)
        };
    }

    // Search stock items
    async searchStock(query) {
        const stock = await this.getAllStock();
        const lowerQuery = query.toLowerCase();
        return stock.filter(item => item.name.toLowerCase().includes(lowerQuery));
    }

    // Get item movement summary
    async getItemMovementSummary(itemName) {
        const allStock = await this.getAllStock();
        const stockItem = allStock.find(s => s.name.toLowerCase() === itemName.toLowerCase());
        if (!stockItem) return null;

        const movements = await this.getStockMovements(stockItem.id);

        return {
            item: stockItem,
            movements: movements.sort((a, b) => new Date(b.date) - new Date(a.date)),
            totalMovements: movements.length,
            inMovements: movements.filter(m => m.type === 'IN').length,
            outMovements: movements.filter(m => m.type === 'OUT').length
        };
    }

    // Update opening stock (one-time operation)
    async updateOpeningStock(itemName, quantity) {
        const stockItem = await this.getOrCreateStockItem(itemName);

        const updatedStock = {
            openingStock: quantity,
            closingStock: quantity + stockItem.stockIn - stockItem.stockOut,
            updatedAt: new Date().toISOString()
        };

        return await this.storage.updateItem('stock', stockItem.id, updatedStock);
    }

    // Adjust stock (manual correction)
    async adjustStock(itemName, quantity, reason) {
        const stockItem = await this.getOrCreateStockItem(itemName);

        const adjustment = quantity - stockItem.closingStock;
        const updatedStock = {
            closingStock: quantity,
            updatedAt: new Date().toISOString()
        };

        await this.storage.updateItem('stock', stockItem.id, updatedStock);

        // Record adjustment
        await this.recordStockMovement({
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
