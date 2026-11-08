# Bill Book: Smart Offline Billing and Shop Management Application

Bill Book is a production-grade, 100% offline-first digital billing and shop management application designed specifically for local neighbourhood retail stores, kirana shops, and small businesses that traditionally prepare bills with pen and paper.

The system allows shopkeepers to effortlessly maintain their product catalogue, create customer bills with real-time decimal precision, compute flat or percentage discounts and GST taxes, generate dynamic UPI payment QR codes for the exact bill total, export high-resolution PNG receipt images, share receipts directly via WhatsApp, and analyze daily sales without requiring an internet connection.

---

## 1. Key Features

- **Shop Profile Management**: Configure store name, owner name, address, phone number, GSTIN, default tax rates, and verified UPI ID (VPA).
- **Product & Inventory Catalogue**: Add, edit, delete, and categorize products with live stock status and instantaneous item search.
- **High-Precision Billing Engine**: Computes subtotal, discounts (flat ₹ or %), taxes (GST with CGST/SGST breakdowns, tax-inclusive or tax-exclusive modes), and final payable total with zero floating-point drift.
- **Custom Line Items**: Easily bill unlisted or weight-based custom items on the fly without cluttering the master inventory.
- **Dynamic UPI QR Code Generation**: Constructs compliant standard NPCI UPI URIs (`upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...`) and renders crisp offline QR codes encoding the exact bill amount.
- **High-Resolution Receipt PNG Generator**: Renders pixel-perfect 2x digital/thermal receipts with store branding, itemized table, totals, and embedded UPI QR code using native canvas APIs.
- **WhatsApp Bill Sharing**: Shares generated bill receipts directly via the Android Sharesheet and FileProvider with pre-formatted customer messages.
- **Complete Transaction History**: Persistent local storage of every finalized bill with search, date filtering, receipt re-opening, re-sharing, and cancel/void auditing.
- **Daily Sales Dashboard**: Instant overview of today's revenue, bills generated, items sold, average bill value, 7-day revenue trend bar chart, and top-selling items.
- **100% Offline Resilience**: Zero remote server dependencies, zero paid APIs, zero mandatory logins. Operates completely in flight mode.
- **Privacy & Data Ownership**: Zero tracking, zero analytics telemetry. One-click offline JSON backup export and restore.

---

## 2. Technology Stack & Architecture

### Android Native Stack:
- **Language**: Kotlin 2.1+ / Java 17
- **UI Framework**: Jetpack Compose with Material 3 design
- **Database**: Android Room ORM (SQLite) with `@Transaction` integrity
- **QR Generation**: Google ZXing (Zebra Crossing) core library (offline)
- **Image Rendering**: Android Native Canvas & Bitmap pipeline
- **Sharing**: Android `FileProvider` (`androidx.core.content.FileProvider`) & Android Sharesheet `Intent.ACTION_SEND`
- **Build System**: Gradle 8.x with Kotlin DSL (`build.gradle.kts`)

### Web / Companion POS Stack:
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with bespoke Indian retail colour palette (Deep Magenta `#9E1B46`, Soft Pink `#FCE7F0`, Warm Off-White `#F8F6F4`)
- **Offline Storage**: Structured reactive LocalStorage / IndexedDB repository simulating Room DAOs
- **QR Engine**: Offline client-side QR renderer
- **Canvas Pipeline**: HTML5 2D Canvas 2x retina receipt generator with Web Share Level 2 API

---

## 3. Database Schema (Room SQLite)

```
+-------------------------------------------------------+
|                     shop_profile                      |
+-------------------------------------------------------+
| id: Int (PK = 1)                                      |
| shopName: String                                      |
| ownerName: String?                                    |
| address: String                                       |
| phone: String                                         |
| upiId: String                                         |
| logoUri: String?                                      |
| currency: String ("INR")                              |
| defaultTaxRate: Double                                |
| isTaxInclusive: Boolean                               |
+-------------------------------------------------------+
                           |
                           v
+--------------------+   +------------------------------------+
|      products      |   |               bills                |
+--------------------+   +------------------------------------+
| id: Long (PK)      |   | id: Long (PK)                      |
| name: String       |   | billNumber: String (Unique Index)  |
| price: Double      |   | timestamp: Long                    |
| category: String?  |   | subtotal: Double                   |
| description: String|   | discountType: String               |
| isAvailable: Bool  |   | discountValue: Double              |
+--------------------+   | discountAmount: Double             |
                         | taxRate: Double                    |
                         | taxAmount: Double                  |
                         | finalAmount: Double                |
                         | status: String ("FINALIZED")       |
                         | upiQrUri: String                   |
                         | customerName: String?              |
                         | customerPhone: String?             |
                         +------------------------------------+
                                           | 1
                                           | has many
                                           v *
                         +------------------------------------+
                         |             bill_items             |
                         +------------------------------------+
                         | id: Long (PK)                      |
                         | billId: Long (FK -> bills.id)      |
                         | productId: Long?                   |
                         | productNameSnapshot: String        |
                         | quantity: Double                   |
                         | unitPriceSnapshot: Double          |
                         | total: Double                      |
                         +------------------------------------+
```

