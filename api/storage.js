const { getAllData, replaceAllData } = require('./mongodb-helper');

// Vercel serverless function for storage operations (sync/backup/restore)
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { collection } = req.query;
    
    // GET - Read collection data
    if (req.method === 'GET') {
      if (!collection) {
        return res.status(400).json({ error: 'Collection name required' });
      }
      
      const data = await getAllData(collection);
      return res.json(data);
    }

    // POST - Replace collection data (for sync/restore)
    if (req.method === 'POST') {
      if (!collection) {
        return res.status(400).json({ error: 'Collection name required' });
      }
      
      const data = req.body;
      await replaceAllData(collection, data);
      return res.json({ success: true, message: `${collection} data updated` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Storage API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
