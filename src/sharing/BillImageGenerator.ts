import QRCode from 'qrcode';
import { Bill } from '../types';

export class BillImageGenerator {
  /**
   * Generates a high-resolution PNG receipt image on an HTML5 canvas and returns Blob and DataURL.
   */
  static async generateReceiptImage(bill: Bill): Promise<{ blob: Blob; dataUrl: string }> {
    const scale = 2; // 2x for sharp print/screen quality
    const width = 480; // standard 3-inch thermal receipt width in px
    
    // Calculate required height dynamically based on number of items
    const headerHeight = 160;
    const metaHeight = 85;
    const itemsHeaderHeight = 35;
    const itemsHeight = bill.items.length * 32;
    const calculationHeight = 160 + (bill.taxRate > 0 ? 40 : 0);
    const qrHeight = bill.shopSnapshot.upiId ? 230 : 50;
    const footerHeight = 80;
    const totalHeight = headerHeight + metaHeight + itemsHeaderHeight + itemsHeight + calculationHeight + qrHeight + footerHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Unable to acquire 2D canvas context for receipt generation');
    }

    ctx.scale(scale, scale);

    // 1. Background (crisp white thermal paper feel with subtle border)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, totalHeight);

    // Decorative top color bar (Deep Raspberry)
    ctx.fillStyle = '#9E1B46';
    ctx.fillRect(0, 0, width, 8);

    let y = 30;

    // 2. Shop Header
    ctx.fillStyle = '#1E1E24';
    ctx.font = 'bold 20px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bill.shopSnapshot.shopName || 'Shop Receipt', width / 2, y);

    y += 20;
    if (bill.shopSnapshot.ownerName) {
      ctx.fillStyle = '#4B5563';
      ctx.font = '500 12px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(`Prop: ${bill.shopSnapshot.ownerName}`, width / 2, y);
      y += 18;
    }

