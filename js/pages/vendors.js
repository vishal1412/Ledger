// ===================================
// VENDORS (PURCHASE & PAYMENT) PAGE
// Due to file size constraints, this is a condensed version
// ===================================

class VendorsPage {
  constructor() {
    this.partyService = window.partyService;
    this.purchaseService = window.purchaseService;
    this.paymentService = window.paymentService;
    this.calculator = window.calculator;
  }

  async render(container) {
    const vendors = await this.partyService.getVendors();
    const purchaseStats = await this.purchaseService.getPurchaseStats();

    let totalPayable = 0;
    for (const v of vendors) {
      totalPayable += await this.partyService.calculatePartyBalance(v.id);
    }

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">🏭 Vendors</h1>
          <p class="page-subtitle">Purchase & Payable Management</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="add-purchase-btn">📸 Add Purchase</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-label">Total Vendors</div>
          <div class="stat-value">${vendors.length}</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">Total Payable</div>
          <div class="stat-value">${this.calculator.formatCurrency(totalPayable)}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">Total Purchases</div>
          <div class="stat-value">${this.calculator.formatCurrency(purchaseStats.totalAmount)}</div>
          <div class="stat-change">${purchaseStats.totalPurchases} Transactions</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Vendor List</h3>
        </div>
        <div class="card-body">${await this.renderVendorsList(vendors)}</div>
      </div>
    `;

    this.setupEventListeners();
  }

  async renderVendorsList(vendors) {
    if (vendors.length === 0) {
      return '<div class="empty-state"><p>No vendors yet. Add vendors from Party Master.</p></div>';
    }

    const rows = [];
    for (const vendor of vendors) {
      const balance = await this.partyService.calculatePartyBalance(vendor.id);
      const purchases = await this.purchaseService.getPurchasesByVendor(vendor.id);
      const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);

      rows.push(`
        <tr>
          <td class="font-medium">${vendor.name}</td>
          <td>${this.calculator.formatCurrency(totalPurchases)}</td>
          <td class="font-bold text-danger">${this.calculator.formatCurrency(balance)}</td>
          <td>
            <button class="btn btn-sm btn-outline add-vendor-purchase-btn" data-id="${vendor.id}">+ Purchase</button>
            <button class="btn btn-sm btn-success add-payment-btn" data-id="${vendor.id}">💵 Payment</button>
            <button class="btn btn-sm btn-ghost view-ledger-btn" data-id="${vendor.id}">Ledger</button>
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
              <th>Total Purchases</th>
              <th>Payable</th>
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
    // Add purchase (with vendor selection)
    const addPurchaseBtn = document.getElementById('add-purchase-btn');
    if (addPurchaseBtn) {
      addPurchaseBtn.addEventListener('click', () => this.showVendorSelectionModal());
    }

    // Individual vendor purchase buttons
    document.querySelectorAll('.add-vendor-purchase-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const vendorId = e.target.dataset.id;
        this.showPurchaseInputModal(vendorId);
      });
    });

    // Payment buttons
    document.querySelectorAll('.add-payment-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const vendorId = e.target.dataset.id;
        this.showPaymentModal(vendorId);
      });
    });

    // View ledger buttons
    document.querySelectorAll('.view-ledger-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const vendorId = e.target.dataset.id;
        this.showVendorLedger(vendorId);
      });
    });
  }

  showVendorSelectionModal() {
    this.partyService.getVendors().then(vendors => {
      const modal = new Modal({
        title: 'Select Vendor',
        content: `
          <div class="form-group">
            <label class="form-label">Choose Vendor</label>
            <select class="form-select" id="vendor-select">
              ${vendors.map(v => `<option value="${v.id}">${v.name}</option>`).join('')}
            </select>
          </div>
        `
      });

      modal.open();
      modal.addFooter([
        { text: 'Cancel', className: 'btn btn-ghost', onClick: () => modal.close() },
        {
          text: 'Next', className: 'btn btn-primary', onClick: () => {
            const vendorId = document.getElementById('vendor-select').value;
            modal.close();
            this.showPurchaseInputModal(vendorId);
          }
        }
      ]);
    });
  }

  showPurchaseInputModal(vendorId) {
    const modal = new Modal({
      title: 'Add Purchase',
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
      this.capturePurchasePhoto(vendorId);
    });

    document.getElementById('upload-btn').addEventListener('click', () => {
      modal.close();
      this.uploadPurchasePhoto(vendorId);
    });

    document.getElementById('manual-btn').addEventListener('click', () => {
      modal.close();
      this.showManualPurchaseForm(vendorId);
    });
  }

  async capturePurchasePhoto(vendorId) {
    CameraCapture.openCameraModal(
      async (imageData) => {
        await this.processPurchaseOCR(vendorId, imageData);
      },
      (error) => {
        Modal.alert('Error', 'Camera access failed: ' + error.message, 'danger');
      }
    );
  }

  async uploadPurchasePhoto(vendorId) {
    try {
      const imageData = await CameraCapture.openFileUpload();
      await this.processPurchaseOCR(vendorId, imageData);
    } catch (error) {
      Modal.alert('Error', 'File upload failed', 'danger');
    }
  }

  async showManualPurchaseForm(vendorId) {
    const vendor = await this.partyService.getPartyById(vendorId);
    const modal = new Modal({
      title: 'Manual Purchase Entry',
      size: 'large',
      content: Forms.createManualPurchaseForm(vendor)
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

      // Remove item
      removeBtn.addEventListener('click', () => {
        const container = document.getElementById('items-container');
        if (container.querySelectorAll('.item-row').length > 1) {
          row.remove();
          updateTotal();
        } else {
          Modal.alert('Error', 'At least one item is required', 'warning');
        }
      });
    };

    // Update total
    const updateTotal = () => {
      let total = 0;
      document.querySelectorAll('#items-container .item-row [data-field="amount"]').forEach(input => {
        total += parseFloat(input.value) || 0;
      });
      document.getElementById('purchase-total').value = total.toFixed(2);
    };

    // Add item button
    document.getElementById('add-item-btn').addEventListener('click', () => {
      const container = document.getElementById('items-container');
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
        text: 'Save Purchase',
        className: 'btn btn-primary',
        onClick: async () => {
          const formData = Forms.getManualPurchaseFormData();

          // Validate
          if (!formData.items || formData.items.length === 0) {
            Modal.alert('Error', 'Please add at least one item', 'warning');
            return;
          }

          if (formData.total <= 0) {
            Modal.alert('Error', 'Total amount must be greater than 0', 'warning');
            return;
          }

          // Create purchase
          const purchaseResult = await this.purchaseService.createPurchase({
            vendorId,
            vendorName: vendor.name,
            date: formData.date,
            items: formData.items,
            total: formData.total,
            notes: formData.notes
          });

          if (purchaseResult.success) {
            modal.close();
            Modal.alert('Success', purchaseResult.message, 'success');
            this.render(document.getElementById('main-content'));
          } else {
            Modal.alert('Error', purchaseResult.message || 'Failed to create purchase', 'danger');
          }
        }
      }
    ]);
  }

  async processPurchaseOCR(vendorId, imageData) {
    const loadingModal = new Modal({ title: 'Processing...' });
    loadingModal.open();
    loadingModal.showLoading('Processing image with OCR...');

    const result = await this.purchaseService.processPurchaseFromOCR(imageData, vendorId);
    loadingModal.close();

    if (!result.success) {
      Modal.alert('Error', result.error, 'danger');
      return;
    }

    // Show OCR preview
    OCRPreview.showInModal(
      imageData,
      result.data,
      async (confirmedData) => {
        const vendor = await this.partyService.getPartyById(vendorId);
        const purchaseResult = await this.purchaseService.createPurchase({
          ...result.data,
          ...confirmedData,
          vendorId,
          vendorName: vendor.name,
          imageData
        });

        if (purchaseResult.success) {
          Modal.alert('Success', purchaseResult.message, 'success');
          this.render(document.getElementById('main-content'));
        }
      }
    );
  }

  async showPaymentModal(vendorId) {
    const vendor = await this.partyService.getPartyById(vendorId);
    const modal = new Modal({
      title: 'Record Payment',
      content: Forms.createVendorPaymentForm(vendor)
    });

    modal.open();
    modal.addFooter([
      { text: 'Cancel', className: 'btn btn-ghost', onClick: () => modal.close() },
      {
        text: 'Record Payment', className: 'btn btn-success', onClick: () => {
          const data = Forms.getPaymentFormData();
          this.paymentService.recordVendorPayment({
            ...data,
            vendorId,
            vendorName: vendor.name
          });
          modal.close();
          Modal.alert('Success', 'Payment recorded successfully', 'success');
          this.render(document.getElementById('main-content'));
        }
      }
    ]);
  }

  async showVendorLedger(vendorId) {
    const stats = await this.partyService.getPartyStats(vendorId);
    const transactions = await this.partyService.getPartyTransactions(vendorId);

    const modal = new Modal({
      title: `Vendor Ledger - ${stats.party.name}`,
      size: 'large',
      content: `
        <div class="stats-grid mb-lg">
          <div class="stat-card danger">
            <div class="stat-label">Current Payable</div>
            <div class="stat-value">${this.calculator.formatCurrency(stats.currentBalance)}</div>
          </div>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
          ${transactions.map(txn => `
            <div class="ledger-entry ${txn.type === 'purchase' ? 'credit' : 'debit'}">
              <div class="ledger-date">${new Date(txn.date).toLocaleDateString()}</div>
              <div class="ledger-description">${txn.type === 'purchase' ? 'Purchase' : 'Payment'}</div>
              <div class="ledger-amount ${txn.type === 'purchase' ? 'credit' : 'debit'}">
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

window.VendorsPage = VendorsPage;
