import React, { useEffect, useState } from 'react';
import { 
  Boxes, AlertTriangle, ArrowUpDown, History, Plus, 
  Minus, RefreshCw, X, Check, Search, ShieldAlert 
} from 'lucide-react';
import { api } from '../../services/api';
import { Product } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminInventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'levels' | 'history'>('levels');
  
  // Stock Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Restock shipment received');
  const [saving, setSaving] = useState(false);

  const { addToast } = useToast();

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [prodRes, histRes] = await Promise.all([
        api.getAdminProducts(),
        api.getInventoryTransactions(),
      ]);
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data);
      }
      if (histRes.success && histRes.data) {
        setTransactions(histRes.data);
      }
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSaving(true);
    try {
      let finalNewStock = selectedProduct.stock;
      if (adjustmentType === 'add') finalNewStock += adjustmentAmount;
      else if (adjustmentType === 'subtract') finalNewStock = Math.max(0, finalNewStock - adjustmentAmount);
      else if (adjustmentType === 'set') finalNewStock = Math.max(0, adjustmentAmount);

      const res = await api.adjustInventoryStock({
        productId: selectedProduct._id,
        quantity: finalNewStock,
        type: adjustmentType,
        reason: adjustmentReason,
      });

      if (res.success) {
        addToast(`Inventory for ${selectedProduct.title} updated to ${finalNewStock} units.`, 'success');
        setSelectedProduct(null);
        fetchInventory();
      } else {
        addToast(res.message || 'Failed to update stock', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Error updating stock', 'error');
    } finally {
      setSaving(false);
    }
  };

  const lowStockCount = products.filter((p) => p.stock <= (p.lowStockThreshold || 5) && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-400" /> Stock & Inventory Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time SKU availability, threshold alerts, and audit-logged adjustments
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'levels'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Stock Levels
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit History ({transactions.length})
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Total Catalog Units</span>
          <span className="text-2xl font-black text-white">
            {products.reduce((acc, p) => acc + (p.stock || 0), 0)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Across all variants</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-amber-400 block mb-1">Low Stock Warning</span>
          <span className="text-2xl font-black text-amber-400">{lowStockCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">&le; minimum threshold</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-rose-400 block mb-1">Out of Stock</span>
          <span className="text-2xl font-black text-rose-400">{outOfStockCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Requires immediate restocking</span>
        </div>
      </div>

      {/* Main Content: Levels vs History */}
      {activeTab === 'levels' ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU / Product</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Stock Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {products.map((p) => {
                  const isOut = p.stock === 0;
                  const isLow = p.stock <= (p.lowStockThreshold || 5) && p.stock > 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt={p.title}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-white block truncate max-w-xs">{p.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-sm text-white">
                        {p.stock}
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {p.lowStockThreshold || 5}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOut ? 'bg-red-500/20 text-red-400' :
                          isLow ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Adequate'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            setAdjustmentAmount(10);
                            setAdjustmentType('add');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <RefreshCw className="w-3 h-3" /> Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Inventory History Audit Table */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Adjustment</th>
                  <th className="py-3 px-4">Reason / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                      No stock adjustments recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(tx.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {tx.product?.title || 'Product'}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-indigo-400">
                        {tx.type}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={tx.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({tx.previousStock} &rarr; {tx.newStock})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {tx.reason || 'Manual adjustment'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              Adjust Inventory Stock
            </h3>
            <p className="text-xs text-slate-400 mb-4 truncate">
              {selectedProduct.title} (Current: <strong>{selectedProduct.stock}</strong> units)
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adjustment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('add')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      adjustmentType === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    + Add Units
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('subtract')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      adjustmentType === 'subtract'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    - Deduct
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('set')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      adjustmentType === 'set'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    = Set Total
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 mb-2"
                >
                  <option value="Restock shipment received">Restock shipment received</option>
                  <option value="Damaged / expired goods discarded">Damaged / expired goods discarded</option>
                  <option value="Physical audit inventory count correction">Physical audit inventory count correction</option>
                  <option value="Supplier exchange / returned to vendor">Supplier exchange / returned to vendor</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryPage;
