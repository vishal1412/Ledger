const { getParties, addParty, updateParty, deleteParty } = require('./mongodb-helper');

// Vercel serverless function for parties CRUD with MongoDB
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Read all parties
    if (req.method === 'GET') {
      const parties = await getParties();
      return res.json(parties);
    }

    // POST - Add new party
    if (req.method === 'POST') {
      const newParty = req.body;
      const result = await addParty(newParty);
      return res.json({ success: true, party: result });
    }

    // PUT - Update party
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;
      await updateParty(id, updates);
      return res.json({ success: true });
    }

    // DELETE - Remove party
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await deleteParty(id);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Parties API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
