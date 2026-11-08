/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Bill, Product, ShopProfile } from './types';
import { BillBookStorage } from './data/BillBookStorage';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { NewBillView } from './components/NewBillView';
import { ProductsView } from './components/ProductsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { BillReceiptModal } from './components/BillReceiptModal';
import { UpiSimulatorModal } from './components/UpiSimulatorModal';
import { AndroidCodeHubModal } from './components/AndroidCodeHubModal';
import { WifiOff, Battery, Signal } from 'lucide-react';

export default function App() {
  // App state
  const [shop, setShop] = useState<ShopProfile>(() => BillBookStorage.getShopProfile());
  const [products, setProducts] = useState<Product[]>(() => BillBookStorage.getProducts());
  const [bills, setBills] = useState<Bill[]>(() => BillBookStorage.getBills());
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Modals
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [activeUpiUri, setActiveUpiUri] = useState<string | null>(null);
  const [isAndroidHubOpen, setIsAndroidHubOpen] = useState<boolean>(false);

  // Viewport mode: Android Phone Frame simulation vs Wide POS view
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);

  // Clock for Android status bar
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTimeStr(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshBills = useCallback(() => {
    setBills(BillBookStorage.getBills());
  }, []);

  const refreshProducts = useCallback(() => {
    setProducts(BillBookStorage.getProducts());
  }, []);

  const handleBillCreated = useCallback((newBill: Bill) => {
    refreshBills();
    setSelectedBill(newBill);
    // Switch to history tab or keep modal open
  }, [refreshBills]);

  // Analytics derived data
  const todaySummary = useMemo(() => {
    return BillBookStorage.getDailySalesSummary();
  }, [bills]);

  const salesTrend = useMemo(() => {
    return BillBookStorage.getRecentSalesTrend(7);
  }, [bills]);

  const topProducts = useMemo(() => {
    return BillBookStorage.getTopSellingProducts(5);
  }, [bills]);

  return (
    <div className="min-h-screen bg-[#F4F1ED] text-[#1E1E24] flex flex-col items-center">
      {/* Top Navbar */}
      <div className="w-full">
        <Navbar
          shop={shop}
          isMobileFrame={isMobileFrame}
          setIsMobileFrame={setIsMobileFrame}
          onOpenAndroidHub={() => setIsAndroidHubOpen(true)}
        />
      </div>

      {/* Main Container: Mobile Frame vs Wide POS Countertop */}
      <main
        className={`w-full flex-1 transition-all ${
          isMobileFrame
            ? 'max-w-md my-4 sm:my-6 rounded-[38px] border-8 border-stone-800 bg-[#F8F6F4] shadow-2xl overflow-hidden flex flex-col relative min-h-[820px]'
            : 'max-w-6xl px-4 py-6'
        }`}
      >
        {/* Simulated Android Status Bar (When in Mobile Frame mode) */}
        {isMobileFrame && (
          <div className="h-7 bg-stone-900 text-stone-200 px-6 flex items-center justify-between text-xs font-mono select-none shrink-0">
            <span>{currentTimeStr}</span>
            <div className="flex items-center gap-1.5 text-stone-300">
              <Signal className="w-3 h-3" />
              <WifiOff className="w-3 h-3 text-emerald-400" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Screen Content Wrapper */}
        <div className={`flex-1 ${isMobileFrame ? 'p-4 overflow-y-auto' : ''}`}>
          {currentTab === 'dashboard' && (
            <DashboardView
              shop={shop}
              todaySummary={todaySummary}
              recentBills={bills}
              salesTrend={salesTrend}
              topProducts={topProducts}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onSelectBill={(b) => setSelectedBill(b)}
            />
          )}

          {currentTab === 'new_bill' && (
            <NewBillView
              shop={shop}
              products={products}
              onBillCreated={handleBillCreated}
              onOpenUpiSimulator={(uri) => setActiveUpiUri(uri)}
            />
          )}

          {currentTab === 'products' && (
            <ProductsView
              products={products}
              onProductsUpdated={refreshProducts}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              bills={bills}
              onSelectBill={(b) => setSelectedBill(b)}
              onRefreshBills={refreshBills}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              shop={shop}
              onShopUpdated={(updated) => setShop(updated)}
              onDataReset={() => {
                setShop(BillBookStorage.getShopProfile());
                refreshProducts();
                refreshBills();
              }}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNav currentTab={currentTab} onChangeTab={(tab) => setCurrentTab(tab)} />
      </main>

      {/* Bill Receipt Modal */}
      {selectedBill && (
        <BillReceiptModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onOpenUpiSimulator={(uri) => setActiveUpiUri(uri)}
        />
      )}

      {/* UPI Payment Inspector Modal */}
      {activeUpiUri && (
        <UpiSimulatorModal
          upiUri={activeUpiUri}
          onClose={() => setActiveUpiUri(null)}
        />
      )}

      {/* Android Kotlin/Compose Source Code Hub */}
      {isAndroidHubOpen && (
        <AndroidCodeHubModal onClose={() => setIsAndroidHubOpen(false)} />
      )}
    </div>
  );
}
