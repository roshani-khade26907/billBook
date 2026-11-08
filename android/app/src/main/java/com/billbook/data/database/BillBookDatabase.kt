package com.billbook.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.billbook.data.dao.BillDao
import com.billbook.data.dao.ProductDao
import com.billbook.data.dao.ShopDao
import com.billbook.data.entities.BillEntity
import com.billbook.data.entities.BillItemEntity
import com.billbook.data.entities.ProductEntity
import com.billbook.data.entities.ShopEntity

@Database(
    entities = [
        ShopEntity::class,
        ProductEntity::class,
        BillEntity::class,
        BillItemEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class BillBookDatabase : RoomDatabase() {
    abstract fun shopDao(): ShopDao
    abstract fun productDao(): ProductDao
    abstract fun billDao(): BillDao

    companion object {
        @Volatile
        private var INSTANCE: BillBookDatabase? = null

        fun getDatabase(context: Context): BillBookDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    BillBookDatabase::class.java,
                    "billbook_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
