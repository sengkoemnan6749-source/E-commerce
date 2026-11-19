import React, { useState, useEffect, useMemo } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquarePlus } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import { api } from '../../services/api';
import { productService } from '../../services/productService';
import { useToast, useLanguage, useAuth } from '../../store/StoreContext';

export default function ProductReviews({ productId, rating = 0, reviewsCount = 0 }) {
  const { addToast } = useToast();
  const { language } = useLanguage();
  const { user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [submitting, setSubmitting] = useState(false);
  const [liveRating, setLiveRating] = useState(rating);
  const [liveCount, setLiveCount] = useState(reviewsCount);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    name: user?.fullName || user?.name || '',
    rating: 5,
    title: '',
    comment: ''
  });

  useEffect(() => {
    setLiveRating(rating);
    setLiveCount(reviewsCount);
  }, [rating, reviewsCount]);

  useEffect(() => {
    if (user && !newReview.name) {
      setNewReview((prev) => ({ ...prev, name: user.fullName || user.name || '' }));
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!productId) {
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    api.get(`/products/${encodeURIComponent(productId)}/reviews`)
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setReviews(list);
        if (list.length > 0 && !liveCount) {
          setLiveCount(list.length);
        }
      })
      .catch(() => {
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [productId]);

  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const s = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      counts[s] += 1;
    });
    const total = reviews.length;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      pct: total > 0 ? Math.round((counts[star] / total) * 100) : 0
    }));
  }, [reviews]);

  const handleHelpful = async (id) => {
    if (!user) {
      addToast(
        language === 'km'
          ? 'សូមចូលគណនីជាមុនដើម្បីបោះឆ្នោតថាមតិយោបល់នេះមានប្រយោជន៍'
          : 'Please sign in to mark reviews as helpful',
        'info'
      );
      return;
    }

    const votedKey = 'techtonic_helpful_reviews';
    let votedSet = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(votedKey) || '[]');
      if (Array.isArray(saved)) votedSet = new Set(saved);
    } catch {
      votedSet = new Set();
    }

    if (votedSet.has(id)) {
      addToast(
        language === 'km' ? 'អ្នកបានបោះឆ្នោតថាមតិយោបល់នេះមានប្រយោជន៍រួចហើយ' : 'You already marked this review helpful',
        'info'
      );
      return;
    }

    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpful: (r.helpful || 0) + 1 } : r))
    );

    if (productId) {
      try {
        const res = await api.post(
          `/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(id)}/helpful`,
          {}
        );
        const persistedHelpful = res?.data?.helpful;
        if (typeof persistedHelpful === 'number') {
          setReviews((prev) =>
            prev.map((r) => (r.id === id ? { ...r, helpful: persistedHelpful } : r))
          );
        }
        votedSet.add(id);
        localStorage.setItem(votedKey, JSON.stringify([...votedSet].slice(-200)));
      } catch {
        // Revert optimistic increment if persistence fails
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, helpful: Math.max(0, (r.helpful || 1) - 1) } : r))
        );
        return;
      }
    }

    addToast(
      language === 'km' ? 'បានសម្គាល់ថាមតិយោបល់នេះមានប្រយោជន៍' : 'Marked review as helpful',
      'info'
    );
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast(
        language === 'km'
          ? 'សូមចូលគណនីជាមុនដើម្បីសរសេរមតិយោបល់'
          : 'Please sign in to submit a product review',
        'error'
      );
      return;
    }
    if (!newReview.name.trim() || !newReview.comment.trim()) {
      addToast(
        language === 'km' ? 'សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់' : 'Please complete all required fields',
        'error'
      );
      return;
    }

    if (!productId) {
      addToast('Missing product ID for review submission.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await productService.addReviewRemote(productId, {
        author: newReview.name.trim(),
        rating: Number(newReview.rating),
        title: newReview.title.trim() || 'Verified Customer Review',
        comment: newReview.comment.trim()
      });

      const created = res?.data || {
        id: `rev-${Date.now()}`,
        author: newReview.name.trim(),
        location: 'Phnom Penh, Cambodia',
        rating: Number(newReview.rating),
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        verified: Boolean(user),
        title: newReview.title.trim() || 'Verified Customer Review',
        comment: newReview.comment.trim(),
        helpful: 0
      };

      setReviews((prev) => [created, ...prev]);
      if (res?.meta?.rating !== undefined) setLiveRating(res.meta.rating);
      if (res?.meta?.reviewsCount !== undefined) {
        setLiveCount(res.meta.reviewsCount);
      } else {
        setLiveCount((c) => c + 1);
      }
      setIsModalOpen(false);
      setNewReview({
        name: user?.fullName || user?.name || '',
        rating: 5,
        title: '',
        comment: ''
      });
      addToast(
        language === 'km'
          ? 'សូមអរគុណ! មតិយោបល់របស់អ្នកត្រូវបានរក្សាទុក និងបង្ហោះរួចរាល់។'
          : 'Thank you! Your review has been saved and published.',
        'success'
      );
    } catch (err) {
      addToast(err?.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Review Header & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200">
        {/* Left Rating score */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-100">
          <div className="text-5xl font-black text-slate-900 tracking-tight mb-2">
            {Number(liveRating || 0).toFixed(1)}
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(Number(liveRating || 0))
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {language === 'km'
              ? `ផ្អែកលើមតិយោបល់ចំនួន ${liveCount || reviews.length}`
              : `Based on ${liveCount || reviews.length} customer reviews`}
          </p>
        </div>

        {/* Middle: Rating distribution */}
        <div className="flex flex-col justify-center gap-2">
          {distribution.map((bar) => (
            <div key={bar.star} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-medium text-slate-600 flex items-center gap-0.5">{bar.star} <Star className="w-3 h-3 text-amber-400 fill-amber-400 inline" /></span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-slate-400 font-mono">{bar.pct}%</span>
            </div>
          ))}
        </div>

        {/* Right: Write Review CTA */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-t md:border-t-0 md:border-l border-slate-100">
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            {language === 'km' ? 'តើអ្នកបានសាកល្បងឧបករណ៍នេះហើយឬនៅ?' : 'Have you tested this device?'}
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'km'
              ? 'ចែករំលែកបទពិសោធន៍របស់អ្នកជាមួយសហគមន៍ TechTonic'
              : 'Share your experience with the TechTonic community'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!user) {
                addToast(
                  language === 'km'
                    ? 'សូមចូលគណនីជាមុនដើម្បីសរសេរមតិយោបល់'
                    : 'Please sign in to write a review',
                  'info'
                );
                return;
              }
              setIsModalOpen(true);
            }}
          >
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            {language === 'km' ? 'សរសេរមតិយោបល់' : 'Write a Review'}
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
            {language === 'km' ? 'កំពុងផ្ទុកមតិយោបល់អតិថិជន...' : 'Loading customer reviews...'}
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
            {language === 'km'
              ? 'មិនទាន់មានមតិយោបល់សម្រាប់ផលិតផលនេះនៅឡើយទេ។ ក្លាយជាអ្នកដំបូងដែលសរសេរមតិយោបល់!'
              : 'No customer reviews for this product yet. Be the first to review!'}
          </div>
        ) : (
          reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 text-sm">{rev.author}</span>
                  {rev.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      {language === 'km' ? 'ការទិញដែលបានផ្ទៀងផ្ទាត់' : 'Verified Purchase'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{(language === 'km' && rev.locationKm ? rev.locationKm : rev.location) || 'Phnom Penh, Cambodia'}</span>
                  <span>•</span>
                  <span>{(language === 'km' && rev.dateKm ? rev.dateKm : rev.date) || (rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : '')}</span>
                </div>
              </div>

              {/* Review Stars */}
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < rev.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <h5 className="text-sm font-bold text-slate-800 mb-1.5">
              {language === 'km' && rev.titleKm ? rev.titleKm : rev.title}
            </h5>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              {language === 'km' && rev.commentKm ? rev.commentKm : rev.comment}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>
                {language === 'km' ? 'តើមតិយោបល់នេះមានប្រយោជន៍ដែរឬទេ?' : 'Was this review helpful?'}
              </span>
              <button
                type="button"
                onClick={() => handleHelpful(rev.id)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>
                  {language === 'km' ? `មានប្រយោជន៍ (${rev.helpful || 0})` : `Helpful (${rev.helpful || 0})`}
                </span>
              </button>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Review Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={language === 'km' ? 'សរសេរមតិយោបល់អតិថិជន' : 'Write a Customer Review'}
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <Input
            label={language === 'km' ? 'ឈ្មោះរបស់អ្នក *' : 'Your Name *'}
            placeholder={language === 'km' ? 'ឧ. Sara Meng' : 'e.g. Sara Meng'}
            value={newReview.name}
            onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {language === 'km' ? 'ការវាយតម្លៃ' : 'Rating'}
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: s })}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      s <= newReview.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-700 ml-2">
                {language === 'km'
                  ? `${newReview.rating} ក្នុងចំណោមផ្កាយ ៥`
                  : `${newReview.rating} out of 5 stars`}
              </span>
            </div>
          </div>

          <Input
            label={language === 'km' ? 'ចំណងជើងមតិយោបល់' : 'Review Headline'}
            placeholder={
              language === 'km'
                ? 'ឧ. គុណភាពផលិតល្អប្រណីត និងថ្មកាន់បានយូរ'
                : 'e.g. Premium build and superb battery'
            }
            value={newReview.title}
            onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {language === 'km' ? 'មតិយោបល់របស់អ្នក *' : 'Your Review *'}
            </label>
            <textarea
              rows={4}
              required
              placeholder={
                language === 'km'
                  ? 'តើអ្នកចូលចិត្ត ឬមិនចូលចិត្តអ្វីខ្លះអំពីផលិតផលនេះ? តើវាដំណើរការយ៉ាងដូចម្ដេចសម្រាប់ការងាររបស់អ្នក?'
                  : 'What did you like or dislike about this product? How is the performance for your work setup?'
              }
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting
                ? (language === 'km' ? 'កំពុងបញ្ជូន...' : 'Submitting...')
                : (language === 'km' ? 'បញ្ជូនមតិយោបល់' : 'Submit Review')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
