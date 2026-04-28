import React from 'react';
import { Icons } from './Icons';

export type DailyTimeGoal = 15 | 30 | 60;

interface DailyTimeGoalModalProps {
  isOpen: boolean;
  onSelectTime: (minutes: DailyTimeGoal) => void;
  xpByMinutes?: Record<DailyTimeGoal, number>;
}

export const DailyTimeGoalModal: React.FC<DailyTimeGoalModalProps> = ({ isOpen, onSelectTime, xpByMinutes }) => {
  if (!isOpen) return null;

  const timeOptions = [
    {
      minutes: 15 as DailyTimeGoal,
      label: '15 minutes',
      description: 'Quick session',
      xp: xpByMinutes?.[15] ?? 5,
      recommended: false
    },
    {
      minutes: 30 as DailyTimeGoal,
      label: '30 minutes',
      description: 'Based on your learning plan',
      xp: xpByMinutes?.[30] ?? 10,
      recommended: true
    },
    {
      minutes: 60 as DailyTimeGoal,
      label: '1 hour',
      description: 'Extended session',
      xp: xpByMinutes?.[60] ?? 15,
      recommended: false
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop - lighter to show blurred content behind */}
      <div 
        className="absolute inset-0 bg-white/70 backdrop-blur-md transition-opacity animate-fade-in" 
      />

      {/* Modal Card */}
      <div className="relative bg-[var(--cds-color-white)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up-translate p-6 border border-[var(--cds-color-grey-50)]">
        
        {/* Clock Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <Icons.Clock className="w-7 h-7 text-[var(--cds-color-blue-700)]" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-[22px] font-semibold text-[var(--cds-color-grey-975)] mb-2">
            How much time do you have?
          </h2>
          <p className="text-[var(--cds-color-grey-600)] text-[15px] leading-relaxed">
            We'll adjust your learning content to fit your schedule.
          </p>
        </div>

        {/* Time Options */}
        <div className="space-y-3">
          {timeOptions.map((option) => (
            <button
              key={option.minutes}
              onClick={() => onSelectTime(option.minutes)}
              className="w-full flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all text-left border-[var(--cds-color-grey-50)] hover:border-[#0056D2] hover:bg-blue-50/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-[var(--cds-color-grey-975)]">{option.label}</h4>
                  {option.recommended && (
                    <span className="text-[10px] font-bold bg-[var(--cds-color-blue-700)] text-[var(--cds-color-white)] px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--cds-color-grey-500)]">{option.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-[14px] font-semibold ${option.recommended ? 'text-[var(--color-text-primary)]' : 'text-[var(--cds-color-grey-600)]'}`}>
                  {option.xp} XP
                </span>
                <Icons.ChevronDown className="w-5 h-5 text-[var(--cds-color-grey-400)] -rotate-90" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
