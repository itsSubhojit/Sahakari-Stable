import React from 'react';
import { useNegotiation } from '../../context/NegotiationContext';

export const PhotoGalleryLightbox = () => {
  const { activeLead, openPhotoLightbox } = useNegotiation();
  const photos = activeLead.jobScope.photos;

  if (!photos || photos.length === 0) return null;

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-4 md:p-5 shadow-elevation-1 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-outline uppercase tracking-wider">
          Site Inspection Media ({photos.length})
        </h3>
        <span className="text-[11px] text-on-surface-variant">Tap to inspect</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => openPhotoLightbox(photo)}
            className="group relative rounded-lg overflow-hidden border border-outline-variant cursor-pointer aspect-video bg-surface-container"
          >
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
              <p className="text-white text-xs font-medium line-clamp-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  zoom_in
                </span>
                {photo.caption}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
