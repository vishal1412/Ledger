# 🤖 AI Assistant Integration Guide

## Overview

The AI Assistant integrates OpenAI's GPT-4 with your Ledger system, providing a natural language interface for all business operations. Users can manage vendors, customers, stock, and finances through conversational commands.

## Features

- ✅ **Natural Language Processing**: Understand business commands in plain English
- ✅ **Vendor Management**: Add vendors and record purchases
- ✅ **Customer Management**: Add customers and record sales
- ✅ **Payment Tracking**: Record vendor and customer payments
- ✅ **Stock Management**: Adjust inventory levels
- ✅ **Bill Extraction**: Upload images to extract vendor details and items
- ✅ **Financial Reports**: Get dashboard summaries and party ledgers
- ✅ **Confirmation Workflow**: Review transactions before execution
- ✅ **Conversation History**: Track all AI interactions

## Setup Instructions

### 1. Install Dependencies

```bash
npm install openai zod jsonwebtoken
```

### 2. Environment Variables

Add to your `.env` or Vercel environment variables:

```env
OPENAI_API_KEY=sk_test_your_actual_key_here
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### 3. Database Setup

The AI service uses your existing MongoDB collections:
- `parties` - Vendors and customers
- `purchases` - Purchase orders
- `sales` - Sales transactions
- `payments` - Payment records
- `stock` - Inventory

### 4. Backend Files

Created files:
- `/api/aiService.js` - Core AI logic and tool implementations
- `/api/aiController.js` - HTTP request handlers
- `/api/aiRoutes.js` - Express route definitions

### 5. Frontend Files

Created files:
- `/js/pages/aiAssistant.js` - AI Assistant UI component
- `/css/ai-assistant.css` - Styling for AI interface

### 6. Update Main Files

Already updated:
- `package.json` - Added dependencies
- `server.js` - Registered AI routes
- `index.html` - Added AI CSS and script
- `js/components/navigation.js` - Added AI Assistant menu item
- `js/app.js` - Registered AI page

## API Endpoint

### POST /api/ai/chat

Send a user message and optional image to the AI Assistant.

**Request:**
```json
{
  "message": "I received 50 cement bags from Ramesh Traders at 350 per bag",
  "image": "base64_encoded_image_or_null",
  "imageMediaType": "image/jpeg",
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Purchase order created successfully",
    "toolCalls": [
      {
        "name": "createVendorOrder",
        "input": { ... },
        "result": { ... }
      }
    ]
  }
}
```

## Tool Definitions

The AI can call these tools:

### 1. `createVendorOrder`
Record a purchase from a vendor.
```
Example: "I received 50 cement bags from Ramesh Traders at 350 per bag"
```

### 2. `recordVendorPayment`
Pay a vendor.
```
Example: "I paid 20,000 to Ramesh Traders in cash"
```

### 3. `createCustomerSale`
Sell to a customer.
```
Example: "Sent 100 bricks to Aman Builders at 8 per brick"
```

### 4. `recordCustomerPayment`
Receive customer payment.
```
Example: "Aman Builders paid 25,000"
```

### 5. `createParty`
Add new vendor or customer.
```
Example: "Add new vendor Shyam Suppliers with 50,000 opening debit"
```

### 6. `adjustStock`
Modify inventory.
```
Example: "Add 200 steel rods to stock - received additional order"
```

### 7. `getDashboardSummary`
Get financial overview.
```
Example: "Show me a summary of my business"
```

### 8. `getPartyLedger`
View party transactions.
```
Example: "How much does Ramesh Traders owe me?"
```

### 9. `getStockDetails`
Check inventory.
```
Example: "Show me stock of cement bags"
```

### 10. `extractFromImage`
Parse bill/invoice images.
```
User uploads image → AI extracts vendor, items, quantities, total
```

## Usage Examples

### Add Vendor & Record Purchase
```
User: "I received 50 cement bags from Ramesh Traders at 350 per bag"

AI Response:
- Identifies vendor: Ramesh Traders
- Extracts: 50 bags, ₹350/unit
- Creates purchase order
- Updates party payable
- Shows confirmation
```

### Pay Vendor
```
User: "I paid 20,000 to Ramesh Traders in cash"

AI Response:
- Identifies vendor
- Records payment
- Updates payable balance
- Shows confirmation
```

### Record Sale
```
User: "Sent 100 bricks to Aman Builders at 8 each on credit"

AI Response:
- Checks stock (must have 100+ bricks)
- Creates sale record
- Decreases stock
- Updates customer receivable
- Shows confirmation
```

### Upload Bill Image
```
User uploads image of bill

