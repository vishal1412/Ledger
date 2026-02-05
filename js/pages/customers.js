// ===================================
// CUSTOMERS (SALES & PAYMENT) PAGE
// ===================================

class CustomersPage {
    constructor() {
        this.partyService = window.partyService;
        this.salesService = window.salesService;
        this.paymentService = window.paymentService;
        this.calculator = window.calculator;
    }

    async render(container) {
        const customers = await this.partyService.getCustomers();
        const salesStats = await this.salesService.getSaleStats();

        let totalReceivable = 0;
        for (const c of customers) {
            totalReceivable += await this.partyService.calculatePartyBalance(c.id);
        }

        container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">🧾 Customers</h1>
          <p class="page-subtitle">Sales & Receivable Management</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="add-sale-btn">📸 Add Sale</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card success">
          <div class="stat-label">Total Customers</div>
          <div class="stat-value">${customers.length}</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">Total Receivable</div>
          <div class="stat-value">${this.calculator.formatCurrency(totalReceivable)}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">Total Sales</div>
          <div class="stat-value">${this.calculator.formatCurrency(salesStats.totalAmount)}</div>
          <div class="stat-change">${salesStats.totalSales} Transactions</div>
        </div>
        <div class="stat-card primary">
          <div class="stat-label">Bill Pending</div>
          <div class="stat-value">${this.calculator.formatCurrency(salesStats.totalBillAmount)}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">Cash Pending</div>
          <div class="stat-value">${this.calculator.formatCurrency(salesStats.totalCashAmount)}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Customer List</h3>
        </div>
        <div class="card-body">${await this.renderCustomersList(customers)}</div>
      </div>
    `;

        this.setupEventListeners();
    }

    async renderCustomersList(customers) {
        if (customers.length === 0) {
            return '<div class="empty-state"><p>No customers yet. Add customers from Party Master.</p></div>';
        }

        const rows = [];
        for (const customer of customers) {
            const balance = await this.partyService.calculatePartyBalance(customer.id);
            const pending = await this.salesService.getCustomerPending(customer.id);
            const sales = await this.salesService.getSalesByCustomer(customer.id);
            const totalSales = sales.reduce((sum, s) => sum + s.total, 0);

            rows.push(`
                <tr>
                  <td class="font-medium">${customer.name}</td>
                  <td>${this.calculator.formatCurrency(totalSales)}</td>
                  <td class="text-warning">${this.calculator.formatCurrency(pending?.billPending || 0)}</td>
                  <td class="text-info">${this.calculator.formatCurrency(pending?.cashPending || 0)}</td>
                  <td class="font-bold text-success">${this.calculator.formatCurrency(balance)}</td>
                  <td>
                    <button class="btn btn-sm btn-outline add-customer-sale-btn" data-id="${customer.id}">+ Sale</button>
                    <button class="btn btn-sm btn-success receive-payment-btn" data-id="${customer.id}">💵 Receive</button>
                    <button class="btn btn-sm btn-ghost view-ledger-btn" data-id="${customer.id}">Ledger</button>
                  </td>
                </tr>
              `);
        }

        return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Total Sales</th>
              <th>Bill Due</th>
              <th>Cash Due</th>
              <th>Total Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join('')}
          </tbody>
        </table>
      </div>
    `;
    }

    setupEventListeners() {
        const addSaleBtn = document.getElementById('add-sale-btn');
        if (addSaleBtn) {
            addSaleBtn.addEventListener('click', () => this.showCustomerSelectionModal());
        }

        document.querySelectorAll('.add-customer-sale-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showSaleInputModal(e.target.dataset.id));
        });

