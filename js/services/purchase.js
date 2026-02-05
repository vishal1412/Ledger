// ===================================
// PURCHASE SERVICE
// ===================================

class PurchaseService {
    constructor() {
        this.storage = window.storage;
        this.calculator = window.calculator;
        this.stockService = window.stockService;
        this.partyService = window.partyService;
    }

    // Create new purchase
    async createPurchase(purchaseData) {
        // Validate transaction
        const validated = this.calculator.validateTransaction({
            items: purchaseData.items,
            total: purchaseData.total
        });

        // Create purchase record
        const purchase = {
            vendorId: purchaseData.vendorId,
            vendorName: purchaseData.vendorName,
            date: purchaseData.date || new Date().toISOString(),
            items: validated.items,
            total: validated.total,
            originalTotal: validated.originalTotal,
            totalWasCorrected: validated.totalWasCorrected,
            corrections: validated.corrections,
            hasImage: !!purchaseData.imageData,
            imageUrl: null,
            ocrData: purchaseData.ocrData || null,
            notes: purchaseData.notes || '',
            createdAt: new Date().toISOString()
        };

        // Save purchase
        const savedPurchase = await this.storage.addItem('purchases', purchase);

        // Save image if provided
        if (purchaseData.imageData) {
            const imageInfo = await this.storage.saveImage(
                purchaseData.imageData,
                'purchases',
                savedPurchase.id
            );
            if (imageInfo) {
                savedPurchase.imageUrl = imageInfo.url;
                await this.storage.updateItem('purchases', savedPurchase.id, { imageUrl: imageInfo.url });
            }
        }

        // Update stock
        await this.stockService.updateStockOnPurchase(validated.items, savedPurchase.id);

        // Update vendor balance
        await this.partyService.updatePartyBalance(purchaseData.vendorId);

        return {
            success: true,
            purchase: savedPurchase,
            message: `Purchase created successfully${validated.corrections.totalCorrections > 0 ? ' with corrections' : ''}`
        };
    }

    // Get all purchases
    async getAllPurchases() {
        return await this.storage.getData('purchases') || [];
    }

    // Get purchase by ID
    async getPurchaseById(id) {
        return await this.storage.getItemById('purchases', id);
    }

    // Get purchases by vendor
    async getPurchasesByVendor(vendorId) {
        return await this.storage.filterItems('purchases', p => p.vendorId === vendorId);
    }

    // Get purchases by date range
    async getPurchasesByDateRange(startDate, endDate) {
        return await this.storage.filterItems('purchases', p => {
            const purchaseDate = new Date(p.date);
            return purchaseDate >= new Date(startDate) && purchaseDate <= new Date(endDate);
        });
    }

    // Delete purchase
    async deletePurchase(id) {
        // Note: In production, you'd want to reverse stock updates
        const purchase = await this.getPurchaseById(id);
        if (!purchase) {
            return { success: false, message: 'Purchase not found' };
        }

        // Reverse stock updates
        for (const item of purchase.items) {
            const stockItem = await this.stockService.getOrCreateStockItem(item.name);
            const updatedStock = {
                stockIn: stockItem.stockIn - item.quantity,
                closingStock: stockItem.closingStock - item.quantity,
                updatedAt: new Date().toISOString()
            };
            await this.storage.updateItem('stock', stockItem.id, updatedStock);
        }

        // Delete purchase
        const deleted = await this.storage.deleteItem('purchases', id);

        // Update vendor balance
        await this.partyService.updatePartyBalance(purchase.vendorId);

        return {
            success: deleted,
            message: deleted ? 'Purchase deleted successfully' : 'Failed to delete purchase'
        };
    }

    // Get purchase statistics
    async getPurchaseStats() {
        const purchases = await this.getAllPurchases();

        return {
            totalPurchases: purchases.length,
            totalAmount: this.calculator.roundToTwo(
                purchases.reduce((sum, p) => sum + p.total, 0)
            ),
            totalCorrections: purchases.reduce((sum, p) => sum + (p.corrections?.totalCorrections || 0), 0),
            purchasesWithImages: purchases.filter(p => p.hasImage).length
        };
    }

    // Process OCR purchase
    async processPurchaseFromOCR(imageData, vendorId) {
        try {
            // Process image with OCR
            const result = await window.ocrEngine.processAndValidate(imageData);

            if (!result.success) {
                return {
                    success: false,
                    error: result.error
                };
            }

            // Get vendor info
            const vendor = await this.partyService.getPartyById(vendorId);

            return {
                success: true,
                data: {
                    vendorId,
                    vendorName: vendor?.name || result.data.partyName,
                    date: result.data.date,
                    items: result.data.items,
                    total: result.data.total,
                    corrections: result.data.corrections,
                    ocrData: {
                        rawText: result.data.rawText,
                        confidence: result.data.confidence
                    },
                    imageData
                },
                needsReview: result.data.corrections.totalCorrections > 0
            };
        } catch (error) {
            console.error('Error processing OCR purchase:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get purchase image
    async getPurchaseImage(id) {
        return await this.storage.getImage('purchases', id);
    }

    // Update purchase
    async updatePurchase(id, updates) {
        return await this.storage.updateItem('purchases', id, updates);
    }

    // Search purchases
    async searchPurchases(query) {
        const purchases = await this.getAllPurchases();
        const lowerQuery = query.toLowerCase();

        return purchases.filter(p =>
            p.vendorName.toLowerCase().includes(lowerQuery) ||
            p.items.some(item => item.name.toLowerCase().includes(lowerQuery))
        );
    }
}

// Create global instance
window.purchaseService = new PurchaseService();
