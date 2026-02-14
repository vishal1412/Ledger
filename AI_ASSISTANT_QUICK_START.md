# 🚀 AI Assistant Quick Start

## What's New?

Your Ledger system now has a powerful **AI Assistant** that understands natural language and executes business operations automatically.

## ⚡ Quick Setup (5 minutes)

### 1. Get OpenAI API Key
- Visit: https://platform.openai.com/api-keys
- Click "Create new secret key"
- Copy and save it

### 2. Set Environment Variable

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="sk_test_your_key_here"
$env:MONGODB_URI="your_mongodb_connection"
```

**Mac/Linux:**
```bash
export OPENAI_API_KEY="sk_test_your_key_here"
export MONGODB_URI="your_mongodb_connection"
```

**Or create `.env` file:**
```
OPENAI_API_KEY=sk_test_your_key_here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Server
```bash
npm start
```

### 5. Access AI Assistant
Open: http://localhost:3000/#aiAssistant

## 🎯 Try These Examples

### Add a Vendor
```
"Add vendor Ramesh Traders with 50000 opening balance"
```

### Record a Purchase
```
"I received 50 cement bags from Ramesh Traders at 350 per bag"
```

### Record a Payment
```
"I paid 20000 to Ramesh Traders in cash"
```

### Add a Customer
```
"Add customer Aman Builders, they owe me 25000 already"
```

### Record a Sale
```
"Sold 100 bricks to Aman Builders at 8 each on credit"
```

### Check Stock
```
"Show me stock details for cement bags"
```

### Get Summary
```
"Show me my dashboard with total receivable, payable, and profit"
```

### Upload Bill Image
Click "📎 Attach Image" and upload a purchase bill/invoice. AI will extract:
- Vendor name
- Items
- Quantities
- Total amount

## 📁 Files Added/Modified

### Backend
- ✅ `/api/aiService.js` - AI logic and tools
- ✅ `/api/aiController.js` - HTTP handlers
- ✅ `/api/aiRoutes.js` - Express routes

### Frontend
- ✅ `/js/pages/aiAssistant.js` - Chat UI component
- ✅ `/css/ai-assistant.css` - Styling

### Configuration
- ✅ `package.json` - Added openai, zod dependencies
- ✅ `server.js` - Registered AI routes
- ✅ `index.html` - Added AI CSS/JS
- ✅ `js/components/navigation.js` - Added AI menu item
- ✅ `js/app.js` - Registered AI page

## 🧠 How It Works

```
User Input (Text or Image)
        ↓
OpenAI GPT-4 processes with Tools
        ↓
AI selects appropriate tool(s)
        ↓
Backend executes tool:
  - Validate input
  - Update database
  - Calculate balances
        ↓
Return results to AI
        ↓
AI formats human-readable response
        ↓
Show confirmation & transaction summary
```

## 🛠️ Available Tools

| Tool | Purpose | Example |
|------|---------|---------|
| `createVendorOrder` | Record purchase | "50 cement bags from Ramesh at 350" |
| `recordVendorPayment` | Pay vendor | "Paid 20000 to Ramesh" |
| `createCustomerSale` | Record sale | "Sold 100 bricks to Aman at 8" |
| `recordCustomerPayment` | Receive payment | "Aman paid 25000" |
| `createParty` | Add vendor/customer | "Add vendor XYZ with 50000 balance" |
| `adjustStock` | Adjust inventory | "Add 200 steel rods" |
| `getDashboardSummary` | Get overview | "Show me summary" |
| `getPartyLedger` | View transactions | "Ramesh Traders ledger" |
| `getStockDetails` | Check inventory | "Stock of cement" |
| `extractFromImage` | Parse bills | Upload image |

## 🔐 Security

- ✅ Input validation with Zod schemas
- ✅ All amounts must be positive
- ✅ Stock cannot go negative
- ✅ Payment cannot exceed balance
- ✅ Actions logged with user ID
- ✅ Confirmation workflow optional

## 💰 Costs

**OpenAI API Pricing:**
- GPT-4 Turbo: ~$0.011 per request
- ~$33/month for 100 requests/day
- ~$330/month for 1000 requests/day

**Cost Optimization:**
- Use GPT-3.5 Turbo instead (90% cheaper)
- Cache common responses
- Batch operations

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY not configured"
```
✓ Set OPENAI_API_KEY in environment variables
✓ Restart server
```

### Error: "Party not found"
```
✓ Create vendor/customer first
✓ Use exact name spelling
```

### Error: "Insufficient stock"
```
✓ Add more stock first
✓ Check stock before selling
```

### Image extraction not working
```
✓ Use clear, readable bill image
✓ Ensure text is visible
✓ Try JPEG or PNG format
```

## 📖 Full Documentation

- [AI Assistant Guide](./AI_ASSISTANT_GUIDE.md) - Comprehensive documentation
- [Environment Setup](./ENVIRONMENT_SETUP.md) - Setup instructions
- [API Reference](#) - Tool definitions

## 🌐 Deploying to Vercel

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Add AI Assistant"
   git push
   ```

2. Add environment variables in Vercel:
   - Dashboard → Settings → Environment Variables
   - Add `OPENAI_API_KEY`

3. Redeploy

4. Test at: `https://your-app.vercel.app/#aiAssistant`

## 📞 Support

- **OpenAI Issues:** https://help.openai.com
- **Vercel Issues:** https://vercel.com/support
- **Project Issues:** Check GitHub

## 🎉 What You Can Do Now

✨ **Everything via Natural Language:**
- Add vendors and customers
- Record purchases and sales
- Track payments
- Manage stock
- Upload bills via images
- Get financial reports
- Ask business questions

**Example Workflow:**

1. "Add vendor ABC Suppliers"
2. "Received 100 items from ABC at 50 each"
3. "Show me my payable to ABC"
4. "I paid 5000 to ABC in cash"
5. "What's my remaining balance?"

All in conversational English!

---

**Ready to start?** Open http://localhost:3000/#aiAssistant and try an example! 🚀