    if (bill.shopSnapshot.address) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '11px "Plus Jakarta Sans", system-ui, sans-serif';
      // Word wrap address if long
      const addr = bill.shopSnapshot.address;
      ctx.fillText(addr.length > 55 ? addr.slice(0, 52) + '...' : addr, width / 2, y);
      y += 16;
    }

    if (bill.shopSnapshot.phone) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '11px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(`Ph: ${bill.shopSnapshot.phone}`, width / 2, y);
      y += 18;
    }

    if (bill.shopSnapshot.gstin) {
      ctx.fillStyle = '#4B5563';
      ctx.font = '600 11px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(`GSTIN: ${bill.shopSnapshot.gstin}`, width / 2, y);
      y += 18;
    }

    // Divider line
    y += 6;
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Bill Metadata (Bill #, Date, Time)
    y += 20;
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

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1E1E24';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`Bill: ${bill.billNumber}`, 20, y);

    ctx.textAlign = 'right';
    ctx.font = '11px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#4B5563';
    ctx.fillText(`${dateStr} ${timeStr}`, width - 20, y);

    if (bill.customerName || bill.customerPhone) {
      y += 18;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#4B5563';
      ctx.font = '11px "Plus Jakarta Sans", system-ui, sans-serif';
      const custText = `Customer: ${bill.customerName || 'Walk-in'} ${bill.customerPhone ? `(${bill.customerPhone})` : ''}`;
      ctx.fillText(custText, 20, y);
    }

    // Divider
    y += 14;
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();

    // 4. Table Header
    y += 16;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 11px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ITEM', 20, y);
    ctx.textAlign = 'center';
    ctx.fillText('QTY', 260, y);
    ctx.textAlign = 'right';
    ctx.fillText('PRICE', 350, y);
    ctx.fillText('TOTAL', width - 20, y);

    y += 8;
    ctx.strokeStyle = '#E5E7EB';
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();

    // 5. Item Rows
    bill.items.forEach((item) => {
      y += 22;
      ctx.fillStyle = '#1F2937';
      ctx.font = '500 12px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.textAlign = 'left';
      const itemName = item.name.length > 25 ? item.name.slice(0, 23) + '..' : item.name;
      ctx.fillText(itemName, 20, y);

      ctx.textAlign = 'center';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(`${item.quantity}`, 260, y);

      ctx.textAlign = 'right';
      ctx.fillText(`₹${item.unitPrice.toFixed(2)}`, 350, y);
      ctx.fillText(`₹${item.total.toFixed(2)}`, width - 20, y);
    });

    // Divider
    y += 16;
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#D1D5DB';
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. Calculations Section
    const renderCalcRow = (label: string, value: string, isBold = false, isAccent = false) => {
      y += 20;
      ctx.textAlign = 'left';
      ctx.fillStyle = isAccent ? '#9E1B46' : isBold ? '#111827' : '#4B5563';
      ctx.font = isBold ? 'bold 12px "Plus Jakarta Sans", system-ui, sans-serif' : '12px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(label, 20, y);

      ctx.textAlign = 'right';
      ctx.font = isBold ? 'bold 13px "JetBrains Mono", monospace' : '12px "JetBrains Mono", monospace';
      ctx.fillText(value, width - 20, y);
    };

    renderCalcRow('Subtotal', `₹${bill.subtotal.toFixed(2)}`);

    if (bill.discountAmount > 0) {
      const discLabel = bill.discountType === 'percentage' 
        ? `Discount (${bill.discountValue}%)` 
        : 'Special Discount';
      renderCalcRow(discLabel, `- ₹${bill.discountAmount.toFixed(2)}`, false, true);
    }

    if (bill.taxRate > 0) {
      const taxMode = bill.isTaxInclusive ? ' (Incl.)' : '';
      renderCalcRow(`CGST (${(bill.taxRate / 2).toFixed(1)}%)${taxMode}`, `₹${bill.cgstAmount.toFixed(2)}`);
      renderCalcRow(`SGST (${(bill.taxRate / 2).toFixed(1)}%)${taxMode}`, `₹${bill.sgstAmount.toFixed(2)}`);
    }

    // Final Total Box
    y += 12;
    ctx.fillStyle = '#FCE7F0';
    ctx.fillRect(20, y, width - 40, 44);
    ctx.strokeStyle = '#9E1B46';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, y, width - 40, 44);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#9E1B46';
    ctx.font = 'bold 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('FINAL PAYABLE', 36, y + 27);

    ctx.textAlign = 'right';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`₹${bill.finalAmount.toFixed(2)}`, width - 36, y + 28);
    y += 50;

    // 7. UPI QR Code (if UPI ID exists)
    if (bill.shopSnapshot.upiId && bill.upiQrUri) {
      y += 10;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 11px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('SCAN & PAY VIA ANY UPI APP', width / 2, y);

      y += 8;
      // Draw QR Code
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, bill.upiQrUri, {
        width: 140,
        margin: 1,
        color: { dark: '#1E1E24', light: '#FFFFFF' },
      });
      ctx.drawImage(qrCanvas, (width - 140) / 2, y);

      y += 150;
      ctx.fillStyle = '#4B5563';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`UPI ID: ${bill.shopSnapshot.upiId}`, width / 2, y);

      y += 14;
      ctx.fillStyle = '#6B7280';
      ctx.font = '9px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('Google Pay · PhonePe · Paytm · BHIM · Any Bank UPI', width / 2, y);
    }

    // 8. Footer Message
    y += 24;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1E1E24';
    ctx.font = '600 11px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Thank you for shopping with us!', width / 2, y);

    y += 14;
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '9px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Generated offline by Bill Book · Smart Shop Billing', width / 2, y);

    // Convert canvas to blob & dataUrl
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob from canvas'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ blob, dataUrl });
      }, 'image/png');
    });
  }

  /**
   * Triggers the Android / Web Sharesheet or downloads the image and directs to WhatsApp.
   */
  static async shareReceipt(
    bill: Bill,
    customPhone?: string
  ): Promise<{ sharedViaApi: boolean; message: string }> {
    const { blob, dataUrl } = await this.generateReceiptImage(bill);
    const fileName = `${bill.billNumber}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    const shareText = `Thank you for shopping with ${bill.shopSnapshot.shopName || 'our shop'}! 
Your bill total is ₹${bill.finalAmount.toFixed(2)}. 
Bill No: ${bill.billNumber}
Please find your official receipt attached.`;

    // 1. Check if navigator.canShare supports files (Android Chrome, WebShare Level 2)
    if (
      navigator.canShare &&
      navigator.canShare({ files: [file] }) &&
      navigator.share
    ) {
      try {
        await navigator.share({
          title: `Bill ${bill.billNumber} - ${bill.shopSnapshot.shopName}`,
          text: shareText,
          files: [file],
        });
        return {
          sharedViaApi: true,
          message: 'Bill shared successfully via device Sharesheet!',
        };
      } catch (err: unknown) {
        // User cancelled or share dismissed
        const error = err as { name?: string };
        if (error.name === 'AbortError') {
          return { sharedViaApi: true, message: 'Share action cancelled.' };
        }
      }
    }

    // 2. Fallback: Automatically download receipt image and open WhatsApp with pre-composed text
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Formulate WhatsApp web / mobile intent URL
    const cleanPhone = (customPhone || bill.customerPhone || '').replace(/\D/g, '');
    const waPhoneParam = cleanPhone.length >= 10 ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : '';
    const waUrl = waPhoneParam 
      ? `https://wa.me/${waPhoneParam}?text=${encodeURIComponent(shareText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    // Open WhatsApp in a controlled iframe/tab or prompt
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    return {
      sharedViaApi: false,
      message: `Receipt image downloaded. Opening WhatsApp with bill details...`,
    };
  }
}
