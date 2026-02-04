const { getPayments, addPayment, updatePayment, deletePayment } = require('./mongodb-helper');

// Vercel serverless function for payments CRUD with MongoDB
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Read all payments
    if (req.method === 'GET') {
      const payments = await getPayments();
      return res.json(payments);
    }

    // POST - Add new payment
    if (req.method === 'POST') {
      const newPayment = req.body;
      const result = await addPayment(newPayment);
      return res.json({ success: true, payment: result });
    }

    // PUT - Update payment
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;
      await updatePayment(id, updates);
      return res.json({ success: true });
    }

    // DELETE - Remove payment
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await deletePayment(id);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Payments API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
