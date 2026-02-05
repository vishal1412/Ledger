// ===================================
// STOCK PAGE
// ===================================

class StockPage {
    constructor() {
        this.stockService = window.stockService;
        this.calculator = window.calculator;
    }

    async render(container) {
        const stock = await this.stockService.getAllStock();
        const stats = await this.stockService.getStockStats();

        container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">📦 Stock Management</h1>
          <p class="page-subtitle">Auto-updated from purchases and sales</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline" id="export-stock-btn">📊 Export Excel</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-label">Total Items</div>
          <div class="stat-value">${stats.totalItems}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">Stock In</div>
          <div class="stat-value">${stats.totalStockIn}</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">Stock Out</div>
          <div class="stat-value">${stats.totalStockOut}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">Closing Stock</div>
          <div class="stat-value">${stats.totalClosingStock}</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">Low Stock Alerts</div>
          <div class="stat-value">${stats.lowStockItems}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Stock Items</h3>
          <input type="text" class="form-input" id="search-stock" 
                 placeholder="Search items..." style="max-width: 300px;" />
        </div>
        <div class="card-body">
          ${this.renderStockTable(stock)}
        </div>
      </div>
    `;

        this.setupEventListeners();
    }

    renderStockTable(stock) {
        if (stock.length === 0) {
            return `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3 class="empty-state-title">No Stock Items</h3>
          <p class="empty-state-description">Stock is auto-updated when you make purchases or sales</p>
        </div>
      `;
        }

        return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Opening Stock</th>
              <th>Stock In</th>
              <th>Stock Out</th>
              <th>Closing Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${stock.map(item => {
            const isLowStock = item.closingStock <= this.stockService.lowStockThreshold;
            const isOutOfStock = item.closingStock <= 0;

            return `
                <tr>
                  <td class="font-medium">${item.name}</td>
                  <td>${item.openingStock}</td>
                  <td class="text-success">${item.stockIn}</td>
                  <td class="text-danger">${item.stockOut}</td>
                  <td class="font-bold">${item.closingStock}</td>
                  <td>
                    ${isOutOfStock ? '<span class="badge badge-danger">Out of Stock</span>' :
                    isLowStock ? '<span class="badge badge-warning">Low Stock</span>' :
                        '<span class="badge badge-success">Good</span>'}
                  </td>
                  <td>
                    <button class="btn btn-sm btn-ghost view-movement-btn" data-id="${item.id}">
                      Movements
                    </button>
                  </td>
                </tr>
              `;
        }).join('')}
          </tbody>
        </table>
      </div>
    `;
    }

    setupEventListeners() {
        // Export button
        const exportBtn = document.getElementById('export-stock-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                const stock = await this.stockService.getAllStock();
                window.excelExporter.exportStock(stock);
                Modal.alert('Success', 'Stock exported to Excel successfully', 'success');
            });
        }

        // Search
        const searchInput = document.getElementById('search-stock');
        if (searchInput) {
            searchInput.addEventListener('input', async (e) => {
                const query = e.target.value;
                const stock = query ? await this.stockService.searchStock(query) : await this.stockService.getAllStock();
                const tableContainer = document.querySelector('.card-body');
                tableContainer.innerHTML = this.renderStockTable(stock);
                this.setupTableListeners();
            });
        }

        this.setupTableListeners();
    }

    setupTableListeners() {
        // View movements
        document.querySelectorAll('.view-movement-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.showMovementHistory(id);
            });
        });
    }

    async showMovementHistory(stockId) {
        const item = await this.stockService.getStockById(stockId);
        const movements = await this.stockService.getStockMovements(stockId);

        const modal = new Modal({
            title: `Stock Movements - ${item.name}`,
            size: 'large',
            content: `
        <div class="stats-grid mb-lg">
          <div class="stat-card success">
            <div class="stat-label">Total In</div>
            <div class="stat-value">${item.stockIn}</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-label">Total Out</div>
            <div class="stat-value">${item.stockOut}</div>
          </div>
          <div class="stat-card primary">
            <div class="stat-label">Closing Stock</div>
            <div class="stat-value">${item.closingStock}</div>
          </div>
        </div>

        <h4 style="margin-bottom: 1rem;">Movement History</h4>
        ${movements.length > 0 ? `
          <div style="max-height: 400px; overflow-y: auto;">
            ${movements.map(movement => `
              <div class="flex items-center justify-between p-md mb-sm" style="border-bottom: 1px solid var(--gray-200);">
                <div>
                  <div class="font-medium">
                    <span class="badge ${movement.type === 'IN' ? 'badge-success' : 'badge-danger'}">
                      ${movement.type}
                    </span>
                    ${movement.reference}
                  </div>
                  <div class="text-sm text-gray">${new Date(movement.date).toLocaleString()}</div>
                </div>
                <div class="font-bold ${movement.type === 'IN' ? 'text-success' : 'text-danger'}">
                  ${movement.type === 'IN' ? '+' : '-'}${movement.quantity}
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-gray">No movements recorded yet</p>'}
      `
        });

        modal.open();
    }
}

window.StockPage = StockPage;