AI Response:
- Uses OCR to extract: vendor name, items, quantities, total
- Shows extracted data
- Allows confirmation before saving
```

### Get Reports
```
User: "How much does Ramesh Traders owe me?"

AI Response: Shows complete ledger with all transactions and balance

User: "What's my total receivable?"

AI Response: Sums all customer receivables
```

## Security Features

### 1. JWT Authentication (Optional)
```javascript
// Add middleware in aiRoutes.js
app.post('/api/ai/chat', verifyToken, async (req, res) => {
  // Handle request
});
```

### 2. Input Validation
All inputs validated with Zod schemas:
- Vendor/customer names required
- Amounts must be positive
- Quantities must be positive
- Stock checks prevent negative inventory

### 3. Action Logging
All AI-triggered actions logged with:
- User ID
- Timestamp
- Action type
- Input parameters
- Result status

### 4. Confirmation Workflow
Users can enable `Auto-confirm` checkbox or review each transaction

## Frontend Integration

### AI Assistant Page

Accessible via navigation menu at `#aiAssistant`

**Features:**
- 💬 Chat interface with real-time messages
- 📎 Image upload for bill extraction
- 📋 Transaction summaries and confirmations
- 💡 Quick action buttons
- ⚙️ Settings (auto-confirm, detailed responses)
- 📊 Recent transaction preview

### Quick Actions
- Dashboard Summary
- List Vendors
- List Customers
- Show Stock

## Customization

### Modify Tool Definitions

Edit `/api/aiService.js` `aiTools` array to add/remove tools:

```javascript
{
  type: 'function',
  function: {
    name: 'myCustomTool',
    description: 'What this tool does',
    parameters: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: '...' },
        param2: { type: 'number', description: '...' }
      },
      required: ['param1']
    }
  }
}
```

### Add Custom Tool Handler

In `/api/aiService.js`:

```javascript
case 'myCustomTool':
  return await myCustomTool(toolInput, userId);

async function myCustomTool(input, userId) {
  // Implementation
  return { success: true, message: '...' };
}
```

### Customize Prompts

Modify the system prompt in `aiChat()` function to guide AI behavior:

```javascript
const systemPrompt = `You are a business accounting assistant...`;
```

## Troubleshooting

### Error: "OPENAI_API_KEY not configured"
```
Solution: Set OPENAI_API_KEY in environment variables
```

### Error: "Insufficient stock"
```
Solution: Check inventory before attempting sale
Error message shows available vs requested quantity
```

### Error: "Party not found"
```
Solution: Create vendor/customer first using createParty tool
AI will prompt to add party if not found
```

### Image extraction not working
```
Solution:
1. Verify image is clear and readable
2. Check file format (JPEG/PNG supported)
3. Ensure text is visible on bill
4. Try different image quality
```

### Tool calls not executing
```
Solution:
1. Check MONGODB_URI is set correctly
2. Verify database collections exist
3. Check browser console for errors
4. Ensure userId is provided
```

## Performance Optimization

### 1. Rate Limiting
Implement in production:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/ai', limiter);
```

### 2. Caching
Cache party lists and stock data:
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

### 3. Batch Operations
Group multiple transactions:
```javascript
// Create multiple purchases in one AI request
"I received: 50 bags from vendor1, 100 units from vendor2, 25 from vendor3"
```

## Testing

### Manual Testing

1. Open AI Assistant page
2. Try example messages:
   - "Add vendor Raj Suppliers with 10000 opening balance"
   - "I received 20 units of item1 from Raj Suppliers at 500 each"
   - "Show me stock details"

### API Testing with curl

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I received 50 items from TestVendor at 100 each",
    "userId": "test_user_1"
  }'
```

## Advanced Features

### Monthly Profit Calculation
```javascript
// Get all sales and purchases for month
// Calculate: Total Sales - Total Purchases
```

### Vendor Aging Analysis
```javascript
// Group payments by vendor
// Calculate days outstanding
// Identify overdue payments
```

### Cash Flow Prediction
```javascript
// Analyze payment history
// Project future cash needs
```

### Stock Movement Trends
```javascript
// Track stock in/out over time
// Identify fast/slow moving items
```

## Support & Documentation

- OpenAI API Docs: https://platform.openai.com/docs
- Zod Validation: https://zod.dev
- MongoDB Guide: https://docs.mongodb.com

## Future Enhancements

- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Advanced analytics
- [ ] Custom report generation
- [ ] AI-powered recommendations
- [ ] Predictive analysis
- [ ] Email integration
- [ ] SMS alerts
