import { InvoiceData } from '../types';
import { authService } from './AuthService';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.API_BASE_URL;

export const BillingAPI = {
    generateWordInvoice: async (data: InvoiceData) => {
        try {
            const user = authService.getCurrentUser();
            const enrichedData = {
                ...data,
                branch: user?.branch || 'Main',
                createdBy: user?.username || 'System'
            };

            const response = await fetch(`${API_BASE_URL}/generate-invoice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(enrichedData),
            });

            if (!response.ok) {
                throw new Error('Failed to generate invoice');
            }

            // Handle file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice_${data.invoiceNumber || 'New'}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return true;
        } catch (error) {
            console.error('Error generating Word invoice:', error);
            throw error;
        }
    },

    createInvoice: async (invoiceData: any) => {
        try {
            const user = authService.getCurrentUser();
            const enrichedData = {
                ...invoiceData,
                branch: user?.branch || 'Main',
                createdBy: user?.username || 'System'
            };

            const response = await fetch(`${API_BASE_URL}/invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(enrichedData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown Error' }));
                throw new Error(errorData.error || errorData.details || 'Failed to create invoice');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating invoice:', error);
            throw error;
        }
    }
};
