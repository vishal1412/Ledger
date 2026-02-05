// ===================================
// Image Upload Handler (Vercel Serverless)
// ===================================

import { v4 as uuidv4 } from 'uuid';
import { MongoHelper } from './mongodb-helper.js';

const mongoHelper = new MongoHelper();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, type, id } = req.body;
    
    if (!imageData || !type || !id) {
      return res.status(400).json({ error: 'Missing required fields: imageData, type, id' });
    }
    
    // Generate unique filename
    const filename = `${type}_${id}_${uuidv4()}.jpg`;
    
    // Store base64 image in MongoDB
    const db = await mongoHelper.getDatabase();
    const imagesCollection = db.collection('images');
    
    const result = await imagesCollection.insertOne({
      _id: filename,
      data: imageData, // Store full base64 with data: prefix
      type: type,
      entityId: id,
      uploadedAt: new Date()
    });
    
    if (result.acknowledged) {
      return res.status(200).json({
        success: true,
        filename: filename,
        path: `images/${filename}`,
        uploadedAt: new Date().toISOString()
      });
    } else {
      return res.status(500).json({ error: 'Failed to save image to MongoDB' });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
}
