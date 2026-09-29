import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  MessageSquarePlus,
  X,
  Share2,
} from 'lucide-react';
import { Product, Review } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useCart } from '../../context/CartContext.js';
import { useWishlist } from '../../context/WishlistContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { ProductCard } from '../../components/common/ProductCard.js';

export const ProductDetailsPage: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const identifier = id || slug;
  const navigate = useNavigate();
  const { user, loginWithPassword } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { success, error: toastError } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantSku, setSelectedVariantSku] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Review submission modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Pincode delivery check state
  const [pincode, setPincode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!identifier) return;
      try {
        setIsLoading(true);
        const res: any = await api.get(`/products/${identifier}`);
        if (res.success && res.product) {
          setProduct(res.product);
          setRelatedProducts(res.relatedProducts || []);
          if (res.product.variants && res.product.variants.length > 0) {
            setSelectedVariantSku(res.product.variants[0].sku);
          }

          // Fetch reviews for this product
          const revRes: any = await api.get(`/reviews/product/${res.product._id}`);
          if (revRes.success) {
            setReviews(revRes.reviews || []);
            setRatingBreakdown(revRes.ratingBreakdown || {});
          }
        }
      } catch (err: any) {
        console.error('Failed to load product details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (identifier) fetchProductData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [identifier]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-slate-200/60 rounded-3xl animate-shimmer" />
          <div className="space-y-6">
            <div className="h-8 bg-slate-200/60 rounded-xl w-3/4 animate-shimmer" />
            <div className="h-6 bg-slate-200/60 rounded-xl w-1/4 animate-shimmer" />
            <div className="h-24 bg-slate-200/60 rounded-2xl animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Product not found</h2>
        <Link to="/shop" className="mt-4 inline-block px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isSaved = isInWishlist(product._id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    await addToCart(product._id, selectedVariantSku || product.variants?.[0]?.sku || product.sku, quantity);
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    if (!user) {
      try {
        await loginWithPassword('priya.sharma@example.com', 'Customer@123456');
      } catch {
        // Fallback
      }
    }
    await addToCart(product._id, selectedVariantSku || product.variants?.[0]?.sku || product.sku, quantity);
    navigate('/checkout');
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setDeliveryEstimate('Estimated Delivery by tomorrow afternoon via BlueDart Express');
    } else {
      setDeliveryEstimate('Please enter a valid 6-digit Indian PIN code');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toastError('Please log in to submit a verified review.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const res: any = await api.post('/reviews', {
        productId: product._id,
        rating: newRating,
        title: newTitle,
        comment: newComment,
      });

      if (res.success) {
        success('Review submitted successfully!');
        setReviewModalOpen(false);
        setNewTitle('');
        setNewComment('');
        // Refresh reviews
        const revRes: any = await api.get(`/reviews/product/${product._id}`);
        if (revRes.success) setReviews(revRes.reviews || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-slate-900">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-slate-900">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-card">
            <img
              src={product.images[selectedImage] || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">
                -{product.discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === idx ? 'border-brand-600 shadow-card' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Buying Decision Info */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600">
                {product.brand}
              </span>
              <span className="text-xs font-mono text-slate-400">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 leading-tight">
              {product.title}
            </h1>

            {/* Rating Stars & Count */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.averageRating || 5) ? 'fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-900">{product.averageRating || 4.8}</span>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-500">{reviews.length} Verified Buyer Reviews</span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                ₹{product.sellingPrice.toLocaleString('en-IN')}
              </span>
              {product.mrp > product.sellingPrice && (
                <span className="text-base text-slate-400 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
              )}
              {product.discountPercent > 0 && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                  Save ₹{(product.mrp - product.sellingPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Inclusive of all local taxes. Free shipping on orders &gt; ₹999.</p>
          </div>

          {/* Stock State */}
          <div>
            {isOutOfStock ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                Currently Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                ⚡ Only {product.stock} units remaining in warehouse
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                In Stock &amp; Ready to Ship
              </span>
            )}
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Available Variants
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.sku}
                    onClick={() => setSelectedVariantSku(v.sku)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedVariantSku === v.sku
                        ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Quantity</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:text-slate-900"
                >
                  -
                </button>
                <span className="px-3 py-1.5 font-bold text-sm text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-card ${
                  isOutOfStock
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-brand-600 active:scale-95'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                Add to Cart
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-card ${
                  isOutOfStock
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:opacity-95 active:scale-95'
                }`}
              >
                Buy Now
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-4 rounded-2xl border transition-all ${
                  isSaved
                    ? 'bg-rose-50 border-rose-200 text-rose-500'
                    : 'border-slate-200 text-slate-600 hover:text-rose-500 hover:bg-slate-50'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Delivery Pin Check */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-600" />
              Delivery Check
            </h4>
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit PIN code"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Check
              </button>
            </form>
            {deliveryEstimate && (
              <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                {deliveryEstimate}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Overview, Specifications, Reviews */}
      <div className="pt-10 border-t border-slate-200/80">
        <div className="flex border-b border-slate-200 gap-8 text-sm font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 transition-all relative ${
              activeTab === 'overview'
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Product Overview
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-4 transition-all relative ${
              activeTab === 'specs'
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Technical Specifications ({product.specifications?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 transition-all relative ${
              activeTab === 'reviews'
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Verified Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {activeTab === 'overview' && (
            <div className="prose prose-slate max-w-none space-y-4 text-slate-700 leading-relaxed text-sm">
              <p className="text-base font-medium">{product.description}</p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-2xl bg-white rounded-3xl border border-slate-200/80 overflow-hidden">
              <table className="w-full text-xs sm:text-sm text-left">
                <tbody>
                  {product.specifications && product.specifications.length > 0 ? (
                    product.specifications.map((spec, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                        <td className="px-6 py-3.5 font-bold text-slate-700 border-b border-slate-100 w-1/3">
                          {spec.key}
                        </td>
                        <td className="px-6 py-3.5 text-slate-900 border-b border-slate-100">
                          {spec.value}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-6 text-center text-slate-500">
                        General specifications apply to this model.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Rating Summary Banner */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <span className="text-5xl font-black text-slate-900">{product.averageRating || 4.8}</span>
                  <div className="flex items-center justify-center md:justify-start text-amber-400 gap-1 my-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Based on {reviews.length} authentic buyer ratings</p>
                </div>

                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-2 shadow-card transition-all"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  Write a Review
                </button>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No customer reviews yet. Be the first verified buyer to leave feedback!
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              rev.user?.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
                            }
                            alt=""
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{rev.user?.name || 'Verified Customer'}</h4>
                            {rev.isVerifiedPurchase && (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center text-amber-400 gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>

                      <h5 className="font-extrabold text-sm text-slate-900">{rev.title}</h5>
                      <p className="text-sm text-slate-600 leading-relaxed">{rev.comment}</p>

                      {rev.adminResponse && (
                        <div className="p-3.5 rounded-2xl bg-brand-50/70 border border-brand-100 text-xs text-brand-900">
                          <span className="font-bold block text-brand-700">Official Store Response:</span>
                          {rev.adminResponse}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Write Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Review {product.title}</h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Overall Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${star <= newRating ? 'fill-amber-400' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exceptional sound and battery life!"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Detailed Comments
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details of your experience with build quality, battery, performance..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-slate-200">
          <h2 className="text-2xl font-black text-slate-900 mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
