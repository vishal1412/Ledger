# ⚠️ IMPORTANT: Vercel Environment Setup

## Issue
The MongoDB URI environment variable is not set in Vercel production. Follow these steps to fix it:

## Solution

### Step 1: Open Vercel Dashboard
Go to: https://vercel.com/vishalsethi14-2174s-projects/ledger/settings/environment-variables

### Step 2: Add New Environment Variable
1. Click "Add New"
2. Fill in the details:
   - **Name**: `MONGODB_URI`
   - **Value**: `mongodb+srv://Vishal14:Vishalsethi%4014@ledger.t9zmese.mongodb.net/?appName=ledger&retryWrites=true&w=majority`
   - **Environments**: Select "Production"
3. Click "Save"

### Step 3: Redeploy
After adding the environment variable, redeploy:
- Via CLI: `vercel --prod`
- Via Dashboard: Click "Redeploy" button

### Step 4: Verify
After deployment, refresh GitHub Pages and check the console. You should see:
- ✅ Connected to MongoDB Storage Server
- ✅ All data loading correctly

## Expected Console Output (After Fix)
```
✅ Connected to MongoDB Storage Server
💾 Storage initialized
✓ Pages initialized successfully
✓ Navigation rendered
✓ Dashboard rendered successfully
✅ Application Initialized Successfully
```

## If Still Not Working
1. Check browser console (F12) for errors
2. Check Vercel deployment logs: `vercel logs --prod`
3. Verify MONGODB_URI is set: `vercel env list`

## Testing Locally
```bash
$env:MONGODB_URI = "mongodb+srv://Vishal14:Vishalsethi%4014@ledger.t9zmese.mongodb.net/?appName=ledger&retryWrites=true&w=majority"
npm start
# Visit http://localhost:3000
```
