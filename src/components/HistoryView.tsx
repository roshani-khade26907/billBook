import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Calendar, 
  Eye, 
  Share2, 
  Ban, 
  Clock, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { Bill } from '../types';
import { BillBookStorage } from '../data/BillBookStorage';

interface HistoryViewProps {
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
  onRefreshBills: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  bills,
  onSelectBill,
  onRefreshBills,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');

  // Filtered bills
  const filteredBills = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yesterdayStr = yest.toDateString();

    const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;

    return bills.filter((b) => {
      // Date filter
      const billDateStr = new Date(b.timestamp).toDateString();
      if (dateFilter === 'today' && billDateStr !== todayStr) return false;
      if (dateFilter === 'yesterday' && billDateStr !== yesterdayStr) return false;
      if (dateFilter === 'week' && b.timestamp < sevenDaysAgo) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = b.billNumber.toLowerCase().includes(q);
        const matchesCustomer = b.customerName && b.customerName.toLowerCase().includes(q);
        const matchesItem = b.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchesNum && !matchesCustomer && !matchesItem) return false;
      }

      return true;
    });
  }, [bills, searchQuery, dateFilter]);

  const handleToggleCancel = (e: React.MouseEvent, bill: Bill) => {
    e.stopPropagation();
    const newStatus = bill.status === 'finalized' ? 'cancelled' : 'finalized';
    const confirmMsg =
      newStatus === 'cancelled'
        ? `Are you sure you want to mark ${bill.billNumber} as CANCELLED? (Cancelled bills are excluded from daily sales totals)`
        : `Re-activate ${bill.billNumber}?`;

    if (confirm(confirmMsg)) {
      BillBookStorage.updateBillStatus(bill.id, newStatus);
      onRefreshBills();
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Transaction History
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            View, search, reprint, or share past offline bills
          </p>
        </div>
        <span className="text-xs font-mono font-medium text-stone-500">
          Total: {bills.length} bills recorded
        </span>
      </div>

      {/* Search & Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Bill #, customer name, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
          />
        </div>

        {/* Date Tabs */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0 mr-1" />
          {(['all', 'today', 'yesterday', 'week'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors capitalize ${
                dateFilter === filter
                  ? 'bg-[#9E1B46] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {filter === 'week' ? 'Past 7 Days' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Cards List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            <Receipt className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p>No bills found for the selected filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredBills.map((bill) => {
              const dateObj = new Date(bill.timestamp);
              const dateStr = dateObj.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = dateObj.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              });

              const isCancelled = bill.status === 'cancelled';

              return (
                <div
                  key={bill.id}
                  onClick={() => onSelectBill(bill)}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isCancelled
                      ? 'bg-stone-50/70 opacity-75'
                      : 'hover:bg-stone-50/70'
                  }`}
                >
                  {/* Bill Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs sm:text-sm text-stone-900">
                        {bill.billNumber}
                      </span>

                      {isCancelled ? (
                        <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-full">
                          CANCELLED
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
                          Finalized
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {dateStr} {timeStr}
                      </span>
                      <span>·</span>
                      <span>{bill.items.length} items</span>
                      {bill.customerName && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-stone-700">
                            {bill.customerName}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Preview of item names */}
                    <p className="text-[11px] text-stone-400 mt-1 truncate">
                      {bill.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                    </p>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-stone-100">
                    <div className="text-left sm:text-right">
                      <p
                        className={`font-mono font-bold text-base sm:text-lg ${
                          isCancelled ? 'line-through text-stone-400' : 'text-[#9E1B46]'
                        }`}
                      >
                        ₹{bill.finalAmount.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        Subtotal: ₹{bill.subtotal.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBill(bill);
                        }}
                        className="p-2 text-stone-600 hover:text-[#9E1B46] hover:bg-stone-100 rounded-lg transition-colors"
                        title="View Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleToggleCancel(e, bill)}
                        className={`p-2 rounded-lg transition-colors ${
                          isCancelled
                            ? 'text-stone-400 hover:text-emerald-700 hover:bg-emerald-50'
                            : 'text-stone-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={isCancelled ? 'Restore Bill' : 'Cancel Bill'}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
