/**
 * AI Assistant Page
 * Natural language interface for ledger operations
 */

const AIAssistant = (() => {
  let conversationHistory = [];
  let pendingConfirmation = null;

  const HTML = `
    <div class="ai-assistant-container">
      <!-- Header -->
      <div class="ai-header">
        <h1>🤖 AI Assistant</h1>
        <p>Chat naturally to manage your business ledger</p>
      </div>

      <!-- Main Content -->
      <div class="ai-content">
        <!-- Chat Area -->
        <div class="ai-chat-wrapper">
          <div id="chatMessages" class="ai-chat-messages">
            <div class="ai-message ai-welcome">
              <div class="ai-message-avatar">🤖</div>
              <div class="ai-message-content">
                <p><strong>Welcome to AI Assistant!</strong></p>
                <p>I can help you:</p>
                <ul style="margin-top: 10px; margin-left: 20px;">
                  <li>Add vendors and customers</li>
                  <li>Record purchases and sales</li>
                  <li>Track payments</li>
                  <li>Manage stock</li>
                  <li>Extract bills using images</li>
                  <li>Get financial reports</li>
                </ul>
                <p style="margin-top: 15px; font-size: 12px; color: #666;">Examples:</p>
                <ul style="font-size: 12px; color: #666; margin-left: 20px;">
                  <li>"I received 50 cement bags from Ramesh Traders at 350 per bag"</li>
                  <li>"I paid 20,000 to Ramesh Traders in cash"</li>
                  <li>"Sent 100 bricks to Aman Builders at 8 each"</li>
                  <li>"Show me stock of cement bags"</li>
                  <li>"How much does Ramesh Traders owe me?"</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Chat Input -->
          <div class="ai-input-area">
            <!-- File Upload -->
            <div class="ai-file-upload">
              <input 
                type="file" 
                id="aiImageInput" 
                accept="image/*" 
                style="display: none;"
              />
              <button 
                class="ai-upload-btn" 
                onclick="AIAssistant.triggerImageUpload()"
                title="Upload bill/invoice image"
              >
                📎 Attach Image
              </button>
              <span id="aiFileName" class="ai-file-name"></span>
            </div>

            <!-- Text Input -->
            <div class="ai-text-input-wrapper">
              <textarea
                id="aiInput"
                class="ai-text-input"
                placeholder="Type your message... (e.g., 'I received 50 cement bags from Ramesh at 350 each')"
                rows="2"
              ></textarea>
              <button
                class="ai-send-btn"
                onclick="AIAssistant.sendMessage()"
              >
                Send 📤
              </button>
            </div>

            <!-- Keyboard shortcut hint -->
            <small style="color: #999; text-align: center; display: block; margin-top: 5px;">
              Shift+Enter to send
            </small>
          </div>
        </div>

        <!-- Sidebar: Recent Transactions & Quick Actions -->
        <div class="ai-sidebar">
          <div class="ai-panel">
            <h3>💡 Quick Actions</h3>
            <div class="ai-quick-actions">
              <button class="ai-quick-btn" onclick="AIAssistant.quickAction('summary')">
                Dashboard Summary
              </button>
              <button class="ai-quick-btn" onclick="AIAssistant.quickAction('vendors')">
                List Vendors
              </button>
              <button class="ai-quick-btn" onclick="AIAssistant.quickAction('customers')">
                List Customers
              </button>
              <button class="ai-quick-btn" onclick="AIAssistant.quickAction('stock')">
                Show Stock
              </button>
            </div>
          </div>

          <div class="ai-panel">
            <h3>📋 Pending Confirmation</h3>
            <div id="aiPendingArea" class="ai-pending-area">
              <p style="color: #999; text-align: center; font-size: 12px;">
                No pending transactions
              </p>
            </div>
          </div>

          <div class="ai-panel">
            <h3>⚙️ Settings</h3>
            <div style="font-size: 12px;">
              <label style="display: flex; align-items: center; margin-bottom: 10px;">
                <input 
                  type="checkbox" 
                  id="aiAutoConfirm" 
                  checked
                  style="margin-right: 8px;"
                />
                Auto-confirm transactions
              </label>
              <label style="display: flex; align-items: center;">
                <input 
                  type="checkbox" 
                  id="aiShowDetails" 
                  checked
                  style="margin-right: 8px;"
                />
                Show detailed responses
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <div id="aiConfirmModal" class="ai-modal" style="display: none;">
        <div class="ai-modal-content">
          <div class="ai-modal-header">
            <h2>⚠️ Confirm Transaction</h2>
            <button class="ai-modal-close" onclick="AIAssistant.closeConfirmation()">✕</button>
          </div>
          <div class="ai-modal-body" id="aiConfirmBody">
            <!-- Transaction preview will be inserted here -->
          </div>
          <div class="ai-modal-footer">
            <button class="ai-modal-btn ai-modal-cancel" onclick="AIAssistant.closeConfirmation()">
              Cancel
            </button>
            <button class="ai-modal-btn ai-modal-confirm" onclick="AIAssistant.confirmTransaction()">
              ✓ Confirm & Execute
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  function init() {
    const page = document.getElementById('pageContent');
    if (!page) return;

    page.innerHTML = HTML;

    // Setup event listeners
    const aiInput = document.getElementById('aiInput');
    aiInput.addEventListener('keydown', handleKeydown);

    const imageInput = document.getElementById('aiImageInput');
    imageInput.addEventListener('change', handleImageSelect);

    loadConversationHistory();
    console.log('AI Assistant initialized');
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileNameEl = document.getElementById('aiFileName');
    fileNameEl.textContent = `✓ ${file.name}`;

    // Store file in memory for sending with message
    AIAssistant._selectedFile = file;
  }

  function triggerImageUpload() {
    document.getElementById('aiImageInput').click();
  }

  async function sendMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();

    if (!message) {
      alert('Please enter a message');
      return;
    }

    // Clear input
    input.value = '';
    document.getElementById('aiFileName').textContent = '';

    // Add user message to chat
    addMessageToChat('user', message);

    try {
      // Prepare image data if file selected
      let imageBase64 = null;
      let imageMediaType = null;

      if (AIAssistant._selectedFile) {
        imageBase64 = await fileToBase64(AIAssistant._selectedFile);
        imageMediaType = AIAssistant._selectedFile.type;
        AIAssistant._selectedFile = null;
      }

      // Show loading indicator
      showLoadingIndicator();

      // Send to AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          image: imageBase64,
          imageMediaType,
          userId: getUserId(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }

      const result = await response.json();

      // Remove loading indicator
      hideLoadingIndicator();

      // Process AI response
      if (result.success && result.data) {
        handleAIResponse(result.data);
      } else {
        addMessageToChat('assistant', 'Sorry, something went wrong. Please try again.');
      }
    } catch (error) {
      hideLoadingIndicator();
      console.error('Error sending message:', error);
      addMessageToChat('assistant', `❌ Error: ${error.message}`);
    }
  }

  function handleAIResponse(aiData) {
    // Show AI message
    addMessageToChat('assistant', aiData.message);

    // Process tool results
    if (aiData.toolCalls && aiData.toolCalls.length > 0) {
      for (const toolCall of aiData.toolCalls) {
        const result = toolCall.result;

        // Show transaction preview/summary
        if (result.success) {
          showTransactionSummary(toolCall);
        } else if (result.error) {
          addMessageToChat('assistant', `⚠️ Error: ${result.error}`);
        }
      }
    }

    // Store conversation in history
    saveConversationHistory({
      timestamp: new Date(),
      userMessage: document.getElementById('aiInput').value,
      aiResponse: aiData.message,
      toolCalls: aiData.toolCalls,
    });
  }

  function showTransactionSummary(toolCall) {
    const { name, input, result } = toolCall;

    let summary = '';

    switch (name) {
      case 'createVendorOrder':
        summary = `
          <div class="ai-transaction-summary">
            <h4>📦 Purchase Order Created</h4>
            <table>
              <tr><td>Vendor:</td><td><strong>${input.vendorName}</strong></td></tr>
              <tr><td>Product:</td><td>${input.productName}</td></tr>
              <tr><td>Quantity:</td><td>${input.quantity}</td></tr>
              <tr><td>Rate:</td><td>₹${input.rate}</td></tr>
              <tr><td>Total:</td><td><strong>₹${result.totalAmount}</strong></td></tr>
            </table>
            <p style="margin-top: 10px; color: #27ae60;">✓ ${result.message}</p>
          </div>
        `;
        break;

      case 'recordVendorPayment':
        summary = `
          <div class="ai-transaction-summary">
            <h4>💳 Vendor Payment Recorded</h4>
            <table>
              <tr><td>Vendor:</td><td><strong>${input.vendorName}</strong></td></tr>
              <tr><td>Amount:</td><td><strong>₹${input.amount}</strong></td></tr>
              <tr><td>Method:</td><td>${input.paymentMethod || 'cash'}</td></tr>
              <tr><td>Date:</td><td>${input.date || 'Today'}</td></tr>
            </table>
            <p style="margin-top: 10px; color: #27ae60;">✓ ${result.message}</p>
          </div>
        `;
        break;

      case 'createCustomerSale':
        summary = `
          <div class="ai-transaction-summary">
            <h4>🛒 Customer Sale Recorded</h4>
            <table>
              <tr><td>Customer:</td><td><strong>${input.customerName}</strong></td></tr>
              <tr><td>Product:</td><td>${input.productName}</td></tr>
              <tr><td>Quantity:</td><td>${input.quantity}</td></tr>
              <tr><td>Rate:</td><td>₹${input.rate}</td></tr>
              <tr><td>Total:</td><td><strong>₹${result.totalAmount}</strong></td></tr>
            </table>
            <p style="margin-top: 10px; color: #27ae60;">✓ ${result.message}</p>
          </div>
        `;
        break;

      case 'recordCustomerPayment':
        summary = `
          <div class="ai-transaction-summary">
            <h4>💰 Customer Payment Received</h4>
            <table>
              <tr><td>Customer:</td><td><strong>${input.customerName}</strong></td></tr>
              <tr><td>Amount:</td><td><strong>₹${input.amount}</strong></td></tr>
              <tr><td>Method:</td><td>${input.paymentMethod || 'cash'}</td></tr>
              <tr><td>Date:</td><td>${input.date || 'Today'}</td></tr>
            </table>
            <p style="margin-top: 10px; color: #27ae60;">✓ ${result.message}</p>
          </div>
        `;
        break;

      case 'createParty':
        summary = `
          <div class="ai-transaction-summary">
            <h4>👥 New ${input.partyType === 'vendor' ? 'Vendor' : 'Customer'} Added</h4>
            <table>
              <tr><td>Name:</td><td><strong>${input.partyName}</strong></td></tr>
              <tr><td>Type:</td><td>${input.partyType}</td></tr>
              <tr><td>Opening Balance:</td><td>₹${input.openingBalance}</td></tr>
            </table>
            <p style="margin-top: 10px; color: #27ae60;">✓ ${result.message}</p>
          </div>
        `;
        break;

      case 'adjustStock':
        summary = `
          <div class="ai-transaction-summary">
            <h4>📊 Stock Adjusted</h4>
            <table>
              <tr><td>Product:</td><td><strong>${input.productName}</strong></td></tr>
              <tr><td>Adjustment:</td><td>${input.adjustmentType} ${input.quantity}</td></tr>
              <tr><td>New Quantity:</td><td><strong>${result.newQuantity}</strong></td></tr>
              <tr><td>Reason:</td><td>${input.reason || 'N/A'}</td></tr>
            </table>
            <p style="margin-top: 10px; color: #27ae60;">✓ ${result.message}</p>
          </div>
        `;
        break;

      case 'getDashboardSummary':
        const summary_data = result.summary;
        summary = `
          <div class="ai-transaction-summary">
            <h4>📈 Dashboard Summary</h4>
            <table>
              <tr><td>Total Receivable:</td><td><strong>₹${summary_data.totalReceivable}</strong></td></tr>
              <tr><td>Total Payable:</td><td><strong>₹${summary_data.totalPayable}</strong></td></tr>
              <tr><td>Total Sales:</td><td>₹${summary_data.totalSales}</td></tr>
              <tr><td>Total Purchases:</td><td>₹${summary_data.totalPurchases}</td></tr>
              <tr><td>Net Profit:</td><td style="color: ${summary_data.netProfit >= 0 ? '#27ae60' : '#e74c3c'};"><strong>₹${summary_data.netProfit}</strong></td></tr>
            </table>
          </div>
        `;
        break;

      case 'getPartyLedger':
        const party = result.party;
        const balance = party.payable || party.receivable || 0;
        summary = `
          <div class="ai-transaction-summary">
            <h4>📋 ${party.name} Ledger</h4>
            <table>
              <tr><td>Type:</td><td>${party.type}</td></tr>
              <tr><td>${party.type === 'vendor' ? 'Payable' : 'Receivable'}:</td><td><strong>₹${balance}</strong></td></tr>
              <tr><td>Recent Transactions:</td><td>${result.transactions.length}</td></tr>
            </table>
          </div>
        `;
        break;

      case 'getStockDetails':
        const products = result.allProducts || [];
        summary = `
          <div class="ai-transaction-summary">
            <h4>📦 Stock Details</h4>
            <table>
              <tr><th>Product</th><th>Quantity</th><th>Unit</th></tr>
              ${products.map(p => `<tr><td>${p.product}</td><td>${p.quantity}</td><td>${p.unit}</td></tr>`).join('')}
            </table>
          </div>
        `;
        break;

      case 'extractFromImage':
        const extracted = result.extractedData;
        summary = `
          <div class="ai-transaction-summary">
            <h4>📄 Bill Extracted</h4>
            <table>
              <tr><td>Vendor:</td><td><strong>${extracted.vendorName}</strong></td></tr>
              <tr><td>Invoice #:</td><td>${extracted.invoiceNumber || 'N/A'}</td></tr>
              <tr><td>Date:</td><td>${extracted.invoiceDate || 'N/A'}</td></tr>
              <tr><td>Items:</td><td>${extracted.items?.length || 0}</td></tr>
              <tr><td>Total:</td><td><strong>₹${extracted.totalAmount}</strong></td></tr>
            </table>
            <small style="color: #666; margin-top: 10px; display: block;">
              Review details before confirming
            </small>
          </div>
        `;
        break;

      default:
        summary = `<div class="ai-transaction-summary"><p>${result.message}</p></div>`;
    }

    addMessageToChat('assistant', summary, true);
  }

  function addMessageToChat(sender, content, isHtml = false) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');

    messageEl.className = `ai-message ai-message-${sender}`;
    messageEl.innerHTML = `
      <div class="ai-message-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
      <div class="ai-message-content">
        ${isHtml ? content : `<p>${escapeHtml(content)}</p>`}
      </div>
    `;

    messagesDiv.appendChild(messageEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function showLoadingIndicator() {
    const messagesDiv = document.getElementById('chatMessages');
    const loadingEl = document.createElement('div');
    loadingEl.id = 'aiLoadingIndicator';
    loadingEl.className = 'ai-message ai-loading';
    loadingEl.innerHTML = `
      <div class="ai-message-avatar">🤖</div>
      <div class="ai-message-content">
        <div class="ai-typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesDiv.appendChild(loadingEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function hideLoadingIndicator() {
    const loading = document.getElementById('aiLoadingIndicator');
    if (loading) loading.remove();
  }

  function quickAction(action) {
    const messages = {
      summary: 'Show me a dashboard summary with total receivable, payable, and profit',
      vendors: 'List all my vendors and what they owe me',
      customers: 'List all my customers and what they owe to me',
      stock: 'Show me current stock levels of all products',
    };

    const aiInput = document.getElementById('aiInput');
    aiInput.value = messages[action] || '';
    aiInput.focus();
  }

  function closeConfirmation() {
    const modal = document.getElementById('aiConfirmModal');
    modal.style.display = 'none';
    pendingConfirmation = null;
  }

  async function confirmTransaction() {
    if (!pendingConfirmation) return;

    try {
      const response = await fetch('/api/ai/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName: pendingConfirmation.name,
          toolInput: pendingConfirmation.input,
          userId: getUserId(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        addMessageToChat('assistant', `✓ Transaction confirmed and executed successfully!`);
        closeConfirmation();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error confirming transaction: ' + error.message);
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function saveConversationHistory(entry) {
    conversationHistory.push(entry);
    localStorage.setItem('aiConversationHistory', JSON.stringify(conversationHistory));
  }

  function loadConversationHistory() {
    try {
      const saved = localStorage.getItem('aiConversationHistory');
      if (saved) {
        conversationHistory = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading conversation history:', e);
    }
  }

  function getUserId() {
    // This should be fetched from your authentication system
    // For now, using a simple user identifier
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Date.now()}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  return {
    init,
    sendMessage,
    quickAction,
    triggerImageUpload,
    closeConfirmation,
    confirmTransaction,
    _selectedFile: null,
  };
})();

// Auto-initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AIAssistant.init);
} else {
  AIAssistant.init();
}
