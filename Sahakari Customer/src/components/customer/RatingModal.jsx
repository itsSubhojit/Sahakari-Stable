import React, { useState } from 'react';
import { Button } from '../common/Button';

const RatingModal = ({ isOpen, onClose, worker, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    
    onSubmit({ rating, review });
    setRating(0);
    setReview('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/60">
          <h2 className="text-lg font-bold text-primary">Rate your Worker</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-3">
            {worker?.avatar ? (
              <img
                src={worker.avatar}
                alt={worker?.name || 'Worker'}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center border-2 border-primary/20">
                <span className="material-symbols-outlined text-3xl">person</span>
              </div>
            )}
            <div className="text-center">
              <h3 className="font-bold text-slate-800 text-lg">
                {worker?.name || 'Worker'}
              </h3>
              <p className="text-xs text-slate-500">How was your experience?</p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <span
                  className={`material-symbols-outlined text-4xl transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'text-amber-400 [font-variation-settings:\'FILL\'_1]'
                      : 'text-slate-300'
                  }`}
                >
                  star
                </span>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-xs font-bold text-amber-600 animate-fade-in-up">
              {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
            </p>
          )}

          {/* Review Text */}
          <div className="space-y-2">
            <label htmlFor="review" className="text-xs font-bold text-slate-700">
              Leave a Review (Optional)
            </label>
            <textarea
              id="review"
              rows="3"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell us what you liked (or didn't like)..."
              className="w-full text-sm p-3 border border-outline-variant rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Submit Action */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={rating === 0 || isSubmitting}
            loading={isSubmitting}
            className="py-3"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