        document.querySelectorAll('.receive-payment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showPaymentModal(e.target.dataset.id));
        });

        document.querySelectorAll('.view-ledger-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showCustomerLedger(e.target.dataset.id));
        });
    }

    showCustomerSelectionModal() {
        this.partyService.getCustomers().then(customers => {
            const modal = new Modal({
                title: 'Select Customer',
                content: `
        <div class="form-group">
          <label class="form-label">Choose Customer</label>
          <select class="form-select" id="customer-select">
            ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
      `
            });

            modal.open();
            modal.addFooter([
                { text: 'Cancel', className: 'btn btn-ghost', onClick: () => modal.close() },
                {
                    text: 'Next', className: 'btn btn-primary', onClick: () => {
                        const customerId = document.getElementById('customer-select').value;
                        modal.close();
                        this.showSaleInputModal(customerId);
                    }
                }
            ]);
        });
    }

    showSaleInputModal(customerId) {
        const modal = new Modal({
            title: 'Add Sale',
            content: `
        <div class="flex gap-md">
          <button class="btn btn-primary flex-1" id="camera-btn">📸 Camera</button>
          <button class="btn btn-outline flex-1" id="upload-btn">📁 Upload</button>
        </div>
      `
        });

        modal.open();

        document.getElementById('camera-btn').addEventListener('click', () => {
            modal.close();
            CameraCapture.openCameraModal(
                async (imageData) => await this.processSaleOCR(customerId, imageData),
                (error) => Modal.alert('Error', 'Camera failed: ' + error.message, 'danger')
            );
        });

        document.getElementById('upload-btn').addEventListener('click', () => {
            modal.close();
            CameraCapture.openFileUpload().then(imageData =>
                this.processSaleOCR(customerId, imageData)
            );
        });
    }

    async processSaleOCR(customerId, imageData) {
        const loadingModal = new Modal({ title: 'Processing...' });
        loadingModal.open();
        loadingModal.showLoading('Processing image with OCR...');

        const result = await this.salesService.processSaleFromOCR(imageData, customerId);
        loadingModal.close();

        if (!result.success) {
            Modal.alert('Error', result.error, 'danger');
            return;
        }

        OCRPreview.showInModal(
            imageData,
            result.data,
            async (confirmedData) => {
                const customer = await this.partyService.getPartyById(customerId);

                // Show bill/cash split modal
                this.showBillCashSplitModal(confirmedData, customer, imageData);
            }
        );
    }

    showBillCashSplitModal(saleData, customer, imageData) {
        const modal = new Modal({
            title: 'Split Bill & Cash',
            content: `
        <div class="alert alert-info">
          Total Amount: ${this.calculator.formatCurrency(saleData.total)}
        </div>
        <div class="form-group">
          <label class="form-label">Bill Amount</label>
          <input type="number" step="0.01" class="form-input" id="bill-amount" 
                 value="${saleData.total}" />
        </div>
        <div class="form-group">
          <label class="form-label">Cash Amount</label>
          <input type="number" step="0.01" class="form-input" id="cash-amount" value="0" />
        </div>
      `
        });

        modal.open();
        modal.addFooter([
            { text: 'Cancel', className: 'btn btn-ghost', onClick: () => modal.close() },
            {
                text: 'Save Sale', className: 'btn btn-success', onClick: async () => {
                    const billAmount = parseFloat(document.getElementById('bill-amount').value) || 0;
                    const cashAmount = parseFloat(document.getElementById('cash-amount').value) || 0;

                    const saleResult = await this.salesService.createSale({
                        ...saleData,
                        customerId: customer.id,
                        customerName: customer.name,
                        billAmount,
                        cashAmount,
                        imageData
                    });

                    modal.close();
                    if (saleResult.success) {
                        Modal.alert('Success', saleResult.message, 'success');
                        this.render(document.getElementById('main-content'));
                    }
                }
            }
        ]);
    }

    async showPaymentModal(customerId) {
        const customer = await this.partyService.getPartyById(customerId);
        const modal = new Modal({
            title: 'Receive Payment',
            content: Forms.createCustomerPaymentForm(customer)
        });

        modal.open();
        modal.addFooter([
            { text: 'Cancel', className: 'btn btn-ghost', onClick: () => modal.close() },
            {
                text: 'Record Payment', className: 'btn btn-success', onClick: () => {
                    const data = Forms.getPaymentFormData();
                    this.paymentService.recordCustomerPayment({
                        ...data,
                        customerId,
                        customerName: customer.name
                    });
                    modal.close();
                    Modal.alert('Success', 'Payment recorded successfully', 'success');
                    this.render(document.getElementById('main-content'));
                }
            }
        ]);
    }

    async showCustomerLedger(customerId) {
        const stats = await this.partyService.getPartyStats(customerId);
        const transactions = await this.partyService.getPartyTransactions(customerId);
        const pending = await this.salesService.getCustomerPending(customerId);

        const modal = new Modal({
            title: `Customer Ledger - ${stats.party.name}`,
            size: 'large',
            content: `
        <div class="stats-grid mb-lg">
          <div class="stat-card success">
            <div class="stat-label">Total Receivable</div>
            <div class="stat-value">${this.calculator.formatCurrency(stats.currentBalance)}</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-label">Bill Pending</div>
            <div class="stat-value">${this.calculator.formatCurrency(pending.billPending)}</div>
          </div>
          <div class="stat-card info">
            <div class="stat-label">Cash Pending</div>
            <div class="stat-value">${this.calculator.formatCurrency(pending.cashPending)}</div>
          </div>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
          ${transactions.map(txn => `
            <div class="ledger-entry ${txn.type === 'sale' ? 'debit' : 'credit'}">
              <div class="ledger-date">${new Date(txn.date).toLocaleDateString()}</div>
              <div class="ledger-description">${txn.type === 'sale' ? 'Sale' : 'Payment'}</div>
              <div class="ledger-amount ${txn.type === 'sale' ? 'debit' : 'credit'}">
                ${this.calculator.formatCurrency(txn.amount)}
              </div>
            </div>
          `).join('')}
        </div>
      `
        });

        modal.open();
    }
}

window.CustomersPage = CustomersPage;
