# Environment Setup for AI Assistant

## Required Environment Variables

### OpenAI Configuration

1. **Get API Key:**
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (keep it safe!)

2. **Add to Environment:**

   **For Local Development:**
   Create `.env` file in project root:
   ```
   OPENAI_API_KEY=sk_test_your_key_here
   ```

   **For Vercel:**
   1. Go to Vercel Dashboard → Your Project
   2. Settings → Environment Variables
   3. Add:
      - Key: `OPENAI_API_KEY`
      - Value: `sk_test_your_key_here`
   4. Select environments: Production, Preview, Development

### MongoDB Configuration

Your existing `MONGODB_URI` should already be set. If not:

```
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/database_name
```

## Models Used

### GPT-4 Turbo (for tool calling)
- Model: `gpt-4-turbo`
- Cost: ~$0.01 per 1K input tokens
- Capability: Complex reasoning, tool use, understanding

### Alternative Models

If GPT-4 is expensive, try:
- `gpt-3.5-turbo` ($0.0005 per 1K input tokens)
- `gpt-4-vision-preview` (for image analysis)

To change model, edit `/api/aiService.js`:
```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo', // Change here
  // ... rest of config
});
```

## Local Development Setup

### Step 1: Install Dependencies
```bash
cd Ledger
npm install
```

### Step 2: Create .env File
```bash
# Windows (PowerShell)
echo 'OPENAI_API_KEY=sk_test_...' > .env
echo 'MONGODB_URI=mongodb+srv://...' >> .env

# Mac/Linux
echo "OPENAI_API_KEY=sk_test_..." > .env
echo "MONGODB_URI=mongodb+srv://..." >> .env
```

### Step 3: Start Server
```bash
npm start
# or
node server.js
```

Server runs on: http://localhost:3000

### Step 4: Test AI Endpoint
```bash
# Using curl or Postman
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I want to add a vendor",
    "userId": "test_user"
  }'
```

## Vercel Deployment

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add AI Assistant integration"
git push origin main
```

### Step 2: Add Environment Variables
1. Vercel Dashboard → Project Settings
2. Environment Variables
3. Add `OPENAI_API_KEY`
4. Redeploy: `Deployments` → Click latest → `Redeploy`

### Step 3: Test Deployment
```bash
curl -X POST https://your-project.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "userId": "test_user"
  }'
```

## File Structure

```
Ledger/
├── api/
│   ├── aiService.js          # ← AI logic & tools
│   ├── aiController.js       # ← Request handlers
│   ├── aiRoutes.js           # ← Express routes
│   ├── mongodb-helper.js     # ← Database access
│   └── ... (existing files)
├── js/
│   ├── pages/
│   │   ├── aiAssistant.js    # ← Frontend UI
│   │   └── ... (existing pages)
│   └── components/
│       ├── navigation.js     # ← Updated with AI menu
│       └── ... (existing components)
├── css/
│   ├── ai-assistant.css      # ← AI styling
│   └── ... (existing stylesheets)
├── index.html                # ← Updated with AI CSS/JS
├── package.json              # ← Updated with dependencies
├── server.js                 # ← Updated with AI routes
└── AI_ASSISTANT_GUIDE.md     # ← This guide
```

## Database Collections

Ensure these collections exist in MongoDB:

```javascript
// parties - Vendors and Customers
{
  _id: ObjectId,
  name: String,
  type: "vendor" | "customer",
  payable: Number,      // for vendors
  receivable: Number,   // for customers
  phone: String,
  address: String,
  createdAt: Date
}

// purchases - Vendor Orders
{
  _id: ObjectId,
  vendorName: String,
  product: String,
  quantity: Number,
  rate: Number,
  totalAmount: Number,
  date: String,
  status: String,
  createdAt: Date
}

// sales - Customer Sales
{
  _id: ObjectId,
  customerName: String,
  product: String,
  quantity: Number,
  rate: Number,
  totalAmount: Number,
  date: String,
  creditTerm: Number,
  status: String,
  createdAt: Date
}

// payments - Payment Records
{
  _id: ObjectId,
  partyType: "vendor" | "customer",
  vendorName: String,      // for vendor payments
  customerName: String,    // for customer payments
  amount: Number,
  paymentMethod: String,
  date: String,
  createdAt: Date
}

// stock - Inventory
{
  _id: ObjectId,
  product: String,
  quantity: Number,
  unit: String,
  updatedAt: Date
}
```

## Cost Estimation

### OpenAI API Pricing (as of Feb 2024)

**GPT-4 Turbo:**
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens

**Average AI Request:**
- Input: ~500 tokens ($0.005)
- Output: ~200 tokens ($0.006)
- Total: ~$0.011 per request

**Monthly Estimate:**
- 100 requests/day = ~$33/month
- 1000 requests/day = ~$330/month

### Cost Optimization

1. **Use GPT-3.5 Turbo:**
   - 90% cheaper
   - Good for simple operations
   - Limitation: Less capable reasoning

2. **Cache Responses:**
   - Avoid duplicate requests
   - Store common queries

3. **Batch Operations:**
   - Process multiple transactions
   - Reduces API calls

## Debugging

### Enable Debug Logging

Add to `/api/aiService.js`:
```javascript
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Tool Input:', toolInput);
  console.log('Tool Result:', result);
}
```

### Check Logs

**Local:**
```bash
node server.js 2>&1 | tee debug.log
```

**Vercel:**
- Dashboard → Deployments → View Logs

### Common Issues

**Issue: "Invalid API Key"**
```
Solution: 
1. Verify key starts with "sk_"
2. Check in Vercel Environment Variables
3. Redeploy after adding key
```

**Issue: "Tool execution failed"**
```
Solution:
1. Check MongoDB connection
2. Verify collections exist
3. Check browser console for details
4. Review server logs
```

**Issue: "Timeout"**
```
Solution:
1. Check OpenAI API status
2. Reduce image resolution
3. Add timeout handling
```

## Security Best Practices

1. **Rotate API Keys Regularly:**
   - OpenAI: https://platform.openai.com/api-keys
   - Delete old keys

2. **Use Environment Variables:**
   - Never commit `.env` to git
   - Add to `.gitignore`

3. **Rate Limiting:**
   - Implement in production
   - Prevent abuse

4. **Audit Logging:**
   - Log all AI actions
   - Track user interactions

5. **Input Validation:**
   - All inputs validated
   - Prevent injection attacks

## Next Steps

1. ✅ Install dependencies
2. ✅ Set environment variables
3. ✅ Start local server
4. ✅ Test AI endpoint
5. ✅ Deploy to Vercel
6. ✅ Monitor costs and usage

## Support

- OpenAI Support: https://help.openai.com
- Vercel Support: https://vercel.com/support
- GitHub Issues: Use your repository

Happy automating! 🚀
