const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoHelper = require('./api/mongodb-helper');

const app = express();
const PORT = 3000;

// CORS Configuration - Allow GitHub Pages and localhost
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5500',
            'http://127.0.0.1:3000',
            'https://vishal1412.github.io',
            'https://ledger-kappa-sage.vercel.app',
            'https://ledger-c3muaaf6g-vishalsethi14-2174s-projects.vercel.app'
        ];
        
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('.')); // Serve the frontend from current directory

// Ensure images directory exists (data now in MongoDB)
const IMAGES_DIR = path.join(__dirname, 'images');

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

// Get Data from MongoDB (Generic)
app.get('/api/storage/:collection', async (req, res) => {
    try {
        const collection = req.params.collection;
        const data = await mongoHelper.getAllData(collection);
        res.json(data);
    } catch (err) {
        console.error('Error reading data from MongoDB:', err);
        res.status(500).json({ error: 'Error reading data', details: err.message });
    }
});

// Save Data to MongoDB (Generic - Replace all data in collection)
app.post('/api/storage/:collection', async (req, res) => {
    try {
        const collection = req.params.collection;
        const data = req.body;
        await mongoHelper.replaceAllData(collection, data);
        res.json({ success: true, message: 'Data saved successfully' });
    } catch (err) {
        console.error('Error saving data to MongoDB:', err);
        res.status(500).json({ error: 'Error saving data', details: err.message });
    }
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
