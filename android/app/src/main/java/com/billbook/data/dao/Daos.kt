package com.billbook.data.dao

import androidx.room.*
import com.billbook.data.entities.BillEntity
import com.billbook.data.entities.BillItemEntity
import com.billbook.data.entities.ProductEntity
import com.billbook.data.entities.ShopEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ShopDao {
    @Query("SELECT * FROM shop_profile WHERE id = 1 LIMIT 1")
    fun getShop(): Flow<ShopEntity?>

    @Query("SELECT * FROM shop_profile WHERE id = 1 LIMIT 1")
    suspend fun getShopSync(): ShopEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateShop(shop: ShopEntity)
}

@Dao
interface ProductDao {
    @Query("SELECT * FROM products ORDER BY name ASC")
    fun getAllProducts(): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE name LIKE '%' || :query || '%' ORDER BY name ASC")
    fun searchProducts(query: String): Flow<List<ProductEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: ProductEntity): Long

    @Update
    suspend fun updateProduct(product: ProductEntity)

    @Delete
    suspend fun deleteProduct(product: ProductEntity)
}

data class BillWithItems(
    @Embedded val bill: BillEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "billId"
    )
    val items: List<BillItemEntity>
)

@Dao
interface BillDao {
    @Transaction
    @Query("SELECT * FROM bills ORDER BY timestamp DESC")
    fun getAllBillsWithItems(): Flow<List<BillWithItems>>

    @Transaction
    @Query("SELECT * FROM bills WHERE id = :billId")
    suspend fun getBillById(billId: Long): BillWithItems?

    @Query("SELECT COUNT(*) FROM bills WHERE timestamp >= :startOfDayTimestamp")
    suspend fun getBillCountSince(startOfDayTimestamp: Long): Int

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertBill(bill: BillEntity): Long

    @Insert
    suspend fun insertBillItems(items: List<BillItemEntity>)

    @Transaction
    suspend fun createBillWithItems(bill: BillEntity, items: List<BillItemEntity>): Long {
        val billId = insertBill(bill)
        val linkedItems = items.map { it.copy(billId = billId) }
        insertBillItems(linkedItems)
        return billId
    }

    @Query("UPDATE bills SET status = :status WHERE id = :billId")
    suspend fun updateStatus(billId: Long, status: String)
}
