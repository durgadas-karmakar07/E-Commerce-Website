import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export const WishlistPage: React.FC = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const handleMoveToCart = async (product: any) => {
    try {
      await addToCart(product._id, 1);
      await removeFromWishlist(product._id);
      addToast(`${product.title} moved to cart!`, 'success');
    } catch (err) {
      addToast('Failed to move item to cart', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> My Saved Wishlist
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {wishlist.length} item(s) saved for later
          </p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-gray-900 text-base mb-1">Your Wishlist is Empty</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
            Explore our curated collections and save items you love to revisit or purchase later.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Browse Products <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const product = item.product;
            if (!product) return null;

            return (
              <div
                key={item._id || product._id}
                className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="relative group">
                  <Link to={`/product/${product._id}`}>
                    <img
                      src={
                        product.images?.[0]?.url ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'
                      }
                      alt={product.title}
                      className="w-full h-52 object-cover bg-gray-50 group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <button
                    type="button"
                    onClick={() => removeFromWishlist(product._id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-gray-400 hover:text-red-500 transition shadow-sm"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {product.discountPercentage > 0 && (
                    <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {product.discountPercentage}% OFF
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider block">
                      {product.brand || 'AURA Select'}
                    </span>
                    <Link to={`/product/${product._id}`}>
                      <h3 className="font-bold text-gray-900 text-sm mt-0.5 line-clamp-1 hover:text-indigo-600 transition">
                        {product.title}
                      </h3>
                    </Link>

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-gray-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{product.compareAtPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <p className={`text-[11px] font-semibold mt-1.5 ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMoveToCart(product)}
                    disabled={product.stock <= 0}
                    className="mt-4 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Move to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
