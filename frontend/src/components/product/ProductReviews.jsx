import React, { useState } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquarePlus } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import { useToast, useLanguage } from '../../store/StoreContext';

const DEFAULT_REVIEWS = [
  {
    id: 1,
    author: 'Vireak S.',
    location: 'Phnom Penh, Cambodia',
    locationKm: 'ភ្នំពេញ, កម្ពុជា',
    rating: 5,
    date: 'September 18, 2026',
    dateKm: '១៨ កញ្ញា ២០២៦',
    verified: true,
    title: 'Exceeded all expectations for software engineering setup',
    titleKm: 'លើសពីការរំពឹងទុកសម្រាប់ការរៀបចំតុធ្វើការសរសេរកូដ',
    comment: 'The build quality is incredible. Fast delivery within 3 hours in Toul Kork via GrabExpress. Pairs instantly with my MacBook and Windows workstation.',
    commentKm: 'គុណភាពផលិតល្អអស្ចារ្យណាស់។ ដឹកជញ្ជូនរហ័សក្នុងរយៈពេល ៣ ម៉ោងនៅទួលគោកតាមរយៈ GrabExpress។ ភ្ជាប់បានភ្លាមៗជាមួយ MacBook និងកុំព្យូទ័រ Windows របស់ខ្ញុំ។',
    helpful: 18
  },
  {
    id: 2,
    author: 'Dara Chan',
    location: 'Siem Reap, Cambodia',
    locationKm: 'សៀមរាប, កម្ពុជា',
    rating: 5,
    date: 'September 12, 2026',
    dateKm: '១២ កញ្ញា ២០២៦',
    verified: true,
    title: 'Crisp sound and premium tactile feedback',
    titleKm: 'សំឡេងច្បាស់ល្អ និងការប៉ះបញ្ជាមានគុណភាពខ្ពស់',
    comment: 'I upgraded from an older model and the difference is day and night. Battery life lasts nearly 2 weeks on normal use. Worth every cent.',
    commentKm: 'ខ្ញុំបានប្តូរពីម៉ូដែលចាស់ ហើយភាពខុសគ្នាគឺដាច់ស្រឡះ។ ថ្មកាន់បានជិត ២ សប្តាហ៍សម្រាប់ការប្រើប្រាស់ធម្មតា។ ស័ក្តិសមនឹងតម្លៃពិតៗ។',
    helpful: 9
  },
  {
    id: 3,
    author: 'Sreynich Pich',
    location: 'Battambang, Cambodia',
    locationKm: 'បាត់ដំបង, កម្ពុជា',
    rating: 4,
    date: 'August 28, 2026',
    dateKm: '២៨ សីហា ២០២៦',
    verified: true,
    title: 'Solid engineering, sleek aesthetic',
    titleKm: 'រចនាសម្ព័ន្ធរឹងមាំ និងរូបរាងទាន់សម័យ',
    comment: 'Minimalist design matches my workspace setup perfectly. Only minor note is that the charging cable is slightly short, but 100W GaN performance is top tier.',
    commentKm: 'ការរចនាសាមញ្ញស៊ីគ្នាឥតខ្ចោះជាមួយតុធ្វើការរបស់ខ្ញុំ។ មានតែចំណុចតូចមួយគឺខ្សែសាករាងខ្លីបន្តិច ប៉ុន្តែសមត្ថភាព GaN 100W គឺកំពូលតែម្ដង។',
    helpful: 4
  }
];

export default function ProductReviews({ rating = 4.8, reviewsCount = 24 }) {
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, title: '', comment: '' });
  const { addToast } = useToast();
  const { language } = useLanguage();

  const handleHelpful = (id) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r))
    );
    addToast(
      language === 'km' ? 'បានសម្គាល់ថាមតិយោបល់នេះមានប្រយោជន៍' : 'Marked review as helpful',
      'info'
    );
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) {
      addToast(
        language === 'km' ? 'សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់' : 'Please complete all required fields',
        'error'
      );
      return;
    }

    const reviewObj = {
      id: Date.now(),
      author: newReview.name,
      location: 'Phnom Penh, Cambodia',
      locationKm: 'ភ្នំពេញ, កម្ពុជា',
      rating: Number(newReview.rating),
      date: 'Just now',
      dateKm: 'ទើបតែបញ្ចូល',
      verified: true,
      title: newReview.title || 'Verified TechTonic Customer Review',
      titleKm: newReview.title || 'មតិយោបល់អតិថិជន TechTonic ដែលបានផ្ទៀងផ្ទាត់',
      comment: newReview.comment,
      helpful: 0
    };

    setReviews([reviewObj, ...reviews]);
    setIsModalOpen(false);
    setNewReview({ name: '', rating: 5, title: '', comment: '' });
    addToast(
      language === 'km'
        ? 'សូមអរគុណ! មតិយោបល់ដែលបានផ្ទៀងផ្ទាត់របស់អ្នកត្រូវបានបង្ហោះរួចរាល់។'
        : 'Thank you! Your verified review has been published.',
      'success'
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Review Header & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200">
        {/* Left Rating score */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-100">
          <div className="text-5xl font-black text-slate-900 tracking-tight mb-2">
            {rating}
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {language === 'km'
              ? `ផ្អែកលើការទិញដែលបានផ្ទៀងផ្ទាត់ចំនួន ${reviewsCount}`
              : `Based on ${reviewsCount} verified purchases`}
          </p>
        </div>

        {/* Middle: Rating distribution */}
        <div className="flex flex-col justify-center gap-2">
          {[
            { star: 5, pct: 85 },
            { star: 4, pct: 12 },
            { star: 3, pct: 3 },
            { star: 2, pct: 0 },
            { star: 1, pct: 0 }
          ].map((bar) => (
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
          <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            {language === 'km' ? 'សរសេរមតិយោបល់' : 'Write a Review'}
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="flex flex-col gap-4">
        {reviews.map((rev) => (
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
                  <span>{language === 'km' && rev.locationKm ? rev.locationKm : rev.location}</span>
                  <span>•</span>
                  <span>{language === 'km' && rev.dateKm ? rev.dateKm : rev.date}</span>
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
                  {language === 'km' ? `មានប្រយោជន៍ (${rev.helpful})` : `Helpful (${rev.helpful})`}
                </span>
              </button>
            </div>
          </div>
        ))}
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
            <Button variant="primary" type="submit">
              {language === 'km' ? 'បញ្ជូនមតិយោបល់' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
