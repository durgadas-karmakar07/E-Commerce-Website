import React, { useEffect, useState } from 'react';
import { Award, Flame, ShoppingBag } from 'lucide-react';
import { api } from '../../services/api';
import { Product } from '../../types';
import ProductCard from '../../components/common/ProductCard';

export const BestSellersPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        // First try analytics endpoint, fallback to sorted products
        const res = await api.getBestSellers(20);
        if (res.success && res.data && res.data.length > 0) {
          // If items returned are populated with product or are product objects
          const items = res.data.map((item: any) => item.product || item);
          setProducts(items.filter((p: any) => p && p.title));
        } else {
          // Fallback to top-rated / high-volume products
          const fallbackRes = await api.getProducts({ sort: 'rating', limit: 20 });
          if (fallbackRes.success && fallbackRes.data) {
            setProducts(fallbackRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to load best sellers', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-3">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Top Customer Favorites
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Best Selling Products
        </h1>
        <p className="mt-3 text-base text-gray-500">
          Ranked by real verified purchases and highest customer satisfaction ratings.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No best seller records available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product, idx) => (
            <div key={product._id} className="relative group">
              {idx < 3 && (
                <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
                  <Award className="w-3 h-3" /> #{idx + 1} Best Seller
                </div>
              )}
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BestSellersPage;
