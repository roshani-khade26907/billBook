import React, { useState } from 'react';
import { X, Code2, Copy, CheckCircle, Terminal, FileCode, Layers, ShieldCheck } from 'lucide-react';

interface AndroidCodeHubModalProps {
  onClose: () => void;
}

export const AndroidCodeHubModal: React.FC<AndroidCodeHubModalProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<string>('MainActivity');
  const [copied, setCopied] = useState<boolean>(false);

  const filesMap: Record<string, { path: string; language: string; content: string }> = {
    MainActivity: {
      path: 'android/app/src/main/java/com/billbook/MainActivity.kt',
      language: 'kotlin',
      content: `package com.billbook

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.*
import androidx.navigation.compose.*
import com.billbook.data.database.BillBookDatabase

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val database = BillBookDatabase.getDatabase(this)
        setContent {
            BillBookApp(database = database)
        }
    }
}`,
    },
    BillCalculator: {
      path: 'android/app/src/main/java/com/billbook/billing/BillCalculator.kt',
      language: 'kotlin',
      content: `package com.billbook.billing

import java.math.BigDecimal
import java.math.RoundingMode

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
        discountType: String,
        discountValue: BigDecimal,
        taxRate: BigDecimal,
        isTaxInclusive: Boolean = false
    ): CalculationResult {
        val subtotal = items.fold(BigDecimal.ZERO) { acc, item ->
            acc.add(calculateItemTotal(item.quantity, item.unitPrice))
        }.setScale(TWO_DECIMALS, ROUNDING_MODE)

        val safeDiscountVal = if (discountValue < BigDecimal.ZERO) BigDecimal.ZERO else discountValue
        val discountAmount = if (discountType.equals("PERCENTAGE", ignoreCase = true)) {
            val clampedPct = safeDiscountVal.min(ONE_HUNDRED)
            subtotal.multiply(clampedPct).divide(ONE_HUNDRED, TWO_DECIMALS, ROUNDING_MODE)
        } else {
            safeDiscountVal.min(subtotal).setScale(TWO_DECIMALS, ROUNDING_MODE)
        }

        val taxableAmount = subtotal.subtract(discountAmount).max(BigDecimal.ZERO)
        val taxAmount = if (taxRate > BigDecimal.ZERO) {
            if (isTaxInclusive) {
                val factor = BigDecimal.ONE.add(taxRate.divide(ONE_HUNDRED, 4, ROUNDING_MODE))
                taxableAmount.subtract(taxableAmount.divide(factor, TWO_DECIMALS, ROUNDING_MODE))
            } else {
                taxableAmount.multiply(taxRate).divide(ONE_HUNDRED, TWO_DECIMALS, ROUNDING_MODE)
            }
        } else BigDecimal.ZERO

        val finalAmount = if (isTaxInclusive) taxableAmount else taxableAmount.add(taxAmount)

        return CalculationResult(
            subtotal = subtotal,
            discountAmount = discountAmount,
            taxableAmount = taxableAmount,
            taxAmount = taxAmount,
            cgstAmount = taxAmount.divide(BigDecimal("2.00"), TWO_DECIMALS, ROUNDING_MODE),
            sgstAmount = taxAmount.subtract(taxAmount.divide(BigDecimal("2.00"), TWO_DECIMALS, ROUNDING_MODE)),
            finalAmount = finalAmount.setScale(TWO_DECIMALS, ROUNDING_MODE)
        )
    }
}`,
    },
    UpiQrGenerator: {
      path: 'android/app/src/main/java/com/billbook/payment/UpiQrGenerator.kt',
      language: 'kotlin',
      content: `package com.billbook.payment

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import java.math.BigDecimal
import java.net.URLEncoder

object UpiQrGenerator {
    fun buildUpiUri(upiId: String, shopName: String, amount: BigDecimal, billNumber: String): String {
        val formattedAmount = String.format(java.util.Locale.US, "%.2f", amount)
        return "upi://pay?pa=\${URLEncoder.encode(upiId.trim(), "UTF-8")}&pn=\${URLEncoder.encode(shopName.trim(), "UTF-8")}&am=\${URLEncoder.encode(formattedAmount, "UTF-8")}&cu=INR&tn=\${URLEncoder.encode("Bill $billNumber", "UTF-8")}"
    }

    fun generateQrBitmap(upiUri: String, size: Int = 400): Bitmap {
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
}`,
    },
    RoomEntities: {
      path: 'android/app/src/main/java/com/billbook/data/entities/Entities.kt',
      language: 'kotlin',
      content: `@Entity(tableName = "shop_profile")
data class ShopEntity(
    @PrimaryKey val id: Int = 1,
    val shopName: String,
    val ownerName: String?,
    val address: String,
    val phone: String,
    val upiId: String,
    val logoUri: String?,
    val currency: String = "INR"
)

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val price: Double,
    val category: String? = null,
    val isAvailable: Boolean = true
)

@Entity(tableName = "bills")
data class BillEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val billNumber: String,
    val timestamp: Long = System.currentTimeMillis(),
    val subtotal: Double,
    val discountAmount: Double,
    val taxAmount: Double,
    val finalAmount: Double,
    val status: String = "FINALIZED",
    val upiQrUri: String
)`,
    },
    AndroidManifest: {
      path: 'android/app/src/main/AndroidManifest.xml',
      language: 'xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:label="Bill Book"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="com.billbook.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>`,
    },
    BuildGradle: {
      path: 'android/app/build.gradle.kts',
      language: 'kotlin',
      content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.billbook"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.billbook"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
    buildFeatures { compose = true }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
    implementation("com.google.zxing:core:3.5.3")
}`,
    },
  };

  const current = filesMap[selectedFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#FCE7F0]" />
            <div>
              <h2 className="font-bold text-sm">Native Android Studio Source & APK Hub</h2>
              <p className="text-[11px] text-stone-400">
                Kotlin · Jetpack Compose · Room Database · ZXing · FileProvider
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Command line build banner */}
        <div className="bg-[#1E1E24] px-5 py-2.5 border-b border-stone-800 text-stone-300 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-emerald-300">
              ./gradlew assembleDebug
            </span>
            <span className="text-stone-400">
              (Generates <code className="text-stone-200">app-debug.apk</code> in <code className="text-stone-200">app/build/outputs/apk/debug/</code>)
            </span>
          </div>
          <span className="text-[11px] bg-stone-800 px-2.5 py-1 rounded-md text-stone-300 font-medium">
            Requires JDK 17+ & Android SDK
          </span>
        </div>

        {/* Main Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* File Selector Sidebar */}
          <div className="w-full md:w-56 bg-stone-50 border-r border-stone-200 p-3 space-y-1 overflow-y-auto shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 px-2 py-1">
              Project Files
            </p>
            {Object.keys(filesMap).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedFile(key)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                  selectedFile === key
                    ? 'bg-[#9E1B46] text-white font-semibold shadow-xs'
                    : 'text-stone-700 hover:bg-stone-200/60'
                }`}
              >
                <FileCode className="w-4 h-4 shrink-0" />
                <span className="truncate">{key}</span>
              </button>
            ))}

            <div className="pt-4 border-t border-stone-200 mt-4 px-2 space-y-2">
              <p className="text-[11px] font-bold text-stone-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Zero Cloud Reliance
              </p>
              <p className="text-[10px] text-stone-500 leading-normal">
                Entire Room schema, UPI QR generation, and receipt canvas bitmap generation work 100% offline without remote servers.
              </p>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0F172A] text-stone-100">
            <div className="px-4 py-2 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
              <span className="font-mono text-xs text-stone-300 truncate">
                {current.path}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 overflow-auto font-mono text-xs text-stone-200 leading-relaxed flex-1 select-text">
              <code>{current.content}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex justify-between items-center shrink-0">
          <p className="text-xs text-stone-500">
            Android Gradle project is fully generated inside <code className="font-mono text-stone-700">/android</code> directory.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
