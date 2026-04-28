
import React from 'react';
import { Icons } from './Icons';

interface SkillAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export const SkillAssessmentModal: React.FC<SkillAssessmentModalProps> = ({ isOpen, onClose, onStart }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[var(--cds-color-grey-975)]/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-[var(--cds-color-white)] rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden animate-scale-up-translate">
        
        {/* Header Visual */}
        <div className="bg-gradient-to-b from-blue-50 to-white pt-10 pb-6 text-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
            
            <div className="w-20 h-20 bg-[var(--cds-color-white)] rounded-2xl shadow-lg mx-auto flex items-center justify-center mb-6 relative z-10">
                <Icons.Verified className="w-10 h-10 text-[var(--cds-color-blue-700)]" />
                <div className="absolute -top-2 -right-2 bg-[var(--cds-color-yellow-700)] text-[var(--cds-color-white)] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-white">
                    NEW
                </div>
            </div>

            <h2 className="headline-lg mb-3 tracking-tight leading-tight text-[var(--cds-color-grey-975)] px-6">
                Verify your skills
            </h2>
            <p className="text-[15px] text-[var(--cds-color-grey-600)] leading-relaxed font-normal px-8">
                You have made a lot of progress in Data Acquisition & Preparation. Now it's time to verify your skills.
            </p>
        </div>

        {/* Benefits Section */}
        <div className="px-6 pb-2">
            <div className="space-y-3">
                {/* Benefit 1: Certificate */}
                <div className="flex items-center p-4 bg-[var(--cds-color-white)] border border-blue-100 rounded-xl shadow-sm hover:border-[var(--cds-color-blue-300)] transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                        <Icons.Trophy className="w-5 h-5 text-[var(--cds-color-blue-700)]" />
                    </div>
                    <div className="ml-4 flex-1">
                        <h4 className="text-[15px] font-semibold text-[var(--cds-color-grey-975)] mb-0.5">Verified Skill Certificate</h4>
                        <p className="text-[13px] text-[var(--cds-color-grey-500)]">Share with employers & network</p>
                    </div>
                </div>

                {/* Benefit 2: Coins */}
                <div className="flex items-center p-4 bg-[var(--cds-color-white)] border border-[var(--cds-color-yellow-100)] rounded-xl shadow-sm hover:border-[var(--cds-color-yellow-300)] transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-[var(--cds-color-yellow-50)] flex items-center justify-center shrink-0 group-hover:bg-[var(--cds-color-yellow-100)] transition-colors">
                        <Icons.Coin className="w-5 h-5 text-[var(--cds-color-yellow-700)]" />
                    </div>
                    <div className="ml-4 flex-1">
                        <h4 className="text-[15px] font-semibold text-[var(--cds-color-grey-975)] mb-0.5">Earn 600 Skill Points</h4>
                        <p className="text-[13px] text-[var(--cds-color-grey-500)]">When you verify your skills</p>
                    </div>
                </div>

                {/* Benefit 3: Skill Gaps */}
                <div className="flex items-center p-4 bg-[var(--cds-color-white)] border border-purple-100 rounded-xl shadow-sm hover:border-purple-300 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
                        <Icons.Dashboard className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="ml-4 flex-1">
                        <h4 className="text-[15px] font-semibold text-[var(--cds-color-grey-975)] mb-0.5">Identify skill gaps</h4>
                        <p className="text-[13px] text-[var(--cds-color-grey-500)]">See which skills to focus on</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-6">
            <button 
              className="w-full bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] btn-text-md py-3.5 rounded-xl transition-all transform active:scale-[0.98] shadow-lg hover:shadow-blue-200/50 mb-3 flex items-center justify-center gap-2"
              onClick={() => {
                onStart();
              }}
            >
              <span>Take assessment</span>
              <Icons.ChevronRight className="w-4 h-4" />
            </button>
            
            <button 
              className="w-full bg-transparent hover:bg-[var(--cds-color-grey-25)] text-[var(--cds-color-blue-700)] font-semibold hover:text-blue-700 btn-text-md py-3 rounded-xl transition-colors"
              onClick={onClose}
            >
              Maybe later
            </button>
        </div>

      </div>
       <style>{`
        @keyframes scale-up-translate {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-up-translate {
          animation: scale-up-translate 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
