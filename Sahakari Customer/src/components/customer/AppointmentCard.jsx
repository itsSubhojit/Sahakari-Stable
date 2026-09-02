import React from 'react';
import { Card } from '../common/Card';

export const AppointmentCard = ({
  dateTime = 'Oct 24, 2026 - 10:00 AM',
  location = 'Address not specified',
  taskDescription = 'Complete rewiring of the living room and installation of two new ceiling fans. Materials will be provided by the worker.',
  onEdit,
}) => {
  return (
    <Card variant="surface" padding="md" className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
          Appointment Summary
        </h4>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-label-sm text-primary hover:underline font-semibold"
          >
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
          </div>
          <div>
            <p className="font-label-sm text-on-surface-variant">Date & Time</p>
            <p className="font-body-md text-on-surface font-medium">{dateTime}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">location_on</span>
          </div>
          <div>
            <p className="font-label-sm text-on-surface-variant">Service Location</p>
            <p className="font-body-md text-on-surface font-medium">{location}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 sm:col-span-2 pt-2 border-t border-outline-variant/40">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">build</span>
          </div>
          <div>
            <p className="font-label-sm text-on-surface-variant">Task Description</p>
            <p className="font-body-md text-on-surface leading-relaxed">{taskDescription}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
