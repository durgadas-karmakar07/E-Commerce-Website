import React, { useEffect, useState } from 'react';
import { Users, Search, Shield, Ban, CheckCircle, Mail, Phone, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminCustomers();
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleStatus = async (customer: any) => {
    const newStatus = !customer.isActive;
    try {
      const res = await api.updateCustomerStatus(customer._id, newStatus);
      if (res.success) {
        addToast(`Customer account ${newStatus ? 'activated' : 'suspended'}.`, 'info');
        fetchCustomers();
      } else {
        addToast(res.message || 'Failed to update customer status', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Error updating status', 'error');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> Customer Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered shopper profiles, order frequency, total lifetime spend, and account access ({customers.length} total)
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 text-xs text-white rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading customer records...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Registered On</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Total Spend</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCustomers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                        {cust.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{cust.name}</span>
                        <span className="text-[10px] text-slate-500 capitalize">{cust.role}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-300 block flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500" /> {cust.email}
                      </span>
                      {cust.phone && (
                        <span className="text-slate-400 block text-[10px] mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" /> {cust.phone}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {new Date(cust.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="py-3 px-4 font-semibold text-white">
                      {cust.orderCount ?? 0}
                    </td>

                    <td className="py-3 px-4 font-bold text-emerald-400">
                      ₹{(cust.totalSpent || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cust.isActive !== false
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {cust.isActive !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {cust.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cust)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            cust.isActive !== false
                              ? 'bg-slate-800 text-rose-400 hover:bg-rose-950/40'
                              : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                          }`}
                        >
                          {cust.isActive !== false ? 'Suspend Access' : 'Reactivate'}
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

export default AdminCustomersPage;
