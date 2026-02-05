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
