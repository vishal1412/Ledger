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
        const isSale = this.ocrData.isSale || false; // Check if it's a sale transaction

        container.innerHTML = `
      <div class="ocr-preview">
        <div class="ocr-image-panel">
          <img src="${this.imageData}" alt="Captured Document" />
        </div>
        <div class="ocr-data-panel">
          ${hasCorrections ? `
            <div class="alert alert-warning">
              <strong>⚠️ Auto-Corrections Applied</strong><br>
              ${this.ocrData.validationSummary}
            </div>
          ` : `
            <div class="alert alert-success">
              <strong>✓ All Calculations Verified</strong><br>
              No corrections needed
            </div>
          `}
          
          <div class="form-group">
            <label class="form-label">Party Name</label>
            <input type="text" class="form-input" id="ocr-party-name" 
                   value="${this.ocrData.partyName || ''}" />
          </div>

          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-input" id="ocr-date" 
                   value="${this.ocrData.date || ''}" />
          </div>

          <div class="line-items">
            <h4 class="line-items-header">Items</h4>
            <div id="line-items-container">
              ${this.renderLineItems()}
            </div>
            <button class="btn btn-outline btn-sm" id="add-item-btn">+ Add Item</button>
          </div>

          <div class="form-group">
            <label class="form-label font-bold text-lg">Total Amount</label>
            <input type="number" step="0.01" class="form-input ${this.ocrData.totalWasCorrected ? 'error' : ''}" 
                   id="ocr-total" value="${this.ocrData.total || 0}" readonly />
            ${this.ocrData.totalWasCorrected ? `
              <span class="form-error">
                Auto-corrected from ${window.calculator.formatCurrency(this.ocrData.originalTotal)}
              </span>
            ` : ''}
          </div>

          ${isSale ? `
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Bill Amount</label>
                <input type="number" step="0.01" class="form-input" id="ocr-bill-amount" 
                       value="${this.ocrData.total || 0}" min="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Cash Amount</label>
                <input type="number" step="0.01" class="form-input" id="ocr-cash-amount" 
                       value="0" min="0" />
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

        this.setupEventListeners();
    }

    // Render line items
    renderLineItems() {
        if (!this.ocrData.items || this.ocrData.items.length === 0) {
            return '<p class="text-gray">No items found. Please add items manually.</p>';
        }

        return this.ocrData.items.map((item, index) => `
      <div class="line-item ${item.wasAutoCorrected ? 'corrected' : ''}" data-index="${index}">
        <div>
          <label class="text-xs text-gray">Item Name</label>
          <input type="text" class="form-input" value="${this.escapeHtml(item.name || '')}" 
                 data-field="name" data-index="${index}" required />
        </div>
        <div>
          <label class="text-xs text-gray">Qty</label>
          <input type="number" step="0.01" class="form-input" value="${item.quantity || 1}" 
                 data-field="quantity" data-index="${index}" min="0.01" required />
        </div>
        <div>
          <label class="text-xs text-gray">Rate</label>
          <input type="number" step="0.01" class="form-input" value="${item.rate || 0}" 
                 data-field="rate" data-index="${index}" min="0" required />
        </div>
        <div>
          <label class="text-xs text-gray">Amount</label>
          <input type="number" step="0.01" class="form-input" value="${item.correctedAmount || item.lineAmount || 0}" 
                 data-field="amount" data-index="${index}" readonly />
          ${item.wasAutoCorrected ? `
            <span class="ocr-correction-badge">Corrected</span>
          ` : ''}
        </div>
        <div style="display: flex; align-items: flex-end;">
          <button type="button" class="btn btn-sm btn-ghost remove-item-btn" data-index="${index}" style="color: #dc2626;">✕</button>
        </div>
      </div>
    `).join('');
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Setup event listeners
    setupEventListeners() {
        // Add item button
        const addBtn = document.getElementById('add-item-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addNewItem());
        }

        // Remove item buttons
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeItem(index);
            });
        });

        // Line item inputs - auto-calculate
        const lineItemInputs = document.querySelectorAll('.line-item input');
        lineItemInputs.forEach(input => {
            if (input.dataset.field !== 'amount') {
                input.addEventListener('input', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    const field = e.target.dataset.field;
                    this.updateLineItem(index, field, e.target.value);
                });
            }
        });
    }

    // Remove item
    removeItem(index) {
        if (this.ocrData.items.length <= 1) {
            Modal.alert('Error', 'At least one item is required', 'warning');
            return;
        }
        
        this.ocrData.items.splice(index, 1);
        const container = document.getElementById('line-items-container');
        container.innerHTML = this.renderLineItems();
        this.setupEventListeners();
        this.recalculateTotal();
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

    // Update line item
    updateLineItem(index, field, value) {
        if (!this.ocrData.items[index]) return;

        this.ocrData.items[index][field] = value;

        // Auto-calculate amount
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

        // Recalculate total
        this.recalculateTotal();
    }

    // Recalculate total
    recalculateTotal() {
        const total = this.ocrData.items.reduce((sum, item) => {
            return sum + (parseFloat(item.lineAmount) || 0);
        }, 0);

        const totalInput = document.getElementById('ocr-total');
        if (totalInput) {
            totalInput.value = window.calculator.roundToTwo(total);
        }
    }

    // Get confirmed data
    getConfirmedData() {
        const partyName = document.getElementById('ocr-party-name')?.value || '';
        const date = document.getElementById('ocr-date')?.value || '';
        const total = parseFloat(document.getElementById('ocr-total')?.value) || 0;
        const billAmount = parseFloat(document.getElementById('ocr-bill-amount')?.value) || 0;
        const cashAmount = parseFloat(document.getElementById('ocr-cash-amount')?.value) || 0;

        // Get line items
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
        });

        return {
            partyName,
            date,
            items,
            total,
            billAmount,
            cashAmount,
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
            size: 'extra-large'
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
