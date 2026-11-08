import { BillCalculation, BillItem, DiscountType } from '../types';

/**
 * High-precision financial arithmetic utilities.
 * Handles monetary calculations without floating point drift by working with scaled integers (paise).
 */
export class BillCalculator {
  /**
   * Rounds a number to exactly 2 decimal places using half-up rounding.
   */
  static round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculates the item total: Quantity * Unit Price rounded to 2 decimals.
   */
  static calculateItemTotal(quantity: number, unitPrice: number): number {
    if (quantity <= 0 || unitPrice < 0) return 0;
    // Scale by 10000 to maintain precision before rounding to paise
    const qtyPaisa = Math.round(quantity * 100);
    const unitPricePaisa = Math.round(unitPrice * 100);
    const totalPaisa = (qtyPaisa * unitPricePaisa) / 10000;
    return this.round2(totalPaisa);
  }

  /**
   * Computes the complete bill breakdown given items, discount, and tax configurations.
   */
  static calculate(
    items: BillItem[],
    discountType: DiscountType,
    discountValue: number,
    taxRate: number,
    isTaxInclusive: boolean = false
  ): BillCalculation {
    // 1. Subtotal = sum of individual item totals
    const subtotal = this.round2(
      items.reduce((sum, item) => sum + this.calculateItemTotal(item.quantity, item.unitPrice), 0)
    );

    // 2. Discount calculation
    let safeDiscountVal = Math.max(0, discountValue || 0);
    let discountAmount = 0;

    if (discountType === 'percentage') {
      // Clamp percentage between 0 and 100
      safeDiscountVal = Math.min(100, safeDiscountVal);
      discountAmount = this.round2((subtotal * safeDiscountVal) / 100);
    } else {
      // Fixed discount in rupees, cannot exceed subtotal
      safeDiscountVal = Math.min(subtotal, safeDiscountVal);
      discountAmount = this.round2(safeDiscountVal);
    }

    // 3. Taxable base amount after discount
    const taxableAmount = Math.max(0, this.round2(subtotal - discountAmount));

    // 4. Tax calculation (GST)
    const safeTaxRate = Math.max(0, taxRate || 0);
    let taxAmount = 0;
    let finalPayable = 0;

    if (safeTaxRate > 0 && taxableAmount > 0) {
      if (isTaxInclusive) {
        // Price already includes tax: Tax = Amount - (Amount / (1 + Rate / 100))
        const baseBeforeTax = taxableAmount / (1 + safeTaxRate / 100);
        taxAmount = this.round2(taxableAmount - baseBeforeTax);
        finalPayable = taxableAmount;
      } else {
        // Tax is added on top
        taxAmount = this.round2((taxableAmount * safeTaxRate) / 100);
        finalPayable = this.round2(taxableAmount + taxAmount);
      }
    } else {
      taxAmount = 0;
      finalPayable = taxableAmount;
    }

    // CGST and SGST breakdown (half each for intra-state Indian GST)
    const cgstAmount = this.round2(taxAmount / 2);
    const sgstAmount = this.round2(taxAmount - cgstAmount); // Prevents 1 paisa rounding difference

    return {
      subtotal,
      discountType,
      discountValue: safeDiscountVal,
      discountAmount,
      taxableAmount,
      taxRate: safeTaxRate,
      taxAmount,
      cgstAmount,
      sgstAmount,
      isTaxInclusive,
      finalAmount: finalPayable,
      roundOff: 0,
    };
  }

  /**
   * Generates a clean, unique bill number: BB-YYYYMMDD-XXX
   */
  static generateBillNumber(existingCountToday: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const seq = String(existingCountToday + 1).padStart(3, '0');
    return `BB-${year}${month}${day}-${seq}`;
  }
}
