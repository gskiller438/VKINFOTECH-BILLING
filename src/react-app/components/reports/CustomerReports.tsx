import { reportService } from '../../services/ReportService';
import { useEffect, useState } from 'react';

export default function CustomerReports() {
    const [customers, setCustomers] = useState<any[]>([]);

    useEffect(() => {
        // Fetch customers from localStorage via service
        // We'll simulate this by accessing localStorage directly for now as per service design
        try {
            const data = JSON.parse(localStorage.getItem('customers') || '[]');
            setCustomers(data);
        } catch {
            setCustomers([]);
        }
    }, []);

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Customer Performance</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-200">
                                <th className="pb-3 px-4">Customer Name</th>
                                <th className="pb-3 px-4">Phone</th>
                                <th className="pb-3 px-4 text-center">Total Orders</th>
                                <th className="pb-3 px-4 text-right">Total Spent</th>
                                <th className="pb-3 px-4 text-right">Last Purchase</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">No customer data available</td>
                                </tr>
                            ) : (
                                customers.map((c, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-800 font-medium">{c.name}</td>
                                        <td className="py-3 px-4 text-blue-600">{c.phone}</td>
                                        <td className="py-3 px-4 text-center text-gray-800">{c.totalOrders || 0}</td>
                                        <td className="py-3 px-4 text-right text-green-600 font-bold">₹{(c.totalPurchases || 0).toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-gray-500">{c.lastPurchaseDate || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
