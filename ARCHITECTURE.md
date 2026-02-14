# 🏗️ AI Assistant Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERFACE (Frontend)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐      ┌──────────────────┐               │
│  │  Chat UI        │      │  File Upload     │               │
│  │  - Messages     │      │  - Image input   │               │
│  │  - Input box    │      │  - File name     │               │
│  │  - Quick actions│      │  - Media type    │               │
│  └────────┬────────┘      └────────┬─────────┘               │
│           │                         │                        │
│           └────────────┬────────────┘                        │
│                        │                                     │
│         ┌──────────────▼──────────────┐                     │
│         │  Transaction Summary        │                     │
│         │  - Vendor/Customer info     │                     │
│         │  - Amounts                  │                     │
│         │  - Confirmation modal       │                     │
│         └────────────┬────────────────┘                     │
│                      │                                      │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTP/JSON
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│              API LAYER (Backend - Express)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POST /api/ai/chat          POST /api/ai/confirm                │
│  - Message input            - Tool execution                    │
│  - Image data               - Transaction commit               │
│  - User ID                  - Balance update                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         aiController.js (Request Handlers)             │   │
│  │  - Input validation                                    │   │
│  │  - Error handling                                      │   │
│  │  - Response formatting                                 │   │
│  └─────────────┬──────────────────────────────────────────┘   │
│                │                                                │
└────────────────┼────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│           AI SERVICE LAYER (Core Logic)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  aiService.js - Main AI Logic                         │    │
│  │                                                        │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │  OpenAI Integration                            │  │    │
│  │  │  - GPT-4 Turbo model                          │  │    │
│  │  │  - Tool calling framework                      │  │    │
│  │  │  - Image processing                            │  │    │
│  │  └────────────┬────────────────────────────────────┘  │    │
│  │               │                                        │    │
│  │  ┌────────────▼────────────────────────────────────┐  │    │
│  │  │  Tool Implementations (10 tools)              │  │    │
│  │  │  ├── createVendorOrder                         │  │    │
│  │  │  ├── recordVendorPayment                       │  │    │
│  │  │  ├── createCustomerSale                        │  │    │
│  │  │  ├── recordCustomerPayment                     │  │    │
│  │  │  ├── createParty                               │  │    │
│  │  │  ├── adjustStock                               │  │    │
│  │  │  ├── getDashboardSummary                       │  │    │
│  │  │  ├── getPartyLedger                            │  │    │
│  │  │  ├── getStockDetails                           │  │    │
│  │  │  └── extractFromImage                          │  │    │
│  │  └────────────┬────────────────────────────────────┘  │    │
│  │               │                                        │    │
│  │  ┌────────────▼────────────────────────────────────┐  │    │
│  │  │  Validation Layer (Zod Schemas)               │  │    │
│  │  │  ├── VendorOrderSchema                         │  │    │
│  │  │  ├── VendorPaymentSchema                       │  │    │
│  │  │  ├── CustomerSaleSchema                        │  │    │
│  │  │  ├── CustomerPaymentSchema                     │  │    │
│  │  │  ├── PartySchema                               │  │    │
│  │  │  └── StockAdjustmentSchema                     │  │    │
│  │  └────────────┬────────────────────────────────────┘  │    │
│  │               │                                        │    │
│  │  ┌────────────▼────────────────────────────────────┐  │    │
│  │  │  Error Handling & Logging                      │  │    │
│  │  │  ├── Input validation errors                   │  │    │
│  │  │  ├── Business logic validation                 │  │    │
│  │  │  ├── Database errors                           │  │    │
│  │  │  └── Action logging                            │  │    │
│  │  └────────────────────────────────────────────────┘  │    │
│  │                                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                       │                                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│         DATABASE LAYER (MongoDB Collections)                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   parties    │  │  purchases   │  │    sales     │          │
│  │ (vendors &   │  │ (vendor      │  │ (customer    │          │
│  │  customers)  │  │  orders)     │  │  transactions)          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  payments    │  │    stock     │                            │
│  │ (all payment │  │ (inventory   │                            │
│  │  records)    │  │  levels)     │                            │
│  └──────────────┘  └──────────────┘                            │
│                                                                  │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### 1. Simple Query Flow
```
User: "Show me total receivable"
        │
        ▼
┌───────────────────────────────────────┐
│ Frontend: aiAssistant.js              │
│ - User input: "Show me total..."      │
│ - Send to /api/ai/chat                │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Backend: aiController.js              │
│ - Validate message                    │
│ - Extract userId                      │
│ - Call aiService.aiChat()             │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ OpenAI API                            │
│ - Process: "Show me total..."         │
│ - Determine: getDashboardSummary      │
│ - Return: tool_calls                  │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ aiService: executeTool()              │
│ Tool: getDashboardSummary             │
│ - Query: parties collection           │
│ - Calculate totals                    │
│ - Return summary                      │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ OpenAI: Format response               │
│ "Your total receivable is ₹X"         │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Frontend: Display response            │
│ - Show AI message                     │
│ - Display transaction summary         │
│ - User sees answer                    │
└───────────────────────────────────────┘
```

