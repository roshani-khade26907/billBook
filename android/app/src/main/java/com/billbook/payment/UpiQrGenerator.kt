package com.billbook.payment

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import java.math.BigDecimal
import java.net.URLEncoder

object UpiQrGenerator {

    fun isValidUpiId(upiId: String): Boolean {
        if (upiId.isBlank()) return false
        val regex = "^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$".toRegex()
        return regex.matches(upiId.trim())
    }

    fun buildUpiUri(
        upiId: String,
        shopName: String,
        amount: BigDecimal,
        billNumber: String
    ): String {
        require(isValidUpiId(upiId)) { "Invalid UPI ID format. Expected user@bankhandle" }
        require(amount > BigDecimal.ZERO) { "Amount must be strictly positive" }

        val formattedAmount = String.format(java.util.Locale.US, "%.2f", amount)
        val note = "Bill $billNumber"

        return buildString {
            append("upi://pay?")
            append("pa=").append(URLEncoder.encode(upiId.trim(), "UTF-8"))
            append("&pn=").append(URLEncoder.encode(shopName.trim(), "UTF-8"))
            append("&am=").append(URLEncoder.encode(formattedAmount, "UTF-8"))
            append("&cu=INR")
            append("&tn=").append(URLEncoder.encode(note, "UTF-8"))
        }
    }

    fun generateQrBitmap(
        upiUri: String,
        size: Int = 400
    ): Bitmap {
        val writer = QRCodeWriter()
        val bitMatrix = writer.encode(upiUri, BarcodeFormat.QR_CODE, size, size)
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565)
        for (x in 0 until size) {
            for (y in 0 until size) {
                bitmap.setPixel(x, y, if (bitMatrix[x, y]) Color.BLACK else Color.WHITE)
            }
        }
        return bitmap
    }
}
