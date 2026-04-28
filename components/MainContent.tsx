

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, ContentType, Status } from '../types';
import { Icons } from './Icons';
import { Coach } from './Coach';
import { Toolbar } from './Toolbar';
import { getSkillPoints, getLessonSkillTags } from '../skills';
import { getAssignmentSummary } from '../services/geminiService';
import { RollingCounter } from './RollingCounter';

interface MainContentProps {
  activeLesson: Lesson;
  onNext: () => void;
  onMarkComplete?: () => void;
  onTakeAssessment?: () => void;
  onViewSkillProgress?: () => void;
  showSkillProgressView?: boolean;
  onBackFromSkillProgress?: () => void;
  onResultsNextItem?: () => void;
  nextLesson?: Lesson | null;
  currentLessonIndex?: number;
  totalLessonsInGoal?: number;
  /** When true and active lesson is video, auto-play the video (e.g. after "Continue watching" on home) */
  autoPlayVideoOnMount?: boolean;
  /** Called once auto-play has been triggered so parent can clear the flag */
  onConsumedAutoPlay?: () => void;
}

const playRetroCoinSound = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    
    const playSound = () => {
      const now = ctx.currentTime;
      
      // Beat 1: Starting note (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 659; // E5
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.07, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Beat 2: Middle note (G5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 784; // G5
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      const start2 = now + 0.08;
      gain2.gain.setValueAtTime(0, start2);
      gain2.gain.linearRampToValueAtTime(0.08, start2 + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.001, start2 + 0.12);
      
      osc2.start(start2);
      osc2.stop(start2 + 0.15);

      // Beat 3: High note (C6) - the final uptick
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.value = 1047; // C6
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      
      const start3 = now + 0.16;
      gain3.gain.setValueAtTime(0, start3);
      gain3.gain.linearRampToValueAtTime(0.1, start3 + 0.015);
      gain3.gain.exponentialRampToValueAtTime(0.001, start3 + 0.2);
      
      osc3.start(start3);
      osc3.stop(start3 + 0.25);
    };
    
    // Handle browser autoplay policy - resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume().then(playSound);
    } else {
      playSound();
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

const playCelebrationTune = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    try {
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        
        // Melody: C5, E5, G5, C6 (Celebratory Arpeggio)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + (i * 0.15));
            
            gain.gain.setValueAtTime(0, now + (i * 0.15));
            gain.gain.linearRampToValueAtTime(0.1, now + (i * 0.15) + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.15) + 0.8);
            
            osc.start(now + (i * 0.15));
            osc.stop(now + (i * 0.15) + 1.0);
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
            gain.gain.linearRampToValueAtTime(0.05, now + 0.5);
            gain.gain.linearRampToValueAtTime(0, now + 2.0);
            
            osc.start(now);
            osc.stop(now + 2.0);
        });

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

const playWhooSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;
    
    // Helper for soft synth pad tone
    const createSynthPad = (time: number, freq: number, duration: number, volume: number) => {
      const osc = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.type = 'sine';
      osc2.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 2, time); // Octave up for shimmer
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, time);
      filter.Q.value = 1;
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.08);
      gain.gain.setValueAtTime(volume * 0.7, time + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.start(time);
      osc2.start(time);
      osc.stop(time + duration);
      osc2.stop(time + duration);
    };
    
    // Helper for flute-like tone (pure sine with gentle attack)
    const createFlute = (time: number, freq: number, duration: number, volume: number) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const vibrato = audioContext.createOscillator();
      const vibratoGain = audioContext.createGain();
      
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      // Gentle vibrato
      vibrato.type = 'sine';
      vibrato.frequency.value = 5;
      vibratoGain.gain.value = 3;
      
      // Soft attack and release
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.1);
      gain.gain.setValueAtTime(volume * 0.8, time + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      vibrato.start(time);
      osc.start(time);
      vibrato.stop(time + duration);
      osc.stop(time + duration);
    };
    
    // Pleasant synth + flute celebration melody (~2.2 seconds)
    // Soft synth pad foundation - extended
    createSynthPad(now, 262, 2.2, 0.04); // C4 pad
    createSynthPad(now, 392, 2.2, 0.03); // G4 pad
    
    // Flute melody - ascending celebratory phrase
    createFlute(now, 523, 0.35, 0.06);        // C5
    createFlute(now + 0.3, 659, 0.35, 0.07);  // E5
    createFlute(now + 0.6, 784, 0.35, 0.08);  // G5
    createFlute(now + 0.9, 1047, 0.6, 0.09);  // C6 - held note
    
    // Second phrase - gentle descending resolution
    createFlute(now + 1.3, 988, 0.3, 0.07);   // B5
    createFlute(now + 1.5, 784, 0.4, 0.08);   // G5
    createFlute(now + 1.8, 1047, 0.5, 0.09);  // C6 - final note
    
    // Final shimmer chord
    createSynthPad(now + 1.6, 523, 0.7, 0.05); // C5
    createSynthPad(now + 1.6, 659, 0.7, 0.04); // E5
    createSynthPad(now + 1.6, 784, 0.7, 0.04); // G5
    
  } catch (e) {
    // Silent fail
  }
};

