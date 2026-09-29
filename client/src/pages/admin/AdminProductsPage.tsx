import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Plus, Search, Edit3, Trash2, Eye, EyeOff, 
  Filter, AlertTriangle, ArrowUpDown 
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, Category } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const { addToast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getAdminProducts(),
        api.getCategories(),
      ]);
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data);
      }
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await api.deleteProduct(id);
      if (res.success) {
        addToast('Product removed from catalog.', 'info');
        fetchProducts();
      } else {
        addToast(res.message || 'Failed to delete product', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Error deleting product', 'error');
    }
  };

  const handleTogglePublish = async (product: Product) => {
    try {
      const res = await api.updateProduct(product._id, { isPublished: !product.isPublished });
      if (res.success) {
        addToast(`Product ${!product.isPublished ? 'published' : 'hidden from store'}.`, 'success');
        fetchProducts();
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to update visibility', 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const catId = typeof p.category === 'string' ? p.category : p.category?._id;
    const matchCategory = !selectedCategory || catId === selectedCategory;

    const matchStock = stockFilter === 'all' ? true :
      stockFilter === 'low' ? p.stock <= 5 && p.stock > 0 :
      stockFilter === 'out' ? p.stock === 0 : true;

    return matchSearch && matchCategory && matchStock;
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" /> Products Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your store's inventory, variants, prices, and media gallery ({products.length} total)
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </Link>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by title, SKU, brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 text-xs text-white rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-slate-800 text-xs text-white rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 text-xs text-white rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Stock Statuses</option>
          <option value="low">Low Stock (&le; 5)</option>
          <option value="out">Out of Stock (0)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading product records...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No products found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">SKU / Brand</th>
                  <th className="py-3 px-4">Price / MRP</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredProducts.map((product) => {
                  const isLow = product.stock <= 5 && product.stock > 0;
                  const isOut = product.stock === 0;

                  return (
                    <tr key={product._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt={product.title}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/admin/products/${product._id}/edit`}
                            className="font-bold text-white hover:text-indigo-400 transition truncate block max-w-xs"
                          >
                            {product.title}
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {typeof product.category === 'object' ? product.category?.name : 'Product'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-300 block">{product.sku || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400">{product.brand}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-white">₹{product.price.toLocaleString('en-IN')}</span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="block text-[10px] text-slate-500 line-through">
                            ₹{product.compareAtPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOut ? 'bg-red-500/20 text-red-400' :
                          isLow ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(product)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                            product.isPublished
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {product.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {product.isPublished ? 'Published' : 'Hidden'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          to={`/admin/products/${product._id}/edit`}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition inline-block"
                          title="Edit Product"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(product._id, product.title)}
                          className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition inline-block"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
