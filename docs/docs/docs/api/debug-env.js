// Debug endpoint to check environment variables (temporary)
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const mongoUri = process.env.MONGODB_URI;
    return res.json({
      hasMongoUri: !!mongoUri,
      mongoUriLength: mongoUri ? mongoUri.length : 0,
      startsWithMongodb: mongoUri ? mongoUri.startsWith('mongodb') : false,
      firstChars: mongoUri ? mongoUri.substring(0, 15) : 'none',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('MONGO'))
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
