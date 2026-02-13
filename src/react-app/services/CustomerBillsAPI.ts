/**
 * CustomerBillsAPI Service
 * 
 * Dedicated API service for customer bill history operations.
 * This service is ONLY for fetching and viewing historical bills.
 * 
 * DO NOT use this for creating or editing bills - use BillingAPI instead.
 */

import { CONFIG } from '../config';

export interface CustomerBill {
    id: string;
    invoiceNumber: string;
    customerId: string;
    date: string;
    time?: string;
    amount: number;
    paidAmount: number;
    balance: number;
    paymentMode: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    dueDate?: string;
    products?: any[];
    branch?: string;
    createdBy?: string;
}

const API_URL = CONFIG.API_BASE_URL;

export const CustomerBillsAPI = {
    /**
     * Fetch all bills for a specific customer
     * @param customerId - Customer ID
     * @returns Array of customer bills
     */
    getCustomerBills: async (customerId: string): Promise<CustomerBill[]> => {
        try {
            const response = await fetch(`${API_URL}/invoices/customer/${customerId}`);
            if (!response.ok) throw new Error('Failed to fetch customer invoices');
            return await response.json();
        } catch (error) {
            console.error('Error fetching customer bills:', error);
            return [];
        }
    },

    /**
     * Fetch a single bill by invoice ID
     * @param invoiceId - Invoice ID
     * @returns Single customer bill or null
     */
    getCustomerBill: async (invoiceId: string): Promise<CustomerBill | null> => {
        try {
            const response = await fetch(`${API_URL}/invoices/${invoiceId}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error fetching customer bill:', error);
            return null;
        }
    },

    /**
     * Get customer information by ID
     * @param customerId - Customer ID
     * @returns Customer object or null
     */
    getCustomer: async (customerId: string): Promise<any> => {
        try {
            const response = await fetch(`${API_URL}/customers/${customerId}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error fetching customer:', error);
            return null;
        }
    },

    /**
     * Fetch all invoices (for admin/summary views)
     * @returns Array of all invoices
     */
    getAllInvoices: async (): Promise<CustomerBill[]> => {
        try {
            const response = await fetch(`${API_URL}/invoices`);
            if (!response.ok) throw new Error('Failed to fetch invoices');
            return await response.json();
        } catch (error) {
            console.error('Error fetching all invoices:', error);
            return [];
        }
    },

    /**
     * Calculate customer statistics
     * @param customerId - Customer ID
     * @returns Customer statistics
     */
    getCustomerStats: async (customerId: string) => {
        // Since we don't have a stats endpoint yet, we fetch all bills and calculate
        const bills = await CustomerBillsAPI.getCustomerBills(customerId);

        const totalPurchases = bills.reduce((sum, bill) => sum + bill.amount, 0);
        const totalPaid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
        const totalDue = bills.reduce((sum, bill) => sum + bill.balance, 0);
        const unpaidBills = bills.filter(bill => bill.balance > 0);

        return {
            totalBills: bills.length,
            totalPurchases,
            totalPaid,
            totalDue,
            unpaidBillsCount: unpaidBills.length,
            lastBillDate: bills.length > 0 ? bills[0].date : null,
            lastBillNumber: bills.length > 0 ? bills[0].invoiceNumber : null
        };
    }
};
