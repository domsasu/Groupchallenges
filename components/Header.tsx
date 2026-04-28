import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { RollingCounter } from './RollingCounter';
import { useSiteVariant } from '../context/SiteVariantContext';
import { SITE_VARIANT_OPTIONS } from '../config/siteVariants';
import { joinedFeedCohortsHaveNewActivity } from '../constants/feedCohorts';

/** Views the header can navigate to via primary nav or user menu shortcuts. */
export type HeaderNavigateTarget = 'home' | 'dashboard' | 'feed';

interface HeaderProps {
  currentSP: number;
  dailyGoalSP: number;
  learningItemsCompleted: number;
  assignmentItemsCompleted: number;
  onDailyGoalComplete?: () => void;
  hideProgress?: boolean;
  backgroundColor?: string;
  showPartnerLogo?: boolean;
  onLogoClick?: () => void;
  isHomeView?: boolean;
  /** When true, show Explore + My Learning + Community in the desktop header (e.g. home, dashboard, feed, learning). */
  showPrimaryNavLinks?: boolean;
  onNavigate?: (view: HeaderNavigateTarget) => void;
  careerTitle?: string;
  /** Which primary surface is active for nav emphasis (My Learning / Community); use `home` when neither applies. */
  primaryNavView?: 'home' | 'dashboard' | 'feed';
}

