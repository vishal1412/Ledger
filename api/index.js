// Serverless function wrapper for all API routes
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const aiRoutes = require('./aiRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// API Routes
aiRoutes(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;
