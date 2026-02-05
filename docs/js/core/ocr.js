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

        const lines = ocrResult.lines;
        const parsed = {
            partyName: '',
            date: '',
            items: [],
            total: 0,
            rawText: ocrResult.text,
            confidence: ocrResult.confidence
        };

        // Extract party name (usually first few lines)
        if (lines.length > 0) {
            parsed.partyName = lines[0].trim();
        }

        // Extract date (look for date patterns)
        const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
        for (const line of lines) {
            const dateMatch = line.match(datePattern);
            if (dateMatch) {
                parsed.date = this.normalizeDate(dateMatch[1]);
                break;
            }
        }

        // Extract items and amounts
        // Look for patterns like: Item Name   Qty   Rate   Amount
        const itemPattern = /(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/;
        const amountPattern = /(\d+(?:,\d+)*(?:\.\d+)?)/g;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Try to match item pattern
            const itemMatch = line.match(itemPattern);
            if (itemMatch) {
                parsed.items.push({
                    name: itemMatch[1].trim(),
                    quantity: parseFloat(itemMatch[2]),
                    rate: parseFloat(itemMatch[3]),
                    lineAmount: parseFloat(itemMatch[4])
                });
                continue;
            }

            // Look for total
            if (line.toLowerCase().includes('total')) {
                const amounts = line.match(amountPattern);
                if (amounts && amounts.length > 0) {
                    const amount = amounts[amounts.length - 1].replace(/,/g, '');
                    parsed.total = parseFloat(amount);
                }
            }
        }

        // If we couldn't parse items systematically, extract all numbers
        if (parsed.items.length === 0) {
            parsed.items = this.extractItemsHeuristic(lines);
        }

        // If total is still 0, try to find it
        if (parsed.total === 0) {
            parsed.total = this.extractTotal(lines);
        }

        return parsed;
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
    extractTotal(lines) {
        const totalKeywords = ['total', 'grand total', 'net total', 'amount'];
        const numberPattern = /(\d+(?:,\d+)*(?:\.\d+)?)/g;

        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].toLowerCase();

            // Check if line contains total keywords
            if (totalKeywords.some(keyword => line.includes(keyword))) {
                const numbers = line.match(numberPattern);
                if (numbers && numbers.length > 0) {
                    const amount = numbers[numbers.length - 1].replace(/,/g, '');
                    return parseFloat(amount);
                }
            }
        }

        // If no total found, sum all amounts found
        const allAmounts = [];
        for (const line of lines) {
            const amounts = line.match(numberPattern);
            if (amounts) {
                amounts.forEach(a => allAmounts.push(parseFloat(a.replace(/,/g, ''))));
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
