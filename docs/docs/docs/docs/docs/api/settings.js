const { getSettings, updateSettings } = require('./mongodb-helper');

// Vercel serverless function for settings with MongoDB
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Read settings
    if (req.method === 'GET') {
      const settings = await getSettings();
      return res.json(settings);
    }

    // POST/PUT - Update settings
    if (req.method === 'POST' || req.method === 'PUT') {
      const updates = req.body;
      await updateSettings(updates);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
