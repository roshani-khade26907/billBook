import QRCode from 'qrcode';

export interface UpiPaymentParams {
  upiId: string;
  shopName: string;
  amount: number;
  billNumber?: string;
  note?: string;
}

export class UpiQrGenerator {
  /**
   * Validates standard UPI Virtual Payment Address (VPA) format.
   * e.g. "sharmakirana@okhdfcbank", "9876543210@paytm", "shop@ybl"
   */
  static isValidUpiId(upiId: string): boolean {
    if (!upiId || typeof upiId !== 'string') return false;
    const trimmed = upiId.trim();
    // UPI VPA structure: username@bankhandle
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(trimmed);
  }

  /**
   * Constructs the standard NPCI UPI Payment URI string.
   */
  static buildUpiUri(params: UpiPaymentParams): string {
    const { upiId, shopName, amount, billNumber, note } = params;

    if (!this.isValidUpiId(upiId)) {
      throw new Error(`Invalid UPI ID format: "${upiId}". Expected format: username@bank (e.g., store@upi)`);
    }

    if (amount <= 0) {
      throw new Error('Bill amount must be greater than zero for UPI QR payment generation');
    }

    const cleanAmount = amount.toFixed(2);
    const cleanNote = note || (billNumber ? `Bill ${billNumber}` : 'Shop Payment');

    // NPCI standard UPI specification:
    // pa: Payee VPA / UPI ID
    // pn: Payee Name
    // am: Transaction Amount
    // cu: Currency (INR)
    // tn: Transaction Note / Reference
    const queryParts = [
      `pa=${encodeURIComponent(upiId.trim())}`,
      `pn=${encodeURIComponent(shopName.trim() || 'Shop')}`,
      `am=${encodeURIComponent(cleanAmount)}`,
      `cu=INR`,
      `tn=${encodeURIComponent(cleanNote)}`,
    ];

    return `upi://pay?${queryParts.join('&')}`;
  }

  /**
   * Generates a high-resolution base64 PNG Data URL QR code entirely offline.
   */
  static async generateQrDataUrl(
    params: UpiPaymentParams,
    size: number = 320
  ): Promise<{ dataUrl: string; uri: string }> {
    const uri = this.buildUpiUri(params);
    const dataUrl = await QRCode.toDataURL(uri, {
      width: size,
      margin: 1,
      color: {
        dark: '#1E1E24',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    return { dataUrl, uri };
  }

  /**
   * Directly draws the QR code onto a canvas element.
   */
  static async renderToCanvas(
    canvas: HTMLCanvasElement,
    params: UpiPaymentParams,
    size: number = 240
  ): Promise<string> {
    const uri = this.buildUpiUri(params);
    await QRCode.toCanvas(canvas, uri, {
      width: size,
      margin: 1,
      color: {
        dark: '#1E1E24',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
    return uri;
  }
}
