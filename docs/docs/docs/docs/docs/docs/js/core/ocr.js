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

        const lines = ocrResult.lines.map(l => l.trim()).filter(l => l.length > 0);
        const parsed = {
            partyName: '',
            date: '',
            items: [],
            total: 0,
            rawText: ocrResult.text,
            confidence: ocrResult.confidence
        };

        // Extract party name (first non-empty line that's not a number)
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i];
            // Skip lines that are mostly numbers or very short
            if (line.length > 3 && !/^[\d\s.,\/-]+$/.test(line)) {
                parsed.partyName = line;
                break;
            }
        }

        // Extract date (look for date patterns)
        const datePatterns = [
            /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
            /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
            /date[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
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

        // Extract items - try multiple patterns
        const extractedItems = this.extractItems(lines);
        parsed.items = extractedItems;

        // Extract total
        parsed.total = this.extractTotal(lines);

        // If no items found, create a default item with total
        if (parsed.items.length === 0 && parsed.total > 0) {
            parsed.items.push({
                name: 'Item 1',
                quantity: 1,
                rate: parsed.total,
                lineAmount: parsed.total
            });
        }

        return parsed;
    }

    // Extract items with improved pattern matching
    extractItems(lines) {
        const items = [];
        const skipKeywords = ['total', 'subtotal', 'grand', 'tax', 'cgst', 'sgst', 'igst', 'discount', 'bill', 'invoice', 'date', 'phone', 'address'];
        
        // Pattern 1: Name Qty Rate Amount (space/tab separated)
        const pattern1 = /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;
        
        // Pattern 2: Name with numbers at end
        const pattern2 = /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lowerLine = line.toLowerCase();
            
            // Skip header lines and total lines
            if (skipKeywords.some(keyword => lowerLine.includes(keyword))) {
                continue;
            }
            
            // Try pattern 1: Item Qty Rate Amount
            let match = line.match(pattern1);
            if (match) {
                const [, name, qty, rate, amount] = match;
                const qtyNum = parseFloat(qty);
                const rateNum = parseFloat(rate);
                const amountNum = parseFloat(amount);
                
                // Validate that amount roughly equals qty * rate
                const expectedAmount = qtyNum * rateNum;
                if (Math.abs(expectedAmount - amountNum) / amountNum < 0.1 || amountNum > expectedAmount) {
                    items.push({
                        name: name.trim(),
                        quantity: qtyNum,
                        rate: rateNum,
                        lineAmount: amountNum
                    });
                    continue;
                }
            }
            
            // Try pattern 2: Item Qty Amount (no rate)
            match = line.match(pattern2);
            if (match) {
                const [, name, num1, num2] = match;
                const n1 = parseFloat(num1);
                const n2 = parseFloat(num2);
                
                // Assume num1 is qty, num2 is amount
                if (n2 > n1 && name.length > 2) {
                    items.push({
                        name: name.trim(),
                        quantity: n1,
                        rate: n2 / n1,
                        lineAmount: n2
                    });
                    continue;
                }
            }
        }
        
        // If no items found with patterns, try heuristic extraction
        if (items.length === 0) {
            return this.extractItemsHeuristic(lines);
        }
        
        return items;
    }

    // Heuristic extraction when pattern matching fails
    extractItemsHeuristic(lines) {
        const items = [];
        const numberPattern = /\d+(?:\.\d+)?/g;
        const skipKeywords = ['total', 'subtotal', 'grand', 'tax', 'cgst', 'sgst', 'igst', 'discount', 'bill', 'invoice', 'date', 'phone', 'address', 'gst', 'pan'];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lowerLine = line.toLowerCase();
            
            // Skip irrelevant lines
            if (skipKeywords.some(keyword => lowerLine.includes(keyword))) {
                continue;
            }
            
            const numbers = line.match(numberPattern);
            const text = line.replace(numberPattern, '').replace(/[^a-zA-Z\s]/g, '').trim();

            // If line has text and 2-4 numbers, it might be an item
            if (numbers && numbers.length >= 2 && numbers.length <= 4 && text.length > 1) {
                const nums = numbers.map(n => parseFloat(n));
                
                let quantity, rate, amount;
                
                if (numbers.length === 4) {
                    // Likely: Serial# Qty Rate Amount
                    quantity = nums[1];
                    rate = nums[2];
                    amount = nums[3];
                } else if (numbers.length === 3) {
                    // Likely: Qty Rate Amount
                    quantity = nums[0];
                    rate = nums[1];
                    amount = nums[2];
                } else if (numbers.length === 2) {
                    // Likely: Qty Amount (or Rate Amount)
                    if (nums[0] < 100 && nums[1] > nums[0]) {
                        // First is likely quantity
                        quantity = nums[0];
                        amount = nums[1];
                        rate = amount / quantity;
                    } else {
                        // Both might be rate and amount
                        quantity = 1;
                        rate = nums[0];
                        amount = nums[1];
                    }
                }
                
                // Validate the item makes sense
                if (quantity > 0 && rate > 0 && amount > 0) {
                    items.push({
                        name: text || `Item ${items.length + 1}`,
                        quantity: quantity,
                        rate: rate,
                        lineAmount: amount
                    });
                }
            }
        }

        return items;
    }

    // Extract total amount from text
    extractTotal(lines) {
        const totalKeywords = ['total', 'grand total', 'net total', 'amount', 'net amount', 'bill amount', 'total amount', 'payable'];
        const numberPattern = /(\d+(?:,\d+)*(?:\.\d+)?)/g;
        let foundTotal = 0;

        // First, look for explicit total keywords (search from bottom up)
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].toLowerCase();

            // Check if line contains total keywords
            for (const keyword of totalKeywords) {
                if (line.includes(keyword)) {
                    const numbers = line.match(numberPattern);
                    if (numbers && numbers.length > 0) {
                        // Get the last (usually largest) number on the line
                        const amounts = numbers.map(n => parseFloat(n.replace(/,/g, '')));
                        const maxAmount = Math.max(...amounts);
                        if (maxAmount > foundTotal) {
                            foundTotal = maxAmount;
                        }
                    }
                }
            }
        }

        // If found a total with keyword, return it
        if (foundTotal > 0) {
            return foundTotal;
        }

        // Otherwise, look for the largest number in the last 20% of lines
        const startIndex = Math.floor(lines.length * 0.8);
        const allAmounts = [];
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            const amounts = line.match(numberPattern);
            if (amounts) {
                amounts.forEach(a => {
                    const num = parseFloat(a.replace(/,/g, ''));
                    if (num > 0) allAmounts.push(num);
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
        const ocrResult = await this.processImage(imageData);
        if (!ocrResult.success) {
            return { success: false, error: ocrResult.error };
        }

        const parsed = this.parseInvoice(ocrResult);
        if (!parsed) {
            return { success: false, error: 'Failed to parse invoice' };
        }

        // Validate using calculator
        const validated = window.calculator.validateTransaction(parsed);

        return {
            success: true,
            data: {
                ...parsed,
                ...validated
            }
        };
    }
}

// Create global instance
window.ocrEngine = new OCREngine();
