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
}

class StockService {
    private STORAGE_KEY = 'stock_logs';

    getAllLogs(): StockLog[] {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    addLog(log: StockLog): void {
        const logs = this.getAllLogs();
        logs.unshift(log); // Add to top
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    }

    getLogsByProduct(productId: string): StockLog[] {
        return this.getAllLogs().filter(log => log.productId === productId);
    }
}

export const stockService = new StockService();
