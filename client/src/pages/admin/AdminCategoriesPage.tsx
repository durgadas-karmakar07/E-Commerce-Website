import React, { useEffect, useState } from 'react';
import { Layers, Plus, Edit3, Trash2, X, Check, Search } from 'lucide-react';
import { api } from '../../services/api';
import { Category } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const { addToast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setName('');
    setSlug('');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800');
    setIsActive(true);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setIsActive(cat.isActive !== false);
    setEditingId(cat._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        image,
        isActive,
      };

      if (editingId) {
        const res = await api.updateCategory(editingId, payload);
        if (res.success) {
          addToast('Category updated successfully!', 'success');
          setIsModalOpen(false);
          fetchCategories();
        } else {
          addToast(res.message || 'Failed to update category', 'error');
        }
      } else {
        const res = await api.createCategory(payload);
        if (res.success) {
          addToast('New category created!', 'success');
          setIsModalOpen(false);
          fetchCategories();
        } else {
          addToast(res.message || 'Failed to create category', 'error');
        }
      }
    } catch (err: any) {
      addToast(err.message || 'Error saving category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      const res = await api.deleteCategory(id);
      if (res.success) {
        addToast('Category removed.', 'info');
        fetchCategories();
      } else {
        addToast(res.message || 'Failed to delete category', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Error deleting category', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" /> Categories Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize departments, navigation hierarchy, and catalog classification
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse" />
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-500 text-xs">
            No categories defined yet.
          </div>
        ) : (
          categories.map((c) => (
            <div
              key={c._id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="p-5 flex gap-4">
                <img
                  src={c.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300'}
                  alt={c.name}
                  className="w-16 h-16 rounded-2xl object-cover bg-slate-800 shrink-0 border border-slate-700"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm truncate">{c.name}</h3>
                  <span className="font-mono text-[10px] text-slate-500 block truncate">
                    /{c.slug}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {c.description || 'No description added.'}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-indigo-400 font-semibold text-[11px]">
                  {c.productCount ?? 0} Products
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c._id, c.name)}
                    className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-300 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {editingId ? 'Edit Category' : 'Create Category'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter classification parameters and display banner
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Smart Home & Audio"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="smart-home-audio"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Brief summary shown on category page..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Banner Image URL
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
