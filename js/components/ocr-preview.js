// ===================================
// OCR PREVIEW COMPONENT
// ===================================

class OCRPreview {
    constructor(options = {}) {
        this.imageData = options.imageData;
        this.ocrData = options.ocrData;
        this.onConfirm = options.onConfirm || null;
        this.onCancel = options.onCancel || null;
        this.currentData = {};
    }

    // Render preview
    render(container) {
        const corrections = this.ocrData.corrections || {};
        const hasCorrections = corrections.totalCorrections > 0;

        container.innerHTML = `
      <div class="ocr-preview">
        <div class="ocr-image-panel">
          <img src="${this.imageData}" alt="Captured Document" />
          <div class="ocr-confidence">
            <strong>OCR Confidence:</strong> ${Math.round(this.ocrData.confidence || 0)}%
          </div>
        </div>
        <div class="ocr-data-panel">
          ${hasCorrections ? `
            <div class="alert alert-warning">
              <strong>⚠️ Auto-Corrections Applied</strong><br>
              ${this.ocrData.validationSummary || 'Some values were corrected'}
            </div>
          ` : `
            <div class="alert alert-success">
              <strong>✓ All Calculations Verified</strong><br>
              No corrections needed
            </div>
          `}
          
          <div class="form-group">
            <label class="form-label">Vendor Name</label>
            <input type="text" class="form-input" id="ocr-party-name" 
                   value="${this.ocrData.partyName || this.ocrData.vendorName || ''}" 
                   placeholder="Enter vendor name" />
          </div>

          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-input" id="ocr-date" 
                   value="${this.ocrData.date || new Date().toISOString().split('T')[0]}" />
          </div>

          <div class="line-items">
            <h4 class="line-items-header">Items</h4>
            <div id="line-items-container">
              ${this.renderLineItems()}
            </div>
            <button class="btn btn-outline btn-sm" id="add-item-btn">+ Add Item</button>
          </div>

          <div class="totals-section">
            <div class="form-group">
              <label class="form-label">Subtotal</label>
              <input type="number" step="0.01" class="form-input" 
                     id="ocr-subtotal" value="${this.ocrData.subtotal || 0}" readonly />
            </div>

            <div class="form-group">
              <label class="form-label">Tax / GST (%)</label>
              <input type="number" step="0.01" class="form-input" 
                     id="ocr-tax-percent" value="${this.ocrData.taxPercent || 0}" />
            </div>

            <div class="form-group">
              <label class="form-label">Tax Amount</label>
              <input type="number" step="0.01" class="form-input" 
                     id="ocr-tax" value="${this.ocrData.tax || 0}" />
            </div>

            <div class="form-group">
              <label class="form-label font-bold text-lg">Total Amount</label>
              <input type="number" step="0.01" class="form-input ${this.ocrData.totalWasCorrected ? 'error' : ''}" 
                     id="ocr-total" value="${this.ocrData.total || 0}" />
              ${this.ocrData.totalWasCorrected ? `
                <span class="form-error">
                  Auto-corrected from ${window.calculator.formatCurrency(this.ocrData.originalTotal)}
                </span>
              ` : ''}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes (Optional)</label>
            <textarea class="form-input" id="ocr-notes" rows="2" 
                      placeholder="Add any additional notes...">${this.ocrData.notes || ''}</textarea>
          </div>
        </div>
      </div>
    `;

        this.setupEventListeners();
    }

