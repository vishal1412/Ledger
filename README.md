# Business Ledger & Stock Management Application

> 🤖 **NEW**: AI Assistant integration now available! Use natural language to manage your entire business. [See below](#-ai-assistant).

> ⚡ **IMPORTANT**: This application has been migrated to **MongoDB-only storage**. All data is now persisted in MongoDB exclusively. See [MONGODB_MIGRATION.md](./MONGODB_MIGRATION.md) for migration details and important breaking changes.

A comprehensive web-based business ledger and stock management system with OCR-based document processing, automated calculations, detailed financial tracking, and **AI-powered natural language interface**.

## 🌟 Key Features

### Core Modules
- **Party Master**: Manage all vendors and customers.
- **OCR Document Processing**: Camera/upload photos with auto-text extraction (Tesseract.js).
- **Vendor Management**: Purchase entry, payments, and payable tracking.
- **Customer Management**: Sales entry with bill/cash split, payment collection.
- **Stock Management**: Auto-updated inventory from purchases/sales.
- **Dashboards**: Real-time business overview and analytics.
- **🤖 AI Assistant**: Natural language interface powered by GPT-4 (NEW!)

### 💾 Data Persistence

This application now uses **MongoDB exclusively** for all data storage:

- **☁️ MongoDB Cloud Storage** - Recommended
  - Store data in MongoDB Atlas (free cloud database)
  - Deploy API to Vercel (free serverless hosting)
  - Access from anywhere, any device
  - Automatic backups and scalability
  - **Perfect for production use**

- **🖥️ MongoDB Local Storage**
  - MongoDB running locally on your machine
  - Express backend API
  - Good for development and single-user setup

**Note**: All operations are now async (Promise-based) and require a server connection. See [MONGODB_MIGRATION.md](./MONGODB_MIGRATION.md) for details.

## 🚀 Quick Start

### Option 1: Cloud Deployment (Recommended)

Deploy to Vercel with MongoDB in under 10 minutes:

```powershell
# Run automated deployment script
.\deploy-vercel.ps1
```

Or follow the guides:
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - 10-minute quick start
- **[MONGODB_SETUP.md](./MONGODB_SETUP.md)** - MongoDB Atlas configuration
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Complete deployment guide

### Option 2: Local Installation
### Option 2: Local Installation

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)

#### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/vishal1412/Ledger.git
    cd Ledger
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

#### Running Locally

**Option A: One-Click Start (Windows)**
Double-click `start.bat` in the project folder.

**Option B: Command Line**
```bash
node server.js
```

The application will start at: **http://localhost:3000**

---

## 🤖 AI Assistant

**NEW!** Your Ledger system now includes an AI Assistant powered by OpenAI GPT-4.

### What You Can Do

Use natural language to:
- ✅ Add vendors and customers
- ✅ Record purchases and sales
- ✅ Process payments
- ✅ Manage stock
- ✅ Upload and extract bills via images
- ✅ Get financial reports
- ✅ Ask business questions

### Quick Example

```
User: "I received 50 cement bags from Ramesh Traders at 350 per bag"

AI Response:
✓ Purchase order created
✓ Stock updated: +50 bags
✓ Payable updated: +₹17,500
```

### Getting Started with AI

**Setup (5 minutes):**
1. Get OpenAI API key: https://platform.openai.com/api-keys
2. Set environment variable: `OPENAI_API_KEY=sk_...`
3. Start server: `npm start`
4. Open: http://localhost:3000/#aiAssistant

**Read the guides:**
- [AI_ASSISTANT_QUICK_START.md](./AI_ASSISTANT_QUICK_START.md) - Quick reference
- [AI_ASSISTANT_GUIDE.md](./AI_ASSISTANT_GUIDE.md) - Complete documentation
- [CONFIGURATION_CHECKLIST.md](./CONFIGURATION_CHECKLIST.md) - Setup checklist

