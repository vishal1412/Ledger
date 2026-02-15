const { getAllData, replaceAllData } = require('./mongodb-helper');

// Vercel serverless function for storage operations
module.exports = async (req, res) => {
  // IMPORTANT: Set CORS headers FIRST and for ALL responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get collection from query parameter
    const url = new URL(req.url, `http://${req.headers.host}`);
    const collection = url.searchParams.get('collection');
    
    if (!collection) {
      return res.status(400).json({ error: 'Collection parameter required' });
    }
    
    // GET - Read collection data
    if (req.method === 'GET') {
      const data = await getAllData(collection);
      return res.status(200).json(data || []);
    }

    // POST - Replace collection data (for sync/restore)
    if (req.method === 'POST') {
      const data = req.body;
      await replaceAllData(collection, data);
      return res.status(200).json({ success: true, message: `${collection} data updated` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Storage API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
