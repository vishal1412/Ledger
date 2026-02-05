// ===================================
// SALES SERVICE
// ===================================

class SalesService {
    constructor() {
        this.storage = window.storage;
        this.calculator = window.calculator;
        this.stockService = window.stockService;
        this.partyService = window.partyService;
    }

    // Create new sale
    async createSale(saleData) {
        // Validate transaction
        const validated = this.calculator.validateTransaction({
            items: saleData.items,
            total: saleData.total
        });

        // Validate bill/cash split
        const splitValidation = this.calculator.validateBillCashSplit(
            saleData.billAmount || 0,
            saleData.cashAmount || 0,
            validated.total
        );

        // Use validated amounts or distribute evenly if not provided
        let billAmount = saleData.billAmount || 0;
        let cashAmount = saleData.cashAmount || 0;

        if (!billAmount && !cashAmount) {
            // If no split provided, default to all as bill
            billAmount = validated.total;
            cashAmount = 0;
        } else if (splitValidation.wasAutoCorrected) {
            // Auto-correct split if needed
            const ratio = billAmount / (billAmount + cashAmount);
            billAmount = this.calculator.roundToTwo(validated.total * ratio);
            cashAmount = this.calculator.roundToTwo(validated.total * (1 - ratio));
        }

        // Create sale record
        const sale = {
            customerId: saleData.customerId,
            customerName: saleData.customerName,
            date: saleData.date || new Date().toISOString(),
            items: validated.items,
            total: validated.total,
            billAmount,
            cashAmount,
            originalTotal: validated.originalTotal,
            totalWasCorrected: validated.totalWasCorrected,
            splitWasCorrected: splitValidation.wasAutoCorrected,
            corrections: validated.corrections,
            hasImage: !!saleData.imageData,
            imageUrl: null,
            ocrData: saleData.ocrData || null,
            notes: saleData.notes || '',
            createdAt: new Date().toISOString()
        };

        // Save sale
        const savedSale = this.storage.addItem('sales', sale);

        // Save image if provided
        if (saleData.imageData) {
            const imageInfo = await this.storage.saveImage(
                saleData.imageData,
                'sales',
                savedSale.id
            );
            if (imageInfo) {
                savedSale.imageUrl = imageInfo.url;
                this.storage.updateItem('sales', savedSale.id, { imageUrl: imageInfo.url });
            }
        }

        // Update stock
        this.stockService.updateStockOnSale(validated.items, savedSale.id);

        // Update customer balance
        this.partyService.updatePartyBalance(saleData.customerId);

        return {
            success: true,
            sale: savedSale,
            message: `Sale created successfully${validated.corrections.totalCorrections > 0 ? ' with corrections' : ''}`
        };
    }

    // Get all sales
    getAllSales() {
        return this.storage.getData('sales') || [];
    }

    // Get sale by ID
    getSaleById(id) {
        return this.storage.getItemById('sales', id);
    }

    // Get sales by customer
    getSalesByCustomer(customerId) {
        return this.storage.filterItems('sales', s => s.customerId === customerId);
    }

    // Get sales by date range
    getSalesByDateRange(startDate, endDate) {
        return this.storage.filterItems('sales', s => {
            const saleDate = new Date(s.date);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
        });
    }

    // Delete sale
    deleteSale(id) {
        const sale = this.getSaleById(id);
        if (!sale) {
            return { success: false, message: 'Sale not found' };
        }

        // Reverse stock updates
        sale.items.forEach(item => {
            const stockItem = this.stockService.getOrCreateStockItem(item.name);
            const updatedStock = {
                stockOut: stockItem.stockOut - item.quantity,
                closingStock: stockItem.closingStock + item.quantity,
                updatedAt: new Date().toISOString()
            };
            this.storage.updateItem('stock', stockItem.id, updatedStock);
        });

        // Delete sale
        const deleted = this.storage.deleteItem('sales', id);

        // Update customer balance
        this.partyService.updatePartyBalance(sale.customerId);

        return {
            success: deleted,
            message: deleted ? 'Sale deleted successfully' : 'Failed to delete sale'
        };
    }

