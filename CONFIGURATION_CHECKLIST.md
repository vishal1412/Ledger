# 📋 AI Assistant Configuration Checklist

## Pre-Deployment Setup

### Step 1: OpenAI Account Setup ⏱️ 5 minutes

- [ ] Create/Login to OpenAI account: https://platform.openai.com
- [ ] Add payment method (for API usage)
- [ ] Go to API keys: https://platform.openai.com/api-keys
- [ ] Click "Create new secret key"
- [ ] Copy the key: `sk_test_...`
- [ ] Keep it secure (never share!)
- [ ] Test your quota: https://platform.openai.com/usage

### Step 2: Environment Variables ⏱️ 2 minutes

Choose one method:

#### Method A: .env File (Development)
```bash
# Create file in project root
cat > .env << EOF
OPENAI_API_KEY=sk_test_YOUR_KEY_HERE
MONGODB_URI=your_mongodb_connection_string
DEBUG=false
EOF

# Verify
cat .env
```

#### Method B: Windows PowerShell
```powershell
$env:OPENAI_API_KEY = "sk_test_YOUR_KEY_HERE"
$env:MONGODB_URI = "your_mongodb_connection_string"

# Verify
Write-Host $env:OPENAI_API_KEY
Write-Host $env:MONGODB_URI
```

#### Method C: Mac/Linux Shell
```bash
export OPENAI_API_KEY="sk_test_YOUR_KEY_HERE"
export MONGODB_URI="your_mongodb_connection_string"

# Verify
echo $OPENAI_API_KEY
echo $MONGODB_URI

# Make permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export OPENAI_API_KEY="sk_test_..."' >> ~/.bashrc
```

#### Method D: Vercel Environment (Production)
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add variable:
   - Key: `OPENAI_API_KEY`
   - Value: `sk_test_...`
   - Environments: Production, Preview, Development
5. Click "Save"
6. Redeploy project

### Step 3: Dependencies Installation ⏱️ 3 minutes

```bash
# Navigate to project
cd Ledger

# Install npm packages
npm install

# Verify packages installed
npm list openai zod jsonwebtoken
```

Expected output:
```
├── openai@^4.52.0
├── zod@^3.22.4
└── jsonwebtoken@^9.1.2
```

### Step 4: Database Connection ⏱️ 2 minutes

Verify MongoDB collections exist:

```javascript
// In MongoDB Atlas or local MongoDB
// Required collections:
- business_ledger.parties
- business_ledger.purchases
- business_ledger.sales
- business_ledger.payments
- business_ledger.stock

// Check connection in server logs
npm start
// Look for: "MongoDB connected successfully"
```

### Step 5: Start Server ⏱️ 1 minute

```bash
# Development
npm start
# or
node server.js

# Expected output:
# 🚀 Business Ledger Server Running!
# Local: http://localhost:3000
```

### Step 6: Test AI Endpoint ⏱️ 5 minutes

#### Option A: Using cURL
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add vendor TestVendor with 10000 opening balance",
    "userId": "test_user_123"
  }'
```

#### Option B: Using Postman
1. New POST request
2. URL: `http://localhost:3000/api/ai/chat`
3. Headers:
   - `Content-Type: application/json`
4. Body (JSON):
   ```json
   {
     "message": "Add vendor TestVendor with 10000 opening balance",
     "userId": "test_user_123"
   }
   ```
5. Send

#### Option C: Frontend Test
1. Open: http://localhost:3000/#aiAssistant
2. Type: "Hello, test message"
3. Click Send
4. Should see response from AI

Expected response:
```json
{
  "success": true,
  "data": {
    "message": "AI response text",
    "toolCalls": [...],
    "results": [...]
  }
}
```

## Local Development Checklist

- [ ] npm install completed
- [ ] OPENAI_API_KEY set in environment
- [ ] MONGODB_URI set and verified
- [ ] Server starts without errors
- [ ] /api/ai/health returns 200
- [ ] /api/ai/chat responds to test message
- [ ] Frontend loads at #aiAssistant
- [ ] Chat messages appear
- [ ] Can type and send message

## Production Deployment Checklist

### Pre-Deployment
- [ ] All code committed to GitHub
- [ ] Environment variables documented
- [ ] Database indexes created
- [ ] API rate limits configured
- [ ] Error logging set up
- [ ] Monitoring configured

### Vercel Deployment
- [ ] GitHub repository connected
- [ ] Environment variables added in Vercel
- [ ] Deployment triggers on push
- [ ] Deployment completes without errors
- [ ] Health check passes
- [ ] AI endpoint responds

### Post-Deployment
- [ ] Test at production URL
- [ ] Monitor API usage
- [ ] Check error logs
- [ ] Verify database connection
- [ ] Test all major AI tools

## API Endpoint Testing

### Health Check
```bash
GET http://localhost:3000/api/ai/health

Expected: { "status": "ok", "service": "AI Assistant", "openaiConfigured": true }
```

### Main Chat Endpoint
```bash
POST http://localhost:3000/api/ai/chat

Body: {
  "message": "text message",
  "image": "base64 or null",
  "imageMediaType": "image/jpeg",
  "userId": "user_id"
}

Expected: { "success": true, "data": { ... } }
```

### Confirm Transaction Endpoint
```bash
POST http://localhost:3000/api/ai/confirm

Body: {
  "toolName": "createVendorOrder",
  "toolInput": { ... },
  "userId": "user_id"
}

Expected: { "success": true, "result": { ... } }
```