    // Render line items
    renderLineItems() {
        if (!this.ocrData.items || this.ocrData.items.length === 0) {
            return '<p class="text-gray">No items detected. Click "+ Add Item" to add manually.</p>';
        }

        return this.ocrData.items.map((item, index) => `
      <div class="line-item ${item.wasAutoCorrected ? 'corrected' : ''}" data-index="${index}">
        <div class="line-item-row">
          <div class="line-item-field">
            <label class="text-xs text-gray">Item Name</label>
            <input type="text" class="form-input" value="${item.name}" 
                   data-field="name" data-index="${index}" />
          </div>
          <div class="line-item-field line-item-field-sm">
            <label class="text-xs text-gray">Qty</label>
            <input type="number" step="0.01" class="form-input" value="${item.quantity}" 
                   data-field="quantity" data-index="${index}" />
          </div>
          <div class="line-item-field line-item-field-sm">
            <label class="text-xs text-gray">Rate</label>
            <input type="number" step="0.01" class="form-input" value="${item.rate}" 
                   data-field="rate" data-index="${index}" />
          </div>
          <div class="line-item-field line-item-field-sm">
            <label class="text-xs text-gray">Amount</label>
            <input type="number" step="0.01" class="form-input" value="${item.correctedAmount || item.lineAmount}" 
                   data-field="amount" data-index="${index}" readonly />
            ${item.wasAutoCorrected ? `
              <span class="ocr-correction-badge">✓ Corrected</span>
            ` : ''}
          </div>
          <div class="line-item-actions">
            <button class="btn btn-sm btn-ghost delete-item-btn" data-index="${index}" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');
    }

    // Setup event listeners
    setupEventListeners() {
        // Add item button
        const addBtn = document.getElementById('add-item-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addNewItem());
        }

        // Delete item buttons
        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteItem(index);
            });
        });

        // Line item inputs - auto-calculate
        const lineItemInputs = document.querySelectorAll('.line-item input[data-field]');
        lineItemInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                this.updateLineItem(index, field, e.target.value);
            });
        });

        // Tax percentage input - auto-calculate tax amount
        const taxPercentInput = document.getElementById('ocr-tax-percent');
        if (taxPercentInput) {
            taxPercentInput.addEventListener('input', () => this.recalculateTotals());
        }

        // Tax amount input - update total
        const taxInput = document.getElementById('ocr-tax');
        if (taxInput) {
            taxInput.addEventListener('input', () => this.recalculateTotals());
        }
    }

    // Add new item
    addNewItem() {
        if (!this.ocrData.items) {
            this.ocrData.items = [];
        }

        this.ocrData.items.push({
            name: '',
            quantity: 1,
            rate: 0,
            lineAmount: 0
        });

        const container = document.getElementById('line-items-container');
        container.innerHTML = this.renderLineItems();
        this.setupEventListeners();
    }

    // Delete item
    deleteItem(index) {
        if (confirm('Delete this item?')) {
            this.ocrData.items.splice(index, 1);
            const container = document.getElementById('line-items-container');
            container.innerHTML = this.renderLineItems();
            this.setupEventListeners();
            this.recalculateTotals();
        }
    }

    // Update line item
    updateLineItem(index, field, value) {
        if (!this.ocrData.items[index]) return;

        if (field === 'name') {
            this.ocrData.items[index][field] = value;
        } else {
            this.ocrData.items[index][field] = parseFloat(value) || 0;
        }

        // Auto-calculate amount when qty or rate changes
        if (field === 'quantity' || field === 'rate') {
            const item = this.ocrData.items[index];
            const calculatedAmount = item.quantity * item.rate;
            item.lineAmount = window.calculator.roundToTwo(calculatedAmount);

            // Update amount field
            const amountInput = document.querySelector(`input[data-field="amount"][data-index="${index}"]`);
            if (amountInput) {
                amountInput.value = item.lineAmount;
            }
        }

        // Recalculate totals
        this.recalculateTotals();
    }

    // Recalculate all totals
    recalculateTotals() {
        // Calculate subtotal from items
        const subtotal = this.ocrData.items.reduce((sum, item) => {
            return sum + (parseFloat(item.lineAmount) || 0);
        }, 0);

        // Update subtotal field
        const subtotalInput = document.getElementById('ocr-subtotal');
        if (subtotalInput) {
            subtotalInput.value = window.calculator.roundToTwo(subtotal);
        }

        // Get tax percentage and calculate tax
        const taxPercentInput = document.getElementById('ocr-tax-percent');
        const taxInput = document.getElementById('ocr-tax');
        
        let tax = 0;
        if (taxPercentInput && taxInput) {
            const taxPercent = parseFloat(taxPercentInput.value) || 0;
            if (taxPercent > 0) {
                tax = window.calculator.roundToTwo((subtotal * taxPercent) / 100);
                taxInput.value = tax;
            } else {
                tax = parseFloat(taxInput.value) || 0;
            }
        }

        // Calculate and update total
        const total = window.calculator.roundToTwo(subtotal + tax);
        const totalInput = document.getElementById('ocr-total');
        if (totalInput) {
            totalInput.value = total;
        }

        // Store in ocrData
        this.ocrData.subtotal = subtotal;
        this.ocrData.tax = tax;
        this.ocrData.total = total;
    }

    // Get confirmed data
    getConfirmedData() {
        const partyName = document.getElementById('ocr-party-name')?.value || '';
        const date = document.getElementById('ocr-date')?.value || '';
        const subtotal = parseFloat(document.getElementById('ocr-subtotal')?.value) || 0;
        const tax = parseFloat(document.getElementById('ocr-tax')?.value) || 0;
        const taxPercent = parseFloat(document.getElementById('ocr-tax-percent')?.value) || 0;
        const total = parseFloat(document.getElementById('ocr-total')?.value) || 0;
        const notes = document.getElementById('ocr-notes')?.value || '';

        // Get line items from form
        const items = this.ocrData.items.map((item, index) => {
            const nameInput = document.querySelector(`input[data-field="name"][data-index="${index}"]`);
            const qtyInput = document.querySelector(`input[data-field="quantity"][data-index="${index}"]`);
            const rateInput = document.querySelector(`input[data-field="rate"][data-index="${index}"]`);
            const amountInput = document.querySelector(`input[data-field="amount"][data-index="${index}"]`);

            return {
                name: nameInput?.value || item.name,
                quantity: parseFloat(qtyInput?.value) || item.quantity,
                rate: parseFloat(rateInput?.value) || item.rate,
                lineAmount: parseFloat(amountInput?.value) || item.lineAmount
            };
        }).filter(item => item.name && item.name.trim().length > 0); // Filter out empty items

        return {
            partyName,
            date,
            items,
            subtotal,
            tax,
            taxPercent,
            total,
            notes,
            ocrData: {
                rawText: this.ocrData.rawText,
                confidence: this.ocrData.confidence
            }
        };
    }

    // Show in modal
    static showInModal(imageData, ocrData, onConfirm, onCancel) {
        const modal = new Modal({
            title: 'Review & Confirm OCR Data',
            size: 'large'
        });

        const preview = new OCRPreview({
            imageData,
            ocrData,
            onConfirm,
            onCancel
        });

        const modalEl = modal.open();
        const bodyEl = modalEl.querySelector('.modal-body');
        preview.render(bodyEl);

        // Add footer buttons
        modal.addFooter([
            {
                text: 'Cancel',
                className: 'btn btn-ghost',
                onClick: () => {
                    modal.close();
                    if (onCancel) onCancel();
                }
            },
            {
                text: 'Confirm & Save',
                className: 'btn btn-success',
                onClick: () => {
                    const confirmedData = preview.getConfirmedData();
                    modal.close();
                    if (onConfirm) onConfirm(confirmedData);
                }
            }
        ]);

        return { modal, preview };
    }
}

// Export to window
window.OCRPreview = OCRPreview;
