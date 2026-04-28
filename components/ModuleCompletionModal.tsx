import React, { useId, useEffect, useState } from 'react';
import { Icons } from './Icons';
import { RollingCounter } from './RollingCounter';
import { getSkillLevelLabel } from '../skills';

interface SkillData {
  name: string;
  points: number;
  total: number;
  earnedXP?: number;
}

interface ModuleCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  hoursLearned: number;
  itemsCompleted: number;
  onTrackCareerProgress?: () => void;
  onSkillBreakdown?: () => void;
  totalModules?: number;
  completedModules?: number;
  moduleXP?: number;
  skills?: SkillData[];
}

const playModuleCompletionSound = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Celebratory Arpeggio: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + (i * 0.12));
      
      gain.gain.setValueAtTime(0, now + (i * 0.12));
      gain.gain.linearRampToValueAtTime(0.08, now + (i * 0.12) + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.12) + 0.6);
      
      osc.start(now + (i * 0.12));
      osc.stop(now + (i * 0.12) + 0.8);
    });
    
    // Underlying Chord swelling
    const chordNotes = [261.63, 329.63, 392.00]; // C4 Major
    chordNotes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.4);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);
      
      osc.start(now);
      osc.stop(now + 1.5);
    });
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

// Play a soft "pop" sound for stats appearing
const playStatPopSound = (delay: number = 0) => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime + delay / 1000;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    console.error("Stat pop sound failed", e);
  }
};

