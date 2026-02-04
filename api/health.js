// Vercel serverless function for health check
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({
      status: 'ok',
      message: 'Business Ledger API Server is running on Vercel',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
