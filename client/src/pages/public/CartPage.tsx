import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Heart,
  ArrowRight,
  Tag,
  Check,
  AlertCircle,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { useWishlist } from '../../context/WishlistContext.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem, clearCart, isLoading } = useCart();
  const { toggleWishlist } = useWishlist();
  const { success, error: toastError } = useToast();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    try {
      setIsValidatingCoupon(true);
      const res: any = await api.post('/coupons/validate', {
        code: couponInput.trim(),
        orderAmount: cart.subtotal,
      });

      if (res.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        success(res.message || 'Coupon applied successfully!');
      }
    } catch (err: any) {
      toastError(err.message || 'Invalid coupon code.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, cart.subtotal - couponDiscount + cart.deliveryCharge + cart.tax);

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          Explore our collection of premium acoustic audio, wearables, and apparel to fill your cart.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 text-white font-extrabold text-sm hover:bg-brand-600 transition-colors shadow-card"
        >
          Start Shopping
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between pb-8 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Shopping Cart</h1>
          <p className="text-sm text-slate-500 mt-1">
            {cart.itemCount} items ready for checkout
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-8">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item._id}
              className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center gap-5 transition-all"
            >
              {/* Product Thumbnail */}
              <Link to={`/product/${item.product.slug}`} className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 shrink-0">
                <img
                  src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80'}
                  alt={item.product.title}
                  className="w-full h-full object-cover object-center"
                />
              </Link>

              {/* Title & Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {item.product.brand}
                </span>
                <Link
                  to={`/product/${item.product.slug}`}
                  className="font-bold text-slate-900 text-sm hover:text-brand-600 transition-colors block truncate"
                >
                  {item.product.title}
                </Link>
                {item.variantSku && (
                  <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                    Variant: {item.variantSku}
                  </span>
                )}

                <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-2">
                  <span className="font-extrabold text-sm text-slate-900">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  {item.mrp > item.price && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{item.mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {!item.inStock && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Only {item.availableStock} in stock
                  </span>
                )}
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 shrink-0">
                <button
                  onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                  disabled={isLoading}
                  className="px-3 py-1 font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                  -
                </button>
                <span className="px-3 py-1 font-bold text-xs text-slate-900">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  disabled={isLoading || item.quantity >= item.availableStock}
                  className="px-3 py-1 font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right shrink-0 min-w-[90px]">
                <span className="block font-black text-slate-900 text-base">
                  ₹{item.itemTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Actions (Wishlist & Remove) */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    toggleWishlist(item.product);
                    removeItem(item._id);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-50"
                  title="Move to wishlist"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeItem(item._id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
            <h3 className="text-lg font-black text-slate-900 pb-4 border-b border-slate-100">
              Order Summary
            </h3>

            {/* Coupon Application Box */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Promotional Coupon
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold">{appliedCoupon.code}</span>
                      <span className="block text-[11px] text-emerald-600 mt-0.5">
                        -₹{appliedCoupon.discountAmount.toLocaleString('en-IN')} Applied
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. FESTIVE25)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-40"
                  >
                    Apply
                  </button>
                </div>
              )}
            </form>

            {/* Pricing Breakdown */}
            <div className="space-y-3 text-sm pt-4 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span className="font-bold text-slate-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Catalog Discount</span>
                  <span className="font-bold">-₹{cart.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Savings</span>
                  <span className="font-bold">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  Delivery Charge
                </span>
                <span className="font-bold">
                  {cart.deliveryCharge === 0 ? (
                    <span className="text-emerald-600">FREE</span>
                  ) : (
                    `₹${cart.deliveryCharge}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Estimated GST (5%)</span>
                <span className="font-bold text-slate-900">₹{cart.tax.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-base">Grand Total</span>
                <span className="text-2xl font-black text-slate-900">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon?.code } })}
              disabled={cart.hasOutOfStock}
              className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-card transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            {cart.hasOutOfStock && (
              <p className="text-xs text-rose-600 font-semibold text-center">
                Please adjust out-of-stock items to proceed to checkout.
              </p>
            )}

            <div className="pt-4 text-center">
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Guaranteed Safe &amp; Secure Checkout
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
