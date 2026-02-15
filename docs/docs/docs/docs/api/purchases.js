const { getPurchases, addPurchase, updatePurchase, deletePurchase } = require('./mongodb-helper');

// Vercel serverless function for purchases CRUD with MongoDB
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Read all purchases
    if (req.method === 'GET') {
      const purchases = await getPurchases();
      return res.json(purchases);
    }

    // POST - Add new purchase
    if (req.method === 'POST') {
      const newPurchase = req.body;
      const result = await addPurchase(newPurchase);
      return res.json({ success: true, purchase: result });
    }

    // PUT - Update purchase
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;
      await updatePurchase(id, updates);
      return res.json({ success: true });
    }

    // DELETE - Remove purchase
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await deletePurchase(id);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Purchases API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
