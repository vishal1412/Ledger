// ===================================
// PARTY SERVICE
// ===================================

class PartyService {
    constructor() {
        this.storage = window.storage;
        this.calculator = window.calculator;
    }

    // Create new party
    createParty(partyData) {
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

        return this.storage.addItem('parties', party);
    }

    // Get all parties
    getAllParties() {
        return this.storage.getData('parties') || [];
    }

    // Get parties by type
    getPartiesByType(type) {
        return this.storage.filterItems('parties', party => party.type === type);
    }

    // Get party by ID
    getPartyById(id) {
        return this.storage.getItemById('parties', id);
    }

    // Update party
    updateParty(id, updates) {
        return this.storage.updateItem('parties', id, updates);
    }

    // Delete party
    deleteParty(id) {
        // Check if party has transactions
        const transactions = this.getPartyTransactions(id);
        if (transactions.length > 0) {
            return {
                success: false,
                message: 'Cannot delete party with existing transactions'
            };
        }

        return {
            success: this.storage.deleteItem('parties', id),
            message: 'Party deleted successfully'
        };
    }

    // Get party transactions (purchases/sales/payments)
    getPartyTransactions(partyId) {
        const party = this.getPartyById(partyId);
        if (!party) return [];

        const transactions = [];

        if (party.type === 'Vendor') {
            // Get purchases
            const purchases = this.storage.filterItems('purchases', p => p.vendorId === partyId);
            purchases.forEach(p => {
                transactions.push({
                    ...p,
                    type: 'purchase',
                    date: p.date,
                    amount: p.total
                });
            });

            // Get payments
            const payments = this.storage.filterItems('payments', p => p.partyId === partyId && p.partyType === 'Vendor');
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
            const sales = this.storage.filterItems('sales', s => s.customerId === partyId);
            sales.forEach(s => {
                transactions.push({
                    ...s,
                    type: 'sale',
                    date: s.date,
                    amount: s.total
                });
            });

            // Get payments
            const payments = this.storage.filterItems('payments', p => p.partyId === partyId && p.partyType === 'Customer');
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
    calculatePartyBalance(partyId) {
        const party = this.getPartyById(partyId);
        if (!party) {
            console.warn('Party not found for balance calculation:', partyId);
            return 0;
        }

        let balance = party.openingBalance || 0;
        const transactions = this.getPartyTransactions(partyId);

        console.log(`Calculating balance for ${party.name} (${party.type}):`, {
            openingBalance: balance,
            transactions: transactions.length
        });

        transactions.forEach(txn => {
            if (party.type === 'Vendor') {
                if (txn.type === 'purchase') {
                    balance += txn.amount; // Credit - increases payable
                    console.log(`  + Purchase: ${txn.amount}, New balance: ${balance}`);
                } else if (txn.type === 'payment') {
                    balance -= txn.amount; // Debit - decreases payable
                    console.log(`  - Payment: ${txn.amount}, New balance: ${balance}`);
                }
            } else if (party.type === 'Customer') {
                if (txn.type === 'sale') {
                    balance += txn.amount; // Debit - increases receivable
                    console.log(`  + Sale: ${txn.amount}, New balance: ${balance}`);
                } else if (txn.type === 'payment') {
                    balance -= txn.amount; // Credit - decreases receivable
                    console.log(`  - Payment: ${txn.amount}, New balance: ${balance}`);
                }
            }
        });

        const finalBalance = this.calculator.roundToTwo(balance);
        console.log(`Final balance for ${party.name}: ${finalBalance}`);
        return finalBalance;
    }

    // Update party balance
    updatePartyBalance(partyId) {
        console.log('Updating party balance for:', partyId);
        const balance = this.calculatePartyBalance(partyId);
        const result = this.storage.updateItem('parties', partyId, { currentBalance: balance });
        console.log('Balance update result:', result);
        return result;
    }

    // Search parties
    searchParties(query) {
        const allParties = this.getAllParties();
        const lowerQuery = query.toLowerCase();

        return allParties.filter(party =>
            party.name.toLowerCase().includes(lowerQuery) ||
            party.phone.includes(query)
        );
    }

    // Get party statistics
    getPartyStats(partyId) {
        const party = this.getPartyById(partyId);
        if (!party) return null;

        const transactions = this.getPartyTransactions(partyId);
        const balance = this.calculatePartyBalance(partyId);

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
    getVendors() {
        return this.getPartiesByType('Vendor');
    }

    // Get all customers
    getCustomers() {
        return this.getPartiesByType('Customer');
    }
}

// Create global instance
window.partyService = new PartyService();
