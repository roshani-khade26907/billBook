import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Percent, 
  Receipt, 
  QrCode, 
  Check, 
  AlertCircle, 
  Sparkles,
  ShoppingBag,
  User,
  Phone,
  ArrowRight
} from 'lucide-react';
import { Bill, BillItem, DiscountType, Product, ShopProfile } from '../types';
import { BillCalculator } from '../billing/BillCalculator';
import { UpiQrGenerator } from '../payment/UpiQrGenerator';
import { BillBookStorage } from '../data/BillBookStorage';

interface NewBillViewProps {
  shop: ShopProfile;
  products: Product[];
  onBillCreated: (bill: Bill) => void;
  onOpenUpiSimulator: (uri: string) => void;
}

export const NewBillView: React.FC<NewBillViewProps> = ({
  shop,
  products,
  onBillCreated,
  onOpenUpiSimulator,
}) => {
  // Billing form state
  const [items, setItems] = useState<BillItem[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>('fixed');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [taxRate, setTaxRate] = useState<number>(shop.taxRateDefault || 0);
  const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(shop.isTaxInclusive ?? true);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Product catalogue search & custom item
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemPrice, setCustomItemPrice] = useState<string>('');
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);

  // Validation / saving state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Real-time calculation engine
  const calculation = useMemo(() => {
    const numericDiscount = parseFloat(discountValue) || 0;
    return BillCalculator.calculate(items, discountType, numericDiscount, taxRate, isTaxInclusive);
  }, [items, discountType, discountValue, taxRate, isTaxInclusive]);

  // Real-time UPI URI generation
  const upiUriPreview = useMemo(() => {
    if (!shop.upiId || calculation.finalAmount <= 0) return null;
    try {
      return UpiQrGenerator.buildUpiUri({
        upiId: shop.upiId,
        shopName: shop.shopName,
        amount: calculation.finalAmount,
        note: 'New Bill Payment',
      });
    } catch {
      return null;
    }
  }, [shop.upiId, shop.shopName, calculation.finalAmount]);

  // Filtered catalogue products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  // Handlers for cart items
  const handleAddProduct = (prod: Product) => {
    setErrorMessage(null);
    setItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === prod.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          total: BillCalculator.calculateItemTotal(newQty, updated[existingIdx].unitPrice),
        };
        return updated;
      } else {
        const newItem: BillItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          unitPrice: prod.price,
          total: prod.price,
        };
        return [...prev, newItem];
      }
    });
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim()) {
      setErrorMessage('Please enter an item name');
      return;
    }
    const price = parseFloat(customItemPrice);
    if (isNaN(price) || price < 0) {
      setErrorMessage('Please enter a valid price (greater than or equal to 0)');
      return;
    }

    const newItem: BillItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: customItemName.trim(),
      quantity: 1,
      unitPrice: price,
      total: price,
    };

    setItems((prev) => [...prev, newItem]);
    setCustomItemName('');
    setCustomItemPrice('');
    setIsAddingCustom(false);
    setErrorMessage(null);
  };

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQty,
            total: BillCalculator.calculateItemTotal(newQty, item.unitPrice),
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Bill Finalization Handler
  const handleFinalizeBill = async () => {
    if (items.length === 0) {
      setErrorMessage('Cannot generate an empty bill. Please add at least one item.');
      return;
    }

    if (!shop.shopName.trim()) {
      setErrorMessage('Please set up your Shop Name in Settings before finalizing bills.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const todayCount = BillBookStorage.getCountOfBillsToday();
      const billNumber = BillCalculator.generateBillNumber(todayCount);

      let upiUri = '';
      if (shop.upiId && UpiQrGenerator.isValidUpiId(shop.upiId)) {
        upiUri = UpiQrGenerator.buildUpiUri({
          upiId: shop.upiId,
          shopName: shop.shopName,
          amount: calculation.finalAmount,
          billNumber,
          note: `Bill ${billNumber}`,
        });
      }

      const newBill: Bill = {
        id: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        billNumber,
        timestamp: Date.now(),
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: items.map((it) => ({ ...it })), // permanent snapshot
        subtotal: calculation.subtotal,
        discountType: calculation.discountType,
        discountValue: calculation.discountValue,
        discountAmount: calculation.discountAmount,
        taxRate: calculation.taxRate,
        taxAmount: calculation.taxAmount,
        cgstAmount: calculation.cgstAmount,
        sgstAmount: calculation.sgstAmount,
        isTaxInclusive: calculation.isTaxInclusive,
        finalAmount: calculation.finalAmount,
        roundOff: calculation.roundOff,
        status: 'finalized',
        paymentMode: 'UPI_QR',
        upiQrUri: upiUri,
        shopSnapshot: {
          shopName: shop.shopName,
          ownerName: shop.ownerName,
          address: shop.address,
          phone: shop.phone,
          upiId: shop.upiId,
          gstin: shop.gstin,
          currency: shop.currency,
        },
      };

      // Save to local storage with duplicate safety
      await BillBookStorage.saveFinalizedBill(newBill);

      // Trigger callback (which opens receipt modal)
      onBillCreated(newBill);

      // Reset form for next customer
      setItems([]);
      setDiscountValue('0');
      setCustomerName('');
      setCustomerPhone('');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to save bill locally.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-24">
      {/* Left Column: Product Selection & Cart Items (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Customer Details Accordion/Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs flex flex-wrap gap-2.5 items-center">
          <div className="flex-1 min-w-[140px] flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
            <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-hidden text-stone-800 placeholder:text-stone-400"
            />
          </div>
          <div className="flex-1 min-w-[140px] flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
            <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              type="tel"
              placeholder="Phone (for WhatsApp)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-hidden text-stone-800 placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Product Catalogue Quick Picker */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search products in catalogue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46] bg-stone-50/50"
              />
            </div>
            <button
              onClick={() => setIsAddingCustom(!isAddingCustom)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                isAddingCustom
                  ? 'bg-stone-200 text-stone-800'
                  : 'bg-[#FCE7F0] text-[#9E1B46] hover:bg-[#fad3e2]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Item</span>
            </button>
          </div>

          {/* Custom Item Form */}
          {isAddingCustom && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 mb-3 animate-fade-in">
              <p className="text-[11px] font-bold text-stone-700 mb-2">
                Add Custom Line Item (one-time purchase)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Item Name (e.g. Loose Sugar)"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price (₹)"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white font-mono"
                />
              </div>
              <div className="mt-2.5 flex justify-end gap-2">
                <button
                  onClick={() => setIsAddingCustom(false)}
                  className="px-3 py-1 text-xs text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomItem}
                  className="px-4 py-1 bg-[#9E1B46] hover:bg-[#85163a] text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  Add to Bill
                </button>
              </div>
            </div>
          )}

          {/* Quick Catalogue Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {filteredProducts.map((p) => {
              const inCart = items.find((i) => i.productId === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => handleAddProduct(p)}
                  className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                    inCart
                      ? 'border-[#9E1B46] bg-[#FCE7F0]/40 ring-1 ring-[#9E1B46]'
                      : 'border-stone-200 bg-white hover:border-[#9E1B46]/50 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-semibold text-stone-800 line-clamp-1 leading-tight">
                    {p.name}
                  </span>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-stone-900">
                      ₹{p.price.toFixed(0)}
                    </span>
                    {inCart ? (
                      <span className="w-5 h-5 rounded-full bg-[#9E1B46] text-white flex items-center justify-center font-bold text-[10px]">
                        {inCart.quantity}
                      </span>
                    ) : (
                      <span className="text-stone-400 group-hover:text-[#9E1B46]">+ Add</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Cart Items List */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#9E1B46]" />
              <h3 className="font-bold text-xs text-stone-900">Bill Items</h3>
              <span className="px-2 py-0.2 bg-stone-200 text-stone-700 text-[10px] font-bold rounded-full">
                {items.length}
              </span>
            </div>
            {items.length > 0 && (
              <button
                onClick={() => setItems([])}
                className="text-[11px] font-medium text-red-600 hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">
              <p>No items added to this bill yet.</p>
              <p className="text-[11px] text-stone-400 mt-1">
                Select items from the catalogue above or add a custom item.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-stone-900 truncate">{item.name}</p>
                    <p className="text-[11px] font-mono text-stone-500 mt-0.5">
                      ₹{item.unitPrice.toFixed(2)} each
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs text-stone-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Item total & delete */}
                  <div className="text-right shrink-0 w-20">
                    <p className="font-mono font-bold text-xs text-stone-900">
                      ₹{item.total.toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-stone-400 hover:text-red-600 p-0.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Billing Calculations, Discount, Tax, UPI QR & Save (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 sticky top-20">
          <h3 className="font-bold text-sm text-stone-900 flex items-center justify-between border-b border-stone-100 pb-3">
            <span>Payment Summary</span>
            <span className="text-xs font-mono text-stone-500 font-normal">
              Subtotal: ₹{calculation.subtotal.toFixed(2)}
            </span>
          </h3>

          {/* Discount Section */}
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <span className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-[#9E1B46]" />
                Discount
              </span>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    discountType === 'fixed'
                      ? 'bg-[#9E1B46] text-white'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  ₹ Flat
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    discountType === 'percentage'
                      ? 'bg-[#9E1B46] text-white'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  % Pct
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="any"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 font-mono bg-white"
              />
              <span className="text-xs font-mono font-medium text-emerald-700 shrink-0">
                -₹{calculation.discountAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Tax / GST Section */}
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <span>Tax / GST</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-normal text-stone-600">
                <input
                  type="checkbox"
                  checked={isTaxInclusive}
                  onChange={(e) => setIsTaxInclusive(e.target.checked)}
                  className="rounded text-[#9E1B46] focus:ring-[#9E1B46]"
                />
                <span>Tax Inclusive</span>
              </label>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[0, 5, 12, 18].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setTaxRate(rate)}
                  className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                    taxRate === rate
                      ? 'border-[#9E1B46] bg-[#9E1B46] text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {rate === 0 ? '0% (Exempt)' : `${rate}%`}
                </button>
              ))}
            </div>

            {taxRate > 0 && (
              <div className="pt-2 border-t border-stone-200/60 flex justify-between text-[11px] text-stone-500 font-mono">
                <span>CGST ({(taxRate / 2).toFixed(1)}%): ₹{calculation.cgstAmount.toFixed(2)}</span>
                <span>SGST ({(taxRate / 2).toFixed(1)}%): ₹{calculation.sgstAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Final Amount & UPI QR live indicator */}
          <div className="p-4 rounded-xl bg-[#FCE7F0] border border-[#9E1B46]/30">
            <div className="flex justify-between items-center text-[#9E1B46]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Final Payable</p>
                <p className="text-[11px] text-stone-600 font-medium">Exact Amount for UPI QR</p>
              </div>
              <p className="font-mono font-black text-2xl">
                ₹{calculation.finalAmount.toFixed(2)}
              </p>
            </div>

            {shop.upiId ? (
              <div className="mt-3 pt-2.5 border-t border-[#9E1B46]/20 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-stone-700 font-medium">
                  <QrCode className="w-3.5 h-3.5 text-[#9E1B46]" />
                  <span>UPI ID: {shop.upiId}</span>
                </span>
                {upiUriPreview && (
                  <button
                    type="button"
                    onClick={() => onOpenUpiSimulator(upiUriPreview)}
                    className="font-semibold text-[#9E1B46] hover:underline"
                  >
                    Test QR URI
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-amber-800 font-medium">
                ⚠️ Shop UPI ID not configured. Bills will be generated without QR code.
              </p>
            )}
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Finalize Button */}
          <button
            onClick={handleFinalizeBill}
            disabled={isSubmitting || items.length === 0}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 ${
              isSubmitting || items.length === 0
                ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                : 'bg-[#9E1B46] hover:bg-[#85163a]'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>
              {isSubmitting ? 'Saving Bill Locally...' : `Finalize & Generate Receipt (₹${calculation.finalAmount.toFixed(2)})`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
