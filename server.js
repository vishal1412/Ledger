const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('.')); // Serve the frontend from current directory

// Ensure data and images directories exist
const DATA_DIR = path.join(__dirname, 'data');
const IMAGES_DIR = path.join(__dirname, 'images');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

// Configure Image Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create date-based subfolders for images
        const date = new Date();
        const folderName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const fullPath = path.join(IMAGES_DIR, folderName);

        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// --- API Endpoints ---

// Get Data (Generic)
app.get('/api/storage/:collection', (req, res) => {
    const collection = req.params.collection;
    const filePath = path.join(DATA_DIR, `${collection}.json`);

    if (fs.existsSync(filePath)) {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return res.status(500).send('Error reading data');
            try {
                res.json(JSON.parse(data));
            } catch (e) {
                res.json([]); // Return empty array if file is corrupted/empty
            }
        });
    } else {
        res.json([]); // Return empty array if file doesn't exist
    }
});

// Save Data (Generic)
app.post('/api/storage/:collection', (req, res) => {
    const collection = req.params.collection;
    const data = req.body;
    const filePath = path.join(DATA_DIR, `${collection}.json`);

    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) return res.status(500).send('Error saving data');
        res.json({ success: true, message: 'Data saved successfully' });
    });
});

// Upload Image
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Return the relative path to the image so the frontend can load it
    // We need to convert absolute path to relative URL format
    const relativePath = path.relative(__dirname, req.file.path).replace(/\\/g, '/');
    res.json({
        success: true,
        path: relativePath,
        filename: req.file.filename
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`
    🚀 Business Ledger Server Running!
    ----------------------------------
    Local:   http://localhost:${PORT}
    
    Data persistence enabled:
    - JSON files: /data/*.json
    - Images:     /images/*
    `);
});
