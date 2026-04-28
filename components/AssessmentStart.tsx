
import React from 'react';
import { Icons } from './Icons';

interface AssessmentStartProps {
  onStart: () => void;
  onNext: () => void;
}

export const AssessmentStart: React.FC<AssessmentStartProps> = ({ onStart, onNext }) => {
  return (
    <div className="flex flex-1 overflow-hidden bg-[var(--cds-color-white)] h-full relative">
      {/* Mini Sidebar (Assessment Context) */}
      <div className="w-16 flex-shrink-0 border-r border-[var(--cds-color-grey-100)] flex flex-col items-center py-6 bg-[var(--cds-color-white)] z-10">
        <button className="mb-8 text-[var(--cds-color-grey-700)] hover:text-[var(--cds-color-blue-700)] transition-colors">
          <Icons.Menu className="w-6 h-6" />
        </button>
        
        <div className="w-10 h-10 rounded-full border-2 border-[var(--cds-color-purple-600)] flex items-center justify-center text-[var(--cds-color-purple-600)]">
          <div className="w-5 h-5 rounded-full border-2 border-current"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-5xl mx-auto px-12 py-16">
          
          <div className="mb-1">
            <span className="text-[14px] font-normal text-[var(--cds-color-grey-600)] uppercase tracking-wide">Verify your knowledge of Skill: Data Acquisition and Preparation</span>
          </div>
          
          <h1 className="text-[40px] font-bold text-[var(--cds-color-grey-975)] leading-[1.2] mb-6 max-w-4xl tracking-tight">
            Verified Skill Assessment
          </h1>

          {/* Metadata Row */}
          <div className="flex items-center gap-8 mb-10">
            <div className="flex items-center gap-2 text-[var(--cds-color-grey-600)]">
              <Icons.Clock className="w-5 h-5" />
              <span className="text-[16px] font-normal">30 minutes</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--cds-color-grey-600)]">
              <Icons.History className="w-5 h-5" />
              <span className="text-[16px] font-normal">3 attempts every 24 hours</span>
            </div>
          </div>

          <hr className="border-[var(--cds-color-grey-100)] mb-10" />

          <div className="mb-12">
            <h3 className="text-[19px] font-semibold text-[var(--cds-color-grey-975)] mb-6">
              For Data Acquisition and Preparation, you will be evaluated on your ability to
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--cds-color-grey-400)] mt-2 shrink-0"></div>
                  <span className="text-[16px] text-[var(--cds-color-grey-600)] leading-relaxed">Prepare Datasets in Power BI</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--cds-color-grey-400)] mt-2 shrink-0"></div>
                  <span className="text-[16px] text-[var(--cds-color-grey-600)] leading-relaxed">Connect and Import Data</span>
                </li>
              </ul>
              
              <ul className="space-y-4">
                 <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--cds-color-grey-400)] mt-2 shrink-0"></div>
                  <span className="text-[16px] text-[var(--cds-color-grey-600)] leading-relaxed">Prepare and Clean Data</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--cds-color-grey-400)] mt-2 shrink-0"></div>
                  <span className="text-[16px] text-[var(--cds-color-grey-600)] leading-relaxed">Visualize and Report Clean Data</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onStart}
              className="bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] font-semibold text-[16px] px-8 py-3 rounded-[8px] transition-colors shadow-sm"
            >
              Start assessment
            </button>
            <button 
              className="bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-200)] hover:border-[var(--cds-color-grey-400)] text-[var(--cds-color-grey-700)] hover:text-[var(--cds-color-grey-975)] font-semibold text-[16px] px-8 py-3 rounded-[8px] transition-colors flex items-center gap-2"
            >
              <Icons.Sparkles className="w-5 h-5" />
              Practice with coach
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
