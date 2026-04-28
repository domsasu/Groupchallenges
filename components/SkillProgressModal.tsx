import React from 'react';
import * as Icons from './Icons';

interface SubSkill {
  name: string;
  points: number;
  total: number;
}

interface SkillProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeeFullProgress: () => void;
  skillName: string;
  skillPoints: number;
  skillTotal: number;
  subSkills: SubSkill[];
}

export const SkillProgressModal: React.FC<SkillProgressModalProps> = ({
  isOpen,
  onClose,
  onSeeFullProgress,
  skillName,
  skillPoints,
  skillTotal,
  subSkills
}) => {
  if (!isOpen) return null;

  const skillPercent = Math.round((skillPoints / skillTotal) * 100);

  // Determine skill level based on percentage
  const getSkillLevel = (percent: number) => {
    if (percent >= 90) return { label: 'COMPREHENDING', color: 'bg-red-100 text-red-700' };
    if (percent >= 40) return { label: 'DEVELOPING', color: 'bg-[var(--cds-color-yellow-100)] text-[var(--cds-color-yellow-700)]' };
    return { label: 'PRACTICING', color: 'bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-700)]' };
  };

  const skillLevel = getSkillLevel(skillPercent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/70 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[var(--cds-color-white)] rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden animate-scale-up-translate border border-[var(--cds-color-grey-50)]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-[var(--cds-color-grey-50)] transition-colors"
        >
          <Icons.X className="w-5 h-5 text-[var(--cds-color-grey-500)]" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[var(--cds-color-grey-975)] pr-8">Data Acquisition and Preparation</h2>
            <p className="text-sm text-[var(--cds-color-grey-500)] mt-1">Parent skill for your current learning</p>
          </div>

          {/* Current Skill Card - Highlighted */}
          <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-[var(--cds-color-blue-200)] rounded-xl p-4 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-600">Currently developing</span>
                </div>
                <h3 className="text-sm font-semibold text-[var(--cds-color-grey-975)]">{skillName}</h3>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${skillLevel.color}`}>
                {skillLevel.label}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="h-2 bg-[var(--cds-color-grey-50)] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${skillPercent}%`,
                    background: 'linear-gradient(to right, #FFC936 0%, #F28100 41%, #DC2626 91%)'
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-[var(--cds-color-grey-600)]">
              <span>{skillPoints}/{skillTotal} XP</span>
              <span>{skillPercent}%</span>
            </div>
          </div>

          {/* Other Sub-skills */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--cds-color-grey-500)] uppercase tracking-wide">Other skills in this category</p>
            
            {subSkills.filter(s => s.name !== skillName).map((subSkill) => {
              const percent = Math.round((subSkill.points / subSkill.total) * 100);
              const level = getSkillLevel(percent);
              
              return (
                <div 
                  key={subSkill.name}
                  className="bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] rounded-lg p-3 hover:border-[var(--cds-color-grey-200)] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-[var(--cds-color-grey-900)] flex-1 pr-2">{subSkill.name}</h4>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${level.color}`}>
                      {level.label}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-1.5">
                    <div className="h-1.5 bg-[var(--cds-color-grey-50)] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percent}%`,
                          background: 'linear-gradient(to right, #FFC936 0%, #F28100 41%, #DC2626 91%)'
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] text-[var(--cds-color-grey-500)]">
                    <span>{subSkill.points}/{subSkill.total} XP</span>
                    <span>{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Button */}
          <button
            onClick={onSeeFullProgress}
            className="w-full mt-6 py-3 px-4 bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            See full skill progress
            <Icons.ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
