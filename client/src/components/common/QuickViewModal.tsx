import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Star, ShoppingBag, Heart, Check, ArrowRight } from 'lucide-react';
import { Product } from '../../types/index.js';
import { useCart } from '../../context/CartContext.js';
import { useWishlist } from '../../context/WishlistContext.js';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart, isLoading } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantSku, setSelectedVariantSku] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isSaved = isInWishlist(product._id);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    await addToCart(product._id, selectedVariantSku || product.variants?.[0]?.sku || product.sku, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery Column */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between bg-slate-50 border-r border-slate-100">
          <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm relative">
            <img
              src={product.images[selectedImage] || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />
            {product.discountPercent > 0 && (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">
                -{product.discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === idx ? 'border-brand-600 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-brand-600 mb-1">
              {product.brand}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {product.title}
            </h2>

            {/* Rating & SKU */}
            <div className="flex items-center gap-3 mt-2 text-sm">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="ml-1 font-bold text-slate-900">{product.averageRating || 4.8}</span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">{product.reviewCount || 15} verified reviews</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-mono text-slate-400">SKU: {product.sku}</span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900">
                ₹{product.sellingPrice.toLocaleString('en-IN')}
              </span>
              {product.mrp > product.sellingPrice && (
                <span className="text-base text-slate-400 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
              )}
              {product.mrp > product.sellingPrice && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Save ₹{(product.mrp - product.sellingPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="mt-4 text-sm text-slate-600 line-clamp-3 leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Variant
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.sku}
                      onClick={() => setSelectedVariantSku(v.sku)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedVariantSku === v.sku || (!selectedVariantSku && v.sku === product.variants[0].sku)
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

            {/* Quantity */}
            <div className="mt-5 flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Quantity</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 font-bold text-slate-600 hover:text-slate-900"
                >
                  -
                </button>
                <span className="px-3 py-1 font-bold text-sm text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3 py-1 font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-500">
                {product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isLoading}
              className={`flex-1 py-3 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-card ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-brand-600 active:scale-95'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>

            <button
              onClick={() => toggleWishlist(product)}
              className={`p-3 rounded-2xl border transition-all ${
                isSaved
                  ? 'bg-rose-50 border-rose-200 text-rose-500'
                  : 'border-slate-200 text-slate-600 hover:text-rose-500 hover:bg-slate-50'
              }`}
              title="Save to Wishlist"
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-500' : ''}`} />
            </button>

            <Link
              to={`/product/${product.slug}`}
              onClick={onClose}
              className="p-3 rounded-2xl border border-slate-200 text-slate-600 hover:text-brand-600 hover:bg-slate-50 transition-colors"
              title="View Full Product Page"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
