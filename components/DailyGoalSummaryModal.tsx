import React, { useEffect, useState, useId } from 'react';
import { Icons } from './Icons';
import { RollingCounter } from './RollingCounter';
import { getSkillLevelLabel } from '../skills';

interface DailyGoalSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onPause?: () => void;
  hoursLearned: number;
  itemsCompleted: number;
  earnedXP?: number;
  skills: Array<{ name: string; points: number; total: number; deltaPoints?: number }>;
  progressPercent: number;
  progressLabel: string;
  is1HourGoal?: boolean;
  onVerifySkills?: () => void;
  showVerifyLink?: boolean;
  onMilestonePreferenceChange?: (milestonesOnly: boolean) => void;
  // New props for module/course progress
  totalModuleItems?: number;
  completedModuleItems?: number;
  courseCompletionPercent?: number;
  totalCourseXP?: number;
  // Skill title for today's goal
  skillTitle?: string;
  // Early session end mode - shows "Here's your progress today" instead
  isEarlyEnd?: boolean;
}

const playCelebrationSound = () => {
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

// Play rising tone sound for progress bar fill animation
const playProgressFillSound = (steps: number = 6) => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const baseFreq = 523.25; // C5
    const duration = 1.2; // Match the CSS animation duration
    const stepDelay = duration / steps;
    
    for (let i = 0; i < steps; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Rising pitch - approx 2 semitones up per step
      const freq = baseFreq * Math.pow(1.12246, i);
      osc.frequency.setValueAtTime(freq, now + (i * stepDelay));
      osc.type = 'sine';
      
      const noteStart = now + (i * stepDelay);
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.06, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);
      
      osc.start(noteStart);
      osc.stop(noteStart + 0.35);
    }
  } catch (e) {
    console.error("Progress fill sound failed", e);
  }
};

// Play subtle "whoo!" sound when crossing a skill threshold
const playLevelUpSound = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Main "whoo" sweep - rising pitch
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.type = 'sine';
    // Sweep from ~300Hz to ~800Hz (rising "whoo")
    osc1.frequency.setValueAtTime(300, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    osc1.frequency.exponentialRampToValueAtTime(600, now + 0.3);
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gain1.gain.linearRampToValueAtTime(0.06, now + 0.15);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc1.start(now);
    osc1.stop(now + 0.45);
    
    // Soft harmonic layer for warmth
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(450, now);
    osc2.frequency.exponentialRampToValueAtTime(1000, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(750, now + 0.25);
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.04, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    osc2.start(now);
    osc2.stop(now + 0.4);
  } catch (e) {
    console.error("Level up sound failed", e);
  }
};

