import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Package, Truck, MapPin, CreditCard, 
  RotateCcw, Printer, AlertCircle, CheckCircle2, X 
} from 'lucide-react';
import { api } from '../../services/api';
import { Order, OrderItem } from '../../types';
import OrderTimeline from '../../components/common/OrderTimeline';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Return Request Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [returnReason, setReturnReason] = useState('defective');
  const [returnNotes, setReturnNotes] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const { addToast } = useToast();

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getOrderById(id);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError(res.message || 'Failed to load order');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const item = order.items[selectedItemIndex];
    if (!item) return;

    setSubmittingReturn(true);
    try {
      const res = await api.createReturnRequest({
        orderId: order._id,
        items: [
          {
            product: item.product,
            quantity: item.quantity,
            reason: returnReason,
            notes: returnNotes,
          }
        ],
        reason: returnReason,
        customerComments: returnNotes,
      });

      if (res.success) {
        addToast('Return request submitted successfully. Our team will review it shortly.', 'success');
        setIsReturnModalOpen(false);
        fetchOrder();
      } else {
        addToast(res.message || 'Failed to submit return request', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Error submitting return', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-gray-900 text-lg mb-1">Order Not Found</h3>
        <p className="text-gray-500 text-xs mb-6">{error || 'Unable to retrieve order details.'}</p>
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
        </Link>
      </div>
    );
  }

  // Calculate return eligibility: Delivered and within 7 days
  const isDelivered = order.orderStatus === 'delivered';
  const deliveredDate = order.trackingTimeline?.find((t) => t.status === 'delivered')?.timestamp;
  const isReturnEligible = isDelivered && (!deliveredDate || (Date.now() - new Date(deliveredDate).getTime()) < 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link
            to="/account/orders"
            className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-gray-900 font-mono">
                Order #{order.orderNumber}
              </h1>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isReturnEligible && (
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Request Return
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print Invoice
          </button>
        </div>
      </div>

      {/* Tracking Timeline Stepper & Estimated Delivery */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
            <Truck className="w-5 h-5 text-indigo-600" /> Shipment & Tracking Progress
          </h3>
          {(order.estimatedDelivery || (order as any).tracking?.estimatedDelivery) && (
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <span>📅 Guaranteed Delivery: {order.estimatedDelivery || (order as any).tracking?.estimatedDelivery}</span>
            </div>
          )}
        </div>

        <OrderTimeline currentStatus={order.orderStatus} trackingTimeline={order.trackingTimeline} />

        {order.trackingNumber && (
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-600">
            <div>
              <span className="text-gray-400">Courier Partner:</span>{' '}
              <strong className="text-gray-900">{order.shippingCarrier || 'BlueDart Logistics'}</strong>
            </div>
            <div>
              <span className="text-gray-400">Tracking Number:</span>{' '}
              <strong className="font-mono text-indigo-600">{order.trackingNumber}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Order Items & Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-gray-500" /> Products Purchased ({order.items?.length || 0})
          </h3>
          <div className="divide-y divide-gray-100">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.image || (item as any).images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={item.name || (item as any).title || 'Product'}
                    className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-gray-100"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{item.name || (item as any).title || 'Product Item'}</h4>
                    {item.variant && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.variant.name}: {item.variant.value}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      ₹{(item.price || 0).toLocaleString('en-IN')} × {item.quantity} unit(s)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-gray-900 text-sm">
                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals Table */}
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">₹{(order.subtotal ?? (order as any).subTotal ?? 0).toLocaleString('en-IN')}</span>
            </div>
            {((order.discountAmount ?? (order as any).discount ?? 0) > 0) && (
              <div className="flex justify-between text-emerald-600">
                <span>Voucher Discount {order.couponCode && `(${order.couponCode})`}</span>
                <span>- ₹{(order.discountAmount ?? (order as any).discount ?? 0).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Standard Delivery</span>
              <span className="font-medium text-gray-900">
                {(order.shippingFee ?? (order as any).deliveryCharge ?? 0) === 0 ? 'Free' : `₹${order.shippingFee ?? (order as any).deliveryCharge}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>GST / Taxes</span>
              <span className="font-medium text-gray-900">₹{(order.taxAmount ?? (order as any).tax ?? 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-900 pt-3 border-t border-gray-100">
              <span>Total Paid</span>
              <span className="text-indigo-600">₹{(order.totalAmount ?? (order as any).total ?? 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Address & Payment Info */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-indigo-600" /> Delivery Address
            </h3>
            <p className="font-semibold text-gray-900 text-xs">{order.shippingAddress.name}</p>
            <p className="text-xs text-gray-600 mt-1">{order.shippingAddress.street}</p>
            <p className="text-xs text-gray-600">
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
            </p>
            <p className="text-xs text-gray-600">{order.shippingAddress.country}</p>
            <p className="text-xs text-gray-500 mt-2">Phone: {order.shippingAddress.phone}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-indigo-600" /> Payment Information
            </h3>
            <div className="text-xs space-y-2 text-gray-600">
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-bold uppercase text-emerald-600">{order.paymentInfo?.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="capitalize">{order.paymentInfo?.method === 'demo' ? 'Demo Mode (Simulated)' : order.paymentInfo?.method}</span>
              </div>
              {order.paymentInfo?.transactionId && (
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-gray-700">{order.paymentInfo.transactionId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Request Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-500" /> Request Return / Refund
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Eligible items can be returned within 7 days of delivery for a replacement or full refund.
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Item to Return
                </label>
                <select
                  value={selectedItemIndex}
                  onChange={(e) => setSelectedItemIndex(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  {order.items.map((item, idx) => (
                    <option key={idx} value={idx}>
                      {item.name} (Qty: {item.quantity}) - ₹{item.price * item.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Return
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="defective">Defective / Not Working</option>
                  <option value="wrong_item">Received Wrong Product / Size</option>
                  <option value="damaged">Damaged in Transit / Package Torn</option>
                  <option value="not_as_described">Item Doesn't Match Description</option>
                  <option value="other">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Additional Comments / Description
                </label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Provide additional details regarding the issue..."
                  required
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {submittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
