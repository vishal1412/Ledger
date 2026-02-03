# Business Ledger & Stock Management Application

A comprehensive web-based business ledger and stock management system with OCR-based document processing, automated calculations, and detailed financial tracking.

## 📋 Features

### Core Modules
- **Party Master**: Manage all vendors and customers
- **OCR Document Processing**: Camera/upload photos with auto-text extraction
- **Vendor Management**: Purchase entry, payments, and payable tracking
- **Customer Management**: Sales entry with bill/cash split, payment collection
- **Stock Management**: Auto-updated inventory from purchases/sales
- **Dashboards**: Real-time business overview and analytics

### Key Capabilities
- ✅ Auto-calculation validation and correction
- ✅ OCR-based bill/invoice entry with Tesseract.js
- ✅ Camera capture and file upload support
- ✅ Excel export for all modules
- ✅ Local storage (JSON-based)
- ✅ Low stock alerts
- ✅ Transaction audit trails
- ✅ Responsive design

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Edge, Firefox, Safari)
- Local web server (for camera access)

### Installation

1. Navigate to the application directory:
   ```bash
   cd business-ledger
   ```

2. Start a local web server:
   
   **Option 1: Using Python**
   ```bash
   python -m http.server 8000
   ```
   
   **Option 2: Using Node.js**
   ```bash
   npx serve
   ```
   
   **Option 3: Using PHP**
   ```bash
   php -S localhost:8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## 📖 Usage Guide

### 1. Party Master
- Click "Parties" in the sidebar
- Add vendors and customers with opening balances
- Manage contact information and addresses

### 2. Adding Purchases (Vendors)
- Go to "Vendors" page
- Click "Add Purchase" or select a vendor
- Choose: Camera / Upload / Manual
- OCR will extract and validate data
- Review and confirm auto-corrections
- Save - stock and payables update automatically

### 3. Recording Sales (Customers)
- Go to "Customers" page
- Click "Add Sale" or select a customer
- Use camera/upload for OCR processing
- Split amount into Bill and Cash
- Save - stock and receivables update automatically

### 4. Recording Payments
- **Vendor Payment**: Click "Payment" button next to vendor
- **Customer Payment**: Click "Receive" button next to customer
- Enter amount and payment mode (Cash/Bank)
- For customers, select payment type (Bill/Cash)

### 5. Stock Management
- Auto-updated from purchases and sales
- View item-wise movements
- Monitor low stock alerts
- Export to Excel

## 🎨 Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (ES6+)
- **OCR**: Tesseract.js v5 (client-side)
- **Excel Export**: SheetJS (xlsx library)
- **Storage**: LocalStorage (JSON)
- **Design**: Modern CSS with gradients and animations

## 📁 Project Structure

```
business-ledger/
├── index.html              # Main application entry
├── css/
│   ├── design-system.css   # Design tokens and utilities
│   ├── components.css      # Reusable UI components
│   └── app.css            # Application-specific styles
├── js/
│   ├── core/              # Core infrastructure
│   ├── services/          # Business logic layer
│   ├── components/        # UI components
│   ├── pages/             # Application pages
│   └── app.js             # Main application
├── data/                  # JSON storage (auto-created)
└── images/                # Document photos (auto-created)
```

## 🔒 Data Storage

All data is stored locally in browser's LocalStorage:
- `business_ledger_parties` - Vendors and customers
- `business_ledger_purchases` - Purchase transactions
- `business_ledger_sales` - Sales transactions
- `business_ledger_payments` - Payment records
- `business_ledger_stock` - Stock items
- `image_*` - Document photos (base64)

## ⚠️ Important Notes

### OCR Accuracy
- Works best with printed text and good lighting
- May require manual correction for handwritten text
- Auto-correction highlights changes for review

### Browser Compatibility
- Camera requires HTTPS or localhost
- Works on desktop and mobile browsers
- File System Access API may have limited support

### Data Backup
- Data is stored locally only
- Use Excel export for backups
- No multi-user support
- Consider browser cache clearing

### Performance
- Suitable for small to medium businesses
- Performance may degrade with thousands of records
- Consider database migration for production use

## 🎯 Best Practices

1. **Regular Backups**: Export data to Excel regularly
2. **Image Quality**: Use good lighting for OCR
3. **Review Data**: Always review OCR auto-corrections
4. **Stock Check**: Monitor low stock alerts
5. **Reconciliation**: Verify ledger balances periodically

## 🐛 Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS or localhost
- Check browser permissions
- Try uploading file instead

### OCR Not Accurate
- Improve lighting and image quality
- Ensure text is clear and not skewed
- Use manual correction if needed

### Data Not Saving
- Check browser's LocalStorage limit
- Clear old/unnecessary data
- Export and import data if needed

## 📝 License

This application is provided as-is for business use.

## 🙏 Credits

- **OCR**: Tesseract.js
- **Excel Export**: SheetJS
- **Icons**: Unicode emoji
- **Fonts**: Google Fonts (Inter)

---

**Note**: This is a client-side application. For production use with multiple users or large data volumes, consider implementing a proper backend with database storage.
