// ===================================
// FORM COMPONENTS
// ===================================

class Forms {
    // Create party form
    static createPartyForm(party = null) {
        const isEdit = !!party;

        return `
      <form id="party-form">
        <div class="form-group">
          <label class="form-label required">Party Type</label>
          <select class="form-select" id="party-type" required>
            <option value="">Select Type</option>
            <option value="Vendor" ${party?.type === 'Vendor' ? 'selected' : ''}>Vendor</option>
            <option value="Customer" ${party?.type === 'Customer' ? 'selected' : ''}>Customer</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Name</label>
          <input type="text" class="form-input" id="party-name" 
                 value="${party?.name || ''}" required />
        </div>

        <div class="form-group">
          <label class="form-label">Phone</label>
          <input type="tel" class="form-input" id="party-phone" 
                 value="${party?.phone || ''}" />
        </div>

        <div class="form-group">
          <label class="form-label">Address</label>
          <textarea class="form-textarea" id="party-address">${party?.address || ''}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Opening Balance</label>
          <input type="number" step="0.01" class="form-input" id="party-balance" 
                 value="${party?.openingBalance || 0}" />
        </div>

        <div class="form-group">
          <label class="form-label">Balance Type</label>
          <select class="form-select" id="party-balance-type">
            <option value="Payable" ${party?.balanceType === 'Payable' ? 'selected' : ''}>Payable</option>
            <option value="Receivable" ${party?.balanceType === 'Receivable' ? 'selected' : ''}>Receivable</option>
          </select>
        </div>
      </form>
    `;
    }

    // Get party form data
    static getPartyFormData() {
        return {
            type: document.getElementById('party-type').value,
            name: document.getElementById('party-name').value,
            phone: document.getElementById('party-phone').value,
            address: document.getElementById('party-address').value,
            openingBalance: document.getElementById('party-balance').value,
            balanceType: document.getElementById('party-balance-type').value
        };
    }

    // Create payment form (vendor)
    static createVendorPaymentForm(vendor) {
        return `
      <form id="payment-form">
        <div class="alert alert-info">
          <strong>${vendor.name}</strong><br>
          Current Payable: ${window.calculator.formatCurrency(vendor.currentBalance || 0)}
        </div>

        <div class="form-group">
          <label class="form-label required">Payment Amount</label>
          <input type="number" step="0.01" class="form-input" id="payment-amount" 
                 required min="0" />
        </div>

        <div class="form-group">
          <label class="form-label required">Payment Mode</label>
          <select class="form-select" id="payment-mode" required>
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" class="form-input" id="payment-date" 
                 value="${new Date().toISOString().split('T')[0]}" />
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="payment-notes" placeholder="Optional notes"></textarea>
        </div>
      </form>
    `;
    }

    // Create payment form (customer)
    static createCustomerPaymentForm(customer) {
        const pending = window.salesService.getCustomerPending(customer.id);

        return `
      <form id="payment-form">
        <div class="alert alert-info">
          <strong>${customer.name}</strong><br>
          Bill Pending: ${window.calculator.formatCurrency(pending?.billPending || 0)}<br>
          Cash Pending: ${window.calculator.formatCurrency(pending?.cashPending || 0)}
        </div>

        <div class="form-group">
          <label class="form-label required">Payment Type</label>
          <select class="form-select" id="payment-type" required>
            <option value="Bill">Bill Payment</option>
            <option value="Cash">Cash Payment</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Payment Amount</label>
          <input type="number" step="0.01" class="form-input" id="payment-amount" 
                 required min="0" />
        </div>

        <div class="form-group">
          <label class="form-label required">Payment Mode</label>
          <select class="form-select" id="payment-mode" required>
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" class="form-input" id="payment-date" 
                 value="${new Date().toISOString().split('T')[0]}" />
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="payment-notes" placeholder="Optional notes"></textarea>
        </div>
      </form>
    `;
    }

    // Create manual purchase form
    static createManualPurchaseForm(vendor) {
        return `
      <form id="manual-purchase-form">
        <div class="alert alert-info">
          <strong>${vendor.name}</strong>
        </div>

        <div class="form-group">
          <label class="form-label required">Purchase Date</label>
          <input type="date" class="form-input" id="purchase-date" 
                 value="${new Date().toISOString().split('T')[0]}" required />
        </div>

        <div class="form-group">
          <label class="form-label required">Items</label>
          <div id="items-container">
            <div class="item-row" data-item-index="0">
              <input type="text" class="form-input" placeholder="Item name" data-field="name" required />
              <input type="number" class="form-input" placeholder="Qty" data-field="quantity" min="0.01" step="0.01" required />
              <input type="number" class="form-input" placeholder="Rate" data-field="rate" min="0.01" step="0.01" required />
              <input type="number" class="form-input" placeholder="Amount" data-field="amount" readonly />
              <button type="button" class="btn btn-sm btn-ghost remove-item-btn">✕</button>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-outline mt-sm" id="add-item-btn">+ Add Item</button>
        </div>

        <div class="form-group">
          <label class="form-label required">Total Amount</label>
          <input type="number" step="0.01" class="form-input" id="purchase-total" 
                 required min="0" readonly />
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="purchase-notes" placeholder="Optional notes"></textarea>
        </div>
      </form>
      
      <style>
        .item-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr auto;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          align-items: center;
        }
      </style>
    `;
    }

