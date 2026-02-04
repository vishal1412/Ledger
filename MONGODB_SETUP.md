# MongoDB Atlas Setup for Business Ledger

## Why MongoDB Atlas?
Vercel serverless functions have a **read-only filesystem**. MongoDB Atlas provides a free cloud database that's perfect for storing your ledger data persistently across all devices and deployments.

---

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with email or Google account (FREE - no credit card required)
3. Complete email verification

---

## Step 2: Create a Free Cluster

1. After login, click **"Build a Database"** or **"Create"**
2. Choose **"M0 FREE"** tier
   - ✅ 512 MB storage (plenty for business data)
   - ✅ Shared RAM
   - ✅ No credit card required
   - ✅ Perfect for small to medium businesses
3. **Cloud Provider**: Choose AWS, Google Cloud, or Azure
4. **Region**: Choose closest to your location:
   - India: `Mumbai (ap-south-1)`
   - USA: `N. Virginia (us-east-1)`
   - Europe: `Ireland (eu-west-1)`
5. **Cluster Name**: `ledger-cluster` (or keep default)
6. Click **"Create Cluster"** (takes 3-5 minutes to provision)

---

## Step 3: Create Database User

1. Go to **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `ledger-admin`
5. **Password**: Click **"Autogenerate Secure Password"** → **COPY AND SAVE IT SECURELY!**
   - Example: `xK9mP2nQ7vL4wR8`
   - ⚠️ Store this in a password manager or secure note
6. **Database User Privileges**: Select **"Read and write to any database"**
7. Click **"Add User"**

---

## Step 4: Whitelist IP Addresses (Allow Access from Vercel)

1. Go to **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Choose **"ALLOW ACCESS FROM ANYWHERE"** (required for Vercel serverless)
   - This adds `0.0.0.0/0`
   - Necessary because Vercel uses dynamic IP addresses
4. Click **"Confirm"**

⚠️ **Security Note**: This is safe because:
- Authentication still requires your username/password
- Only users with your connection string can access the database
- MongoDB Atlas has built-in DDoS protection

---

## Step 5: Get Your MongoDB Connection String

1. Go back to **"Database"** → Click **"Connect"** button on your cluster
2. Select **"Connect your application"**
3. **Driver**: Node.js
4. **Version**: 5.5 or later
5. **Copy the connection string** shown:
   ```
   mongodb+srv://ledger-admin:<password>@ledger-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Replace `<password>`** with the actual password you saved in Step 3

7. **Final connection string example**:
   ```
   mongodb+srv://ledger-admin:xK9mP2nQ7vL4wR8@ledger-cluster.abc12.mongodb.net/?retryWrites=true&w=majority
   ```

---

## Step 6: Add Environment Variable to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Business Ledger** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Add this variable:

   | Field | Value |
   |-------|-------|
   | **Name** | `MONGODB_URI` |
   | **Value** | Your full connection string from Step 5 |
   | **Environment** | ✅ Production, ✅ Preview, ✅ Development |

6. Click **"Save"**

### Option B: Vercel CLI

```powershell
cd "C:\Users\visha\OneDrive\Documents\projects\Ledger"
vercel env add MONGODB_URI
# Paste your connection string when prompted
```

---

## Step 7: Initialize Database Collections (Optional)

The database will automatically create collections on first use. If you want to view/pre-populate data:

1. Go to **"Database"** → **"Browse Collections"**
2. Click **"Add My Own Data"**
3. **Database name**: `business_ledger`
4. **Collection name**: `parties`
5. Click **"Create"**

**Collections that will be auto-created:**
- `parties` - Customers and Vendors
- `purchases` - Purchase transactions
- `sales` - Sales transactions
- `payments` - Payment records
- `stock` - Stock items
- `stock_movements` - Stock movement history
- `settings` - Business settings
- `alerts` - Low stock and other alerts

---

## Step 8: Install Dependencies & Deploy

```powershell
# Navigate to your Ledger project
cd "C:\Users\visha\OneDrive\Documents\projects\Ledger"

# Install MongoDB driver
npm install

# Commit changes
git add .
git commit -m "Add MongoDB Atlas integration for persistent cloud storage"
git push

# Deploy to Vercel
vercel --prod
```

---

## Step 9: Test Your MongoDB Connection

After deployment, test the health endpoint:

```
https://your-vercel-url.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Business Ledger API Server is running on Vercel",
  "timestamp": "2026-02-03T...",
  "version": "1.0.0"
}
```

Test data endpoints:
```
https://your-vercel-url.vercel.app/api/parties
https://your-vercel-url.vercel.app/api/stock
https://your-vercel-url.vercel.app/api/settings
```

---

## 📊 Database Collections Overview

| Collection | Purpose | Example Document |
|------------|---------|------------------|
| `parties` | Customers & Vendors | `{id, name, type, phone, currentBalance}` |
| `purchases` | Purchase records | `{id, vendorId, items, total, date}` |
| `sales` | Sales records | `{id, customerId, items, total, date}` |
| `payments` | Payment transactions | `{id, partyId, amount, date, method}` |
| `stock` | Stock items | `{id, name, quantity, unit, price}` |
| `settings` | Business settings | `{currency, lowStockThreshold, businessName}` |

---

## 🔧 Troubleshooting

### Connection Timeout
- Verify IP whitelist includes `0.0.0.0/0`
- Check connection string has correct password
- Ensure cluster is active (not paused)

### Authentication Failed
- Double-check username is `ledger-admin`
- Verify password matches exactly (no extra spaces)
- Ensure database user was created with "Read and write" permissions

### Environment Variable Not Found
- Redeploy after adding environment variable: `vercel --prod`
- Environment variables require a new deployment to take effect

### Data Not Persisting
- Check Vercel deployment logs for MongoDB errors
- Verify MONGODB_URI environment variable is set in production environment
- Test connection string locally first

---

## 💡 Tips

1. **Monitor Usage**: Check your MongoDB Atlas dashboard regularly to monitor storage usage
2. **Backup**: Use MongoDB Atlas's built-in backup features (available in paid tiers)
3. **Free Tier Limits**: 
   - 512 MB storage
   - Unlimited connections
   - Shared RAM (sufficient for most small businesses)
4. **Upgrade Path**: If you outgrow free tier, M10 ($0.08/hour) offers dedicated resources

---

## 🔐 Security Best Practices

1. **Never commit your connection string to Git**
2. Use environment variables for sensitive data
3. Rotate your database password periodically
4. Monitor access logs in MongoDB Atlas
5. Enable two-factor authentication on your MongoDB Atlas account

---

## ✅ Next Steps

After MongoDB setup is complete:
1. Follow [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) to deploy your application
2. Configure your frontend to use the Vercel API URLs
3. Test all CRUD operations through the web interface
4. Set up regular backups (optional but recommended)

---

## 📞 Support

- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- MongoDB Community Forums: https://www.mongodb.com/community/forums/
- Vercel Support: https://vercel.com/support
