// ===================================
// OCR PROCESSING ENGINE
// ===================================

class OCREngine {
    constructor() {
        this.worker = null;
        this.isReady = false;
        this.initialize();
    }

    // Initialize Tesseract worker
    async initialize() {
        try {
            // Create Tesseract worker
            this.worker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        this.updateProgress(Math.round(m.progress * 100));
                    }
                }
            });
            this.isReady = true;
            console.log('OCR Engine initialized');
        } catch (error) {
            console.error('Error initializing OCR:', error);
            this.isReady = false;
        }
    }

    // Process image and extract text
    async processImage(imageData) {
        if (!this.isReady) {
            await this.initialize();
        }

        try {
            const { data } = await this.worker.recognize(imageData);
            return {
                success: true,
                text: data.text,
                confidence: data.confidence,
                lines: data.lines.map(line => line.text),
                words: data.words.map(word => ({
                    text: word.text,
                    confidence: word.confidence
                }))
            };
        } catch (error) {
            console.error('Error processing image:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Parse invoice/bill structure from OCR text
    parseInvoice(ocrResult) {
        if (!ocrResult.success) {
            return null;
        }

        const lines = ocrResult.lines
            .filter(line => line.trim().length > 0)
            .map(line => line.trim());
        const text = ocrResult.text;
        
        console.log('OCR Lines to parse:', lines);
        
        const parsed = {
            partyName: '',
            date: '',
            items: [],
            subtotal: 0,
            tax: 0,
            taxPercent: 0,
            total: 0,
            rawText: ocrResult.text,
            confidence: ocrResult.confidence
        };

        // Skip common noise words/patterns
        const noisePatterns = [
            /^[\*\-\.=_]+$/,  // Just symbols
            /^page \d+/i,
            /^thank you/i,
            /^visit us/i,
            /^www\./i,
            /^http/i,
            /^\+91/,  // Phone numbers
            /^GSTIN/i,
            /^PAN/i,
            /^[A-Z0-9]{15}$/  // GST numbers
        ];

        // Clean lines by removing noise
        const cleanLines = lines.filter(line => {
            return !noisePatterns.some(pattern => pattern.test(line)) && line.length > 2;
        });

        // Extract party name (first meaningful line that looks like a business name)
        const companyKeywords = ['limited', 'ltd', 'pvt', 'inc', 'corp', 'co', 'store', 'shop', 'mart', 'traders', 'enterprise'];
        
        for (let i = 0; i < Math.min(5, cleanLines.length); i++) {
            const line = cleanLines[i];
            // Skip dates, phone numbers, addresses
            if (line.match(/^\d/) || line.match(/[\d\/\-\.]{8,}/)) continue;
            
            // Check if line contains company keywords or is title case
            const hasCompanyKeyword = companyKeywords.some(kw => line.toLowerCase().includes(kw));
            const isTitleCase = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/.test(line);
            const isAllCaps = line === line.toUpperCase() && line.length > 4;
            
            if (hasCompanyKeyword || isTitleCase || isAllCaps) {
                parsed.partyName = line;
                console.log('Extracted party name:', line);
                break;
            }
        }

        // Extract date (look for various date patterns)
        const datePatterns = [
            /(?:date|dated)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
            /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
            /(\d{1,2}[-\/]\w{3}[-\/]\d{2,4})/i  // 15-Jan-2024
        ];
        
        for (const line of lines) {
            for (const pattern of datePatterns) {
                const dateMatch = line.match(pattern);
                if (dateMatch) {
                    parsed.date = this.normalizeDate(dateMatch[1]);
                    break;
                }
            }
            if (parsed.date) break;
        }

        // Extract items - try multiple strategies
        parsed.items = this.extractItemsAdvanced(lines, text);

        // Extract tax information
        const taxInfo = this.extractTaxInfo(lines, text);
        parsed.tax = taxInfo.tax;
        parsed.taxPercent = taxInfo.taxPercent;
        parsed.subtotal = taxInfo.subtotal;

        // Extract total
        parsed.total = this.extractTotal(lines, text);

        // If no items found but we have a total, create a generic item
        if (parsed.items.length === 0 && parsed.total > 0) {
            parsed.items = [{
                name: 'Invoice Item',
                quantity: 1,
                rate: parsed.total,
                lineAmount: parsed.total
            }];
        }

        // Calculate totals if not found
        if (parsed.total === 0 && parsed.items.length > 0) {
            parsed.total = parsed.items.reduce((sum, item) => sum + (item.lineAmount || 0), 0);
        }

        return parsed;
    }

    // Advanced item extraction with multiple strategies
    extractItemsAdvanced(lines, fullText) {
        const items = [];
        
        // Skip noise patterns for items
        const itemNoisePatterns = [
            /^[*\-\.=_]+$/,
            /^(invoice|bill|receipt|tax invoice)/i,
            /^(date|time|tel|ph|mob|email|address)/i,
            /^(gstin|pan|cin|fssai)/i,
            /^(thank you|visit|call|order)/i,
            /^[A-Z0-9]{15,}$/  // Long alphanumeric (like GST numbers)
        ];
        
        // Strategy 1: Table-like structure with columns (Item, Qty, Rate, Amount)
        const tablePattern = /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:,\d+)*(?:\.\d+)?)\s+(\d+(?:,\d+)*(?:\.\d+)?)$/;
        
        // Strategy 2: Item with price at end
        const itemPricePattern = /^(.+?)\s+(?:Rs\\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)$/;
        
        // Strategy 3: Quantity * Rate = Amount pattern
        const qtyRatePattern = /(.+?)\s+(\d+)\s*[xX×]\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*=?\s*(\d+(?:,\d+)*(?:\.\d+)?)/;

        let itemStarted = false;\n        let itemEndIndex = lines.length;\n\n        // Find where items section starts and ends\n        for (let i = 0; i < lines.length; i++) {\n            const line = lines[i].toLowerCase();\n            if (line.includes('item') || line.includes('description') || line.includes('particulars')) {\n                itemStarted = true;\n            }\n            if ((line.includes('subtotal') || line.includes('total') || line.includes('amount')) && itemStarted) {\n                itemEndIndex = i;\n                break;\n            }\n        }\n\n        console.log('Item extraction range:', itemStarted ? 'found' : 'not found', 'End index:', itemEndIndex);\n\n        for (let i = 0; i < Math.min(itemEndIndex, lines.length); i++) {\n            const line = lines[i].trim();\n            \n            // Skip noise patterns\n            if (itemNoisePatterns.some(pattern => pattern.test(line))) {\n                continue;\n            }\n            \n            // Skip header rows and total rows\n            if (this.isHeaderOrTotalRow(line)) {\n                continue;\n            }\n\n            // Must have at least one number to be an item\n            if (!/\\d/.test(line)) {\n                continue;\n            }\n\n            // Try table pattern first (most structured)\n            const tableMatch = line.match(tablePattern);\n            if (tableMatch) {\n                const name = tableMatch[1].trim();\n                const qty = parseFloat(tableMatch[2]);\n                const rate = parseFloat(tableMatch[3].replace(/,/g, ''));\n                const amount = parseFloat(tableMatch[4].replace(/,/g, ''));\n                \n                // Validate item name is reasonable\n                if (name && name.length > 1 && name.length < 100 && qty > 0 && rate > 0 && rate < 1000000) {\n                    items.push({\n                        name,\n                        quantity: qty,\n                        rate: rate,\n                        lineAmount: amount || (qty * rate)\n                    });\n                    console.log('Extracted item (table):', name);\n                    continue;\n                }\n            }\n\n            // Try quantity * rate pattern\n            const qtyRateMatch = line.match(qtyRatePattern);\n            if (qtyRateMatch) {\n                const name = qtyRateMatch[1].trim();\n                const qty = parseFloat(qtyRateMatch[2]);\n                const rate = parseFloat(qtyRateMatch[3].replace(/,/g, ''));\n                const amount = parseFloat(qtyRateMatch[4].replace(/,/g, ''));\n                \n                if (name && name.length > 1 && qty > 0 && rate > 0) {\n                    items.push({\n                        name,\n                        quantity: qty,\n                        rate: rate,\n                        lineAmount: amount\n                    });\n                    console.log('Extracted item (qty*rate):', name);\n                    continue;\n                }\n            }\n\n            // Try simple item-price pattern (last resort)\n            const itemPriceMatch = line.match(itemPricePattern);\n            if (itemPriceMatch && !line.match(/total|tax|discount|subtotal|paid|balance/i)) {\n                const name = itemPriceMatch[1].trim();\n                const amount = parseFloat(itemPriceMatch[2].replace(/,/g, ''));\n                \n                // More strict validation for single-price items\n                if (name.length > 2 && name.length < 100 && amount > 0 && amount < 100000) {\n                    items.push({\n                        name,\n                        quantity: 1,\n                        rate: amount,\n                        lineAmount: amount\n                    });\n                    console.log('Extracted item (simple):', name);\n                }\n            }\n        }\n\n        console.log('Total items extracted:', items.length);\n\n        // Don't use heuristic if we found structured items\n        if (items.length > 0) {\n            return items;\n        }\n\n        // Only use heuristic as absolute last resort\n        console.log('No items found, trying heuristic...');\n        return [];\n    }

    // Check if line is a header or total row
    isHeaderOrTotalRow(line) {
        const lowerLine = line.toLowerCase();
        const skipKeywords = [
            'item', 'description', 'qty', 'quantity', 'rate', 'price', 'amount',
            'total', 'subtotal', 'grand total', 'net total', 'tax', 'gst', 'cgst', 'sgst',
            'discount', 'balance', 'paid', 'invoice', 'bill', 'receipt'
        ];
        
        return skipKeywords.some(keyword => lowerLine === keyword || 
                                           (lowerLine.includes(keyword) && line.length < 20));
    }

    // Extract tax information
    extractTaxInfo(lines, fullText) {
        const result = {
            tax: 0,
            taxPercent: 0,
            subtotal: 0
        };

        const taxPatterns = [
            /(?:GST|Tax|VAT)[:\s]*(?:@\s*)?(\d+(?:\.\d+)?)\s*%/i,
            /(?:CGST|SGST|IGST)[:\s]*(\d+(?:,\d+)*(?:\.\d+)?)/i,
            /Tax[:\s]*(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i
        ];

        const subtotalPatterns = [
            /(?:Subtotal|Sub Total|Sub-Total)[:\s]*(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
            /Total Before Tax[:\s]*(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i
        ];

        // Extract tax percentage and amount
        for (const line of lines) {
            // Check for tax percentage
            const taxPercentMatch = line.match(/(?:GST|Tax|VAT)[:\s]*(?:@\s*)?(\d+(?:\.\d+)?)\s*%/i);
            if (taxPercentMatch) {
                result.taxPercent = parseFloat(taxPercentMatch[1]);
            }

            // Check for tax amount
            for (const pattern of taxPatterns) {
                const match = line.match(pattern);
                if (match) {
                    const amount = parseFloat(match[1].replace(/,/g, ''));
                    if (amount > 0) {
                        result.tax += amount;
                    }
                }
            }

            // Check for subtotal
            for (const pattern of subtotalPatterns) {
                const match = line.match(pattern);
                if (match) {
                    result.subtotal = parseFloat(match[1].replace(/,/g, ''));
                }
            }
        }

        return result;
    }

    // Heuristic extraction when pattern matching fails
    extractItemsHeuristic(lines) {
        const items = [];
        const numberPattern = /\d+(?:\.\d+)?/g;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const numbers = line.match(numberPattern);

            // If line has 3-4 numbers, it might be an item
            if (numbers && numbers.length >= 3) {
                const nums = numbers.map(n => parseFloat(n));
                items.push({
                    name: line.replace(numberPattern, '').trim() || `Item ${i + 1}`,
                    quantity: nums[0] || 1,
                    rate: nums[1] || 0,
                    lineAmount: nums[2] || (nums[0] * nums[1])
                });
            }
        }

        return items;
    }

    // Extract total amount from text
    extractTotal(lines, fullText) {
        const totalKeywords = ['total', 'grand total', 'net total', 'amount payable', 'balance due', 'total amount'];
        const numberPattern = /(\d+(?:,\d+)*(?:\.\d+)?)/g;

        // First pass: Look for explicit total lines
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].toLowerCase();

            // Check if line contains total keywords (but not subtotal)
            const hasTotal = totalKeywords.some(keyword => line.includes(keyword));
            const hasSubtotal = line.includes('subtotal') || line.includes('sub total');
            
            if (hasTotal && !hasSubtotal) {
                const numbers = lines[i].match(numberPattern);
                if (numbers && numbers.length > 0) {
                    // Get the largest number in the line (likely the total)
                    const amounts = numbers.map(n => parseFloat(n.replace(/,/g, '')));
                    const maxAmount = Math.max(...amounts);
                    if (maxAmount > 0) {
                        return maxAmount;
                    }
                }
            }
        }

        // Second pass: Look in last 5 lines for largest amount
        const lastLines = lines.slice(-5);
        const allAmounts = [];
        
        for (const line of lastLines) {
            const numbers = line.match(numberPattern);
            if (numbers) {
                numbers.forEach(n => {
                    const amount = parseFloat(n.replace(/,/g, ''));
                    if (amount > 10) { // Filter out small numbers that might be dates
                        allAmounts.push(amount);
                    }
                });
            }
        }

        // Return the largest amount found (likely the total)
        return allAmounts.length > 0 ? Math.max(...allAmounts) : 0;
    }

    // Normalize date format
    normalizeDate(dateStr) {
        try {
            // Convert various date formats to YYYY-MM-DD
            const parts = dateStr.split(/[\/\-\.]/);
            if (parts.length === 3) {
                let day, month, year;

                // Determine which part is year
                if (parts[2].length === 4) {
                    // DD/MM/YYYY or MM/DD/YYYY
                    day = parts[0];
                    month = parts[1];
                    year = parts[2];
                } else {
                    // DD/MM/YY or MM/DD/YY
                    day = parts[0];
                    month = parts[1];
                    year = '20' + parts[2];
                }

                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        } catch (error) {
            console.error('Error normalizing date:', error);
        }

        // Return current date if parsing fails
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    // Update progress callback
    updateProgress(progress) {
        const event = new CustomEvent('ocr-progress', { detail: { progress } });
        window.dispatchEvent(event);
    }

    // Clean up resources
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isReady = false;
        }
    }

    // Process and validate in one step
    async processAndValidate(imageData) {
        try {
            console.log('Starting OCR processing...');
            
            const ocrResult = await this.processImage(imageData);
            console.log('OCR Result:', ocrResult);
            
            if (!ocrResult.success) {
                return { success: false, error: ocrResult.error };
            }

            const parsed = this.parseInvoice(ocrResult);
            console.log('Parsed invoice data:', parsed);
            
            if (!parsed) {
                return { success: false, error: 'Failed to parse invoice' };
            }

            // Ensure we have at least some data
            if (parsed.items.length === 0 && parsed.total === 0) {
                console.warn('No items or total found in OCR');
                // Create a default item so user can edit
                parsed.items = [{
                    name: 'Item 1',
                    quantity: 1,
                    rate: 0,
                    lineAmount: 0
                }];
            }

            // Validate using calculator
            const validated = window.calculator.validateTransaction({
                items: parsed.items,
                total: parsed.total
            });
            console.log('Validated transaction:', validated);

            return {
                success: true,
                data: {
                    partyName: parsed.partyName || '',
                    date: parsed.date || new Date().toISOString().split('T')[0],
                    items: validated.items,
                    subtotal: parsed.subtotal || validated.total - (parsed.tax || 0),
                    tax: parsed.tax || 0,
                    taxPercent: parsed.taxPercent || 0,
                    total: validated.total,
                    originalTotal: validated.originalTotal,
                    totalWasCorrected: validated.totalWasCorrected,
                    corrections: validated.corrections,
                    validationSummary: validated.validationSummary,
                    rawText: parsed.rawText,
                    confidence: parsed.confidence
                }
            };
        } catch (error) {
            console.error('OCR processing error:', error);
            return { 
                success: false, 
                error: 'OCR processing failed: ' + error.message 
            };
        }
    }
}

// Create global instance
window.ocrEngine = new OCREngine();
