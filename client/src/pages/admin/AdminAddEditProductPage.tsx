import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash2, Image, Layers, 
  Tag, CheckCircle, AlertCircle 
} from 'lucide-react';
import { api } from '../../services/api';
import { Category, Product } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminAddEditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('AURA Select');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number>(999);
  const [compareAtPrice, setCompareAtPrice] = useState<number>(1499);
  const [stock, setStock] = useState<number>(25);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Images list
  const [images, setImages] = useState<{ url: string; altText?: string; isPrimary?: boolean }[]>([
    { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', isPrimary: true }
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Specs
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([
    { key: 'Material', value: 'Premium Alloy / Matte Finish' }
  ]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');

  // Tags
  const [tags, setTags] = useState<string[]>(['Lifestyle', 'Trending']);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const catRes = await api.getCategories();
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
          if (!category && catRes.data.length > 0) {
            setCategory(catRes.data[0]._id);
          }
        }

        if (isEditing && id) {
          const prodRes = await api.getProductById(id);
          if (prodRes.success && prodRes.data) {
            const p: Product = prodRes.data;
            setTitle(p.title);
            setDescription(p.description);
            setCategory(typeof p.category === 'object' ? p.category?._id : p.category);
            setBrand(p.brand || 'AURA');
            setSku(p.sku);
            setPrice(p.price);
            setCompareAtPrice(p.compareAtPrice || p.price);
            setStock(p.stock);
            setLowStockThreshold(p.lowStockThreshold || 5);
            setIsPublished(p.isPublished);
            setIsFeatured(p.isFeatured || false);
            if (p.images && p.images.length > 0) {
              setImages(p.images);
            }
            if (p.specifications && p.specifications.length > 0) {
              setSpecs(p.specifications);
            }
            if (p.tags && p.tags.length > 0) {
              setTags(p.tags);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, isEditing]);

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages([...images, { url: newImageUrl.trim(), isPrimary: images.length === 0 }]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    if (!newSpecKey.trim() || !newSpecVal.trim()) return;
    setSpecs([...specs, { key: newSpecKey.trim(), value: newSpecVal.trim() }]);
    setNewSpecKey('');
    setNewSpecVal('');
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags([...tags, newTag.trim()]);
    setNewTag('');
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !sku || !category) {
      addToast('Please fill all mandatory fields (Title, SKU, Category, Price)', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title,
        description,
        category,
        brand,
        sku,
        price: Number(price),
        compareAtPrice: Number(compareAtPrice),
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold),
        isPublished,
        isFeatured,
        images,
        specifications: specs,
        tags,
      };

      if (isEditing && id) {
        const res = await api.updateProduct(id, payload);
        if (res.success) {
          addToast('Product successfully updated!', 'success');
          navigate('/admin/products');
        } else {
          addToast(res.message || 'Failed to update product', 'error');
        }
      } else {
        const res = await api.createProduct(payload);
        if (res.success) {
          addToast('New product added to catalog!', 'success');
          navigate('/admin/products');
        } else {
          addToast(res.message || 'Failed to create product', 'error');
        }
      }
    } catch (err: any) {
      addToast(err.message || 'Error saving product', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify pricing, descriptions, inventory, and image assets
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-column info */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Info */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Basic Product Details
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AURA Artisan Ceramic Vase"
                  className="w-full text-xs p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Highlight key design choices, build materials, warranty, and features..."
                  className="w-full text-xs p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. AURA Originals"
                    className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. AUR-VAS-01"
                    className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Pricing & Inventory
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    MRP / Compare Price (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Inventory Stock Units *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Product Media Gallery */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <Image className="w-4 h-4 text-indigo-400" /> Image Gallery
              </h2>
              <p className="text-[11px] text-slate-400 mb-3">
                Provide public CDN or high-res image URLs (Unsplash, Cloudinary, etc.)
              </p>

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Add Image
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-800 h-28">
                    <img src={img.url} alt="Product" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {img.isPrimary && (
                      <span className="absolute bottom-1 left-1 bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Technical Specifications
              </h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Feature Name (e.g. Dimensions)"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                  className="flex-1 text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 24 x 12 cm)"
                  value={newSpecVal}
                  onChange={(e) => setNewSpecVal(e.target.value)}
                  className="flex-1 text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Add
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {specs.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/40 rounded-xl border border-slate-800 text-xs">
                    <span className="font-semibold text-slate-300">{s.key}:</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{s.value}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar options */}
          <div className="space-y-6">
            {/* Category Selector */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> Category *
              </h2>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility & Flags */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Visibility & Promotion
              </h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                />
                <span className="text-xs text-slate-300 font-medium">Publish to Storefront</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                />
                <span className="text-xs text-slate-300 font-medium">Feature on Homepage</span>
              </label>
            </div>

            {/* Tags */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" /> Product Tags
              </h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Autumn"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 text-xs p-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-slate-300"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Product...' : isEditing ? 'Update Product' : 'Create Product'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Discard & Back
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminAddEditProductPage;
