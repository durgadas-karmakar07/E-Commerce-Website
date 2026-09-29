import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Review } from '../../types';

export const MyReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await api.getMyReviews();
        if (res.success && res.data) {
          setReviews(res.data);
        }
      } catch (err) {
        console.error('Failed to load user reviews', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" /> My Ratings & Reviews
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Feedbacks shared to help the shopping community
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-base mb-1">No Reviews Submitted</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
            Share your experiences on items you’ve purchased to help other shoppers make informed choices.
          </p>
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
          >
            View Delivered Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r._id}
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-gray-900 ml-2">{r.title || 'Verified Review'}</span>
                </div>
                <span className="text-[11px] text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                {r.comment}
              </p>

              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">
                  Product ID: <span className="font-mono text-gray-700">{typeof r.product === 'string' ? r.product : (r.product as any)?._id || 'Verified item'}</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full font-semibold ${r.isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {r.isApproved ? 'Published' : 'Under Moderation'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
