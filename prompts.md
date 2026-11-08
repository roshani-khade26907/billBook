# Bill Book: AI Engineering & Development Prompts Log

This document preserves the developmental specifications and system prompts utilized to architect, construct, and verify the **Bill Book: Smart Offline Billing and Shop Management Application**.

---

## 1. Master Architectural Prompt

```text
Act as a senior Android developer, Kotlin engineer, database architect, UI/UX designer, and software testing specialist.
Your task is to design, develop, and deliver a complete, fully functional native Android application named Bill Book.
The application is intended for small neighbourhood shops and local businesses that currently prepare bills manually.
Build an easy-to-use billing application that allows shopkeepers to manage products, generate accurate bills, calculate discounts and taxes, generate UPI payment QR codes, share bills through WhatsApp, and monitor daily sales.
Every feature must work correctly, including when the phone has no internet connection.
```

---

## 2. Core Architectural Sub-Prompts

### Prompt A: Precise Monetary Calculation Engine
```text
Implement a reliable calculation engine.
Use precise decimal arithmetic (BigDecimal in Kotlin, scaled integer paise in TypeScript) for monetary calculations.
Do not use raw floating-point arithmetic for financial totals.
Requirements:
1. Item Total = Quantity * Unit Price rounded to 2 decimal places.
2. Subtotal = Sum of all item totals.
3. Discount: Support fixed discount in rupees and percentage discount. Validate discounts so they cannot exceed the eligible subtotal.
4. Tax: Configurable tax rates (0%, 5%, 12%, 18%). Support both tax-inclusive and tax-exclusive pricing. Provide CGST and SGST equal breakdowns.
5. Final Amount = Subtotal - Discount + Tax (if exclusive).
```

### Prompt B: Offline UPI Payment QR Specification
```text
Generate a UPI QR code corresponding to the exact final bill amount.
Use standard UPI payment URI containing the shopkeeper's actual UPI ID and the bill amount:
upi://pay?pa=SHOP_UPI_ID&pn=SHOP_NAME&am=FINAL_AMOUNT&cu=INR&tn=BILL_REFERENCE
Payment Safety Rules:
- Do not invent or hardcode a UPI ID. Validate format before generating.
- Do not claim a payment has been completed merely because a QR code was generated.
- Do not store payment credentials or UPI PINs.
- Do not attempt to automate payment.
- Work 100% offline without internet.
```

### Prompt C: Offline Receipt Image Generation & WhatsApp Sharesheet
```text
Generate an individual bill as a high-quality PNG digital receipt.
Include shop name, owner name, address, phone number, GSTIN, unique bill number, formatted date/time, customer details, itemized table, subtotal, discount, CGST/SGST tax breakdown, final payable amount, embedded UPI QR code, and thank-you message.
Integrate with Android FileProvider (androidx.core.content.FileProvider) and Android Sharesheet (Intent.ACTION_SEND) to allow the shopkeeper to share the bill image directly to customer WhatsApp conversations with prefilled message.
```

### Prompt D: Room Database & Historical Snapshot Preservation
```text
Implement Room Database entities:
- ShopEntity (shop profile, UPI ID, address, phone)
- ProductEntity (catalogue items, prices, categories, availability)
- BillEntity (unique bill number, timestamp, subtotal, discount, tax, final total, status)
- BillItemEntity (bill foreign key, product snapshot name, quantity, unit price snapshot, total)
Critical rule: A previously generated bill must preserve the product name and price used at the time of purchase, even if the product catalogue is edited or deleted later.
```

### Prompt E: Daily Sales Analytics & Duplicate Prevention
```text
Calculate daily sales summaries exclusively from finalized bills. Exclude draft and cancelled/void bills.
Provide today's sales total, bills count, items sold, and average bill value.
Provide a 7-day revenue trend bar chart and top-selling product ranking.
Protect against accidental duplicate bills when the user taps Save repeatedly through transaction locking.
```