export const ModuleCompletionModal: React.FC<ModuleCompletionModalProps> = ({
  isOpen,
  onClose,
  moduleTitle,
  hoursLearned,
  itemsCompleted,
  onTrackCareerProgress,
  onSkillBreakdown,
  totalModules = 4,
  completedModules = 1,
  moduleXP = 12,
  skills = [
    { name: "Prepare Datasets in Power BI", points: 8, total: 25, earnedXP: 3 },
    { name: "Connecting and Importing Data", points: 9, total: 25, earnedXP: 4 },
    { name: "Preparing and Cleaning Data", points: 7, total: 25, earnedXP: 2 },
    { name: "Visualizing and Reporting Clean Data", points: 8, total: 25, earnedXP: 3 },
  ]
}) => {
  const maskId0 = useId();
  const maskId1 = useId();
  const maskId2 = useId();

  const [showBottomSection, setShowBottomSection] = useState(false);
  const [showProgressFill, setShowProgressFill] = useState(false);
  const [activeSkillIndex, setActiveSkillIndex] = useState(0);

  // Get skill level based on percentage
  const getSkillLevel = (points: number, total: number) => {
    const percentage = total > 0 ? (points / total) * 100 : 0;
    const label = getSkillLevelLabel(percentage);
    return { label, color: 'bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-700)]' };
  };

  // Current skill for carousel display
  const currentSkill = skills[activeSkillIndex] || skills[0];
  const currentSkillPercent = currentSkill && currentSkill.total > 0 
    ? (currentSkill.points / currentSkill.total) * 100 
    : 0;
  const currentSkillLevel = currentSkill ? getSkillLevel(currentSkill.points, currentSkill.total) : { label: 'Practicing', color: 'bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-700)]' };

  useEffect(() => {
    if (isOpen) {
      // Reset states
      setShowBottomSection(false);
      setShowProgressFill(false);
      setActiveSkillIndex(0);
      
      // Play celebration sound when modal appears
      const celebrationTimer = setTimeout(() => {
        playModuleCompletionSound();
      }, 200);
      
      // Play stat pop sounds as stats slide in
      const statPop1Timer = setTimeout(() => {
        playStatPopSound(0);
      }, 500);
      
      const statPop2Timer = setTimeout(() => {
        playStatPopSound(0);
      }, 650);
      
      // Show bottom section after top section finishes
      const bottomSectionTimer = setTimeout(() => {
        setShowBottomSection(true);
      }, 1000);
      
      // Start progress bar fill animation
      const progressFillTimer = setTimeout(() => {
        setShowProgressFill(true);
      }, 1500);
      
      return () => {
        clearTimeout(celebrationTimer);
        clearTimeout(statPop1Timer);
        clearTimeout(statPop2Timer);
        clearTimeout(bottomSectionTimer);
        clearTimeout(progressFillTimer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[var(--cds-color-grey-975)]/40 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />

      {/* Modal Card - Single Column Centered */}
      <div className="relative bg-[var(--cds-color-white)] rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-scale-up-translate">
        
        {/* Main Content Layout */}
        <div className="flex flex-col">
          
          {/* Top Banner - Trophy Illustration */}
          <div className="w-full flex items-center justify-center animate-fade-in pt-6 pb-2">
            <svg width="160" height="160" viewBox="0 0 269 345" fill="none" xmlns="http://www.w3.org/2000/svg" className="module-trophy-svg">
              <path d="M32.8184 235.049L150.448 168.029L268.438 236.159L150.808 303.179L32.8184 235.049Z" fill="#FF82E7"/>
              <path d="M32.8184 161.703V198.003L150.808 266.133L268.438 199.113V162.813L32.8184 161.703Z" fill="#ADCFFF"/>
              <mask id={maskId0} style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="32" y="161" width="237" height="106">
                <path d="M32.8184 161.705V198.005L150.808 266.135L268.438 199.115V162.815L32.8184 161.705Z" fill="white"/>
              </mask>
              <g mask={`url(#${maskId0})`}>
                <path d="M151.02 414.457L350.37 483.697V68.7673L151.02 31.3574V414.457Z" fill="#A678F5"/>
              </g>
              <path d="M32.8184 161.702L150.448 94.6816L268.438 162.812L150.808 229.832L32.8184 161.702Z" fill="#E8D8FF"/>
              <path d="M0 255.445V292.405L64.0199 329.365L97.08 310.495V273.535L0 255.445Z" fill="#ADCFFF"/>
              <mask id={maskId1} style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="0" y="255" width="98" height="75">
                <path d="M0 255.447V292.407L64.0199 329.367L97.08 310.497V273.537L0 255.447Z" fill="white"/>
              </mask>
              <g mask={`url(#${maskId1})`}>
                <path d="M64.1426 409.827H236.493L141.543 239.757L64.1426 184.707V409.827Z" fill="#A678F5"/>
              </g>
              <path d="M0 255.448L33.06 236.578L97.08 273.538L64.0199 292.408L0 255.448Z" fill="#E8D8FF"/>
              <path d="M33.0293 199.379V236.369L97.0493 273.329L130.109 254.459V217.499L33.0293 199.379Z" fill="#ADCFFF"/>
              <mask id={maskId2} style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="33" y="199" width="98" height="75">
                <path d="M33.0293 199.381V236.371L97.0493 273.331L130.109 254.461V217.501L33.0293 199.381Z" fill="white"/>
              </mask>
              <g mask={`url(#${maskId2})`}>
                <path d="M97.1719 353.79H269.522L174.572 183.72L97.1719 128.67V353.79Z" fill="#A678F5"/>
              </g>
              <path d="M33.0293 199.379L66.0893 180.539L130.109 217.499L97.0493 236.369L33.0293 199.379Z" fill="#E8D8FF"/>
              <path d="M147.393 145.98L175.113 129.87L175.323 61.5L147.603 77.64L147.393 145.98Z" fill="#0F1114"/>
              <path d="M147.393 145.982H192.993L190.263 55.9219L157.263 90.2419L147.393 145.982Z" fill="#0F1114"/>
              <path d="M181.114 48.7793L153.393 64.8893C149.823 66.9593 147.634 71.3693 147.604 77.6093L175.323 61.4993C175.323 55.2293 177.544 50.8493 181.114 48.7793Z" fill="#0F1114"/>
              <path d="M130.021 16.1074L129.691 135.747L147.421 145.977L147.601 77.6074C147.631 65.0074 156.571 59.9373 167.521 66.2673C178.471 72.5973 187.321 87.9275 187.291 100.527L187.111 168.897L204.841 179.127L205.171 59.4875L130.021 16.1074Z" fill="#FFC936"/>
              <path d="M204.844 179.163L232.564 163.053L232.894 43.3828L205.174 59.493L204.844 179.163Z" fill="#F28100"/>
              <path d="M205.17 59.4901L232.89 43.3799L157.74 0L130.02 16.11L205.17 59.4901Z" fill="#FFDC96"/>
              <path d="M59.787 121.141L59.6669 160.951C59.6669 161.941 59.0369 162.901 57.7469 163.651C55.1669 165.151 50.9369 165.151 48.3269 163.651C47.0069 162.901 46.377 161.911 46.377 160.921L46.4969 121.111C46.4969 122.101 47.157 123.091 48.447 123.841C51.057 125.341 55.2869 125.341 57.8669 123.841C59.1569 123.091 59.787 122.131 59.787 121.141Z" fill="#0F1114"/>
              <path d="M25.6197 136.259C20.9097 133.469 17.3997 129.719 15.9897 125.969C15.6897 125.189 14.8197 122.879 15.1497 119.879C15.2397 118.949 15.5397 117.719 15.8397 116.849C16.1397 115.979 16.7997 114.779 17.2497 113.909L52.4997 56.9688C62.9697 74.0988 77.6697 96.5387 87.4197 114.119C88.1997 115.499 88.8597 116.699 89.2797 118.649C89.7597 120.869 89.5197 122.669 89.3997 123.329C88.9797 125.729 87.8697 129.359 83.1897 133.379C80.9397 135.329 78.2997 136.739 78.2697 136.769C74.3997 138.779 74.1297 138.869 69.6597 140.369C67.6797 141.029 64.9197 141.539 62.8497 141.959C61.7697 142.169 60.3297 142.319 59.2197 142.469C56.9997 142.769 53.9997 142.799 51.7797 142.829C51.7197 142.829 44.8797 142.919 37.3197 140.969C30.8097 139.289 26.9097 136.979 25.6197 136.229V136.259Z" fill="#93B73B"/>
              <path d="M89.2767 118.678C88.8567 116.698 88.1967 115.528 87.4167 114.148C77.6667 96.598 62.9667 74.158 52.4967 56.998L51.7467 58.1979C51.8967 58.7679 52.0467 59.3081 52.1667 59.8481C55.0767 72.8681 53.8767 87.0581 53.4567 100.318C52.9767 115.048 50.1267 131.428 40.1367 141.628C46.5267 142.918 51.7468 142.828 51.8068 142.828C54.0568 142.798 57.0267 142.768 59.2467 142.468C60.3267 142.318 61.7968 142.198 62.8768 141.958C64.9168 141.538 67.7067 141.058 69.6867 140.368C74.1567 138.868 74.4267 138.778 78.2967 136.768C78.2967 136.768 80.9668 135.328 83.2168 133.378C87.8968 129.358 89.0067 125.698 89.4267 123.328C89.5467 122.668 89.7868 120.868 89.3068 118.648L89.2767 118.678Z" fill="#087051"/>
              <path d="M109.773 297.183L109.653 340.623C109.653 341.703 108.963 342.753 107.553 343.563C104.733 345.213 100.113 345.213 97.2628 343.563C95.8228 342.753 95.1328 341.643 95.1328 340.563L95.2527 297.123C95.2527 298.203 95.9728 299.283 97.3828 300.123C100.233 301.773 104.823 301.773 107.673 300.123C109.083 299.313 109.773 298.233 109.773 297.183Z" fill="#0F1114"/>
              <path d="M72.5118 313.681C67.3818 310.651 63.5418 306.541 62.0118 302.461C61.7118 301.621 60.7518 299.101 61.0818 295.831C61.2018 294.811 61.5018 293.491 61.8318 292.531C62.1618 291.571 62.8518 290.281 63.3918 289.351L101.822 227.221C113.252 245.911 129.272 270.421 139.922 289.561C140.762 291.061 141.482 292.351 141.932 294.511C142.442 296.941 142.202 298.891 142.082 299.641C141.602 302.251 140.402 306.211 135.302 310.621C132.842 312.751 129.962 314.311 129.932 314.311C125.702 316.501 125.402 316.591 120.542 318.241C118.382 318.961 115.352 319.531 113.132 319.981C111.962 320.221 110.372 320.371 109.172 320.521C106.742 320.851 103.472 320.881 101.042 320.911C100.982 320.911 93.5418 321.031 85.2618 318.901C78.1518 317.071 73.8918 314.551 72.4818 313.741L72.5118 313.681Z" fill="#93B73B"/>
              <path d="M141.964 294.481C141.514 292.321 140.794 291.031 139.954 289.531C129.304 270.361 113.284 245.881 101.854 227.191L101.044 228.511C101.194 229.111 101.374 229.711 101.494 230.311C104.674 244.501 103.384 259.981 102.904 274.441C102.364 290.491 99.2735 308.371 88.3535 319.532C95.3135 320.941 101.014 320.852 101.104 320.852C103.534 320.822 106.803 320.791 109.233 320.461C110.403 320.311 111.994 320.162 113.194 319.922C115.444 319.472 118.444 318.931 120.604 318.181C125.464 316.531 125.764 316.441 129.994 314.251C129.994 314.251 132.904 312.691 135.364 310.561C140.464 306.151 141.663 302.191 142.143 299.581C142.263 298.861 142.534 296.881 141.994 294.451L141.964 294.481Z" fill="#087051"/>
            </svg>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* Header Section */}
            <div className="mb-6 animate-slide-in-up text-center">
              <h2 className="text-2xl font-bold text-[var(--cds-color-grey-975)] mb-2">
                Woohoo, Module Complete!
              </h2>
              {/* Module Progress Pill */}
              <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                {completedModules}/{totalModules} modules complete!
              </span>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-8 px-4 mb-8 text-[var(--cds-color-grey-500)]">
              {/* Items Completed Stat */}
              <div 
                className="flex items-center gap-3 animate-slide-in-up" 
                style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className="p-2 bg-[var(--cds-color-grey-50)] rounded-full">
                  <Icons.Check className="w-5 h-5 text-[var(--cds-color-grey-500)]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-[var(--cds-color-grey-975)] leading-none flex items-center">
                    <RollingCounter value={itemsCompleted} startFromZero delay={500} />
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--cds-color-grey-400)]">Items Completed</span>
                </div>
              </div>

              <div 
                className="h-10 w-px bg-[var(--cds-color-grey-100)] animate-fade-in" 
                style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}
              ></div>

              {/* XP Earned Stat */}
              <div 
                className="flex items-center gap-3 animate-slide-in-up" 
                style={{ animationDelay: '0.45s', opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className="p-2 bg-[var(--cds-color-yellow-50)] rounded-full">
                  <Icons.Coin className="w-5 h-5 text-[var(--cds-color-yellow-700)]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-[var(--cds-color-grey-975)] leading-none flex items-center">
                    <RollingCounter value={moduleXP} startFromZero delay={650} />
                    <span className="text-sm ml-0.5">XP</span>
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--cds-color-grey-400)]">Earned</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div 
              className={`border-t border-[var(--cds-color-grey-100)] mb-6 transition-opacity duration-300 ${showBottomSection ? 'opacity-100' : 'opacity-0'}`}
            ></div>

            {/* Skills Developed Section Header */}
            <div 
              className={`flex items-center justify-between mb-4 transition-all duration-500 ${showBottomSection ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <h3 className="text-sm font-bold text-[var(--cds-color-grey-975)] uppercase tracking-wide">
                Skills developed this module
              </h3>
              {onSkillBreakdown && (
                <button 
                  onClick={onSkillBreakdown}
                  className="text-[var(--cds-color-blue-700)] text-sm font-medium hover:underline"
                >
                  Skill breakdown
                </button>
              )}
            </div>

            {/* Skill Card with Carousel */}
            <div 
              className={`mb-6 transition-all duration-500 delay-100 ${showBottomSection ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <div className="bg-[var(--cds-color-white)] rounded-xl border border-[var(--cds-color-grey-100)] shadow-sm relative overflow-visible ring-1 ring-[var(--cds-color-grey-50)] p-5">
                <div className="relative z-10">
                  {/* Skill Title and XP */}
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-[var(--cds-color-grey-975)] leading-snug">{currentSkill?.name}</h4>
                    </div>
                    
                    <div className="flex items-center justify-center bg-[var(--cds-color-yellow-50)] px-3 py-1.5 rounded-lg border border-[var(--cds-color-yellow-100)] shadow-sm shrink-0">
                      <div className="flex items-center gap-0.5 text-[var(--cds-color-yellow-700)] font-bold text-lg leading-none">
                        <span>+</span>
                        <RollingCounter value={currentSkill?.earnedXP || 0} startFromZero delay={400} />
                        <span className="text-sm ml-0.5">XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    {/* Skill Level and XP Labels */}
                    <div className="flex justify-between items-center mb-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${currentSkillLevel.color}`}>
                        {currentSkillLevel.label}
                      </span>
                      <span className="text-sm font-medium text-[var(--cds-color-grey-500)]">
                        {currentSkill?.points}/{currentSkill?.total} XP
                      </span>
                    </div>
                    
                    {/* Progress bar background */}
                    <div className="h-3 bg-[var(--cds-color-grey-50)] rounded-full shadow-inner relative overflow-hidden">
                      {/* Progress fill */}
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out absolute left-0 top-0 overflow-hidden ${showProgressFill ? 'animate-progress-fill-active' : ''}`}
                        style={{ width: showProgressFill ? `${Math.min(currentSkillPercent, 100)}%` : '0%' }}
                      >
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${100 / Math.max(currentSkillPercent, 1) * 100}%`,
                            background: 'linear-gradient(to right, #FFC936 0%, #F28100 41%, #DC2626 91%)'
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Milestone markers */}
                      <div className="absolute inset-y-0 left-[40%] w-[2px] bg-[var(--cds-color-grey-200)] z-10"></div>
                      <div className="absolute inset-y-0 left-[90%] w-[2px] bg-[var(--cds-color-grey-200)] z-10"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carousel Dots - Only show if multiple skills */}
              {skills.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  {skills.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveSkillIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === activeSkillIndex 
                          ? 'bg-[var(--cds-color-blue-700)] w-4' 
                          : 'bg-[var(--cds-color-grey-200)] hover:bg-[var(--cds-color-grey-400)]'
                      }`}
                      aria-label={`View skill ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div 
              className={`flex flex-col gap-3 transition-all duration-500 delay-200 ${showBottomSection ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <button 
                onClick={onClose}
                className="w-full bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] font-semibold py-3.5 rounded-lg transition-all transform active:scale-[0.98] shadow-md hover:shadow-lg"
              >
                Continue Learning
              </button>
              {onTrackCareerProgress && (
                <button 
                  onClick={onTrackCareerProgress}
                  className="w-full bg-transparent text-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-grey-25)] font-medium py-3.5 rounded-lg transition-all transform active:scale-[0.98]"
                >
                  Track Career Progress
                </button>
              )}
            </div>
          </div>
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
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        /* Progress bar fill animation */
        @keyframes progress-fill {
          0% { width: 0%; }
        }
        .animate-progress-fill-active {
          animation: progress-fill 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
