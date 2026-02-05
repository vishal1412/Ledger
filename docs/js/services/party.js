// ===================================
// PARTY SERVICE
// ===================================

class PartyService {
    constructor() {
        this.storage = window.storage;
        this.calculator = window.calculator;
    }

    // Create new party
    async createParty(partyData) {
        const party = {
            type: partyData.type, // 'Vendor' or 'Customer'
            name: partyData.name,
            phone: partyData.phone || '',
            address: partyData.address || '',
            openingBalance: this.calculator.parseAmount(partyData.openingBalance) || 0,
            currentBalance: this.calculator.parseAmount(partyData.openingBalance) || 0,
            balanceType: partyData.balanceType, // 'Payable' or 'Receivable'
            createdAt: new Date().toISOString()
        };

        return await this.storage.addItem('parties', party);
    }

    // Get all parties
    async getAllParties() {
        return await this.storage.getData('parties') || [];
    }

    // Get parties by type
    async getPartiesByType(type) {
        return await this.storage.filterItems('parties', party => party.type === type);
    }

    // Get party by ID
    async getPartyById(id) {
        return await this.storage.getItemById('parties', id);
    }

    // Update party
    async updateParty(id, updates) {
        return await this.storage.updateItem('parties', id, updates);
    }

    // Delete party
    async deleteParty(id) {
        // Check if party has transactions
        const transactions = await this.getPartyTransactions(id);
        if (transactions.length > 0) {
            return {
                success: false,
                message: 'Cannot delete party with existing transactions'
            };
        }

        return {
            success: await this.storage.deleteItem('parties', id),
            message: 'Party deleted successfully'
        };
    }

    // Get party transactions (purchases/sales/payments)
    async getPartyTransactions(partyId) {
        const party = await this.getPartyById(partyId);
        if (!party) return [];

        const transactions = [];

        if (party.type === 'Vendor') {
            // Get purchases
            const purchases = await this.storage.filterItems('purchases', p => p.vendorId === partyId);
            purchases.forEach(p => {
                transactions.push({
                    ...p,
                    type: 'purchase',
                    date: p.date,
                    amount: p.total
                });
            });

            // Get payments
            const payments = await this.storage.filterItems('payments', p => p.partyId === partyId && p.partyType === 'Vendor');
            payments.forEach(p => {
                transactions.push({
                    ...p,
                    type: 'payment',
                    date: p.date,
                    amount: p.amount
                });
            });
        } else if (party.type === 'Customer') {
            // Get sales
            const sales = await this.storage.filterItems('sales', s => s.customerId === partyId);
            sales.forEach(s => {
                transactions.push({
                    ...s,
                    type: 'sale',
                    date: s.date,
                    amount: s.total
                });
            });

            // Get payments
            const payments = await this.storage.filterItems('payments', p => p.partyId === partyId && p.partyType === 'Customer');
            payments.forEach(p => {
                transactions.push({
                    ...p,
                    type: 'payment',
                    date: p.date,
                    amount: p.amount
                });
            });
        }

        // Sort by date
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Calculate party balance
    async calculatePartyBalance(partyId) {
        const party = await this.getPartyById(partyId);
        if (!party) return 0;

        let balance = party.openingBalance || 0;
        const transactions = await this.getPartyTransactions(partyId);

        transactions.forEach(txn => {
            if (party.type === 'Vendor') {
                if (txn.type === 'purchase') {
                    balance += txn.amount; // Credit - increases payable
                } else if (txn.type === 'payment') {
                    balance -= txn.amount; // Debit - decreases payable
                }
            } else if (party.type === 'Customer') {
                if (txn.type === 'sale') {
                    balance += txn.amount; // Debit - increases receivable
                } else if (txn.type === 'payment') {
                    balance -= txn.amount; // Credit - decreases receivable
                }
            }
        });

        return this.calculator.roundToTwo(balance);
    }

    // Update party balance
    async updatePartyBalance(partyId) {
        const balance = await this.calculatePartyBalance(partyId);
        return await this.storage.updateItem('parties', partyId, { currentBalance: balance });
    }

    // Search parties
    async searchParties(query) {
        const allParties = await this.getAllParties();
        const lowerQuery = query.toLowerCase();

        return allParties.filter(party =>
            party.name.toLowerCase().includes(lowerQuery) ||
            party.phone.includes(query)
        );
    }

    // Get party statistics
    async getPartyStats(partyId) {
        const party = await this.getPartyById(partyId);
        if (!party) return null;

        const transactions = await this.getPartyTransactions(partyId);
        const balance = await this.calculatePartyBalance(partyId);

        let totalPurchases = 0;
        let totalSales = 0;
        let totalPayments = 0;

        transactions.forEach(txn => {
            if (txn.type === 'purchase') totalPurchases += txn.amount;
            if (txn.type === 'sale') totalSales += txn.amount;
            if (txn.type === 'payment') totalPayments += txn.amount;
        });

        return {
            party,
            currentBalance: balance,
            totalTransactions: transactions.length,
            totalPurchases: this.calculator.roundToTwo(totalPurchases),
            totalSales: this.calculator.roundToTwo(totalSales),
            totalPayments: this.calculator.roundToTwo(totalPayments),
            lastTransaction: transactions[0] || null
        };
    }

    // Get all vendors
    async getVendors() {
        return await this.getPartiesByType('Vendor');
    }

    // Get all customers
    async getCustomers() {
        return await this.getPartiesByType('Customer');
    }
}

// Create global instance
window.partyService = new PartyService();
