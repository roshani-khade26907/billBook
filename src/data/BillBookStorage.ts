import { Bill, Product, ShopProfile, DailySalesSummary } from '../types';

const STORAGE_KEYS = {
  SHOP: 'billbook_shop_profile',
  PRODUCTS: 'billbook_products',
  BILLS: 'billbook_bills',
  SETTINGS: 'billbook_settings',
};

const DEFAULT_SHOP: ShopProfile = {
  shopName: 'Sharma Kirana & General Store',
  ownerName: 'Rajesh Sharma',
  address: 'Shop No. 4, Main Market, Station Road, Jaipur',
  phone: '9876543210',
  upiId: 'sharmakirana@okhdfcbank',
  gstin: '08AAAAA0000A1Z5',
  currency: 'INR (₹)',
  taxRateDefault: 0,
  isTaxInclusive: true,
  thankYouMessage: 'Thank you for shopping with us! Please visit again.',
};

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'prod_1', name: 'Aashirvaad Shudh Chakki Atta 5kg', price: 245.0, category: 'Groceries', isAvailable: true, createdAt: Date.now() - 100000 },
  { id: 'prod_2', name: 'Amul Butter 500g', price: 275.0, category: 'Dairy', isAvailable: true, createdAt: Date.now() - 90000 },
  { id: 'prod_3', name: 'Tata Salt Vaccum Evaporated 1kg', price: 28.0, category: 'Groceries', isAvailable: true, createdAt: Date.now() - 80000 },
  { id: 'prod_4', name: 'Fortune Sunlite Sunflower Oil 1L', price: 165.0, category: 'Oils', isAvailable: true, createdAt: Date.now() - 70000 },
  { id: 'prod_5', name: 'Maggi 2-Minute Masala Noodles 70g', price: 14.0, category: 'Snacks', isAvailable: true, createdAt: Date.now() - 60000 },
  { id: 'prod_6', name: 'Parle-G Gold Biscuits 250g', price: 30.0, category: 'Bakery', isAvailable: true, createdAt: Date.now() - 50000 },
  { id: 'prod_7', name: 'Tata Tea Premium Desh Ki Chai 500g', price: 310.0, category: 'Beverages', isAvailable: true, createdAt: Date.now() - 40000 },
  { id: 'prod_8', name: 'Madhur Pure & Hygienic Sugar 1kg', price: 48.0, category: 'Groceries', isAvailable: true, createdAt: Date.now() - 30000 },
  { id: 'prod_9', name: 'Dettol Original Soap 125g (Pack of 3)', price: 135.0, category: 'Personal Care', isAvailable: true, createdAt: Date.now() - 20000 },
  { id: 'prod_10', name: 'Toor Dal Premium Desi 1kg', price: 180.0, category: 'Pulses', isAvailable: true, createdAt: Date.now() - 10000 },
];

export class BillBookStorage {
  private static isSavingBill = false;

