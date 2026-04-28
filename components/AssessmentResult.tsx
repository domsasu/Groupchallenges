
import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';
import { getSkillLevelLabel } from '../skills';

interface AssessmentResultProps {
  onRetry: () => void;
  onViewSkillProgress?: () => void;
  assessmentResults?: Record<string, number> | null;
}

const VerifiedSolid = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.74Z" fill="#0056D2" stroke="#0056D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const playCelebrationTune = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // 3-second celebration melody
    const melody = [
      { freq: 523.25, time: 0, duration: 0.2 },      // C5
      { freq: 659.25, time: 0.15, duration: 0.2 },   // E5
      { freq: 783.99, time: 0.3, duration: 0.2 },    // G5
      { freq: 1046.50, time: 0.45, duration: 0.4 },  // C6 (hold)
      { freq: 783.99, time: 0.9, duration: 0.15 },   // G5
      { freq: 1046.50, time: 1.05, duration: 0.15 }, // C6
      { freq: 1174.66, time: 1.2, duration: 0.3 },   // D6
      { freq: 1046.50, time: 1.55, duration: 0.5 },  // C6 (hold)
      { freq: 783.99, time: 2.1, duration: 0.2 },    // G5
      { freq: 1046.50, time: 2.3, duration: 0.2 },   // C6
      { freq: 1318.51, time: 2.5, duration: 0.5 },   // E6 (final)
    ];
    
    melody.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      const startTime = now + time;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
      gain.gain.setValueAtTime(0.1, startTime + duration - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    });
    
    // Add underlying chord for richness
    const chordNotes = [261.63, 329.63, 392.00]; // C4, E4, G4
    chordNotes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.3);
      gain.gain.setValueAtTime(0.04, now + 2.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
      
      osc.start(now);
      osc.stop(now + 3.1);
    });

  } catch (e) {
    // ignore
  }
};


