import React, { useEffect, useState } from 'react';
import { Tag, Plus, Edit3, Trash2, X, Check, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Coupon } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(999);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(500);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const { addToast } = useToast();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminCoupons();
      if (res.success && res.data) {
        setCoupons(res.data);
      }
    } catch (err) {
      console.error('Failed to load coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAddModal = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinOrderAmount(999);
    setMaxDiscountAmount(500);
    setUsageLimit(100);
    setDescription('');
    setExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setIsActive(true);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Coupon) => {
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderAmount(c.minOrderAmount || 0);
    setMaxDiscountAmount(c.maxDiscountAmount || 0);
    setUsageLimit(c.usageLimit || 0);
    setDescription(c.description || '');
    setExpiresAt(c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '');
    setIsActive(c.isActive);
    setEditingId(c._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSaving(true);
    try {
      const payload: any = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount),
        maxDiscountAmount: discountType === 'percentage' ? Number(maxDiscountAmount) : undefined,
        usageLimit: Number(usageLimit),
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isActive,
      };

      if (editingId) {
        const res = await api.updateCoupon(editingId, payload);
        if (res.success) {
          addToast('Coupon updated successfully!', 'success');
          setIsModalOpen(false);
          fetchCoupons();
        } else {
          addToast(res.message || 'Failed to update coupon', 'error');
        }
      } else {
        const res = await api.createCoupon(payload);
        if (res.success) {
          addToast('New coupon created successfully!', 'success');
          setIsModalOpen(false);
          fetchCoupons();
        } else {
          addToast(res.message || 'Failed to create coupon', 'error');
        }
      }
    } catch (err: any) {
      addToast(err.message || 'Error saving coupon', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!window.confirm(`Delete coupon "${couponCode}"?`)) return;
    try {
      const res = await api.deleteCoupon(id);
      if (res.success) {
        addToast('Coupon deleted.', 'info');
        fetchCoupons();
      } else {
        addToast(res.message || 'Failed to delete coupon', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Error deleting coupon', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-indigo-400" /> Coupons & Discount Vouchers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure server-validated percentage and flat discount codes for customer checkout
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No active coupons configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount Value</th>
                  <th className="py-3 px-4">Min Order</th>
                  <th className="py-3 px-4">Usage Count</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-extrabold text-sm text-indigo-400 block tracking-wider">
                        {c.code}
                      </span>
                      <span className="text-[10px] text-slate-400">{c.description || 'General store promo'}</span>
                    </td>

                    <td className="py-3 px-4 font-bold text-white">
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                      {c.maxDiscountAmount && c.discountType === 'percentage' && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          (Cap: ₹{c.maxDiscountAmount})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      ₹{c.minOrderAmount?.toLocaleString('en-IN') || 0}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {c.usedCount || 0} / {c.usageLimit || '∞'}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'No expiry'}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c._id, c.code)}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-300 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {editingId ? 'Edit Coupon' : 'Create Promotional Coupon'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure checkout discount rules and minimum purchase limits
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE25"
                  className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={discountType === 'fixed'}
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Usage Limit (Total)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                />
                <label htmlFor="couponActive" className="text-xs text-slate-300">
                  Enable coupon for customer checkout
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
