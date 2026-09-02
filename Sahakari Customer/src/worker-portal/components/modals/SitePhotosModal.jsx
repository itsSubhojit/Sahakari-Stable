import React from 'react';
import { useNegotiation } from '../../context/NegotiationContext';

export const SitePhotosModal = () => {
  const {
    isPhotoLightboxOpen,
    activePhoto,
    closePhotoLightbox,
    activeLead,
  } = useNegotiation();

  if (!isPhotoLightboxOpen || !activePhoto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={closePhotoLightbox}
      />

      {/* Lightbox Container */}
      <div className="relative z-10 max-w-4xl w-full bg-surface-container-lowest rounded-xl overflow-hidden shadow-elevation-4 border border-outline-variant animate-scale-in">
        {/* Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-on-surface">
              Site Inspection Photo • {activeLead.id}
            </h3>
            <p className="text-xs text-on-surface-variant">{activePhoto.caption}</p>
          </div>
          <button
            onClick={closePhotoLightbox}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Full Image */}
        <div className="p-4 bg-black/90 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-hidden">
          <img
            src={activePhoto.url}
            alt={activePhoto.caption}
            className="max-h-[65vh] w-auto object-contain rounded-lg shadow-elevation-3"
          />
        </div>

        {/* Footer info */}
        <div className="p-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
          <span>Captured by client during request submission</span>
          <span className="font-semibold text-primary dark:text-primary-fixed">
            Verified Inspection Asset
          </span>
        </div>
      </div>
    </div>
  );
};
