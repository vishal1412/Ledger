// ===================================
// PAYMENT SERVICE
// ===================================

class PaymentService {
    constructor() {
        this.storage = window.storage;
        this.calculator = window.calculator;
        this.partyService = window.partyService;
    }

    // Record vendor payment
    recordVendorPayment(paymentData) {
        const payment = {
            partyId: paymentData.vendorId,
            partyType: 'Vendor',
            partyName: paymentData.vendorName,
            amount: this.calculator.parseAmount(paymentData.amount),
            paymentMode: paymentData.paymentMode, // 'Cash' or 'Bank'
            date: paymentData.date || new Date().toISOString(),
            notes: paymentData.notes || '',
            createdAt: new Date().toISOString()
        };

        // Save payment
        const savedPayment = this.storage.addItem('payments', payment);

        // Update vendor balance
        this.partyService.updatePartyBalance(paymentData.vendorId);

        return {
            success: true,
            payment: savedPayment,
            message: 'Payment recorded successfully'
        };
    }

    // Record customer payment
    recordCustomerPayment(paymentData) {
        const payment = {
            partyId: paymentData.customerId,
            partyType: 'Customer',
            partyName: paymentData.customerName,
            amount: this.calculator.parseAmount(paymentData.amount),
            paymentType: paymentData.paymentType, // 'Bill' or 'Cash'
            paymentMode: paymentData.paymentMode, // 'Cash' or 'Bank'
            date: paymentData.date || new Date().toISOString(),
            notes: paymentData.notes || '',
            createdAt: new Date().toISOString()
        };

        // Save payment
        const savedPayment = this.storage.addItem('payments', payment);

        // Update customer balance
        this.partyService.updatePartyBalance(paymentData.customerId);

        return {
            success: true,
            payment: savedPayment,
            message: 'Payment recorded successfully'
        };
    }

    // Get all payments
    getAllPayments() {
        return this.storage.getData('payments') || [];
    }

    // Get payment by ID
    getPaymentById(id) {
        return this.storage.getItemById('payments', id);
    }

    // Get payments by party
    getPaymentsByParty(partyId) {
        return this.storage.filterItems('payments', p => p.partyId === partyId);
    }

    // Get payments by date range
    getPaymentsByDateRange(startDate, endDate) {
        return this.storage.filterItems('payments', p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
        });
    }

    // Get vendor payments
    getVendorPayments() {
        return this.storage.filterItems('payments', p => p.partyType === 'Vendor');
    }

    // Get customer payments
    getCustomerPayments() {
        return this.storage.filterItems('payments', p => p.partyType === 'Customer');
    }

    // Delete payment
    deletePayment(id) {
        const payment = this.getPaymentById(id);
        if (!payment) {
            return { success: false, message: 'Payment not found' };
        }

        // Delete payment
        const deleted = this.storage.deleteItem('payments', id);

        // Update party balance
        this.partyService.updatePartyBalance(payment.partyId);

        return {
            success: deleted,
            message: deleted ? 'Payment deleted successfully' : 'Failed to delete payment'
        };
    }

    // Get payment statistics
    getPaymentStats() {
        const payments = this.getAllPayments();

        const vendorPayments = payments.filter(p => p.partyType === 'Vendor');
        const customerPayments = payments.filter(p => p.partyType === 'Customer');

        return {
            totalPayments: payments.length,
            vendorPaymentsCount: vendorPayments.length,
            customerPaymentsCount: customerPayments.length,
            totalVendorPayments: this.calculator.roundToTwo(
                vendorPayments.reduce((sum, p) => sum + p.amount, 0)
            ),
            totalCustomerPayments: this.calculator.roundToTwo(
                customerPayments.reduce((sum, p) => sum + p.amount, 0)
            ),
            cashPayments: payments.filter(p => p.paymentMode === 'Cash').length,
            bankPayments: payments.filter(p => p.paymentMode === 'Bank').length
        };
    }

    // Get payment mode statistics
    getPaymentModeStats() {
        const payments = this.getAllPayments();

        return {
            cash: {
                count: payments.filter(p => p.paymentMode === 'Cash').length,
                amount: this.calculator.roundToTwo(
                    payments.filter(p => p.paymentMode === 'Cash').reduce((sum, p) => sum + p.amount, 0)
                )
            },
            bank: {
                count: payments.filter(p => p.paymentMode === 'Bank').length,
                amount: this.calculator.roundToTwo(
                    payments.filter(p => p.paymentMode === 'Bank').reduce((sum, p) => sum + p.amount, 0)
                )
            }
        };
    }

    // Update payment
    updatePayment(id, updates) {
        const updated = this.storage.updateItem('payments', id, updates);

        if (updated) {
            // Update party balance
            this.partyService.updatePartyBalance(updated.partyId);
        }

        return updated;
    }

    // Search payments
    searchPayments(query) {
        const payments = this.getAllPayments();
        const lowerQuery = query.toLowerCase();

        return payments.filter(p =>
            p.partyName.toLowerCase().includes(lowerQuery) ||
            p.notes.toLowerCase().includes(lowerQuery)
        );
    }

    // Get total paid to vendor
    getTotalPaidToVendor(vendorId) {
        const payments = this.getPaymentsByParty(vendorId);
        return this.calculator.roundToTwo(
            payments.reduce((sum, p) => sum + p.amount, 0)
        );
    }

    // Get total received from customer
    getTotalReceivedFromCustomer(customerId) {
        const payments = this.getPaymentsByParty(customerId);
        return this.calculator.roundToTwo(
            payments.reduce((sum, p) => sum + p.amount, 0)
        );
    }
}

// Create global instance
window.paymentService = new PaymentService();
