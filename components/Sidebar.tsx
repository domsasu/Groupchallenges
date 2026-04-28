
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CourseData, Lesson, ContentType, Status } from '../types';
import { Icons } from './Icons';
import { buildDailyGoalLessonIds, getSkillPoints } from '../skills';

interface SidebarProps {
  data: CourseData;
  activeLessonId: string;
  onSelectLesson: (lesson: Lesson) => void;
  shouldStartAnimation?: boolean;
  onTrackCareer?: () => void;
  onAdjustPlan?: () => void;
  dailyTimeGoal?: number; // in minutes: 30, 60, or 90
  onShowDailyGoalProgress?: (data: { earnedXP: number; totalXP: number }) => void;
  dailyGoalLessonIds?: string[];
  dailyEarnedXP?: number; // Total XP earned today (can exceed goal)
  onShowSkillProgressModal?: () => void; // Opens skill detail modal from daily goal
  onNavigateToMyLearning?: () => void; // Navigate to My Learning page
  // Session timer props
  sessionTimeRemaining?: number;
  isSessionPaused?: boolean;
  onPauseSession?: () => void;
  onAddTime?: (minutes: number) => void;
}

interface LessonItemProps {
  lesson: Lesson;
  index: number;
  isLast: boolean;
  activeLessonId: string;
  onSelectLesson: (l: Lesson) => void;
  prevCompleted?: boolean;
  highlightBackground?: string;
  isBigIcon?: boolean;
  variant?: 'default' | 'burning';
  isTransition?: boolean;
  hasDivider?: boolean;
  dividerColor?: string;
  isGoalComplete?: boolean;
  showTargetIcon?: boolean;
  isCollapsed?: boolean;
  // New props for goal boundary design
  isInsideBoundary?: boolean;
  lessonNumber?: number;
  showVerticalLines?: boolean;
}

// Robust Typewriter component
interface TypewriterTextProps {
  text: string;
  onComplete?: () => void;
  speed?: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, onComplete, speed = 25 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        // Capture the character value immediately to avoid closure issues
        const charToAdd = text.charAt(i);
        setDisplayedText((prev) => prev + charToAdd);
        i++;
      } else {
        clearInterval(timer);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

const playChime = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Chiming sound for notification/progress update
    const notes = [1046.50, 1318.51, 1567.98, 2093.00]; // C6, E6, G6, C7
    
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine'; 
        osc.frequency.value = freq;
        
        const start = now + (i * 0.1); 
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.05, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 1.5);
        
        osc.start(start);
        osc.stop(start + 1.6);
    });
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

const playRippleSound = (index: number) => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        // Rising pitch logic: Base C5 (523.25 Hz)
        // Increase by whole steps roughly (2 semitones) per index for clear ascending effect
        const baseFreq = 523.25; 
        const freq = baseFreq * Math.pow(1.12246, index); // approx 2 semitones up per step

        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = 'sine';

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
    } catch (e) { console.error(e); }
};

