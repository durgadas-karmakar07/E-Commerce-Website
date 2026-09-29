import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Star,
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { Product, Category } from '../../types/index.js';
import { api } from '../../services/api.js';
import { ProductCard } from '../../components/common/ProductCard.js';
import { useToast } from '../../context/ToastContext.js';

export const HomePage: React.FC = () => {
  const outletCtx = useOutletContext<{ openQuickView?: (p: Product) => void }>() || {};
  const openQuickView = outletCtx.openQuickView || (() => {});
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const { success } = useToast();

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setIsLoading(true);
        const [featRes, bestRes, catRes]: any = await Promise.all([
          api.get('/products/featured'),
          api.get('/products/bestsellers'),
          api.get('/categories'),
        ]);

        if (featRes.success) setFeaturedProducts(featRes.products || []);
        if (bestRes.success) setBestSellers(bestRes.products || []);
        if (catRes.success) setCategories(catRes.categories || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCoupon(null), 3000);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-20 lg:py-28">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-500/20 border border-brand-400/30 text-brand-300 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                <span>Next-Gen Premium Lifestyle Collection</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08]">
                Curated Tech &amp; <br />
                <span className="bg-gradient-to-r from-brand-300 via-indigo-200 to-rose-300 bg-clip-text text-transparent">
                  Modern Essentials.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Experience precision-crafted acoustic audio, titanium smartwatches, and minimalist Supima cotton apparel. Engineered for mindful daily living.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-premium transition-all hover:scale-105 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4 text-brand-600" />
                  Explore Catalog
                </Link>
                <Link
                  to="/offers"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-white font-extrabold text-sm border border-slate-700/80 flex items-center justify-center gap-2.5 transition-all"
                >
                  <Tag className="w-4 h-4 text-rose-400" />
                  Seasonal Offers (Up to 30% Off)
                </Link>
              </div>

              {/* Metrics strip */}
              <div className="pt-8 border-t border-slate-800/80 flex items-center justify-center lg:justify-start gap-8 sm:gap-12 text-slate-400 text-xs">
                <div>
                  <span className="block text-2xl font-black text-white">20+</span>
                  <span>Premium Products</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-white">4.8★</span>
                  <span>Verified Customer Rating</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-white">100%</span>
                  <span>Genuine Warranty</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Cards */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-800 group">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80"
                  alt="AURA Flagship Headphones"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                {/* Floating Product Highlight Card */}
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-white/90 backdrop-blur-md text-slate-900 shadow-xl border border-white/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                      Featured Release
                    </span>
                    <span className="flex items-center text-amber-500 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                      4.8 (38 reviews)
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 mt-1">
                    AURA SonicPro Wireless ANC
                  </h4>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-slate-900">₹14,499</span>
                      <span className="text-xs text-slate-400 line-through">₹18,999</span>
                    </div>
                    <Link
                      to="/product/aura-sonicpro-wireless-anc-headphones"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-brand-600 transition-colors"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Explore Catalog</span>
            <h2 className="text-3xl font-black text-slate-900 mt-1">Featured Categories</h2>
          </div>
          <Link
            to="/categories"
            className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            View All Categories
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/shop?category=${cat.slug}`}
              className="group relative rounded-3xl overflow-hidden aspect-square bg-slate-100 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all"
            >
              <img
                src={cat.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'}
                alt={cat.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h3 className="font-extrabold text-xs sm:text-sm leading-tight group-hover:text-brand-300 transition-colors">
                  {cat.name}
                </h3>
                {cat.productCount !== undefined && (
                  <p className="text-[10px] text-slate-300 mt-0.5">{cat.productCount} Items</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Best Selling Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Top Trending</span>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mt-1">Best Selling Products</h2>
          </div>
          <Link
            to="/bestsellers"
            className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            See All Best Sellers
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.slice(0, 4).map((product) => (
            <ProductCard key={product._id} product={product} onQuickView={openQuickView} />
          ))}
        </div>
      </section>

      {/* 4. Promotional Banner Strip with Interactive Coupon Copy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-12 lg:p-16 shadow-premium">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-500 text-white inline-block">
              Limited Festive Discount
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Get 25% Instant Savings on Your Order
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Elevate your lifestyle with audio, smart tech, and comfortable apparel. Apply code during checkout.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                <span className="font-mono text-base font-extrabold tracking-wider text-amber-300">
                  FESTIVE25
                </span>
                <button
                  onClick={() => copyCoupon('FESTIVE25')}
                  className="p-1 rounded text-slate-300 hover:text-white transition-colors"
                  title="Copy coupon"
                >
                  {copiedCoupon === 'FESTIVE25' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <Link
                to="/shop"
                className="px-6 py-2.5 rounded-2xl bg-white text-slate-900 font-extrabold text-sm hover:bg-slate-100 transition-colors shadow-card"
              >
                Redeem Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Fresh Drops</span>
            <h2 className="text-3xl font-black text-slate-900 mt-1">Featured Arrivals</h2>
          </div>
          <Link
            to="/shop"
            className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            Explore Complete Store
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 4).map((product) => (
            <ProductCard key={product._id} product={product} onQuickView={openQuickView} />
          ))}
        </div>
      </section>

      {/* 6. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Real Experiences</span>
          <h2 className="text-3xl font-black text-slate-900 mt-1">Loved by Conscious Shoppers</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed italic">
                "The SonicPro ANC headphones completely transformed my daily commute. Exceptional soundstage, luxury comfort, and the battery genuinely lasts for days."
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-100">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80"
                alt="Priya Sharma"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="font-bold text-sm text-slate-900">Priya Sharma</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Buyer, Noida
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed italic">
                "Apex Titanium is the first smartwatch that feels like genuine high-end horology. Outstanding GPS precision on my morning marathon training sessions."
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-100">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80"
                alt="Rahul Mehta"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="font-bold text-sm text-slate-900">Rahul Mehta</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Buyer, Mumbai
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed italic">
                "The 480 GSM Supima hoodie is perfection. Incredible weight, clean tailoring, and no shrinking after washing. Fast 2-day delivery across Gujarat."
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-100">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80"
                alt="Aarav Patel"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="font-bold text-sm text-slate-900">Aarav Patel</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Buyer, Ahmedabad
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