### AI Features

| Feature | Description |
|---------|-------------|
| **Natural Language** | Understand business context naturally |
| **Multi-tool** | 10 business tools available |
| **Bill Extraction** | Upload images for automatic OCR |
| **Conversation** | Multi-turn dialogue support |
| **Confirmation** | Review transactions before executing |
| **Real-time** | Instant updates to dashboard |
| **Mobile Ready** | Works on all devices |

---

## 📁 Project Structure

```
Ledger/
├── api/                   # 🔌 Vercel serverless functions
│   ├── mongodb-helper.js  # Database operations
│   ├── health.js          # Health check endpoint
│   ├── parties.js         # Parties CRUD
│   ├── purchases.js       # Purchases CRUD
│   ├── sales.js           # Sales CRUD
│   ├── payments.js        # Payments CRUD
│   ├── stock.js           # Stock management
│   ├── settings.js        # Business settings
│   ├── alerts.js          # Alerts management
│   └── storage.js         # Bulk sync operations
├── data/                  # 💾 Local JSON files (optional)
├── images/                # 📸 Uploaded images (local mode)
├── server.js              # ⚙️ Local backend server
├── start.bat              # 🚀 Windows launcher
├── deploy-vercel.ps1      # 🚀 Automated Vercel deployment
├── vercel.json            # ⚙️ Vercel configuration
├── index.html             # Main application entry
├── js/
│   ├── core/              # Core infrastructure
│   │   ├── storage.js     # Hybrid storage manager
│   │   ├── calculator.js  # Business calculations
│   │   ├── ocr.js         # OCR processing
│   │   └── export.js      # Data export utilities
│   ├── services/          # Business logic
│   │   ├── party.js       # Party management
│   │   ├── purchase.js    # Purchase operations
│   │   ├── sales.js       # Sales operations
│   │   ├── payment.js     # Payment handling
│   │   └── stock.js       # Stock management
│   ├── pages/             # Page controllers
│   └── components/        # UI components
├── css/                   # Stylesheets
├── QUICK_DEPLOY.md        # 📖 Quick deployment guide
├── MONGODB_SETUP.md       # 📖 MongoDB Atlas setup
├── VERCEL_DEPLOYMENT.md   # 📖 Vercel deployment guide
└── README.md              # This file
```

---

## 🌐 API Endpoints

When deployed to Vercel, the following API endpoints are available:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/health` | GET | Health check & status |
| `/api/parties` | GET, POST, PUT, DELETE | Customers & Vendors |
| `/api/purchases` | GET, POST, PUT, DELETE | Purchase transactions |
| `/api/sales` | GET, POST, PUT, DELETE | Sales records |
| `/api/payments` | GET, POST, PUT, DELETE | Payment tracking |
| `/api/stock` | GET, POST, PUT, DELETE | Stock items |
| `/api/settings` | GET, POST, PUT | Business settings |
| `/api/alerts` | GET, POST, DELETE | Notifications |
| `/api/storage` | GET, POST | Bulk sync operations |

---

## 🔒 Data Storage Architecture

### Cloud Mode (MongoDB + Vercel)
```
Frontend (Browser) ←→ Vercel API ←→ MongoDB Atlas
                      ↓
              Global CDN
              Automatic SSL
              Persistent Storage