export const Header: React.FC<HeaderProps> = ({ 
  currentSP, 
  dailyGoalSP,
  learningItemsCompleted,
  assignmentItemsCompleted,
  onDailyGoalComplete,
  hideProgress = false,
  backgroundColor = "bg-[var(--cds-color-grey-25)]",
  showPartnerLogo = true,
  onLogoClick,
  isHomeView = false,
  showPrimaryNavLinks = false,
  onNavigate,
  careerTitle,
  primaryNavView = 'home',
}) => {
  const { variant, setVariant } = useSiteVariant();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [animate, setAnimate] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const [sparkles, setSparkles] = useState<{id: number, style: React.CSSProperties}[]>([]);
  
  // Refs for tracking previous state
  const prevSPRef = useRef(currentSP);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State to ensure we only celebrate each milestone exactly once per session
  const [hasCelebratedFirstGoal, setHasCelebratedFirstGoal] = useState(false);
  const [hasCelebratedDailyGoal, setHasCelebratedDailyGoal] = useState(false);

  // Check if user has exceeded the goal
  const isOverAchieving = currentSP > dailyGoalSP;

  const showFeedNewActivityDot =
    showPrimaryNavLinks &&
    primaryNavView !== 'feed' &&
    joinedFeedCohortsHaveNewActivity();

  useEffect(() => {
    // Only run logic if SP has increased (progress made)
    if (currentSP > prevSPRef.current) {
      setAnimate(true);
      
      // Constants
      const firstGoalMilestone = 70; 
      const dailyGoalMilestone = dailyGoalSP; 

      // Check if we hit milestones exactly or passed them just now
      const crossedFirstGoal = prevSPRef.current < firstGoalMilestone && currentSP >= firstGoalMilestone;
      const crossedDailyGoal = prevSPRef.current < dailyGoalMilestone && currentSP >= dailyGoalMilestone;

      // Clear any existing dismiss timer to prevent premature closing
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }

      // Celebration Logic
      if (crossedFirstGoal && !hasCelebratedFirstGoal) {
        setCelebrationMessage("First daily goal complete!");
        setHasCelebratedFirstGoal(true);
        setIsExpanded(false); // Close dropdown
        
        // Auto-dismiss
        dismissTimerRef.current = setTimeout(() => setCelebrationMessage(null), 4000);

      } else if (crossedDailyGoal && !hasCelebratedDailyGoal) {
        setCelebrationMessage("All daily goals complete!");
        setHasCelebratedDailyGoal(true);
        setIsExpanded(false); // Close dropdown

        if (onDailyGoalComplete) {
          onDailyGoalComplete();
        }
        
        // Auto-dismiss
        dismissTimerRef.current = setTimeout(() => setCelebrationMessage(null), 4000);

      } else {
        // If we made progress but it wasn't a new milestone (e.g., 40 -> 50 XP),
        // we explicitly clear any lingering message so the user sees the new score.
        setCelebrationMessage(null);
      }

      // --- Sparkles Animation Logic ---
      const percentage = isOverAchieving 
        ? Math.min(100, ((currentSP - dailyGoalSP) / dailyGoalSP) * 100)
        : Math.min(100, (currentSP / dailyGoalSP) * 100);

      const newSparkles = Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * (360 / 16)) + (Math.random() * 20 - 10);
        const distance = 20 + Math.random() * 20;
        const tx = Math.cos(angle * Math.PI / 180) * distance;
        const ty = Math.sin(angle * Math.PI / 180) * distance;
        
        // Use exciting purple/pink colors if overachieving
        const colors = isOverAchieving 
            ? ['#A855F7', '#EC4899', '#6366F1'] 
            : ['#FFC936', '#F28100', '#0056D2'];
            
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 3 + Math.random() * 3;
        
        return {
          id: Date.now() + i,
          style: {
            '--tx': `${tx}px`,
            '--ty': `${ty}px`,
            backgroundColor: color,
            left: `${percentage}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDelay: `${Math.random() * 0.1}s` 
          } as React.CSSProperties
        };
      });
      setSparkles(newSparkles);

      // Cleanup animation states
      const t = setTimeout(() => setAnimate(false), 1000);
      const t2 = setTimeout(() => setSparkles([]), 1000);
      
      // Update the ref at the end of the effect
      prevSPRef.current = currentSP;

      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    } else {
      // If currentSP is not greater (e.g. equal on mount), just sync ref
      prevSPRef.current = currentSP;
    }

  }, [currentSP, dailyGoalSP, hasCelebratedFirstGoal, hasCelebratedDailyGoal, isOverAchieving, onDailyGoalComplete]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [userMenuOpen]);

  const learningGoalTarget = 7;
  const assignmentGoalTarget = 1;

  // Visual Calculation for Progress Bar
  const widthPercentage = isOverAchieving
    ? Math.min(100, ((currentSP - dailyGoalSP) / dailyGoalSP) * 100)
    : Math.min(100, (currentSP / dailyGoalSP) * 100);

  return (
    <header className={`${backgroundColor} sticky top-0 z-30 ${isHomeView ? 'border-b border-[var(--cds-color-grey-100)]/50' : ''}`}>
      <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-4 max-w-[1440px] mx-auto">

      {/* Left Section: Logo & Nav */}
      <div className="flex items-center gap-8 z-10">
        <div 
          className="flex items-center gap-3 headline-sm tracking-tight select-none cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onLogoClick}
        >
          <div className="md:hidden mr-1">
            <Icons.Menu className="w-6 h-6 text-[var(--cds-color-grey-600)]" />
          </div>
          <svg width="114" height="16" viewBox="0 0 114 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M37.2119 9.23926C37.2121 11.1935 38.303 12.3476 40.1973 12.3477C42.3165 12.3477 43.5352 11.0646 43.5352 8.59668V0.392578H47.4844V15.6162H43.5381V13.8525C42.6076 15.2947 41.0975 16 39.0107 16C35.479 16.001 33.2637 13.4368 33.2637 9.71875V0.392578H37.2119V9.23926ZM79.6289 0.104492C84.1244 0.11331 87.2958 3.7081 87.2852 7.94238C87.2859 8.36088 87.2535 8.77911 87.1875 9.19238L75.5645 9.1709C76.0101 10.9981 77.5168 12.3154 79.7969 12.3203C81.177 12.3203 82.6556 11.8123 83.5566 10.6602L86.25 12.8154C84.865 14.768 82.4215 15.918 79.8223 15.9131C75.2337 15.8973 71.7082 12.4614 71.7158 8.00684C71.7247 3.74409 74.7811 0.0958069 79.6289 0.104492ZM104.69 0.104492C107.098 0.104492 108.48 0.841292 109.41 2.25195L109.78 0.390625H113.392V15.6162H109.78L109.313 14.0488C108.254 15.2027 106.937 15.9102 104.69 15.9102C101.223 15.9051 97.2725 12.8599 97.2725 8.11719C97.2725 3.34205 101.158 0.104614 104.69 0.104492ZM23.7715 0.104492C28.2983 0.104492 31.8953 3.6316 31.8955 7.98828C31.8955 12.3148 28.2985 15.9053 23.7715 15.9053C19.276 15.9051 15.6807 12.3108 15.6807 7.98828C15.6809 3.62973 19.2762 0.10463 23.7715 0.104492ZM64.3838 0.0078125C66.93 0.0078125 69.1861 1.13385 70.4111 3.22461L66.9326 5.06152C66.4173 4.03193 65.4504 3.45227 64.2256 3.45215C63.034 3.45215 62.4522 3.87085 62.4521 4.57812C62.4521 6.95888 70.7676 5.44738 70.7676 11.1426C70.7675 14.1023 68.3508 15.9033 64.4512 15.9033C61.1315 15.9004 58.8106 14.8069 57.6514 12.2979L61.1621 10.4639C61.7422 11.7186 62.9021 12.4579 64.5459 12.458C66.0605 12.458 66.6406 11.9758 66.6406 11.2998C66.6396 8.85113 58.3265 10.3348 58.3262 4.73633C58.3262 1.64834 61.0329 0.00795633 64.3838 0.0078125ZM8.09082 0.0732422C9.44253 0.0637857 10.7759 0.389636 11.9697 1.02246C13.1635 1.65528 14.1806 2.57522 14.9297 3.69824L11.5586 5.64941C11.1686 5.09327 10.6497 4.63965 10.0459 4.32715C9.44201 4.01459 8.77107 3.85214 8.09082 3.85449C5.77935 3.85465 3.88477 5.77809 3.88477 7.98926C3.88481 10.2004 5.77938 12.1239 8.09082 12.124C8.80314 12.1286 9.50496 11.9505 10.1289 11.6074C10.7529 11.2644 11.2785 10.7675 11.6553 10.1641L14.9922 12.1514C14.2522 13.3071 13.2314 14.2574 12.0244 14.9131C10.8173 15.5689 9.46317 15.9086 8.08887 15.9014C3.59538 15.9051 4.75605e-05 12.3117 0 7.98926C0 3.59916 3.59535 0.0733919 8.09082 0.0732422ZM56.8994 3.67871C56.7652 3.66412 56.6301 3.65664 56.4951 3.65625C54.377 3.66124 53.1591 4.9462 53.165 7.41309L53.1865 15.6152L49.2373 15.624L49.2041 0.401367L53.1533 0.392578V2.15625C54.073 0.724053 55.5668 0.0166892 57.6279 0L56.8994 3.67871ZM96.5771 3.68555C96.4467 3.67282 96.3131 3.6631 96.1729 3.66309C94.0566 3.66309 92.835 4.94513 92.835 7.41309V15.6162H88.8867V0.391602H92.835V2.15527C93.7586 0.725841 95.2512 0.0215193 97.3096 0.0107422L96.5771 3.68555ZM23.7715 3.88672C21.4602 3.88686 19.5657 5.80962 19.5654 7.98828C19.5654 10.1995 21.46 12.1229 23.7715 12.123C26.1194 12.123 28.0098 10.1995 28.0098 7.98828C28.0095 5.80953 26.1153 3.88672 23.7715 3.88672ZM105.365 3.8877C104.246 3.89204 103.174 4.34075 102.386 5.13379C101.597 5.92687 101.157 6.99995 101.161 8.11719C101.161 10.2324 103.056 12.123 105.368 12.123C107.709 12.1229 109.602 10.2324 109.603 8.08496C109.598 6.96764 109.149 5.89738 108.354 5.11035C107.56 4.32345 106.485 3.88341 105.365 3.8877ZM79.5908 3.69434C77.7603 3.69436 76.2823 4.7781 75.7012 6.41113L83.3105 6.4248C83.0886 4.88672 81.4852 3.69728 79.5908 3.69434Z" fill="#0056D2"/>
</svg>

          {showPartnerLogo && !isHomeView && (
            <>
              <span className="h-5 w-px bg-[var(--cds-color-grey-400)]"></span>
              <div className="flex items-center gap-1">
                 <span className="text-[var(--cds-color-red-700)] headline-sm">Adobe</span>
              </div>
            </>
          )}
        </div>

        {/* Desktop primary nav (home-style surfaces + learning) */}
        {showPrimaryNavLinks && (
          <div className="hidden md:flex items-center gap-6">
            <button
              type="button"
              className="flex items-center gap-1 cds-body-secondary text-[var(--cds-color-grey-700)] hover:text-[var(--cds-color-blue-700)] transition-colors"
            >
              Explore
              <Icons.ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={`cds-body-secondary transition-colors ${
                primaryNavView === 'dashboard'
                  ? 'text-[var(--cds-color-blue-700)] font-semibold'
                  : 'text-[var(--cds-color-grey-700)] hover:text-[var(--cds-color-blue-700)]'
              }`}
              aria-current={primaryNavView === 'dashboard' ? 'page' : undefined}
              onClick={() => onNavigate?.('dashboard')}
            >
              My Learning
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 cds-body-secondary transition-colors ${
                primaryNavView === 'feed'
                  ? 'text-[var(--cds-color-blue-700)] font-semibold'
                  : 'text-[var(--cds-color-grey-700)] hover:text-[var(--cds-color-blue-700)]'
              }`}
              aria-current={primaryNavView === 'feed' ? 'page' : undefined}
              aria-label={showFeedNewActivityDot ? 'Challenge, new activity in your cohorts' : undefined}
              onClick={() => onNavigate?.('feed')}
            >
              Challenge
              {showFeedNewActivityDot ? (
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[var(--cds-color-blue-700)] animate-header-activity-dot-glow"
                  title="New activity in your cohorts"
                  aria-hidden
                />
              ) : null}
            </button>
          </div>
        )}
      </div>

      {/* Center Section: Search or Progress */}
      <div className="flex-1 flex justify-start pl-0 pr-8 max-w-3xl ml-[50pt]">
        {isHomeView ? (
           <div className="w-full max-w-2xl relative hidden md:block">
              <input 
                type="text" 
                placeholder="What do you want to learn?"
                className="w-full h-11 pl-5 pr-12 rounded-full border border-[var(--cds-color-grey-200)] text-m focus:outline-none focus:border-[#0056D2]"
              />
              <button className="absolute right-1 top-1 h-9 w-9 bg-[var(--cds-color-blue-700)] rounded-full flex items-center justify-center text-[var(--cds-color-white)] hover:bg-[var(--cds-color-blue-800)] transition-colors">
                <Icons.Search className="w-4 h-4" />
              </button>
           </div>
        ) : (
           !hideProgress && (
            <div className="relative z-40 hidden lg:flex flex-col items-center">
              {/* Trigger Button */}
              <button 
                className={`
                  relative z-20 flex items-center px-4 py-2 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] border transition-all duration-200 cursor-pointer bg-[var(--cds-color-white)] hover:bg-[var(--cds-color-grey-25)]
                  ${celebrationMessage 
                    ? 'border-[#FFC936] ring-2 ring-[#FFC936]/20' 
                    : 'border-[var(--cds-color-grey-100)]/80'
                  }
                `}
                onClick={() => !celebrationMessage && setIsExpanded(!isExpanded)}
              >
                  {/* Coin Anchor */}
                  <div className={`
                      shrink-0 mr-3 transition-transform duration-500 ease-out
                      ${animate && !celebrationMessage ? 'scale-110 rotate-12' : 'scale-100'}
                  `}>
                    <Icons.Coin className={celebrationMessage ? 'animate-coin-flip' : ''} />
                  </div>

                  {/* Content Area */}
                  <div className="relative h-6 flex items-center justify-start">
                      {celebrationMessage ? (
                        <div className="flex items-center animate-fade-in whitespace-nowrap pr-2">
                            <span className="cds-subtitle-medium text-[var(--cds-color-grey-975)] tracking-tight">
                              {celebrationMessage}
                            </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 animate-fade-in">
                          <span className={`cds-subtitle-medium text-[var(--cds-color-grey-900)] leading-none transition-colors duration-300 ${animate ? 'text-[var(--cds-color-yellow-700)]' : ''} whitespace-nowrap flex items-baseline`}>
                            <RollingCounter value={currentSP} startFromZero /> 
                            <span className="cds-body-tertiary text-[var(--cds-color-grey-400)] ml-1">/ {dailyGoalSP} XP</span>
                          </span>
                          
                          {/* Progress Bar Container */}
                          <div 
                            className={`
                              w-48 h-2.5 rounded-full relative overflow-hidden transition-colors duration-500
                              ${isOverAchieving 
                                ? 'bg-gradient-to-r from-[#FFC936] to-[#F28100]' // "Gold" base when overachieving
                                : 'bg-[var(--cds-color-grey-50)]' // Gray base normally
                              }
                            `}
                          >
                              {/* Progress Bar Fill */}
                              <div 
                                className={`h-full rounded-full relative transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                  ${isOverAchieving 
                                      ? 'bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#F472B6]' // Purple/Pink fill
                                      : 'bg-gradient-to-r from-[#FFC936] to-[#F28100]' // Gold/Orange fill
                                  }
                                `}
                                style={{ width: `${widthPercentage}%` }}
                              >
                                <div className="absolute top-0 left-0 w-full h-full bg-white/30 animate-pulse rounded-full"></div>
                              </div>
                              
                              {sparkles.map((s) => (
                                <div key={s.id} className="sparkle" style={s.style} />
                              ))}
                          </div>
                          
                          <div className="ml-1">
                            <Icons.ChevronDown className={`w-4 h-4 text-[var(--cds-color-grey-400)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      )}
                  </div>
              </button>

              {/* Dropdown Menu - Separated Card */}
              {isExpanded && !celebrationMessage && (
                <div className="absolute top-full mt-3 w-[380px] bg-[var(--cds-color-white)] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[var(--cds-color-grey-50)] p-5 z-10 animate-dropdown-enter origin-top">
                  
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="cds-body-tertiary font-semibold text-[var(--cds-color-grey-400)] uppercase tracking-wider">Daily Goals</h3>
                      <span className="cds-body-tertiary font-semibold text-[var(--cds-color-grey-400)]">{currentSP} / {dailyGoalSP} XP</span>
                  </div>

                  {/* Goal 1: Learning Items */}
                  <div className="flex items-start gap-3 mb-5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${learningItemsCompleted >= learningGoalTarget ? 'bg-[var(--cds-color-blue-700)] text-[var(--cds-color-white)] shadow-sm' : 'border-2 border-[var(--cds-color-grey-100)]'}`}>
                      {learningItemsCompleted >= learningGoalTarget && <Icons.Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <p className={`cds-body-secondary font-medium ${learningItemsCompleted >= learningGoalTarget ? 'text-[var(--cds-color-grey-975)]' : 'text-[var(--cds-color-grey-900)]'}`}>
                          Complete {learningGoalTarget} learning items
                        </p>
                        {learningItemsCompleted >= learningGoalTarget ? (
                          <span className="cds-body-tertiary font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                              Completed
                          </span>
                        ) : (
                          <span className="cds-body-tertiary font-semibold px-2 py-0.5 rounded-full bg-[var(--cds-color-yellow-50)] text-[var(--cds-color-yellow-700)] whitespace-nowrap">
                              70 XP
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-[var(--cds-color-grey-50)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--cds-color-blue-700)] transition-all duration-700 ease-out"
                          style={{ width: `${Math.min(100, (learningItemsCompleted / learningGoalTarget) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Goal 2: Practice Assignment */}
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${assignmentItemsCompleted >= assignmentGoalTarget ? 'bg-[var(--cds-color-blue-700)] text-[var(--cds-color-white)] shadow-sm' : 'border-2 border-[var(--cds-color-grey-100)]'}`}>
                      {assignmentItemsCompleted >= assignmentGoalTarget && <Icons.Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <p className={`cds-body-secondary font-medium ${assignmentItemsCompleted >= assignmentGoalTarget ? 'text-[var(--cds-color-grey-975)]' : 'text-[var(--cds-color-grey-900)]'}`}>
                          Complete an assignment
                        </p>
                        {assignmentItemsCompleted >= assignmentGoalTarget ? (
                          <span className="cds-body-tertiary font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                              Completed
                          </span>
                        ) : (
                          <span className="cds-body-tertiary font-semibold px-2 py-0.5 rounded-full bg-[var(--cds-color-yellow-50)] text-[var(--cds-color-yellow-700)] whitespace-nowrap">
                              50 XP
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-[var(--cds-color-grey-50)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--cds-color-blue-700)] transition-all duration-700 ease-out"
                          style={{ width: `${Math.min(100, (assignmentItemsCompleted / assignmentGoalTarget) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom text if overachieving */}
                  {isOverAchieving && (
                      <div className="mt-5 pt-4 border-t border-[var(--cds-color-grey-50)] text-center">
                          <p className="body-sm-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                              ✨ Outstanding work! You're on fire today!
                          </p>
                      </div>
                  )}

                </div>
              )}
            </div>
           )
        )}
      </div>

      {/* Right User/Actions */}
      <div className="flex items-center gap-5 z-10">
        {isHomeView && careerTitle && (
          <button
            type="button"
            onClick={() => onNavigate?.('dashboard')}
            className="cds-body-secondary text-[var(--cds-color-grey-700)] mr-2 text-left hover:text-[var(--cds-color-blue-700)] hover:underline cursor-pointer transition-colors"
          >
            Career goal: <span className="underline">{careerTitle}</span>
          </button>
        )}
        {isHomeView && (
          <div className="flex items-center gap-4 text-[var(--cds-color-grey-500)] mr-2">
             <Icons.Globe className="w-5 h-5 cursor-pointer hover:text-[var(--cds-color-grey-975)]" />
             <Icons.Bell className="w-5 h-5 cursor-pointer hover:text-[var(--cds-color-grey-975)]" />
          </div>
        )}
        
        <div className={`flex items-center gap-4 ${!isHomeView ? ' border-[var(--cds-color-grey-100)] pl-4' : ''} h-8`}>
            {!isHomeView && (
              <>
                <button className="text-[var(--cds-color-grey-500)] hover:text-[var(--cds-color-grey-700)] transition-colors">
                <Icons.Help className="w-5 h-5" />
                </button>
                <button className="text-[var(--cds-color-grey-500)] hover:text-[var(--cds-color-grey-700)] transition-colors">
                <Icons.Globe className="w-5 h-5" />
                </button>
              </>
            )}
            <div className="relative flex items-center" ref={userMenuRef}>
              <button
                type="button"
                className="text-[var(--cds-color-grey-500)] hover:text-[var(--cds-color-grey-700)] transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-controls="site-variant-menu"
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <Icons.User />
              </button>
              {userMenuOpen ? (
                <div
                  id="site-variant-menu"
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 top-full mt-2 min-w-[14rem] rounded-xl border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] py-1 shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50"
                >
                  <p className="px-3 py-2 cds-body-tertiary text-[var(--cds-color-grey-500)] uppercase tracking-wide text-xs">
                    Site version
                  </p>
                  {SITE_VARIANT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={variant === opt.id}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left cds-body-secondary text-[var(--cds-color-grey-900)] hover:bg-[var(--cds-color-grey-50)]"
                      onClick={() => {
                        setVariant(opt.id);
                        setUserMenuOpen(false);
                      }}
                    >
                      {variant === opt.id ? (
                        <Icons.Check className="h-4 w-4 shrink-0 text-[var(--cds-color-blue-700)]" strokeWidth={2.5} />
                      ) : (
                        <span className="h-4 w-4 shrink-0" aria-hidden />
                      )}
                      {opt.label}
                    </button>
                  ))}
                  <div className="my-1 border-t border-[var(--cds-color-grey-100)]" role="separator" />
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center px-3 py-2 text-left cds-body-secondary text-[var(--cds-color-grey-900)] hover:bg-[var(--cds-color-grey-50)]"
                    onClick={() => {
                      onNavigate?.('dashboard');
                      setUserMenuOpen(false);
                    }}
                  >
                    My Learning
                  </button>
                </div>
              ) : null}
            </div>
        </div>
      </div>
      </div>
    </header>
  );
};
