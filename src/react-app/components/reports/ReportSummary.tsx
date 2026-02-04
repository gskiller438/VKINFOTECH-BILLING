import { TrendingUp, Users, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { type ReportSummary as SummaryType } from '../../services/ReportService';

interface ReportSummaryProps {
    data: SummaryType;
}

export default function ReportSummary({ data }: ReportSummaryProps) {
    const cards = [
        {
            label: 'Total Sales',
            value: `₹${data.totalSales.toLocaleString()}`,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-200'
        },
        {
            label: 'Total Orders',
            value: data.totalOrders.toLocaleString(),
            icon: ShoppingCart,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200'
        },
        {
            label: 'Total Customers',
            value: data.totalCustomers.toLocaleString(),
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-200'
        },
        {
            label: 'Est. Profit',
            value: `₹${data.profit.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            border: 'border-yellow-200'
        },
        {
            label: 'Stock Value',
            value: `₹${data.stockValue.toLocaleString()}`,
            icon: Package,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div key={index} className={`${card.bg} border ${card.border} p-4 rounded-xl shadow-sm bg-white`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-semibold">{card.label}</p>
                                <h3 className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</h3>
                            </div>
                            <div className={`p-2 rounded-lg ${card.bg.replace('50', '100')}`}>
                                <Icon size={20} className={card.color} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
