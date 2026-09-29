import React from 'react';
import { CheckCircle2, Clock, Truck, Package, Box, MapPin, AlertCircle } from 'lucide-react';
import type { OrderTimeline as IOrderTimeline } from '../../types/index.js';

interface OrderTimelineProps {
  orderStatus?: string;
  currentStatus?: string;
  historyTimeline?: IOrderTimeline[];
  trackingTimeline?: IOrderTimeline[];
  trackingId?: string;
  deliveryPartner?: string;
  estimatedDelivery?: string;
}

const ORDER_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'packed', label: 'Packed', icon: Box },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: Package },
];

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  orderStatus,
  currentStatus,
  historyTimeline,
  trackingTimeline,
  trackingId,
  deliveryPartner,
  estimatedDelivery,
}) => {
  const status = currentStatus || orderStatus || 'pending';
  const timeline = trackingTimeline || historyTimeline || [];

  const isCancelled = status === 'cancelled';
  const isReturned = status.includes('return') || status.includes('refund');

  // Determine current active step index
  const getStepIndex = (st: string) => {
    const s = st.toLowerCase();
    if (s === 'delivered') return 5;
    if (s === 'out_for_delivery') return 4;
    if (s === 'shipped') return 3;
    if (s === 'packed') return 2;
    if (s === 'confirmed' || s === 'processing') return 1;
    return 0; // pending / placed
  };

  const currentStep = getStepIndex(status);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
      {/* Tracking Metadata Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery Status</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
            {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </h3>
        </div>

        {trackingId && (
          <div className="text-left sm:text-right bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500">
              Courier:{' '}
              <span className="font-bold text-slate-800">{deliveryPartner || 'Standard Logistics'}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracking ID: <span className="font-mono font-bold text-brand-600">{trackingId}</span>
            </p>
          </div>
        )}
      </div>

      {/* Exception Status Banner (Cancelled / Return) */}
      {isCancelled ? (
        <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <p className="text-sm font-semibold">This order has been cancelled.</p>
        </div>
      ) : isReturned ? (
        <div className="mt-6 p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center gap-3 text-purple-800">
          <AlertCircle className="w-5 h-5 text-purple-500 shrink-0" />
          <p className="text-sm font-semibold">Return / Refund process is in progress for this order.</p>
        </div>
      ) : (
        /* Standard 5-Step Order Stepper */
        <div className="pt-8">
          <div className="relative">
            {/* Background Step Progress Line */}
            <div className="absolute top-5 left-6 right-6 h-1 bg-slate-100 hidden md:block">
              <div
                className="h-full bg-brand-500 transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%` }}
              />
            </div>

            {/* Stepper Points */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 relative z-10">
              {ORDER_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-brand-500 text-white shadow-card'
                          : isCurrent
                          ? 'bg-brand-600 text-white ring-4 ring-brand-100 animate-pulse'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs mt-3 font-bold ${
                        isCurrent ? 'text-brand-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {estimatedDelivery && !isCancelled && status !== 'delivered' && (
        <p className="text-xs text-slate-500 text-center mt-8 pt-4 border-t border-slate-100">
          Estimated Delivery Date: <strong className="text-slate-800">{new Date(estimatedDelivery).toLocaleDateString()}</strong>
        </p>
      )}
    </div>
  );
};

export default OrderTimeline;
