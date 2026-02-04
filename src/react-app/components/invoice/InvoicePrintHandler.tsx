import { createRoot } from 'react-dom/client';
import InvoiceTemplate, { CompanyDetails, InvoiceData } from './InvoiceTemplate';
import { flushSync } from 'react-dom';

export const handlePrintInvoice = (company: CompanyDetails, data: InvoiceData) => {
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Write base HTML with styles
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - ${data.invoiceNumber}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @page { size: A4; margin: 0; }
                body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
            </style>
        </head>
        <body>
            <div id="print-root"></div>
        </body>
        </html>
    `);
    doc.close();

    // Render the React Template into the iframe
    // Use setTimeout to ensure Tailwind loads (simplest way without complex build pipeline integration for iframe)
    // A better way in production is to copy the <style> tags from the main document to this iframe.

    // Copy styles from main window to iframe
    const styleTags = document.querySelectorAll('style, link[rel="stylesheet"]');
    styleTags.forEach(tag => {
        doc.head.appendChild(tag.cloneNode(true));
    });

    const root = createRoot(doc.getElementById('print-root')!);

    // We flushSync to ensure render happens before we try to print
    flushSync(() => {
        root.render(<InvoiceTemplate company={company} data={data} />);
    });

    // Wait for images/styles to load then print
    iframe.onload = () => {
        setTimeout(() => {
            iframe.contentWindow?.print();
            // Cleanup after print dialog usage (approximate, since print blocks execution in most browsers)
            // But removing immediately might break it in some browsers if not catching the event.
            // Safe to leave or remove on next action.
            // document.body.removeChild(iframe); 
        }, 500);
    };

    // Fallback if onload doesn't trigger correctly or for safety
    setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // document.body.removeChild(iframe);
    }, 1000);
};
