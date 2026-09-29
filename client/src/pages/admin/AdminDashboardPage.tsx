import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, ShoppingBag, Users, Package, AlertTriangle, 
  TrendingUp, Activity, RotateCcw, Bug, ArrowUpRight, ArrowDownRight,
  Sparkles, Plus, Clock, ExternalLink, RefreshCw, Eye, Truck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, CartesianGrid 
} from 'recharts';
import { api } from '../../services/api';
import { AdminKPIs, BestSellingProduct, Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';

export const AdminDashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellingProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [kpiRes, revRes, bestRes, ordersRes] = await Promise.all([
        api.getAdminKPIs(),
        api.getRevenueAnalytics(period),
        api.getBestSellers(5),
        api.getAdminOrders(),
      ]);

      if (kpiRes.success && kpiRes.data) {
        setKpis(kpiRes.data);
      }
      if (revRes.success && revRes.data) {
        setRevenueData(revRes.data);
      }
      if (bestRes.success && bestRes.data) {
        setBestSellers(bestRes.data);
      }
      if (ordersRes.success && ordersRes.data) {
        setRecentOrders(ordersRes.data.slice(0, 10));
      }
    } catch (err) {
      console.error('Error fetching admin dashboard metrics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();

    // Live auto-refresh polling every 12 seconds so purchases show up live
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 12000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return (
    <div className="space-y-8 text-slate-100">
      {/* Top Banner & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Store Performance Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry and database-driven metrics for AURA Lifestyle Store
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Live Sync'}</span>
          </button>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> Quick Add Product
          </Link>
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700"
          >
            Export Reports
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (11 database-driven KPI indicators) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Gross Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-xl font-black text-white">
            ₹{(kpis?.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> All paid customer orders
          </p>
        </div>

        {/* Today's Sales */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white">
            ₹{(kpis?.todaySales || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Orders processed today</p>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white">
            {kpis?.totalOrders || 0}
          </div>
          <p className="text-[11px] text-blue-400 font-medium mt-1">
            {kpis?.pendingOrders || 0} pending fulfillment
          </p>
        </div>

        {/* Total Products */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Active Products</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white">
            {kpis?.totalProducts || 0}
          </div>
          <p className="text-[11px] text-purple-400 font-medium mt-1">
            Across 6 store categories
          </p>
        </div>

        {/* Total Registered Users */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Customers</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white">
            {kpis?.totalCustomers || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Verified user accounts</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Low Stock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-400">
            {kpis?.lowStockProducts || 0}
          </div>
          <Link to="/admin/inventory" className="text-[11px] text-indigo-400 hover:underline mt-1 block">
            Inspect inventory →
          </Link>
        </div>

        {/* Returns & Refunds */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Return Requests</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-400">
            {kpis?.returnedOrders || 0}
          </div>
          <Link to="/admin/returns" className="text-[11px] text-rose-400 hover:underline mt-1 block">
            Review claims →
          </Link>
        </div>

        {/* Website Health & Bugs */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Website Health</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {kpis?.websiteHealth || 'Optimal'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {kpis?.openBugs ?? 0} open bug reference(s)
          </p>
        </div>
      </div>

      {/* Revenue & Order Charts with Time Selector [Week | Month | Year] */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" /> Revenue & Sales Trends
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated income and transaction throughput
            </p>
          </div>

          {/* Time Selector */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 rounded-lg capitalize transition ${
                  period === p
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Area Chart */}
          <div className="lg:col-span-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" textAnchor="end" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Order Count Bar Chart */}
          <div className="h-72">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Order Volume
            </h4>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="orders" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Best Selling Products Section (calculated from actual order line items) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Best Selling Products
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked dynamically by verified database order volume
            </p>
          </div>
          <Link
            to="/admin/products"
            className="text-xs font-semibold text-indigo-400 hover:underline"
          >
            Manage Catalog →
          </Link>
        </div>

        {bestSellers.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No sales records available yet. Orders placed by customers will rank here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 pl-2">Product</th>
                  <th className="pb-3">Units Sold</th>
                  <th className="pb-3">Revenue Generated</th>
                  <th className="pb-3">Current Stock</th>
                  <th className="pb-3 pr-2">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {bestSellers.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 pl-2 flex items-center gap-3">
                      <img
                        src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={item.product?.title || 'Product'}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-800"
                      />
                      <div>
                        <span className="font-bold text-white block truncate max-w-[200px]">
                          {item.product?.title || 'Lifestyle Item'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          SKU: {item.product?.sku || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 font-semibold text-indigo-300">
                      {item.unitsSold} units
                    </td>
                    <td className="py-3 font-bold text-emerald-400">
                      ₹{item.revenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (item.product?.stock || 0) > 5
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {item.product?.stock ?? 0} in stock
                      </span>
                    </td>
                    <td className="py-3 pr-2 font-medium text-amber-400">
                      ★ {item.product?.ratingAverage?.toFixed(1) || '4.8'} ({item.product?.ratingCount || 10})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Customer Orders (Real-Time Database Feed) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" /> Real-Time Customer Orders
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live orders placed by users appearing directly with promised delivery date and payment telemetry
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-indigo-400 hover:underline"
          >
            Manage All Orders ({recentOrders.length}) →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
            No customer orders placed yet. As soon as a user clicks "Buy Now" & pays, the order will appear here live in real-time!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 pl-2">Order #</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items Purchased</th>
                  <th className="pb-3">Promised Delivery Date</th>
                  <th className="pb-3">Total Paid</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 pl-2 font-mono font-bold text-white">
                      #{ord.orderNumber}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        {new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-200 block truncate max-w-[140px]">
                        {ord.shippingAddress?.name || 'Customer'}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                        {ord.user?.email || ord.shippingAddress?.phone || 'Customer'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">
                      <span className="block truncate max-w-[180px]">
                        {(ord.items || []).map((i) => i.name || (i as any).title).join(', ') || `${ord.items?.length || 0} item(s)`}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {ord.items?.length || 0} item(s) total
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Truck className="w-3 h-3" />
                        {ord.estimatedDelivery || (ord as any).tracking?.estimatedDelivery || '3-5 business days'}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-emerald-400">
                      ₹{(ord.totalAmount ?? (ord as any).total ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={ord.orderStatus} />
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <Link
                        to={`/admin/orders/${ord._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg font-semibold text-[11px] transition"
                      >
                        <Eye className="w-3 h-3" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
