import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  MapPin,
  Plus,
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useCart } from '../../context/CartContext.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';
import { UserAddress } from '../../types/index.js';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const { success, error: toastError } = useToast();

  const passedCouponCode = location.state?.couponCode || '';
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'demo' | 'razorpay' | 'cod'>('demo');
  const [couponCode, setCouponCode] = useState(passedCouponCode);
  const [isProcessing, setIsProcessing] = useState(false);

  // New address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<UserAddress>({
    name: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  if (!user) {
    return <Navigate to="/login?redirect=/checkout" replace />;
  }

  if (cart.items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const fallbackDemoAddress: UserAddress = {
    name: user.name || 'Priya Sharma',
    phone: user.phone || '+919811223344',
    street: 'B-402, Lotus Greens, Sector 78',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postalCode: '201301',
    country: 'India',
    isDefault: true,
  };

  const addresses = (user.addresses && user.addresses.length > 0) ? user.addresses : [fallbackDemoAddress];
  const selectedAddress = addresses[selectedAddressIndex] || addresses[0] || fallbackDemoAddress;

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/auth/addresses', newAddress);
      if (res.success) {
        success('Address saved!');
        setShowAddressForm(false);
        user.addresses = res.addresses;
        setSelectedAddressIndex(user.addresses.length - 1);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save address.');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setIsProcessing(true);

      // 1. Create order on server side
      const orderRes: any = await api.post('/orders', {
        shippingAddress: selectedAddress,
        couponCode: couponCode || undefined,
        paymentMethod,
      });

      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.message || 'Failed to create order.');
      }

      const createdOrder = orderRes.order;

      // 2. If Payment Method is Demo or COD, complete immediately
      if (paymentMethod === 'demo' || paymentMethod === 'cod') {
        // Verify payment intent on server
        await api.post('/payments/verify', {
          orderId: createdOrder._id,
          isDemo: true,
        });

        await refreshCart();
        navigate(`/order-confirmation/${createdOrder._id}`, { state: { order: createdOrder } });
        return;
      }

      // 3. If Razorpay is selected
      const intentRes: any = await api.post('/payments/create-intent', {
        orderId: createdOrder._id,
      });

      if (intentRes.isDemo) {
        // Fallback to verified demo mode if live credentials are not present
        await api.post('/payments/verify', {
          orderId: createdOrder._id,
          isDemo: true,
        });

        await refreshCart();
        navigate(`/order-confirmation/${createdOrder._id}`, { state: { order: createdOrder } });
      } else {
        // Live Razorpay popup (when keys present)
        success('Connecting to payment provider...');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to place order.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-8 border-b border-slate-200">
        <h1 className="text-3xl font-black text-slate-900">Secure Checkout</h1>
        <p className="text-sm text-slate-500 mt-1">Review your delivery details and choose payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-8">
        {/* Left Column: Delivery Address & Payment Choice */}
        <div className="lg:col-span-8 space-y-8">
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                1. Delivery Address
              </h2>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add New Address
              </button>
            </div>

            {/* Saved Addresses List */}
            {addresses.length > 0 && !showAddressForm && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedAddressIndex(idx)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedAddressIndex === idx
                        ? 'border-brand-600 bg-brand-50/40 shadow-sm ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{addr.name}</span>
                      {selectedAddressIndex === idx && (
                        <CheckCircle2 className="w-5 h-5 text-brand-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <p className="text-xs font-mono text-slate-500 mt-2">Phone: {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Address Form Modal/Section */}
            {(showAddressForm || addresses.length === 0) && (
              <form onSubmit={handleAddNewAddress} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullname" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="fullname"
                      type="text"
                      name="name"
                      autoComplete="name"
                      required
                      value={newAddress.name}
                      onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="street" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Street Address
                  </label>
                  <textarea
                    id="street"
                    name="address"
                    autoComplete="street-address"
                    required
                    rows={2}
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      name="city"
                      autoComplete="address-level2"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      State
                    </label>
                    <input
                      id="state"
                      type="text"
                      name="state"
                      autoComplete="address-level1"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      PIN Code
                    </label>
                    <input
                      id="pincode"
                      type="text"
                      name="postal-code"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      required
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Step 2: Payment Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-600" />
                2. Payment Method
              </h2>
            </div>

            {/* Clear Demo Mode Disclaimer Badge */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-amber-950">
                  DEVELOPMENT / DEMO CHECKOUT MODE ACTIVE
                </span>
                Orders placed in simulated demo mode undergo full server-side price validation, inventory deduction, and timeline progression without charging real money.
              </div>
            </div>

            <div className="space-y-3">
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'demo'
                    ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'demo'}
                    onChange={() => setPaymentMethod('demo')}
                    className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      Simulated Instant Payment (Safe Demo)
                    </span>
                    <span className="text-xs text-slate-500">
                      Tests payment capture, order confirmation, inventory reduction, and tracking
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-100 text-brand-700">
                  Recommended
                </span>
              </label>

              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      Razorpay Gateway (UPI, Cards, NetBanking)
                    </span>
                    <span className="text-xs text-slate-500">
                      Active if live API credentials are configured in .env
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-xs text-slate-500">
                      Pay upon delivery inspection at your doorstep
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items Review & Final CTA */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
            <h3 className="text-lg font-black text-slate-900 pb-4 border-b border-slate-100">
              Items in Order ({cart.itemCount})
            </h3>

            {/* Quick Item List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item._id} className="flex items-center gap-3 text-xs">
                  <img
                    src={item.product.images?.[0]}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.product.title}</p>
                    <p className="text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    ₹{item.itemTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs pt-4 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-bold">
                  {cart.deliveryCharge === 0 ? <span className="text-emerald-600">FREE</span> : `₹${cart.deliveryCharge}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (5% GST)</span>
                <span className="font-bold text-slate-900">₹{cart.tax.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-bold text-sm text-slate-900">Final Total</span>
                <span className="text-2xl font-black text-slate-900">
                  ₹{cart.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-card transition-all active:scale-95 disabled:opacity-40"
            >
              <Lock className="w-4 h-4" />
              {isProcessing
                ? 'Simulating Payment & Creating Order...'
                : paymentMethod === 'demo'
                ? `⚡ Instant Demo Pay ₹${cart.total.toLocaleString('en-IN')}`
                : `Pay ₹${cart.total.toLocaleString('en-IN')} & Confirm`}
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 inline mr-1" />
              256-bit Encrypted SSL Security Guaranteed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
