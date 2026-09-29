import React, { useEffect, useState } from 'react';
import { RotateCcw, Check, X, DollarSign, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { ReturnRequest } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminReturns();
      if (res.success && res.data) {
        setReturns(res.data);
      }
    } catch (err) {
      console.error('Failed to load return requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleUpdateStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      const res = await api.updateReturnStatus(id, { status, adminNotes });
      if (res.success) {
        addToast(`Return status set to ${status}.`, 'success');
        fetchReturns();
      } else {
        addToast(res.message || 'Failed to update return', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Error updating return', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-rose-400" /> Returns & Refunds Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review customer claims, verify return eligibility, approve replacements, and record verified refunds
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading return claims...</div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No return requests filed by customers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Claim ID & Date</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Reason & Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {returns.map((ret) => (
                  <tr key={ret._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-white block">
                        #{ret._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(ret.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-indigo-400">
                      {ret.order?.orderNumber || 'Order'}
                    </td>

                    <td className="py-3 px-4 text-slate-200">
                      <span className="font-semibold block">{ret.user?.name || 'Customer'}</span>
                      <span className="text-[10px] text-slate-500">{ret.user?.email}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-xs">
                      <span className="font-bold text-rose-400 uppercase text-[10px] block">
                        {ret.reason.replace('_', ' ')}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {ret.customerComments || 'No comment provided'}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ret.status === 'refunded' ? 'bg-emerald-500/20 text-emerald-400' :
                        ret.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                        ret.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {ret.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      {ret.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(ret._id, 'approved', 'Approved by admin')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(ret._id, 'rejected', 'Does not meet 7-day criteria')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-xs font-semibold"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {ret.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ret._id, 'refunded', 'Refund credited via payment gateway')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          Process Refund
                        </button>
                      )}
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

export default AdminReturnsPage;
