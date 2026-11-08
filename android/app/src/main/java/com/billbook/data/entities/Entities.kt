package com.billbook.data.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.math.BigDecimal

@Entity(tableName = "shop_profile")
data class ShopEntity(
    @PrimaryKey val id: Int = 1,
    val shopName: String,
    val ownerName: String?,
    val address: String,
    val phone: String,
    val upiId: String,
    val logoUri: String?,
    val currency: String = "INR",
    val defaultTaxRate: Double = 0.0,
    val isTaxInclusive: Boolean = true
)

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val price: Double,
    val category: String? = null,
    val description: String? = null,
    val isAvailable: Boolean = true
)

@Entity(
    tableName = "bills",
    indices = [Index(value = ["billNumber"], unique = true)]
)
data class BillEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val billNumber: String,
    val timestamp: Long = System.currentTimeMillis(),
    val subtotal: Double,
    val discountType: String, // "FIXED" or "PERCENTAGE"
    val discountValue: Double,
    val discountAmount: Double,
    val taxRate: Double,
    val taxAmount: Double,
    val finalAmount: Double,
    val status: String = "FINALIZED", // "FINALIZED" or "CANCELLED"
    val upiQrUri: String,
    val customerName: String? = null,
    val customerPhone: String? = null
)

@Entity(
    tableName = "bill_items",
    foreignKeys = [
        ForeignKey(
            entity = BillEntity::class,
            parentColumns = ["id"],
            childColumns = ["billId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["billId"])]
)
data class BillItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val billId: Long,
    val productId: Long? = null,
    val productNameSnapshot: String,
    val quantity: Double,
    val unitPriceSnapshot: Double,
    val total: Double
)
