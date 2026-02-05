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

  render(container) {
    const vendors = this.partyService.getVendors();
    const purchaseStats = this.purchaseService.getPurchaseStats();

    const totalPayable = vendors.reduce((sum, v) =>
      sum + this.partyService.calculatePartyBalance(v.id), 0);

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
        <div class="card-body">${this.renderVendorsList(vendors)}</div>
      </div>
    `;

    this.setupEventListeners();
  }

  renderVendorsList(vendors) {
    if (vendors.length === 0) {
      return '<div class="empty-state"><p>No vendors yet. Add vendors from Party Master.</p></div>';
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
            ${vendors.map(vendor => {
      const balance = this.partyService.calculatePartyBalance(vendor.id);
      const purchases = this.purchaseService.getPurchasesByVendor(vendor.id);
      const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);

      return `
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
              `;
    }).join('')}
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
    const vendors = this.partyService.getVendors();
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
    try {
      CameraCapture.openCameraModal(
        async (imageData) => {
          if (!imageData) {
            Modal.alert('Error', 'No image captured', 'danger');
            return;
          }
          await this.processPurchaseOCR(vendorId, imageData);
        },
        (error) => {
          console.error('Camera error:', error);
          Modal.alert('Camera Error', error.message || 'Failed to access camera. Please check permissions.', 'danger');
        }
      );
    } catch (error) {
      console.error('Camera capture error:', error);
      Modal.alert('Error', 'Failed to open camera: ' + error.message, 'danger');
    }
  }

  async uploadPurchasePhoto(vendorId) {
    try {
      const imageData = await CameraCapture.openFileUpload();
      
      if (!imageData) {
        Modal.alert('Error', 'No image selected', 'danger');
        return;
      }
      
      await this.processPurchaseOCR(vendorId, imageData);
    } catch (error) {
      console.error('File upload error:', error);
      if (error.message !== 'File selection cancelled') {
        Modal.alert('Upload Error', error.message || 'Failed to upload image', 'danger');
      }
    }
  }

  showManualPurchaseForm(vendorId) {
    const vendor = this.partyService.getPartyById(vendorId);
    const today = new Date().toISOString().split('T')[0];

    const modal = new Modal({
      title: `Manual Purchase Entry - ${vendor.name}`,
      size: 'large',
      content: `
        <div class="form-group">
          <label class="form-label required">Date</label>
          <input type="date" class="form-input" id="manual-date" value="${today}" />
        </div>

        <div class="line-items">
          <h4 class="line-items-header">Purchase Items</h4>
          <div id="manual-items-container">
            <div class="line-item" data-index="0">
              <div class="line-item-row">
                <div class="line-item-field">
                  <label class="text-xs text-gray">Item Name *</label>
                  <input type="text" class="form-input" placeholder="Enter item name" 
                         data-field="name" data-index="0" />
                </div>
                <div class="line-item-field line-item-field-sm">
                  <label class="text-xs text-gray">Qty *</label>
                  <input type="number" step="0.01" class="form-input" value="1" 
                         data-field="quantity" data-index="0" />
                </div>
                <div class="line-item-field line-item-field-sm">
                  <label class="text-xs text-gray">Rate *</label>
                  <input type="number" step="0.01" class="form-input" value="0" 
                         data-field="rate" data-index="0" />
                </div>
                <div class="line-item-field line-item-field-sm">
                  <label class="text-xs text-gray">Amount</label>
                  <input type="number" step="0.01" class="form-input" value="0" 
                         data-field="amount" data-index="0" readonly />
                </div>
              </div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" id="manual-add-item-btn">+ Add Item</button>
        </div>

        <div class="totals-section">
          <div class="form-group">
            <label class="form-label">Subtotal</label>
            <input type="number" step="0.01" class="form-input" 
                   id="manual-subtotal" value="0" readonly />
          </div>

          <div class="form-group">
            <label class="form-label">Tax / GST (%)</label>
            <input type="number" step="0.01" class="form-input" 
                   id="manual-tax-percent" value="0" />
          </div>

          <div class="form-group">
            <label class="form-label">Tax Amount</label>
            <input type="number" step="0.01" class="form-input" 
                   id="manual-tax" value="0" />
          </div>

          <div class="form-group">
            <label class="form-label font-bold text-lg">Total Amount *</label>
            <input type="number" step="0.01" class="form-input" 
                   id="manual-total" value="0" readonly />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes (Optional)</label>
          <textarea class="form-input" id="manual-notes" rows="2" 
                    placeholder="Add any additional notes..."></textarea>
        </div>
      `
    });

    modal.open();

    // Setup event listeners
    this.setupManualFormListeners();

    // Add footer buttons
    modal.addFooter([
      { text: 'Cancel', className: 'btn btn-ghost', onClick: () => modal.close() },
      {
        text: 'Save Purchase',
        className: 'btn btn-success',
        onClick: async () => {
          const purchaseData = this.getManualFormData(vendorId, vendor.name);
          
          if (!purchaseData) {
            Modal.alert('Error', 'Please fill all required fields', 'danger');
            return;
          }

          const result = await this.purchaseService.createPurchase(purchaseData);
          
          if (result.success) {
            modal.close();
            Modal.alert('Success', result.message, 'success');
            this.render(document.getElementById('main-content'));
          } else {
            Modal.alert('Error', result.message || 'Failed to create purchase', 'danger');
          }
        }
      }
    ]);
  }

  setupManualFormListeners() {
    // Add item button
    const addBtn = document.getElementById('manual-add-item-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addManualItem());
    }

    // Item field listeners
    document.addEventListener('input', (e) => {
      if (e.target.dataset.field && e.target.dataset.index !== undefined) {
        this.updateManualItem(parseInt(e.target.dataset.index), e.target.dataset.field, e.target.value);
      }
    });

    // Tax listeners
    const taxPercentInput = document.getElementById('manual-tax-percent');
    const taxInput = document.getElementById('manual-tax');
    
    if (taxPercentInput) {
      taxPercentInput.addEventListener('input', () => this.recalculateManualTotals());
    }
    if (taxInput) {
      taxInput.addEventListener('input', () => this.recalculateManualTotals());
    }
  }

  addManualItem() {
    const container = document.getElementById('manual-items-container');
    const currentItems = container.querySelectorAll('.line-item');
    const newIndex = currentItems.length;

    const itemHtml = `
      <div class="line-item" data-index="${newIndex}">
        <div class="line-item-row">
          <div class="line-item-field">
            <label class="text-xs text-gray">Item Name *</label>
            <input type="text" class="form-input" placeholder="Enter item name" 
                   data-field="name" data-index="${newIndex}" />
          </div>
          <div class="line-item-field line-item-field-sm">
            <label class="text-xs text-gray">Qty *</label>
            <input type="number" step="0.01" class="form-input" value="1" 
                   data-field="quantity" data-index="${newIndex}" />
          </div>
          <div class="line-item-field line-item-field-sm">
            <label class="text-xs text-gray">Rate *</label>
            <input type="number" step="0.01" class="form-input" value="0" 
                   data-field="rate" data-index="${newIndex}" />
          </div>
          <div class="line-item-field line-item-field-sm">
            <label class="text-xs text-gray">Amount</label>
            <input type="number" step="0.01" class="form-input" value="0" 
                   data-field="amount" data-index="${newIndex}" readonly />
          </div>
          <div class="line-item-actions">
            <button class="btn btn-sm btn-ghost delete-manual-item-btn" data-index="${newIndex}" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', itemHtml);

    // Add delete listener
    const deleteBtn = container.querySelector(`[data-index="${newIndex}"].delete-manual-item-btn`);
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const item = container.querySelector(`.line-item[data-index="${newIndex}"]`);
        if (item) {
          item.remove();
          this.recalculateManualTotals();
        }
      });
    }
  }

  updateManualItem(index, field, value) {
    if (field === 'quantity' || field === 'rate') {
      const qtyInput = document.querySelector(`input[data-field="quantity"][data-index="${index}"]`);
      const rateInput = document.querySelector(`input[data-field="rate"][data-index="${index}"]`);
      const amountInput = document.querySelector(`input[data-field="amount"][data-index="${index}"]`);

      const qty = parseFloat(qtyInput?.value) || 0;
      const rate = parseFloat(rateInput?.value) || 0;
      const amount = this.calculator.roundToTwo(qty * rate);

      if (amountInput) {
        amountInput.value = amount;
      }
    }

    this.recalculateManualTotals();
  }

  recalculateManualTotals() {
    // Calculate subtotal from all items
    const amountInputs = document.querySelectorAll('input[data-field="amount"]');
    let subtotal = 0;
    
    amountInputs.forEach(input => {
      subtotal += parseFloat(input.value) || 0;
    });

    // Update subtotal
    const subtotalInput = document.getElementById('manual-subtotal');
    if (subtotalInput) {
      subtotalInput.value = this.calculator.roundToTwo(subtotal);
    }

    // Calculate tax
    const taxPercentInput = document.getElementById('manual-tax-percent');
    const taxInput = document.getElementById('manual-tax');
    
    let tax = 0;
    if (taxPercentInput && taxInput) {
      const taxPercent = parseFloat(taxPercentInput.value) || 0;
      if (taxPercent > 0) {
        tax = this.calculator.roundToTwo((subtotal * taxPercent) / 100);
        taxInput.value = tax;
      } else {
        tax = parseFloat(taxInput.value) || 0;
      }
    }

    // Calculate and update total
    const total = this.calculator.roundToTwo(subtotal + tax);
    const totalInput = document.getElementById('manual-total');
    if (totalInput) {
      totalInput.value = total;
    }
  }

  getManualFormData(vendorId, vendorName) {
    const date = document.getElementById('manual-date')?.value;
    const notes = document.getElementById('manual-notes')?.value || '';
    const subtotal = parseFloat(document.getElementById('manual-subtotal')?.value) || 0;
    const tax = parseFloat(document.getElementById('manual-tax')?.value) || 0;
    const taxPercent = parseFloat(document.getElementById('manual-tax-percent')?.value) || 0;
    const total = parseFloat(document.getElementById('manual-total')?.value) || 0;

    // Get all items
    const items = [];
    const itemElements = document.querySelectorAll('.line-item');
    
    itemElements.forEach(itemEl => {
      const index = itemEl.dataset.index;
      const name = document.querySelector(`input[data-field="name"][data-index="${index}"]`)?.value || '';
      const quantity = parseFloat(document.querySelector(`input[data-field="quantity"][data-index="${index}"]`)?.value) || 0;
      const rate = parseFloat(document.querySelector(`input[data-field="rate"][data-index="${index}"]`)?.value) || 0;
      const lineAmount = parseFloat(document.querySelector(`input[data-field="amount"][data-index="${index}"]`)?.value) || 0;

      if (name.trim()) {
        items.push({ name, quantity, rate, lineAmount });
      }
    });

    // Validation
    if (!date) {
      Modal.alert('Error', 'Please select a date', 'danger');
      return null;
    }

    if (items.length === 0) {
      Modal.alert('Error', 'Please add at least one item', 'danger');
      return null;
    }

    if (total <= 0) {
      Modal.alert('Error', 'Total amount must be greater than 0', 'danger');
      return null;
    }

    return {
      vendorId,
      vendorName,
      date,
      items,
      subtotal,
      tax,
      taxPercent,
      total,
      notes
    };
  }

  async processPurchaseOCR(vendorId, imageData) {
    const loadingModal = new Modal({ title: 'Processing...' });
    loadingModal.open();
    loadingModal.showLoading('Processing image with OCR...');

    try {
      const result = await this.purchaseService.processPurchaseFromOCR(imageData, vendorId);
      loadingModal.close();

      if (!result.success) {
        Modal.alert('Error', result.error || 'OCR processing failed', 'danger');
        return;
      }

      console.log('OCR processing result:', result);

      // Show OCR preview
      OCRPreview.showInModal(
        imageData,
        result.data,
        async (confirmedData) => {
          console.log('User confirmed data:', confirmedData);
          
          const vendor = this.partyService.getPartyById(vendorId);
          if (!vendor) {
            Modal.alert('Error', 'Vendor not found', 'danger');
            return;
          }

          const purchaseResult = await this.purchaseService.createPurchase({
            ...confirmedData,
            vendorId,
            vendorName: vendor.name,
            imageData
          });

          console.log('Purchase result:', purchaseResult);

          if (purchaseResult.success) {
            Modal.alert('Success', purchaseResult.message, 'success');
            // Refresh vendor page
            this.render(document.getElementById('main-content'));
          } else {
            Modal.alert('Error', purchaseResult.message || 'Failed to create purchase', 'danger');
          }
        }
      );
    } catch (error) {
      loadingModal.close();
      console.error('Error in processPurchaseOCR:', error);
      Modal.alert('Error', 'Failed to process image: ' + error.message, 'danger');
    }
  }

  showPaymentModal(vendorId) {
    const vendor = this.partyService.getPartyById(vendorId);
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

  showVendorLedger(vendorId) {
    const stats = this.partyService.getPartyStats(vendorId);
    const transactions = this.partyService.getPartyTransactions(vendorId);

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
