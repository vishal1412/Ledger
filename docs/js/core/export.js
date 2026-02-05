// ===================================
// EXCEL EXPORT FUNCTIONALITY
// ===================================

class ExcelExporter {
    constructor() {
        this.currency = '₹';
    }

    // Export parties to Excel
    exportParties(parties) {
        const data = parties.map(party => ({
            'Type': party.type,
            'Name': party.name,
            'Phone': party.phone,
            'Address': party.address,
            'Opening Balance': party.openingBalance,
            'Current Balance': party.currentBalance || party.openingBalance,
            'Balance Type': party.balanceType,
            'Created Date': this.formatDate(party.createdAt)
        }));

        this.exportToExcel(data, 'Parties');
    }

    // Export vendor ledger
    exportVendorLedger(vendor, transactions) {
        const data = [];
        let balance = vendor.openingBalance || 0;

        // Add opening balance
        data.push({
            'Date': this.formatDate(vendor.createdAt),
            'Description': 'Opening Balance',
            'Debit': '',
            'Credit': vendor.balanceType === 'Payable' ? balance : '',
            'Balance': balance
        });

        // Add transactions
        transactions.forEach(txn => {
            if (txn.type === 'purchase') {
                balance += txn.amount;
                data.push({
                    'Date': this.formatDate(txn.date),
                    'Description': `Purchase - ${txn.id}`,
                    'Debit': '',
                    'Credit': txn.amount,
                    'Balance': balance
                });
            } else if (txn.type === 'payment') {
                balance -= txn.amount;
                data.push({
                    'Date': this.formatDate(txn.date),
                    'Description': `Payment - ${txn.mode}`,
                    'Debit': txn.amount,
                    'Credit': '',
                    'Balance': balance
                });
            }
        });

        this.exportToExcel(data, `Vendor_${vendor.name}`);
    }

    // Export customer ledger
    exportCustomerLedger(customer, transactions) {
        const data = [];
        let balance = customer.openingBalance || 0;

        // Add opening balance
        data.push({
            'Date': this.formatDate(customer.createdAt),
            'Description': 'Opening Balance',
            'Debit': customer.balanceType === 'Receivable' ? balance : '',
            'Credit': '',
            'Balance': balance
        });

        // Add transactions
        transactions.forEach(txn => {
            if (txn.type === 'sale') {
                balance += txn.amount;
                data.push({
                    'Date': this.formatDate(txn.date),
                    'Description': `Sale - ${txn.id}`,
                    'Debit': txn.amount,
                    'Credit': '',
                    'Bill Amount': txn.billAmount,
                    'Cash Amount': txn.cashAmount,
                    'Balance': balance
                });
            } else if (txn.type === 'payment') {
                balance -= txn.amount;
                data.push({
                    'Date': this.formatDate(txn.date),
                    'Description': `Payment - ${txn.paymentType}`,
                    'Debit': '',
                    'Credit': txn.amount,
                    'Bill Amount': '',
                    'Cash Amount': '',
                    'Balance': balance
                });
            }
        });

        this.exportToExcel(data, `Customer_${customer.name}`);
    }

    // Export stock report
    exportStock(stockItems) {
        const data = stockItems.map(item => ({
            'Item Name': item.name,
            'Opening Stock': item.openingStock,
            'Stock In': item.stockIn,
            'Stock Out': item.stockOut,
            'Closing Stock': item.closingStock,
            'Last Updated': this.formatDate(item.updatedAt)
        }));

        this.exportToExcel(data, 'Stock_Report');
    }

    // Export purchases
    exportPurchases(purchases) {
        const data = purchases.map(purchase => ({
            'Date': this.formatDate(purchase.date),
            'Vendor': purchase.vendorName,
            'Items': purchase.items.length,
            'Amount': purchase.total,
            'Created': this.formatDate(purchase.createdAt)
        }));

        this.exportToExcel(data, 'Purchases');
    }

    // Export sales
    exportSales(sales) {
        const data = sales.map(sale => ({
            'Date': this.formatDate(sale.date),
            'Customer': sale.customerName,
            'Items': sale.items.length,
            'Amount': sale.total,
            'Bill Amount': sale.billAmount,
            'Cash Amount': sale.cashAmount,
            'Created': this.formatDate(sale.createdAt)
        }));

        this.exportToExcel(data, 'Sales');
    }

    // Core export function
    exportToExcel(data, filename) {
        // Create workbook
        const wb = XLSX.utils.book_new();

        // Create worksheet from data
        const ws = XLSX.utils.json_to_sheet(data);

        // Auto-size columns
        const colWidths = this.calculateColumnWidths(data);
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const fullFilename = `${filename}_${timestamp}.xlsx`;

        // Download file
        XLSX.writeFile(wb, fullFilename);
    }

    // Calculate optimal column widths
    calculateColumnWidths(data) {
        if (!data || data.length === 0) return [];

        const keys = Object.keys(data[0]);
        return keys.map(key => {
            const maxLength = Math.max(
                key.length,
                ...data.map(row => String(row[key] || '').length)
            );
            return { wch: Math.min(maxLength + 2, 50) };
        });
    }

    // Format date for display
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN');
    }

    // Export with custom headers and formatting
    exportCustomReport(data, headers, filename) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

        // Style headers
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (!ws[address]) continue;
            ws[address].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: "center" }
            };
        }

        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, `${filename}_${Date.now()}.xlsx`);
    }
}

// Create global instance
window.excelExporter = new ExcelExporter();
