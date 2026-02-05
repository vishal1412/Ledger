// ===================================
// CALCULATION VALIDATION ENGINE
// ===================================

class CalculationValidator {
    constructor() {
        this.tolerance = 0.01; // Allow 1 cent tolerance for rounding errors
    }

    // Validate a single line item
    validateLineItem(item) {
        const { quantity, rate, lineAmount } = item;
        const calculatedAmount = this.roundToTwo(quantity * rate);
        const difference = Math.abs(calculatedAmount - lineAmount);

        return {
            isValid: difference <= this.tolerance,
            calculatedAmount,
            originalAmount: lineAmount,
            difference,
            wasAutoCorrected: difference > this.tolerance
        };
    }

    // Validate all line items
    validateLineItems(items) {
        const validatedItems = items.map(item => {
            const validation = this.validateLineItem(item);
            return {
                ...item,
                correctedAmount: validation.calculatedAmount,
                originalAmount: validation.originalAmount,
                wasAutoCorrected: validation.wasAutoCorrected,
                isValid: validation.isValid
            };
        });

        return validatedItems;
    }

    // Validate total amount
    validateTotal(items, totalAmount) {
        const calculatedTotal = this.roundToTwo(
            items.reduce((sum, item) => sum + (item.correctedAmount || item.lineAmount), 0)
        );
        const difference = Math.abs(calculatedTotal - totalAmount);

        return {
            isValid: difference <= this.tolerance,
            calculatedTotal,
            originalTotal: totalAmount,
            difference,
            wasAutoCorrected: difference > this.tolerance
        };
    }

    // Validate entire transaction
    validateTransaction(transaction) {
        // Validate line items
        const validatedItems = this.validateLineItems(transaction.items || []);

        // Validate total
        const totalValidation = this.validateTotal(validatedItems, transaction.total);

        // Count corrections
        const corrections = {
            lineItemCorrections: validatedItems.filter(item => item.wasAutoCorrected).length,
            totalCorrected: totalValidation.wasAutoCorrected,
            totalCorrections: validatedItems.filter(item => item.wasAutoCorrected).length +
                (totalValidation.wasAutoCorrected ? 1 : 0)
        };

        return {
            items: validatedItems,
            total: totalValidation.calculatedTotal,
            originalTotal: totalValidation.originalTotal,
            totalWasCorrected: totalValidation.wasAutoCorrected,
            corrections,
            isFullyValid: validatedItems.every(item => item.isValid) && totalValidation.isValid,
            validationSummary: this.generateValidationSummary(validatedItems, totalValidation)
        };
    }

    // Generate validation summary message
    generateValidationSummary(items, totalValidation) {
        const messages = [];

        const correctedItems = items.filter(item => item.wasAutoCorrected);
        if (correctedItems.length > 0) {
            messages.push(`${correctedItems.length} line item(s) corrected`);
        }

        if (totalValidation.wasAutoCorrected) {
            messages.push('Total amount corrected');
        }

        if (messages.length === 0) {
            return 'All calculations are correct';
        }

        return messages.join(', ');
    }

    // Round to two decimal places
    roundToTwo(value) {
        return Math.round(value * 100) / 100;
    }

    // Format currency
    formatCurrency(amount, currency = '₹') {
        return `${currency} ${this.roundToTwo(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    // Calculate subtotal
    calculateSubtotal(items) {
        return this.roundToTwo(
            items.reduce((sum, item) => sum + (item.correctedAmount || item.lineAmount || 0), 0)
        );
    }

    // Calculate tax (if applicable)
    calculateTax(subtotal, taxRate) {
        return this.roundToTwo(subtotal * (taxRate / 100));
    }

    // Calculate discount
    calculateDiscount(subtotal, discountAmount, discountType = 'amount') {
        if (discountType === 'percentage') {
            return this.roundToTwo(subtotal * (discountAmount / 100));
        }
        return this.roundToTwo(discountAmount);
    }

    // Calculate grand total
    calculateGrandTotal(subtotal, tax = 0, discount = 0) {
        return this.roundToTwo(subtotal + tax - discount);
    }

    // Validate bill/cash split for customer sales
    validateBillCashSplit(billAmount, cashAmount, total) {
        const sum = this.roundToTwo(billAmount + cashAmount);
        const difference = Math.abs(sum - total);

        return {
            isValid: difference <= this.tolerance,
            sum,
            total,
            difference,
            wasAutoCorrected: difference > this.tolerance
        };
    }

    // Parse amount from string (handles currency symbols and commas)
    parseAmount(amountStr) {
        if (typeof amountStr === 'number') return amountStr;

        // Remove currency symbols, commas, and spaces
        const cleaned = String(amountStr).replace(/[₹$,\s]/g, '');
        const parsed = parseFloat(cleaned);

        return isNaN(parsed) ? 0 : this.roundToTwo(parsed);
    }

    // Validate number
    isValidNumber(value) {
        const num = this.parseAmount(value);
        return !isNaN(num) && num >= 0;
    }

    // Get difference percentage
    getDifferencePercentage(original, corrected) {
        if (original === 0) return 0;
        return this.roundToTwo(((corrected - original) / original) * 100);
    }
}

// Create global instance
window.calculator = new CalculationValidator();
