const OpenAI = require('openai');
const { z } = require('zod');
const mongoHelper = require('./mongodb-helper');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schemas
const VendorOrderSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name required'),
  productName: z.string().min(1, 'Product name required'),
  quantity: z.number().min(1, 'Quantity must be > 0'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  date: z.string().optional(),
  notes: z.string().optional(),
});

const VendorPaymentSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name required'),
  amount: z.number().min(0.01, 'Amount must be > 0'),
  paymentMethod: z.enum(['cash', 'bank', 'cheque', 'upi']).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

const CustomerSaleSchema = z.object({
  customerName: z.string().min(1, 'Customer name required'),
  productName: z.string().min(1, 'Product name required'),
  quantity: z.number().min(1, 'Quantity must be > 0'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  date: z.string().optional(),
  creditTerm: z.number().optional(),
  notes: z.string().optional(),
});

const CustomerPaymentSchema = z.object({
  customerName: z.string().min(1, 'Customer name required'),
  amount: z.number().min(0.01, 'Amount must be > 0'),
  paymentMethod: z.enum(['cash', 'bank', 'cheque', 'upi']).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

const PartySchema = z.object({
  partyName: z.string().min(1, 'Party name required'),
  partyType: z.enum(['vendor', 'customer']),
  openingBalance: z.number().min(0, 'Opening balance cannot be negative'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const StockAdjustmentSchema = z.object({
  productName: z.string().min(1, 'Product name required'),
  quantity: z.number().min(1, 'Quantity must be > 0'),
  adjustmentType: z.enum(['add', 'remove', 'adjust']),
  reason: z.string().optional(),
  date: z.string().optional(),
});

// AI Tool Definitions for OpenAI Function Calling
const aiTools = [
  {
    type: 'function',
    function: {
      name: 'createVendorOrder',
      description: 'Create a new vendor order/purchase. Extract vendor name, product, quantity, and rate from user input.',
      parameters: {
        type: 'object',
        properties: {
          vendorName: {
            type: 'string',
            description: 'Name of the vendor/supplier',
          },
          productName: {
            type: 'string',
            description: 'Name of the product being purchased',
          },
          quantity: {
            type: 'number',
            description: 'Quantity of items purchased',
          },
          rate: {
            type: 'number',
            description: 'Price per unit',
          },
          date: {
            type: 'string',
            description: 'Date of purchase (YYYY-MM-DD format)',
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the order',
          },
        },
        required: ['vendorName', 'productName', 'quantity', 'rate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recordVendorPayment',
      description: 'Record a payment made to a vendor. Reduces payable amount.',
      parameters: {
        type: 'object',
        properties: {
          vendorName: {
            type: 'string',
            description: 'Name of the vendor',
          },
          amount: {
            type: 'number',
            description: 'Amount paid',
          },
          paymentMethod: {
            type: 'string',
            enum: ['cash', 'bank', 'cheque', 'upi'],
            description: 'Method of payment',
          },
          date: {
            type: 'string',
            description: 'Date of payment (YYYY-MM-DD)',
          },
          notes: {
            type: 'string',
            description: 'Payment notes or reference',
          },
        },
        required: ['vendorName', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createCustomerSale',
      description: 'Record a sale to a customer. Increases receivable and decreases stock.',
      parameters: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            description: 'Name of the customer',
          },
          productName: {
            type: 'string',
            description: 'Product being sold',
          },
          quantity: {
            type: 'number',
            description: 'Quantity sold',
          },
          rate: {
            type: 'number',
            description: 'Selling price per unit',
          },
          date: {
            type: 'string',
            description: 'Date of sale (YYYY-MM-DD)',
          },
          creditTerm: {
            type: 'number',
            description: 'Days allowed for payment (0 for cash)',
          },
          notes: {
            type: 'string',
            description: 'Sale notes',
          },
        },
        required: ['customerName', 'productName', 'quantity', 'rate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recordCustomerPayment',
      description: 'Record a payment received from a customer. Reduces receivable amount.',
      parameters: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            description: 'Name of the customer',
          },
          amount: {
            type: 'number',
            description: 'Amount received',
          },
          paymentMethod: {
            type: 'string',
            enum: ['cash', 'bank', 'cheque', 'upi'],
            description: 'Payment method',
          },
          date: {
            type: 'string',
            description: 'Date of payment (YYYY-MM-DD)',
          },
          notes: {
            type: 'string',
            description: 'Payment notes',
          },
        },
        required: ['customerName', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createParty',
      description: 'Add a new party (vendor or customer) to the system with opening balance.',
      parameters: {
        type: 'object',
        properties: {
          partyName: {
            type: 'string',
            description: 'Full name of the party',
          },
          partyType: {
            type: 'string',
            enum: ['vendor', 'customer'],
            description: 'Whether this is a vendor or customer',
          },
          openingBalance: {
            type: 'number',
            description: 'Opening debit (what they owe) or credit balance',
          },
          phone: {
            type: 'string',
            description: 'Contact phone number',
          },
          address: {
            type: 'string',
            description: 'Address of the party',
          },
        },
        required: ['partyName', 'partyType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'adjustStock',
      description: 'Adjust inventory: add stock, remove damaged items, or update quantities.',
      parameters: {
        type: 'object',
        properties: {
          productName: {
            type: 'string',
            description: 'Name of the product',
          },
          quantity: {
            type: 'number',
            description: 'Quantity to adjust',
          },
          adjustmentType: {
            type: 'string',
            enum: ['add', 'remove', 'adjust'],
            description: 'Type of adjustment: add, remove, or adjust to specific amount',
          },
          reason: {
            type: 'string',
            description: 'Reason for adjustment (damaged, lost, counted, etc.)',
          },
          date: {
            type: 'string',
            description: 'Date of adjustment (YYYY-MM-DD)',
          },
        },
        required: ['productName', 'quantity', 'adjustmentType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getDashboardSummary',
      description: 'Get financial summary: total receivable, total payable, net profit.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'quarter', 'year', 'all'],
            description: 'Period for which to calculate summary',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getPartyLedger',
      description: 'Get complete ledger for a specific party (vendor or customer) with all transactions.',
      parameters: {
        type: 'object',
        properties: {
          partyName: {
            type: 'string',
            description: 'Name of the party to query',
          },
        },
        required: ['partyName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getStockDetails',
      description: 'Get detailed stock information for a product or all products.',
      parameters: {
        type: 'object',
        properties: {
          productName: {
            type: 'string',
            description: 'Optional: specific product to query. If omitted, returns all products.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'extractFromImage',
      description: 'Extract vendor, items, quantities, and totals from a bill/invoice image using OCR.',
      parameters: {
        type: 'object',
        properties: {
          imageBase64: {
            type: 'string',
            description: 'Base64 encoded image of the bill/invoice',
          },
          imageMediaType: {
            type: 'string',
            enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            description: 'MIME type of the image',
          },
        },
        required: ['imageBase64', 'imageMediaType'],
      },
    },
  },
];

/**
 * Execute tool calls returned by OpenAI
 */
async function executeTool(toolName, toolInput, userId) {
  console.log(`Executing tool: ${toolName}`, toolInput);

  try {
    switch (toolName) {
      case 'createVendorOrder':
        return await createVendorOrder(toolInput, userId);
      case 'recordVendorPayment':
        return await recordVendorPayment(toolInput, userId);
      case 'createCustomerSale':
        return await createCustomerSale(toolInput, userId);
      case 'recordCustomerPayment':
        return await recordCustomerPayment(toolInput, userId);
      case 'createParty':
        return await createParty(toolInput, userId);
      case 'adjustStock':
        return await adjustStock(toolInput, userId);
      case 'getDashboardSummary':
        return await getDashboardSummary(toolInput);
      case 'getPartyLedger':
        return await getPartyLedger(toolInput);
      case 'getStockDetails':
        return await getStockDetails(toolInput);
      case 'extractFromImage':
        return await extractFromImage(toolInput);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    throw error;
  }
}

/**
 * Tool Implementation: Create Vendor Order
 */
async function createVendorOrder(input, userId) {
  const validated = VendorOrderSchema.parse(input);
  const totalAmount = validated.quantity * validated.rate;

  const purchase = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    vendorName: validated.vendorName,
    vendorId: validated.vendorName.toLowerCase().replace(/\s+/g, '_'),
    product: validated.productName,
    quantity: validated.quantity,
    rate: validated.rate,
    totalAmount,
    date: validated.date || new Date().toISOString().split('T')[0],
    status: 'pending_confirmation',
    notes: validated.notes,
    createdBy: userId,
    createdAt: new Date(),
  };

  const result = await mongoHelper.addPurchase(purchase);

  // Also update party payable amount
  const parties = await mongoHelper.getParties();
  const vendor = parties.find(p => p.name.toLowerCase() === validated.vendorName.toLowerCase());

  if (vendor) {
    await mongoHelper.updateParty(vendor.id, {
      payable: (vendor.payable || 0) + totalAmount,
    });
  }

  return {
    success: true,
    message: `Purchase order created: ${validated.quantity} ${validated.productName} from ${validated.vendorName}`,
    totalAmount,
    purchase: result,
  };
}

/**
 * Tool Implementation: Record Vendor Payment
 */
async function recordVendorPayment(input, userId) {
  const validated = VendorPaymentSchema.parse(input);

  const payment = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    partyType: 'vendor',
    vendorName: validated.vendorName,
    vendorId: validated.vendorName.toLowerCase().replace(/\s+/g, '_'),
    amount: validated.amount,
    paymentMethod: validated.paymentMethod || 'cash',
    date: validated.date || new Date().toISOString().split('T')[0],
    notes: validated.notes,
    createdBy: userId,
    createdAt: new Date(),
  };

  const result = await mongoHelper.addPayment(payment);

  // Update party payable amount
  const parties = await mongoHelper.getParties();
  const vendor = parties.find(p => p.name.toLowerCase() === validated.vendorName.toLowerCase());

  if (vendor) {
    const newPayable = Math.max(0, (vendor.payable || 0) - validated.amount);
    await mongoHelper.updateParty(vendor.id, {
      payable: newPayable,
    });
  }

  return {
    success: true,
    message: `Payment of ${validated.amount} recorded to ${validated.vendorName}`,
    payment: result,
  };
}

/**
 * Tool Implementation: Create Customer Sale
 */
async function createCustomerSale(input, userId) {
  const validated = CustomerSaleSchema.parse(input);
  const totalAmount = validated.quantity * validated.rate;

  // Get stock and validate
  const stock = await mongoHelper.getStock();
  const product = stock.find(s => s.product.toLowerCase() === validated.productName.toLowerCase());

  if (!product || product.quantity < validated.quantity) {
    throw new Error(
      `Insufficient stock. Available: ${product?.quantity || 0}, Requested: ${validated.quantity}`
    );
  }

  const sale = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customerId: validated.customerName.toLowerCase().replace(/\s+/g, '_'),
    customerName: validated.customerName,
    product: validated.productName,
    quantity: validated.quantity,
    rate: validated.rate,
    totalAmount,
    date: validated.date || new Date().toISOString().split('T')[0],
    creditTerm: validated.creditTerm || 0,
    status: 'pending_confirmation',
    notes: validated.notes,
    createdBy: userId,
    createdAt: new Date(),
  };

  const result = await mongoHelper.addSale(sale);

  // Update stock
  const newQuantity = product.quantity - validated.quantity;
  await mongoHelper.updateStock(product.id, { quantity: newQuantity });

  // Update customer receivable
  const parties = await mongoHelper.getParties();
  const customer = parties.find(p => p.name.toLowerCase() === validated.customerName.toLowerCase());

  if (customer) {
    await mongoHelper.updateParty(customer.id, {
      receivable: (customer.receivable || 0) + totalAmount,
    });
  }

  return {
    success: true,
    message: `Sale recorded: ${validated.quantity} ${validated.productName} to ${validated.customerName} for ${totalAmount}`,
    totalAmount,
    sale: result,
  };
}

/**
 * Tool Implementation: Record Customer Payment
 */
async function recordCustomerPayment(input, userId) {
  const validated = CustomerPaymentSchema.parse(input);

  const payment = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    partyType: 'customer',
    customerId: validated.customerName.toLowerCase().replace(/\s+/g, '_'),
    customerName: validated.customerName,
    amount: validated.amount,
    paymentMethod: validated.paymentMethod || 'cash',
    date: validated.date || new Date().toISOString().split('T')[0],
    notes: validated.notes,
    createdBy: userId,
    createdAt: new Date(),
  };

  const result = await mongoHelper.addPayment(payment);

  // Update customer receivable
  const parties = await mongoHelper.getParties();
  const customer = parties.find(p => p.name.toLowerCase() === validated.customerName.toLowerCase());

  if (customer) {
    const newReceivable = Math.max(0, (customer.receivable || 0) - validated.amount);
    await mongoHelper.updateParty(customer.id, {
      receivable: newReceivable,
    });
  }

  return {
    success: true,
    message: `Payment of ${validated.amount} received from ${validated.customerName}`,
    payment: result,
  };
}

/**
 * Tool Implementation: Create Party
 */
async function createParty(input, userId) {
  const validated = PartySchema.parse(input);

  const party = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: validated.partyName,
    type: validated.partyType,
    payable: validated.partyType === 'vendor' ? validated.openingBalance : 0,
    receivable: validated.partyType === 'customer' ? validated.openingBalance : 0,
    phone: validated.phone,
    address: validated.address,
    createdBy: userId,
    createdAt: new Date(),
  };

  const result = await mongoHelper.addParty(party);

  return {
    success: true,
    message: `New ${validated.partyType} added: ${validated.partyName}`,
    party: result,
  };
}

/**
 * Tool Implementation: Stock Adjustment
 */
async function adjustStock(input, userId) {
  const validated = StockAdjustmentSchema.parse(input);

  const stock = await mongoHelper.getStock();
  let product = stock.find(s => s.product.toLowerCase() === validated.productName.toLowerCase());

  if (!product) {
    throw new Error(`Product not found: ${validated.productName}`);
  }

  let newQuantity;
  if (validated.adjustmentType === 'add') {
    newQuantity = product.quantity + validated.quantity;
  } else if (validated.adjustmentType === 'remove') {
    newQuantity = Math.max(0, product.quantity - validated.quantity);
  } else {
    newQuantity = validated.quantity;
  }

  await mongoHelper.updateStock(product.id, { quantity: newQuantity });

  return {
    success: true,
    message: `Stock adjusted for ${validated.productName}: ${validated.adjustmentType} ${validated.quantity}. Reason: ${validated.reason || 'N/A'}`,
    product: validated.productName,
    newQuantity,
  };
}

/**
 * Tool Implementation: Get Dashboard Summary
 */
async function getDashboardSummary(input) {
  const period = input.period || 'month';

  const parties = await mongoHelper.getParties();
  const sales = await mongoHelper.getSales();
  const purchases = await mongoHelper.getPurchases();

  const totalReceivable = parties
    .filter(p => p.type === 'customer')
    .reduce((sum, p) => sum + (p.receivable || 0), 0);

  const totalPayable = parties
    .filter(p => p.type === 'vendor')
    .reduce((sum, p) => sum + (p.payable || 0), 0);

  const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const netProfit = totalSales - totalPurchases;

  return {
    period,
    summary: {
      totalReceivable,
      totalPayable,
      totalSales,
      totalPurchases,
      netProfit,
      topVendors: parties
        .filter(p => p.type === 'vendor')
        .sort((a, b) => (b.payable || 0) - (a.payable || 0))
        .slice(0, 3),
      topCustomers: parties
        .filter(p => p.type === 'customer')
        .sort((a, b) => (b.receivable || 0) - (a.receivable || 0))
        .slice(0, 3),
    },
  };
}

/**
 * Tool Implementation: Get Party Ledger
 */
async function getPartyLedger(input) {
  const parties = await mongoHelper.getParties();
  const party = parties.find(p => p.name.toLowerCase() === input.partyName.toLowerCase());

  if (!party) {
    throw new Error(`Party not found: ${input.partyName}`);
  }

  const sales = await mongoHelper.getSales();
  const purchases = await mongoHelper.getPurchases();
  const payments = await mongoHelper.getPayments();

  const partyTransactions = [];

  if (party.type === 'vendor') {
    partyTransactions.push(
      ...purchases
        .filter(p => p.vendorName.toLowerCase() === input.partyName.toLowerCase())
        .map(p => ({ type: 'purchase', date: p.date, amount: p.totalAmount, description: p.product }))
    );
    partyTransactions.push(
      ...payments
        .filter(
          p => p.partyType === 'vendor' && p.vendorName.toLowerCase() === input.partyName.toLowerCase()
        )
        .map(p => ({ type: 'payment', date: p.date, amount: -p.amount, description: 'Payment' }))
    );
  } else if (party.type === 'customer') {
    partyTransactions.push(
      ...sales
        .filter(s => s.customerName.toLowerCase() === input.partyName.toLowerCase())
        .map(s => ({ type: 'sale', date: s.date, amount: s.totalAmount, description: s.product }))
    );
    partyTransactions.push(
      ...payments
        .filter(
          p =>
            p.partyType === 'customer' &&
            p.customerName.toLowerCase() === input.partyName.toLowerCase()
        )
        .map(p => ({ type: 'payment', date: p.date, amount: -p.amount, description: 'Payment' }))
    );
  }

  partyTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    party: {
      name: party.name,
      type: party.type,
      payable: party.type === 'vendor' ? party.payable : undefined,
      receivable: party.type === 'customer' ? party.receivable : undefined,
    },
    transactions: partyTransactions,
  };
}

/**
 * Tool Implementation: Get Stock Details
 */
async function getStockDetails(input) {
  const stock = await mongoHelper.getStock();

  if (input.productName) {
    const product = stock.find(s => s.product.toLowerCase() === input.productName.toLowerCase());
    if (!product) {
      throw new Error(`Product not found: ${input.productName}`);
    }
    return {
      product: product.product,
      quantity: product.quantity,
      unit: product.unit || 'pcs',
    };
  }

  return {
    allProducts: stock.map(s => ({
      product: s.product,
      quantity: s.quantity,
      unit: s.unit || 'pcs',
    })),
  };
}

/**
 * Tool Implementation: Extract from Image
 */
async function extractFromImage(input) {
  const { imageBase64, imageMediaType } = input;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageMediaType};base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `Extract the following from this bill/invoice and return ONLY valid JSON:
              {
                "vendorName": "...",
                "invoiceNumber": "...",
                "invoiceDate": "...",
                "items": [
                  {
                    "description": "...",
                    "quantity": 0,
                    "rate": 0,
                    "amount": 0
                  }
                ],
                "totalAmount": 0,
                "notes": "..."
              }
              Be precise. If a field is not found, use null.`,
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    return {
      success: true,
      extractedData: JSON.parse(jsonMatch[0]),
      message: 'Bill data extracted successfully',
    };
  } catch (error) {
    throw new Error(`Failed to extract from image: ${error.message}`);
  }
}

/**
 * Main AI chat function using OpenAI tool calling
 */
async function aiChat(userMessage, imageBase64, imageMediaType, userId) {
  try {
    const messages = [];

    // Build the initial message
    const contentParts = [
      {
        type: 'text',
        text: userMessage,
      },
    ];

    // Add image if provided
    if (imageBase64 && imageMediaType) {
      contentParts.push({
        type: 'image_url',
        image_url: {
          url: `data:${imageMediaType};base64,${imageBase64}`,
        },
      });
    }

    messages.push({
      role: 'user',
      content: contentParts,
    });

    let response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages,
      tools: aiTools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 2000,
    });

    let aiResponse = {
      success: true,
      message: '',
      toolCalls: [],
      results: [],
    };

    // Process tool calls in a loop (OpenAI might make multiple calls)
    while (response.choices[0].finish_reason === 'tool_calls') {
      const assistantMessage = response.choices[0].message;
      const toolCalls = assistantMessage.tool_calls || [];

      // Add assistant message with tool calls
      messages.push({
        role: 'assistant',
        content: assistantMessage.content,
        tool_calls: toolCalls,
      });

      // Process each tool call
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolInput = JSON.parse(toolCall.function.arguments);

        console.log(`AI called tool: ${toolName}`, toolInput);

        try {
          const toolResult = await executeTool(toolName, toolInput, userId);
          aiResponse.results.push({
            toolName,
            status: 'success',
            result: toolResult,
          });
          aiResponse.toolCalls.push({
            name: toolName,
            input: toolInput,
            result: toolResult,
          });

          // Add tool result to messages
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        } catch (toolError) {
          console.error(`Tool execution error for ${toolName}:`, toolError);
          aiResponse.results.push({
            toolName,
            status: 'error',
            error: toolError.message,
          });

          // Add error as tool result
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: toolError.message }),
          });
        }
      }

      // Get next response from OpenAI with tool results
      response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages,
        tools: aiTools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2000,
      });
    }

    // Extract final text response
    const finalMessage = response.choices[0].message.content;
    aiResponse.message = finalMessage || 'Action completed successfully';

    return aiResponse;
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw new Error(`AI Chat failed: ${error.message}`);
  }
}

module.exports = {
  aiChat,
  executeTool,
  aiTools,
  createVendorOrder,
  recordVendorPayment,
  createCustomerSale,
  recordCustomerPayment,
  createParty,
  adjustStock,
  getDashboardSummary,
  getPartyLedger,
  getStockDetails,
  extractFromImage,
};