export const DailyGoalSummaryModal: React.FC<DailyGoalSummaryModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  onPause,
  hoursLearned,
  itemsCompleted,
  earnedXP = 4,
  skills,
  progressPercent,
  progressLabel,
  is1HourGoal = false,
  onVerifySkills,
  showVerifyLink = true,
  onMilestonePreferenceChange,
  totalModuleItems = 12,
  completedModuleItems = 0,
  courseCompletionPercent = 42,
  totalCourseXP = 50,
  skillTitle,
  isEarlyEnd = false
}) => {
  const maskId0 = useId();
  const maskId1 = useId();
  const maskId2 = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBottomSection, setShowBottomSection] = useState(false);
  const [showProgressFill, setShowProgressFill] = useState(false);
  const [displayedSkillLabel, setDisplayedSkillLabel] = useState<string>('Practicing');
  const [showHeading, setShowHeading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Milestone preference - only show modals after key milestones
  const [milestonesOnly, setMilestonesOnly] = useState(() => {
    const stored = localStorage.getItem('showCelebrationsOnlyAtMilestones');
    return stored === 'true';
  });
  
  const handleMilestonePreferenceChange = (checked: boolean) => {
    setMilestonesOnly(checked);
    localStorage.setItem('showCelebrationsOnlyAtMilestones', String(checked));
    onMilestonePreferenceChange?.(checked);
  };

  const getSkillLevel = (points: number, total: number) => {
    const percentage = total > 0 ? (points / total) * 100 : 0;
    const label = getSkillLevelLabel(percentage);
    if (label === 'Comprehending') return { label, color: 'bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-700)]' };
    if (label === 'Developing') return { label, color: 'bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-700)]' };
    return { label, color: 'bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-700)]' };
  };

  const totalSkillPoints = skills.reduce((acc, s) => acc + s.points, 0);
  const totalSkillMax = skills.reduce((acc, s) => acc + s.total, 0);
  const totalSkillPercent = totalSkillMax > 0 ? (totalSkillPoints / totalSkillMax) * 100 : 0;
  const totalSkillLevel = getSkillLevel(totalSkillPoints, totalSkillMax);

  // Find the specific skill matching skillTitle for the breakdown display
  const currentSkill = skills.find(s => s.name === skillTitle) || skills[0];
  const currentSkillPoints = currentSkill?.points || 0;
  const currentSkillTotal = currentSkill?.total || totalCourseXP;
  const currentSkillPercent = currentSkillTotal > 0 ? (currentSkillPoints / currentSkillTotal) * 100 : 0;
  const currentSkillLevel = getSkillLevel(currentSkillPoints, currentSkillTotal);
  
  // Calculate previous skill level (before earning XP today)
  const previousSkillPoints = Math.max(0, currentSkillPoints - earnedXP);
  const previousSkillPercent = currentSkillTotal > 0 ? (previousSkillPoints / currentSkillTotal) * 100 : 0;
  const previousSkillLevel = getSkillLevel(previousSkillPoints, currentSkillTotal);
  
  // Threshold percentages for skill levels
  const DEVELOPING_THRESHOLD = 40;
  const COMPREHENDING_THRESHOLD = 90;

  // Calculate XP needed to reach next skill level
  const getXpToNextLevel = () => {
    const developingThreshold = Math.ceil(totalSkillMax * 0.40); // 40% for Developing
    const comprehendingThreshold = Math.ceil(totalSkillMax * 0.90); // 90% for Comprehending
    
    if (totalSkillPercent < 40) {
      return {
        xpNeeded: developingThreshold - totalSkillPoints,
        currentLevel: 'Practicing',
        nextLevel: 'Developing'
      };
    } else if (totalSkillPercent < 90) {
      return {
        xpNeeded: comprehendingThreshold - totalSkillPoints,
        currentLevel: 'Developing',
        nextLevel: 'Comprehending'
      };
    }
    return null; // Already at Comprehending
  };
  
  const nextLevelInfo = getXpToNextLevel();

  useEffect(() => {
    if (isOpen) {
      // Reset states
      setShowHeading(false);
      setShowStats(false);
      setShowBottomSection(false);
      setShowProgressFill(false);
      setDisplayedSkillLabel(previousSkillLevel.label); // Start with previous level
      
      // SEQUENCED ANIMATION TIMELINE:
      // Phase 1: SVG illustration animates first (built into CSS, starts at 0ms)
      // Phase 2: Show heading after SVG animation settles (~600ms)
      // Phase 3: Show stats row after heading (~900ms)
      // Phase 4: Show skills developed section after stats complete (~1400ms)
      // Phase 5: Start progress bar fill animation (~1900ms)
      
      // Play celebration sound when modal appears
      const celebrationTimer = setTimeout(() => {
        playCelebrationSound();
      }, 200);
      
      // Phase 2: Show heading
      const headingTimer = setTimeout(() => {
        setShowHeading(true);
      }, 600);
      
      // Phase 3: Show stats row
      const statsTimer = setTimeout(() => {
        setShowStats(true);
        playStatPopSound(0);
      }, 900);
      
      const statPop2Timer = setTimeout(() => {
        playStatPopSound(0);
      }, 1050);
      
      // Phase 4: Show bottom section (Skills Developed)
      const bottomSectionTimer = setTimeout(() => {
        setShowBottomSection(true);
      }, 1400);
      
      // Phase 5: Start progress bar fill animation
      const ANIMATION_START = 1900;
      const ANIMATION_DURATION = 1600; // Slowed down from 1200ms to 1600ms
      
      const progressFillTimer = setTimeout(() => {
        setShowProgressFill(true);
      }, ANIMATION_START);
      
      // Phase 6: Calculate when to change the label based on threshold crossings
      const timers: NodeJS.Timeout[] = [];
      
      // Check if we cross the Developing threshold (40%)
      if (previousSkillPercent < DEVELOPING_THRESHOLD && currentSkillPercent >= DEVELOPING_THRESHOLD) {
        const progressNeeded = DEVELOPING_THRESHOLD - previousSkillPercent;
        const totalProgress = currentSkillPercent - previousSkillPercent;
        const timeToThreshold = (progressNeeded / totalProgress) * ANIMATION_DURATION;
        
        const developingTimer = setTimeout(() => {
          setDisplayedSkillLabel('Developing');
          playLevelUpSound();
        }, ANIMATION_START + timeToThreshold);
        timers.push(developingTimer);
      }
      
      // Check if we cross the Comprehending threshold (90%)
      if (previousSkillPercent < COMPREHENDING_THRESHOLD && currentSkillPercent >= COMPREHENDING_THRESHOLD) {
        const progressNeeded = COMPREHENDING_THRESHOLD - previousSkillPercent;
        const totalProgress = currentSkillPercent - previousSkillPercent;
        const timeToThreshold = (progressNeeded / totalProgress) * ANIMATION_DURATION;
        
        const comprehendingTimer = setTimeout(() => {
          setDisplayedSkillLabel('Comprehending');
          playLevelUpSound();
        }, ANIMATION_START + timeToThreshold);
        timers.push(comprehendingTimer);
      }
      
      return () => {
        clearTimeout(celebrationTimer);
        clearTimeout(headingTimer);
        clearTimeout(statsTimer);
        clearTimeout(statPop2Timer);
        clearTimeout(bottomSectionTimer);
        clearTimeout(progressFillTimer);
        timers.forEach(t => clearTimeout(t));
      };
    }
  }, [isOpen, previousSkillPercent, currentSkillPercent, previousSkillLevel.label]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[var(--cds-color-grey-975)]/40 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-[var(--cds-color-white)] rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-scale-up-translate">
        
        {/* Main Content Layout */}
        <div className="flex flex-col">
          
          {/* Top Banner - Analyst Goal Illustration with Animated Ball */}
          <div className="w-full flex items-center justify-center animate-fade-in pt-4 pb-2">
            <svg width="200" height="155" viewBox="0 0 1301 1007" fill="none" xmlns="http://www.w3.org/2000/svg" className="analyst-goal-svg">
              {/* Trophy/Flag element */}
              <path d="M822.496 415.743L901.441 369.863L901.954 175.234L823.009 221.115L822.496 415.743Z" fill="#0F1114"/>
              <path d="M822.496 415.744H952.277L944.502 159.257L850.52 256.999L822.496 415.744Z" fill="#0F1114"/>
              <path d="M918.43 138.923L839.485 184.803C829.318 190.699 823.082 203.258 822.996 221.029L901.941 175.149C901.941 157.292 908.263 144.818 918.43 138.923Z" fill="#0F1114"/>
              <path d="M772.94 45.8804L772 386.609L822.493 415.743L823.006 221.029C823.092 185.145 848.553 170.706 879.738 188.734C910.923 206.761 936.127 250.42 936.041 286.304L935.528 481.018L986.023 510.153L986.962 169.424L772.94 45.8804Z" fill="#FFC936"/>
              <path d="M986.029 510.238L1064.97 464.358L1066 123.544L986.969 169.424L986.029 510.238Z" fill="#F28100"/>
              <path d="M986.957 169.424L1065.99 123.544L851.88 0L772.935 45.8805L986.957 169.424Z" fill="#FFDC96"/>
              
              {/* Green pillar */}
              <path d="M462.182 539.021L461.709 699.748C461.709 703.651 459.107 707.672 453.903 710.629C443.495 716.661 426.346 716.661 415.82 710.629C410.498 707.554 407.896 703.533 407.896 699.512L408.369 538.784C408.369 542.805 410.971 546.826 416.293 549.901C426.819 555.933 443.85 555.933 454.376 549.901C459.58 546.945 462.182 542.924 462.182 539.021Z" fill="#0F1114"/>
              <path d="M360 105.209V538.783L434.865 582.069L509.847 538.783V105.209H360Z" fill="#93B73B"/>
              <mask id={`${maskId0}-scene`} style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="360" y="105" width="150" height="478">
                <path d="M360.001 105.21V538.783L434.865 582.07L509.848 538.783V105.21H360.001Z" fill="white"/>
              </mask>
              <g mask={`url(#${maskId0}-scene)`}>
                <path d="M435.102 676.212L638.879 633.635L561.886 65.7084L435.102 22.4219V676.212Z" fill="#852600"/>
              </g>
              <path d="M360 105.212L432.854 60.7427L509.847 105.212L434.864 148.498L360 105.212Z" fill="#93B73B"/>
              
              {/* Second level platform (pink) */}
              <path d="M573.966 760.827L780.936 634.398L999.733 760.827L786.85 883.708L573.966 760.827Z" fill="#852600"/>
              <path d="M568.594 513.275V637.348L783.542 761.421L998.491 637.348V513.275H568.594Z" fill="#FFCCF5"/>
              <mask id={`${maskId1}-scene`} style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="568" y="513" width="431" height="249">
                <path d="M568.591 513.275V637.348L783.54 761.421L998.488 637.348V513.275H568.591Z" fill="white"/>
              </mask>
              <g mask={`url(#${maskId1}-scene)`}>
                <path d="M783.897 1031.66L1368.68 1035.13L1147.76 399.834L783.897 275.761V1031.66Z" fill="#FAAF00"/>
              </g>
              <path d="M568.596 513.279L777.574 385.743L998.493 513.279L783.545 637.352L568.596 513.279Z" fill="#FFF4E8"/>
              
              {/* Bottom level platform (pink) */}
              <path d="M360.02 760.821V883.703L572.903 1006.58L785.787 883.703V760.821H360.02Z" fill="#FFCCF5"/>
              <mask id={`${maskId2}-scene`} style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="360" y="760" width="426" height="247">
                <path d="M360.02 760.822V883.703L572.903 1006.58L785.787 883.703V760.822H360.02Z" fill="white"/>
              </mask>
              <g mask={`url(#${maskId2}-scene)`}>
                <path d="M573.254 1274.23L1152.42 1277.66L933.619 648.471L573.254 525.589V1274.23Z" fill="#FAAF00"/>
              </g>
              <path d="M360.02 760.825L566.99 634.514L785.787 760.825L572.903 883.706L360.02 760.825Z" fill="#FFF4E8"/>
              
              {/* Blue screen/monitor */}
              <path d="M215.256 747.502L214.901 992.318C214.901 995.748 212.655 999.296 208.045 1001.9C198.825 1007.22 183.813 1007.22 174.593 1001.9C169.983 999.178 167.619 995.748 167.619 992.2L167.973 747.383C167.973 750.931 170.337 754.48 174.947 757.081C184.167 762.404 199.18 762.404 208.4 757.081C213.01 754.48 215.256 750.931 215.256 747.502Z" fill="#0F1114"/>
              <path d="M347.409 504.817L348 723.141L43.8562 898.888L43.2651 680.564L347.409 504.817Z" fill="#5B9DFC"/>
              <path d="M43.8544 898.883L0.591029 873.691L0 655.367L43.2634 680.558L43.8544 898.883Z" fill="#0F1114"/>
              <path d="M43.2634 680.563L0 655.372L304.144 479.743L347.407 504.816L43.2634 680.563Z" fill="#E8D8FF"/>
              <mask id={`${maskId0}-screen`} style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="94" y="537" width="213" height="318">
                <path d="M95.5085 854.656L94.9175 658.921L305.442 537.341L306.033 733.075L95.5085 854.656Z" fill="white"/>
              </mask>
              <g mask={`url(#${maskId0}-screen)`}>
                <path d="M222.108 585.353L194.566 633.252L230.737 653.239L95.1548 731.651L95.273 776.712L231.801 697.826L193.738 766.068L221.517 781.797L278.256 680.086L278.374 680.204L305.68 632.424L222.108 585.353Z" fill="white"/>
              </g>
              
              {/* Green globe structures on right */}
              <path d="M1100.84 664.645C1100.84 669.02 1103.68 673.278 1109.36 676.589C1120.71 683.094 1139.16 683.094 1150.4 676.589C1155.96 673.396 1158.79 669.138 1158.79 664.763L1158.32 838.145C1158.32 842.402 1155.48 846.66 1149.92 849.972C1138.69 856.476 1120.24 856.476 1108.89 849.972C1103.21 846.66 1100.37 842.402 1100.37 838.026" fill="#0F1114"/>
              <path d="M1125.8 470.795L1248.57 541.756C1181.15 502.728 1072.11 502.136 1003.63 540.456C1025.98 527.683 1048.22 515.028 1070.57 502.255C1089.02 491.729 1107.35 481.203 1125.8 470.795Z" fill="#0F1114"/>
              <path d="M1125.8 470.795L1247.15 686.044C1177.96 724.837 1067.38 723.772 1000.08 683.56C932.789 643.349 934.445 579.248 1003.63 540.456C1044.32 517.275 1085.12 493.976 1125.8 470.795Z" fill="#0F1114"/>
              <path d="M1248.45 541.638C1249.16 541.993 1249.87 542.466 1250.58 542.939C1317.87 583.15 1316.22 647.252 1247.03 686.044L1125.69 470.795C1162.47 492.083 1211.55 520.468 1248.45 541.756V541.638Z" fill="#0F1114"/>
              <path d="M1095.17 441.103C1075.77 444.533 1056.85 451.156 1039.82 460.736C1011.91 476.584 990.266 497.873 973.826 525.902C965.074 540.804 959.397 557.362 957.623 563.985C955.968 570.135 953.839 578.414 952.893 584.8C951.71 593.079 951 604.196 950.646 612.593C950.646 638.021 966.967 663.567 1000.08 683.436C1067.38 723.648 1177.96 724.712 1247.15 685.92C1253.65 600.293 1233.9 486.519 1095.17 440.985V441.103Z" fill="#93B73B"/>
              <path d="M1298.83 592.609C1298.12 586.223 1296.7 577.707 1295.05 571.557C1290.2 553.107 1285.35 541.281 1276.83 526.024C1273.17 519.519 1267.49 511.24 1262.88 505.327C1258.26 499.414 1251.4 492.199 1246.08 486.877C1242.65 483.447 1237.68 479.189 1233.9 476.233C1228.34 472.093 1220.77 466.771 1214.86 463.105C1200.19 454.117 1169.44 438.978 1126.99 438.387C1116.34 438.269 1020.66 535.012 1010.02 536.905C1182.1 610.941 1247.15 616.027 1247.03 686.042C1282.15 666.291 1299.89 640.035 1300.01 613.779C1300.01 607.393 1299.54 598.996 1298.83 592.609Z" fill="#852600"/>
              
              {/* Top green globe */}
              <path d="M1124.15 315.163L1246.91 386.124C1179.5 347.095 1070.46 346.504 1001.98 384.823C1024.33 372.05 1046.57 359.395 1068.92 346.622C1087.37 336.096 1105.7 325.57 1124.15 315.163Z" fill="#0F1114"/>
              <path d="M1124.15 315.163L1245.49 530.412C1176.3 569.204 1065.72 568.139 998.425 527.928C931.13 487.717 932.786 423.615 1001.97 384.823C1042.66 361.642 1083.46 338.343 1124.15 315.163Z" fill="#0F1114"/>
              <path d="M1246.9 386.121C1247.61 386.476 1248.32 386.949 1249.03 387.422C1316.33 427.634 1314.67 491.735 1245.48 530.527L1124.14 315.278C1160.92 336.567 1210 364.951 1246.9 386.239V386.121Z" fill="#0F1114"/>
              <path d="M1093.63 285.587C1074.24 289.017 1055.31 295.64 1038.28 305.219C1010.37 321.067 988.729 342.356 972.29 370.386C963.538 385.288 957.861 401.845 956.087 408.468C954.431 414.618 952.302 422.897 951.356 429.283C950.173 437.562 949.464 448.679 949.109 457.077C949.109 482.504 965.43 508.05 998.545 527.919C1065.84 568.131 1176.42 569.195 1245.61 530.403C1252.11 444.777 1232.36 331.002 1093.63 285.468V285.587Z" fill="#93B73B"/>
              <path d="M1297.3 436.975C1296.59 430.589 1295.17 422.073 1293.51 415.923C1288.67 397.473 1283.82 385.646 1275.3 370.39C1271.63 363.885 1265.96 355.606 1261.34 349.693C1256.73 343.779 1249.87 336.565 1244.55 331.243C1241.12 327.813 1236.15 323.555 1232.37 320.598C1226.81 316.459 1219.24 311.137 1213.33 307.471C1198.66 298.482 1167.91 283.344 1125.45 282.753C1114.81 282.634 1104.17 283.58 1093.52 285.473C1249.28 342.715 1245.62 460.392 1245.5 530.407C1280.62 510.657 1298.36 484.401 1298.48 458.145C1298.48 451.759 1298.01 443.362 1297.3 436.975Z" fill="#852600"/>
              
              {/* Animated Ball Group - starts at B1 position (565, 648), animates to B2 (752, 399) */}
              <g className="ball-group">
                {/* Ball Shadow */}
                <ellipse className="ball-shadow" cx="580" cy="755" rx="54" ry="17" fill="#0F1114" opacity="0.5"/>
                {/* Main Ball */}
                <circle className="ball-main" cx="565.757" cy="648.756" r="76.757" fill="#FFC936"/>
                {/* White Center */}
                <circle className="ball-center" cx="565.758" cy="648.758" r="22.116" fill="white"/>
              </g>
            </svg>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* Header Section */}
            <div 
              className={`mb-8 text-center transition-all duration-500 ${showHeading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <h2 className="text-2xl font-bold text-[var(--cds-color-grey-975)]">
                {isEarlyEnd
                  ? "Here's your progress today"
                  : progressPercent >= 100 
                    ? "Great job finishing today's goal!" 
                    : "Keep up the great work!"}
              </h2>
            </div>

            {/* Course Progress Stats Row */}
            <div 
              className={`flex items-center justify-center gap-8 px-4 mb-8 text-[var(--cds-color-grey-500)] transition-all duration-500 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {/* Items Completed Stat */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--cds-color-grey-50)] rounded-full">
                  <Icons.Check className="w-5 h-5 text-[var(--cds-color-grey-500)]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-[var(--cds-color-grey-975)] leading-none flex items-center">
                    <RollingCounter value={itemsCompleted} startFromZero delay={showStats ? 100 : 99999} />
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--cds-color-grey-400)]">Items Completed</span>
                </div>
              </div>

              <div className="h-10 w-px bg-[var(--cds-color-grey-100)]"></div>

              {/* Course Progress Stat */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--cds-color-grey-50)] rounded-full">
                  <svg className="w-5 h-5 text-[var(--cds-color-grey-500)]" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 6V10L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-[var(--cds-color-grey-975)] leading-none flex items-center">
                    <RollingCounter value={courseCompletionPercent} startFromZero delay={showStats ? 200 : 99999} />
                    <span className="text-lg ml-0.5">%</span>
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--cds-color-grey-400)]">Course Complete</span>
                </div>
              </div>
            </div>

            {/* Divider - part of bottom section */}
            <div 
              className={`border-t border-[var(--cds-color-grey-100)] mb-6 transition-opacity duration-300 ${showBottomSection ? 'opacity-100' : 'opacity-0'}`}
            ></div>

            {/* Skill Breakdown Header */}
            <h3 
              className={`text-sm font-bold text-[var(--cds-color-grey-975)] uppercase tracking-wide mb-4 transition-all duration-500 ${showBottomSection ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Skill focus
            </h3>

            {/* Skill Progress Section */}
            <div 
              className={`mb-8 transition-all duration-500 delay-100 ${showBottomSection ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <div 
                className="bg-[var(--cds-color-white)] rounded-xl border border-[var(--cds-color-grey-100)] shadow-sm relative overflow-visible ring-1 ring-[var(--cds-color-grey-50)] p-6"
              >
                <div className="relative z-10">
                  {/* Title and XP */}
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-[var(--cds-color-grey-975)] leading-snug">{skillTitle || skills[0]?.name || "Skill Progress"}</h3>
                    </div>
                    
                    <div className="flex items-center justify-center bg-[var(--cds-color-yellow-50)] px-3 py-1.5 rounded-lg border border-[var(--cds-color-yellow-100)] shadow-sm shrink-0">
                      <div className="flex items-center gap-0.5 text-[var(--cds-color-yellow-700)] font-bold text-lg leading-none">
                        <span>+</span>
                        <RollingCounter value={earnedXP} startFromZero delay={400} />
                        <span className="text-sm ml-0.5">XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar with Skill Level and XP Labels */}
                  <div className="mb-2 relative overflow-visible">
                    {/* Skill Level and XP Labels */}
                    <div className="flex justify-between items-center mb-2">
                      <span 
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide transition-all duration-300 ${
                          displayedSkillLabel === 'Practicing' ? 'bg-yellow-100 text-yellow-700' :
                          displayedSkillLabel === 'Developing' ? 'bg-[var(--cds-color-yellow-100)] text-[var(--cds-color-yellow-700)]' :
                          'bg-red-100 text-red-700'
                        }`}
                      >
                        {displayedSkillLabel}
                      </span>
                      <span className="text-sm font-medium text-[var(--cds-color-grey-500)]">
                        {currentSkillPoints}/{currentSkillTotal} XP
                      </span>
                    </div>
                    
                    {/* Progress bar background */}
                    <div className="h-3 bg-[var(--cds-color-grey-50)] rounded-full shadow-inner relative overflow-visible">
                      {/* Progress fill container - clips the gradient to current progress */}
                      <div 
                        className="h-full rounded-full absolute left-0 top-0 overflow-hidden"
                        style={{ 
                          width: showProgressFill ? `${Math.min(currentSkillPercent, 100)}%` : `${Math.min(previousSkillPercent, 100)}%`,
                          transition: showProgressFill ? 'width 1.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
                        }}
                      >
                        {/* Full-width gradient that gets clipped by parent */}
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
                      
                      {/* Hover zone: Practicing (0-40%) - Yellow */}
                      <div 
                        className="absolute inset-y-0 left-0 cursor-pointer group/prac z-20"
                        style={{ width: '40%' }}
                      >
                        <div className="absolute inset-0 hover:bg-yellow-400/30 rounded-l-full transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-5 bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] shadow-lg rounded-lg px-4 py-3 opacity-0 group-hover/prac:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-[180px]">
                          <div className="text-sm font-bold text-[var(--cds-color-yellow-200)] mb-1">Practicing</div>
                          <div className="text-xs text-[var(--cds-color-grey-500)] mb-2">Building foundational knowledge</div>
                          <div className="text-xs font-semibold text-[var(--cds-color-grey-600)]">{Math.max(0, Math.ceil(currentSkillTotal * 0.40) - currentSkillPoints)} XP to Developing</div>
                        </div>
                      </div>
                      
                      {/* Hover zone: Developing (40-90%) - Orange */}
                      <div 
                        className="absolute inset-y-0 cursor-pointer group/dev z-20"
                        style={{ left: '40%', width: '50%' }}
                      >
                        <div className="absolute inset-0 hover:bg-[var(--cds-color-yellow-400)]/30 transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-5 bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] shadow-lg rounded-lg px-4 py-3 opacity-0 group-hover/dev:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-[180px]">
                          <div className="text-sm font-bold text-[var(--cds-color-yellow-700)] mb-1">Developing</div>
                          <div className="text-xs text-[var(--cds-color-grey-500)] mb-2">Can apply with guidance</div>
                          <div className="text-xs font-semibold text-[var(--cds-color-grey-600)]">{Math.max(0, Math.ceil(currentSkillTotal * 0.90) - currentSkillPoints)} XP to Comprehending</div>
                        </div>
                      </div>
                      
                      {/* Hover zone: Comprehending (90-100%) - Red */}
                      <div 
                        className="absolute inset-y-0 cursor-pointer group/comp z-20"
                        style={{ left: '90%', width: '10%' }}
                      >
                        <div className="absolute inset-0 hover:bg-red-400/30 rounded-r-full transition-colors" />
                        <div className="absolute right-0 bottom-5 bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] shadow-lg rounded-lg px-4 py-3 opacity-0 group-hover/comp:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-[180px]">
                          <div className="text-sm font-bold text-red-600 mb-1">Comprehending</div>
                          <div className="text-xs text-[var(--cds-color-grey-500)] mb-2">Can apply independently</div>
                          <div className="text-xs font-semibold text-[var(--cds-color-grey-600)]">{Math.max(0, currentSkillTotal - currentSkillPoints)} XP to complete</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div 
              className={`flex flex-col gap-3 transition-all duration-500 delay-200 ${showBottomSection ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <button 
                onClick={onContinue}
                className="w-full bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] cds-action-secondary py-3.5 rounded-[8px] transition-all transform active:scale-[0.98] shadow-md hover:shadow-lg font-semibold"
              >
                Continue learning
              </button>
              <button 
                onClick={onPause}
                className="w-full bg-transparent text-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-grey-25)] cds-action-secondary py-3.5 rounded-[8px] transition-all transform active:scale-[0.98] font-medium"
              >
                I'll pause for today
              </button>
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
        
        @keyframes slide-in-right {
          0% {
            opacity: 0;
            transform: translateX(20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
        
        .animate-fade-in-delay {
          animation: fade-in 0.4s ease-out forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }
        
        /* Progress bar fill animation */
        @keyframes progress-fill {
          0% { width: 0%; }
        }
        .animate-progress-fill {
          animation: progress-fill 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.5s;
        }
        .animate-progress-fill-active {
          animation: progress-fill 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        /* Skill tag fade-in animation */
        @keyframes fade-in-tag {
          0% { 
            opacity: 0;
            transform: translateY(8px);
          }
          100% { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-tag {
          animation: fade-in-tag 0.4s ease-out forwards;
          opacity: 0;
        }
        
        /* Ball bounce animation - smooth arc from bottom to second level */
        @keyframes ball-bounce-up {
          0% {
            transform: translate(0, 0);
          }
          5% {
            transform: translate(5px, 5px);
          }
          12% {
            transform: translate(20px, -40px);
          }
          22% {
            transform: translate(50px, -120px);
          }
          32% {
            transform: translate(85px, -200px);
          }
          42% {
            transform: translate(125px, -260px);
          }
          52% {
            transform: translate(160px, -275px);
          }
          62% {
            transform: translate(180px, -255px);
          }
          70% {
            transform: translate(187px, -245px);
          }
          78% {
            transform: translate(187px, -255px);
          }
          86% {
            transform: translate(187px, -247px);
          }
          93% {
            transform: translate(187px, -250px);
          }
          100% {
            transform: translate(187px, -249px);
          }
        }
        
        /* Shadow animation - smooth fade between platforms */
        @keyframes ball-shadow-animate {
          0% {
            transform: translateX(0) scale(1);
            opacity: 0.5;
          }
          8% {
            transform: translateX(10px) scale(0.95);
            opacity: 0.45;
          }
          18% {
            transform: translateX(30px) scale(0.75);
            opacity: 0.35;
          }
          28% {
            transform: translateX(55px) scale(0.5);
            opacity: 0.2;
          }
          38% {
            transform: translateX(80px) scale(0.3);
            opacity: 0.08;
          }
          48% {
            transform: translateX(100px) scale(0.15);
            opacity: 0;
          }
          52% {
            transform: translate(175px, -248px) scale(0.15);
            opacity: 0;
          }
          62% {
            transform: translate(175px, -248px) scale(0.4);
            opacity: 0.15;
          }
          72% {
            transform: translate(175px, -248px) scale(0.6);
            opacity: 0.3;
          }
          82% {
            transform: translate(175px, -248px) scale(0.75);
            opacity: 0.4;
          }
          92% {
            transform: translate(175px, -248px) scale(0.82);
            opacity: 0.48;
          }
          100% {
            transform: translate(175px, -248px) scale(0.85);
            opacity: 0.5;
          }
        }
        
        .analyst-goal-svg .ball-main,
        .analyst-goal-svg .ball-center {
          animation: ball-bounce-up 1.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
          animation-delay: 0.5s;
        }
        
        .analyst-goal-svg .ball-shadow {
          transform-origin: center center;
          animation: ball-shadow-animate 1.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
};
