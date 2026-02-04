import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { reportService } from '../../services/ReportService';
import { useEffect, useState } from 'react';

export default function StockReports() {
    // In a real app, this would come from the inventory database.
    // For now, we visualize the hardcoded/local products if available, or show a placeholder.
    const [stockData, setStockData] = useState<any[]>([]);

    useEffect(() => {
        // Mocking stock data for visualization since we don't have a centralized product DB yet
        // In the future: reportService.getStockLevels()
        setStockData([
            { name: 'Samsung TV', stock: 12, min: 5 },
            { name: 'iPhone 15', stock: 5, min: 10 },
            { name: 'HP Laptop', stock: 8, min: 5 },
            { name: 'Sony Headphone', stock: 25, min: 15 },
            { name: 'Dell Monitor', stock: 10, min: 5 },
        ]);
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stock Levels Chart */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Current Stock Levels</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stockData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#1f2937' }}
                                />
                                <Bar dataKey="stock" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Low Stock Alert Table */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Low Stock Alerts</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-200">
                                    <th className="pb-3 px-2">Product</th>
                                    <th className="pb-3 px-2 text-right">Current</th>
                                    <th className="pb-3 px-2 text-right">Min Level</th>
                                    <th className="pb-3 px-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockData.map((p, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-2 text-gray-800 font-medium">{p.name}</td>
                                        <td className="py-3 px-2 text-right text-gray-800 font-bold">{p.stock}</td>
                                        <td className="py-3 px-2 text-right text-gray-500">{p.min}</td>
                                        <td className="py-3 px-2 text-center">
                                            {p.stock <= p.min ? (
                                                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-semibold">Low</span>
                                            ) : (
                                                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-semibold">OK</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
