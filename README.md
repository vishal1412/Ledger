# Business Ledger & Stock Management Application

A comprehensive web-based business ledger and stock management system with OCR-based document processing, automated calculations, and detailed financial tracking.

## 🌟 Key Features

### Core Modules
- **Party Master**: Manage all vendors and customers.
- **OCR Document Processing**: Camera/upload photos with auto-text extraction (Tesseract.js).
- **Vendor Management**: Purchase entry, payments, and payable tracking.
- **Customer Management**: Sales entry with bill/cash split, payment collection.
- **Stock Management**: Auto-updated inventory from purchases/sales.
- **Dashboards**: Real-time business overview and analytics.

### 💾 Data Persistence (New!)
Unlike typical web apps, this project includes a lightweight **Node.js Backend** that allows you to:
- **Save JSON data** directly to your hard drive (`data/` folder).
- **Save images** directly to your hard drive (`images/` folder).
- **Access remotely** via tunnels while keeping data local.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your computer.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/vishal1412/Ledger.git
    cd Ledger
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Application

**Option A: One-Click Start (Windows)**
Double-click `start.bat` in the project folder.

**Option B: Command Line**
```bash
node server.js
```

The application will start at: **http://localhost:3000**

## 🌍 Accessing Remotely
To access your ledger from your phone or share with others ensuring data saves to your computer:

1.  Start the app (`node server.js` or `start.bat`).
2.  Open a new terminal and run:
    ```bash
    npx -y localtunnel --port 3000
    ```
3.  Use the provided URL to access the app from anywhere.

## 📁 Project Structure

```
business-ledger/
├── data/                  # 💾 JSON files (parties.json, sales.json, etc.)
├── images/                # 📸 Uploaded invoice images
├── server.js              # ⚙️ Backend server for file operations
├── start.bat              # 🚀 Windows launcher script
├── index.html             # Main application entry
├── js/
│   ├── core/              # Core infrastructure (StorageManager, OCR)
│   ├── services/          # Business logic
│   └── components/        # UI components
└── css/                   # Stylesheets
```

## 🔒 Data Storage Details

-   **Frontend**: The app loads data from the server on startup and caches it for speed.
-   **Backend**: When you save (e.g., adding a sale), the server writes it to `data/sales.json`.
-   **Images**: Images are uploaded to `images/YYYY-MM/` folder.

## ⚠️ Important Notes

-   **Backup**: Regularly back up your `data/` and `images/` folders.
-   **GitHub Pages**: If you deploy this to GitHub Pages (static hosting), the file saving feature **will not work**. It will revert to browser-only storage because static sites cannot write to your server files. To use file persistence, you must run `node server.js` locally.

## 📝 License

This application is provided as-is for business use.
