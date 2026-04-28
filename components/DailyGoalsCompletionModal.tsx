
import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';
import { RollingCounter } from './RollingCounter';
import { DailyGoalsHeaderIcon } from './DailyGoalsHeaderIcon';

interface DailyGoalsCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackCareerProgress?: () => void;
  totalSP: number;
}

const playCelebrationSound = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Major Chord spanning an octave (C4, E4, G4, C5) - Grand and triumphant
    const notes = [261.63, 329.63, 392.00, 523.25]; 
    
    notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sawtooth'; // Brass-like
        osc.frequency.value = freq;
        
        // Lowpass filter for "soft/opulent" horn sound
        filter.type = 'lowpass';
        filter.frequency.value = 1200; 
        filter.Q.value = 1;

        // Start time with very slight stagger for realism
        const start = now + (index * 0.02);
        
        // Envelope - Extended duration (approx 3.5s total = ~2s longer than the short version)
        const attack = 0.4;
        const decay = 0.3;
        const hold = 1.5; // Sustain phase
        const release = 1.5; // Long fade out

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.06, start + attack); // Swell in
        gain.gain.linearRampToValueAtTime(0.05, start + attack + decay); // Settle
        gain.gain.setValueAtTime(0.05, start + attack + decay + hold); // Hold
        gain.gain.exponentialRampToValueAtTime(0.001, start + attack + decay + hold + release); // Fade

        osc.start(start);
        osc.stop(start + attack + decay + hold + release + 0.5);
    });
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const DailyGoalsCompletionModal: React.FC<DailyGoalsCompletionModalProps> = ({
  isOpen,
  onClose,
  onTrackCareerProgress,
  totalSP
}) => {
  const [expandedSubSkill, setExpandedSubSkill] = useState<string | null>("Data Acquisition and Preparation");
  
  // Animation States
  const [dropPhase, setDropPhase] = useState<'idle' | 'dropping' | 'collapsed'>('idle');
  // highlightStep: 0 = none, 1 = First item (Prepare Datasets), 2 = Second item (Preparing Data)
  const [highlightStep, setHighlightStep] = useState<number>(0);

  // Dynamic Progress States for Sub-skills to support distribution animation
  const [subSkillProgress, setSubSkillProgress] = useState({
    skill1: 5, // Prepare Datasets in Power BI (starts at 5)
    skill2: 0, // Connecting and Importing Data
    skill3: 2, // Preparing and Cleaning Data (starts at 2)
    skill4: 0  // Visualizing and Reporting Clean Data
  });

  useEffect(() => {
    if (isOpen) {
      // 1. Play sound
      const soundTimer = setTimeout(() => {
         playCelebrationSound();
      }, 300);
      
      // 2. Start Drop Animation after user reads "Great Job" (2.0s)
      const dropTimer = setTimeout(() => {
         setDropPhase('dropping');
      }, 2000);

      // 3. Complete Drop & Trigger First Target Highlight (2.0s + 0.6s anim)
      // Distribute 6 points to "Prepare Datasets in Power BI" (5 -> 11)
      const collapseTimer = setTimeout(() => {
         setDropPhase('collapsed');
         setHighlightStep(1); 
         setSubSkillProgress(prev => ({ ...prev, skill1: 11 }));
      }, 2600);
      
      // 4. Switch to Second Target Highlight ("Preparing and Cleaning Data")
      // Distribute 4 points to "Preparing and Cleaning Data" (2 -> 6)
      const step2Timer = setTimeout(() => {
         setHighlightStep(2);
         setSubSkillProgress(prev => ({ ...prev, skill3: 6 }));
      }, 4600); // 2600 + 2000s duration for first highlight

      // 5. Reset Highlight
      const resetHighlightTimer = setTimeout(() => {
         setHighlightStep(0);
      }, 6600); // 4600 + 2000s duration for second highlight

      return () => {
        clearTimeout(soundTimer);
        clearTimeout(dropTimer);
        clearTimeout(collapseTimer);
        clearTimeout(step2Timer);
        clearTimeout(resetHighlightTimer);
      };
    } else {
      // Reset states on close
      setDropPhase('idle');
      setHighlightStep(0);
      setExpandedSubSkill("Data Acquisition and Preparation");
      setSubSkillProgress({ skill1: 5, skill2: 0, skill3: 2, skill4: 0 }); // Reset values
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Reduced daily goal summary - now simply showing "10 SC" to represent the coin drop
  const summarySkills = [
    { name: "10 XP", points: 10, total: 0, hideTotal: true },
  ];

  interface SubSkill {
    name: string;
    progress: number;
    total: number;
  }

  interface CareerSkill {
    name: string;
    progress: number;
    total: number;
    isVerified?: boolean;
    isHighlighted?: boolean;
    subSkills?: SubSkill[];
  }

  // Calculate total progress for the main category based on sub-skills
  const currentCategoryProgress = (Object.values(subSkillProgress) as number[]).reduce((a, b) => a + b, 0);

  // Full career progress list for dropdown
  const careerSkills: CareerSkill[] = [
    { 
      name: "Data Acquisition and Preparation", 
      progress: currentCategoryProgress, 
      total: 50, 
      isHighlighted: true,
      subSkills: [
        { name: "Prepare Datasets in Power BI", progress: subSkillProgress.skill1, total: 20 },
        { name: "Connecting and Importing Data", progress: subSkillProgress.skill2, total: 10 },
        { name: "Preparing and Cleaning Data", progress: subSkillProgress.skill3, total: 15 },
        { name: "Visualizing and Reporting Clean Data", progress: subSkillProgress.skill4, total: 15 },
      ]
    },
    { name: "Data Transformation and Manipulation", progress: 0, total: 50 },
    { name: "Data Analysis and Exploration", progress: 50, total: 50, isVerified: true },
    { name: "Data Visualization and Reporting", progress: 0, total: 50 },
    { name: "Statistical Modeling and Inference", progress: 0, total: 50 },
    { name: "Database Operations for Data Analysis", progress: 0, total: 50 },
    { name: "GenAI Assistance", progress: 0, total: 50 },
  ];

  const toggleSubSkill = (name: string) => {
    setExpandedSubSkill(expandedSubSkill === name ? null : name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[var(--cds-color-grey-975)]/40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className={`relative bg-[var(--cds-color-white)] rounded-[16px] shadow-2xl w-full max-w-[420px] animate-scale-up-translate p-6 max-h-[90vh] flex flex-col ${dropPhase === 'dropping' ? 'overflow-visible' : 'overflow-hidden'}`}>
        
        {/* Top Actions */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button className="p-2 text-[var(--cds-color-grey-400)] hover:text-[var(--cds-color-blue-700)] hover:bg-blue-50 rounded-full transition-colors" title="Share">
            <Icons.Share className="w-5 h-5" />
          </button>
          <button className="p-2 text-[var(--cds-color-grey-400)] hover:text-[var(--cds-color-blue-700)] hover:bg-blue-50 rounded-full transition-colors" title="Download">
            <Icons.Download className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body - We switch overflow to visible during drop so the element isn't clipped */}
        <div className={`flex-1 ${dropPhase === 'dropping' ? 'overflow-visible' : 'overflow-y-auto'} custom-scrollbar -mr-2 pr-2`}>
            {/* Header Section */}
            <div className="text-center flex flex-col items-center animate-slide-in-up mt-2">
                <div className="animate-icon-bounce">
                <DailyGoalsHeaderIcon className="w-64 h-auto mb-8" />
                </div>
                <h2 className="cds-title-small-sm mb-8 animate-fade-in-delay text-[var(--cds-color-grey-975)]">
                    You're on fire! Great job reaching<br />another daily goal!
                </h2>
            </div>

            {/* Goals Body - Animated Drop */}
            <div className={`transition-all duration-700 ease-in-out ${dropPhase === 'collapsed' ? 'max-h-0 opacity-0 mb-0' : 'max-h-[200px] mb-6'}`}>
                <div className={`bg-[var(--cds-color-grey-25)] rounded-2xl p-5 space-y-3.5 border border-[var(--cds-color-grey-50)]/80 bg-[var(--cds-color-white)] shadow-sm z-50
                    ${dropPhase === 'dropping' ? 'animate-drop-element absolute w-[calc(100%-3rem)]' : 'relative'} 
                    ${dropPhase === 'collapsed' ? 'invisible' : 'animate-fade-in-delay-2'}
                `}>
                    {summarySkills.map((s, index) => (
                        <div 
                            key={s.name} 
                            className="flex justify-between items-center group"
                        >
                            <span className="cds-body-primary text-[var(--cds-color-grey-600)] group-hover:text-[var(--cds-color-grey-975)] transition-colors">{s.name}</span>
                            <div className="flex items-center bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] px-3 py-1.5 rounded-lg shadow-sm">
                                <span className="cds-body-secondary text-[var(--cds-color-grey-975)] mr-2 flex items-center">
                                    <RollingCounter value={s.points} startFromZero delay={(0.3 + index * 0.1) * 1000} />
                                    {!s.hideTotal && <span className="ml-0.5">/{s.total}</span>}
                                </span>
                                <Icons.Coin className="w-5 h-5" />
                            </div>
                        </div>
                    ))}
                </div>
                {/* Placeholder to keep layout height during absolute positioning drop */}
                {dropPhase === 'dropping' && <div className="h-[90px] w-full"></div>}
            </div>

            {/* Career Progress List (Directly Visible) */}
            <div className="mb-6 animate-fade-in-delay-3 relative z-10">
                <div className="bg-[var(--cds-color-grey-25)] rounded-xl border border-[var(--cds-color-grey-50)] p-3 space-y-2 animate-fade-in">
                    {careerSkills.map((skill, idx) => (
                    <div key={idx} className="flex flex-col bg-[var(--cds-color-white)] rounded-lg border border-[var(--cds-color-grey-50)] shadow-sm overflow-hidden">
                        {/* Main Row */}
                        <div 
                            className={`flex justify-between items-center p-3 cursor-pointer transition-colors ${skill.isHighlighted ? 'bg-purple-50 hover:bg-purple-100' : 'hover:bg-[var(--cds-color-grey-25)]'}`}
                            onClick={() => skill.subSkills && toggleSubSkill(skill.name)}
                        >
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                {skill.subSkills ? (
                                    <Icons.ChevronDown className={`w-4 h-4 text-[var(--cds-color-grey-400)] shrink-0 transition-transform duration-200 ${expandedSubSkill === skill.name ? 'rotate-180' : ''}`} />
                                ) : (
                                    <div className="w-4 shrink-0"></div>
                                )}
                                {skill.isVerified && <Icons.Verified className="w-4 h-4 text-[var(--cds-color-blue-700)] shrink-0" />}
                                <span className={`cds-body-secondary truncate ${skill.isHighlighted ? 'font-semibold text-purple-700' : 'text-[var(--cds-color-grey-700)]'}`}>
                                    {skill.name}
                                </span>
                            </div>
                            <div className="flex items-center shrink-0 ml-2">
                                <span className="cds-body-tertiary font-medium text-[var(--cds-color-grey-975)] mr-1.5">
                                    <RollingCounter value={skill.progress} />/{skill.total}
                                </span>
                                <Icons.Coin className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Sub Skills */}
                        {skill.subSkills && expandedSubSkill === skill.name && (
                            <div className="bg-[var(--cds-color-grey-25)] border-t border-[var(--cds-color-grey-50)] p-3 space-y-2 animate-fade-in">
                                {skill.subSkills.map((sub, sIdx) => {
                                    // Highlight logic: Step 1 highlights first item, Step 2 highlights second item
                                    const isTarget1 = sub.name === "Prepare Datasets in Power BI";
                                    const isTarget2 = sub.name === "Preparing and Cleaning Data";
                                    
                                    const shouldHighlight = (isTarget1 && highlightStep === 1) || (isTarget2 && highlightStep === 2);
                                    
                                    return (
                                        <div 
                                            key={sIdx} 
                                            className={`flex justify-between items-center pl-7 pr-1 rounded-md transition-all duration-700
                                                ${shouldHighlight ? 'animate-pulse-highlight relative z-10' : ''}
                                            `}
                                        >
                                            <span className={`cds-body-tertiary transition-colors duration-500 ${shouldHighlight ? 'text-purple-800 font-bold' : 'text-[var(--cds-color-grey-600)] font-medium'}`}>
                                                {sub.name}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <span className={`cds-body-tertiary transition-colors duration-500 ${shouldHighlight ? 'text-purple-700 font-semibold' : 'text-[var(--cds-color-grey-500)] font-medium'}`}>
                                                    <RollingCounter value={sub.progress} />/{sub.total}
                                                </span>
                                                <Icons.Coin className={`w-3 h-3 transition-all duration-500 ${shouldHighlight ? 'text-[var(--cds-color-yellow-700)] scale-125' : 'text-[var(--cds-color-grey-400)]'}`} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    ))}
                    <div className="pt-2 text-center">
                    <button 
                        onClick={onTrackCareerProgress}
                        className="cds-body-tertiary text-[var(--cds-color-blue-700)] hover:underline font-medium"
                    >
                        Go to full career tracker
                    </button>
                    </div>
                </div>
            </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] cds-action-primary py-3.5 rounded-[8px] transition-all transform active:scale-[0.98] shadow-md hover:shadow-lg animate-fade-in-delay-3 shrink-0 relative z-20"
        >
          Continue Learning
        </button>
      </div>
      <style>{`
        @keyframes icon-bounce {
          0% { 
            opacity: 0;
            transform: scale(0.5) translateY(-20px);
          }
          50% {
            transform: scale(1.05) translateY(0);
          }
          100% { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-icon-bounce {
          animation: icon-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        @keyframes slide-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in-up {
          animation: slide-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }
        
        @keyframes slide-in-left {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.4s ease-out forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }
        
        .animate-fade-in-delay-2 {
          animation: fade-in 0.4s ease-out forwards;
          animation-delay: 0.5s;
          opacity: 0;
        }
        
        .animate-fade-in-delay-3 {
          animation: fade-in 0.4s ease-out forwards;
          animation-delay: 0.8s;
          opacity: 0;
        }

        @keyframes drop-element {
          0% { transform: translateY(0); opacity: 1; }
          20% { transform: translateY(-15px) scale(1.02); }
          100% { transform: translateY(220px) scale(0.5); opacity: 0; }
        }
        .animate-drop-element {
          animation: drop-element 0.7s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards;
          transform-origin: center top;
        }

        @keyframes pulse-highlight {
          0% { background-color: transparent; transform: scale(1); }
          50% { background-color: #F3E8FF; transform: scale(1.05); box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2); }
          100% { background-color: transparent; transform: scale(1); }
        }
        .animate-pulse-highlight {
          animation: pulse-highlight 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