### 2. Complex Transaction Flow
```
User: "I received 50 items from Vendor A at 100 each"
        │
        ▼
┌───────────────────────────────────────┐
│ Frontend                              │
│ - Send message to /api/ai/chat        │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ OpenAI AI                             │
│ - Parse: "received 50 items..."       │
│ - Identify: vendor "A", qty 50, rate 100
│ - Tool: createVendorOrder             │
│ - Arguments: {vendor, product, qty...}│
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Backend: executeTool()                │
│ Tool: createVendorOrder               │
│ - Validate with VendorOrderSchema     │
│ - Check vendor exists                 │
│ - Create purchase record              │
│ - Update stock (+50)                  │
│ - Update party payable (+5000)        │
│ - Return success                      │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ OpenAI: Generate response             │
│ "Purchase order created for 50 items" │
│ "Payable updated to vendor"           │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Frontend: Display Results             │
│ - AI message                          │
│ - Transaction summary card            │
│ - Confirmation modal                  │
└───────────────────────────────────────┘
```

### 3. Image Processing Flow
```
User: Uploads bill image
        │
        ▼
┌───────────────────────────────────────┐
│ Frontend: File Upload Handler         │
│ - Read file                           │
│ - Convert to base64                   │
│ - Get mediaType                       │
│ - Send to /api/ai/chat                │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ OpenAI Vision (GPT-4 Turbo)          │
│ - Process image                       │
│ - Extract text (OCR)                  │
│ - Identify: vendor, items, amounts    │
│ - Tool: extractFromImage              │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Backend: extractFromImage()           │
│ - Send image to OpenAI                │
│ - Get extracted JSON                  │
│ - Validate data                       │
│ - Return extracted info               │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Frontend: Display Extracted Data      │
│ - Show vendor name                    │
│ - Show items & quantities             │
│ - Show total                          │
│ - Allow user to confirm               │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ User Clicks "Confirm"                 │
│ - Send to /api/ai/confirm             │
│ - Backend executes createVendorOrder  │
│ - Database updated                    │
│ - UI shows success                    │
└───────────────────────────────────────┘
```

## Component Relationships

