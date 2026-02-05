# Deployment Instructions

## Status
✅ **Frontend**: Ready (async/await updated for MongoDB)  
✅ **Backend API**: Ready (MongoDB integration complete)  
✅ **GitHub Pages**: Prepared (docs folder created)  
⏳ **MongoDB**: Needs to be connected (local or Atlas)  
⏳ **Vercel**: CLI installed, ready to deploy  

---

## Step 1: Setup MongoDB Connection

### Option A: Local MongoDB
```bash
# Start MongoDB locally
mongod

# Test connection
node test-mongodb.js
```

### Option B: MongoDB Atlas (Recommended for Vercel)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/business_ledger`
4. Test locally:
```bash
$env:MONGODB_URI = "mongodb+srv://user:password@cluster.mongodb.net/business_ledger"
node test-mongodb.js
```

---

## Step 2: Deploy to Vercel

### One-Command Deployment
```powershell
.\deploy.ps1
```

### Manual Deployment Steps
```bash
# 1. Login to Vercel
vercel login

# 2. Set MongoDB environment variable
vercel env add MONGODB_URI

# 3. Deploy to production
vercel --prod
```

**Vercel will ask:**
- Project name (use default or 'ledger')
- Link to existing project? (No, unless redeploying)
- Framework preset? (Express.js or Other)

---

## Step 3: Setup GitHub Pages

GitHub Pages is already prepared in the `docs/` folder.

### Enable on GitHub
1. Go to repository Settings
2. Navigate to Pages
3. Set:
   - Source: Deploy from a branch
   - Branch: main (or develop)
   - Folder: /docs
4. Save

### Frontend Only (GitHub Pages)
GitHub Pages serves the static frontend from `docs/` folder
- **URL**: `https://username.github.io/Ledger/`
- **API calls**: Will use Vercel backend URL

---

## Step 4: Configure Frontend API Endpoints

After Vercel deployment, update frontend to use Vercel API:

Edit `js/core/storage.js`:
```javascript
// Change this line:
const BASE_URL = 'http://localhost:3000';

// To your Vercel URL:
const BASE_URL = 'https://your-app.vercel.app';
```

---

## Deployment Architecture

```
┌─────────────────────────────────────┐
│   GitHub Pages (docs/)              │
│   ├─ index.html                     │
│   ├─ css/                           │
│   ├─ js/                            │
│   └─ images/                        │
└──────────────┬──────────────────────┘
               │ API calls
               ▼
┌─────────────────────────────────────┐
│   Vercel Backend                    │
│   ├─ /api/storage/*                 │
│   ├─ /api/parties/*                 │
│   ├─ /api/sales/*                   │
│   └─ /api/purchases/*               │
└──────────────┬──────────────────────┘
               │ Database operations
               ▼
┌─────────────────────────────────────┐
│   MongoDB Atlas                     │
│   ├─ parties collection             │
│   ├─ sales collection               │
│   ├─ purchases collection           │
│   └─ stock collection               │
└─────────────────────────────────────┘
```

---

## Environment Variables Required

### For Vercel
```
MONGODB_URI = mongodb+srv://user:password@cluster.mongodb.net/business_ledger
NODE_ENV = production
```

### For Local Testing
```powershell
$env:MONGODB_URI = "mongodb://localhost:27017"
$env:NODE_ENV = "development"
```

---

## Testing

### Before Deployment
```bash
# Test MongoDB connection
node test-mongodb.js

# Test backend API
npm start

# Test frontend locally
# Open http://localhost:3000 in browser
```

### After Deployment
1. Verify Vercel deployment:
   - Visit `https://your-app.vercel.app/health`
   - Should return `{ status: 'ok' }`

2. Verify API connectivity:
   - Check browser console for API calls
   - Verify data is being saved to MongoDB

3. Verify GitHub Pages:
   - Visit `https://username.github.io/Ledger/`
   - Should load frontend
   - Should be able to interact with backend

---

## Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
netstat -an | findstr 27017

# Verify connection string
$env:MONGODB_URI = "your-uri"
node test-mongodb.js
```

### Vercel Deployment Issues
```bash
# Check logs
vercel logs --prod

# Redeploy
vercel --prod --force
```

### Frontend Not Loading
- Check browser console (F12)
- Verify BASE_URL in `js/core/storage.js`
- Check CORS settings in `server.js`

---

## Files Modified for Deployment

- ✅ `js/pages/*.js` - Updated to use async/await
- ✅ `js/app.js` - Updated loadPage() to async
- ✅ `js/core/storage.js` - MongoDB-only storage
- ✅ `server.js` - MongoDB backend integration
- ✅ `docs/` - GitHub Pages frontend
- ✅ `deploy.ps1` - Deployment automation script
- ✅ `test-mongodb.js` - MongoDB connection tester

---

## Next Steps

1. **Configure MongoDB**: Set up connection string
2. **Deploy to Vercel**: Run `.\deploy.ps1` or `vercel --prod`
3. **Update Frontend**: Point to Vercel API endpoint
4. **Enable GitHub Pages**: Configure in repository settings
5. **Test Everything**: Verify all components work together

---

## Support

For issues:
1. Check logs: `vercel logs --prod`
2. Check MongoDB: `node test-mongodb.js`
3. Check frontend console: Press F12 in browser
4. Review `MONGODB_MIGRATION.md` for architecture details