```

### Local Mode
```
Frontend (Browser) ←→ Node.js Server ←→ Local Files
                                      (data/*.json)
```

### Browser-Only Mode
```
Frontend (Browser) ←→ LocalStorage
                      (Browser Cache)
```

---

## 🌍 Deployment Options

### Cloud Deployment (Recommended for Production)

**Benefits:**
- ✅ Access from anywhere, any device
- ✅ Automatic backups (MongoDB Atlas)
- ✅ Global CDN (Vercel)
- ✅ Automatic SSL/HTTPS
- ✅ Scalable infrastructure
- ✅ 100% free tier available

**Deploy in 3 commands:**
```powershell
npm install
vercel login
vercel --prod
```

See **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** for detailed instructions.

### Local Deployment

**Benefits:**
- ✅ Full control over data
- ✅ No internet required after setup
- ✅ Fast local access
- ✅ Simple setup

**Access remotely via tunnel:**
```bash
node server.js
# In another terminal:
npx -y localtunnel --port 3000
```

---

## 🛠️ Configuration

### Environment Variables

Create `.env` file (use `.env.example` as template):

```bash
# MongoDB connection (for cloud deployment)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Local server configuration (optional)
PORT=3000
NODE_ENV=development

# Business settings (optional)
BUSINESS_NAME=My Business
CURRENCY=₹
```

**For Vercel deployment:**
- Add `MONGODB_URI` in Vercel Dashboard → Settings → Environment Variables
- See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for getting your connection string

---

## 💡 Usage Tips

### Switching Between Storage Modes

Edit [js/core/storage.js](js/core/storage.js) line 6:

**Cloud mode (Vercel):**
```javascript
this.serverUrl = 'https://your-vercel-url.vercel.app/api';
```

**Local server mode:**
```javascript
this.serverUrl = 'http://localhost:3000/api';
```

**Browser-only mode:**
```javascript
this.isOnline = false; // Set in constructor
```

### Data Migration

**Export from browser:**
1. Open DevTools Console (F12)
2. Run: `window.storage.exportToJSON('parties')`
3. Repeat for other collections

**Import to MongoDB:**
- Use [upload-data-to-mongodb.js](./upload-data-to-mongodb.js) (if created)
- Or use the storage API endpoints

---

## ⚠️ Important Notes

### Cloud Deployment
- **Free tier limits**: MongoDB Atlas M0 (512MB), Vercel Hobby (100GB bandwidth/month)
- **Security**: Never commit `.env` file or connection strings to Git
- **Backups**: MongoDB Atlas handles automatic backups (paid tiers)

### Local Deployment
- **Backup**: Regularly back up `data/` and `images/` folders
- **Access**: Use LocalTunnel or ngrok for remote access
- **Security**: Don't expose local server to public internet without proper authentication

### Browser-Only Mode
- **Limitations**: Data stored only in browser cache
- **Risk**: Clearing browser data will delete all records
- **Use case**: Demos, testing, or temporary usage only

---

## 🔧 Troubleshooting

### MongoDB Connection Issues
```powershell
# Test connection string
node -e "require('mongodb').MongoClient.connect(process.env.MONGODB_URI).then(c => {console.log('Connected!'); c.close();})"
```

### Vercel Deployment Errors
```powershell
# Check logs
vercel logs

# View latest deployment
vercel inspect
```

### Local Server Issues
```bash
# Check if port 3000 is already in use
netstat -ano | findstr :3000

# Use different port
PORT=3001 node server.js
```

---

## 📚 Additional Documentation

- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Get started in 10 minutes
- **[MONGODB_SETUP.md](./MONGODB_SETUP.md)** - Complete MongoDB Atlas guide
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Advanced Vercel configuration

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

This application is provided as-is for business use.

---

## 🎯 Roadmap

- [x] Local file storage
- [x] MongoDB Atlas integration
- [x] Vercel serverless deployment
- [ ] Multi-user authentication
- [ ] Role-based access control
- [ ] Advanced reporting & analytics
- [ ] Mobile app (React Native)
- [ ] Invoice PDF generation
- [ ] Email notifications
- [ ] WhatsApp integration

---

## 🆘 Support

For issues, questions, or feature requests:
- Create an issue: [GitHub Issues](https://github.com/vishal1412/Ledger/issues)
- Check documentation in the guides above
- Review Vercel docs: https://vercel.com/docs
- Review MongoDB docs: https://docs.atlas.mongodb.com

---

**Built with ❤️ for small businesses**
