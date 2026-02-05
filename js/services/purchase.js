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
        console.log('Creating purchase with data:', purchaseData);
        
        try {
            // Validate vendor exists
            const vendor = this.partyService.getPartyById(purchaseData.vendorId);
            if (!vendor) {
                throw new Error('Vendor not found');
            }
            console.log('Vendor found:', vendor);

            // Validate transaction
            const validated = this.calculator.validateTransaction({
                items: purchaseData.items,
                total: purchaseData.total
            });
            console.log('Transaction validated:', validated);

            // Create purchase record
            const purchase = {
                vendorId: purchaseData.vendorId,
                vendorName: purchaseData.vendorName || vendor.name,
                date: purchaseData.date || new Date().toISOString(),
                items: validated.items,
                subtotal: purchaseData.subtotal || 0,
                tax: purchaseData.tax || 0,
                taxPercent: purchaseData.taxPercent || 0,
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
            const savedPurchase = this.storage.addItem('purchases', purchase);
            console.log('Purchase saved:', savedPurchase);

            // Save image if provided
            let imageInfo = null;
            if (purchaseData.imageData) {
                imageInfo = await this.storage.saveImage(
                    purchaseData.imageData,
                    'purchases',
                    savedPurchase.id
                );
                if (imageInfo) {
                    savedPurchase.imageUrl = imageInfo.url;
                    this.storage.updateItem('purchases', savedPurchase.id, { imageUrl: imageInfo.url });
                    console.log('Image saved:', imageInfo);
                }
            }

            // Update stock
            this.stockService.updateStockOnPurchase(validated.items, savedPurchase.id);
            console.log('Stock updated');

            // Update vendor balance
            const balanceUpdated = this.partyService.updatePartyBalance(purchaseData.vendorId);
            console.log('Vendor balance updated:', balanceUpdated);
            
            // Get updated vendor to verify
            const updatedVendor = this.partyService.getPartyById(purchaseData.vendorId);
            console.log('Updated vendor balance:', updatedVendor.currentBalance);

            // Dispatch event for dashboard refresh
            window.dispatchEvent(new CustomEvent('purchase-created', { 
                detail: { purchase: savedPurchase, vendor: updatedVendor } 
            }));

            return {
                success: true,
                purchase: savedPurchase,
                vendor: updatedVendor,
                message: `Purchase of ${this.calculator.formatCurrency(validated.total)} created successfully${validated.corrections.totalCorrections > 0 ? ' with corrections' : ''}. ${imageInfo ? 'Image saved.' : ''}`
            };
        } catch (error) {
            console.error('Error creating purchase:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to create purchase: ' + error.message
            };
        }
    }

    // Get all purchases
    getAllPurchases() {
        return this.storage.getData('purchases') || [];
    }

    // Get purchase by ID
    getPurchaseById(id) {
        return this.storage.getItemById('purchases', id);
    }

    // Get purchases by vendor
    getPurchasesByVendor(vendorId) {
        return this.storage.filterItems('purchases', p => p.vendorId === vendorId);
    }

    // Get purchases by date range
    getPurchasesByDateRange(startDate, endDate) {
        return this.storage.filterItems('purchases', p => {
            const purchaseDate = new Date(p.date);
            return purchaseDate >= new Date(startDate) && purchaseDate <= new Date(endDate);
        });
    }

    // Delete purchase
    deletePurchase(id) {
        // Note: In production, you'd want to reverse stock updates
        const purchase = this.getPurchaseById(id);
        if (!purchase) {
            return { success: false, message: 'Purchase not found' };
        }

        // Reverse stock updates
        purchase.items.forEach(item => {
            const stockItem = this.stockService.getOrCreateStockItem(item.name);
            const updatedStock = {
                stockIn: stockItem.stockIn - item.quantity,
                closingStock: stockItem.closingStock - item.quantity,
                updatedAt: new Date().toISOString()
            };
            this.storage.updateItem('stock', stockItem.id, updatedStock);
        });

        // Delete purchase
        const deleted = this.storage.deleteItem('purchases', id);

        // Update vendor balance
        this.partyService.updatePartyBalance(purchase.vendorId);

        return {
            success: deleted,
            message: deleted ? 'Purchase deleted successfully' : 'Failed to delete purchase'
        };
    }

    // Get purchase statistics
    getPurchaseStats() {
        const purchases = this.getAllPurchases();

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
            // Debug: Check window object
            console.log('Checking OCR Engine availability...');
            console.log('window.ocrEngine exists:', !!window.ocrEngine);
            console.log('window.ocrEngine value:', window.ocrEngine);
            
            // Check if OCR engine exists
            if (!window.ocrEngine) {
                console.error('✗ OCR Engine not initialized - window.ocrEngine is:', window.ocrEngine);
                console.error('Available window properties:', Object.keys(window).filter(k => k.includes('ocr')));
                return {
                    success: false,
                    error: 'OCR Engine is not available. Please refresh the page and try again.'
                };
            }

            // Ensure OCR engine is initialized (it will wait if initialization is in progress)
            console.log('✓ OCR Engine found, ensuring it is ready...');
            const initialized = await window.ocrEngine.initialize();
            if (!initialized) {
                return {
                    success: false,
                    error: 'Failed to initialize OCR Engine. Please check your internet connection and try again.'
                };
            }

            // Process image with OCR
            console.log('✓ OCR Engine ready, processing image...');
            const result = await window.ocrEngine.processAndValidate(imageData);

            if (!result.success) {
                return {
                    success: false,
                    error: result.error
                };
            }

            // Get vendor info
            const vendor = this.partyService.getPartyById(vendorId);

            return {
                success: true,
                data: {
                    vendorId,
                    vendorName: vendor?.name || result.data.partyName,
                    date: result.data.date,
                    items: result.data.items,
                    subtotal: result.data.subtotal,
                    tax: result.data.tax,
                    taxPercent: result.data.taxPercent,
                    total: result.data.total,
                    corrections: result.data.corrections,
                    validationSummary: result.data.validationSummary,
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
    getPurchaseImage(id) {
        return this.storage.getImage('purchases', id);
    }

    // Update purchase
    updatePurchase(id, updates) {
        return this.storage.updateItem('purchases', id, updates);
    }

    // Search purchases
    searchPurchases(query) {
        const purchases = this.getAllPurchases();
        const lowerQuery = query.toLowerCase();

        return purchases.filter(p =>
            p.vendorName.toLowerCase().includes(lowerQuery) ||
            p.items.some(item => item.name.toLowerCase().includes(lowerQuery))
        );
    }
}

// Create global instance
window.purchaseService = new PurchaseService();
