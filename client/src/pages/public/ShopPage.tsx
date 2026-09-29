import React, { useEffect, useState } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import {
  SlidersHorizontal,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Star,
} from 'lucide-react';
import { Product, Category } from '../../types/index.js';
import { api } from '../../services/api.js';
import { ProductCard } from '../../components/common/ProductCard.js';

export const ShopPage: React.FC = () => {
  const outletCtx = useOutletContext<{ openQuickView?: (p: Product) => void }>() || {};
  const openQuickView = outletCtx.openQuickView || (() => {});
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter query parameters
  const currentQ = searchParams.get('q') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentMinRating = searchParams.get('minRating') || '';
  const currentInStock = searchParams.get('inStock') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Fetch filter metadata (categories, brands)
  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/products/filters')])
      .then(([catRes, filterRes]: any) => {
        if (catRes.success) setCategories(catRes.categories || []);
        if (filterRes.success) setBrands(filterRes.brands || []);
      })
      .catch(console.error);
  }, []);

  // Fetch products whenever search params change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams(searchParams);
        queryParams.set('limit', '12');

        const res: any = await api.get(`/products?${queryParams.toString()}`);
        if (res.success) {
          setProducts(res.products || []);
          if (res.pagination) {
            setPagination(res.pagination);
          }
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const updateFilter = (key: string, value: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === null || value === '') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    nextParams.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    currentQ || currentCategory || currentBrand || currentMinPrice || currentMaxPrice || currentMinRating || currentInStock
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Results Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200/80 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Explore Collection</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isLoading
              ? 'Loading catalog...'
              : `Showing ${products.length} of ${pagination.total} premium products`}
            {currentCategory && ` in ${currentCategory.replace(/-/g, ' ')}`}
          </p>
        </div>

        {/* Controls: Search & Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 hover:bg-slate-50"
          >
            <Filter className="w-4 h-4 text-brand-600" />
            Filters {hasActiveFilters && '(Active)'}
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={currentSort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-500 shadow-sm"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="bestselling">Best Selling</option>
              <option value="rating">Highest Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 py-4">
          <span className="text-xs font-bold text-slate-400">Active Filters:</span>
          {currentQ && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              Keyword: "{currentQ}"
              <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => updateFilter('q', null)} />
            </span>
          )}
          {currentCategory && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              Category: {currentCategory}
              <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => updateFilter('category', null)} />
            </span>
          )}
          {currentBrand && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              Brand: {currentBrand}
              <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => updateFilter('brand', null)} />
            </span>
          )}
          {currentMinRating && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              {currentMinRating}★ &amp; up
              <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => updateFilter('minRating', null)} />
            </span>
          )}
          {currentInStock === 'true' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              In Stock Only
              <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => updateFilter('inStock', null)} />
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-rose-600 hover:underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Grid with Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
        {/* Desktop Sidebar Filter */}
        <aside className="hidden lg:block space-y-8 pr-4 border-r border-slate-200/80">
          {/* Category Filter */}
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 mb-3">
              Categories
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => updateFilter('category', null)}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !currentCategory
                    ? 'bg-brand-50 text-brand-700 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => updateFilter('category', c.slug)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentCategory === c.slug
                      ? 'bg-brand-50 text-brand-700 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{c.name}</span>
                  {c.productCount !== undefined && (
                    <span className="text-[10px] text-slate-400 font-mono">({c.productCount})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          {brands.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 mb-3">
                Brands
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => updateFilter('brand', currentBrand === b ? null : b)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      currentBrand === b
                        ? 'bg-brand-50 text-brand-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{b}</span>
                    {currentBrand === b && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rating Filter */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 mb-3">
              Customer Rating
            </h3>
            <div className="space-y-1">
              {['4.5', '4.0', '3.5'].map((r) => (
                <button
                  key={r}
                  onClick={() => updateFilter('minRating', currentMinRating === r ? null : r)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    currentMinRating === r
                      ? 'bg-amber-50 text-amber-900 font-extrabold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{r}★ &amp; higher</span>
                </button>
              ))}
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 mb-3">
              Availability
            </h3>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={currentInStock === 'true'}
                onChange={(e) => updateFilter('inStock', e.target.checked ? 'true' : null)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              In Stock Only
            </label>
          </div>
        </aside>

        {/* Product Cards Grid Area */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square rounded-3xl bg-slate-200/60 animate-shimmer" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">No matching products found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Try clearing or adjusting your search keywords and filter criteria.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-brand-600 transition-colors shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} onQuickView={openQuickView} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12 pt-8 border-t border-slate-100">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => updateFilter('page', String(currentPage - 1))}
                    className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                  </button>

                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {[...Array(pagination.totalPages)].map((_, idx) => {
                      const p = idx + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => updateFilter('page', String(p))}
                          className={`w-9 h-9 rounded-xl transition-all ${
                            currentPage === p
                              ? 'bg-slate-900 text-white font-extrabold shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPage >= pagination.totalPages}
                    onClick={() => updateFilter('page', String(currentPage + 1))}
                    className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