const LessonItem: React.FC<LessonItemProps> = ({ 
  lesson, 
  index, 
  isLast, 
  activeLessonId, 
  onSelectLesson,
  prevCompleted = false,
  highlightBackground,
  isBigIcon = false,
  variant = 'default',
  isTransition = false,
  hasDivider = false,
  dividerColor = 'bg-[var(--cds-color-grey-50)]',
  isGoalComplete = false,
  showTargetIcon = false,
  isCollapsed = false,
  isInsideBoundary = false,
  lessonNumber,
  showVerticalLines = true
}) => {
  const isActive = activeLessonId === lesson.id;
  const isBurning = variant === 'burning';
  
  // Local state to trigger bounce animation when becoming active
  const [showBounce, setShowBounce] = useState(false);
  const prevActiveRef = useRef(isActive);
  
  // Local state to trigger spark animation when turning purple
  const [showSpark, setShowSpark] = useState(false);
  const prevGoalCompleteRef = useRef(isGoalComplete);

  // Trigger bounce animation when this item becomes active
  useEffect(() => {
    if (isActive && !prevActiveRef.current) {
        setShowBounce(true);
        const timer = setTimeout(() => setShowBounce(false), 600);
        return () => clearTimeout(timer);
    }
    prevActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (isGoalComplete && !prevGoalCompleteRef.current) {
        setShowSpark(true);
        const timer = setTimeout(() => setShowSpark(false), 800);
        return () => clearTimeout(timer);
    }
    prevGoalCompleteRef.current = isGoalComplete;
  }, [isGoalComplete]);

  // If component mounts and isGoalComplete becomes true shortly after via parent effect
  useEffect(() => {
      if (isGoalComplete) {
         setShowSpark(true);
         const timer = setTimeout(() => setShowSpark(false), 800);
         return () => clearTimeout(timer);
      }
  }, [isGoalComplete]);

  // New circle-based design for all items
  const renderBoundaryCircle = () => {
    const circleSize = isCollapsed ? 'w-5 h-5' : 'w-5 h-5';
    
    if (lesson.isLocked) {
      return (
        <div className={`${circleSize} rounded-full flex items-center justify-center border border-[#C1CAD9] bg-transparent`}>
          <Icons.Lock className="w-2.5 h-2.5 text-[var(--cds-color-grey-400)]" />
        </div>
      );
    }
    
    if (isActive || lesson.status === Status.IN_PROGRESS) {
      // Yellow filled circle with white dot (active state)
      return <Icons.GoalActive className={circleSize} />;
    }
    
    if (lesson.status === Status.COMPLETED) {
      if (isGoalComplete) {
        // Yellow circle with white checkmark (after ripple celebration)
        return <Icons.GoalCheckYellow className={circleSize} />;
      } else {
        // Dark circle with white checkmark (before goal complete)
        return <Icons.GoalCheckDark className={circleSize} />;
      }
    }
    
    if (lesson.status === Status.FAILED) {
      return (
        <div className={`${circleSize} rounded-full flex items-center justify-center bg-[var(--cds-color-red-700)]`}>
          <Icons.Failed className="w-2.5 h-2.5 text-white" />
        </div>
      );
    }
    
    // Pending state: gray outlined circle - only show number if inside boundary
    if (isInsideBoundary) {
      return <Icons.GoalPending className={circleSize} number={lessonNumber || index + 1} />;
    } else {
      // Empty gray circle for items outside boundary
      return (
        <div className={`${circleSize} rounded-full border border-[#C1CAD9] bg-transparent`}></div>
      );
    }
  };

  // Legacy icon rendering for items outside boundary
  let StatusIcon;
  if (lesson.isLocked) {
    StatusIcon = <Icons.Lock className={`${isBigIcon ? 'w-4 h-4' : 'w-3 h-3'} text-[var(--cds-color-grey-400)]`} />;
  } else if (lesson.status === Status.COMPLETED) {
    StatusIcon = <Icons.Check className={`${isBigIcon ? 'w-4 h-4' : 'w-2.5 h-2.5'} text-white`} strokeWidth={3} />;
  } else if (lesson.status === Status.FAILED) {
    StatusIcon = <Icons.Failed className={`${isBigIcon ? 'w-4 h-4' : 'w-2.5 h-2.5'} text-white`} />;
  } else if (isActive || lesson.status === Status.IN_PROGRESS) {
    StatusIcon = <div className={`${isBigIcon ? 'w-3 h-3' : 'w-1.5 h-1.5'} ${isGoalComplete ? 'bg-[var(--cds-color-white)]' : 'bg-[var(--cds-color-white)]'} rounded-full`}></div>;
  } else {
    StatusIcon = null;
  }

  // Increased size for big icon (w-8 h-8)
  const iconSizeClass = isBigIcon ? "w-8 h-8" : "w-4 h-4";
  let iconWrapperClass = `${iconSizeClass} rounded-full flex items-center justify-center border-2 box-border transition-all duration-500`;
  
  if (lesson.isLocked) {
    iconWrapperClass += " border-[var(--cds-color-grey-200)] bg-transparent";
  } else if (lesson.status === Status.COMPLETED) {
    if (isBurning) {
        iconWrapperClass += " border-[var(--cds-color-yellow-200)] bg-[var(--cds-color-yellow-200)] shadow-[0_0_8px_rgba(255,201,54,0.4)] animate-pulse";
    } else if (isGoalComplete) {
        // Gold color after goal complete (ripple effect)
        iconWrapperClass += " border-[var(--cds-color-yellow-200)] bg-[var(--cds-color-yellow-200)]";
    } else {
        // Slate-800 color before goal complete
        iconWrapperClass += " border-[var(--cds-color-grey-900)] bg-[var(--cds-color-grey-900)]";
    }
  } else if (lesson.status === Status.FAILED) {
    iconWrapperClass += " border-[#B31E2D] bg-[var(--cds-color-red-700)]";
  } else if (isActive || lesson.status === Status.IN_PROGRESS) {
    iconWrapperClass += " border-[var(--cds-color-yellow-200)] bg-[var(--cds-color-yellow-200)]";
    // Add bounce animation and shadow when becoming active
    if (showBounce) {
        iconWrapperClass += " animate-bounce-in shadow-[0_0_12px_rgba(255,201,54,0.6)]";
    }
  } else {
    // Increased contrast for default border
    iconWrapperClass += " border-[var(--cds-color-grey-200)] bg-transparent";
  }

  // Vertical Progress Bar Logic
  const burningColor = 'bg-[var(--cds-color-yellow-200)]';
  const goalCompleteColor = 'bg-[var(--cds-color-yellow-200)]';
  const defaultCompleteColor = 'bg-[var(--cds-color-grey-900)]';

  let topBg = 'bg-[var(--cds-color-grey-200)]';
  if (prevCompleted) {
    if (isTransition) {
        topBg = isGoalComplete ? 'bg-gradient-to-b from-[#FFC936] to-[#FFC936]' : 'bg-gradient-to-b from-slate-800 to-slate-800';
    } else if (isBurning) {
        topBg = burningColor;
    } else if (isGoalComplete) {
        topBg = goalCompleteColor;
    } else {
        topBg = defaultCompleteColor;
    }
  }

  let bottomBg = 'bg-[var(--cds-color-grey-200)]';
  if (lesson.status === Status.COMPLETED) {
      if (isBurning) {
          bottomBg = burningColor;
      } else if (isGoalComplete) {
          bottomBg = goalCompleteColor;
      } else {
          bottomBg = defaultCompleteColor;
      }
  }

  // Background Logic for text section only (matching Today's Goal items)
  let textBgClass;
  if (isActive) {
    textBgClass = 'bg-[var(--cds-color-grey-50)]';
  } else {
    textBgClass = 'hover:bg-[var(--cds-color-grey-50)]/50';
  }

  return (
    <div 
      id={`lesson-item-${lesson.id}`}
      onClick={() => !lesson.isLocked && onSelectLesson(lesson)}
      className={`
        flex gap-3 items-center cursor-pointer relative
        ${isCollapsed ? 'min-h-[40px] px-2 justify-center' : 'min-h-[56px] pl-4 pr-3'}
        ${lesson.isLocked ? 'opacity-70 cursor-not-allowed' : ''}
      `}
      style={{ scrollMarginTop: '200px' }}
      title={isCollapsed ? lesson.title : undefined}
    >
       <div className={`flex flex-col self-stretch items-center shrink-0 relative ${isCollapsed ? 'w-[32px]' : 'w-[32px]'}`}>
          <div className="flex-1"></div>
          
          <div className="shrink-0 z-10 relative flex justify-center items-center">
             {/* Use consistent circle design for all items */}
             {renderBoundaryCircle()}
             {showSpark && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
                   {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                       <div 
                       key={i}
                       className="absolute w-1 h-1 bg-[var(--cds-color-yellow-200)] rounded-full animate-spark"
                       style={{ 
                           '--spark-angle': `${angle}deg`,
                           transformOrigin: 'center center' 
                       } as React.CSSProperties}
                       />
                   ))}
               </div>
             )}
          </div>
          
          <div className="flex-1"></div>
       </div>

       {!isCollapsed && (
         <div className={`flex items-center flex-1 px-3 rounded-lg transition-colors ${textBgClass}`} style={{ height: '56px' }}>
            <div className="flex flex-col justify-center py-1 flex-1">
              <p className={`text-sm ${isActive ? 'text-[var(--cds-color-grey-975)] font-semibold' : 'text-[var(--cds-color-grey-975)] font-medium'}`}>
                {lesson.title}
              </p>
              <p className="text-xs text-[var(--cds-color-grey-600)] mt-0.5">
                 {lesson.type} • {lesson.duration || '5 min'}
              </p>
            </div>
         </div>
       )}

       {/* Divider Line extending from the progress line (left: 32px) to the right edge */}
       {hasDivider && !isCollapsed && (
         <div className={`absolute bottom-0 right-0 h-[1px] ${dividerColor}`} style={{ left: '32px' }}></div>
       )}
    </div>
  );
};

interface DailyGoalHeaderProps {
  title: string;
  skillText: string;
  skills?: string[];
  lessons: Lesson[];
  activeLessonId: string;
  shouldAnimate: boolean;
  isSecondary?: boolean;
  scReward: number;
  onTrackCareer?: () => void;
  onAdjustPlan?: () => void;
  forceWhiteBg?: boolean;
  onTriggerTargetIcon?: () => void;
  completedTexts: Set<string>;
  onTextCompleted: (text: string) => void;
  dailyTimeGoal?: number;
  onShowDailyGoalProgress?: (data: { earnedXP: number; totalXP: number }) => void;
  dailyEarnedXP?: number; // Total XP earned today (can exceed goal)
  onShowSkillProgressModal?: () => void; // Opens skill detail modal
  onNavigateToMyLearning?: () => void; // Navigate to My Learning page
  // Session timer props
  sessionTimeRemaining?: number; // Time remaining in seconds
  isSessionPaused?: boolean;
  onPauseSession?: () => void;
  onAddTime?: (minutes: number) => void;
}

