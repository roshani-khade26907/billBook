import React from 'react';
import { LayoutDashboard, FilePlus2, Package, History, Settings } from 'lucide-react';

export type TabType = 'dashboard' | 'new_bill' | 'products' | 'history' | 'settings';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab }) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Home', icon: LayoutDashboard },
    { id: 'new_bill' as TabType, label: 'New Bill', icon: FilePlus2, isPrimary: true },
    { id: 'products' as TabType, label: 'Products', icon: Package },
    { id: 'history' as TabType, label: 'History', icon: History },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-white border-t border-stone-200 fixed bottom-0 left-0 right-0 z-30 shadow-lg">
      <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="relative -top-3 flex flex-col items-center group focus:outline-hidden"
              >
                <div
                  className={`w-13 h-13 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-[#9E1B46] text-white ring-4 ring-[#FCE7F0]'
                      : 'bg-[#9E1B46] text-white hover:bg-[#85163a]'
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span
                  className={`text-[11px] font-bold mt-1 ${
                    isActive ? 'text-[#9E1B46]' : 'text-stone-600'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative ${
                isActive ? 'text-[#9E1B46]' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-[#FCE7F0]' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[11px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
