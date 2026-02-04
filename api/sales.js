const { getSales, addSale, updateSale, deleteSale } = require('./mongodb-helper');

// Vercel serverless function for sales CRUD with MongoDB
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Read all sales
    if (req.method === 'GET') {
      const sales = await getSales();
      return res.json(sales);
    }

    // POST - Add new sale
    if (req.method === 'POST') {
      const newSale = req.body;
      const result = await addSale(newSale);
      return res.json({ success: true, sale: result });
    }

    // PUT - Update sale
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;
      await updateSale(id, updates);
      return res.json({ success: true });
    }

    // DELETE - Remove sale
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await deleteSale(id);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Sales API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
