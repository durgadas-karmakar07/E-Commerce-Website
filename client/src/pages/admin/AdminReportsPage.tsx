import React, { useState } from 'react';
import { 
  FileSpreadsheet, Download, Printer, Calendar, 
  ShoppingBag, Users, Boxes, RotateCcw, DollarSign 
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleExportCSV = async (type: string) => {
    setDownloading(type);
    try {
      const response = await api.getReportCSV(type);
      // Trigger browser download
      const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `aura-${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`Downloaded ${type} report CSV successfully.`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to generate report export', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const reportTypes = [
    {
      id: 'sales',
      title: 'Sales & Revenue Report',
      desc: 'Itemized transaction revenues, product order volume, tax collections, and coupon usage.',
      icon: DollarSign,
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'orders',
      title: 'Orders & Fulfillment Log',
      desc: 'Complete delivery logs, carrier tracking numbers, order statuses, and customer shipping details.',
      icon: ShoppingBag,
      color: 'text-indigo-400 bg-indigo-500/10',
    },
    {
      id: 'inventory',
      title: 'Inventory Stock Valuation',
      desc: 'Stock level audits, out-of-stock items, safety buffer thresholds, and inventory cost valuations.',
      icon: Boxes,
      color: 'text-amber-400 bg-amber-500/10',
    },
    {
      id: 'customers',
      title: 'Customer Demographics & Spend',
      desc: 'Customer registrations, active account states, total lifetime spent, and order frequency.',
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10',
    },
    {
      id: 'returns',
      title: 'Returns & Refund Audit Log',
      desc: 'Breakdown of customer claims, defective return reasons, and payment refunds.',
      icon: RotateCcw,
      color: 'text-rose-400 bg-rose-500/10',
    },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-400" /> Export Business Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate and download standard CSV sheets and spreadsheet reports for accounting and logistics
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition border border-slate-700"
        >
          <Printer className="w-4 h-4" /> Print Overview
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((rep) => {
          const Icon = rep.icon;
          const isBusy = downloading === rep.id;

          return (
            <div
              key={rep.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${rep.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                    .CSV
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm mb-1">{rep.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">{rep.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => handleExportCSV(rep.id)}
                disabled={isBusy}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isBusy ? 'Generating CSV...' : 'Download CSV Export'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminReportsPage;
