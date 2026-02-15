const { getAlerts, addAlert, deleteAlert, clearAlerts } = require('./mongodb-helper');

// Vercel serverless function for alerts with MongoDB
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Read all alerts
    if (req.method === 'GET') {
      const alerts = await getAlerts();
      return res.json(alerts);
    }

    // POST - Add new alert or clear all
    if (req.method === 'POST') {
      const { action } = req.query;
      
      if (action === 'clear') {
        await clearAlerts();
        return res.json({ success: true, message: 'All alerts cleared' });
      }
      
      const newAlert = req.body;
      const result = await addAlert(newAlert);
      return res.json({ success: true, alert: result });
    }

    // DELETE - Remove alert
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await deleteAlert(id);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Alerts API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
