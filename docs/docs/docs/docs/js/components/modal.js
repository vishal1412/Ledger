// ===================================
// MODAL COMPONENT
// ===================================

class Modal {
    constructor(options = {}) {
        this.title = options.title || 'Modal';
        this.content = options.content || '';
        this.size = options.size || 'medium'; // small, medium, large
        this.onClose = options.onClose || null;
        this.onCreate = options.onCreate || null;
        this.backdrop = null;
        this.modal = null;
    }

    // Open modal
    open() {
        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop';
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop) {
                this.close();
            }
        });

        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = `modal modal-${this.size}`;
        this.modal.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">${this.title}</h2>
        <button class="modal-close" id="modal-close-btn">×</button>
      </div>
      <div class="modal-body" id="modal-body">
        ${this.content}
      </div>
    `;

        // Add to backdrop
        this.backdrop.appendChild(this.modal);
        document.body.appendChild(this.backdrop);

        // Setup event listeners
        document.getElementById('modal-close-btn').addEventListener('click', () => this.close());

        // Call onCreate callback
        if (this.onCreate) {
            this.onCreate(this.modal);
        }

        return this.modal;
    }

    // Close modal
    close() {
        if (this.backdrop) {
            this.backdrop.remove();
            this.backdrop = null;
            this.modal = null;

            if (this.onClose) {
                this.onClose();
            }
        }
    }

    // Update content
    updateContent(content) {
        const body = document.getElementById('modal-body');
        if (body) {
            body.innerHTML = content;
        }
    }

    // Add footer
    addFooter(buttons) {
        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = btn.className || 'btn';
            button.textContent = btn.text;
            button.addEventListener('click', btn.onClick);
            footer.appendChild(button);
        });

        this.modal.appendChild(footer);
        return footer;
    }

    // Show loading
    showLoading(message = 'Loading...') {
        this.updateContent(`
      <div style="text-align: center; padding: 2rem;">
        <div class="spinner"></div>
        <p class="loading-text">${message}</p>
      </div>
    `);
    }

    // Show error
    showError(message) {
        this.updateContent(`
      <div class="alert alert-danger">
        ${message}
      </div>
    `);
    }

    // Show success
    showSuccess(message) {
        this.updateContent(`
      <div class="alert alert-success">
        ${message}
      </div>
    `);
    }

    // Static method to show alert
    static alert(title, message, type = 'info') {
        const modal = new Modal({
            title,
            content: `<div class="alert alert-${type}">${message}</div>`
        });
        const modalEl = modal.open();
        modal.addFooter([{
            text: 'OK',
            className: 'btn btn-primary',
            onClick: () => modal.close()
        }]);
        return modal;
    }

    // Static method to confirm
    static confirm(title, message, onConfirm) {
        const modal = new Modal({
            title,
            content: `<p>${message}</p>`
        });
        const modalEl = modal.open();
        modal.addFooter([
            {
                text: 'Cancel',
                className: 'btn btn-ghost',
                onClick: () => modal.close()
            },
            {
                text: 'Confirm',
                className: 'btn btn-primary',
                onClick: () => {
                    if (onConfirm) onConfirm();
                    modal.close();
                }
            }
        ]);
        return modal;
    }
}

// Export to window
window.Modal = Modal;
