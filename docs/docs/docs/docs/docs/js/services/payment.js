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
    async recordVendorPayment(paymentData) {
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
        const savedPayment = await this.storage.addItem('payments', payment);

        // Update vendor balance
        await this.partyService.updatePartyBalance(paymentData.vendorId);

        return {
            success: true,
            payment: savedPayment,
            message: 'Payment recorded successfully'
        };
    }

    // Record customer payment
    async recordCustomerPayment(paymentData) {
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
        const savedPayment = await this.storage.addItem('payments', payment);

        // Update customer balance
        await this.partyService.updatePartyBalance(paymentData.customerId);

        return {
            success: true,
            payment: savedPayment,
            message: 'Payment recorded successfully'
        };
    }

    // Get all payments
    async getAllPayments() {
        return await this.storage.getData('payments') || [];
    }

    // Get payment by ID
    async getPaymentById(id) {
        return await this.storage.getItemById('payments', id);
    }

    // Get payments by party
    async getPaymentsByParty(partyId) {
        return await this.storage.filterItems('payments', p => p.partyId === partyId);
    }

    // Get payments by date range
    async getPaymentsByDateRange(startDate, endDate) {
        return await this.storage.filterItems('payments', p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
        });
    }

    // Get vendor payments
    async getVendorPayments() {
        return await this.storage.filterItems('payments', p => p.partyType === 'Vendor');
    }

    // Get customer payments
    async getCustomerPayments() {
        return await this.storage.filterItems('payments', p => p.partyType === 'Customer');
    }

    // Delete payment
    async deletePayment(id) {
        const payment = await this.getPaymentById(id);
        if (!payment) {
            return { success: false, message: 'Payment not found' };
        }

        // Delete payment
        const deleted = await this.storage.deleteItem('payments', id);

        // Update party balance
        await this.partyService.updatePartyBalance(payment.partyId);

        return {
            success: deleted,
            message: deleted ? 'Payment deleted successfully' : 'Failed to delete payment'
        };
    }

    // Get payment statistics
    async getPaymentStats() {
        const payments = await this.getAllPayments();

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
    async getPaymentModeStats() {
        const payments = await this.getAllPayments();

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
    async updatePayment(id, updates) {
        const updated = await this.storage.updateItem('payments', id, updates);

        if (updated) {
            // Update party balance
            await this.partyService.updatePartyBalance(updated.partyId);
        }

        return updated;
    }

    // Search payments
    async searchPayments(query) {
        const payments = await this.getAllPayments();
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
