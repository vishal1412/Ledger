# 🚀 Vercel Deployment Guide for Business Ledger

Complete guide to deploy your Business Ledger application to Vercel with MongoDB Atlas backend.

---

## Prerequisites

- [x] GitHub account with Ledger repository
- [x] Vercel account (free tier) - [Sign up here](https://vercel.com/signup)
- [x] MongoDB Atlas cluster configured (see [MONGODB_SETUP.md](./MONGODB_SETUP.md))
- [x] Node.js installed (v18 or higher)

---

## Quick Deploy - 5 Minutes

### Step 1: Install Vercel CLI

```powershell
npm install -g vercel
```

Verify installation:
```powershell
vercel --version
```

---

### Step 2: Login to Vercel

```powershell
vercel login
```

Follow the browser prompts to authenticate with your Vercel account.

---

### Step 3: Deploy Backend API

Navigate to your Ledger project:

```powershell
cd "C:\Users\visha\OneDrive\Documents\projects\Ledger"
```

Start deployment:

```powershell
vercel
```

**First-time deployment prompts:**

| Prompt | Answer |
|--------|--------|
| Set up and deploy? | **Y** |
| Which scope? | Select your account |
| Link to existing project? | **N** |
| Project name? | `business-ledger-backend` |
| Directory? | `.` (press Enter) |
| Override settings? | **N** |

Vercel will:
1. ✅ Analyze your project structure
2. ✅ Detect the `api/` folder with serverless functions
3. ✅ Deploy 9 API endpoints
4. ✅ Provide a preview URL like: `https://business-ledger-backend-abc123.vercel.app`

---

### Step 4: Production Deployment

After testing the preview, deploy to production:

```powershell
vercel --prod
```

**Copy the production URL** (e.g., `https://business-ledger-backend.vercel.app`)

---

### Step 5: Add MongoDB Environment Variable

⚠️ **CRITICAL STEP** - Without this, your data won't persist!

#### Via Vercel Dashboard:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **business-ledger-backend** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Add variable:

   | Name | Value | Environments |
   |------|-------|--------------|
   | `MONGODB_URI` | Your MongoDB connection string | ✅ Production, ✅ Preview, ✅ Development |

6. Click **"Save"**

#### Via CLI:

```powershell
vercel env add MONGODB_URI production
# Paste your MongoDB connection string when prompted
```

**Redeploy after adding environment variable:**
```powershell
vercel --prod
```

---

### Step 6: Test Your API Endpoints

Open your browser and test:

#### Health Check
```
https://your-vercel-url.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Business Ledger API Server is running on Vercel",
  "timestamp": "2026-02-03T10:30:00.000Z",
  "version": "1.0.0"
}
```

#### Test Other Endpoints

**Parties:**
```
https://your-vercel-url.vercel.app/api/parties
```

**Stock:**
```
https://your-vercel-url.vercel.app/api/stock
```

**Settings:**
```
https://your-vercel-url.vercel.app/api/settings
```

**Browser Console Test:**
```javascript
fetch('https://your-vercel-url.vercel.app/api/health')
  .then(r => r.json())
  .then(console.log);
```

---

### Step 7: Configure Frontend to Use Vercel API

Update the storage manager to use your Vercel URL:

**Edit [js/core/storage.js](js/core/storage.js):**

Find this line (around line 6):
```javascript
this.serverUrl = 'http://localhost:3000/api';
```

Replace with your Vercel URL:
```javascript
this.serverUrl = 'https://your-vercel-url.vercel.app/api';
```

**Or create a configuration file:**

Create [js/config.js](js/config.js):
```javascript
// API Configuration
const API_CONFIG = {
  baseURL: 'https://your-vercel-url.vercel.app/api',
  timeout: 10000,
  retries: 3
};

window.API_CONFIG = API_CONFIG;
```

Then update storage.js to use it:
```javascript
constructor() {
  this.serverUrl = window.API_CONFIG?.baseURL || 'http://localhost:3000/api';
  // ... rest of constructor
}
```

---

### Step 8: Deploy Frontend (GitHub Pages)

If using GitHub Pages:

```powershell
# Commit frontend changes
git add .
git commit -m "Connect to Vercel backend API"
git push origin main

# Deploy to gh-pages (if configured)
# Or use your preferred frontend hosting
```

If deploying frontend to Vercel too:

```powershell
# Create separate Vercel project for frontend
vercel --name business-ledger-frontend
```

---

## 📊 Available API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/health` | GET | Health check & status |
| `/api/parties` | GET, POST, PUT, DELETE | Customers & Vendors CRUD |
| `/api/purchases` | GET, POST, PUT, DELETE | Purchases management |
| `/api/sales` | GET, POST, PUT, DELETE | Sales records |
| `/api/payments` | GET, POST, PUT, DELETE | Payment transactions |
| `/api/stock` | GET, POST, PUT, DELETE | Stock items management |
| `/api/stock/movements` | GET, POST | Stock movement history |
| `/api/settings` | GET, POST, PUT | Business settings |
| `/api/alerts` | GET, POST, DELETE | Low stock & other alerts |
| `/api/storage` | GET, POST | Bulk data sync/backup |

---

## 🔄 Continuous Deployment

### Automatic Deployments with Git

Connect your GitHub repository to Vercel for automatic deployments:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. **Import Git Repository** → Select your Ledger repo
4. Configure:
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Root Directory**: `./`
5. Add environment variables (MONGODB_URI)
6. Click **"Deploy"**

Now every push to your main branch automatically deploys!

---

## 🧪 Testing Your Deployment

### Test CRUD Operations

**Create a Party (Customer):**
```javascript
fetch('https://your-vercel-url.vercel.app/api/parties', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: Date.now().toString(),
    type: 'Customer',
    name: 'Test Customer',
    phone: '1234567890',
    currentBalance: 0,
    balanceType: 'Receivable'
  })
})
.then(r => r.json())
.then(console.log);
```

**Get All Parties:**
```javascript
fetch('https://your-vercel-url.vercel.app/api/parties')
  .then(r => r.json())
  .then(console.log);
```

**Add Stock Item:**
```javascript
fetch('https://your-vercel-url.vercel.app/api/stock', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: Date.now().toString(),
    name: 'Test Product',
    quantity: 100,
    unit: 'pieces',
    buyingPrice: 50,
    sellingPrice: 75
  })
})
.then(r => r.json())
.then(console.log);
```

---

## 🔧 Advanced Configuration

### Custom Domain

1. Go to **Project Settings** → **Domains**
2. Add your custom domain (e.g., `ledger.yourbusiness.com`)
3. Update DNS records as instructed
4. SSL certificate auto-provisioned by Vercel

### Environment-Specific Settings

```powershell
# Add development environment variables
vercel env add MONGODB_URI development

# Add preview environment variables
vercel env add MONGODB_URI preview

# Add production environment variables
vercel env add MONGODB_URI production
```

### Function Configuration

Edit [vercel.json](vercel.json) for custom function settings:

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "regions": ["bom1"]
}
```

**Available regions:**
- `bom1` - Mumbai, India
- `iad1` - Washington D.C., USA
- `sfo1` - San Francisco, USA
- `lhr1` - London, UK

---

## 🐛 Troubleshooting

### Deployment Failed

**Check logs:**
```powershell
vercel logs
```

**Common issues:**
- Missing `package.json` - ✅ Already included
- Missing dependencies - Run `npm install`
- Syntax errors in API files - Check Vercel deployment logs

### API Returns 500 Error

**Check function logs:**
```powershell
vercel logs --follow
```

**Common causes:**
- MongoDB connection string not set
- Invalid MongoDB URI format
- Network timeout (increase maxDuration in vercel.json)
- MongoDB IP whitelist doesn't include `0.0.0.0/0`

### CORS Issues

All API endpoints include CORS headers:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

If issues persist:
- Clear browser cache
- Check browser console for specific CORS errors
- Verify API URL in frontend code

### Environment Variables Not Working

1. Verify variable is set: Vercel Dashboard → Settings → Environment Variables
2. Redeploy after adding variables: `vercel --prod`
3. Check variable name matches exactly: `MONGODB_URI`

---

## 📈 Monitoring & Analytics

### View Deployment Analytics

```powershell
vercel inspect your-deployment-url
```

### Monitor Function Performance

Vercel Dashboard → Your Project → Analytics shows:
- Request counts
- Response times
- Error rates
- Bandwidth usage

### Set Up Alerts

1. Go to **Project Settings** → **Integrations**
2. Add monitoring integrations:
   - Sentry (error tracking)
   - LogDNA (log aggregation)
   - Datadog (performance monitoring)

---

## 💰 Cost Optimization

### Free Tier Includes:
- ✅ 100 GB bandwidth/month
- ✅ 100 GB-hours serverless execution
- ✅ Unlimited API requests (fair use)
- ✅ Automatic SSL
- ✅ Global CDN

### Tips to Stay Within Free Tier:
1. Use MongoDB connection pooling (already configured)
2. Implement client-side caching
3. Minimize unnecessary API calls
4. Use GET requests when possible (cacheable)

---

## 🔐 Security Best Practices

1. **Never commit sensitive data:**
   - Add `.env` to `.gitignore`
   - Use Vercel environment variables

2. **Rotate credentials regularly:**
   ```powershell
   vercel env rm MONGODB_URI production
   vercel env add MONGODB_URI production
   ```

3. **Monitor access logs:**
   - Check Vercel logs regularly
   - Set up MongoDB Atlas alerts

4. **Use HTTPS only:**
   - Vercel provides automatic SSL
   - Update frontend to use `https://`

---

## 🎯 Next Steps

- ✅ Deploy to Vercel
- ✅ Configure MongoDB Atlas
- ✅ Test all API endpoints
- 📱 Test on mobile devices
- 🎨 Customize branding
- 📊 Set up analytics
- 💾 Schedule regular backups
- 📧 Configure email notifications (future enhancement)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Serverless Functions Guide](https://vercel.com/docs/functions)

---

## 📞 Support

- Vercel Support: https://vercel.com/support
- MongoDB Support: https://www.mongodb.com/support
- GitHub Issues: [Create an issue](https://github.com/vishal1412/Ledger/issues)

---

**🎉 Congratulations!** Your Business Ledger is now deployed with:
- ✅ Cloud database (MongoDB Atlas)
- ✅ Serverless API (Vercel)
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Persistent data storage
- ✅ Scalable architecture

Your business data is now accessible from anywhere, on any device! 🚀
