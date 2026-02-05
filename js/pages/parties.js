// ===================================
// PARTIES PAGE
// ===================================

class PartiesPage {
    constructor() {
        this.partyService = window.partyService;
        this.calculator = window.calculator;
    }

    // Render parties page
    async render(container) {
        const parties = await this.partyService.getAllParties();

        container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Party Master</h1>
          <p class="page-subtitle">Manage all vendors and customers</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="add-party-btn">
            + Add Party
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">All Parties</h3>
          <input type="text" class="form-input" id="search-parties" 
                 placeholder="Search parties..." style="max-width: 300px;" />
        </div>
        <div class="card-body">
          ${this.renderPartiesTable(parties)}
        </div>
      </div>
    `;

        this.setupEventListeners();
    }

    // Render parties table
    renderPartiesTable(parties) {
        if (parties.length === 0) {
            return `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h3 class="empty-state-title">No Parties Yet</h3>
          <p class="empty-state-description">Add your first vendor or customer to get started</p>
          <button class="btn btn-primary" onclick="document.getElementById('add-party-btn').click()">
            + Add Party
          </button>
        </div>
      `;
        }

        return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Opening Balance</th>
              <th>Current Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${parties.map(async party => {
            const balance = await this.partyService.calculatePartyBalance(party.id);
            return `
                <tr data-party-id="${party.id}">
                  <td><span class="badge badge-${party.type === 'Vendor' ? 'primary' : 'success'}">${party.type}</span></td>
                  <td class="font-medium">${party.name}</td>
                  <td>${party.phone || '-'}</td>
                  <td>${this.calculator.formatCurrency(party.openingBalance)}</td>
                  <td class="font-bold">${this.calculator.formatCurrency(balance)}</td>
                  <td>
                    <button class="btn btn-sm btn-outline view-party-btn" data-id="${party.id}">View</button>
                    <button class="btn btn-sm btn-ghost edit-party-btn" data-id="${party.id}">Edit</button>
                  </td>
                </tr>
              `;
        }).join('')}
          </tbody>
        </table>
      </div>
    `;
    }

    // Setup event listeners
    setupEventListeners() {
        // Add party
        const addBtn = document.getElementById('add-party-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddPartyModal());
        }

        // Search
        const searchInput = document.getElementById('search-parties');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value;
                const parties = query ? this.partyService.searchParties(query) : this.partyService.getAllParties();
                const tableContainer = document.querySelector('.card-body');
                tableContainer.innerHTML = this.renderPartiesTable(parties);
                this.setupTableListeners();
            });
        }

        this.setupTableListeners();
    }

    // Setup table listeners
    setupTableListeners() {
        // View party
        document.querySelectorAll('.view-party-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.showPartyDetails(id);
            });
        });

        // Edit party
        document.querySelectorAll('.edit-party-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.showEditPartyModal(id);
            });
        });
    }

    // Show add party modal
    showAddPartyModal() {
        const modal = new Modal({
            title: 'Add New Party',
            content: Forms.createPartyForm()
        });

        const modalEl = modal.open();
        modal.addFooter([
            {
                text: 'Cancel',
                className: 'btn btn-ghost',
                onClick: () => modal.close()
            },
            {
                text: 'Save',
                className: 'btn btn-primary',
                onClick: () => {
                    if (Forms.validateForm('party-form')) {
                        const data = Forms.getPartyFormData();
                        this.partyService.createParty(data);
                        modal.close();
                        this.render(document.getElementById('main-content'));
                        Modal.alert('Success', 'Party added successfully', 'success');
                    }
                }
            }
        ]);
    }

    // Show edit party modal
    showEditPartyModal(id) {
        const party = this.partyService.getPartyById(id);
        if (!party) return;

        const modal = new Modal({
            title: 'Edit Party',
            content: Forms.createPartyForm(party)
        });

        const modalEl = modal.open();
        modal.addFooter([
            {
                text: 'Cancel',
                className: 'btn btn-ghost',
                onClick: () => modal.close()
            },
            {
                text: 'Update',
                className: 'btn btn-primary',
                onClick: () => {
                    if (Forms.validateForm('party-form')) {
                        const data = Forms.getPartyFormData();
                        this.partyService.updateParty(id, data);
                        modal.close();
                        this.render(document.getElementById('main-content'));
                        Modal.alert('Success', 'Party updated successfully', 'success');
                    }
                }
            }
        ]);
    }

    // Show party details
    showPartyDetails(id) {
        const stats = this.partyService.getPartyStats(id);
        if (!stats) return;

        const { party } = stats;
        const transactions = this.partyService.getPartyTransactions(id);

        const modal = new Modal({
            title: party.name,
            size: 'large',
            content: `
        <div style="margin-bottom: 1rem;">
          <span class="badge badge-${party.type === 'Vendor' ? 'primary' : 'success'}">${party.type}</span>
        </div>
        
        <div class="stats-grid" style="margin-bottom: 2rem;">
          <div class="stat-card primary">
            <div class="stat-label">Current Balance</div>
            <div class="stat-value">${this.calculator.formatCurrency(stats.currentBalance)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Transactions</div>
            <div class="stat-value">${stats.totalTransactions}</div>
          </div>
        </div>

        <h4 style="margin-bottom: 1rem;">Transaction History</h4>
        ${transactions.length > 0 ? `
          <div style="max-height: 400px; overflow-y: auto;">
            ${transactions.map(txn => {
                const isCredit = (party.type === 'Vendor' && txn.type === 'purchase') ||
                    (party.type === 'Customer' && txn.type === 'payment');
                return `
                <div class="ledger-entry ${isCredit ? 'credit' : 'debit'}">
                  <div class="ledger-date">${new Date(txn.date).toLocaleDateString()}</div>
                  <div class="ledger-description">
                    ${txn.type === 'purchase' ? 'Purchase' :
                        txn.type === 'sale' ? 'Sale' :
                            'Payment'}
                  </div>
                  <div class="ledger-amount ${isCredit ? 'credit' : 'debit'}">
                    ${this.calculator.formatCurrency(txn.amount)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : '<p class="text-gray">No transactions yet</p>'}
      `
        });

        modal.open();
    }
}

// Export to window
window.PartiesPage = PartiesPage;
