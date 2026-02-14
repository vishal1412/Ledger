const aiController = require('./aiController');

/**
 * AI Routes
 * Register these routes in your main server.js file with:
 * const aiRoutes = require('./api/aiRoutes');
 * app.use('/api/ai', aiRoutes);
 */

module.exports = (app) => {
  // Main AI chat endpoint
  app.post('/api/ai/chat', async (req, res) => {
    // Optional: Add JWT verification middleware here
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token) return res.status(401).json({ error: 'No token provided' });
    
    await aiController.handleAiChat(req, res);
  });

  // Confirm transaction endpoint
  app.post('/api/ai/confirm', async (req, res) => {
    // Optional: Add JWT verification middleware
    await aiController.confirmTransaction(req, res);
  });

  // Get conversation history
  app.get('/api/ai/history', async (req, res) => {
    await aiController.getHistory(req, res);
  });

  // Health check
  app.get('/api/ai/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AI Assistant',
      openaiConfigured: !!process.env.OPENAI_API_KEY,
    });
  });
};
