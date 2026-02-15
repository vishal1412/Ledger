# MongoDB Setup Guide - MongoDB Atlas (Cloud)

MongoDB Atlas is a free cloud-hosted MongoDB service. This is the recommended approach for both local development and production deployment on Vercel.

## 📝 Step 1: Create MongoDB Atlas Account (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with email and create account
4. Create a new project named "Ledger"

## 🔧 Step 2: Create a Cluster (5 minutes)

1. In MongoDB Atlas, click "Create a Deployment"
2. Choose **M0 Sandbox** (Free tier - perfect for development)
3. Select your preferred region (closest to you)
4. Click "Create Deployment"
5. Wait for cluster to be created (2-5 minutes)

## 🔑 Step 3: Set Up Authentication (5 minutes)

1. Go to "Database Access" → "Add New Database User"
2. Username: `ledger_user`
3. Password: Generate a strong password (or create one)
4. Database User Privileges: "Atlas admin"
5. Click "Add User"

**Save this username and password!**

## 📍 Step 4: Get Connection String (5 minutes)

1. Go to "Deployment" → "Overview"
2. Click "Connect"
3. Choose "Drivers" → "Node.js"
4. Copy the connection string (looks like below)

```
mongodb+srv://ledger_user:PASSWORD@cluster0.mongodb.net/business_ledger?retryWrites=true&w=majority
```

5. Replace:
   - `ledger_user` with your username
   - `PASSWORD` with your password
   - Keep `business_ledger` as database name

## 🚀 Step 5: Configure Application

### For Local Development:

1. Create `.env` file in project root:
   ```
   MONGODB_URI=mongodb+srv://ledger_user:PASSWORD@cluster0.mongodb.net/business_ledger?retryWrites=true&w=majority
   OPENAI_API_KEY=sk_your_key_here
   PORT=3000
   ```

2. Start server:
   ```bash
   npm start
   ```

### For Vercel Production:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add new variable:
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://ledger_user:PASSWORD@cluster0.mongodb.net/business_ledger?retryWrites=true&w=majority`
3. Add another variable:
   - Name: `OPENAI_API_KEY`
   - Value: `sk_your_key_here`
4. Click "Save"
5. Redeploy: `vercel --prod`

## ✅ Step 6: Verify Connection

### Test Locally:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{"status":"healthy","timestamp":"2026-02-15T..."}
```

### Test on Vercel:
```bash
curl https://ledger-kappa-sage.vercel.app/api/health
```

## 🛡️ Security Best Practices

1. **Don't commit .env file** - It's already in `.gitignore`
2. **Use strong passwords** - Generate with MongoDB Atlas or password manager
3. **Limit IP access** - In MongoDB Atlas → Network Access:
   - For development: Allow "0.0.0.0/0" (anywhere)
   - For production: Restrict to Vercel IPs or specific ranges
4. **Use database roles** - Don't use admin credentials for app

## 🐛 Troubleshooting

### Connection Refused
- Check MongoDB Atlas cluster status (should be running)
- Verify connection string in `.env`
- Check network access is enabled in MongoDB Atlas

### Authentication Failed
- Verify username and password in connection string
- Check for URL encoding issues with special characters
- Ensure database user is created

### Vercel Deployment Issues
- Verify environment variables are set in Vercel dashboard
- Redeploy after adding environment variables: `vercel --prod --force`
- Check Vercel logs: `vercel logs --prod`

## 📞 Support Resources

- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Node.js MongoDB Driver: https://github.com/mongodb/node-mongodb-native
- Vercel Environment Variables: https://vercel.com/docs/projects/environment-variables

---

## Quick Reference

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

**Environment Variables Needed:**
```
MONGODB_URI=...
OPENAI_API_KEY=...
PORT=3000
```

**Test Commands:**
```bash
# Local
npm start
curl http://localhost:3000/api/health

# Production
vercel --prod
curl https://ledger-kappa-sage.vercel.app/api/health
```
