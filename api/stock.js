const { getStock, addStockItem, updateStockItem, deleteStockItem, getStockMovements, addStockMovement } = require('./mongodb-helper');

// Vercel serverless function for stock CRUD with MongoDB
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Handle stock movements endpoint
    if (req.url && req.url.includes('/movements')) {
      if (req.method === 'GET') {
        const movements = await getStockMovements();
        return res.json(movements);
      }
      
      if (req.method === 'POST') {
        const newMovement = req.body;
        const result = await addStockMovement(newMovement);
        return res.json({ success: true, movement: result });
      }
    }

    // GET - Read all stock items
    if (req.method === 'GET') {
      const stock = await getStock();
      return res.json(stock);
    }

    // POST - Add new stock item
    if (req.method === 'POST') {
      const newItem = req.body;
      const result = await addStockItem(newItem);
      return res.json({ success: true, item: result });
    }

    // PUT - Update stock item
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;
      await updateStockItem(id, updates);
      return res.json({ success: true });
    }

    // DELETE - Remove stock item
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await deleteStockItem(id);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Stock API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
