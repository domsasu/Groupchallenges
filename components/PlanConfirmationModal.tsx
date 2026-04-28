import React from 'react';
import { Icons } from './Icons';
import { PlanType } from './PersonalizeLearningModal';

interface PlanConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: PlanType;
  onStartLearning: () => void;
}

export const PlanConfirmationModal: React.FC<PlanConfirmationModalProps> = ({ isOpen, onClose, planType, onStartLearning }) => {
  if (!isOpen) return null;

  const getGoals = (type: PlanType) => {
    switch (type) {
        case 'Relaxed':
            return [
                "Earn 100 XP from videos & readings",
                "Complete 1 lesson"
            ];
        case 'Ambitious':
            return [
                "Earn 800 XP from videos & readings",
                "Complete 2 practice activities",
                "Finish 2 modules"
            ];
        case 'Regular':
        default:
            return [
                "Complete all 7 items",
                "Complete practice assignment",
                "Earn 5 XP"
            ];
    }
  };

  const getFinishDate = (type: PlanType) => {
      switch(type) {
          case 'Relaxed': return 'Dec 2025';
          case 'Ambitious': return 'July 2025';
          case 'Regular': default: return 'Sep 2025';
      }
  }

  const goals = getGoals(planType);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[var(--cds-color-grey-975)]/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-[var(--cds-color-white)] rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-scale-up-translate">
        
        <div className="p-6 text-center">
          
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icons.Check className="w-6 h-6 text-green-600" strokeWidth={3} />
          </div>

          <h2 className="headline-lg text-[var(--cds-color-grey-975)]">
            You're all set!
          </h2>
          <p className="text-[var(--cds-color-grey-500)] text-sm mt-1 mb-5">
            Finish by {getFinishDate(planType)}
          </p>

          <div className="bg-[var(--cds-color-grey-25)] rounded-xl p-4 mb-6 text-left border border-[var(--cds-color-grey-50)]">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-[14px] font-semibold text-[var(--cds-color-grey-700)]">Today's goals</h3>
                <span className="text-[12px] text-[var(--cds-color-grey-500)]">Based on {planType} plan</span>
            </div>
            
            <div className="space-y-2.5">
                {goals.map((goal, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-[var(--cds-color-grey-200)] flex items-center justify-center shrink-0"></div>
                        <span className="text-[15px] text-[var(--cds-color-grey-700)]">{goal}</span>
                    </div>
                ))}
            </div>
          </div>

          <button 
              onClick={onStartLearning}
              className="w-full bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
              Continue
          </button>
        </div>
      </div>
    </div>
  );
};