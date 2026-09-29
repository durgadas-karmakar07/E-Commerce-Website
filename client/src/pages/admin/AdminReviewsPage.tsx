import React, { useEffect, useState } from 'react';
import { Star, Check, X, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Review } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminReviews();
      if (res.success && res.data) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApprove = async (review: Review) => {
    try {
      const res = await api.moderateReview(review._id, { isApproved: !review.isApproved });
      if (res.success) {
        addToast(`Review ${!review.isApproved ? 'approved' : 'hidden from public'}.`, 'success');
        fetchReviews();
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to moderate review', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this customer review?')) return;
    try {
      const res = await api.deleteReview(id);
      if (res.success) {
        addToast('Review deleted.', 'info');
        fetchReviews();
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to delete review', 'error');
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400" /> Customer Reviews Moderation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit testimonials, verify purchase status, and regulate public storefront feedback
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Average Store Rating</span>
            <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
              ★ {avgRating} / 5.0
            </span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Reviews</span>
            <span className="text-sm font-bold text-white">{reviews.length}</span>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No reviews submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4">Rating & Subject</th>
                  <th className="py-3 px-4">Comment</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Moderation Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {reviews.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">
                        {r.user?.name || 'Customer'}
                      </span>
                      <span className="text-[10px] text-slate-500">{r.user?.email}</span>
                      {r.isVerifiedPurchase && (
                        <span className="inline-block mt-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                          Verified Buyer
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-0.5 text-amber-400 font-bold">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      <span className="font-semibold text-slate-200 block mt-1">
                        {r.title || 'Review'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-sm">
                      <p className="line-clamp-2">{r.comment}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.isApproved
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {r.isApproved ? 'Published' : 'Hidden'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleToggleApprove(r)}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                          r.isApproved
                            ? 'bg-slate-800 text-slate-400 hover:text-white'
                            : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                        }`}
                        title={r.isApproved ? 'Hide from public' : 'Approve for public view'}
                      >
                        {r.isApproved ? 'Hide' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r._id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-300 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviewsPage;
