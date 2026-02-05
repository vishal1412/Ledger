// ===================================
// NAVIGATION COMPONENT
// ===================================

class Navigation {
  constructor() {
    this.currentPage = 'dashboard';
    this.pages = {
      dashboard: { title: 'Dashboard', icon: '📊' },
      parties: { title: 'Parties', icon: '👥' },
      vendors: { title: 'Vendors', icon: '🏭' },
      customers: { title: 'Customers', icon: '🧾' },
      stock: { title: 'Stock', icon: '📦' }
    };
  }

  // Render navigation
  render(container) {
    // Create sidebar and main-content layout
    container.innerHTML = `
      <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <h1 class="sidebar-logo">📒 Ledger</h1>
        </div>
        <ul class="sidebar-nav" id="sidebar-nav">
          ${Object.keys(this.pages).map(page => `
            <li class="nav-item">
              <a href="#${page}" class="nav-link ${page === this.currentPage ? 'active' : ''}" 
                 data-page="${page}">
                <span class="nav-icon">${this.pages[page].icon}</span>
                <span>${this.pages[page].title}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="main-content" id="main-content">
        <!-- Page content will be rendered here -->
      </div>
    `;

    this.setupEventListeners();
  }

  // Setup event listeners
  setupEventListeners() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.navigate(page);
      });
    });
  }

  // Navigate to page
  navigate(page) {
    if (this.currentPage === page) return;

    this.currentPage = page;

    // Update active state
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.page === page) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Dispatch navigation event
    const event = new CustomEvent('navigate', { detail: { page } });
    window.dispatchEvent(event);
  }

  // Get current page
  getCurrentPage() {
    return this.currentPage;
  }
}

// Export to window
window.Navigation = Navigation;
