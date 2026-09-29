import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'stock' | 'health';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'pending', type = 'order', className = '' }) => {
  const getBadgeStyle = () => {
    const s = String(status).toLowerCase();

    if (s === 'delivered' || s === 'paid' || s === 'completed' || s === 'captured' || s === 'healthy' || s === 'active' || s === 'published') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    }
    if (s === 'shipped' || s === 'out_for_delivery') {
      return 'bg-blue-50 text-blue-700 border-blue-200/80';
    }
    if (s === 'confirmed' || s === 'processing' || s === 'packed') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    }
    if (s === 'pending' || s === 'degraded' || s === 'low_stock' || s === 'investigating') {
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    }
    if (s === 'cancelled' || s === 'failed' || s === 'rejected' || s === 'down' || s === 'out_of_stock' || s === 'disabled' || s === 'critical') {
      return 'bg-rose-50 text-rose-700 border-rose-200/80';
    }
    if (s === 'return_requested' || s === 'returned' || s === 'refund_pending' || s === 'refunded') {
      return 'bg-purple-50 text-purple-700 border-purple-200/80';
    }
    if (s === 'unconfigured') {
      return 'bg-slate-100 text-slate-600 border-slate-200';
    }

    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const formatText = (text: string) => {
    return String(text).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {formatText(status)}
    </span>
  );
};

export default StatusBadge;
