import React, { useEffect, useState, useRef } from 'react';
import { X, Share2, Download, Printer, QrCode, CheckCircle2, MessageCircle, Phone } from 'lucide-react';
import { Bill } from '../types';
import { BillImageGenerator } from '../sharing/BillImageGenerator';
import QRCode from 'qrcode';

interface BillReceiptModalProps {
  bill: Bill;
  onClose: () => void;
  onOpenUpiSimulator: (uri: string) => void;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  bill,
  onClose,
  onOpenUpiSimulator,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [customPhone, setCustomPhone] = useState<string>(bill.customerPhone || '');
  const [showPhonePrompt, setShowPhonePrompt] = useState<boolean>(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (bill.upiQrUri) {
      QRCode.toDataURL(bill.upiQrUri, {
        width: 220,
        margin: 1,
        color: { dark: '#1E1E24', light: '#FFFFFF' },
      })
        .then((url) => {
          if (isMounted) setQrDataUrl(url);
        })
        .catch(console.error);
    }
    return () => {
      isMounted = false;
    };
  }, [bill.upiQrUri]);

  const handleDownloadPng = async () => {
    try {
      const { dataUrl } = await BillImageGenerator.generateReceiptImage(bill);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${bill.billNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShareFeedback('Receipt PNG downloaded successfully!');
      setTimeout(() => setShareFeedback(null), 3000);
    } catch (err) {
      console.error(err);
      setShareFeedback('Failed to generate PNG image.');
    }
  };

  const handleShareWhatsApp = async (phoneToSend?: string) => {
    setIsSharing(true);
    setShareFeedback(null);
    try {
      const res = await BillImageGenerator.shareReceipt(bill, phoneToSend || customPhone);
      setShareFeedback(res.message);
      setTimeout(() => setShareFeedback(null), 5000);
    } catch (err) {
      console.error(err);
      setShareFeedback('Sharing was interrupted or cancelled.');
    } finally {
      setIsSharing(false);
      setShowPhonePrompt(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const dateObj = new Date(bill.timestamp);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-stone-200">
        {/* Top Header Controls */}
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-sm text-[#1E1E24]">Official Bill Receipt</span>
            <span className="text-xs font-mono text-stone-500">#{bill.billNumber}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message banner if present */}
        {shareFeedback && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-2 border-b border-emerald-200 flex items-center gap-2 shrink-0 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{shareFeedback}</span>
          </div>
        )}

        {/* Scrollable Receipt Body */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-stone-100 flex justify-center">
          {/* Paper Receipt Container */}
          <div
            ref={receiptRef}
            className="w-full max-w-sm bg-white p-5 rounded-xl shadow-md border border-stone-200 text-stone-900"
          >
            {/* Top decorative stripe */}
            <div className="w-full h-1.5 bg-[#9E1B46] rounded-full mb-4"></div>

            {/* Shop Details */}
            <div className="text-center pb-3 border-b border-dashed border-stone-300">
              <h2 className="text-xl font-bold text-[#1E1E24] tracking-tight">
                {bill.shopSnapshot.shopName}
              </h2>
              {bill.shopSnapshot.ownerName && (
                <p className="text-xs text-stone-600 font-medium mt-0.5">
                  Prop: {bill.shopSnapshot.ownerName}
                </p>
              )}
              {bill.shopSnapshot.address && (
                <p className="text-[11px] text-stone-500 mt-1 leading-tight">
                  {bill.shopSnapshot.address}
                </p>
              )}
              {bill.shopSnapshot.phone && (
                <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                  Ph: {bill.shopSnapshot.phone}
                </p>
              )}
              {bill.shopSnapshot.gstin && (
                <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                  GSTIN: {bill.shopSnapshot.gstin}
                </p>
              )}
            </div>

            {/* Bill Meta */}
            <div className="py-2.5 border-b border-stone-200 text-xs flex justify-between items-center">
              <div>
                <span className="font-mono font-bold text-stone-900">{bill.billNumber}</span>
                {bill.customerName && (
                  <p className="text-[11px] text-stone-600 mt-0.5 truncate max-w-[150px]">
                    To: {bill.customerName}
                  </p>
                )}
              </div>
              <div className="text-right text-stone-500 text-[11px]">
                <p>{formattedDate}</p>
                <p>{formattedTime}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-[10px] uppercase font-bold text-stone-500">
                    <th className="text-left pb-1.5">Item</th>
                    <th className="text-center pb-1.5 px-2">Qty</th>
                    <th className="text-right pb-1.5">Price</th>
                    <th className="text-right pb-1.5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bill.items.map((item, idx) => (
                    <tr key={idx} className="text-stone-800">
                      <td className="py-2 pr-2 text-left font-medium leading-snug">
                        {item.name}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-stone-600">
                        {item.quantity}
                      </td>
                      <td className="py-2 text-right font-mono text-stone-600">
                        ₹{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold text-stone-900">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-dashed border-stone-300 pt-2.5 space-y-1 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-mono">₹{bill.subtotal.toFixed(2)}</span>
              </div>

              {bill.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>
                    Discount {bill.discountType === 'percentage' ? `(${bill.discountValue}%)` : ''}
                  </span>
                  <span className="font-mono">- ₹{bill.discountAmount.toFixed(2)}</span>
                </div>
              )}

              {bill.taxRate > 0 && (
                <>
                  <div className="flex justify-between text-stone-500 text-[11px]">
                    <span>CGST ({(bill.taxRate / 2).toFixed(1)}%)</span>
                    <span className="font-mono">₹{bill.cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500 text-[11px]">
                    <span>SGST ({(bill.taxRate / 2).toFixed(1)}%)</span>
                    <span className="font-mono">₹{bill.sgstAmount.toFixed(2)}</span>
                  </div>
                </>
              )}

              {/* Total Payable Box */}
              <div className="mt-3 p-3 rounded-lg bg-[#FCE7F0] border border-[#9E1B46]/30 flex justify-between items-center text-[#9E1B46]">
                <span className="font-bold text-sm tracking-wide">FINAL PAYABLE</span>
                <span className="font-mono font-extrabold text-xl">
                  ₹{bill.finalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* UPI QR Payment Block */}
            {bill.shopSnapshot.upiId && qrDataUrl && (
              <div className="mt-4 pt-3 border-t border-dashed border-stone-300 text-center flex flex-col items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-[#9E1B46]" />
                  Scan to Pay ₹{bill.finalAmount.toFixed(2)}
                </span>

                <div className="p-2 bg-white rounded-xl shadow-xs border border-stone-200 mt-2">
                  <img
                    src={qrDataUrl}
                    alt="UPI Payment QR Code"
                    className="w-36 h-36 object-contain"
                  />
                </div>

                <p className="text-[10px] font-mono font-semibold text-stone-700 mt-1.5">
                  UPI ID: {bill.shopSnapshot.upiId}
                </p>
                <p className="text-[9px] text-stone-500">
                  GPay · PhonePe · Paytm · BHIM · Any Bank UPI
                </p>

                {/* Test UPI Simulator Trigger */}
                <button
                  type="button"
                  onClick={() => onOpenUpiSimulator(bill.upiQrUri)}
                  className="mt-2 text-[11px] font-semibold text-[#9E1B46] hover:underline flex items-center gap-1"
                >
                  Verify UPI QR Parameters
                </button>
              </div>
            )}

            {/* Thank you note */}
            <div className="mt-4 text-center text-stone-500 text-[11px]">
              <p className="font-semibold text-stone-700">Thank you for shopping with us!</p>
              <p className="text-[9px] mt-0.5">Please visit again</p>
            </div>
          </div>
        </div>

        {/* Quick Send to specific WhatsApp modal */}
        {showPhonePrompt && (
          <div className="p-3 bg-stone-50 border-t border-stone-200">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Customer WhatsApp Number (Optional):
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
                />
              </div>
              <button
                onClick={() => handleShareWhatsApp(customPhone)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Send Now
              </button>
              <button
                onClick={() => setShowPhonePrompt(false)}
                className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-wrap gap-2.5 items-center justify-between shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPng}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors border border-stone-200"
            >
              <Download className="w-4 h-4" />
              <span>Save PNG</span>
            </button>

            <button
              onClick={() => {
                if (bill.customerPhone) {
                  handleShareWhatsApp(bill.customerPhone);
                } else {
                  setShowPhonePrompt(true);
                }
              }}
              disabled={isSharing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
