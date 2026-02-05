// ===================================
// MAIN APPLICATION
// ===================================

class App {
    constructor() {
        this.navigation = null;
        this.currentPage = null;
        this.pages = null; // Will initialize after DOM loads
    }

    // Initialize application
    init() {
        console.log('🚀 Business Ledger Application Starting...');

        // Verify all required classes and services are loaded
        console.log('Checking dependencies...');
        console.log('Storage:', typeof window.storage);
        console.log('Calculator:', typeof window.calculator);
        console.log('Party Service:', typeof window.partyService);
        console.log('Stock Service:', typeof window.stockService);
        console.log('DashboardPage:', typeof DashboardPage);
        console.log('PartiesPage:', typeof PartiesPage);

        // Initialize pages now that all services are loaded
        console.log('Initializing pages...');
        try {
            this.pages = {
                dashboard: new DashboardPage(),
                parties: new PartiesPage(),
                vendors: new VendorsPage(),
                customers: new CustomersPage(),
                stock: new StockPage()
            };
            console.log('✓ Pages initialized successfully');
        } catch (error) {
            console.error('✗ Error initializing pages:', error);
            return;
        }

        // Render navigation
        console.log('Rendering navigation...');
        try {
            this.navigation = new Navigation();
            this.navigation.render(document.getElementById('app-container'));
            console.log('✓ Navigation rendered');
        } catch (error) {
            console.error('✗ Error rendering navigation:', error);
            return;
        }

        // Listen for navigation events
        window.addEventListener('navigate', (e) => {
            this.loadPage(e.detail.page);
        });

        // Listen for hash changes (browser back/forward)
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });

        // Load initial page based on URL hash or default to dashboard
        console.log('Loading initial page...');
        try {
            this.handleHashChange();
            console.log('✓ Initial page loaded');
        } catch (error) {
            console.error('✗ Error loading initial page:', error);
            return;
        }

        // Setup global error handler
        window.addEventListener('error', (e) => {
            console.error('Application Error:', e.error);
        });

        // Setup low stock alert handler
        window.addEventListener('low-stock-alert', (e) => {
            console.warn('Low Stock Alert:', e.detail);
        });

        console.log('✅ Application Initialized Successfully');
    }

    // Handle hash changes
    handleHashChange() {
        let hash = window.location.hash.substring(1).toLowerCase(); // Remove # and convert to lowercase
        
        // Default to dashboard if no hash or invalid hash
        if (!hash || !this.pages[hash]) {
            hash = 'dashboard';
        }
        
        console.log(`Hash changed to: ${hash}`);
        
        // Update navigation and load page
        if (this.navigation) {
            this.navigation.currentPage = hash;
            this.navigation.navigate(hash);
        } else {
            this.loadPage(hash);
        }
    }

    // Load page
    loadPage(pageName) {
        console.log(`Loading page: ${pageName}`);

        const page = this.pages[pageName];
        if (!page) {
            console.error(`Page ${pageName} not found`);
            return;
        }

        const container = document.getElementById('main-content');
        if (!container) {
            console.error('Main content container not found');
            return;
        }

        try {
            // Render page
            page.render(container);
            this.currentPage = pageName;

            // Update URL hash
            window.location.hash = pageName;

            console.log(`✓ Page ${pageName} rendered successfully`);
        } catch (error) {
            console.error(`✗ Error rendering page ${pageName}:`, error);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing App');
    try {
        const app = new App();
        app.init();
        window.app = app; // Make app available globally for debugging
    } catch (error) {
        console.error('Fatal error initializing application:', error);
        document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h1 style="color: red;">Application Failed to Load</h1>
        <p>Please check the browser console for errors.</p>
        <pre style="text-align: left; background

: #f5f5f5; padding: 1rem;">${error.message}\n\n${error.stack}</pre>
      </div>
    `;
    }
});

// Export to window
window.App = App;
