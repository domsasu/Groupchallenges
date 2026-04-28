
import React from 'react';
import { Icons } from './Icons';

interface IntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLearning?: () => void;
}

export const IntroModal: React.FC<IntroModalProps> = ({ isOpen, onClose, onStartLearning }) => {
  if (!isOpen) return null;

  const handleStartLearning = () => {
    onClose();
    if (onStartLearning) {
      onStartLearning();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[var(--cds-color-grey-975)]/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-[var(--cds-color-white)] rounded-3xl shadow-2xl w-full max-w-[360px] overflow-hidden animate-scale-up-translate">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full text-[var(--cds-color-grey-500)] hover:text-[var(--cds-color-grey-700)] transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Hero Section with Animation */}
        <div className="bg-gradient-to-b from-orange-50 to-white pt-12 pb-6 flex justify-center relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-10 left-10 w-2 h-2 bg-[var(--cds-color-yellow-400)] rounded-full opacity-50 animate-pulse"></div>
            <div className="absolute top-16 right-16 w-3 h-3 bg-yellow-400 rounded-full opacity-50 animate-pulse delay-150"></div>
            <div className="absolute bottom-4 left-20 w-1.5 h-1.5 bg-amber-400 rounded-full opacity-50 animate-pulse delay-300"></div>

            {/* The XP Coin - matches the icon used across the app */}
            <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                <div className="animate-float">
                    <Icons.Coin className="w-32 h-32 drop-shadow-xl" />
                </div>
                
                {/* Sparkle effect overlay */}
                <svg className="absolute -top-4 -right-4 w-10 h-10 text-yellow-400 animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
            </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
            <h2 className="cds-title-xsmall-lg mb-1 text-center text-[var(--cds-color-grey-975)]">
                Introducing Skill Points!
            </h2>
            
            <p className="cds-subtitle-medium mb-6 text-center text-[var(--color-text-secondary)]">
                Track your career growth
            </p>

            <div className="cds-body-primary text-[var(--cds-color-grey-600)] mb-8 text-center">
                <p>
                  Skill points (XP) are rewarded as you complete learning items, helping you track the skills you are building related to your career!
                </p>        
            </div>

            <button 
                onClick={handleStartLearning}
                className="w-full bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] cds-action-primary py-3.5 rounded-[8px] transition-all transform active:scale-[0.98] shadow-blue-200 shadow-lg"
            >
                Start learning
            </button>
        </div>
      </div>
    </div>
  );
};