    // Get manual purchase form data
    static getManualPurchaseFormData() {
        const items = [];
        const itemRows = document.querySelectorAll('#items-container .item-row');
        
        itemRows.forEach(row => {
            const name = row.querySelector('[data-field="name"]').value;
            const quantity = parseFloat(row.querySelector('[data-field="quantity"]').value) || 0;
            const rate = parseFloat(row.querySelector('[data-field="rate"]').value) || 0;
            
            if (name && quantity > 0 && rate > 0) {
                items.push({
                    name: name.trim(),
                    quantity: quantity,
                    rate: rate,
                    amount: quantity * rate
                });
            }
        });
        
        return {
            date: document.getElementById('purchase-date').value,
            items: items,
            total: parseFloat(document.getElementById('purchase-total').value) || 0,
            notes: document.getElementById('purchase-notes').value
        };
    }

    // Create manual sale form
    static createManualSaleForm(customer) {
        return `
      <form id="manual-sale-form">
        <div class="alert alert-info">
          <strong>${customer.name}</strong>
        </div>

        <div class="form-group">
          <label class="form-label required">Sale Date</label>
          <input type="date" class="form-input" id="sale-date" 
                 value="${new Date().toISOString().split('T')[0]}" required />
        </div>

        <div class="form-group">
          <label class="form-label required">Items</label>
          <div id="sale-items-container">
            <div class="item-row" data-item-index="0">
              <input type="text" class="form-input" placeholder="Item name" data-field="name" required />
              <input type="number" class="form-input" placeholder="Qty" data-field="quantity" min="0.01" step="0.01" required />
              <input type="number" class="form-input" placeholder="Rate" data-field="rate" min="0.01" step="0.01" required />
              <input type="number" class="form-input" placeholder="Amount" data-field="amount" readonly />
              <button type="button" class="btn btn-sm btn-ghost remove-item-btn">✕</button>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-outline mt-sm" id="add-sale-item-btn">+ Add Item</button>
        </div>

        <div class="form-group">
          <label class="form-label required">Total Amount</label>
          <input type="number" step="0.01" class="form-input" id="sale-total" 
                 required min="0" readonly />
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Bill Amount</label>
            <input type="number" step="0.01" class="form-input" id="sale-bill-amount" min="0" value="0" />
          </div>
          <div class="form-group flex-1">
            <label class="form-label">Cash Amount</label>
            <input type="number" step="0.01" class="form-input" id="sale-cash-amount" min="0" value="0" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="sale-notes" placeholder="Optional notes"></textarea>
        </div>
      </form>
      
      <style>
        .item-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr auto;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          align-items: center;
        }
      </style>
    `;
    }

    // Get manual sale form data
    static getManualSaleFormData() {
        const items = [];
        const itemRows = document.querySelectorAll('#sale-items-container .item-row');
        
        itemRows.forEach(row => {
            const name = row.querySelector('[data-field="name"]').value;
            const quantity = parseFloat(row.querySelector('[data-field="quantity"]').value) || 0;
            const rate = parseFloat(row.querySelector('[data-field="rate"]').value) || 0;
            
            if (name && quantity > 0 && rate > 0) {
                items.push({
                    name: name.trim(),
                    quantity: quantity,
                    rate: rate,
                    amount: quantity * rate
                });
            }
        });
        
        return {
            date: document.getElementById('sale-date').value,
            items: items,
            total: parseFloat(document.getElementById('sale-total').value) || 0,
            billAmount: parseFloat(document.getElementById('sale-bill-amount').value) || 0,
            cashAmount: parseFloat(document.getElementById('sale-cash-amount').value) || 0,
            notes: document.getElementById('sale-notes').value
        };
    }

    // Get payment form data
    static getPaymentFormData() {
        return {
            amount: document.getElementById('payment-amount').value,
            paymentMode: document.getElementById('payment-mode').value,
            paymentType: document.getElementById('payment-type')?.value,
            date: document.getElementById('payment-date').value,
            notes: document.getElementById('payment-notes').value
        };
    }

    // Validate form
    static validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        return form.checkValidity();
    }
}

// Export to window
window.Forms = Forms;
