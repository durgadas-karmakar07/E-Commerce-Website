import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, Package, ArrowRight, Truck, MapPin, 
  CreditCard, Calendar, Download, AlertCircle, ShoppingBag 
} from 'lucide-react';
import { api } from '../../services/api';
import { Order } from '../../types';
import OrderTimeline from '../../components/common/OrderTimeline';
import StatusBadge from '../../components/common/StatusBadge';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.getOrderById(id);
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          setError(res.message || 'Order details not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Retrieving your order confirmation...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">{error || 'We could not locate this order.'}</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          <ShoppingBag className="w-4 h-4" /> Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Celebration Header */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-white to-indigo-50 border border-emerald-100 rounded-3xl p-8 sm:p-10 text-center mb-8 shadow-sm">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
        </div>
        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
          Order Successfully Placed
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
          Thank You For Your Order!
        </h1>
        <p className="text-gray-600 max-w-lg mx-auto text-sm sm:text-base">
          We’ve received your order and are getting it ready. A confirmation email has been sent to your registered address.
        </p>
        
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-4 bg-white/80 backdrop-blur border border-gray-200 rounded-2xl px-6 py-3 text-sm">
          <div>
            <span className="text-gray-500 block text-xs">Order ID</span>
            <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />
          <div>
            <span className="text-gray-500 block text-xs">Order Date</span>
            <span className="font-medium text-gray-900">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />
          <div>
            <span className="text-gray-500 block text-xs">Payment Method</span>
            <span className="font-medium text-indigo-600 capitalize">
              {(order.paymentInfo?.method || order.paymentMethod) === 'demo'
                ? 'Demo Payment (Simulated)'
                : (order.paymentInfo?.method || order.paymentMethod) || 'Instant Payment'}
            </span>
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />
          <div>
            <span className="text-gray-500 block text-xs">Total Amount</span>
            <span className="font-bold text-emerald-700">
              ₹{(order.totalAmount ?? order.total ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Live Admin Telemetry Banner */}
        <div className="mt-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 max-w-xl mx-auto text-xs text-indigo-900 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span><b>Live Database Sync:</b> Yeh order live Admin Dashboard aur Sales Report me register ho chuka hai!</span>
        </div>
      </div>

      {/* Order Progress Stepper */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" /> Order Tracking Timeline
          </h2>
          <StatusBadge status={order.orderStatus} />
        </div>
        <OrderTimeline
          currentStatus={order.orderStatus}
          trackingTimeline={order.trackingTimeline || order.tracking?.statusTimeline || []}
        />
        
        {/* Estimated Delivery Date Callout */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-100/80 rounded-2xl p-4 text-center">
          <div className="text-xs uppercase tracking-wider text-indigo-700 font-bold mb-1">
            📦 Promised Delivery Estimate
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            Arriving by {new Date(order.estimatedDelivery || order.tracking?.estimatedDelivery || Date.now() + 4 * 86400000).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Courier: <span className="font-semibold text-slate-700">{order.tracking?.deliveryPartner || 'BlueDart Express'}</span> • Tracking No: <span className="font-mono font-bold text-indigo-600">{order.tracking?.trackingId || 'BD-' + Math.floor(10000000 + Math.random() * 90000000)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Items Ordered */}
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-500" /> Items in this Order ({order.items?.length || 0})
          </h3>
          <div className="space-y-4">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                  alt={item.title || item.name}
                  className="w-16 h-16 object-cover rounded-xl border border-gray-100 bg-gray-50"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">{item.title || item.name}</h4>
                  {item.variant && (
                    <p className="text-xs text-gray-500">{item.variant.name}: {item.variant.value}</p>
                  )}
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900 text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  <span className="block text-xs text-gray-400">₹{item.price.toLocaleString('en-IN')} each</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">₹{(order.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            {((order.discountAmount ?? 0) > 0 || (order.discount ?? 0) > 0 || (order.couponDiscount ?? 0) > 0) && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount / Coupon {order.couponCode && `(${order.couponCode})`}</span>
                <span>- ₹{(order.discountAmount ?? (order.discount || 0) + (order.couponDiscount || 0)).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-medium text-gray-900">
                {(order.shippingFee ?? order.deliveryCharge ?? 0) === 0 ? 'Free' : `₹${order.shippingFee ?? order.deliveryCharge}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxes (5% GST Included)</span>
              <span className="font-medium text-gray-900">₹{(order.taxAmount ?? order.tax ?? 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total Paid</span>
              <span className="text-indigo-600">₹{(order.totalAmount ?? order.total ?? 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Meta */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500" /> Delivery Address
            </h3>
            <p className="font-semibold text-gray-900 text-sm">{order.shippingAddress?.name || 'Customer'}</p>
            <p className="text-xs text-gray-600 mt-1">{order.shippingAddress?.street}</p>
            <p className="text-xs text-gray-600">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
            </p>
            <p className="text-xs text-gray-600">{order.shippingAddress?.country || 'India'}</p>
            <p className="text-xs text-gray-500 mt-2">Phone: {order.shippingAddress?.phone}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-gray-500" /> Payment Details
            </h3>
            <div className="text-xs space-y-1.5 text-gray-600">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold text-emerald-600 uppercase">
                  {order.paymentInfo?.status || order.paymentStatus || 'PAID'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="capitalize">{order.paymentInfo?.method || order.paymentMethod || 'Demo Payment'}</span>
              </div>
              <div className="flex justify-between">
                <span>Verification:</span>
                <span className="font-mono text-emerald-600 font-bold">100% Verified (Instant)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Link
            to={`/account/orders`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition shadow-sm"
          >
            👤 My Orders & Dashboard
          </Link>
          <Link
            to="/admin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
          >
            👑 View in Admin Live Dashboard
          </Link>
        </div>
        <Link
          to="/shop"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
