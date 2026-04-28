import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { RollingCounter } from './RollingCounter';

interface SkillMasteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTakeAssessment: () => void;
}

const playMasterySound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Celebratory ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      const startTime = audioContext.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
    
    // Final shimmer
    setTimeout(() => {
      const shimmer = audioContext.createOscillator();
      const shimmerGain = audioContext.createGain();
      shimmer.connect(shimmerGain);
      shimmerGain.connect(audioContext.destination);
      shimmer.frequency.value = 1318.51; // E6
      shimmer.type = 'sine';
      shimmerGain.gain.setValueAtTime(0.1, audioContext.currentTime);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      shimmer.start();
      shimmer.stop(audioContext.currentTime + 0.8);
    }, 600);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

const playFillingSound = (progress: number) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    // Frequency rises with progress (200Hz to 600Hz)
    const baseFreq = 200 + (progress / 100) * 400;
    osc.frequency.value = baseFreq;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.03, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.05);
  } catch (e) {
    // Silent fail
  }
};

const playCompleteSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Bright completion chime
    const notes = [783.99, 987.77, 1174.66]; // G5, B5, D6
    
    notes.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      const startTime = audioContext.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch (e) {
    // Silent fail
  }
};

const playWhooSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;
    
    // Rising "whoo" sound - frequency sweep with harmonics
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    const gain2 = audioContext.createGain();
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(audioContext.destination);
    gain2.connect(audioContext.destination);
    
    // Main tone - rising sweep
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(400, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    osc1.frequency.exponentialRampToValueAtTime(600, now + 0.3);
    
    // Harmonic overtone
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(900, now + 0.3);
    
    // Volume envelope
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.15);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.05, now + 0.05);
    gain2.gain.linearRampToValueAtTime(0.04, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  } catch (e) {
    // Silent fail
  }
};

