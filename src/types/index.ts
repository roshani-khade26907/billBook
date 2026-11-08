export interface ShopProfile {
  shopName: string;
  ownerName: string;
  address: string;
  phone: string;
  upiId: string;
  gstin?: string;
  currency: string;
  logoUrl?: string;
  taxRateDefault: number;
  isTaxInclusive: boolean;
  thankYouMessage: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  description?: string;
  createdAt: number;
}

export interface BillItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type DiscountType = 'fixed' | 'percentage';

export interface BillCalculation {
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  isTaxInclusive: boolean;
  finalAmount: number;
  roundOff: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  timestamp: number;
  customerName?: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  isTaxInclusive: boolean;
  finalAmount: number;
  roundOff: number;
  status: 'finalized' | 'cancelled';
  paymentMode: 'UPI_QR' | 'CASH' | 'OTHER';
  upiQrUri: string;
  shopSnapshot: {
    shopName: string;
    ownerName: string;
    address: string;
    phone: string;
    upiId: string;
    gstin?: string;
    currency: string;
  };
}

export interface DailySalesSummary {
  date: string;
  totalSales: number;
  billCount: number;
  itemsSold: number;
  avgBillValue: number;
}
