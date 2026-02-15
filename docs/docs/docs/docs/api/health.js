// Vercel serverless function for health check
module.exports = async (req, res) => {
  // Enable CORS - MUST be first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      message: 'Business Ledger API Server is running on Vercel',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      mongodb: process.env.MONGODB_URI ? 'configured' : 'not configured'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