export const SkillMasteryModal: React.FC<SkillMasteryModalProps> = ({ isOpen, onClose, onTakeAssessment }) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [skillsAnimated, setSkillsAnimated] = useState([false, false, false, false]);
  const [skillsCountComplete, setSkillsCountComplete] = useState([false, false, false, false]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Practicing');
  const [displayedTotalPoints, setDisplayedTotalPoints] = useState(0);
  const [showRedirectLoading, setShowRedirectLoading] = useState(false);

  const handleTakeAssessment = () => {
    setShowRedirectLoading(true);
    setTimeout(() => {
      setShowRedirectLoading(false);
      onTakeAssessment();
    }, 3000);
  };

  const skills = [
    { name: "Prepare Datasets in Power BI", points: 25, total: 25 },
    { name: "Connecting and Importing Data", points: 25, total: 25 },
    { name: "Preparing and Cleaning Data", points: 25, total: 25 },
    { name: "Visualizing and Reporting Clean Data", points: 25, total: 25 },
  ];

  const totalPoints = skills.reduce((acc, s) => acc + s.points, 0);
  const maxPoints = skills.reduce((acc, s) => acc + s.total, 0);

  // Calculate cumulative points based on which skills have finished counting
  const getCumulativePoints = (completedIndices: boolean[]) => {
    return skills.reduce((acc, skill, idx) => {
      return acc + (completedIndices[idx] ? skill.points : 0);
    }, 0);
  };

  useEffect(() => {
    if (isOpen) {
      // Set progress bar directly to 100% - no animation, no sound
      setProgressPercent(100);
      setDisplayedTotalPoints(totalPoints);
      setProgressLabel('Comprehending');
      
      // Show CTAs immediately
      setTimeout(() => {
        setAnimationPhase(1);
      }, 300);
      
    } else {
      setAnimationPhase(0);
      setSkillsAnimated([false, false, false, false]);
      setSkillsCountComplete([false, false, false, false]);
      setProgressPercent(0);
      setProgressLabel('Practicing');
      setDisplayedTotalPoints(0);
      setShowRedirectLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[var(--cds-color-grey-975)]/70 backdrop-blur-sm transition-opacity animate-fade-in" 
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-[var(--cds-color-white)] rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-scale-up-translate" style={{ zIndex: 9999 }}>
        
        {showRedirectLoading ? (
          /* Loading Screen */
          <div className="flex flex-col items-center justify-center py-16 px-8 animate-fade-in">
            {/* Animated Icon */}
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              <div className="absolute w-20 h-20 rounded-full bg-blue-100 animate-ping-slow opacity-50"></div>
              <div className="absolute w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                <Icons.ExternalLink className="w-10 h-10 text-[var(--cds-color-blue-700)] animate-bounce-slow" />
              </div>
            </div>
            
            <h3 className="text-[18px] font-bold text-[var(--cds-color-grey-900)] mb-2 text-center">
              Redirecting to Assessment
            </h3>
            <p className="text-[14px] text-[var(--cds-color-grey-500)] text-center leading-relaxed max-w-[300px]">
              You're being redirected out of the course to the verified assessment page
            </p>
            
            {/* Loading dots */}
            <div className="flex items-center gap-1.5 mt-6">
              <span className="w-2 h-2 bg-[var(--cds-color-blue-700)] rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
              <span className="w-2 h-2 bg-[var(--cds-color-blue-700)] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-[var(--cds-color-blue-700)] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-b from-orange-50 via-amber-50 to-white pt-8 pb-6 text-center relative overflow-hidden">
              <div className="pt-6">
                <h2 className="text-[24px] font-bold mb-2 tracking-tight leading-tight text-[var(--cds-color-grey-975)] px-6">
                  Skill Growth Milestone
                </h2>
                <p className="text-[15px] text-[var(--cds-color-grey-600)] leading-relaxed font-normal px-8">
                  in <span className="font-semibold text-[var(--cds-color-grey-900)]">Data Acquisition and Preparation</span>
                </p>
              </div>
            </div>

            {/* Skills Progress Section */}
            <div className="px-6 pb-1">
              {/* Total Progress Header */}
              <div className="mb-5 pb-4 px-3">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[16px] font-semibold text-[var(--cds-color-grey-700)]">Total Skill XP</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[20px] font-bold text-[var(--cds-color-grey-975)] tabular-nums">
                      {displayedTotalPoints}/{maxPoints}
                    </span>
                    <Icons.Coin className="w-6 h-6" />
                  </div>
                </div>
                
                {/* Progress Bar - glowing and pulsing */}
                <div className="relative">
                  <div className="h-4 bg-[var(--cds-color-grey-50)] rounded-full overflow-hidden mb-3 relative">
                    {/* Progress fill with glow */}
                    <div 
                      className="h-full bg-gradient-to-r from-[#F28100] to-[#FFC936] rounded-full transition-all duration-75 ease-out relative animate-progress-glow"
                      style={{ width: `${progressPercent}%` }}
                    >
                      {/* Inner shine */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full"></div>
                      {/* Animated glow effect at the edge */}
                      <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-r from-transparent to-white/50 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Only Comprehending label */}
                  <div className="flex justify-center">
                    <span className={`text-[15px] font-semibold transition-colors duration-300 ${progressPercent >= 70 ? 'text-[var(--cds-color-yellow-700)]' : 'text-[var(--cds-color-grey-500)]'}`}>
                      Comprehending
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Widget */}
            <div className={`px-6 pb-6 transition-all duration-500 ${animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Widget Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 mb-4">
                <p className="text-[14px] text-[var(--cds-color-grey-700)] leading-relaxed mb-5">
                  You may be ready to test your skill mastery in <span className="font-semibold">Data Acquisition and Preparation</span>. Here are the perks:
                </p>
                
                {/* Value Props */}
                <div className="space-y-3 mb-5">
                  {/* Verified Certificate */}
                  <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Icons.Trophy className="w-5 h-5 text-[var(--cds-color-blue-700)]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--cds-color-grey-900)]">Verified Skill Certificate</p>
                      <p className="text-[13px] text-[var(--cds-color-grey-500)]">Share with employers & network</p>
                    </div>
                  </div>
                  
                  {/* Track Career Progress */}
                  <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-10 h-10 rounded-full bg-[var(--cds-color-yellow-50)] flex items-center justify-center flex-shrink-0">
                      <Icons.Target className="w-5 h-5 text-[var(--cds-color-yellow-700)]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--cds-color-grey-900)]">Track your career progress</p>
                      <p className="text-[13px] text-[var(--cds-color-grey-500)]">See how close you are to your goal</p>
                    </div>
                  </div>
                  
                  {/* Identify Skill Gaps */}
                  <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Icons.Grid className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--cds-color-grey-900)]">Identify skill gaps</p>
                      <p className="text-[13px] text-[var(--cds-color-grey-500)]">See which skills to focus on</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  className="w-full bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] shadow-md hover:shadow-blue-200/50 flex items-center justify-center gap-2"
                  onClick={handleTakeAssessment}
                >
                  <Icons.Verified className="w-5 h-5" />
                  <span>Take verified assessment</span>
                </button>
              </div>
              
              <button 
                className="w-full bg-transparent hover:bg-[var(--cds-color-grey-25)] text-[var(--cds-color-grey-600)] font-medium py-3 rounded-xl transition-colors"
                onClick={onClose}
              >
                Remind me next week
              </button>
            </div>
          </>
        )}
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
        @keyframes scale-in {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes progress-glow {
          0%, 100% { 
            box-shadow: 0 0 8px rgba(242, 129, 0, 0.4), 0 0 16px rgba(255, 201, 54, 0.3);
            filter: brightness(1);
          }
          50% { 
            box-shadow: 0 0 12px rgba(242, 129, 0, 0.6), 0 0 24px rgba(255, 201, 54, 0.4);
            filter: brightness(1.05);
          }
        }
        .animate-progress-glow {
          animation: progress-glow 2s ease-in-out infinite;
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.5; }
          75%, 100% { transform: scale(1.3); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

