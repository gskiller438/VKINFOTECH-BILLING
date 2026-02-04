import jsPDF from 'jspdf';
import templateImage from '../assets/invoice_template.png';

// Types (Mirrors of what's in Billing.tsx/InvoiceTemplate for now)
export interface InvoiceProduct {
    sNo: number;
    description: string;
    qty: number;
    rate: number;
    discountPercent: number;
    amount: number;
}

export interface InvoiceData {
    invoiceNumber: string;
    date: string;
    time: string;
    dueDate: string;
    dueTime: string;
    payMode: string;
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    products: InvoiceProduct[];
    subTotal: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    roundOff: number;
    grandTotal: number;
    amountInWords: string;
    paidAmount: number;
    balanceAmount: number;
}

export const generateInvoicePDF = async (data: InvoiceData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const width = 210;
    const height = 297;

    // Add Template Background
    // Note: addImage supports URL, but ensuring it's loaded might require valid accessible URL. 
    // Vite imports usually give a path. jsPDF might need base64 or Image element.
    // Creating an Image element to ensure it loads.
    await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = templateImage;
        img.onload = () => {
            doc.addImage(img, 'PNG', 0, 0, width, height);
            resolve();
        };
        img.onerror = reject;
    });

    doc.setFont('helvetica');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // --- MAPPING COORDINATES (Estimated based on standard Invoice layouts) ---

    // Customer Details (Bill To) - Left Side
    const leftX = 14;
    const topY = 48; // Below header
    const lineHeight = 5;

    doc.text(data.customerName || '', leftX, topY);
    // Split address into lines
    const addressLines = doc.splitTextToSize(data.customerAddress || '', 80);
    doc.text(addressLines, leftX, topY + lineHeight);
    doc.text(`Ph: ${data.customerPhone || ''}`, leftX, topY + lineHeight * (addressLines.length + 1));

    // Invoice Details - Right Side
    // Invoice Details - Right Side
    const rightValueX = 160;
    let rightY = 48;

    doc.text(data.invoiceNumber, rightValueX, rightY);
    doc.text(data.date, rightValueX, rightY + lineHeight);
    doc.text(data.time, rightValueX, rightY + lineHeight * 2);

    // Due Date Section (Below Inv details)
    const dueY = 65;
    doc.text(data.dueDate || '-', rightValueX, dueY);
    doc.text(data.dueTime || '-', rightValueX, dueY + lineHeight);
    doc.text(data.payMode || 'Cash', rightValueX, dueY + lineHeight * 2);

    // --- Product Table ---
    // Headers are fixed in template. We just fill rows.
    // Approx Y start for first row: 95mm
    let y = 95;
    const rowHeight = 8;

    // Column X Positions
    const colSNo = 12;
    const colDesc = 25;
    const colQty = 115;
    const colPrice = 135;
    const colDis = 160;
    const colAmount = 185;

    data.products.forEach((p) => {
        // Check for page break if y > 220 (approx bottom of table)
        if (y > 210) {
            doc.addPage();
            doc.addImage(templateImage, 'PNG', 0, 0, width, height); // Re-add template on new page? Maybe not if template has specific footer. 
            // For fixed template billing, usually single page or layout changes. 
            // Assuming single page for simple bills, or we just continue without template background on pg 2.
            // Let's stick to single page logic for now or simple overflow.
            y = 30; // Reset Y
        }

        doc.text(p.sNo.toString(), colSNo, y);
        doc.text(p.description, colDesc, y);
        doc.text(p.qty.toString(), colQty, y);
        doc.text(Number(p.rate).toFixed(2), colPrice, y);
        doc.text(Number(p.discountPercent).toString(), colDis, y);
        doc.text(Number(p.amount).toFixed(2), colAmount, y);

        y += rowHeight;
    });

    // --- Totals ---
    // Coordinates for bottom right calculation box
    // Approx Y start for totals: 225
    const totalValueX = 195; // Right aligned?
    const totalYStart = 227;
    const totalLineHeight = 6;

    // Helper for right aligned text
    const textRight = (text: string, x: number, lineY: number) => {
        doc.text(text, x, lineY, { align: 'right' });
    };

    textRight(data.subTotal.toFixed(2), totalValueX, totalYStart);
    textRight(`${data.gstRate / 2}%  ${data.cgst.toFixed(2)}`, totalValueX, totalYStart + totalLineHeight); // GST Breakup or total? Template shows GST, SGST, CGST rows?
    // User Prompt: GST = 18%, SGST=9%, CGST=9%.
    // Assuming Template has rows: Subtotal, GST (or SGST/CGST), Round Off, Grand Total.
    // Let's assume standard 4 lines:
    // 1. Subtotal
    // 2. SGST
    // 3. CGST
    // 4. Round Off

    textRight(data.sgst.toFixed(2), totalValueX, totalYStart + totalLineHeight);
    textRight(data.cgst.toFixed(2), totalValueX, totalYStart + totalLineHeight * 2);
    textRight(data.roundOff.toFixed(2), totalValueX, totalYStart + totalLineHeight * 3);

    // Grand Total (Blue strip usually)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    textRight(data.grandTotal.toFixed(2), totalValueX, totalYStart + totalLineHeight * 4 + 2);

    // Paid Amount
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    textRight(data.paidAmount.toFixed(0), totalValueX, totalYStart + totalLineHeight * 5 + 3);

    // --- Amount in Words ---
    const wordsX = 15;
    const wordsY = 227;
    doc.setFontSize(9);
    // Wrap text if long
    const wordLines = doc.splitTextToSize(data.amountInWords, 100);
    doc.text(wordLines, wordsX, wordsY);

    // Save
    doc.save(`Invoice_${data.invoiceNumber}.pdf`);
};
