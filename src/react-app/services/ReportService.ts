import { type Invoice, type Customer, type Product } from '../components/types'; // Assuming types are moved here or I will redefine local ones for now and refactor later if needed to shared types.

// Redefining types based on Billing.tsx usage for independence, or I can check types.ts
// Let's check shared/types.ts first in the next step, but for now I'll implement with generic 'any' or defined interfaces then align.
// Actually, I'll define the interfaces used in the service right here to be self-contained for now or import if I find them.

export interface ReportSummary {
    totalSales: number;
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    profit: number; // Placeholder calculation
    stockValue: number;
}

export interface SalesReportParams {
    startDate?: Date;
    endDate?: Date;
    paymentMode?: string;
    customerId?: string;
}

export class ReportService {
    private getInvoices(): any[] {
        try {
            return JSON.parse(localStorage.getItem('invoices') || '[]');
        } catch {
            return [];
        }
    }

    private getCustomers(): any[] {
        try {
            return JSON.parse(localStorage.getItem('customers') || '[]');
        } catch {
            return [];
        }
    }

    // Helper to fetch products is tricky because Billing.tsx has them hardcoded in the component.
    // I should probably move the hardcoded products to a shared constant or localStorage if they aren't there.
    // Inspection of Billing.tsx showed `availableProducts` hardcoded.
    // BUT the invoice saves the product details at time of sale.
    // For Stock Reports, I might need the current product list. Assumed to be in 'products' key if managed, but Billing.tsx holds them.
    // I will assume for now we only have what's in invoices or customers, and I might need to extract unique products from invoices 
    // OR the user might have a Products page that saves them. 
    // Let's check Products.tsx content later. 
    // For now I will focus on Invoice/Customer derived data.

    // NOTE: In a real app, this would be API calls.

    getSummaryMetrics(): ReportSummary {
        const invoices = this.getInvoices();
        const customers = this.getCustomers();

        const totalSales = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const totalOrders = invoices.length;
        const totalCustomers = customers.length;

        // Profit placeholder: assuming 20% margin for now as we don't have cost price in schema yet
        const profit = totalSales * 0.2;

        // Stock value - strict dependency on a Products source. 
        // I'll try to read 'products' from localStorage, assuming the Products page saves there.
        let stockValue = 0;
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            stockValue = products.reduce((sum: number, p: any) => sum + ((p.price || 0) * (p.stock || 0)), 0);
        } catch { }

        return {
            totalSales,
            totalRevenue: totalSales, // Revenue ≈ Sales for this context usually
            totalOrders,
            totalCustomers,
            profit,
            stockValue
        };
    }

    getSalesReport(params: SalesReportParams) {
        let invoices = this.getInvoices();

        // Filters
        if (params.startDate) {
            invoices = invoices.filter(inv => new Date(inv.date) >= params.startDate!);
        }
        if (params.endDate) {
            invoices = invoices.filter(inv => new Date(inv.date) <= params.endDate!);
        }

        // Aggregate by Date
        const salesByDate: Record<string, number> = {};
        invoices.forEach(inv => {
            // inv.date is localized string "dd/mm/yyyy" or similar from Billing.tsx?
            // Billing.tsx: new Date().toLocaleDateString('en-IN') -> "dd/mm/yyyy"
            // Need to parse correctly.
            const date = inv.date;
            salesByDate[date] = (salesByDate[date] || 0) + inv.amount;
        });

        return Object.entries(salesByDate).map(([date, amount]) => ({ date, amount }));
    }

    getTopSellingProducts() {
        const invoices = this.getInvoices();
        const productSales: Record<string, number> = {};

        invoices.forEach(inv => {
            if (inv.products && Array.isArray(inv.products)) {
                inv.products.forEach((p: any) => {
                    productSales[p.name] = (productSales[p.name] || 0) + (p.quantity || 0);
                });
            }
        });

        return Object.entries(productSales)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }

    getRecentTransactions() {
        const invoices = this.getInvoices();
        return invoices.slice(-5).reverse();
    }

    // Financials
    getFinancialSummary() {
        const invoices = this.getInvoices();
        const totalGST = invoices.reduce((sum, inv) => {
            // Re-calculate GST from amount if not saved explicitly, but Billing.tsx saves 'grandTotal' which includes GST.
            // Formula in Billing: subtotal * 1.18 = grandTotal => GST = grandTotal - (grandTotal / 1.18)
            const gstComponent = inv.amount - (inv.amount / 1.18);
            return sum + gstComponent;
        }, 0);

        return {
            totalGST,
            netRevenue: invoices.reduce((sum, inv) => sum + (inv.amount / 1.18), 0)
        };
    }
}

export const reportService = new ReportService();
