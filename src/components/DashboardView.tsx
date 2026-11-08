import React from 'react';
import { 
  TrendingUp, 
  Receipt, 
  Package, 
  Calculator, 
  PlusCircle, 
  ArrowUpRight, 
  Clock, 
  ChevronRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { Bill, DailySalesSummary, ShopProfile } from '../types';
import { TabType } from './BottomNav';

interface DashboardViewProps {
  shop: ShopProfile;
  todaySummary: DailySalesSummary;
  recentBills: Bill[];
  salesTrend: { date: string; displayDate: string; total: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  onNavigateTab: (tab: TabType) => void;
  onSelectBill: (bill: Bill) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  shop,
  todaySummary,
  recentBills,
  salesTrend,
  topProducts,
  onNavigateTab,
  onSelectBill,
}) => {
  const maxTrendTotal = Math.max(...salesTrend.map((t) => t.total), 100);

  return (
    <div className="space-y-6 pb-24">
      {/* Welcome Card & Primary CTA */}
      <div className="bg-gradient-to-br from-[#9E1B46] to-[#781033] rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-xs font-medium">Daily Counter</p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                {shop.shopName}
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('settings')}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold backdrop-blur-xs transition-colors"
            >
              Shop Profile
            </button>
          </div>

          <p className="text-xs text-pink-200 mt-2 max-w-sm">
            Quickly bill items, calculate discounts & taxes, and generate UPI payment QR codes without an internet connection.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigateTab('new_bill')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#9E1B46] hover:bg-pink-50 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-[#9E1B46]" />
              <span>+ Create New Bill</span>
            </button>

            <button
              onClick={() => onNavigateTab('products')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-black/20 hover:bg-black/30 text-white font-medium text-xs rounded-xl transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Manage Items</span>
            </button>
          </div>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
      </div>

      {/* Today's Key Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#9E1B46]" />
            <span>Today's Sales Summary</span>
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Sales */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <p className="text-xs font-medium text-stone-500">Total Sales</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-[#9E1B46] mt-1">
              ₹{todaySummary.totalSales.toFixed(2)}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">Finalized bills</span>
          </div>

          {/* Bills Count */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <p className="text-xs font-medium text-stone-500">Bills Generated</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-stone-900 mt-1">
              {todaySummary.billCount}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Recorded offline</span>
          </div>

          {/* Items Sold */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <p className="text-xs font-medium text-stone-500">Items Sold</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-stone-900 mt-1">
              {todaySummary.itemsSold}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">Units dispatched</span>
          </div>

          {/* Average Bill Value */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <p className="text-xs font-medium text-stone-500">Average Bill</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-stone-900 mt-1">
              ₹{todaySummary.avgBillValue.toFixed(2)}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">Per customer ticket</span>
          </div>
        </div>
      </div>

      {/* 7-Day Sales Trend Bar Chart */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#9E1B46]" />
            <h4 className="font-bold text-sm text-stone-900">7-Day Sales Overview</h4>
          </div>
          <span className="text-xs text-stone-500">Daily Revenue</span>
        </div>

        <div className="h-40 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-stone-100">
          {salesTrend.map((day, idx) => {
            const heightPct = Math.max(10, Math.round((day.total / maxTrendTotal) * 100));
            const isToday = idx === salesTrend.length - 1;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] font-mono text-stone-500 group-hover:text-stone-900 transition-colors">
                  ₹{Math.round(day.total)}
                </span>
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                    isToday
                      ? 'bg-[#9E1B46]'
                      : 'bg-[#FCE7F0] group-hover:bg-[#9E1B46]/60'
                  }`}
                  title={`${day.displayDate}: ₹${day.total.toFixed(2)} (${day.count} bills)`}
                ></div>
                <span className={`text-[11px] font-medium truncate max-w-full ${isToday ? 'font-bold text-[#9E1B46]' : 'text-stone-500'}`}>
                  {day.displayDate.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
          <span>*Excludes cancelled/void transactions</span>
          <span className="font-semibold text-stone-700">All data saved locally</span>
        </div>
      </div>

      {/* Recent Transactions & Top Selling Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Bills */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3.5">
            <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-[#9E1B46]" />
              <span>Recent Bills</span>
            </h4>
            <button
              onClick={() => onNavigateTab('history')}
              className="text-xs font-semibold text-[#9E1B46] hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentBills.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs flex-1 flex flex-col items-center justify-center">
              <Receipt className="w-8 h-8 stroke-1 text-stone-300 mb-2" />
              <span>No bills generated yet today.</span>
              <button
                onClick={() => onNavigateTab('new_bill')}
                className="mt-2 text-[#9E1B46] font-semibold hover:underline"
              >
                + Create the first bill
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 flex-1">
              {recentBills.slice(0, 4).map((bill) => {
                const timeStr = new Date(bill.timestamp).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
                return (
                  <div
                    key={bill.id}
                    onClick={() => onSelectBill(bill)}
                    className="py-3 flex items-center justify-between hover:bg-stone-50 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-stone-900">
                          {bill.billNumber}
                        </span>
                        {bill.status === 'cancelled' && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-red-700 font-semibold rounded">
                            Cancelled
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {bill.items.length} items · {timeStr}
                        {bill.customerName ? ` · ${bill.customerName}` : ''}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-stone-900">
                        ₹{bill.finalAmount.toFixed(2)}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3.5">
            <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#9E1B46]" />
              <span>Top Selling Items</span>
            </h4>
            <span className="text-xs text-stone-400">By quantity</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs flex-1 flex flex-col items-center justify-center">
              <span>Generate bills to populate item sales insights.</span>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {topProducts.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-stone-800 truncate">
                      {prod.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-mono font-semibold text-stone-900">
                      {prod.quantity} sold
                    </span>
                    <span className="text-[11px] text-stone-400 ml-2 font-mono">
                      ₹{prod.revenue.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
