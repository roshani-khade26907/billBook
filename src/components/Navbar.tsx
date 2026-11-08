import React from 'react';
import { Store, WifiOff, Smartphone, Monitor, Code2 } from 'lucide-react';
import { ShopProfile } from '../types';

interface NavbarProps {
  shop: ShopProfile;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  onOpenAndroidHub: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  shop,
  isMobileFrame,
  setIsMobileFrame,
  onOpenAndroidHub,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 select-none shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-15 flex items-center justify-between gap-3">
        {/* Brand & Shop Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#9E1B46] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            BB
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[#1E1E24] text-base sm:text-lg leading-tight truncate">
                {shop.shopName || 'Bill Book'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <WifiOff className="w-3 h-3" />
                100% Offline
              </span>
            </div>
            <p className="text-xs text-stone-500 truncate flex items-center gap-1.5">
              <span>{shop.ownerName ? `Prop: ${shop.ownerName}` : 'Smart Offline Billing'}</span>
              <span className="hidden md:inline text-stone-300">|</span>
              <span className="hidden md:inline font-mono text-[11px] text-stone-600">
                UPI: {shop.upiId || 'Not Configured'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Android Code Hub */}
          <button
            onClick={onOpenAndroidHub}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors border border-stone-200"
            title="View Native Kotlin Android Source Code & APK Build Guide"
          >
            <Code2 className="w-3.5 h-3.5 text-[#9E1B46]" />
            <span className="hidden sm:inline">Android Code & APK</span>
          </button>

          {/* Viewport Frame Switcher */}
          <div className="hidden lg:flex items-center p-1 bg-stone-100 rounded-lg border border-stone-200">
            <button
              onClick={() => setIsMobileFrame(true)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                isMobileFrame
                  ? 'bg-white text-[#9E1B46] shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Android Mobile Device Simulation"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile View</span>
            </button>
            <button
              onClick={() => setIsMobileFrame(false)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                !isMobileFrame
                  ? 'bg-white text-[#9E1B46] shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Wide POS Countertop View"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>POS View</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