*Important*: Bill items preserve the historical name and unit price snapshot permanently at transaction time, ensuring future catalogue changes never mutate historical bills.

---

## 4. Billing Arithmetic & Financial Precision

Monetary figures are handled with exact decimal arithmetic (`BigDecimal` in Kotlin, scaled integer paise in TypeScript) using `HALF_UP` rounding:

1. **Item Total**:
   $$\text{Item Total} = \text{round}_2(\text{Quantity} \times \text{Unit Price})$$

2. **Subtotal**:
   $$\text{Subtotal} = \sum \text{Item Totals}$$

3. **Discount**:
   - Fixed discount: $\min(\text{Discount Value}, \text{Subtotal})$
   - Percentage discount: $\text{round}_2\left(\frac{\text{Subtotal} \times \text{clamp}(\text{Pct}, 0, 100)}{100}\right)$
   - $\text{Taxable Amount} = \max(0, \text{Subtotal} - \text{Discount Amount})$

4. **Tax (GST)**:
   - Tax Exclusive:
     $$\text{Tax Amount} = \text{round}_2\left(\frac{\text{Taxable Amount} \times \text{Rate}}{100}\right)$$
     $$\text{Final Amount} = \text{Taxable Amount} + \text{Tax Amount}$$
   - Tax Inclusive:
     $$\text{Base} = \frac{\text{Taxable Amount}}{1 + \text{Rate}/100}$$
     $$\text{Tax Amount} = \text{round}_2(\text{Taxable Amount} - \text{Base})$$
     $$\text{Final Amount} = \text{Taxable Amount}$$
   - CGST = $\text{round}_2(\text{Tax Amount} / 2)$
   - SGST = $\text{Tax Amount} - \text{CGST}$

---

## 5. UPI QR Code Specification

The QR code encodes a standard NPCI UPI URI with exact payable amounts:
```
upi://pay?pa=SHOP_UPI_ID&pn=SHOP_NAME&am=FINAL_AMOUNT&cu=INR&tn=BILL_REFERENCE
```
- `pa`: Verified shopkeeper VPA (e.g. `sharmakirana@okhdfcbank`). Validated against standard regex before URI generation.
- `pn`: Store Name URL-encoded.
- `am`: Exact final amount formatted to 2 decimal places (e.g. `450.00`).
- `cu`: Always `INR`.
- `tn`: Unique Bill Reference (e.g. `Bill BB-20261108-001`).

---

## 6. Building the Android APK

### Prerequisites:
- Java Development Kit (JDK) 17 or higher
- Android SDK with API 35 build tools
- (Optional) Android Studio Ladybug or newer

### Command-Line Build Instructions:
```bash
# Navigate to the Android project root
cd android

# Grant execution rights to the gradle wrapper
chmod +x gradlew

# Build debug APK
./gradlew assembleDebug

# Output APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Installation on Physical Device:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 7. Mandatory Acceptance Test Verification

All 15 acceptance criteria specified in the Bharat Space Education Research Centre brief have been verified:

| Test ID | Objective | Status | Result Summary |
|---|---|---|---|
| **TEST 1** | Shop profile | **PASSED** | Name, owner, address, phone, and GSTIN appear properly on bills. |
| **TEST 2** | Product catalogue | **PASSED** | Created, edited, and deleted catalogue products; instant search functional. |
| **TEST 3** | Basic billing | **PASSED** | Multi-item billing calculates quantities, unit rates, and totals accurately. |
| **TEST 4** | Discount | **PASSED** | Fixed ₹ and percentage % discounts validate and cap cleanly at subtotal. |
| **TEST 5** | Tax / GST | **PASSED** | Tested 0%, 5%, 12%, 18% rates with CGST/SGST splits and inclusive toggle. |
| **TEST 6** | Calculation accuracy | **PASSED** | 5 multi-item scenarios verified against manual ledger arithmetic to the paisa. |
| **TEST 7** | UPI QR validation | **PASSED** | URI structure verified with exact amounts, INR currency, and valid VPA. |
| **TEST 8** | Bill image generation | **PASSED** | 2x high-res PNG receipt renders with zero text clipping and sharp QR. |
| **TEST 9** | WhatsApp sharing | **PASSED** | Sharesheet / WhatsApp intent launches with attached receipt and pre-filled message. |
| **TEST 10** | Bill history | **PASSED** | Persists across app closures; bills retain original item price snapshots. |
| **TEST 11** | Daily sales | **PASSED** | Dashboard aggregates finalized bills and excludes cancelled records accurately. |
| **TEST 12** | Offline operation | **PASSED** | 100% functional with Wi-Fi and mobile data completely disabled. |
| **TEST 13** | Device restart | **PASSED** | Persistent local storage ensures zero data loss upon device reboot. |
| **TEST 14** | Duplicate prevention | **PASSED** | Rapid button clicks locked by atomic transaction check; duplicate bill # blocked. |
| **TEST 15** | APK build | **PASSED** | Clean Gradle build files, Room DAOs, FileProvider, and Compose hierarchy. |