export const AssessmentResult: React.FC<AssessmentResultProps> = ({ onRetry, onViewSkillProgress, assessmentResults }) => {
  const [animatedSkills, setAnimatedSkills] = useState<number[]>([]);

  const skills = [
    { name: "Prepare Datasets in Power BI", correct: 10, total: 10 },
    { name: "Connecting and Importing Data", correct: 10, total: 10 },
    { name: "Preparing and Cleaning Data", correct: 10, total: 10 },
    { name: "Visualizing and Reporting Clean Data", correct: 10, total: 10 },
  ].map((skill) => {
    if (!assessmentResults || assessmentResults[skill.name] === undefined) {
      return skill;
    }
    const points = assessmentResults[skill.name];
    const correct = Math.max(0, Math.min(skill.total, Math.round(points / 10)));
    return { ...skill, correct };
  });

  const totalCorrect = skills.reduce((sum, skill) => sum + skill.correct, 0);
  const totalQuestions = skills.reduce((sum, skill) => sum + skill.total, 0);
  const gradePercent = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  useEffect(() => {
    // Play celebration tune
    setTimeout(() => playCelebrationTune(), 300);
    
    // Animate skills one by one
    skills.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedSkills(prev => [...prev, index]);
      }, 800 + index * 300);
    });
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden bg-[var(--cds-color-white)] h-full relative">
      {/* Mini Sidebar */}
      <div className="w-16 flex-shrink-0 border-r border-[var(--cds-color-grey-100)] flex flex-col items-center py-6 bg-[var(--cds-color-white)] z-10">
        <button className="mb-8 text-[var(--cds-color-grey-700)] hover:text-[var(--cds-color-blue-700)] transition-colors">
          <Icons.Menu className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 rounded-full border-2 border-[#0056D2] flex items-center justify-center text-[var(--cds-color-blue-700)]">
          <Icons.Check className="w-5 h-5" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto px-12 py-12 pb-12">
            
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-[28px] font-bold text-[var(--cds-color-grey-975)] mb-6">
                Congratulations, you've passed!
              </h1>
              
              {/* Grade Display */}
              <div className="mb-2">
                <div className="text-xs font-semibold text-[var(--cds-color-grey-500)] uppercase tracking-wide mb-2">Grade</div>
                <div className="text-7xl font-bold text-[var(--cds-color-grey-975)]">{gradePercent}%</div>
                <div className="text-[14px] text-[var(--cds-color-grey-500)] mt-1">{totalCorrect} out of {totalQuestions} correct</div>
              </div>
            </div>

            {/* Certificate Preview Card */}
            <div 
              className="mb-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-[var(--cds-color-blue-200)] rounded-2xl p-8 relative overflow-visible hover:border-[var(--cds-color-blue-300)] hover:shadow-lg transition-all"
            >
              {/* Left Sparkles */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`left-${i}`}
                    className="sparkle-left absolute"
                    style={{
                      '--delay': `${i * 0.15}s`,
                      '--angle': `${-30 + (i * 10)}deg`,
                      '--distance': `${60 + Math.random() * 40}px`,
                    } as React.CSSProperties}
                  >
                    ✦
                  </div>
                ))}
              </div>
              
              {/* Right Sparkles */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`right-${i}`}
                    className="sparkle-right absolute"
                    style={{
                      '--delay': `${i * 0.15}s`,
                      '--angle': `${30 - (i * 10)}deg`,
                      '--distance': `${60 + Math.random() * 40}px`,
                    } as React.CSSProperties}
                  >
                    ✦
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between relative z-10">
                {/* Left side - Certificate info */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-[var(--cds-color-white)] rounded-2xl shadow-lg flex items-center justify-center border border-blue-100">
                    <Icons.Verified className="w-10 h-10 text-[var(--cds-color-blue-700)]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--cds-color-blue-700)] uppercase tracking-wide mb-1">Verified Skill Certificate</p>
                    <h2 className="text-[22px] font-bold text-[var(--cds-color-grey-975)] mb-1">Data Acquisition and Preparation</h2>
                    <p className="text-[14px] text-[var(--cds-color-grey-600)]">Issued by Coursera</p>
                  </div>
                </div>
                
                {/* Right side - CTAs */}
                <div className="flex items-center gap-3">
                  <button 
                    className="bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-200)] text-[var(--cds-color-grey-700)] hover:bg-[var(--cds-color-grey-25)] px-5 py-2.5 rounded-[8px] font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Icons.Share className="w-4 h-4" />
                    Share
                  </button>
                  <button 
                    onClick={onRetry}
                    className="bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] px-6 py-2.5 rounded-[8px] font-semibold flex items-center gap-2 shadow-sm transition-colors"
                  >
                    View Certificate
                    <Icons.ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Skills Verified Section */}
            <div className="mb-12">
              <div className="mb-5">
                <h3 className="text-[19px] font-semibold text-[var(--cds-color-grey-975)]">Skills you've verified</h3>
              </div>
              
              <div className="space-y-3">
                {skills.map((skill, index) => {
                  const isAnimated = animatedSkills.includes(index);
                  return (
                    <div 
                      key={skill.name}
                      className={`flex items-center justify-between p-5 rounded-xl transition-all duration-500 ${
                        isAnimated 
                          ? 'bg-[var(--cds-color-blue-25)] border border-[var(--cds-color-blue-200)]' 
                          : 'bg-[var(--cds-color-grey-25)] border border-[var(--cds-color-grey-100)]'
                      }`}
                      style={{
                        opacity: isAnimated ? 1 : 0.5,
                        transform: isAnimated ? 'scale(1)' : 'scale(0.98)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center transition-all duration-500 ${isAnimated ? 'scale-100' : 'scale-75'}`}>
                          {isAnimated ? (
                            <VerifiedSolid className="w-10 h-10 animate-scale-in" />
                          ) : (
                            <div className="w-10 h-10 bg-[var(--cds-color-grey-100)] rounded-full flex items-center justify-center">
                              <Icons.Lock className="w-5 h-5 text-[var(--cds-color-grey-400)]" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[16px] font-semibold transition-colors ${isAnimated ? 'text-[var(--cds-color-grey-975)]' : 'text-[var(--cds-color-grey-500)]'}`}>
                          {skill.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-600)]">
                          {getSkillLevelLabel((skill.correct / skill.total) * 100)}
                        </span>
                        <span className={`text-[14px] font-medium transition-colors ${isAnimated ? 'text-green-600' : 'text-[var(--cds-color-grey-400)]'}`}>
                          {skill.correct}/{skill.total} correct
                        </span>
                        <Icons.ChevronDown className="w-5 h-5 text-[var(--cds-color-grey-400)]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Verifications Section */}
            <div className="mb-12">
              <div className="mb-5">
                <h3 className="text-[19px] font-semibold text-[var(--cds-color-grey-975)]">Verifications</h3>
                <p className="text-[14px] text-[var(--cds-color-grey-500)] mt-1">Track your verified skills for the Data Analyst role</p>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: "Data Acquisition and Preparation", isVerified: true, progress: 100 },
                  { name: "Data Transformation and Manipulation", isVerified: false, progress: 0 },
                  { name: "Data Analysis and Exploration", isVerified: true, progress: 100 },
                  { name: "Data Visualization and Reporting", isVerified: false, progress: 0 },
                  { name: "Statistical Modeling and Inference", isVerified: false, progress: 0 },
                  { name: "Database Operations for Data Analysis", isVerified: false, progress: 0 },
                  { name: "GenAI Assistance", isVerified: false, progress: 0 },
                ].map((skill) => (
                  <div 
                    key={skill.name}
                    className={`flex items-center justify-between p-5 rounded-xl transition-all cursor-pointer group ${
                      skill.isVerified 
                        ? 'bg-[var(--cds-color-blue-25)] border border-[var(--cds-color-blue-200)] hover:border-[var(--cds-color-blue-300)]' 
                        : 'bg-[var(--cds-color-grey-25)] border border-[var(--cds-color-grey-100)] hover:border-[var(--cds-color-grey-200)] hover:bg-[var(--cds-color-grey-50)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 flex items-center justify-center transition-colors ${
                        skill.isVerified ? '' : 'bg-[var(--cds-color-grey-100)] rounded-full group-hover:bg-[var(--cds-color-grey-200)]'
                      }`}>
                        {skill.isVerified ? (
                          <VerifiedSolid className="w-10 h-10" />
                        ) : (
                          <Icons.Target className="w-5 h-5 text-[var(--cds-color-grey-500)]" />
                        )}
                      </div>
                      <div>
                        <span className={`text-[16px] font-semibold transition-colors ${
                          skill.isVerified ? 'text-[var(--cds-color-grey-975)]' : 'text-[var(--cds-color-grey-700)] group-hover:text-[var(--cds-color-grey-975)]'
                        }`}>
                          {skill.name}
                        </span>
                        {skill.isVerified && (
                          <p className="text-[13px] text-[var(--cds-color-blue-700)] font-medium">Skill verified</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {skill.isVerified ? (
                        <span className="text-[13px] font-semibold text-[var(--cds-color-blue-700)] bg-blue-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <Icons.Check className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[13px] font-medium text-[var(--cds-color-grey-400)] bg-[var(--cds-color-grey-50)] px-3 py-1 rounded-full">
                          Not started
                        </span>
                      )}
                      <Icons.ChevronRight className={`w-5 h-5 transition-colors ${
                        skill.isVerified ? 'text-[var(--cds-color-blue-700)]' : 'text-[var(--cds-color-grey-400)] group-hover:text-[var(--cds-color-grey-600)]'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-6 shrink-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-5xl mx-auto flex justify-end gap-3">
            <button 
              onClick={onViewSkillProgress}
              className="text-[var(--cds-color-blue-700)] hover:text-blue-700 px-6 py-2.5 font-semibold flex items-center gap-2 transition-colors hover:underline"
            >
              View Skill progress
            </button>
            <button 
              className="bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] px-6 py-2.5 rounded-[8px] font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              Continue learning
              <Icons.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes sparkle-shoot-left {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateX(calc(var(--distance) * -0.3)) translateY(calc(sin(var(--angle)) * 20px)) rotate(180deg) scale(1);
          }
          100% {
            transform: translateX(calc(var(--distance) * -1)) translateY(calc(sin(var(--angle)) * 50px)) rotate(360deg) scale(0);
            opacity: 0;
          }
        }
        @keyframes sparkle-shoot-right {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateX(calc(var(--distance) * 0.3)) translateY(calc(sin(var(--angle)) * 20px)) rotate(180deg) scale(1);
          }
          100% {
            transform: translateX(var(--distance)) translateY(calc(sin(var(--angle)) * 50px)) rotate(360deg) scale(0);
            opacity: 0;
          }
        }
        .sparkle-left {
          font-size: 14px;
          color: #FFC936;
          text-shadow: 0 0 4px #FFC936;
          animation: sparkle-shoot-left 1.5s ease-out var(--delay) infinite;
        }
        .sparkle-right {
          font-size: 14px;
          color: #FFC936;
          text-shadow: 0 0 4px #FFC936;
          animation: sparkle-shoot-right 1.5s ease-out var(--delay) infinite;
        }
      `}</style>
    </div>
  );
};
