import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  // Placeholder data for charts
  const dailySalesData = [
    { date: '01', sales: 12000 },
    { date: '02', sales: 15000 },
    { date: '03', sales: 13000 },
    { date: '04', sales: 18000 },
    { date: '05', sales: 16000 },
    { date: '06', sales: 20000 },
    { date: '07', sales: 22000 },
  ];

  const monthlySalesData = [
    { month: 'Jan', sales: 250000 },
    { month: 'Feb', sales: 280000 },
    { month: 'Mar', sales: 320000 },
    { month: 'Apr', sales: 310000 },
    { month: 'May', sales: 350000 },
    { month: 'Jun', sales: 380000 },
  ];

  const productSalesData = [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 25 },
    { name: 'Groceries', value: 20 },
    { name: 'Furniture', value: 15 },
    { name: 'Others', value: 5 },
  ];

  const recentInvoices = [
    { id: 'INV-001', customer: 'John Doe', date: '2024-01-15', amount: 5400, status: 'Paid' },
    { id: 'INV-002', customer: 'Jane Smith', date: '2024-01-15', amount: 3200, status: 'Paid' },
    { id: 'INV-003', customer: 'Bob Johnson', date: '2024-01-14', amount: 7800, status: 'Pending' },
    { id: 'INV-004', customer: 'Alice Brown', date: '2024-01-14', amount: 2100, status: 'Paid' },
    { id: 'INV-005', customer: 'Charlie Wilson', date: '2024-01-13', amount: 4500, status: 'Paid' },
  ];

  const topProducts = [
    { name: 'Samsung LED TV 43"', brand: 'Samsung', sold: 45, stock: 12, status: 'Available' },
    { name: 'iPhone 15 Pro', brand: 'Apple', sold: 38, stock: 5, status: 'Low Stock' },
    { name: 'HP Laptop i5', brand: 'HP', sold: 32, stock: 0, status: 'Out of Stock' },
    { name: 'Sony Headphones', brand: 'Sony', sold: 28, stock: 25, status: 'Available' },
    { name: 'Dell Monitor 27"', brand: 'Dell', sold: 22, stock: 8, status: 'Low Stock' },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const statCards = [
    {
      title: "Today's Sales",
      value: '₹22,000',
      change: '+12.5%',
      icon: DollarSign,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
    },
    {
      title: 'Monthly Sales',
      value: '₹3,80,000',
      change: '+8.2%',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      title: 'Total Orders',
      value: '1,245',
      change: '+15.3%',
      icon: ShoppingCart,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    },
    {
      title: 'Total Products',
      value: '523',
      change: '+5.1%',
      icon: Package,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="Untitled design.png" alt="Logo" className="w-10 h-10 object-contain p-1 bg-white rounded-lg shadow-sm" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back! Here's your business overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          <Calendar className="text-gray-500" size={20} />
          <span className="text-gray-700 font-medium">January 15, 2024</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg shadow-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
                <span className="text-green-500 text-sm font-semibold">{card.change}</span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Sales Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Sales Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Sales Distribution & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Sales Pie Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Product-wise Sales Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productSalesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {productSalesData.map((_item, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-yellow-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Low Stock Alerts</h2>
          </div>
          <div className="space-y-3">
            {topProducts.filter(p => p.status !== 'Available').map((product) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-gray-800 font-semibold">{product.name}</p>
                  <p className="text-gray-500 text-sm">{product.brand}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${product.status === 'Out of Stock' ? 'text-red-500' : 'text-yellow-500'}`}>
                    {product.status}
                  </p>
                  <p className="text-gray-400 text-xs">Stock: {product.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Invoices</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-500 font-semibold">Invoice ID</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-semibold">Customer</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-semibold">Amount</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 text-gray-800 font-medium">{invoice.id}</td>
                    <td className="py-3 px-2 text-gray-600">{invoice.customer}</td>
                    <td className="py-3 px-2 text-gray-800 font-semibold">₹{invoice.amount.toLocaleString()}</td>
                    <td className="py-3 px-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${invoice.status === 'Paid' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-500 font-semibold">Product</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-semibold">Sold</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-semibold">Stock</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.name} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2">
                      <p className="text-gray-800 font-medium">{product.name}</p>
                      <p className="text-gray-500 text-xs">{product.brand}</p>
                    </td>
                    <td className="py-3 px-2 text-gray-800 font-semibold">{product.sold}</td>
                    <td className="py-3 px-2 text-gray-600">{product.stock}</td>
                    <td className="py-3 px-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.status === 'Available'
                        ? 'bg-green-500/20 text-green-300'
                        : product.status === 'Low Stock'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                        }`}>
                        {product.status}
                      </span>
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