```
┌──────────────────────────────────────────────────────────┐
│                    index.html (Entry)                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Imports:                                               │
│  ├── CSS                                                │
│  │   ├── ai-assistant.css  ◄─────────────────┐          │
│  │   └── other styles                        │          │
│  │                                            │          │
│  └── JavaScript                              │          │
│      ├── app.js ─────┐                       │          │
│      │               │                       │          │
│      └───────────────┼───────────────────┐   │          │
│                      ▼                   ▼   │          │
│              ┌─────────────────┐        ┌────┴──────┐   │
│              │ Pages (5+)      │        │ aiAssistant.js
│              │ - dashboard.js  │        │ (Chat UI)    │
│              │ - parties.js    │        └──────────────┘
│              │ - vendors.js    │              │
│              │ - customers.js  │              ▼
│              │ - stock.js      │        ┌───────────────┐
│              └─────────────────┘        │ Component:    │
│                      │                  │ - Chat area   │
│                      ▼                  │ - Input box   │
│              ┌─────────────────┐        │ - File upload │
│              │ Components      │        │ - Modal       │
│              │ - navigation.js │        └───────────────┘
│              │ - forms.js      │
│              │ - modal.js      │
│              └─────────────────┘
│
│  Services:
│  └── All fetch from API
│
│  API Calls:
│  └── POST /api/ai/chat ──────────────┐
│      POST /api/ai/confirm ──────────┐│
│                                     ││
│                                     ▼▼
└─────────────────────────────────────────────────────────┘
                        │
                        ▼ HTTP/JSON
        ┌───────────────────────────────────┐
        │      server.js (Express)          │
        ├───────────────────────────────────┤
        │                                   │
        │  aiRoutes(app) ◄──────────────────┤
        │      │                            │
        │      ├── POST /api/ai/chat        │
        │      │   │                        │
        │      │   ▼                        │
        │      │ aiController              │
        │      │   └── handleAiChat()      │
        │      │                            │
        │      ├── POST /api/ai/confirm     │
        │      │   │                        │
        │      │   ▼                        │
        │      │ aiController              │
        │      │   └── confirmTransaction()│
        │      │                            │
        │      └── GET /api/ai/health       │
        │                                   │
        └───────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │    aiService.js (Core Logic)      │
        ├───────────────────────────────────┤
        │                                   │
        │  aiChat() ─────┬────────────────┐ │
        │      │         │                │ │
        │      ▼         ▼                ▼ │
        │   OpenAI  executeTool()  Validation│
        │   API      │                       │
        │      ▼     ▼                       │
        │   Tool ──► 10 Functions            │
        │   Calling   • createVendorOrder    │
        │      │      • recordVendorPayment  │
        │      │      • createCustomerSale   │
        │      │      • recordCustomerPayment
        │      │      • createParty          │
        │      │      • adjustStock          │
        │      │      • getDashboardSummary  │
        │      │      • getPartyLedger       │
        │      │      • getStockDetails      │
        │      │      • extractFromImage     │
        │      │                            │
        │      └─────────┬───────────────────│
        │                ▼                  │
        └───────────────────────────────────┘
                        │
                        ▼ MongoDB Operations
        ┌───────────────────────────────────┐
        │   mongodb-helper.js                │
        ├───────────────────────────────────┤
        │                                   │
        │  ├── getParties()                 │
        │  ├── addPurchase()                │
        │  ├── getSales()                   │
        │  ├── addPayment()                 │
        │  ├── getStock()                   │
        │  └── update* / delete* ...        │
        │                                   │
        └───────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │     MongoDB Atlas/Local           │
        ├───────────────────────────────────┤
        │                                   │
        │  Database: business_ledger        │
        │  ├── parties                      │
        │  ├── purchases                    │
        │  ├── sales                        │
        │  ├── payments                     │
        │  └── stock                        │
        │                                   │
        └───────────────────────────────────┘
```

## Tool Architecture

```
┌─────────────────────────────────────────────┐
│  AI Tool System                             │
├─────────────────────────────────────────────┤
│                                             │
│  1. Tool Definition (OpenAI Schema)         │
│     ├── Tool name                           │
│     ├── Description                         │
│     ├── Parameters (JSON Schema)            │
│     └── Required fields                     │
│                                             │
│  2. Input Validation (Zod)                  │
│     ├── Parse parameters                    │
│     ├── Type checking                       │
│     ├── Range validation                    │
│     └── Business rules                      │
│                                             │
│  3. Execution Logic                         │
│     ├── Database queries                    │
│     ├── Business calculations               │
│     ├── Updates/inserts                     │
│     └── Balance updates                     │
│                                             │
│  4. Error Handling                          │
│     ├── Validation errors                   │
│     ├── Database errors                     │
│     ├── Logic errors                        │
│     └── User-friendly messages              │
│                                             │
│  5. Response Format                         │
│     ├── Success status                      │
│     ├── Human message                       │
│     ├── Technical details                   │
│     └── Transaction summary                 │
│                                             │
└─────────────────────────────────────────────┘

Example: createVendorOrder Tool

OpenAI Tool Definition:
{
  "type": "function",
  "function": {
    "name": "createVendorOrder",
    "description": "Create a vendor order/purchase",
    "parameters": {
      "type": "object",
      "properties": {
        "vendorName": { "type": "string" },
        "productName": { "type": "string" },
        "quantity": { "type": "number" },
        "rate": { "type": "number" }
      },
      "required": ["vendorName", "productName", "quantity", "rate"]
    }
  }
}
         │
         ▼
Validation (Zod):
VendorOrderSchema.parse(toolInput)
- vendorName: min 1 char
- productName: min 1 char
- quantity: > 0
- rate: >= 0
         │
         ▼
Execution:
async function createVendorOrder(input, userId) {
  // Calculate total
  const total = input.quantity * input.rate
  
  // Create purchase record
  const purchase = await mongoHelper.addPurchase({
    vendorName,
    productName,
    quantity,
    rate,
    totalAmount: total,
    createdBy: userId
  })
  
  // Update party payable
  const vendor = await getVendorByName(input.vendorName)
  await mongoHelper.updateParty(vendor.id, {
    payable: (vendor.payable || 0) + total
  })
  
  // Update stock
  const product = await getProductByName(input.productName)
  await mongoHelper.updateStock(product.id, {
    quantity: (product.quantity || 0) + input.quantity
  })
  
  return {
    success: true,
    message: "Purchase order created",
    totalAmount: total,
    purchase: result
  }
}
         │
         ▼
Response:
{
  "success": true,
  "message": "Purchase order created: 50 cement bags from Ramesh Traders",
  "totalAmount": 17500,
  "purchase": { _id, vendorName, ... }
}
```

