import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react';
import type { Product } from '../../types/index.js';
import { useCart } from '../../context/CartContext.js';
import { useWishlist } from '../../context/WishlistContext.js';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart, isLoading } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);

  const isSaved = isInWishlist(product._id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);

  const currentPrice = product.sellingPrice || product.price || 0;
  const comparePrice = product.mrp || product.compareAtPrice || currentPrice;
  const discount = product.discountPercent || product.discountPercentage || 0;

  const firstImage = typeof product.images?.[0] === 'string'
    ? product.images[0]
    : (product.images?.[0] as any)?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';

  const productLink = `/product/${product._id || product.slug}`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    setIsAdding(true);
    await addToCart(product._id, product.variants?.[0]?.sku || product.sku, 1);
    setIsAdding(false);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  };

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-subtle hover:shadow-premium transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Container */}
      <Link to={productLink} className="relative aspect-square w-full overflow-hidden bg-slate-50 block">
        <img
          src={firstImage}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">
              -{discount}%
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-sm">
              Featured
            </span>
          )}
        </div>

        {/* Wishlist & Quick View Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button
            onClick={handleToggleWishlist}
            aria-label="Save to Wishlist"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-card ${
              isSaved
                ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white backdrop-blur-sm'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
          </button>

          {onQuickView && (
            <button
              onClick={handleQuickView}
              aria-label="Quick View"
              className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-brand-600 flex items-center justify-center transition-all shadow-card backdrop-blur-sm opacity-0 group-hover:opacity-100"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stock Status Ribbon if Out of Stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider shadow-md">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-600 uppercase tracking-wider">{product.brand}</span>
            {isLowStock && !isOutOfStock && (
              <span className="text-amber-600 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-full">
                Only {product.stock} left!
              </span>
            )}
          </div>

          {/* Title */}
          <Link
            to={productLink}
            className="font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-2 text-base leading-snug"
          >
            {product.title}
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {product.averageRating || product.ratingAverage || '4.8'}
            </span>
            <span className="text-xs text-slate-400">
              ({product.reviewCount || product.ratingCount || 12})
            </span>
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-slate-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {comparePrice > currentPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{comparePrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding || isLoading}
            className={`p-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-brand-600 active:scale-95'
            }`}
            title={isOutOfStock ? 'Currently out of stock' : 'Add to cart'}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{isOutOfStock ? 'Sold Out' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
