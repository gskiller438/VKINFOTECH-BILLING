import { authService } from './AuthService';
import { CONFIG } from '../config';

export interface StockLog {
    id: string;
    productId: string;
    productName: string;
    oldStock: number;
    newStock: number;
    changeType: 'IN' | 'OUT';
    quantity: number;
    reason: string;
    remarks: string;
    updatedBy: string;
    dateTime: string;
    branch?: string;
}

class StockService {
    private API_URL = `${CONFIG.API_BASE_URL}/stock-logs`;

    async getAllLogs(): Promise<StockLog[]> {
        try {
            const response = await fetch(this.API_URL);
            if (!response.ok) throw new Error('Failed to fetch logs');
            return await response.json();
        } catch (error) {
            console.error('Error fetching stock logs:', error);
            return [];
        }
    }

    async addLog(log: Omit<StockLog, 'id' | 'dateTime' | 'updatedBy' | 'branch'>): Promise<void> {
        try {
            const user = authService.getCurrentUser();
            const newLog = {
                ...log,
                id: `L${Date.now()}`,
                dateTime: new Date().toLocaleString('en-IN'),
                updatedBy: user?.username || 'System',
                branch: user?.branch || 'Main'
            };

            await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLog)
            });
        } catch (error) {
            console.error('Error adding stock log:', error);
        }
    }

    async getLogsByProduct(productId: string): Promise<StockLog[]> {
        try {
            const response = await fetch(`${this.API_URL}/product/${productId}`);
            if (!response.ok) throw new Error('Failed to fetch product logs');
            return await response.json();
        } catch (error) {
            console.error('Error fetching logs by product:', error);
            return [];
        }
    }
}

export const stockService = new StockService();
