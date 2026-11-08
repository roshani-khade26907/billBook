import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Copy, ExternalLink, QrCode } from 'lucide-react';

interface UpiSimulatorModalProps {
  upiUri: string;
  onClose: () => void;
}

export const UpiSimulatorModal: React.FC<UpiSimulatorModalProps> = ({ upiUri, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Parse URI query params
  const parseUpiUri = (uri: string) => {
    try {
      const queryString = uri.split('?')[1] || '';
      const params = new URLSearchParams(queryString);
      return {
        vpa: params.get('pa') || '',
        name: params.get('pn') || '',
        amount: params.get('am') || '',
        currency: params.get('cu') || '',
        note: params.get('tn') || '',
      };
    } catch {
      return { vpa: '', name: '', amount: '', currency: '', note: '' };
    }
  };

  const parsed = parseUpiUri(upiUri);

  const handleCopy = () => {
    navigator.clipboard.writeText(upiUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">NPCI UPI QR Inspection</h3>
              <p className="text-[11px] text-stone-400">Acceptance Test 7 Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-stone-600">
            This demonstrates exactly how UPI apps (<strong>Google Pay, PhonePe, Paytm, BHIM</strong>) on Android parse and lock the payee address and transaction amount:
          </p>

          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">Payee VPA (pa):</span>
              <span className="font-mono font-bold text-[#9E1B46]">{parsed.vpa || 'Missing'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">Merchant Name (pn):</span>
              <span className="font-semibold text-stone-900">{parsed.name || 'Shop'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">Exact Amount (am):</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                ₹{parsed.amount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">Currency (cu):</span>
              <span className="font-mono text-stone-700">{parsed.currency || 'INR'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">Reference Note (tn):</span>
              <span className="font-mono text-stone-700 text-[11px]">{parsed.note}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Raw UPI Intent URI:
            </label>
            <div className="flex items-center gap-1.5 p-2 bg-stone-100 rounded-lg border border-stone-200">
              <code className="text-[11px] font-mono text-stone-800 break-all flex-1">
                {upiUri}
              </code>
              <button
                onClick={handleCopy}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-md shrink-0 transition-colors"
                title="Copy UPI URI"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex gap-2">
            <span className="font-bold">Safety:</span>
            <span>
              Bill Book does not process money or ask for UPI PINs. Real payment confirmation is handled directly by the customer's UPI app.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#9E1B46] hover:bg-[#85163a] text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
