import React, { useEffect, useState } from 'react';
import { Tag, Copy, Check, Sparkles, Percent, ShoppingBag, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Product, Coupon } from '../../types';
import ProductCard from '../../components/common/ProductCard';
import { useToast } from '../../context/ToastContext';

export const OffersPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [couponsRes, productsRes] = await Promise.all([
          api.getActiveCoupons(),
          api.getProducts({ sort: 'discount', limit: 12 })
        ]);

        if (couponsRes.success && couponsRes.data) {
          setCoupons(couponsRes.data);
        }
        if (productsRes.success && productsRes.data) {
          // Filter products with at least 15% discount
          const onSale = productsRes.data.filter((p) => p.discountPercentage >= 15);
          setDiscountedProducts(onSale);
        }
      } catch (err) {
        console.error('Failed to load offers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast(`Coupon code ${code} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white p-8 sm:p-12 mb-12 shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Exclusive Savings Zone
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Super Deals & Voucher Codes
          </h1>
          <p className="text-white/90 text-sm sm:text-base leading-relaxed">
            Apply active promotional coupons at checkout to unlock up to 25% extra savings on your orders!
          </p>
        </div>
      </div>

      {/* Coupons Section */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-rose-500" /> Active Promotional Coupons
          </h2>
          <span className="text-xs text-gray-500">Tap copy to apply at checkout</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 text-sm">No coupons active right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coupons.map((c) => (
              <div
                key={c._id}
                className="relative bg-white border border-dashed border-gray-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg uppercase tracking-wide">
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </span>
                    <Percent className="w-4 h-4 text-rose-400" />
                  </div>
                  <h3 className="font-mono text-xl font-extrabold text-gray-900 tracking-wider">
                    {c.code}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2">
                    {c.description || `Get ${c.discountValue}${c.discountType === 'percentage' ? '%' : ' INR'} off your order`}
                  </p>
                  <div className="mt-3 text-[11px] text-gray-400 space-y-0.5">
                    {c.minOrderAmount > 0 && <p>Min Order: ₹{c.minOrderAmount}</p>}
                    {c.maxDiscountAmount && <p>Max Discount: ₹{c.maxDiscountAmount}</p>}
                    {c.expiresAt && (
                      <p>Expires: {new Date(c.expiresAt).toLocaleDateString('en-IN')}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(c.code)}
                  className={`mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                    copiedCode === c.code
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {copiedCode === c.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discounted Products Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> Hot Discounted Items
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : discountedProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">All products are currently at regular pricing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {discountedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersPage;