## Security Architecture

```
┌──────────────────────────────────────────────┐
│         Security Layers                      │
├──────────────────────────────────────────────┤
│                                              │
│  Layer 1: API Security                       │
│  ├── CORS validation                         │
│  ├── Content-Type validation                 │
│  ├── Body size limits                        │
│  └── Rate limiting (ready)                   │
│                                              │
│  Layer 2: Authentication (Optional)          │
│  ├── JWT token verification                  │
│  ├── User ID validation                      │
│  └── Permission checks                       │
│                                              │
│  Layer 3: Input Validation                   │
│  ├── Zod schema validation                   │
│  ├── Type checking                           │
│  ├── Range validation                        │
│  └── Enum validation                         │
│                                              │
│  Layer 4: Business Logic Validation          │
│  ├── Stock > 0 (no negative)                 │
│  ├── Amount > 0 (no negative)                │
│  ├── Payment <= Balance (no overpay)         │
│  └── Vendor/Customer exists                  │
│                                              │
│  Layer 5: Database Security                  │
│  ├── Connection pooling                      │
│  ├── Parameterized queries                   │
│  ├── Transaction management                  │
│  └── Audit logging                           │
│                                              │
│  Layer 6: Logging & Monitoring               │
│  ├── All actions logged                      │
│  ├── Error tracking                          │
│  ├── Usage monitoring                        │
│  └── Performance metrics                     │
│                                              │
└──────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│  Local Development                               │
├──────────────────────────────────────────────────┤
│  npm start                                       │
│  ├── Node.js runs server.js                      │
│  ├── Express starts on port 3000                 │
│  ├── Connects to local/cloud MongoDB             │
│  └── Uses .env for configuration                 │
└──────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────┐
│  Version Control (GitHub)                        │
├──────────────────────────────────────────────────┤
│  ├── Code pushed to repository                   │
│  ├── All files committed                         │
│  └── .env excluded from git                      │
└──────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────┐
│  Production (Vercel)                             │
├──────────────────────────────────────────────────┤
│  ├── Webhook trigger on push                     │
│  ├── Automatic deployment                        │
│  ├── Environment variables configured            │
│  ├── Builds and deploys                          │
│  ├── Live on https://your-app.vercel.app         │
│  └── MongoDB cloud connected                     │
└──────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────┐
│  Monitoring & Support                            │
├──────────────────────────────────────────────────┤
│  ├── Vercel Analytics                            │
│  ├── OpenAI Usage Dashboard                      │
│  ├── MongoDB Atlas Monitoring                    │
│  ├── Error Tracking                              │
│  └── Performance Metrics                         │
└──────────────────────────────────────────────────┘
```

---

This architecture ensures:
✅ Scalability - Service-based design
✅ Security - Multiple validation layers
✅ Maintainability - Clean separation of concerns
✅ Reliability - Error handling throughout
✅ Flexibility - Easy to add new tools
✅ Performance - Optimized database queries
