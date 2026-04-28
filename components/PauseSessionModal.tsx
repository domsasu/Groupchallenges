import React from 'react';
import { Icons } from './Icons';

interface PauseSessionModalProps {
  xpEarned: number;
  itemsLeft: number;
  timeRemaining: number; // in seconds
  onResume: () => void;
  onEndSession: () => void;
}

// Helper to format seconds to MM:SS display
const formatTimeDisplay = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PauseSessionModal: React.FC<PauseSessionModalProps> = ({
  xpEarned,
  itemsLeft,
  timeRemaining,
  onResume,
  onEndSession
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onResume}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[var(--cds-color-white)] rounded-2xl shadow-2xl w-full max-w-[380px] overflow-hidden animate-scale-up-translate">
        <div className="p-6 flex flex-col items-center">
          {/* Pause Icon */}
          <div className="w-14 h-14 rounded-full bg-[var(--cds-color-blue-700)] flex items-center justify-center mb-4">
            <Icons.Pause className="w-7 h-7 text-white" />
          </div>
          
          {/* Header */}
          <h2 className="text-xl font-semibold text-[var(--cds-color-grey-900)] mb-1">
            Taking a break?
          </h2>
          <p className="text-sm text-[var(--cds-color-grey-500)] mb-5">
            Here's your goal progress
          </p>
          
          {/* Stats Row */}
          <div className="w-full flex items-stretch justify-center divide-x divide-[var(--cds-color-grey-100)] border border-[var(--cds-color-grey-100)] rounded-lg mb-6">
            {/* XP Earned */}
            <div className="flex-1 py-3 px-2 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icons.Coin className="w-5 h-5" />
                <span className="text-lg font-bold text-[var(--cds-color-grey-900)]">+{xpEarned}</span>
              </div>
              <p className="text-xs text-[var(--cds-color-grey-500)]">XP Earned</p>
            </div>
            
            {/* Items Left */}
            <div className="flex-1 py-3 px-2 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icons.Target className="w-4 h-4 text-[var(--cds-color-blue-700)]" />
                <span className="text-lg font-bold text-[var(--cds-color-grey-900)]">{itemsLeft}</span>
              </div>
              <p className="text-xs text-[var(--cds-color-grey-500)]">Items Left</p>
            </div>
            
            {/* Remaining Time */}
            <div className="flex-1 py-3 px-2 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icons.Clock className="w-4 h-4 text-[var(--cds-color-grey-500)]" />
                <span className="text-lg font-bold text-[var(--cds-color-grey-900)]">{formatTimeDisplay(timeRemaining)}</span>
              </div>
              <p className="text-xs text-[var(--cds-color-grey-500)]">Remaining</p>
            </div>
          </div>
          
          {/* Resume Button */}
          <button
            onClick={onResume}
            className="w-full bg-[var(--cds-color-blue-700)] text-[var(--cds-color-white)] py-3 px-6 rounded-lg font-medium hover:bg-[var(--cds-color-blue-800)] transition-colors mb-3"
          >
            Resume learning
          </button>
          
          {/* End Session Link */}
          <button
            onClick={onEndSession}
            className="text-[var(--cds-color-grey-600)] text-sm hover:text-[var(--cds-color-grey-900)] transition-colors"
          >
            End session
          </button>
        </div>
      </div>
    </div>
  );
};
