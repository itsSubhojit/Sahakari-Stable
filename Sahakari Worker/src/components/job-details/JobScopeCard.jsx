import React, { useState } from 'react';
import { useNegotiation } from '../../context/NegotiationContext';

export const JobScopeCard = () => {
  const { activeLead } = useNegotiation();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranscription, setShowTranscription] = useState(true);

  const scope = activeLead.jobScope;

  const toggleAudioPlay = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-4 md:p-5 shadow-elevation-1 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-outline uppercase tracking-wider">
          Job Scope & Diagnostics
        </h3>
        <span className="text-xs font-semibold text-secondary flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          {scope.preferredTiming}
        </span>
      </div>

      {/* Scope Summary Description */}
      <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60">
        <p className="text-xs md:text-sm text-on-surface leading-relaxed">
          {scope.summary}
        </p>
      </div>

      {/* Audio Memo from Client (if exists) */}
      {scope.voiceNote && (
        <div className="p-3 bg-primary-fixed/20 border border-primary-fixed-dim rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAudioPlay}
                className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform"
                aria-label={isPlayingAudio ? 'Pause Voice Note' : 'Play Voice Note'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isPlayingAudio ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <div>
                <div className="text-xs font-bold text-on-surface">
                  Client Audio Note
                </div>
                <div className="text-[10px] text-outline font-mono">
                  {scope.voiceNote.duration} • {isPlayingAudio ? 'Playing...' : 'Audio message'}
                </div>
              </div>
            </div>

            {/* Fake wave visualizer */}
            <div className="flex items-center gap-1 h-5">
              {[40, 70, 30, 90, 50, 80, 60, 100, 45, 85].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isPlayingAudio
                      ? 'bg-primary dark:bg-primary-fixed animate-pulse'
                      : 'bg-outline-variant'
                  }`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Transcription */}
          {showTranscription && (
            <p className="text-[11px] text-on-surface-variant italic bg-surface/70 p-2 rounded border border-outline-variant/40">
              "{scope.voiceNote.transcription}"
            </p>
          )}
        </div>
      )}

      {/* Recommended Tools Checklist */}
      <div>
        <h4 className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed">
            construction
          </span>
          Required Tools / Materials
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {scope.toolsRequired.map((tool, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container text-xs text-on-surface font-medium rounded-md border border-outline-variant/60"
            >
              <span className="material-symbols-outlined text-[14px] text-primary">
                check
              </span>
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
