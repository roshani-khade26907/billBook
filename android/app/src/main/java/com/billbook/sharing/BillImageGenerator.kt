package com.billbook.sharing

import android.content.Context
import android.content.Intent
import android.graphics.*
import androidx.core.content.FileProvider
import com.billbook.data.dao.BillWithItems
import com.billbook.data.entities.ShopEntity
import com.billbook.payment.UpiQrGenerator
import java.io.File
import java.io.FileOutputStream
import java.math.BigDecimal
import java.text.SimpleDateFormat
import java.util.*

object BillImageGenerator {

    fun generateReceiptBitmap(
        context: Context,
        billWithItems: BillWithItems,
        shop: ShopEntity
    ): Bitmap {
        val width = 720
        val itemsCount = billWithItems.items.size
        val height = 900 + (itemsCount * 50) + if (shop.upiId.isNotBlank()) 450 else 100

        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)

        val paint = Paint().apply {
            isAntiAlias = true
            color = Color.parseColor("#1E1E24")
        }

        // Top Header Accent Bar
        val barPaint = Paint().apply { color = Color.parseColor("#9E1B46") }
        canvas.drawRect(0f, 0f, width.toFloat(), 16f, barPaint)

        var y = 60f

        // Shop Name
        paint.textSize = 34f
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText(shop.shopName, (width / 2).toFloat(), y, paint)

        // Shop Details
        paint.textSize = 20f
        paint.typeface = Typeface.DEFAULT
        paint.color = Color.parseColor("#4B5563")

        shop.ownerName?.let {
            y += 32f
            canvas.drawText("Prop: $it", (width / 2).toFloat(), y, paint)
        }

        y += 30f
        canvas.drawText(shop.address, (width / 2).toFloat(), y, paint)
        y += 28f
        canvas.drawText("Ph: ${shop.phone}", (width / 2).toFloat(), y, paint)

        // Divider
        y += 25f
        val linePaint = Paint().apply {
            color = Color.parseColor("#D1D5DB")
            strokeWidth = 2f
            pathEffect = DashPathEffect(floatArrayOf(10f, 10f), 0f)
        }
        canvas.drawLine(40f, y, (width - 40).toFloat(), y, linePaint)

        // Bill Meta
        y += 40f
        paint.textAlign = Paint.Align.LEFT
        paint.textSize = 22f
        paint.typeface = Typeface.MONOSPACE
        paint.color = Color.parseColor("#1E1E24")
        canvas.drawText("Bill: ${billWithItems.bill.billNumber}", 40f, y, paint)

        paint.textAlign = Paint.Align.RIGHT
        paint.typeface = Typeface.DEFAULT
        val sdf = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault())
        canvas.drawText(sdf.format(Date(billWithItems.bill.timestamp)), (width - 40).toFloat(), y, paint)

        // Items Header
        y += 45f
        paint.textAlign = Paint.Align.LEFT
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textSize = 20f
        canvas.drawText("ITEM", 40f, y, paint)
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("QTY", 420f, y, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("TOTAL", (width - 40).toFloat(), y, paint)

        // Items list
        paint.typeface = Typeface.DEFAULT
        for (item in billWithItems.items) {
            y += 44f
            paint.textAlign = Paint.Align.LEFT
            val itemName = if (item.productNameSnapshot.length > 25) item.productNameSnapshot.take(22) + "..." else item.productNameSnapshot
            canvas.drawText(itemName, 40f, y, paint)

            paint.textAlign = Paint.Align.CENTER
            canvas.drawText("${item.quantity.toInt()}", 420f, y, paint)

            paint.textAlign = Paint.Align.RIGHT
            canvas.drawText(String.format("₹%.2f", item.total), (width - 40).toFloat(), y, paint)
        }

        // Subtotal & Final Total
        y += 40f
        canvas.drawLine(40f, y, (width - 40).toFloat(), y, linePaint)

        y += 40f
        paint.textAlign = Paint.Align.LEFT
        canvas.drawText("Subtotal", 40f, y, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText(String.format("₹%.2f", billWithItems.bill.subtotal), (width - 40).toFloat(), y, paint)

        if (billWithItems.bill.discountAmount > 0) {
            y += 34f
            paint.textAlign = Paint.Align.LEFT
            canvas.drawText("Discount", 40f, y, paint)
            paint.textAlign = Paint.Align.RIGHT
            canvas.drawText(String.format("- ₹%.2f", billWithItems.bill.discountAmount), (width - 40).toFloat(), paint)
        }

        // Total Box
        y += 30f
        val boxPaint = Paint().apply { color = Color.parseColor("#FCE7F0") }
        canvas.drawRect(40f, y, (width - 40).toFloat(), y + 80f, boxPaint)

        paint.textAlign = Paint.Align.LEFT
        paint.color = Color.parseColor("#9E1B46")
        paint.textSize = 26f
        paint.typeface = Typeface.DEFAULT_BOLD
        canvas.drawText("FINAL AMOUNT", 60f, y + 50f, paint)

        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText(String.format("₹%.2f", billWithItems.bill.finalAmount), (width - 60).toFloat(), y + 50f, paint)

        // QR Code
        if (shop.upiId.isNotBlank()) {
            y += 120f
            val qrBitmap = UpiQrGenerator.generateQrBitmap(billWithItems.bill.upiQrUri, 280)
            canvas.drawBitmap(qrBitmap, ((width - 280) / 2).toFloat(), y, null)

            y += 320f
            paint.textAlign = Paint.Align.CENTER
            paint.textSize = 20f
            paint.color = Color.parseColor("#4B5563")
            paint.typeface = Typeface.DEFAULT_BOLD
            canvas.drawText("Scan & Pay via any UPI App (GPay, PhonePe, Paytm)", (width / 2).toFloat(), y, paint)
            y += 26f
            paint.typeface = Typeface.MONOSPACE
            paint.textSize = 18f
            canvas.drawText("UPI ID: ${shop.upiId}", (width / 2).toFloat(), y, paint)
        }

        // Footer
        y += 50f
        paint.textAlign = Paint.Align.CENTER
        paint.textSize = 22f
        paint.color = Color.parseColor("#1E1E24")
        paint.typeface = Typeface.DEFAULT_BOLD
        canvas.drawText("Thank you for shopping with us!", (width / 2).toFloat(), y, paint)

        return bitmap
    }

    fun shareBillViaSharesheet(
        context: Context,
        billWithItems: BillWithItems,
        shop: ShopEntity
    ) {
        val bitmap = generateReceiptBitmap(context, billWithItems, shop)
        val cachePath = File(context.cacheDir, "bills")
        cachePath.mkdirs()
        val file = File(cachePath, "${billWithItems.bill.billNumber}.png")
        val fileOutputStream = FileOutputStream(file)
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, fileOutputStream)
        fileOutputStream.close()

        val contentUri = FileProvider.getUriForFile(
            context,
            "com.billbook.fileprovider",
            file
        )

        val message = "Thank you for shopping with ${shop.shopName}. Your bill total is ₹${String.format("%.2f", billWithItems.bill.finalAmount)}. Please find your bill attached."

        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "image/png"
            putExtra(Intent.EXTRA_STREAM, contentUri)
            putExtra(Intent.EXTRA_TEXT, message)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        context.startActivity(Intent.createChooser(shareIntent, "Share Bill Receipt"))
    }
}
