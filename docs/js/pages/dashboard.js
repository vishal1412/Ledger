// ===================================
// DASHBOARD PAGE
// ===================================

class DashboardPage {
    constructor() {
        this.partyService = window.partyService;
        this.stockService = window.stockService;
        this.purchaseService = window.purchaseService;
        this.salesService = window.salesService;
        this.paymentService = window.paymentService;
        this.calculator = window.calculator;
    }

    // Render dashboard
    async render(container) {
        const stats = await this.getStats();

        container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Business Overview</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-label">Total Vendors</div>
          <div class="stat-value">${stats.totalVendors}</div>
          <div class="stat-change">Payable: ${this.calculator.formatCurrency(stats.totalPayable)}</div>
        </div>

        <div class="stat-card success">
          <div class="stat-label">Total Customers</div>
          <div class="stat-value">${stats.totalCustomers}</div>
          <div class="stat-change">Receivable: ${this.calculator.formatCurrency(stats.totalReceivable)}</div>
        </div>

        <div class="stat-card info">
          <div class="stat-label">Stock Items</div>
          <div class="stat-value">${stats.stockItems}</div>
          <div class="stat-change ${stats.lowStockItems > 0 ? 'negative' : ''}">
            ${stats.lowStockItems > 0 ? `⚠️ ${stats.lowStockItems} Low Stock` : '✓ All Good'}
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-label">Total Purchases</div>
          <div class="stat-value">${this.calculator.formatCurrency(stats.totalPurchaseAmount)}</div>
          <div class="stat-change">${stats.totalPurchases} Transactions</div>
        </div>

        <div class="stat-card success">
          <div class="stat-label">Total Sales</div>
          <div class="stat-value">${this.calculator.formatCurrency(stats.totalSalesAmount)}</div>
          <div class="stat-change">${stats.totalSales} Transactions</div>
        </div>

        <div class="stat-card danger">
          <div class="stat-label">Net Position</div>
          <div class="stat-value ${stats.netPosition >= 0 ? 'text-success' : 'text-danger'}">
            ${this.calculator.formatCurrency(Math.abs(stats.netPosition))}
          </div>
          <div class="stat-change">${stats.netPosition >= 0 ? '↑ Receivable' : '↓ Payable'}</div>
        </div>
      </div>

      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Activity</h3>
          </div>
          <div class="card-body">
            ${await this.renderRecentActivity()}
          </div>
        </div>

        ${stats.lowStockItems > 0 ? `
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">⚠️ Low Stock Alerts</h3>
            </div>
            <div class="card-body">
              ${await this.renderLowStockAlerts()}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    }

    // Get statistics
    async getStats() {
        const vendors = await this.partyService.getVendors();
        const customers = await this.partyService.getCustomers();
        const stockStats = await this.stockService.getStockStats();
        const purchaseStats = await this.purchaseService.getPurchaseStats();
        const salesStats = await this.salesService.getSaleStats();

        let totalPayable = 0;
        for (const v of vendors) {
            totalPayable += await this.partyService.calculatePartyBalance(v.id);
        }

        let totalReceivable = 0;
        for (const c of customers) {
            totalReceivable += await this.partyService.calculatePartyBalance(c.id);
        }

        return {
            totalVendors: vendors.length,
            totalCustomers: customers.length,
            totalPayable: this.calculator.roundToTwo(totalPayable),
            totalReceivable: this.calculator.roundToTwo(totalReceivable),
            stockItems: stockStats.totalItems,
            lowStockItems: stockStats.lowStockItems,
            totalPurchases: purchaseStats.totalPurchases,
            totalPurchaseAmount: purchaseStats.totalAmount,
            totalSales: salesStats.totalSales,
            totalSalesAmount: salesStats.totalAmount,
            netPosition: this.calculator.roundToTwo(totalReceivable - totalPayable)
        };
    }

    // Render recent activity
    async renderRecentActivity() {
        const purchases = (await this.purchaseService.getAllPurchases()).slice(0, 5);
        const sales = (await this.salesService.getAllSales()).slice(0, 5);
        const payments = (await this.paymentService.getAllPayments()).slice(0, 5);

        const activities = [
            ...purchases.map(p => ({ ...p, type: 'purchase', date: p.createdAt })),
            ...sales.map(s => ({ ...s, type: 'sale', date: s.createdAt })),
            ...payments.map(p => ({ ...p, type: 'payment', date: p.createdAt }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

        if (activities.length === 0) {
            return '<div class="empty-state"><p>No recent activity</p></div>';
        }

        return activities.map(activity => {
            const icon = activity.type === 'purchase' ? '🛒' : activity.type === 'sale' ? '💰' : '💵';
            const date = new Date(activity.date).toLocaleDateString();
            const time = new Date(activity.date).toLocaleTimeString();

            return `
        <div class="flex items-center justify-between p-md mb-sm" style="border-bottom: 1px solid var(--gray-200);">
          <div class="flex items-center gap-md">
            <span style="font-size: 1.5rem;">${icon}</span>
            <div>
              <div class="font-medium">
                ${activity.type === 'purchase' ? `Purchase from ${activity.vendorName}` :
                    activity.type === 'sale' ? `Sale to ${activity.customerName}` :
                        `Payment - ${activity.partyName}`}
              </div>
              <div class="text-sm text-gray">${date} ${time}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-lg">
              ${this.calculator.formatCurrency(activity.total || activity.amount)}
            </div>
          </div>
        </div>
      `;
        }).join('');
    }

    // Render low stock alerts
    async renderLowStockAlerts() {
        const lowStockItems = await this.stockService.getLowStockItems();

        return lowStockItems.map(item => `
      <div class="flex items-center justify-between p-md mb-sm" style="border-bottom: 1px solid var(--gray-200);">
        <div>
          <div class="font-medium">${item.name}</div>
          <div class="text-sm text-gray">Current Stock: ${item.closingStock}</div>
        </div>
        <span class="badge badge-warning">Low Stock</span>
      </div>
    `).join('');
    }
}

// Export to window
window.DashboardPage = DashboardPage;
