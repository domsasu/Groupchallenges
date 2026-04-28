import React, { useState } from 'react';
import { Icons } from './Icons';

export type PlanType = 'Relaxed' | 'Regular' | 'Ambitious';

interface PersonalizeLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlan: (plan: PlanType) => void;
}

export const PersonalizeLearningModal: React.FC<PersonalizeLearningModalProps> = ({ isOpen, onClose, onCreatePlan }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('Regular');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'Relaxed',
      label: 'Relaxed',
      details: '2 days / week • 15 min / day',
      finishDate: 'Dec 2025'
    },
    {
      id: 'Regular',
      label: 'Regular',
      details: '3 days / week • 30 min / day',
      finishDate: 'Sep 2025',
      recommended: true
    },
    {
      id: 'Ambitious',
      label: 'Ambitious',
      details: '5 days / week • 1 hr / day',
      finishDate: 'July 2025'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[var(--cds-color-grey-975)]/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-[var(--cds-color-white)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up-translate p-6">
        
        <div className="mb-2">
          <h2 className="headline-lg text-[var(--cds-color-grey-975)]">Personalize your daily learning</h2>
          <p className="text-[var(--cds-color-grey-600)] text-[15px] mt-2 leading-relaxed">
            Great work so far in your course! By setting a plan of when to finish we can help create a set of personalized daily goals that will keep you on track.
          </p>
        </div>

        <div className="mt-6 mb-2">
          <h3 className="text-[16px] font-semibold text-[var(--cds-color-grey-700)] mb-4">
            When would you like to finish?
          </h3>

          <div className="space-y-3">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id as PlanType)}
                className={`
                  relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedPlan === plan.id 
                    ? 'border-[#0056D2] bg-blue-50/50' 
                    : 'border-[var(--cds-color-grey-50)] hover:border-[var(--cds-color-grey-100)] hover:bg-[var(--cds-color-grey-25)]'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id ? 'border-[#0056D2]' : 'border-[var(--cds-color-grey-200)]'}`}>
                    {selectedPlan === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--cds-color-blue-700)]" />}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[var(--cds-color-grey-975)]">{plan.label}</h4>
                      {plan.recommended && (
                        <span className="text-[10px] font-bold bg-[var(--cds-color-blue-700)] text-[var(--cds-color-white)] px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--cds-color-grey-500)]">{plan.details}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-[var(--cds-color-grey-975)]">Finish by</div>
                  <div className="text-sm text-[var(--cds-color-grey-600)] font-medium">{plan.finishDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <button 
              onClick={() => onCreatePlan(selectedPlan)}
              className="w-full bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
              Create plan
          </button>
          <button 
              onClick={onClose}
              className="w-full px-5 py-2.5 text-[var(--cds-color-grey-600)] font-semibold hover:bg-[var(--cds-color-grey-50)] rounded-lg transition-colors"
          >
              Not now
          </button>
        </div>
      </div>
    </div>
  );
};