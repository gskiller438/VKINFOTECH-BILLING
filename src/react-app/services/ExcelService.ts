import * as XLSX from 'xlsx';

// Re-use types from Billing/InvoiceTemplate to ensure consistency
// We generally pass the processed InvoiceData and CompanyDetails
interface ExcelInvoiceData {
    company: {
        name: string;
        address: string;
        phone: string;
        gst: string;
        email?: string;
    };
    invoice: {
        number: string;
        date: string;
        time: string;
        customerName: string;
        customerPhone: string;
        customerAddress: string;
        paymentMode: string;
    };
    products: Array<{
        sNo: number;
        description: string;
        qty: number;
        price: number;
        discount: number;
        amount: number;
    }>;
    totals: {
        subtotal: number;
        gstRate: number;
        sgst: number;
        cgst: number;
        roundOff: number;
        grandTotal: number;
        amountInWords: string;
        paidAmount: number;
        balance: number;
    };
}

export const exportInvoiceToExcel = (data: ExcelInvoiceData) => {
    // 1. Setup Worksheet Data
    // We will build a 2D array representing the grid
    const ws_data: any[][] = [];

    // Title / Company Header
    ws_data.push([data.company.name.toUpperCase()]); // A1
    ws_data.push([data.company.address]);
    ws_data.push([`Ph: ${data.company.phone} | GST: ${data.company.gst}`]);
    ws_data.push([]); // Spacer

    // Invoice Title
    ws_data.push(['INVOICE']);
    ws_data.push([]);

    // Info Section (Mix of Bill To and Invoice Details)
    // Row: Bill To Label | | Invoice Details Label
    ws_data.push(['BILL TO', '', 'INVOICE DETAILS']);

    // Row: Name | | Inv No
    ws_data.push([data.invoice.customerName, '', 'Invoice No:', data.invoice.number]);
    // Row: Address | | Date
    ws_data.push([data.invoice.customerAddress, '', 'Date:', data.invoice.date]);
    // Row: Phone | | Time
    ws_data.push([`Ph: ${data.invoice.customerPhone}`, '', 'Time:', data.invoice.time]);
    // Row: End | | Pay Mode
    ws_data.push(['', '', 'Pay Mode:', data.invoice.paymentMode || 'Cash']);
    ws_data.push([]); // Spacer

    // Product Header
    const headerRow = ['S.No', 'Description', 'Qty', 'Price', 'Dis %', 'Amount'];
    ws_data.push(headerRow);

    // Products
    data.products.forEach(p => {
        ws_data.push([
            p.sNo,
            p.description,
            p.qty,
            p.price,
            p.discount,
            p.amount
        ]);
    });

    // Space after products
    ws_data.push([]);

    // Totals Section
    // Aligning to the right side generally
    ws_data.push(['', '', '', '', 'Subtotal', data.totals.subtotal]);
    ws_data.push(['', '', '', '', `SGST (${data.totals.gstRate / 2}%)`, data.totals.sgst]);
    ws_data.push(['', '', '', '', `CGST (${data.totals.gstRate / 2}%)`, data.totals.cgst]);
    ws_data.push(['', '', '', '', 'Round Off', data.totals.roundOff]);
    ws_data.push(['', '', '', '', 'GRAND TOTAL', data.totals.grandTotal]);
    ws_data.push(['', '', '', '', 'Paid Amount', data.totals.paidAmount]);
    ws_data.push(['', '', '', '', 'Balance', data.totals.balance]);

    ws_data.push([]);
    ws_data.push(['Amount in Words:', data.totals.amountInWords]);
    ws_data.push([]);

    // Footer
    ws_data.push(['Terms & Conditions:']);
    ws_data.push(['1. Goods once sold cannot be taken back.']);
    ws_data.push(['2. Warranty as per manufacturer policy.']);
    ws_data.push([]);
    ws_data.push(['Thank you for your business!']);

    // 2. Create Sheet
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // 3. Styling / Merges
    // Note: 'xlsx' (Community Edition) has limited styling capabilities (no bold/colors) without 'xlsx-style' or Pro.
    // We focus on Column Widths and Merges for layout.

    // Merge Company Header (Centered approx)
    // { s: {r: 0, c: 0}, e: {r: 0, c: 5} } -> Merge A1:F1
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }); // Company Name
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }); // Address
    ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }); // Phone/GST
    ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }); // INVOICE Title

    // Column Widths
    ws['!cols'] = [
        { wch: 8 },  // S.No
        { wch: 40 }, // Description (Wider)
        { wch: 10 }, // Qty
        { wch: 12 }, // Price
        { wch: 10 }, // Dis
        { wch: 15 }, // Amount
    ];

    // 4. Create Workbook & Export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice");

    // File Name
    const fileName = `Invoice_${data.invoice.number}.xlsx`;
    XLSX.writeFile(wb, fileName);
};
