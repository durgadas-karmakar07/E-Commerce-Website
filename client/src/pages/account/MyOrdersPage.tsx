import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Search, Filter, ArrowRight, Truck, 
  AlertCircle, ChevronRight, XCircle, ShoppingBag 
} from 'lucide-react';
import { api } from '../../services/api';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getMyOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) {
      return;
    }
    setCancellingId(orderId);
    try {
      const res = await api.cancelOrder(orderId, 'Cancelled by customer');
      if (res.success) {
        addToast('Order cancelled successfully.', 'success');
        fetchOrders();
      } else {
        addToast(res.message || 'Failed to cancel order', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Error cancelling order', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'in_progress') {
      return ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.orderStatus);
    }
    if (filterStatus === 'delivered') return o.orderStatus === 'delivered';
    if (filterStatus === 'cancelled') return o.orderStatus === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            View order status, download invoices, track real-time shipments, and initiate returns
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'in_progress', label: 'In Transit' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === tab.id
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-base mb-1">No Orders Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
            You don't have any orders matching the selected filter.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Explore Shop <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const canCancel = ['pending', 'confirmed'].includes(order.orderStatus);

            return (
              <div
                key={order._id}
                className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Order Top Bar */}
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Order Placed</span>
                      <span className="font-medium text-gray-800">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-gray-200" />
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Amount</span>
                      <span className="font-bold text-gray-900">
                        ₹{(order.totalAmount ?? (order as any).total ?? 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-gray-200" />
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Ship To</span>
                      <span className="font-medium text-gray-800 truncate max-w-[120px] block">
                        {order.shippingAddress?.name || 'Customer'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-500 font-bold">#{order.orderNumber}</span>
                    <StatusBadge status={order.orderStatus} />
                  </div>
                </div>

                {/* Items in Order */}
                <div className="p-6">
                  <div className="divide-y divide-gray-100">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <img
                            src={item.image || (item as any).images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                            alt={item.name || (item as any).title || 'Product'}
                            className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                              {item.name || (item as any).title || 'Product Item'}
                            </h4>
                            {item.variant && (
                              <p className="text-xs text-gray-400">
                                {item.variant.name}: {item.variant.value}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity} × ₹{(item.price || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-gray-900 text-sm">
                            ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Card Action Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-gray-600 flex items-center gap-1.5 font-medium">
                      <Truck className="w-4 h-4 text-indigo-500 shrink-0" />
                      {order.orderStatus === 'delivered' ? (
                        <span className="text-emerald-700">Delivered successfully</span>
                      ) : order.orderStatus === 'cancelled' ? (
                        <span className="text-red-500 font-medium">Order was cancelled</span>
                      ) : (
                        <span>
                          Guaranteed Delivery: <strong className="text-indigo-700">{order.estimatedDelivery || (order as any).tracking?.estimatedDelivery || '3-5 Business Days'}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingId === order._id}
                          className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition disabled:opacity-50"
                        >
                          {cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}

                      <Link
                        to={`/account/orders/${order._id}`}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition shadow-xs flex items-center gap-1"
                      >
                        Track & Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
