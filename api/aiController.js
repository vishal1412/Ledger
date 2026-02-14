const aiService = require('./aiService');

/**
 * POST /api/ai/chat
 * Main AI chat endpoint - handles user messages and image uploads
 * 
 * Request body:
 * {
 *   "message": "user natural language message",
 *   "image": "base64 encoded image (optional)",
 *   "imageMediaType": "image/jpeg|image/png|etc (optional)",
 *   "userId": "user identifier"
 * }
 */
async function handleAiChat(req, res) {
  try {
    const { message, image, imageMediaType, userId } = req.body;

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    // Validate image if provided
    if (image && !imageMediaType) {
      return res.status(400).json({
        success: false,
        error: 'Image media type is required when image is provided',
      });
    }

    const allowedMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (imageMediaType && !allowedMediaTypes.includes(imageMediaType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid image type. Allowed: ${allowedMediaTypes.join(', ')}`,
      });
    }

    // Call AI service
    const result = await aiService.aiChat(message, image, imageMediaType, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI Chat Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing your request',
    });
  }
}

/**
 * POST /api/ai/confirm
 * Confirm and execute pending transactions
 * This prevents unintended database writes
 */
async function confirmTransaction(req, res) {
  try {
    const { toolName, toolInput, userId } = req.body;

    if (!toolName || !toolInput || !userId) {
      return res.status(400).json({
        success: false,
        error: 'toolName, toolInput, and userId are required',
      });
    }

    // Execute the tool with confirmation
    const result = await aiService.executeTool(toolName, toolInput, userId);

    res.json({
      success: true,
      message: 'Transaction completed',
      result,
    });
  } catch (error) {
    console.error('Confirm Transaction Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to confirm transaction',
    });
  }
}

/**
 * GET /api/ai/history
 * Get AI conversation history for a user
 */
async function getHistory(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    // Get history from database (implementation depends on schema)
    // This is a placeholder - implement based on your needs
    res.json({
      success: true,
      message: 'History retrieval not yet implemented',
      userId,
    });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  handleAiChat,
  confirmTransaction,
  getHistory,
};