    // Get sale statistics
    getSaleStats() {
        const sales = this.getAllSales();

        return {
            totalSales: sales.length,
            totalAmount: this.calculator.roundToTwo(
                sales.reduce((sum, s) => sum + s.total, 0)
            ),
            totalBillAmount: this.calculator.roundToTwo(
                sales.reduce((sum, s) => sum + s.billAmount, 0)
            ),
            totalCashAmount: this.calculator.roundToTwo(
                sales.reduce((sum, s) => sum + s.cashAmount, 0)
            ),
            totalCorrections: sales.reduce((sum, s) => sum + (s.corrections?.totalCorrections || 0), 0),
            salesWithImages: sales.filter(s => s.hasImage).length
        };
    }

    // Process OCR sale
    async processSaleFromOCR(imageData, customerId) {
        try {
            // Debug: Check OCR Engine availability
            console.log('Sales: Checking OCR Engine availability...');
            console.log('Sales: window.ocrEngine exists:', !!window.ocrEngine);
            
            // Check if OCR engine exists
            if (!window.ocrEngine) {
                console.error('✗ Sales: OCR Engine not initialized');
                return {
                    success: false,
                    error: 'OCR Engine is not available. Please refresh the page and try again.'
                };
            }

            // Ensure OCR engine is initialized
            console.log('✓ Sales: OCR Engine found, ensuring it is ready...');
            const initialized = await window.ocrEngine.initialize();
            if (!initialized) {
                return {
                    success: false,
                    error: 'Failed to initialize OCR Engine. Please check your internet connection and try again.'
                };
            }

            // Process image with OCR
            console.log('✓ Sales: OCR Engine ready, processing image...');
            const result = await window.ocrEngine.processAndValidate(imageData);

            if (!result.success) {
                return {
                    success: false,
                    error: result.error
                };
            }

            // Get customer info
            const customer = this.partyService.getPartyById(customerId);

            return {
                success: true,
                data: {
                    customerId,
                    customerName: customer?.name || result.data.partyName,
                    date: result.data.date,
                    items: result.data.items,
                    total: result.data.total,
                    billAmount: result.data.total, // Default to all bill
                    cashAmount: 0,
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
            console.error('Error processing OCR sale:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get sale image
    getSaleImage(id) {
        return this.storage.getImage('sales', id);
    }

    // Update sale
    updateSale(id, updates) {
        return this.storage.updateItem('sales', id, updates);
    }

    // Search sales
    searchSales(query) {
        const sales = this.getAllSales();
        const lowerQuery = query.toLowerCase();

        return sales.filter(s =>
            s.customerName.toLowerCase().includes(lowerQuery) ||
            s.items.some(item => item.name.toLowerCase().includes(lowerQuery))
        );
    }

    // Get customer bill and cash pending
    getCustomerPending(customerId) {
        const customer = this.partyService.getPartyById(customerId);
        if (!customer) return null;

        const sales = this.getSalesByCustomer(customerId);
        const payments = this.storage.filterItems('payments', p =>
            p.partyId === customerId && p.partyType === 'Customer'
        );

        let totalBill = sales.reduce((sum, s) => sum + s.billAmount, 0);
        let totalCash = sales.reduce((sum, s) => sum + s.cashAmount, 0);

        payments.forEach(p => {
            if (p.paymentType === 'Bill') {
                totalBill -= p.amount;
            } else if (p.paymentType === 'Cash') {
                totalCash -= p.amount;
            }
        });

        return {
            billPending: this.calculator.roundToTwo(totalBill),
            cashPending: this.calculator.roundToTwo(totalCash),
            totalPending: this.calculator.roundToTwo(totalBill + totalCash)
        };
    }
}

// Create global instance
window.salesService = new SalesService();