export const MainContent: React.FC<MainContentProps> = ({ activeLesson, onNext, onMarkComplete, onTakeAssessment, onViewSkillProgress, showSkillProgressView = false, onBackFromSkillProgress, onResultsNextItem, nextLesson, currentLessonIndex = 1, totalLessonsInGoal = 8, autoPlayVideoOnMount = false, onConsumedAutoPlay }) => {
  const isReading = activeLesson.type === ContentType.READING;
  const isAssignmentView = activeLesson.type === ContentType.ASSIGNMENT || activeLesson.type === ContentType.PRACTICE;
  
  // Video end modal states
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [showVideoEndModal, setShowVideoEndModal] = useState(false);
  const [videoEndCountdown, setVideoEndCountdown] = useState(5);
  const [isCountdownPaused, setIsCountdownPaused] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldAutoplayNextVideo, setShouldAutoplayNextVideo] = useState(false);
  const [animatedItemCount, setAnimatedItemCount] = useState(0);
  const videoEndModalTriggeredRef = useRef(false); // Prevent duplicate modal triggers
  const lastModalTriggerTimeRef = useRef(0); // Timestamp of last trigger for debouncing

  // When user came from "Continue watching" on home, auto-play the video on this page
  useEffect(() => {
    if (autoPlayVideoOnMount && activeLesson.type === ContentType.VIDEO) {
      setShouldAutoplayNextVideo(true);
      onConsumedAutoPlay?.();
    }
  }, [autoPlayVideoOnMount, activeLesson.type, activeLesson.id, onConsumedAutoPlay]);

  const [summarySkills, setSummarySkills] = useState<string[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(activeLesson.status === Status.COMPLETED);
  const [showOtherSkills, setShowOtherSkills] = useState(false);

  // Animation states for skill verification
  const [skillsData, setSkillsData] = useState([
    { name: "Prepare Datasets in Power BI", score: 8, total: 10, coins: 0 },
    { name: "Connecting and Importing Data", score: 0, total: 10, coins: 2 },
    { name: "Preparing and Cleaning Data", score: 4, total: 15, coins: 3 },
    { name: "Visualizing and Reporting Clean Data", score: 0, total: 15, coins: 0 }
  ]);
  const [skillCategoryTotal, setSkillCategoryTotal] = useState(12);
  const [activeSkillAnim, setActiveSkillAnim] = useState<number | null>(null);
  const [completedAnimations, setCompletedAnimations] = useState<{[key: number]: number}>({});
  
  // New States for Mastery Logic
  const [sparkActiveIndex, setSparkActiveIndex] = useState<number | null>(null);
  const [showMasteryMessage, setShowMasteryMessage] = useState(false);
  
  // Skill progress animation state (for completion page)
  const [showSkillGain, setShowSkillGain] = useState(false);
  const [showPreparingCleaningGain, setShowPreparingCleaningGain] = useState(false);
  const [showVisualizingGain, setShowVisualizingGain] = useState(false);
  
  // Skill mastery modal is now controlled by App.tsx
  
  // Quiz loading screen state
  const [showQuizLoading, setShowQuizLoading] = useState(false);
  
  // New animated progress bar states (similar to SkillMasteryModal)
  const [showSkillProgressSection, setShowSkillProgressSection] = useState(false);
  const [skillsAnimated, setSkillsAnimated] = useState([false, false, false, false]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Practicing');
  const [displayedTotalPoints, setDisplayedTotalPoints] = useState(0);
  const [showPreparingGainBadge, setShowPreparingGainBadge] = useState(false);
  const [showVisualizingGainBadge, setShowVisualizingGainBadge] = useState(false);
  const [hasPlayedWhooSound, setHasPlayedWhooSound] = useState(false);
  const [highlightPreparing, setHighlightPreparing] = useState(false);
  const [highlightVisualizing, setHighlightVisualizing] = useState(false);
  const [xpDropAnimating, setXpDropAnimating] = useState<'preparing' | 'visualizing' | null>(null);
  const [xpAllocationComplete, setXpAllocationComplete] = useState(false);
  
  // New states for XP cards animation
  const [showXpCards, setShowXpCards] = useState(false);
  const [preparingCardFlying, setPreparingCardFlying] = useState(false);
  const [visualizingCardFlying, setVisualizingCardFlying] = useState(false);
  const [preparingCardGone, setPreparingCardGone] = useState(false);
  const [visualizingCardGone, setVisualizingCardGone] = useState(false);
  const [showProgressBarSection, setShowProgressBarSection] = useState(false);
  const [showSkillsList, setShowSkillsList] = useState(false);
  
  // XP badge incremental states
  const [showXpBadge, setShowXpBadge] = useState(false);
  const [currentXpBadgeValue, setCurrentXpBadgeValue] = useState(0);
  const [badgePulse, setBadgePulse] = useState(false);
  
  // Get the actual XP reward for this lesson type
  const lessonXpReward = getSkillPoints(activeLesson.type);
  
  // Get the actual skill tags for this lesson
  const lessonSkillTags = getLessonSkillTags(activeLesson.id);
  const activeSkillTags = lessonSkillTags.length > 0 
    ? lessonSkillTags 
    : ["Visualizing and Reporting Clean Data"];
  
  // Skills data for the animated progress section
  // Dynamic: Uses the lesson's actual skill tags and XP reward
  // Base points represent early-stage learning progress
  const progressSkills = [
    { 
      name: "Visualizing and Reporting Clean Data", 
      basePoints: 3, 
      points: activeSkillTags.includes("Visualizing and Reporting Clean Data") ? 3 + lessonXpReward : 3, 
      total: 25, 
      xpGain: activeSkillTags.includes("Visualizing and Reporting Clean Data") ? lessonXpReward : 0 
    },
  ];
  const maxProgressPoints = 25; // Single skill total
  const totalXpReward = lessonXpReward;
  const baseTotal = 3; // Starting total before XP gains

  useEffect(() => {
    setHasSubmitted(activeLesson.status === Status.COMPLETED);
    // Reset skill gain animation when lesson changes
    setShowSkillGain(false);
    setShowPreparingCleaningGain(false);
    setShowVisualizingGain(false);
    // Reset new animated progress states
    setShowSkillProgressSection(false);
    setSkillsAnimated([false, false, false, false]);
    setProgressPercent(0);
    setProgressLabel('Practicing');
    setDisplayedTotalPoints(0);
    setShowPreparingGainBadge(false);
    setShowVisualizingGainBadge(false);
    setHasPlayedWhooSound(false);
    setHighlightPreparing(false);
    setHighlightVisualizing(false);
    setXpDropAnimating(null);
    setXpAllocationComplete(false);
    // Reset new XP card states
    setShowXpCards(false);
    setPreparingCardFlying(false);
    setVisualizingCardFlying(false);
    setPreparingCardGone(false);
    setVisualizingCardGone(false);
    setShowProgressBarSection(false);
    setShowSkillsList(false);
    // Reset XP badge states
    setShowXpBadge(false);
    setCurrentXpBadgeValue(0);
    setBadgePulse(false);
    // Reset video end modal states
    setShowVideoEndModal(false);
    setVideoEndCountdown(5);
    setIsCountdownPaused(false);
    videoEndModalTriggeredRef.current = false; // Reset the trigger flag
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, [activeLesson.id, activeLesson.status]);

  // Helper to show the video end modal (prevents duplicate triggers)
  const triggerVideoEndModal = useCallback(() => {
    const now = Date.now();
    // Debounce: don't trigger if triggered within last 2 seconds
    if (now - lastModalTriggerTimeRef.current < 2000) return;
    if (videoEndModalTriggeredRef.current || showVideoEndModal) return; // Already triggered or showing
    
    videoEndModalTriggeredRef.current = true;
    lastModalTriggerTimeRef.current = now;
    
    setShowVideoEndModal(true);
    setVideoEndCountdown(5);
    setIsCountdownPaused(false);
    playRetroCoinSound();
  }, [showVideoEndModal]);

  // Video end handler - shows modal when video ends
  const handleVideoEnded = useCallback(() => {
    // Multiple guards to prevent duplicate triggers
    const now = Date.now();
    if (now - lastModalTriggerTimeRef.current < 2000) return;
    if (videoEndModalTriggeredRef.current) return;
    if (showVideoEndModal) return;
    if (!nextLesson) return;
    
    // Exit fullscreen first if active, then show modal
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        triggerVideoEndModal();
      }).catch(() => {
        triggerVideoEndModal();
      });
    } else {
      triggerVideoEndModal();
    }
  }, [nextLesson, triggerVideoEndModal, showVideoEndModal]);

  // Countdown effect for video end modal
  useEffect(() => {
    if (showVideoEndModal && !isCountdownPaused && videoEndCountdown > 0) {
      const intervalId = setInterval(() => {
        setVideoEndCountdown(prev => prev - 1);
      }, 1000);
      countdownIntervalRef.current = intervalId;
      
      return () => {
        clearInterval(intervalId);
        countdownIntervalRef.current = null;
      };
    }
  }, [showVideoEndModal, isCountdownPaused, videoEndCountdown]);

  // Handle countdown reaching zero - separate effect for cleaner logic
  useEffect(() => {
    if (showVideoEndModal && videoEndCountdown <= 0) {
      // Clear the interval first
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      // Auto-progress to next item
      setShowVideoEndModal(false);
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      // If next lesson is a video, set autoplay flag
      if (nextLesson?.type === ContentType.VIDEO) {
        setShouldAutoplayNextVideo(true);
      }
      onNext();
    }
  }, [showVideoEndModal, videoEndCountdown, nextLesson, onNext]);

  // Handle starting immediately (skip countdown)
  const handleStartNow = useCallback(() => {
    // Clear the interval first
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    setShowVideoEndModal(false);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    // If next lesson is a video, set autoplay flag
    if (nextLesson?.type === ContentType.VIDEO) {
      setShouldAutoplayNextVideo(true);
    }
    onNext();
  }, [onNext, nextLesson]);

  // Handle pausing/resuming countdown
  const handleTogglePause = useCallback(() => {
    setIsCountdownPaused(prev => !prev);
  }, []);

  // Animate item count when modal appears
  useEffect(() => {
    if (showVideoEndModal) {
      // Start from previous count (current - 1, minimum 0)
      const startCount = Math.max(0, currentLessonIndex - 1);
      setAnimatedItemCount(startCount);
      
      // Animate to current count after a short delay
      const timer = setTimeout(() => {
        setAnimatedItemCount(currentLessonIndex);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [showVideoEndModal, currentLessonIndex]);

  // Autoplay next video if coming from video completion modal
  useEffect(() => {
    if (shouldAutoplayNextVideo && activeLesson.type === ContentType.VIDEO && videoRef.current) {
      const video = videoRef.current;
      
      // Wait for video to be ready before playing
      const handleCanPlay = () => {
        video.play().catch(() => {
          // Autoplay might be blocked by browser, silently fail
        });
        setShouldAutoplayNextVideo(false);
        video.removeEventListener('canplay', handleCanPlay);
      };
      
      // Check if video is already ready
      if (video.readyState >= 3) {
        video.play().catch(() => {});
        setShouldAutoplayNextVideo(false);
      } else {
        video.addEventListener('canplay', handleCanPlay);
        return () => video.removeEventListener('canplay', handleCanPlay);
      }
    }
  }, [shouldAutoplayNextVideo, activeLesson.type, activeLesson.id]);

  useEffect(() => {
      if (activeLesson.status === Status.COMPLETED && isAssignmentView) {
          // Play celebration tune when the completed assignment view loads
          playCelebrationTune();
          
          // Wait for sidebar animations (green to orange + "You did it" + typewriter text) to complete
          // Sidebar takes: 5000ms (ripple) + 1500ms (typewriter) + 2000ms (buffer after text)
          const sidebarAnimationDelay = 8500;
          
          // Show skill progress section after sidebar animations
          const showSectionTimer = setTimeout(() => {
              setShowSkillProgressSection(true);
              
              // PHASE 1: Show progress bar first with base value
              setTimeout(() => {
                  setShowProgressBarSection(true);
                  const basePercent = (baseTotal / maxProgressPoints) * 100;
                  setProgressPercent(basePercent);
                  setDisplayedTotalPoints(baseTotal);
                  setProgressLabel('Practicing');
              }, 300);
              
              // PHASE 2: Show XP Card below the progress bar
              setTimeout(() => {
                  setShowXpCards(true);
              }, 800);
              
              // PHASE 3: Card flies into progress bar
              setTimeout(() => {
                  setVisualizingCardFlying(true);
                  
                  // Show XP badge when card reaches destination (at 70% of animation)
                  setTimeout(() => {
                      setShowXpBadge(true);
                      setCurrentXpBadgeValue(lessonXpReward);
                      setBadgePulse(true);
                      setTimeout(() => setBadgePulse(false), 300);
                  }, 630);
                  
                  // After card flies (animation is 0.9s), increment progress bar
                  setTimeout(() => {
                      setVisualizingCardGone(true);
                      
                      // Animate from base to base + XP reward
                      const finalPoints = baseTotal + lessonXpReward;
                      const steps = 8;
                      const stepDuration = 80;
                      let currentStep = 0;
                      let currentPoints = baseTotal;
                      
                      const timer1 = setInterval(() => {
                          currentStep++;
                          currentPoints = baseTotal + (lessonXpReward * currentStep / steps);
                          const newPercent = (currentPoints / maxProgressPoints) * 100;
                          
                          setProgressPercent(newPercent);
                          setDisplayedTotalPoints(Math.round(currentPoints));
                          
                          if (currentStep % 2 === 0) {
                              playFillingSound(newPercent);
                          }
                          
                          // Check for level thresholds
                          if (newPercent >= 88 && !hasPlayedWhooSound) {
                              setProgressLabel('Comprehending');
                              playWhooSound();
                              setHasPlayedWhooSound(true);
                          } else if (newPercent >= 33.33) {
                              setProgressLabel('Developing');
                          }
                          
                          if (currentStep >= steps) {
                              clearInterval(timer1);
                              setProgressPercent((finalPoints / maxProgressPoints) * 100);
                              setDisplayedTotalPoints(finalPoints);
                              setXpAllocationComplete(true);
                          }
                      }, stepDuration);
                  }, 950); // Wait for 0.9s animation to complete
              }, 2000);
              
              // PHASE 4: After card animation, show skill list with XP badge
              setTimeout(() => {
                  setShowSkillsList(true);
                  setSkillsAnimated([true]);
                  setShowVisualizingGainBadge(true);
                  // Modal now only shows when user clicks "Next item"
              }, 4500); // 2 seconds after card animation completes
              
          }, sidebarAnimationDelay);
          
          return () => {
              clearTimeout(showSectionTimer);
          };
      }
  }, [activeLesson.status, isAssignmentView]);

  // When showSkillProgressView becomes true, immediately show final animation state
  useEffect(() => {
    if (showSkillProgressView && isAssignmentView) {
      // Skip all animations and show final state
      setShowSkillProgressSection(true);
      setShowProgressBarSection(true);
      setProgressPercent(100);
      setDisplayedTotalPoints(100);
      setProgressLabel('Comprehending');
      setShowXpBadge(true);
      setCurrentXpBadgeValue(15);
      setPreparingCardGone(true);
      setVisualizingCardGone(true);
      setShowSkillsList(true);
      setSkillsAnimated([true, true, true, true]);
      setShowPreparingGainBadge(true);
      setShowVisualizingGainBadge(true);
      setXpAllocationComplete(true);
    }
  }, [showSkillProgressView, isAssignmentView]);

  useEffect(() => {
    if (hasSubmitted && isAssignmentView) {
        // Define animation scenarios based on lesson ID
        let scenario = null;
        
        if (activeLesson.id === 'm1-l10') {
            scenario = {
                initial: [
                    { name: "Prepare Datasets in Power BI", score: 8, total: 10, coins: 0 },
                    { name: "Connecting and Importing Data", score: 0, total: 10, coins: 2 },
                    { name: "Preparing and Cleaning Data", score: 4, total: 15, coins: 3 },
                    { name: "Visualizing and Reporting Clean Data", score: 0, total: 15, coins: 0 }
                ],
                steps: [
                    { index: 1, delay: 1000, finalScore: 2 },
                    { index: 2, delay: 500, finalScore: 7 }
                ],
                initialTotal: 12
            };
        } else if (activeLesson.id === 'm1-l14') {
             scenario = {
                initial: [
                    { name: "Prepare Datasets in Power BI", score: 8, total: 10, coins: 2 },
                    { name: "Connecting and Importing Data", score: 2, total: 10, coins: 0 },
                    { name: "Preparing and Cleaning Data", score: 7, total: 15, coins: 0 },
                    { name: "Visualizing and Reporting Clean Data", score: 0, total: 15, coins: 3 }
                ],
                steps: [
                    { index: 0, delay: 1000, finalScore: 10 },
                    { index: 3, delay: 500, finalScore: 3 }
                ],
                initialTotal: 17
            };
        } else {
             // Fallback/Generic animation for other assignments
             scenario = {
                initial: [
                    { name: "Prepare Datasets in Power BI", score: 10, total: 10, coins: 0 },
                    { name: "Connecting and Importing Data", score: 5, total: 10, coins: 3 },
                    { name: "Preparing and Cleaning Data", score: 10, total: 15, coins: 0 },
                    { name: "Visualizing and Reporting Clean Data", score: 5, total: 15, coins: 2 }
                ],
                steps: [
                    { index: 1, delay: 1000, finalScore: 8 },
                    { index: 3, delay: 500, finalScore: 7 }
                ],
                initialTotal: 30
            };
        }

        if (scenario) {
            setSkillsData(scenario.initial);
            setSkillCategoryTotal(scenario.initialTotal);
            setActiveSkillAnim(null);
            setCompletedAnimations({});
            setSparkActiveIndex(null);
            setShowMasteryMessage(false);

            const runSequence = async () => {
                let currentTotal = scenario.initialTotal;
                
                for (const step of scenario.steps) {
                    await new Promise(r => setTimeout(r, step.delay)); // Wait for previous step/initial delay
                    
                    setActiveSkillAnim(step.index);
                    
                    // Wait for coin animation (approx 600ms) before updating score
                    await new Promise(r => setTimeout(r, 600)); 
                    
                    // Calculate points gained from initial data
                    const initialScore = scenario.initial[step.index].score;
                    const pointsGained = step.finalScore - initialScore;
                    
                    // Update score
                    setSkillsData(prev => {
                        const newSkills = [...prev];
                        const diff = step.finalScore - newSkills[step.index].score;
                        currentTotal += diff;
                        newSkills[step.index] = { ...newSkills[step.index], score: step.finalScore };
                        return newSkills;
                    });
                    setSkillCategoryTotal(currentTotal);
                    
                    // Track completed animation with points gained
                    if (pointsGained > 0) {
                        setCompletedAnimations(prev => ({ ...prev, [step.index]: pointsGained }));
                    }

                    // Check for Mastery Event (Index 0 reaching 10)
                    if (step.index === 0 && step.finalScore === 10) {
                        setSparkActiveIndex(step.index);
                        setTimeout(() => {
                            setSparkActiveIndex(null);
                            setShowMasteryMessage(true);
                        }, 800);
                    }

                    // Wait a bit before clearing animation state or starting next
                    await new Promise(r => setTimeout(r, 2000));
                    setActiveSkillAnim(null);
                }
            };

            runSequence();
        }
    }
  }, [activeLesson.id, hasSubmitted, isAssignmentView]);

  useEffect(() => {
    if (isAssignmentView) {
        setSummarySkills([]);
        setIsLoadingSummary(true);
        // Fetch AI summary for the assignment
        getAssignmentSummary(activeLesson.title).then(skills => {
            setSummarySkills(skills);
            setIsLoadingSummary(false);
        });
    }
  }, [activeLesson, isAssignmentView]);

  const handleStartAssignment = () => {
    // Show loading screen first
    setShowQuizLoading(true);
    
    // After 3.5 seconds, complete the assignment
    setTimeout(() => {
      setShowQuizLoading(false);
      setHasSubmitted(true);
      if (onMarkComplete) {
          onMarkComplete();
      }
      // Note: playCelebrationTune is triggered by the status change effect above
    }, 3500);
  };

  const specificSkills = [
      "Differentiate between common primitive data types such as text, numeric, date/time, and boolean.",
      "Identify specific formatting cues within spreadsheet cells that indicate a particular data type (e.g., currency symbols, date separators, scientific notation.",
      "Accurately classify individual data points or entire columns into their appropriate data type categories.",
      "Distinguish between different numeric sub-types like integers, floats, and percentages based on their representation."
  ];

  const currentSkillTags = getLessonSkillTags(activeLesson.id);
  const displaySkillTags = currentSkillTags.length
    ? currentSkillTags
    : ["Visualizing and Reporting Clean Data"];

  return (
    <main className="flex-1 flex flex-col h-full bg-[var(--cds-color-grey-25)] relative pr-6 pl-2 pb-4 pt-4 overflow-hidden">
      <div className="bg-[var(--cds-color-white)] rounded-2xl shadow-sm border border-[var(--cds-color-grey-100)]/60 w-full flex flex-row flex-1 overflow-hidden">
        
        {/* Scrollable Content Area */}
        <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar relative">
          
          {isAssignmentView ? (
            <>
              {showQuizLoading ? (
                  // Quiz Loading Screen
                  <div className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in">
                    {/* Illustration */}
                    <div className="relative mb-8">
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-white rounded-full flex items-center justify-center shadow-inner">
                          <Icons.BookOpen className="w-12 h-12 text-[var(--cds-color-blue-700)] animate-pulse" />
                        </div>
                      </div>
                      {/* Floating elements */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-[var(--cds-color-yellow-100)] rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                        <Icons.Sparkles className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="absolute -bottom-1 -left-3 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                        <Icons.Check className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="absolute top-1/2 -right-4 w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.8s' }}>
                        <Icons.Star className="w-3 h-3 text-purple-500" />
                      </div>
                    </div>
                    
                    {/* Loading text */}
                    <h2 className="cds-title-xsmall-lg text-[var(--cds-color-grey-900)] mb-8">Taking your quiz...</h2>
                    
                    {/* Progress dots */}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[var(--cds-color-blue-700)] rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                      <div className="w-3 h-3 bg-[var(--cds-color-blue-700)] rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                      <div className="w-3 h-3 bg-[var(--cds-color-blue-700)] rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                    </div>
                  </div>
              ) : !hasSubmitted ? (
                  <>
                    {activeLesson.type === ContentType.ASSIGNMENT ? (
                        <div className="mb-6">
                        <h1 className="cds-title-xsmall-lg mb-2 text-[var(--cds-color-grey-975)]">Graded Assignment</h1>
                        <h2 className="cds-subtitle-large text-[var(--cds-color-grey-600)] mb-3">{activeLesson.title}</h2>
                        <div className="flex flex-wrap gap-2">
                          {displaySkillTags.map((skill, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-0.5 bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] rounded cds-body-tertiary text-[var(--cds-color-grey-700)]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        </div>
                    ) : (
                        <div className="mb-6">
                          <h1 className="cds-title-xsmall-lg mb-2">{activeLesson.title}</h1>
                          <p className="cds-body-primary text-[var(--cds-color-grey-600)]">
                            <span className="font-semibold">Practice Assignment:</span> Complete this practice assignment to earn skill points and meet your daily goal.
                          </p>
                        </div>
                    )}

                    <div className="animate-fade-in">
                        {/* Assignment Details Card */}
                        <div className="bg-[var(--cds-color-blue-25)] rounded-lg p-5 mb-6">
                            <h3 className="cds-subtitle-medium mb-4">Assignment details</h3>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-8 flex-1">
                                    <div>
                                        <div className="cds-body-tertiary font-semibold text-[var(--cds-color-grey-500)] mb-0.5">Attempts</div>
                                        <div className="cds-body-secondary font-semibold text-[var(--cds-color-grey-975)]">Unlimited</div>
                                    </div>
                                        <div>
                                        <div className="cds-body-tertiary font-semibold text-[var(--cds-color-grey-500)] mb-0.5">Reward</div>
                                        <div className="flex items-center gap-1 bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] px-2 py-1 rounded-lg shadow-sm">
                                            <span className="cds-body-secondary font-semibold text-[var(--cds-color-grey-975)]">{getSkillPoints(activeLesson.type)}</span>
                                            <span className="cds-body-tertiary text-[var(--cds-color-grey-500)]">XP</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="cds-body-tertiary font-semibold text-[var(--cds-color-grey-500)] mb-1">Skills</div>
                                        <div className="flex flex-wrap gap-1">
                                            {displaySkillTags.map((skill, i) => (
                                                <span 
                                                    key={i} 
                                                    className="px-2 py-0.5 bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] rounded cds-body-tertiary text-[var(--cds-color-grey-700)]"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleStartAssignment}
                                    className="bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] px-8 py-2.5 rounded-[8px] cds-action-primary transition-colors shadow-sm shrink-0"
                                >
                                    Start
                                </button>
                            </div>
                        </div>
                    </div>
                  </>
              ) : (
                  // RESULTS PAGE
                  <>
                    <div className="flex-1">
                      {/* Skill Progress View - Dedicated page for skill progress */}
                      {showSkillProgressView ? (
                        <>
                          {/* Back button and header for skill progress view */}
                          {onBackFromSkillProgress && (
                            <button 
                              onClick={onBackFromSkillProgress}
                              className="flex items-center gap-2 text-[var(--cds-color-blue-700)] font-semibold text-[14px] mb-4 hover:text-blue-700 transition-colors"
                            >
                              <Icons.ChevronRight className="w-4 h-4 rotate-180" />
                              Back to results
                            </button>
                          )}
                          <h1 className="headline-md tracking-tight leading-tight mb-2 text-[var(--cds-color-grey-975)]">Skill Progress</h1>
                          <p className="text-[15px] text-[var(--cds-color-grey-600)] mb-6">Here's how your skills have improved from this assignment.</p>
                        </>
                      ) : (
                        <>
                          <h1 className="headline-md tracking-tight leading-tight mb-2 text-[var(--cds-color-grey-975)]">Congratulations, you've passed!</h1>
                          <p className="text-[15px] text-[var(--cds-color-grey-600)] mb-6">You've completed your daily goal and made progress in your skill development.</p>
                        </>
                      )}
                      
                      <div className="animate-fade-in space-y-6">
                          {/* Grade - Only show when not in skill progress view */}
                          {!showSkillProgressView && (
                          <div className="mb-2">
                              <div>
                                  <div className="text-xs font-semibold text-[var(--cds-color-grey-500)] uppercase tracking-wide mb-2">Grade</div>
                                  <div className="text-5xl font-bold text-[var(--cds-color-grey-975)]">97%</div>
                                  <div className="text-[14px] text-[var(--cds-color-grey-500)] mt-1">34 out of 35 correct</div>
                              </div>
                              <button 
                                  onClick={() => setShowOtherSkills(!showOtherSkills)}
                                  className="w-full flex items-center justify-between text-[var(--cds-color-blue-700)] font-semibold text-[14px] mt-4 p-4 border border-[var(--cds-color-grey-100)] rounded-lg hover:bg-[var(--cds-color-grey-25)] transition-colors"
                              >
                                  <span>See questions</span>
                                  <Icons.ChevronDown className={`w-5 h-5 transition-transform ${showOtherSkills ? 'rotate-180' : ''}`} />
                              </button>
                          </div>
                          )}

                          {/* Skill Progress - Loading State or Animated Progress Bar Section */}
                          <div className={`${showSkillProgressView ? '' : 'mt-6 pt-6 border-t border-[var(--cds-color-grey-100)]'}`}>
                          {!(showSkillProgressView || showSkillProgressSection) ? (
                              // Loading state while waiting for sidebar animations
                              <div className="flex flex-col items-center justify-center py-10">
                                  <div className="relative mb-4">
                                      <Icons.Coin className="w-12 h-12 text-[var(--cds-color-yellow-700)] animate-bounce" />
                                      <div className="absolute inset-0 w-12 h-12 bg-[var(--cds-color-yellow-700)]/20 rounded-full animate-ping"></div>
                                  </div>
                                  <p className="text-[15px] font-semibold text-[var(--cds-color-grey-700)]">Loading your skill progress...</p>
                              </div>
                          ) : (
                          <div className="animate-fade-in relative">
                              <p className="text-[15px] font-semibold text-[var(--cds-color-grey-500)] mb-5">Skill progress from this assignment</p>
                              
                              {/* Progress Bar Section - Shows first so users see XP contributing */}
                              {showProgressBarSection && (
                              <div className={`mb-5 ${!showSkillsList ? 'animate-fade-in' : ''}`}>
                                  <div className="flex items-center justify-between mb-3">
                                      <span className="text-[14px] font-semibold text-[var(--cds-color-grey-700)]">{activeSkillTags[0]}</span>
                                      <div className="flex items-center gap-2">
                                          {showXpBadge && (
                                              <span className={`text-[13px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md ${badgePulse ? 'animate-badge-receive-xp' : ''}`}>
                                                  +{currentXpBadgeValue}
                                              </span>
                                          )}
                                          <span className="text-[16px] font-bold text-[var(--cds-color-grey-975)] tabular-nums">
                                              <RollingCounter value={displayedTotalPoints} startFromZero={false} />/{maxProgressPoints}
                                          </span>
                                          <Icons.Coin className="w-5 h-5" />
                                      </div>
                                  </div>
                                  
                                  {/* Progress Bar with stage markers */}
                                  <div className="relative">
                                      <div className="h-3 bg-[var(--cds-color-grey-50)] rounded-full overflow-hidden mb-3 relative">
                                          {/* Stage dividers - 33.33% and 88% */}
                                          <div className="absolute top-1/2 -translate-y-1/2 left-[33.33%] w-[2px] h-[15px] bg-[var(--cds-color-grey-200)] z-10"></div>
                                          <div className="absolute top-1/2 -translate-y-1/2 left-[88%] w-[2px] h-[15px] bg-[var(--cds-color-grey-200)] z-10"></div>
                                          
                                          {/* Progress fill - Yellow, transitions to orange at Comprehending */}
                                          <div 
                                              className={`h-full rounded-full transition-all duration-300 ease-out relative ${
                                                  progressLabel === 'Comprehending' 
                                                      ? 'bg-gradient-to-r from-[#FFC936] via-[#F28100] to-[#EA580C]' 
                                                      : 'bg-gradient-to-r from-[#FACC15] to-[#FFC936]'
                                              }`}
                                              style={{ width: `${progressPercent}%` }}
                                          >
                                              <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-transparent to-white/40 rounded-full"></div>
                                          </div>
                                      </div>
                                      
                                      {/* Three stage labels below progress bar - centered in each third */}
                                      <div className="relative text-[12px] font-semibold h-5">
                                          <span 
                                              className={`absolute transition-all duration-500 -translate-x-1/2 ${
                                                  progressLabel === 'Practicing' 
                                                      ? 'text-[var(--cds-color-yellow-700)]' 
                                                      : 'text-[var(--cds-color-grey-400)]'
                                              }`}
                                              style={{ left: '16.67%' }}
                                          >
                                              Practicing
                                          </span>
                                          <span 
                                              className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 ${
                                                  progressLabel === 'Developing' 
                                                      ? 'text-[var(--cds-color-yellow-700)]' 
                                                      : 'text-[var(--cds-color-grey-400)]'
                                              }`}
                                          >
                                              Developing
                                          </span>
                                          <span 
                                              className={`absolute transition-all duration-500 -translate-x-1/2 ${
                                                  progressLabel === 'Comprehending' 
                                                      ? 'text-[var(--cds-color-yellow-700)]' 
                                                      : 'text-[var(--cds-color-grey-400)]'
                                              }`}
                                              style={{ left: '94%' }}
                                          >
                                              Comprehending
                                          </span>
                                      </div>
                                  </div>
                              </div>
                              )}
                              
                              {/* XP Card - Shows the skill XP gain feeding into progress bar */}
                              {showXpCards && !visualizingCardGone && (
                                  <div className="flex justify-center my-6" style={{ minHeight: '100px' }}>
                                      {/* Single card showing the skill XP reward */}
                                      <div 
                                          className={`relative rounded-2xl overflow-hidden bg-blue-100 w-full max-w-[280px] ${
                                              visualizingCardFlying 
                                                  ? 'animate-card-fly-to-badge-center' 
                                                  : 'animate-slide-up'
                                          }`}
                                          style={{ animationDelay: '0ms' }}
                                      >
                                          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                                          <div className="relative p-5 flex flex-col h-full min-h-[100px]">
                                              <div className="flex items-start justify-between">
                                                  <span className="text-[14px] font-semibold text-blue-600">
                                                      {activeSkillTags[0]}
                                                  </span>
                                              </div>
                                              <div className="flex items-end justify-end mt-auto gap-2">
                                                  <span className="text-[42px] font-bold text-blue-600 leading-none">
                                                      +{lessonXpReward}
                                                  </span>
                                                  <Icons.Coin className="w-8 h-8 mb-1" />
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              )}

                              {/* Flyout Container - Shows skills anchored to progress bar */}
                              {showSkillsList && (
                              <div className="animate-fade-in relative mt-4">
                                  {/* Flyout Card */}
                                  <div className="bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] rounded-xl shadow-lg p-5 relative max-w-[500px]">
                                      {/* Arrow pointing up to corresponding skill level label - aligned to even thirds */}
                                      <div 
                                          className="absolute -top-[11px] w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-white z-10 transition-all duration-500"
                                          style={{ 
                                              left: progressLabel === 'Practicing' ? '16.67%' : 
                                                    progressLabel === 'Developing' ? '60%' : '94%',
                                              transform: 'translateX(-50%)'
                                          }}
                                      ></div>
                                      <div 
                                          className="absolute -top-[13px] w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-b-[13px] border-b-slate-200 transition-all duration-500"
                                          style={{ 
                                              left: progressLabel === 'Practicing' ? '16.67%' : 
                                                    progressLabel === 'Developing' ? '60%' : '94%',
                                              transform: 'translateX(-50%)'
                                          }}
                                      ></div>
                                      {/* Stage Title and Description */}
                                      <div className="mb-5 pb-4 border-b border-[var(--cds-color-grey-50)]">
                                          <p className="text-[14px] text-[var(--cds-color-grey-600)] leading-relaxed">
                                              <span className={`font-bold uppercase tracking-wide ${
                                                  progressLabel === 'Comprehending' ? 'text-[var(--cds-color-yellow-700)]' : 'text-[var(--cds-color-grey-700)]'
                                              }`}>
                                                  {progressLabel}
                                              </span>
                                              {' '}
                                              {progressLabel === 'Practicing' && 
                                                  "You're building foundational skills through hands-on exercises and guided practice."}
                                              {progressLabel === 'Developing' && 
                                                  "You're strengthening your understanding and starting to apply concepts independently."}
                                              {progressLabel === 'Comprehending' && 
                                                  `You're demonstrating strong understanding of the core concepts that make up the ${activeSkillTags[0]} skill, and can apply them effectively.`}
                                          </p>
                                      </div>

                                      </div>
                              </div>
                              )}
                              
                              {/* Next Item Button */}
                              {showSkillsList && (
                              <div className="mt-6 flex justify-end animate-fade-in">
                                  <button 
                                      onClick={() => {
                                          if (onResultsNextItem) {
                                              onResultsNextItem();
                                          } else {
                                              onNext();
                                          }
                                      }}
                                      className="bg-[var(--cds-color-white)] border border-[var(--cds-color-blue-700)] text-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-25)] px-6 py-2.5 rounded-[8px] font-semibold text-[15px] flex items-center gap-2 transition-all"
                                  >
                                      Next item
                                      <Icons.ChevronRight className="w-4 h-4" />
                                  </button>
                              </div>
                              )}
                          </div>
                          )}
                          </div>
                      </div>
                    </div>

                    {/* Skill Mastery Modal is now controlled by App.tsx */}
                  </>
              )}
            </>
          ) : (
            <>
              {/* Content Placeholder (Video/Generic) - Hidden for Reading */}
              {!isReading && (
                <div 
                  ref={videoContainerRef}
                  className="bg-black rounded-lg w-full aspect-video mb-8 flex items-center justify-center relative overflow-hidden shrink-0"
                >
                  {activeLesson.type === ContentType.VIDEO ? (
                     <>
                       <video 
                         ref={videoRef}
                         className="w-full h-full object-cover"
                         src="/Video/GOOGLE INTRO VIDEO 1.mov"
                         controls
                         preload="metadata"
                         onEnded={handleVideoEnded}
                       />
                       {/* Video End Modal - shown when video ends */}
                       {showVideoEndModal && nextLesson && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
                           <div className="bg-[var(--cds-color-white)] rounded-2xl shadow-2xl w-[380px] animate-fade-in overflow-hidden">
                             <div className="p-6 flex flex-col items-center">
                               {/* Header */}
                               <h2 className="text-xl font-semibold text-[var(--cds-color-grey-900)] mb-5">
                                 Item complete!
                               </h2>
                               
                               {/* Stats Row: XP Earned and Skill */}
                               <div className="w-full flex items-stretch justify-center divide-x divide-[var(--cds-color-grey-100)] border border-[var(--cds-color-grey-100)] rounded-lg mb-6">
                                 {/* XP Earned */}
                                 <div className="py-3 px-3 text-center">
                                   <div className="flex items-center justify-center gap-1.5 mb-1">
                                     <Icons.Coin className="w-5 h-5" />
                                     <span className="text-lg font-bold text-[var(--cds-color-grey-900)]">+{lessonXpReward}</span>
                                   </div>
                                   <p className="text-xs text-[var(--cds-color-grey-500)]">XP Earned</p>
                                 </div>
                                 
                                 {/* Skill */}
                                 <div className="flex-1 py-3 px-3 text-center flex flex-col justify-center">
                                   <p 
                                     className="text-xs font-bold text-[var(--cds-color-grey-900)] mb-1 truncate" 
                                     title={displaySkillTags[0] || 'Skill'}
                                   >
                                     {displaySkillTags[0] || 'Skill'}
                                   </p>
                                   <p className="text-xs text-[var(--cds-color-grey-500)]">Skill</p>
                                 </div>
                               </div>
                               
                               {/* Next Item Button */}
                               <button
                                 onClick={handleStartNow}
                                 className="w-full bg-[var(--cds-color-blue-700)] text-[var(--cds-color-white)] py-3 px-6 rounded-lg font-medium hover:bg-[var(--cds-color-blue-800)] transition-colors mb-3"
                               >
                                 Next item
                               </button>
                               
                               {/* Pause Link with Countdown */}
                               <button
                                 onClick={handleTogglePause}
                                 className="text-[var(--cds-color-grey-500)] text-sm hover:text-[var(--cds-color-grey-700)] transition-colors flex items-center gap-2"
                               >
                                 <span className="font-semibold">{videoEndCountdown}</span>
                                 <span className="text-[var(--cds-color-grey-200)]">|</span>
                                 <span>{isCountdownPaused ? 'Resume' : 'Pause'}</span>
                               </button>
                             </div>
                           </div>
                         </div>
                       )}
                     </>
                  ) : (
                    <div className="flex flex-col items-center text-[var(--cds-color-grey-400)]">
                      <Icons.Reading className="w-16 h-16 mb-3 opacity-50" />
                      <span className="body-lg-semibold text-[var(--cds-color-grey-500)]">{activeLesson.type} Content</span>
                    </div>
                  )}
                </div>
              )}

              {/* Lesson Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 shrink-0">
                <div className="flex flex-col gap-2">
                <h1 className="headline-md tracking-tight leading-tight">{activeLesson.title}</h1>
                  <div className="flex flex-wrap gap-2">
                    {displaySkillTags.map((skill, i) => (
                      <span 
                        key={i} 
                        className="px-2 py-1.5 border border-[var(--cds-color-grey-100)] rounded text-xs text-[var(--cds-color-grey-900)]"
                        style={{ backgroundColor: 'var(--color-bg-primary)' }}
                      >
                        <span className="font-semibold">+{getSkillPoints(activeLesson.type)} XP</span>
                        <span className="text-[var(--cds-color-grey-500)]"> • </span>
                        <span className="text-[var(--cds-color-grey-500)]">{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>
                
                {!isReading && (
                  <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-[var(--cds-color-grey-25)] text-[var(--cds-color-grey-975)] btn-text-md transition-colors whitespace-nowrap">
                    <Icons.Notes className="w-5 h-5" />
                    <span>Save note</span>
                  </button>
                )}
              </div>

              {/* Reading Content Body - Only if reading */}
              {isReading && (
                <div className="prose max-w-none mb-8 text-[var(--cds-color-grey-900)]">
                  <div className="flex items-center gap-2 text-[var(--cds-color-grey-500)] text-sm mb-6">
                    <Icons.Reading className="w-4 h-4" />
                    <span>{activeLesson.duration} read</span>
                  </div>
                  
                  <p className="mb-6 leading-relaxed text-[16px]">
                    This is a placeholder for the reading content. In a full application, the actual text content for <strong>"{activeLesson.title}"</strong> would appear here.
                  </p>
                  
                  <h3 className="headline-sm mb-4 mt-8">Key Takeaways</h3>
                  <p className="mb-6 leading-relaxed text-[16px]">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                  
                  <p className="mb-6 leading-relaxed text-[16px]">
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                  </p>
                </div>
              )}

              {/* AI Coach Section - Hidden for Reading */}
              {!isReading && (
                <div className="shrink-0">
                   <Coach lessonTitle={activeLesson.title} />
                </div>
              )}

              {/* Feedback Actions */}
              <div className={`flex items-center gap-6 shrink-0 border-t border-[var(--cds-color-grey-50)] pt-6 mt-4`}>
                <button className="flex items-center gap-2 text-[var(--cds-color-blue-700)] btn-text-md hover:text-blue-700">
                <Icons.Like className="w-5 h-5" />
                Like
                </button>
                <button className="flex items-center gap-2 text-[var(--cds-color-blue-700)] btn-text-md hover:text-blue-700">
                <Icons.Dislike className="w-5 h-5" />
                Dislike
                </button>
                <button className="flex items-center gap-2 text-[var(--cds-color-blue-700)] btn-text-md hover:text-blue-700 ml-4">
                <Icons.Report className="w-4 h-4" />
                Report an issue
                </button>
                <button className="flex items-center gap-2 text-[var(--cds-color-blue-700)] btn-text-md hover:text-blue-700 ml-4">
                View skill progress
                </button>
            </div>

            {/* Footer Navigation */}
            <div className="mt-auto pt-12 flex justify-end shrink-0">
                <button 
                onClick={() => { playRetroCoinSound(); onResultsNextItem ? onResultsNextItem() : onNext(); }}
                className="bg-[var(--cds-color-white)] border border-[var(--cds-color-blue-700)] text-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-25)] px-6 py-2 rounded-[8px] btn-text-md flex items-center gap-2 transition-all"
                >
                Next item
                <Icons.ChevronRight className="w-4 h-4" />
                </button>
            </div>
            </>
          )}

        </div>

        {/* Attached Toolbar */}
        <Toolbar />
      </div>
    </main>
  );
};
