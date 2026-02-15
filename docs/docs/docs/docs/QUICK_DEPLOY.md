# 🚀 Quick Deploy Guide - Business Ledger to Vercel + MongoDB

Get your Business Ledger deployed to the cloud in under 10 minutes!

---

## Overview

This guide will help you deploy your Business Ledger with:
- ✅ **MongoDB Atlas** - Free cloud database for persistent storage
- ✅ **Vercel** - Free serverless hosting for your API
- ✅ **Global Access** - Access your ledger from anywhere

---

## Prerequisites Checklist

- [ ] Git installed
- [ ] Node.js 18+ installed
- [ ] GitHub account
- [ ] Internet connection

---

## Step-by-Step Deployment

### 1️⃣ Install Dependencies (1 minute)

```powershell
cd "C:\Users\visha\OneDrive\Documents\projects\Ledger"
npm install
```

This installs:
- MongoDB driver
- Vercel Node.js runtime
- Express and other dependencies

---

### 2️⃣ Set Up MongoDB Atlas (3 minutes)

Follow the detailed guide: **[MONGODB_SETUP.md](./MONGODB_SETUP.md)**

**Quick Steps:**
1. Create free MongoDB Atlas account
2. Create a free M0 cluster
3. Create database user (username: `ledger-admin`)
4. Whitelist IP: `0.0.0.0/0` (for Vercel)
5. Get connection string
6. Save it securely!

**Connection string format:**
```
mongodb+srv://ledger-admin:YOUR_PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
```

---

### 3️⃣ Deploy to Vercel (2 minutes)

#### Install Vercel CLI:
```powershell
npm install -g vercel
```

#### Login:
```powershell
vercel login
```

#### Deploy:
```powershell
vercel
```

Answer prompts:
- Set up and deploy? → **Y**
- Project name? → `business-ledger-backend`
- Directory? → `.` (press Enter)
- Override settings? → **N**

#### Deploy to Production:
```powershell
vercel --prod
```

**Copy your production URL!** (e.g., `https://business-ledger-backend.vercel.app`)

---

### 4️⃣ Add MongoDB to Vercel (2 minutes)

#### Option A - Vercel Dashboard (Easier):
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name:** `MONGODB_URI`
   - **Value:** Your MongoDB connection string
   - **Environments:** ✅ All (Production, Preview, Development)
5. Click **Save**

#### Option B - CLI:
```powershell
vercel env add MONGODB_URI production
# Paste your MongoDB connection string when prompted
```

#### Redeploy:
```powershell
vercel --prod
```

---

### 5️⃣ Test Your Deployment (1 minute)

Open in browser:
```
https://your-vercel-url.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Business Ledger API Server is running on Vercel",
  "timestamp": "2026-02-03T...",
  "version": "1.0.0"
}
```

Test other endpoints:
- `/api/parties` - Customers & Vendors
- `/api/stock` - Stock items
- `/api/settings` - Business settings

---

### 6️⃣ Update Frontend Configuration (1 minute)

Edit [js/core/storage.js](js/core/storage.js):

**Find (line ~6):**
```javascript
this.serverUrl = 'http://localhost:3000/api';
```

**Replace with your Vercel URL:**
```javascript
this.serverUrl = 'https://your-vercel-url.vercel.app/api';
```

**Commit and push:**
```powershell
git add .
git commit -m "Connect to Vercel backend"
git push
```

---

## ✅ You're Done!

Your Business Ledger is now:
- 🌐 Accessible from anywhere
- 💾 Storing data persistently in MongoDB
- 🚀 Running on Vercel's global CDN
- 🔒 Secured with HTTPS
- 💰 100% FREE (within generous limits)

---

## 📊 What You Get

### Free Tier Benefits:

**MongoDB Atlas M0:**
- 512 MB storage
- Unlimited connections
- Automatic backups (in paid tiers)

**Vercel Hobby:**
- 100 GB bandwidth/month
- 100 GB-hours serverless execution
- Unlimited API requests
- Global CDN
- Automatic SSL

---

## 🔄 Daily Usage

### Access Your Ledger:
1. Open: `https://your-github-pages-url` (or wherever your frontend is hosted)
2. All data syncs to MongoDB automatically
3. Access from any device with the URL

### Make Updates:
```powershell
# Make changes to code
git add .
git commit -m "Your changes"
git push

# Vercel auto-deploys if connected to GitHub
# Or manually: vercel --prod
```

---

## 📱 API Endpoints Reference

| Endpoint | Description |
|----------|-------------|
| `/api/health` | Server status |
| `/api/parties` | Customers & Vendors |
| `/api/purchases` | Purchase records |
| `/api/sales` | Sales transactions |
| `/api/payments` | Payment tracking |
| `/api/stock` | Inventory management |
| `/api/settings` | Business configuration |
| `/api/alerts` | Notifications |
| `/api/storage` | Bulk sync operations |

---

## 🐛 Troubleshooting

### Deployment Failed?
```powershell
vercel logs
```

### API Not Working?
1. Check MongoDB connection string in Vercel environment variables
2. Verify IP whitelist includes `0.0.0.0/0` in MongoDB Atlas
3. Check Vercel logs for errors

### Data Not Saving?
1. Confirm `MONGODB_URI` is set in **Production** environment
2. Redeploy after adding environment variable
3. Check MongoDB Atlas → Network Access

---

## 📚 Detailed Guides

For more information, see:
- **[MONGODB_SETUP.md](./MONGODB_SETUP.md)** - Complete MongoDB Atlas setup
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Advanced Vercel configuration
- **[README.md](./README.md)** - Application documentation

---

## 🎯 Next Steps

- [ ] Test all features (add parties, purchases, sales)
- [ ] Set up automatic GitHub → Vercel deployments
- [ ] Configure custom domain (optional)
- [ ] Set up MongoDB alerts for storage usage
- [ ] Share access URL with team members
- [ ] Schedule regular data backups

---

## 🆘 Need Help?

**Common Issues:**
1. **500 Error on API calls** → MongoDB URI not set correctly
2. **CORS Error** → Check frontend URL configuration
3. **Deployment timeout** → Increase `maxDuration` in vercel.json

**Get Support:**
- GitHub Issues: [Create an issue](https://github.com/vishal1412/Ledger/issues)
- Vercel Docs: https://vercel.com/docs
- MongoDB Docs: https://docs.atlas.mongodb.com

---

## 🎉 Success!

You now have a fully cloud-based business ledger system! 

**Share your deployment:**
- Frontend: Your GitHub Pages URL
- API: `https://your-vercel-url.vercel.app`

**Start using:**
1. Add your customers and vendors
2. Record purchases and sales
3. Track inventory
4. Monitor payments
5. Access from anywhere!

---

**Happy Ledgering! 📊💼**
