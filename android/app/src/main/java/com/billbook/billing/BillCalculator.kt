package com.billbook.billing

import java.math.BigDecimal
import java.math.RoundingMode
import java.text.SimpleDateFormat
import java.util.*

data class CalculationResult(
    val subtotal: BigDecimal,
    val discountAmount: BigDecimal,
    val taxableAmount: BigDecimal,
    val taxAmount: BigDecimal,
    val cgstAmount: BigDecimal,
    val sgstAmount: BigDecimal,
    val finalAmount: BigDecimal
)

data class ItemInput(
    val quantity: BigDecimal,
    val unitPrice: BigDecimal
)

object BillCalculator {
    private val TWO_DECIMALS = 2
    private val ROUNDING_MODE = RoundingMode.HALF_UP
    private val ONE_HUNDRED = BigDecimal("100.00")

    fun calculateItemTotal(quantity: BigDecimal, unitPrice: BigDecimal): BigDecimal {
        if (quantity <= BigDecimal.ZERO || unitPrice < BigDecimal.ZERO) {
            return BigDecimal.ZERO.setScale(TWO_DECIMALS, ROUNDING_MODE)
        }
        return quantity.multiply(unitPrice).setScale(TWO_DECIMALS, ROUNDING_MODE)
    }

    fun calculate(
        items: List<ItemInput>,
        discountType: String, // "FIXED" or "PERCENTAGE"
        discountValue: BigDecimal,
        taxRate: BigDecimal,
        isTaxInclusive: Boolean = false
    ): CalculationResult {
        // 1. Subtotal
        val subtotal = items.fold(BigDecimal.ZERO) { acc, item ->
            acc.add(calculateItemTotal(item.quantity, item.unitPrice))
        }.setScale(TWO_DECIMALS, ROUNDING_MODE)

        // 2. Discount
        var safeDiscountVal = if (discountValue < BigDecimal.ZERO) BigDecimal.ZERO else discountValue
        val discountAmount = if (discountType.equals("PERCENTAGE", ignoreCase = true)) {
            val clampedPct = safeDiscountVal.min(ONE_HUNDRED)
            subtotal.multiply(clampedPct).divide(ONE_HUNDRED, TWO_DECIMALS, ROUNDING_MODE)
        } else {
            safeDiscountVal.min(subtotal).setScale(TWO_DECIMALS, ROUNDING_MODE)
        }

        // 3. Taxable Amount
        val taxableAmount = subtotal.subtract(discountAmount).max(BigDecimal.ZERO).setScale(TWO_DECIMALS, ROUNDING_MODE)

        // 4. Tax
        val safeTaxRate = taxRate.max(BigDecimal.ZERO)
        val taxAmount: BigDecimal
        val finalAmount: BigDecimal

        if (safeTaxRate > BigDecimal.ZERO && taxableAmount > BigDecimal.ZERO) {
            if (isTaxInclusive) {
                val factor = BigDecimal.ONE.add(safeTaxRate.divide(ONE_HUNDRED, 4, ROUNDING_MODE))
                val base = taxableAmount.divide(factor, TWO_DECIMALS, ROUNDING_MODE)
                taxAmount = taxableAmount.subtract(base).setScale(TWO_DECIMALS, ROUNDING_MODE)
                finalAmount = taxableAmount
            } else {
                taxAmount = taxableAmount.multiply(safeTaxRate).divide(ONE_HUNDRED, TWO_DECIMALS, ROUNDING_MODE)
                finalAmount = taxableAmount.add(taxAmount).setScale(TWO_DECIMALS, ROUNDING_MODE)
            }
        } else {
            taxAmount = BigDecimal.ZERO.setScale(TWO_DECIMALS, ROUNDING_MODE)
            finalAmount = taxableAmount
        }

        val cgst = taxAmount.divide(BigDecimal("2.00"), TWO_DECIMALS, ROUNDING_MODE)
        val sgst = taxAmount.subtract(cgst).setScale(TWO_DECIMALS, ROUNDING_MODE)

        return CalculationResult(
            subtotal = subtotal,
            discountAmount = discountAmount,
            taxableAmount = taxableAmount,
            taxAmount = taxAmount,
            cgstAmount = cgst,
            sgstAmount = sgst,
            finalAmount = finalAmount
        )
    }

    fun generateBillNumber(sequenceToday: Int): String {
        val dateFormat = SimpleDateFormat("yyyyMMdd", Locale.getDefault())
        val datePart = dateFormat.format(Date())
        return "BB-$datePart-${String.format("%03d", sequenceToday + 1)}"
    }
}