  // --- SHOP PROFILE ---
  static getShopProfile(): ShopProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHOP);
      if (!data) {
        this.saveShopProfile(DEFAULT_SHOP);
        return DEFAULT_SHOP;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_SHOP;
    }
  }

  static saveShopProfile(profile: ShopProfile): void {
    localStorage.setItem(STORAGE_KEYS.SHOP, JSON.stringify(profile));
  }

  // --- PRODUCTS ---
  static getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        this.saveProducts(DEFAULT_PRODUCTS);
        return DEFAULT_PRODUCTS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  }

  static saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  static addProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    products.unshift(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  static updateProduct(product: Product): void {
    const products = this.getProducts().map((p) => (p.id === product.id ? product : p));
    this.saveProducts(products);
  }

  static deleteProduct(productId: string): void {
    const products = this.getProducts().filter((p) => p.id !== productId);
    this.saveProducts(products);
  }

  // --- BILLS ---
  static getBills(): Bill[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BILLS);
      if (!data) {
        // Seed 2 sample initial bills for instant realistic visualization
        const seedBills = this.getSeedBills();
        this.saveBills(seedBills);
        return seedBills;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static saveBills(bills: Bill[]): void {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }

  /**
   * Saves a finalized bill with atomic concurrency check to prevent duplicate clicks.
   */
  static async saveFinalizedBill(bill: Bill): Promise<Bill> {
    if (this.isSavingBill) {
      throw new Error('A bill transaction is already in progress. Please wait.');
    }

    this.isSavingBill = true;
    try {
      // Simulate database transaction latency
      await new Promise((resolve) => setTimeout(resolve, 80));

      const bills = this.getBills();
      // Guard against identical bill number duplication
      if (bills.some((b) => b.billNumber === bill.billNumber)) {
        throw new Error(`Bill ${bill.billNumber} already exists in the local database.`);
      }

      bills.unshift(bill);
      this.saveBills(bills);
      return bill;
    } finally {
      this.isSavingBill = false;
    }
  }

  static updateBillStatus(billId: string, status: 'finalized' | 'cancelled'): void {
    const bills = this.getBills().map((b) => (b.id === billId ? { ...b, status } : b));
    this.saveBills(bills);
  }

  static getBillById(billId: string): Bill | undefined {
    return this.getBills().find((b) => b.id === billId);
  }

  static getCountOfBillsToday(): number {
    const today = new Date().toDateString();
    return this.getBills().filter((b) => new Date(b.timestamp).toDateString() === today).length;
  }

  // --- DAILY SALES ANALYTICS ---
  static getDailySalesSummary(dateStr?: string): DailySalesSummary {
    const targetDate = dateStr ? new Date(dateStr).toDateString() : new Date().toDateString();
    const finalizedBills = this.getBills().filter(
      (b) => b.status === 'finalized' && new Date(b.timestamp).toDateString() === targetDate
    );

    const totalSales = finalizedBills.reduce((sum, b) => sum + b.finalAmount, 0);
    const billCount = finalizedBills.length;
    const itemsSold = finalizedBills.reduce(
      (sum, b) => sum + b.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
    const avgBillValue = billCount > 0 ? totalSales / billCount : 0;

    return {
      date: targetDate,
      totalSales: Math.round(totalSales * 100) / 100,
      billCount,
      itemsSold,
      avgBillValue: Math.round(avgBillValue * 100) / 100,
    };
  }

  static getRecentSalesTrend(days = 7): { date: string; displayDate: string; total: number; count: number }[] {
    const bills = this.getBills().filter((b) => b.status === 'finalized');
    const result: { date: string; displayDate: string; total: number; count: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const displayDate = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

      const dayBills = bills.filter((b) => new Date(b.timestamp).toDateString() === dateStr);
      const total = dayBills.reduce((sum, b) => sum + b.finalAmount, 0);

      result.push({
        date: dateStr,
        displayDate,
        total: Math.round(total * 100) / 100,
        count: dayBills.length,
      });
    }

    return result;
  }

  static getTopSellingProducts(limit = 5): { name: string; quantity: number; revenue: number }[] {
    const bills = this.getBills().filter((b) => b.status === 'finalized');
    const productStats: Record<string, { quantity: number; revenue: number }> = {};

    bills.forEach((b) => {
      b.items.forEach((item) => {
        if (!productStats[item.name]) {
          productStats[item.name] = { quantity: 0, revenue: 0 };
        }
        productStats[item.name].quantity += item.quantity;
        productStats[item.name].revenue += item.total;
      });
    });

    return Object.entries(productStats)
      .map(([name, stat]) => ({
        name,
        quantity: stat.quantity,
        revenue: Math.round(stat.revenue * 100) / 100,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  // --- SEED BILLS ---
  private static getSeedBills(): Bill[] {
    const now = Date.now();
    const shop = DEFAULT_SHOP;

    return [
      {
        id: 'bill_seed_1',
        billNumber: 'BB-20261108-001',
        timestamp: now - 3600000 * 2,
        customerName: 'Anil Verma',
        customerPhone: '9829012345',
        items: [
          { id: 'item_1', name: 'Aashirvaad Shudh Chakki Atta 5kg', quantity: 1, unitPrice: 245, total: 245 },
          { id: 'item_2', name: 'Tata Salt Vaccum Evaporated 1kg', quantity: 2, unitPrice: 28, total: 56 },
          { id: 'item_3', name: 'Fortune Sunlite Sunflower Oil 1L', quantity: 1, unitPrice: 165, total: 165 },
        ],
        subtotal: 466,
        discountType: 'fixed',
        discountValue: 16,
        discountAmount: 16,
        taxRate: 0,
        taxAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        isTaxInclusive: true,
        finalAmount: 450,
        roundOff: 0,
        status: 'finalized',
        paymentMode: 'UPI_QR',
        upiQrUri: `upi://pay?pa=${encodeURIComponent(shop.upiId)}&pn=${encodeURIComponent(shop.shopName)}&am=450.00&cu=INR&tn=Bill%20BB-20261108-001`,
        shopSnapshot: {
          shopName: shop.shopName,
          ownerName: shop.ownerName,
          address: shop.address,
          phone: shop.phone,
          upiId: shop.upiId,
          gstin: shop.gstin,
          currency: shop.currency,
        },
      },
      {
        id: 'bill_seed_2',
        billNumber: 'BB-20261108-002',
        timestamp: now - 3600000 * 4,
        customerName: 'Priya Mehta',
        customerPhone: '9414098765',
        items: [
          { id: 'item_4', name: 'Amul Butter 500g', quantity: 1, unitPrice: 275, total: 275 },
          { id: 'item_5', name: 'Maggi 2-Minute Masala Noodles 70g', quantity: 4, unitPrice: 14, total: 56 },
          { id: 'item_6', name: 'Parle-G Gold Biscuits 250g', quantity: 2, unitPrice: 30, total: 60 },
        ],
        subtotal: 391,
        discountType: 'percentage',
        discountValue: 5,
        discountAmount: 19.55,
        taxRate: 5,
        taxAmount: 17.69,
        cgstAmount: 8.84,
        sgstAmount: 8.85,
        isTaxInclusive: false,
        finalAmount: 389.14,
        roundOff: 0,
        status: 'finalized',
        paymentMode: 'UPI_QR',
        upiQrUri: `upi://pay?pa=${encodeURIComponent(shop.upiId)}&pn=${encodeURIComponent(shop.shopName)}&am=389.14&cu=INR&tn=Bill%20BB-20261108-002`,
        shopSnapshot: {
          shopName: shop.shopName,
          ownerName: shop.ownerName,
          address: shop.address,
          phone: shop.phone,
          upiId: shop.upiId,
          gstin: shop.gstin,
          currency: shop.currency,
        },
      },
    ];
  }

  // --- DATA MANAGEMENT ---
  static exportData(): string {
    const data = {
      shop: this.getShopProfile(),
      products: this.getProducts(),
      bills: this.getBills(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(data, null, 2);
  }

  static importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.shop) this.saveShopProfile(data.shop);
      if (data.products && Array.isArray(data.products)) this.saveProducts(data.products);
      if (data.bills && Array.isArray(data.bills)) this.saveBills(data.bills);
      return true;
    } catch (e) {
      console.error('Failed to import backup data:', e);
      return false;
    }
  }

  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.SHOP);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.BILLS);
  }
}
