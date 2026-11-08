import React, { useState } from 'react';
import { 
  Store, 
  QrCode, 
  ShieldCheck, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ShopProfile } from '../types';
import { BillBookStorage } from '../data/BillBookStorage';
import { UpiQrGenerator } from '../payment/UpiQrGenerator';

interface SettingsViewProps {
  shop: ShopProfile;
  onShopUpdated: (updated: ShopProfile) => void;
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  shop,
  onShopUpdated,
  onDataReset,
}) => {
  const [shopName, setShopName] = useState(shop.shopName);
  const [ownerName, setOwnerName] = useState(shop.ownerName || '');
  const [address, setAddress] = useState(shop.address);
  const [phone, setPhone] = useState(shop.phone);
  const [upiId, setUpiId] = useState(shop.upiId);
  const [gstin, setGstin] = useState(shop.gstin || '');
  const [taxRateDefault, setTaxRateDefault] = useState<number>(shop.taxRateDefault ?? 0);
  const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(shop.isTaxInclusive ?? true);
  const [thankYouMessage, setThankYouMessage] = useState(shop.thankYouMessage || '');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Verification state for UPI ID
  const isUpiValid = upiId ? UpiQrGenerator.isValidUpiId(upiId) : false;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setFeedback({ type: 'error', message: 'Shop name cannot be blank.' });
      return;
    }
    if (upiId && !UpiQrGenerator.isValidUpiId(upiId)) {
      setFeedback({
        type: 'error',
        message: 'Invalid UPI ID format. Expected format: username@bank (e.g. sharmakirana@okhdfcbank)',
      });
      return;
    }

    const updated: ShopProfile = {
      ...shop,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      upiId: upiId.trim(),
      gstin: gstin.trim() || undefined,
      taxRateDefault,
      isTaxInclusive,
      thankYouMessage: thankYouMessage.trim(),
    };

    BillBookStorage.saveShopProfile(updated);
    onShopUpdated(updated);
    setFeedback({ type: 'success', message: 'Shop profile and UPI settings saved successfully!' });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleExportBackup = () => {
    const jsonStr = BillBookStorage.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `billbook-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback({ type: 'success', message: 'Local database backup exported to JSON file.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = BillBookStorage.importData(content);
      if (success) {
        onDataReset();
        setFeedback({ type: 'success', message: 'Backup restored successfully!' });
      } else {
        setFeedback({ type: 'error', message: 'Failed to parse backup JSON file.' });
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (
      confirm(
        'DANGER: Are you sure you want to delete all saved bills and reset products? This action cannot be undone.'
      )
    ) {
      BillBookStorage.clearAllData();
      onDataReset();
      setFeedback({ type: 'success', message: 'All local data has been cleared.' });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Shop Settings & UPI</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Configure shop details that appear on printed and shared bill receipts
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSaveProfile} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        {/* Shop Name */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Shop Name *
          </label>
          <input
            type="text"
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="e.g. Sharma Kirana & General Store"
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
          />
        </div>

        {/* Owner Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Owner / Proprietor Name
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Shop Address
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Market, street, city..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
          />
        </div>

        {/* UPI ID Section with format guidance */}
        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-stone-800">
              Shopkeeper UPI ID (VPA) *
            </label>
            {upiId && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isUpiValid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {isUpiValid ? 'Valid Format' : 'Invalid Format'}
              </span>
            )}
          </div>

          <div className="relative">
            <QrCode className="w-4 h-4 text-[#9E1B46] absolute left-3 top-2.5" />
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourshop@okaxis or 9876543210@paytm"
              className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46] bg-white"
            />
          </div>
          <p className="text-[11px] text-stone-500">
            UPI ID is used to encode payment QR codes for the exact bill total. We never invent or hardcode payment IDs.
          </p>
        </div>

        {/* GSTIN & Tax Defaults */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              GSTIN (Optional)
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g. 08AAAAA0000A1Z5"
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Default Tax Rate (%)
            </label>
            <select
              value={taxRateDefault}
              onChange={(e) => setTaxRateDefault(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
            >
              <option value={0}>0% (Zero Tax / Unregistered)</option>
              <option value={5}>5% (Essential Groceries)</option>
              <option value={12}>12% (Standard FMCG)</option>
              <option value={18}>18% (Packaged / Services)</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-3 border-t border-stone-200 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#9E1B46] hover:bg-[#85163a] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            Save Shop Profile
          </button>
        </div>
      </form>

      {/* Backup & Data Privacy Section */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Offline Data & Privacy Controls</span>
        </h3>
        <p className="text-xs text-stone-500">
          All data is strictly held locally on your device. You can download an offline JSON backup or restore past data anytime.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors border border-stone-200"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span>Export Backup JSON</span>
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors border border-stone-200 cursor-pointer">
            <Upload className="w-4 h-4 text-stone-600" />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleClearAllData}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200 ml-auto"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Clear Local Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
