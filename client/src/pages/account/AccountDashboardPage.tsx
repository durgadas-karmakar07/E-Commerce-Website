import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Heart, MapPin, ArrowRight, Clock, 
  ShoppingBag, CheckCircle, ChevronRight, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';

export const AccountDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.getMyOrders();
        if (res.success && res.data) {
          setOrders(res.data);
        }
      } catch (err) {
        console.error('Failed to load user orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const totalSpent = orders
    .filter((o) => o.paymentInfo?.status === 'completed' || (o as any).paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.totalAmount ?? (o as any).total ?? 0), 0);

  const defaultAddress = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-2">
            Member Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.name || 'Customer'}!
          </h1>
          <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-xl">
            Track your deliveries, manage your favorite wishlist items, and review recent activity in one central space.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-3.5">
              <span className="text-indigo-200 text-xs block">Total Orders</span>
              <span className="text-2xl font-bold">{orders.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-3.5">
              <span className="text-indigo-200 text-xs block">Total Spent</span>
              <span className="text-2xl font-bold">₹{totalSpent.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-3.5">
              <span className="text-indigo-200 text-xs block">Saved Addresses</span>
              <span className="text-2xl font-bold">{user?.addresses?.length || 0}</span>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-3.5">
              <span className="text-indigo-200 text-xs block">Account Security</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle className="w-4 h-4" /> Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" /> Recent Orders
          </h2>
          <Link
            to="/account/orders"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View all ({orders.length}) <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6">
            <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">You haven't placed any orders yet.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 mt-2 hover:underline"
            >
              Start shopping now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <div
                key={order._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-xs transition bg-gray-50/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-gray-900">
                        {order.orderNumber}
                      </span>
                      <StatusBadge status={order.orderStatus} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} • {order.items?.length || 0} item(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="sm:text-right">
                    <span className="text-xs text-gray-500 block">Total</span>
                    <span className="font-bold text-sm text-gray-900">
                      ₹{(order.totalAmount ?? (order as any).total ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Link
                    to={`/account/orders/${order._id}`}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs flex items-center gap-1"
                  >
                    Track Order <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secondary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved Address Preview */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-indigo-600" /> Primary Delivery Address
              </h3>
              <Link to="/account/addresses" className="text-xs text-indigo-600 font-semibold hover:underline">
                Manage
              </Link>
            </div>
            {defaultAddress ? (
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-600 space-y-1">
                <div className="flex items-center justify-between font-semibold text-gray-900">
                  <span>{defaultAddress.name}</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full capitalize">
                    {defaultAddress.type}
                  </span>
                </div>
                <p>{defaultAddress.street}</p>
                <p>{defaultAddress.city}, {defaultAddress.state} - {defaultAddress.postalCode}</p>
                <p className="text-gray-500">Phone: {defaultAddress.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic py-4">No default address saved yet.</p>
            )}
          </div>
          <Link
            to="/account/addresses"
            className="mt-4 text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline pt-2 border-t border-gray-100"
          >
            Add or edit addresses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Links / Help */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> AURA Customer Guarantee
            </h3>
            <ul className="text-xs text-gray-600 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>100% Genuine, Authenticity Verified Products</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>7-Day Hassle-Free Returns & Direct Refunds</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Encrypted, Secure Payments via Razorpay</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-400">Need help with an order?</span>
            <Link to="/account/orders" className="font-semibold text-indigo-600 hover:underline">
              Submit Return Request
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDashboardPage;
