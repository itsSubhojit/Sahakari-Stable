import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { Rating } from '../common/Rating';
import { Button } from '../common/Button';

export const WorkerCard = ({ worker, onNegotiate, onSelect }) => {
  const navigate = useNavigate();

  const handleBidClick = (e) => {
    e.stopPropagation();
    if (onNegotiate) {
      onNegotiate(worker);
    } else {
      navigate(`/booking/BK-7892?worker=${worker.id}`);
    }
  };

  const handleBookClick = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(worker);
    } else {
      navigate(`/booking/BK-7892?worker=${worker.id}`);
    }
  };

  return (
    <div className="group bg-surface border border-outline-variant/70 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-primary/50 transition-all duration-300 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <Avatar
          src={worker.avatar}
          alt={worker.name}
          size="md"
          className="w-12 h-12 rounded-xl object-cover ring-1 ring-outline-variant/50"
        />

        <div className="min-w-0">
          <h3 className="font-display text-base font-bold text-on-surface truncate group-hover:text-primary transition-colors">
            {worker.name}
          </h3>
          <div className="mt-0.5">
            <Rating score={worker.rating} reviewsCount={worker.reviewsCount} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBidClick}
          icon="attach_money"
          className="text-xs px-3 py-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
        >
          Bid
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleBookClick}
          icon="edit_document"
          className="text-xs px-3.5 py-1.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
        >
          Book Pro
        </Button>
      </div>
    </div>
  );
};