## Tools Functionality Test

Test each tool with sample data:

### ✅ Tool: createVendorOrder
```
User input: "I received 50 items from TestVendor at 100 each"
Expected: Purchase order created, stock +50, payable +5000
```

### ✅ Tool: recordVendorPayment
```
User input: "I paid 2000 to TestVendor in cash"
Expected: Payment recorded, payable -2000
```

### ✅ Tool: createCustomerSale
```
User input: "Sold 20 items to TestCustomer at 150 each"
Expected: Sale recorded, stock -20, receivable +3000
```

### ✅ Tool: recordCustomerPayment
```
User input: "TestCustomer paid 1000"
Expected: Payment recorded, receivable -1000
```

### ✅ Tool: createParty
```
User input: "Add vendor NewVendor with 5000 opening balance"
Expected: Vendor created with 5000 payable
```

### ✅ Tool: adjustStock
```
User input: "Add 100 items to stock - received extra"
Expected: Stock increased by 100
```

### ✅ Tool: getDashboardSummary
```
User input: "Show me dashboard summary"
Expected: Returns total receivable, payable, sales, purchases, profit
```

### ✅ Tool: getPartyLedger
```
User input: "Show TestVendor ledger"
Expected: Returns all transactions with TestVendor
```

### ✅ Tool: getStockDetails
```
User input: "Show me stock of items"
Expected: Returns inventory details
```

### ✅ Tool: extractFromImage
```
User uploads: Bill/invoice image
Expected: Extracts vendor name, items, quantities, total
```

## Troubleshooting Checklist

### Issue: Server won't start
- [ ] Node.js version ≥ 18
- [ ] All dependencies installed
- [ ] No port 3000 conflicts
- [ ] Check error message in console

### Issue: OPENAI_API_KEY error
- [ ] Verify key format (starts with sk_)
- [ ] Check key is not expired
- [ ] Verify environment variable set
- [ ] Restart server after setting

### Issue: MongoDB connection fails
- [ ] Verify MONGODB_URI is correct
- [ ] Check MongoDB service running
- [ ] Verify network access allowed
- [ ] Test connection separately

### Issue: AI responds with errors
- [ ] Check OpenAI API status
- [ ] Verify API key has quota
- [ ] Check input validation (Zod)
- [ ] Review server logs

### Issue: Image extraction fails
- [ ] Check image file size
- [ ] Verify image format (JPEG/PNG)
- [ ] Ensure image is clear and readable
- [ ] Try different image

### Issue: Stock goes negative
- [ ] Check stock validation in code
- [ ] Verify database constraints
- [ ] Test with sufficient stock
- [ ] Review sale creation logic

## Performance Baseline

### Expected Performance
- **Chat response:** 1-3 seconds
- **Image processing:** 3-5 seconds
- **Database operations:** <100ms
- **Tool execution:** <500ms

### If Slow:
- [ ] Check network latency
- [ ] Monitor OpenAI API status
- [ ] Check MongoDB query performance
- [ ] Review server logs for errors
- [ ] Check system resources

## Cost Management

### Monthly Budget Estimation
```
Light:    100 req/day  = $33/month
Medium:   500 req/day  = $165/month
Heavy:   1000 req/day  = $330/month
```

### Monitor Usage:
1. https://platform.openai.com/usage
2. Vercel Analytics (if deployed)
3. Server logs with request tracking

### Cost Optimization:
- [ ] Consider GPT-3.5 Turbo (90% cheaper)
- [ ] Implement response caching
- [ ] Batch multiple operations
- [ ] Set usage alerts in OpenAI

## Security Validation

- [ ] JWT middleware ready (optional)
- [ ] Input validation enabled (Zod)
- [ ] Database access secured
- [ ] Error messages don't leak info
- [ ] Logs don't contain sensitive data
- [ ] API key not in logs
- [ ] CORS properly configured
- [ ] Rate limiting ready

## Documentation Review

- [ ] Read AI_ASSISTANT_GUIDE.md
- [ ] Read ENVIRONMENT_SETUP.md
- [ ] Read AI_ASSISTANT_QUICK_START.md
- [ ] Review API_ASSISTANT_IMPLEMENTATION.md
- [ ] Bookmark OpenAI docs

## Launch Readiness

### Green Light Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] Database connected
- [ ] API responding
- [ ] UI rendering correctly
- [ ] All tools tested
- [ ] Documentation complete
- [ ] Costs understood
- [ ] Monitoring set up
- [ ] Backup plan ready

### You're Ready! 🚀
```
Next steps:
1. Make first AI request
2. Test all main workflows
3. Share with users
4. Monitor and iterate
```

## Quick Reference

### Start Server
```bash
npm start
```

### Access AI Assistant
```
http://localhost:3000/#aiAssistant
```

### Test Endpoint
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","userId":"user1"}'
```

### View Logs
```bash
# Terminal window where server is running
# Watch for errors and activity
```

### MongoDB Connection Test
```javascript
// In browser console or Node.js
await fetch('/api/health').then(r => r.json())
// Should show mongodb: configured
```

## Support Contacts

- **OpenAI Support:** https://help.openai.com
- **Vercel Support:** https://vercel.com/support
- **MongoDB Support:** https://www.mongodb.com/support
- **GitHub Issues:** Your repository

---

**Last Updated:** February 15, 2026  
**Status:** ✅ Ready for Production
