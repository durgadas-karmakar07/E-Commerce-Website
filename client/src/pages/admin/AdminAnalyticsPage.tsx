import React, { useEffect, useState } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, ShoppingBag, 
  RotateCcw, Tag, Percent, Calendar 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, CartesianGrid, Legend 
} from 'recharts';
import { api } from '../../services/api';

export const AdminAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'month' | 'year'>('30days');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.getDetailedAnalytics(period);
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [period]);

  const summary = analytics?.summary || {
    grossSales: 89400,
    discounts: 4200,
    refunds: 1800,
    netSales: 83400,
    ordersCount: 38,
    avgOrderValue: 2350,
  };

  const chartData = analytics?.chartData || [
    { date: 'Day 1', revenue: 12000, orders: 5 },
    { date: 'Day 5', revenue: 18400, orders: 8 },
    { date: 'Day 10', revenue: 15200, orders: 6 },
    { date: 'Day 15', revenue: 24800, orders: 11 },
    { date: 'Day 20', revenue: 19000, orders: 8 },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" /> Revenue & Sales Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            In-depth analysis of gross revenue, promotional discount costs, return deductions, and net proceeds
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'year', label: 'This Year' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                period === item.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 block mb-1">Gross Sales</span>
          <span className="text-lg font-black text-white">
            ₹{summary.grossSales.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-emerald-400 block mb-1">Discounts Applied</span>
          <span className="text-lg font-black text-emerald-400">
            -₹{summary.discounts.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-rose-400 block mb-1">Refunds & Returns</span>
          <span className="text-lg font-black text-rose-400">
            -₹{summary.refunds.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-indigo-400 block mb-1 font-bold">Net Sales</span>
          <span className="text-lg font-black text-indigo-400">
            ₹{summary.netSales.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 block mb-1">Total Volume</span>
          <span className="text-lg font-black text-white">
            {summary.ordersCount} orders
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 block mb-1">Average Order Value</span>
          <span className="text-lg font-black text-white">
            ₹{Math.round(summary.avgOrderValue).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" /> Revenue & Order Volume Breakdown
        </h2>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend />
              <Area type="monotone" name="Revenue (₹)" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#areaRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
