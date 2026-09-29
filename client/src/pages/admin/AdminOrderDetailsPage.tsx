import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Package, Truck, MapPin, CreditCard, 
  Save, AlertCircle, Clock 
} from 'lucide-react';
import { api } from '../../services/api';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import OrderTimeline from '../../components/common/OrderTimeline';
import { useToast } from '../../context/ToastContext';

export const AdminOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Status transition state
  const [status, setStatus] = useState<string>('confirmed');
  const [carrier, setCarrier] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const { addToast } = useToast();

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getOrderById(id);
      if (res.success && res.data) {
        setOrder(res.data);
        setStatus(res.data.orderStatus);
        setCarrier(res.data.shippingCarrier || 'BlueDart Logistics');
        setTrackingNumber(res.data.trackingNumber || '');
      }
    } catch (err) {
      console.error('Failed to load order', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setSaving(true);
    try {
      const res = await api.updateOrderStatus(order._id, {
        status,
        carrier,
        trackingNumber,
        note,
      });

      if (res.success) {
        addToast('Order fulfillment status successfully updated!', 'success');
        fetchOrder();
      } else {
        addToast(res.message || 'Failed to update order', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Error updating order', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-xs">Loading order record...</div>;
  }

  if (!order) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-100">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-lg">Order Not Found</h3>
        <Link to="/admin/orders" className="text-xs text-indigo-400 hover:underline mt-2 inline-block">
          Return to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white font-mono">
                Order #{order.orderNumber}
              </h1>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Stepper Preview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-sm">
          <Truck className="w-4 h-4 text-indigo-400" /> Tracking Progress Timeline
        </h3>
        <OrderTimeline currentStatus={order.orderStatus} trackingTimeline={order.trackingTimeline} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Line items and total */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold text-white mb-4 pb-3 border-b border-slate-800 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" /> Items in Order ({order.items.length})
            </h3>
            <div className="divide-y divide-slate-800">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0"
                    />
                    <div>
                      <h4 className="font-semibold text-white text-xs">{item.name}</h4>
                      {item.variant && (
                        <p className="text-[10px] text-slate-400">
                          {item.variant.name}: {item.variant.value}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-white text-xs">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({order.couponCode || 'Coupon'})</span>
                  <span>- ₹{order.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-white">{order.shippingFee === 0 ? 'Free' : `₹${order.shippingFee}`}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax</span>
                <span className="text-white">₹{order.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Amount</span>
                <span className="text-indigo-400">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Update Status Form & Customer Card */}
        <div className="space-y-6">
          {/* Status Update Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Fulfillment Status Controls
            </h3>

            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Change Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Courier / Carrier
                </label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Tracking Code
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Dispatch Note
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Scanned at regional distribution hub"
                  className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Updating...' : 'Save Fulfillment Changes'}
              </button>
            </form>
          </div>

          {/* Customer & Address Details */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-xs space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" /> Shipping & Customer
            </h3>
            <p className="font-semibold text-white">{order.shippingAddress.name}</p>
            <p className="text-slate-400">{order.shippingAddress.street}</p>
            <p className="text-slate-400">
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
            </p>
            <p className="text-slate-400">{order.shippingAddress.country}</p>
            <p className="text-slate-300 pt-1">Phone: {order.shippingAddress.phone}</p>
            {order.user?.email && (
              <p className="text-slate-400">Account: {order.user.email}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailsPage;