// Helper to format time goal for display
const formatTimeGoal = (minutes: number): string => {
  if (minutes === 15) return '15 min';
  if (minutes === 30) return '30 min';
  if (minutes === 60) return '1 hr';
  return `${minutes} min`;
};

// Helper to format seconds to MM:SS display
const formatTimeDisplay = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const DailyGoalHeader: React.FC<DailyGoalHeaderProps> = ({
  title,
  skillText,
  skills = [],
  lessons,
  activeLessonId,
  shouldAnimate,
  isSecondary = false,
  scReward,
  onTrackCareer,
  onAdjustPlan,
  forceWhiteBg = false,
  onTriggerTargetIcon,
  completedTexts,
  onTextCompleted,
  dailyTimeGoal = 60,
  onShowDailyGoalProgress,
  dailyEarnedXP,
  onShowSkillProgressModal,
  onNavigateToMyLearning,
  sessionTimeRemaining,
  isSessionPaused,
  onPauseSession,
  onAddTime
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [typingComplete, setTypingComplete] = useState(() => completedTexts.has(skillText));
  const [hasTriggered, setHasTriggered] = useState(false);
  const [textToDisplay, setTextToDisplay] = useState(skillText);
  
  // Track if we've triggered the target icon animation
  const [hasTriggeredTargetIcon, setHasTriggeredTargetIcon] = useState(false);
  
  // Typewriter animation state for SKILL section
  const [skillTypingComplete, setSkillTypingComplete] = useState(false);
  const [startSkillTyping, setStartSkillTyping] = useState(false);
  
  // Trigger typewriter animation on mount
  useEffect(() => {
    const skillTimer = setTimeout(() => setStartSkillTyping(true), 400);
    return () => clearTimeout(skillTimer);
  }, []);

  const isActiveGroup = lessons.some(l => l.id === activeLessonId);

  // Compute actual completion status - use dailyEarnedXP if provided (allows exceeding goal)
  const goalEarnedPoints = lessons.reduce((acc, l) => l.status === Status.COMPLETED ? acc + getSkillPoints(l.type) : acc, 0);
  const totalPoints = lessons.reduce((acc, l) => acc + getSkillPoints(l.type), 0);
  const earnedPoints = dailyEarnedXP !== undefined ? dailyEarnedXP : goalEarnedPoints;
  const isAllComplete = goalEarnedPoints === totalPoints && totalPoints > 0;

  // Visual completion state (delayed to sync with animations)
  const [localIsComplete, setLocalIsComplete] = useState(isAllComplete);
  const hasBigAnimationItem = lessons.some(l => l.id === 'm1-l10');

  // Logic to delay visual completion transition to match sidebar ripple animations
  useEffect(() => {
     if (isAllComplete && !localIsComplete) {
         const rippleDuration = lessons.length * 300;
         // Sync with DailyGoalBlock ripple: 4000ms initial delay + ripple duration
         const baseDelay = hasBigAnimationItem ? 4000 : 500; 
         const delay = baseDelay + rippleDuration + 300; // +300ms buffer after last item turns orange

         const timer = setTimeout(() => {
             setLocalIsComplete(true);
         }, delay);
         
         return () => clearTimeout(timer);
     } else if (!isAllComplete && localIsComplete) {
         setLocalIsComplete(false);
     }
  }, [isAllComplete, localIsComplete, hasBigAnimationItem, lessons.length]);

  useEffect(() => {
    // Dynamic text logic based on progress
    const activeLessonIndex = lessons.findIndex(l => l.id === activeLessonId);
    const halfwayIndex = Math.floor(lessons.length / 2);

    let newText = "";
    let shouldForceOpen = false;

    const totalXPLabel = totalPoints ? `${totalPoints} XP` : "XP";

    // 1. When user begins (at first item, index 0)
    if (activeLessonIndex === 0 && !localIsComplete) {
        newText = `Let's get started! Complete ${lessons.length} items to hit today's goal.`;
        shouldForceOpen = true;
    }

    // 2. After completing first item (moved from index 0 to 1+, but before halfway)
    if (activeLessonIndex >= 1 && activeLessonIndex < halfwayIndex && !localIsComplete) {
        newText = "Nice start! Keep going to hit today's goal.";
        shouldForceOpen = true;
    }

    // 3. When they complete half of today's goal items (at or past halfway, but not at last)
    if (activeLessonIndex >= halfwayIndex && activeLessonIndex < lessons.length - 1 && !localIsComplete) {
        newText = "Halfway there — keep going to finish your daily goal.";
        shouldForceOpen = true;
    }

    // 4. When they reach the last item of today's goal
    if (activeLessonIndex !== -1 && activeLessonIndex === lessons.length - 1 && !localIsComplete) {
         newText = `Last item! Finish this to earn ${totalXPLabel}.`;
         shouldForceOpen = true;
    }

    // Completion State Override - Only trigger when visual state catches up
    if (localIsComplete) {
         // Re-check overachieving based on current context
         const isOver = !isActiveGroup; 
         
         if (isOver) {
            newText = "You're on fire! If you want to adjust your learning plan, ";
         } else {
            // Goal complete - show celebratory message
            newText = "Daily goal reached — great work!";
         }
         shouldForceOpen = true;
    }

    if (newText !== textToDisplay) {
        setTextToDisplay(newText);
        // Only reset typingComplete if the new text hasn't been completed before
        if (!completedTexts.has(newText)) {
            setTypingComplete(false);
        } else {
            setTypingComplete(true);
        }
        if (shouldForceOpen) {
            setShowInfo(true);
        }
    }
  }, [activeLessonId, lessons, skillText, textToDisplay, localIsComplete, isActiveGroup, completedTexts, totalPoints]);

  useEffect(() => {
    if (shouldAnimate && isActiveGroup && !hasTriggered) {
        // Automatically trigger animation if active group, with a small delay
        const timer = setTimeout(() => {
            setShowInfo(true);
            setHasTriggered(true);
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [shouldAnimate, isActiveGroup, hasTriggered]);

  useEffect(() => {
    if (!showInfo) {
      setTypingComplete(false);
    }
  }, [showInfo]);

  const isFireMessage = textToDisplay.startsWith("You're on fire");

  return (
    <div 
      className="bg-[var(--cds-color-white)] rounded-xl shadow-sm border border-[var(--cds-color-grey-100)] mx-3 my-2 overflow-hidden"
    >
        {/* Header Section */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--cds-color-grey-50)]">
            {/* Title with XP count */}
            <div className="flex items-center gap-2">
              <span className="text-[var(--cds-color-grey-975)] font-bold text-base tracking-wide">
                {isSecondary ? "Goal" : "Today's goal"}
              </span>
              {/* XP Count */}
              <span 
                className="text-xs text-[var(--cds-color-grey-975)] font-semibold cursor-pointer hover:text-[var(--cds-color-grey-700)]"
                onClick={onNavigateToMyLearning}
              >
                {startSkillTyping ? (
                  skillTypingComplete ? (
                    <span>{earnedPoints}/{totalPoints} XP</span>
                  ) : (
                    <TypewriterText 
                      text={`${earnedPoints}/${totalPoints} XP`}
                      speed={30}
                      onComplete={() => setSkillTypingComplete(true)}
                    />
                  )
                ) : (
                  <span className="opacity-0">.</span>
                )}
              </span>
            </div>
            
            {/* Session Timer Controls - pill shows time by default; hover reveals pause and +10m */}
            {sessionTimeRemaining !== undefined && onPauseSession && onAddTime && (
              <div
                className="group/timer inline-flex items-center rounded-lg bg-[var(--color-bg-[var(--cds-color-white)])] border border-[var(--cds-color-grey-100)] overflow-hidden"
                title="Hover for pause and add time"
              >
                <span className="text-xs font-semibold text-[var(--cds-color-grey-975)] py-0.5 pl-2 pr-2 whitespace-nowrap">
                  {formatTimeDisplay(sessionTimeRemaining)}
                </span>
                <div className="flex items-center max-w-0 overflow-hidden transition-[max-width] duration-200 ease-out group-hover/timer:max-w-[120px]">
                  <span className="w-px bg-[var(--cds-color-grey-100)] self-stretch flex-shrink-0 min-h-[18px]" aria-hidden />
                  <button
                    onClick={onPauseSession}
                    className="p-1 hover:bg-[var(--cds-color-grey-100)] transition-colors flex-shrink-0"
                    title={isSessionPaused ? "Session paused" : "Pause session"}
                  >
                    <Icons.Pause className="w-4 h-4 text-[var(--cds-color-grey-500)]" />
                  </button>
                  <span className="w-px bg-[var(--cds-color-grey-100)] self-stretch flex-shrink-0 min-h-[18px]" aria-hidden />
                  <button
                    onClick={() => onAddTime(10)}
                    className="px-2 py-0.5 text-xs font-semibold text-[var(--cds-color-grey-975)] hover:bg-[var(--cds-color-grey-100)] transition-colors flex-shrink-0 whitespace-nowrap"
                  >
                    +10m
                  </button>
                </div>
              </div>
            )}
        </div>
        
        {/* Dynamic Motivational Message Section */}
        {textToDisplay && showInfo && (
          <div className="px-3 pt-2 pb-3">
            <div className="animate-fade-in">
                <p className={`text-xs ${isFireMessage ? 'text-[var(--cds-color-yellow-700)]' : 'text-[var(--cds-color-grey-700)]'}`}>
                    {typingComplete ? (
                      <>
                        <span className={isFireMessage ? 'font-semibold' : ''}>{textToDisplay}</span>
                        {isFireMessage && onAdjustPlan && (
                          <button 
                            onClick={onAdjustPlan}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            click here
                          </button>
                        )}
                      </>
                    ) : (
                      <TypewriterText 
                        text={textToDisplay}
                        speed={20}
                        onComplete={() => {
                          setTypingComplete(true);
                          onTextCompleted?.(textToDisplay);
                        }}
                      />
                    )}
                </p>
            </div>
          </div>
        )}
        

    </div>
  );
};

// GoalBoundaryContainer - Rounded container with inner shadow for goal items
interface GoalBoundaryContainerProps {
  children: React.ReactNode;
  itemCount: number;
  isCollapsed?: boolean;
}

const GoalBoundaryContainer: React.FC<GoalBoundaryContainerProps> = ({
  children,
  itemCount,
  isCollapsed = false
}) => {
  // Calculate height based on item count - scaled down version
  // Each item row is ~56px for expanded, ~40px for collapsed
  const itemHeight = isCollapsed ? 40 : 56;
  const padding = 16; // top and bottom padding
  const containerHeight = (itemCount * itemHeight) + padding;
  const containerWidth = 32; // narrower container
  const borderRadius = containerWidth / 2;

  return (
    <div 
      className="relative mx-auto"
      style={{ 
        width: `${containerWidth}px`,
      }}
    >
      {/* SVG container with rounded corners and inner shadow */}
      <svg 
        className="absolute inset-0 pointer-events-none"
        width={containerWidth} 
        height={containerHeight}
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id={`goalContainerShadow-${itemCount}`} x="0" y="-4" width={containerWidth} height={containerHeight + 4} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="-4"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
            <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
          </filter>
        </defs>
        <g filter={`url(#goalContainerShadow-${itemCount})`}>
          <rect width={containerWidth} height={containerHeight} rx={borderRadius} fill="white"/>
        </g>
        <rect x="0.5" y="0.5" width={containerWidth - 1} height={containerHeight - 1} rx={borderRadius - 0.5} stroke="#C1CAD9"/>
      </svg>
      
      {/* Children positioned inside the container */}
      <div 
        className="relative z-10 flex flex-col items-center justify-start"
        style={{ 
          minHeight: `${containerHeight}px`,
          paddingTop: '8px',
          paddingBottom: '8px'
        }}
      >
        {children}
      </div>
    </div>
  );
};

interface DailyGoalBlockProps {
  title: string;
  skillText: string;
  skills?: string[];
  lessons: Lesson[];
  startIndex: number;
  activeLessonId: string;
  onSelectLesson: (l: Lesson) => void;
  shouldAnimate: boolean;
  isSecondary?: boolean;
  customLabel?: string;
  scReward: number;
  hideHeader?: boolean;
  onTrackCareer?: () => void;
  onAdjustPlan?: () => void;
  showTargetIconOnLessonId?: string;
  onTriggerTargetIcon?: () => void;
  isCollapsed?: boolean;
  completedTexts: Set<string>;
  onTextCompleted: (text: string) => void;
  dailyTimeGoal?: number;
  onShowDailyGoalProgress?: (data: { earnedXP: number; totalXP: number }) => void;
  onShowSkillProgressModal?: () => void; // Opens skill detail modal
  onNavigateToMyLearning?: () => void; // Navigate to My Learning page
  // New props for boundary extension
  extendedLessonIds?: string[];
  allModuleLessons?: Lesson[]; // All lessons in the module for finding extended items
}

const DailyGoalBlock: React.FC<DailyGoalBlockProps> = (props) => {
  const {
    lessons,
    startIndex,
    activeLessonId,
    onSelectLesson,
    isSecondary = false,
    hideHeader = false,
    onTrackCareer,
    onAdjustPlan,
    showTargetIconOnLessonId,
    onTriggerTargetIcon,
    isCollapsed = false,
    dailyTimeGoal = 60,
    extendedLessonIds = [],
    allModuleLessons = []
  } = props;

  // Get extended lessons from allModuleLessons based on IDs
  const extendedLessons = useMemo(() => {
    return extendedLessonIds
      .map(id => allModuleLessons.find(l => l.id === id))
      .filter((l): l is Lesson => Boolean(l));
  }, [extendedLessonIds, allModuleLessons]);

  // Combined lessons: original goal lessons + extended lessons
  const allBoundaryLessons = useMemo(() => {
    return [...lessons, ...extendedLessons];
  }, [lessons, extendedLessons]);

  const isActiveGroup = allBoundaryLessons.some(l => l.id === activeLessonId);

  const earnedPoints = lessons.reduce((acc, l) => l.status === Status.COMPLETED ? acc + getSkillPoints(l.type) : acc, 0);
  const totalPoints = lessons.reduce((acc, l) => acc + getSkillPoints(l.type), 0);
  const isComplete = earnedPoints === totalPoints && totalPoints > 0;
  
  // Determine theme: Purple (Primary) if active group OR if it's the first group (!isSecondary)
  const isPrimaryTheme = !isSecondary || isActiveGroup || isComplete;

  const blockRef = useRef<HTMLDivElement>(null);

  // Staggered Animation State for "One by One" Yellow effect (ripple)
  const [yellowIndex, setYellowIndex] = useState(-1);

  // Play sound when items turn yellow
  useEffect(() => {
    if (isComplete && yellowIndex >= 0 && yellowIndex < lessons.length) {
        playRippleSound(yellowIndex);
    }
  }, [yellowIndex, isComplete, lessons.length]);

  useEffect(() => {
    if (isComplete) {
       // Start ripple animation if complete
       // Logic: Increment yellowIndex from -1 up to lessons.length - 1
       if (yellowIndex < lessons.length - 1) {
           let delay = 300;
           
           // Special delay for m1-l10 completion to sync with MainContent animation
           // MainContent animations complete ~2500ms, add 1.5s = 4000ms total
           if (yellowIndex === -1 && activeLessonId === 'm1-l10' && lessons.some(l => l.id === 'm1-l10')) {
               delay = 4000;
           }
           
           const timer = setTimeout(() => {
               setYellowIndex(prev => prev + 1);
           }, delay); // Speed of the ripple 
           return () => clearTimeout(timer);
       }
    } else {
        setYellowIndex(-1);
    }
  }, [isComplete, yellowIndex, lessons.length, activeLessonId, lessons]);

  // Calculate items inside boundary (original goal items + any extended items)
  const boundaryItemCount = allBoundaryLessons.length;

  return (
    <div ref={blockRef}>
      {/* Header is always sticky */}
      {!hideHeader && !isCollapsed && (
        <div className="sticky top-0 z-20">
          <DailyGoalHeader {...props} onTrackCareer={onTrackCareer} onAdjustPlan={onAdjustPlan} onTriggerTargetIcon={onTriggerTargetIcon} />
        </div>
      )}
      <div 
        id={`daily-goal-block-${startIndex}`}
        className={`relative flex transition-all overflow-visible ${isCollapsed ? 'mb-0' : 'mb-4'}`}
      >
          {/* Goal Boundary Container with lessons inside */}
          <div className={`flex overflow-visible ${isCollapsed ? 'py-0' : 'py-3'}`}>
            {/* Left side: Boundary container with circle indicators */}
            <div className="flex-shrink-0 ml-4">
              <GoalBoundaryContainer itemCount={boundaryItemCount} isCollapsed={isCollapsed}>
                {allBoundaryLessons.map((lesson, index) => {
                  const isOriginalGoalItem = index < lessons.length;
                  const isItemYellow = isComplete && isOriginalGoalItem && index <= yellowIndex;
                  const isActive = activeLessonId === lesson.id;
                  // Extended items that are completed should also show yellow checkmark
                  const isExtendedComplete = !isOriginalGoalItem && lesson.status === Status.COMPLETED;
                  // Show spark when this item just turned yellow (yellowIndex matches this index)
                  const showSparkEffect = isComplete && isOriginalGoalItem && index === yellowIndex;
                  
                  return (
                    <div 
                      key={lesson.id}
                      className="flex items-center justify-center cursor-pointer relative"
                      style={{ height: '56px' }} // Match lesson item height
                      onClick={() => !lesson.isLocked && onSelectLesson(lesson)}
                    >
                      {/* Render the appropriate circle based on state */}
                      {lesson.isLocked ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--cds-color-grey-200)] bg-transparent">
                          <Icons.Lock className="w-2.5 h-2.5 text-[var(--cds-color-grey-400)]" />
                        </div>
                      ) : isActive || lesson.status === Status.IN_PROGRESS ? (
                        <Icons.GoalActive className="w-5 h-5" />
                      ) : lesson.status === Status.COMPLETED ? (
                        (isItemYellow || isExtendedComplete) ? (
                          <Icons.GoalCheckYellow className="w-5 h-5" />
                        ) : (
                          <Icons.GoalCheckDark className="w-5 h-5" />
                        )
                      ) : lesson.status === Status.FAILED ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--cds-color-red-700)]">
                          <Icons.Failed className="w-2.5 h-2.5 text-white" />
                        </div>
                      ) : (
                        <Icons.GoalPending className="w-5 h-5" number={index + 1} />
                      )}
                      {/* Spark effect when turning yellow */}
                      {showSparkEffect && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
                          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                            <div 
                              key={i}
                              className="absolute w-1 h-1 bg-[var(--cds-color-yellow-200)] rounded-full animate-spark"
                              style={{ 
                                '--spark-angle': `${angle}deg`,
                                transformOrigin: 'center center' 
                              } as React.CSSProperties}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </GoalBoundaryContainer>
            </div>
            
            {/* Right side: Lesson details */}
            {!isCollapsed && (
              <div className="flex flex-col flex-1 ml-3" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                {allBoundaryLessons.map((lesson, index) => {
                  const isActive = activeLessonId === lesson.id;
                  
                  return (
                    <div 
                      key={lesson.id}
                      className={`flex items-center cursor-pointer px-3 rounded-lg transition-colors ${
                        isActive ? 'bg-[var(--cds-color-grey-50)]' : 'hover:bg-[var(--cds-color-grey-50)]/50'
                      } ${lesson.isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                      style={{ height: '56px' }}
                      onClick={() => !lesson.isLocked && onSelectLesson(lesson)}
                    >
                      <div className="flex flex-col justify-center py-1 flex-1">
                        <p className={`text-sm ${isActive ? 'text-[var(--cds-color-grey-975)] font-semibold' : 'text-[var(--cds-color-grey-975)] font-medium'}`}>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-[var(--cds-color-grey-600)] mt-0.5">
                          {lesson.type} • {lesson.duration || '5 min'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({
  data,
  activeLessonId,
  onSelectLesson,
  shouldStartAnimation = true,
  onTrackCareer,
  onAdjustPlan,
  dailyTimeGoal = 60,
  onShowDailyGoalProgress,
  dailyGoalLessonIds = [],
  dailyEarnedXP,
  onShowSkillProgressModal,
  onNavigateToMyLearning,
  sessionTimeRemaining,
  isSessionPaused,
  onPauseSession,
  onAddTime
}) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    // Only expand the first module (which contains Today's Goal), collapse others
    data.modules.forEach((m, index) => initialState[m.id] = index === 0);
    return initialState;
  });

  // Collapsed state for sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State to show target icon on a specific lesson (fade-in animation)
  const [showTargetIconOnLessonId, setShowTargetIconOnLessonId] = useState<string | null>(null);
  
  // Track completed typewriter texts (persists across collapse/expand)
  const [completedTexts, setCompletedTexts] = useState<Set<string>>(new Set());
  
  // Track unread messages for collapsed state notification
  const [lastSeenMessage, setLastSeenMessage] = useState<string | null>(null);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);
  
  // Extended lesson IDs disabled - boundary no longer grows after goal completion
  // Items completed after goal section show dark checkmarks instead
  const extendedLessonIds: string[] = [];
  
  // Collapsed view ripple animation state
  const [collapsedYellowIndex, setCollapsedYellowIndex] = useState(-1);
  
  const handleTextCompleted = (text: string) => {
    setCompletedTexts(prev => new Set(prev).add(text));
    // If collapsed when a new message completes, mark as unread
    if (isCollapsed && text !== lastSeenMessage) {
      setHasUnreadMessage(true);
    }
    setLastSeenMessage(text);
  };
  
  // Clear unread indicator when sidebar is expanded
  useEffect(() => {
    if (!isCollapsed) {
      setHasUnreadMessage(false);
    }
  }, [isCollapsed]);
  
  const handleTriggerTargetIcon = () => {
    setShowTargetIconOnLessonId('m1-l10');
  };

  const toggleModule = (id: string) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const todayGoalGroup = {
    title: "Visualizing and Reporting Clean Data",
    text: "Today, apply data visualization techniques by creating a sales performance dashboard.",
    skills: [],
    customLabel: undefined as string | undefined
  };

  const fallbackGoalIds = useMemo(
    () => buildDailyGoalLessonIds(data, activeLessonId, dailyTimeGoal),
    [data, activeLessonId, dailyTimeGoal]
  );

  const goalLessonIds = dailyGoalLessonIds.length ? dailyGoalLessonIds : fallbackGoalIds;
  const allLessons = data.modules.flatMap((m) => m.lessons);
  const lessonById = new Map(allLessons.map((lesson) => [lesson.id, lesson]));
  const todayLessons = goalLessonIds
    .map((id) => lessonById.get(id))
    .filter((lesson): lesson is Lesson => Boolean(lesson));

  // Check if today's goal is complete
  const isTodayGoalComplete = todayLessons.every(l => l.status === Status.COMPLETED);
  
  // Collapsed view ripple animation effect
  useEffect(() => {
    if (isCollapsed && isTodayGoalComplete) {
      // Start ripple animation if goal is complete and sidebar is collapsed
      if (collapsedYellowIndex < todayLessons.length - 1) {
        let delay = 300;
        
        // Initial delay before starting ripple
        if (collapsedYellowIndex === -1) {
          delay = 500;
        }
        
        const timer = setTimeout(() => {
          setCollapsedYellowIndex(prev => {
            const newIndex = prev + 1;
            playRippleSound(newIndex);
            return newIndex;
          });
        }, delay);
        return () => clearTimeout(timer);
      }
    } else if (!isTodayGoalComplete) {
      setCollapsedYellowIndex(-1);
    }
  }, [isCollapsed, isTodayGoalComplete, collapsedYellowIndex, todayLessons.length]);

  const goalLessonIdSet = new Set(goalLessonIds);
  const goalModule = data.modules.find((m) => m.lessons.some((l) => goalLessonIdSet.has(l.id)));
  const goalModuleId = goalModule?.id;
  const goalIndices = goalModule
    ? goalModule.lessons
        .map((lesson, index) => (goalLessonIdSet.has(lesson.id) ? index : -1))
        .filter((index) => index >= 0)
    : [];
  const goalStartIndex = goalIndices.length ? Math.min(...goalIndices) : -1;
  const goalEndIndex = goalIndices.length ? Math.max(...goalIndices) + 1 : -1;
  
  // Calculate SC Reward for Today's goal
  const lastTodayLesson = todayLessons.length > 0 ? todayLessons[todayLessons.length - 1] : null;
  let todayScReward = 5;
  if (lastTodayLesson) {
    if (lastTodayLesson.type === ContentType.ASSIGNMENT || lastTodayLesson.type === ContentType.ASSESSMENT) {
        todayScReward = 10;
    } else if (lastTodayLesson.type === ContentType.PRACTICE || lastTodayLesson.type === ContentType.QUIZ) {
        todayScReward = 5;
    }
  }

  useEffect(() => {
    const activeModule = data.modules.find(m => m.lessons.some(l => l.id === activeLessonId));
    if (activeModule) {
        setExpandedModules(prev => {
            if (prev[activeModule.id]) return prev;
            return { ...prev, [activeModule.id]: true };
        });
        // Use setTimeout to ensure DOM is fully ready after module expansion
        // Skip scrolling when collapsed for prototype purposes
        if (!isCollapsed) {
            setTimeout(() => {
                const isInTodayGoal = todayLessons.some(l => l.id === activeLessonId);
                const activeIndex = todayLessons.findIndex(l => l.id === activeLessonId);
                
                if (isInTodayGoal && todayLessons.length > 0) {
                    // For later items (4th+), center them in view
                    if (activeIndex > 2) {
                        const targetId = `lesson-item-${activeLessonId}`;
                        const activeEl = document.getElementById(targetId);
                        if (activeEl) {
                            activeEl.scrollIntoView({ behavior: 'instant', block: 'center' });
                        }
                    } else {
                        // For first 3 items, scroll so goal items appear connected to sticky header
                        // Scroll to the today-goal-sticky container at 'start' position
                        // The scroll-margin-top on lesson items will account for sticky header
                        const todayGoalEl = document.getElementById('today-goal-sticky');
                        if (todayGoalEl) {
                            todayGoalEl.scrollIntoView({ behavior: 'instant', block: 'start' });
                        }
                    }
                } else {
                    // For lessons outside today's goal, scroll to show the active lesson
                    const targetId = `lesson-item-${activeLessonId}`;
                    const el = document.getElementById(targetId);
                    if (el) {
                        el.scrollIntoView({ behavior: 'instant', block: 'center' });
                    }
                }
            }, 100);
        }
    }
  }, [activeLessonId, data.modules, isCollapsed, todayLessons]);

  // When collapsed, scroll to today's goal section
  useEffect(() => {
    if (isCollapsed && todayLessons.length > 0) {
        // Small delay to ensure DOM is updated after collapse transition
        setTimeout(() => {
            const el = document.getElementById('today-goal-collapsed');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
  }, [isCollapsed, todayLessons]);

  return (
    <aside className={`flex-shrink-0 hidden md:flex flex-col h-full pb-4 pt-4 transition-all duration-300 ${isCollapsed ? 'w-[80px] pl-4 pr-4' : 'w-[400px] pl-6 pr-2'}`}>
      <div className="bg-[var(--cds-color-white)] rounded-2xl shadow-sm border border-[var(--cds-color-grey-100)] flex flex-col h-full overflow-hidden relative">
        
        {/* Collapse/Expand Button - In flow for collapsed, absolute for expanded */}
        {isCollapsed ? (
          <div className="shrink-0 flex flex-col items-center gap-2 py-3 border-b border-[var(--cds-color-grey-50)]">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-8 h-8 rounded-full bg-[var(--cds-color-grey-50)] hover:bg-[var(--cds-color-grey-100)] flex items-center justify-center transition-colors"
              title="Expand sidebar"
            >
              <Icons.ChevronDown className="w-4 h-4 text-[var(--cds-color-grey-600)] rotate-[-90deg]" />
            </button>
            
            {/* New Message Notification */}
            {hasUnreadMessage && (
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-2 bg-[var(--cds-color-yellow-50)] border border-[var(--cds-color-yellow-200)] rounded-lg flex flex-col items-center justify-center hover:bg-[var(--cds-color-yellow-100)] transition-colors cursor-pointer shadow-sm"
                title="New message - Click to expand"
              >
                <div className="relative">
                  <Icons.Coach className="w-5 h-5 text-[var(--cds-color-yellow-700)]" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--cds-color-yellow-700)] rounded-full animate-pulse"></div>
                </div>
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsCollapsed(true)}
            className="absolute top-3 right-3 z-40 w-7 h-7 rounded-full bg-[var(--cds-color-grey-50)] hover:bg-[var(--cds-color-grey-100)] flex items-center justify-center transition-colors"
            title="Collapse sidebar"
          >
            <Icons.ChevronDown className="w-4 h-4 text-[var(--cds-color-grey-600)] rotate-90" />
          </button>
        )}
        
        {/* Combined Top Header: Course Info + Today's Goal */}
        {!isCollapsed && (
          <div className="shrink-0 bg-[var(--cds-color-white)] border-b border-[var(--cds-color-grey-50)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.025)]">
              <div className="px-4 pt-4 pb-2 pr-12">
                  <h2 
                    className="text-base font-semibold mb-0 underline decoration-[var(--cds-color-grey-975)] cursor-pointer text-[var(--cds-color-grey-975)]"
                    style={{
                      textUnderlineOffset: '4px',
                      textDecorationThickness: 'auto'
                    }}
                  >
                      {data.title}
                  </h2>
              </div>
              {/* Today's Goal Card - now in header */}
              {todayLessons.length > 0 && goalModuleId && (
                <DailyGoalHeader 
                  title={todayGoalGroup.title}
                  skillText={todayGoalGroup.text}
                  skills={todayGoalGroup.skills}
                  lessons={todayLessons}
                  activeLessonId={activeLessonId}
                  shouldAnimate={shouldStartAnimation}
                  isSecondary={false}
                  customLabel={todayGoalGroup.customLabel}
                  scReward={todayScReward}
                  onTrackCareer={onTrackCareer}
                  onAdjustPlan={onAdjustPlan}
                  onTriggerTargetIcon={handleTriggerTargetIcon}
                  completedTexts={completedTexts}
                  onTextCompleted={handleTextCompleted}
                  dailyTimeGoal={dailyTimeGoal}
                  onShowDailyGoalProgress={onShowDailyGoalProgress}
                  dailyEarnedXP={dailyEarnedXP}
                  onShowSkillProgressModal={onShowSkillProgressModal}
                  onNavigateToMyLearning={onNavigateToMyLearning}
                  sessionTimeRemaining={sessionTimeRemaining}
                  isSessionPaused={isSessionPaused}
                  onPauseSession={onPauseSession}
                  onAddTime={onAddTime}
                />
              )}
          </div>
        )}

        <div className={`flex-1 overflow-y-auto custom-scrollbar ${isCollapsed ? 'pt-12' : ''}`}>
          {data.modules.map((module) => (
            <div key={module.id} className={`${isCollapsed ? '' : 'border-b border-[var(--cds-color-grey-50)] last:border-0'}`}>
              {!isCollapsed && (
                <button 
                  onClick={() => toggleModule(module.id)}
                  className={`w-full flex items-center justify-between pl-6 pr-4 py-3 transition-colors text-left group relative bg-[var(--cds-color-white)] hover:bg-[var(--cds-color-grey-25)]`}
                >
                  <p className="cds-body-tertiary font-semibold text-[var(--cds-color-grey-600)]">{module.id.replace('m','')}. {module.title}</p>
                  {expandedModules[module.id] ? (
                    <Icons.ChevronDown className="w-5 h-5 text-[var(--cds-color-grey-500)]" />
                  ) : (
                    <Icons.ChevronDown className="w-5 h-5 text-[var(--cds-color-grey-500)] -rotate-90" />
                  )}
                </button>
              )}

              {(expandedModules[module.id] || isCollapsed) && (
                <div className={`bg-[var(--cds-color-white)] ${isCollapsed ? 'pb-0' : 'pb-2'}`}>
                  {module.id === (goalModuleId || 'm1') ? (
                    <div className="flex flex-col">
                        {(() => {
                            const elements = [];
                            
                            // Get the goal group range
                            const isGoalModule = module.id === goalModuleId;
                            const goalStart = isGoalModule ? goalStartIndex : -1;
                            const goalEnd = isGoalModule ? goalEndIndex : -1;
                            
                            const hasGoalBlock = isGoalModule && goalStart >= 0 && goalEnd >= 0 && todayLessons.length > 0;

                            if (!hasGoalBlock) {
                              return module.lessons.map((lesson, index) => (
                                <LessonItem 
                                  key={lesson.id}
                                  lesson={lesson}
                                  index={index}
                                  isLast={index === module.lessons.length - 1}
                                  activeLessonId={activeLessonId}
                                  onSelectLesson={onSelectLesson}
                                  prevCompleted={index > 0 ? module.lessons[index - 1].status === Status.COMPLETED : true}
                                  variant="default"
                                  isCollapsed={isCollapsed}
                                />
                              ));
                            }

                            // 1. Render lessons BEFORE the goal block (index 0 to goalStart-1)
                            // Skip pre-goal lessons when sticky header is showing to avoid gap
                            // Pre-goal lessons are hidden when goal header is visible
                            if (isCollapsed) {
                                // Only show pre-goal lessons when collapsed (no sticky header)
                                for (let i = 0; i < goalStart && i < module.lessons.length; i++) {
                                    const lesson = module.lessons[i];
                                    elements.push(
                                        <LessonItem 
                                            key={lesson.id}
                                            lesson={lesson}
                                            index={i}
                                            isLast={false}
                                            activeLessonId={activeLessonId}
                                            onSelectLesson={onSelectLesson}
                                            prevCompleted={i > 0 ? module.lessons[i-1].status === Status.COMPLETED : true}
                                            variant="default"
                                            isCollapsed={isCollapsed}
                                        />
                                    );
                                }
                            }
                            
                            // 2. Render Today's Goal block (header stays sticky, items scroll)
                            if (hasGoalBlock) {
                                if (isCollapsed) {
                                    // Collapsed: Render today's goal items using GoalBoundaryContainer with ripple animation
                                    elements.push(
                                        <div key="today-goal-collapsed" id="today-goal-collapsed" className="flex flex-col items-center my-1">
                                            {/* Collapsed Timer Icons */}
                                            {sessionTimeRemaining !== undefined && onPauseSession && (
                                              <div className="flex flex-col items-center gap-1 mb-4">
                                                <Icons.Clock className="w-4 h-4 text-[var(--cds-color-grey-500)]" />
                                                <button
                                                  onClick={onPauseSession}
                                                  className="p-1 rounded-full hover:bg-[var(--cds-color-grey-50)] transition-colors"
                                                  title="Pause session"
                                                >
                                                  <Icons.Pause className="w-4 h-4 text-[var(--cds-color-grey-500)]" />
                                                </button>
                                              </div>
                                            )}
                                            <GoalBoundaryContainer itemCount={todayLessons.length} isCollapsed={true}>
                                                {todayLessons.map((lesson, idx) => {
                                                    const isActive = activeLessonId === lesson.id;
                                                    const isItemComplete = lesson.status === Status.COMPLETED;
                                                    // Use collapsedYellowIndex for ripple effect
                                                    const isItemYellow = isTodayGoalComplete && idx <= collapsedYellowIndex;
                                                    const showSparkEffect = isTodayGoalComplete && idx === collapsedYellowIndex;
                                                    
                                                    return (
                                                        <div 
                                                            key={lesson.id}
                                                            className="flex items-center justify-center cursor-pointer relative"
                                                            style={{ height: '40px' }}
                                                            onClick={() => !lesson.isLocked && onSelectLesson(lesson)}
                                                            title={lesson.title}
                                                        >
                                                            {lesson.isLocked ? (
                                                                <div className="w-5 h-5 rounded-full flex items-center justify-center border border-[var(--cds-color-grey-200)] bg-transparent">
                                                                    <Icons.Lock className="w-2.5 h-2.5 text-[var(--cds-color-grey-400)]" />
                                                                </div>
                                                            ) : isActive || lesson.status === Status.IN_PROGRESS ? (
                                                                <Icons.GoalActive className="w-5 h-5" />
                                                            ) : isItemComplete ? (
                                                                isItemYellow ? (
                                                                    <Icons.GoalCheckYellow className="w-5 h-5" />
                                                                ) : (
                                                                    <Icons.GoalCheckDark className="w-5 h-5" />
                                                                )
                                                            ) : lesson.status === Status.FAILED ? (
                                                                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--cds-color-red-700)]">
                                                                    <Icons.Failed className="w-2.5 h-2.5 text-white" />
                                                                </div>
                                                            ) : (
                                                                <Icons.GoalPending className="w-5 h-5" number={idx + 1} />
                                                            )}
                                                            {/* Spark effect when turning yellow */}
                                                            {showSparkEffect && (
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
                                                                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                                                                        <div 
                                                                            key={i}
                                                                            className="absolute w-1 h-1 bg-[var(--cds-color-yellow-200)] rounded-full animate-spark"
                                                                            style={{ 
                                                                                '--spark-angle': `${angle}deg`,
                                                                                transformOrigin: 'center center' 
                                                                            } as React.CSSProperties}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </GoalBoundaryContainer>
                                        </div>
                                    );
                                } else {
                                    // Expanded: Render full DailyGoalBlock (header is rendered separately as sticky)
                                    elements.push(
                                        <div key="today-goal-sticky" id="today-goal-sticky" style={{ scrollMarginTop: '200px' }}>
                                            <DailyGoalBlock 
                                                title={todayGoalGroup.title}
                                                skillText={todayGoalGroup.text}
                                                skills={todayGoalGroup.skills}
                                                lessons={todayLessons}
                                                startIndex={goalStart}
                                                activeLessonId={activeLessonId}
                                                onSelectLesson={onSelectLesson}
                                                shouldAnimate={shouldStartAnimation}
                                                isSecondary={false}
                                                customLabel={todayGoalGroup.customLabel}
                                                scReward={todayScReward}
                                                hideHeader={true}
                                                onTrackCareer={onTrackCareer}
                                                onAdjustPlan={onAdjustPlan}
                                                showTargetIconOnLessonId={showTargetIconOnLessonId || undefined}
                                                onTriggerTargetIcon={handleTriggerTargetIcon}
                                                isCollapsed={isCollapsed}
                                                completedTexts={completedTexts}
                                                onTextCompleted={handleTextCompleted}
                                                dailyTimeGoal={dailyTimeGoal}
                                                onShowDailyGoalProgress={onShowDailyGoalProgress}
                                                extendedLessonIds={extendedLessonIds}
                                                allModuleLessons={module.lessons}
                                            />
                                        </div>
                                    );
                                }
                            }
                            
                            // 3. Render lessons AFTER the goal block
                            // Items after the goal section always use 'default' variant (dark checkmarks when completed)
                            for (let i = goalEnd; i < module.lessons.length; i++) {
                                const lesson = module.lessons[i];

                                elements.push(
                                    <LessonItem 
                                        key={lesson.id}
                                        lesson={lesson}
                                        index={i}
                                        isLast={i === module.lessons.length - 1}
                                        activeLessonId={activeLessonId}
                                        onSelectLesson={onSelectLesson}
                                        prevCompleted={i > 0 ? module.lessons[i-1].status === Status.COMPLETED : true}
                                        variant="default"
                                        isTransition={false}
                                        isCollapsed={isCollapsed}
                                    />
                                );
                            }
                            
                            return elements;
                        })()}
                    </div>
                  ) : (
                    module.lessons.map((lesson, index) => (
                      <LessonItem 
                        key={lesson.id}
                        lesson={lesson} 
                        index={index} 
                        isLast={index === module.lessons.length - 1} 
                        activeLessonId={activeLessonId}
                        onSelectLesson={onSelectLesson}
                        prevCompleted={index > 0 ? module.lessons[index-1].status === Status.COMPLETED : true}
                        isCollapsed={isCollapsed}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
