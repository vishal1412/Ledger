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
          <button class="btn btn-ghost flex-1" id="manual-btn">✍️ Manual</button>
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

        document.getElementById('manual-btn').addEventListener('click', () => {
            modal.close();
            this.showManualSaleForm(customerId);
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

                // Create sale directly with bill/cash from OCR preview
                const saleResult = await this.salesService.createSale({
                    customerId: customer.id,
                    customerName: customer.name,
                    date: confirmedData.date,
                    items: confirmedData.items,
                    total: confirmedData.total,
                    billAmount: confirmedData.billAmount || confirmedData.total,
                    cashAmount: confirmedData.cashAmount || 0,
                    notes: confirmedData.notes || '',
                    imageData
                });

                if (saleResult.success) {
                    Modal.alert('Success', saleResult.message, 'success');
                    this.render(document.getElementById('main-content'));
                } else {
                    Modal.alert('Error', saleResult.message || 'Failed to create sale', 'danger');
                }
            }
        );
    }

    async showManualSaleForm(customerId) {
        const customer = await this.partyService.getPartyById(customerId);
        const modal = new Modal({
            title: 'Manual Sale Entry',
            size: 'large',
            content: Forms.createManualSaleForm(customer)
        });

        modal.open();

        // Setup item row calculations
        const setupItemRow = (row) => {
            const qtyInput = row.querySelector('[data-field="quantity"]');
            const rateInput = row.querySelector('[data-field="rate"]');
            const amountInput = row.querySelector('[data-field="amount"]');
            const removeBtn = row.querySelector('.remove-item-btn');

            const calculateAmount = () => {
                const qty = parseFloat(qtyInput.value) || 0;
                const rate = parseFloat(rateInput.value) || 0;
                amountInput.value = (qty * rate).toFixed(2);
                updateTotal();
            };

            qtyInput.addEventListener('input', calculateAmount);
            rateInput.addEventListener('input', calculateAmount);

            removeBtn.addEventListener('click', () => {
                const container = document.getElementById('sale-items-container');
                if (container.querySelectorAll('.item-row').length > 1) {
                    row.remove();
                    updateTotal();
                } else {
                    Modal.alert('Error', 'At least one item is required', 'warning');
                }
            });
        };

        // Update total and split
        const updateTotal = () => {
            let total = 0;
            document.querySelectorAll('#sale-items-container .item-row [data-field="amount"]').forEach(input => {
                total += parseFloat(input.value) || 0;
            });
            const totalInput = document.getElementById('sale-total');
            totalInput.value = total.toFixed(2);
            
            // Auto-update bill amount to total if both are zero
            const billInput = document.getElementById('sale-bill-amount');
            const cashInput = document.getElementById('sale-cash-amount');
            if (parseFloat(billInput.value) === 0 && parseFloat(cashInput.value) === 0) {
                billInput.value = total.toFixed(2);
            }
        };

        // Add item button
        document.getElementById('add-sale-item-btn').addEventListener('click', () => {
            const container = document.getElementById('sale-items-container');
            const itemCount = container.querySelectorAll('.item-row').length;
            const newRow = document.createElement('div');
            newRow.className = 'item-row';
            newRow.dataset.itemIndex = itemCount;
            newRow.innerHTML = `
                <input type="text" class="form-input" placeholder="Item name" data-field="name" required />
                <input type="number" class="form-input" placeholder="Qty" data-field="quantity" min="0.01" step="0.01" required />
                <input type="number" class="form-input" placeholder="Rate" data-field="rate" min="0.01" step="0.01" required />
                <input type="number" class="form-input" placeholder="Amount" data-field="amount" readonly />
                <button type="button" class="btn btn-sm btn-ghost remove-item-btn">✕</button>
            `;
            container.appendChild(newRow);
            setupItemRow(newRow);
        });

        // Setup initial row
        setupItemRow(document.querySelector('.item-row'));

        modal.addFooter([
            { text: 'Cancel', className: 'btn btn-ghost', onClick: () => modal.close() },
            {
                text: 'Save Sale',
                className: 'btn btn-success',
                onClick: async () => {
                    const formData = Forms.getManualSaleFormData();

                    // Validate
                    if (!formData.items || formData.items.length === 0) {
                        Modal.alert('Error', 'Please add at least one item', 'warning');
                        return;
                    }

                    if (formData.total <= 0) {
                        Modal.alert('Error', 'Total amount must be greater than 0', 'warning');
                        return;
                    }

                    // Validate bill/cash split
                    if (formData.billAmount + formData.cashAmount !== formData.total) {
                        Modal.alert('Error', 'Bill + Cash amounts must equal Total amount', 'warning');
                        return;
                    }

                    // Create sale
                    const saleResult = await this.salesService.createSale({
                        customerId,
                        customerName: customer.name,
                        date: formData.date,
                        items: formData.items,
                        total: formData.total,
                        billAmount: formData.billAmount,
                        cashAmount: formData.cashAmount,
                        notes: formData.notes
                    });

                    if (saleResult.success) {
                        modal.close();
                        Modal.alert('Success', saleResult.message, 'success');
                        this.render(document.getElementById('main-content'));
                    } else {
                        Modal.alert('Error', saleResult.message || 'Failed to create sale', 'danger');
                    }
                }
            }
        ]);
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
