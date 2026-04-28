

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SiteVariantProvider } from './context/SiteVariantContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { ModuleCompletionModal } from './components/ModuleCompletionModal';
import { DailyGoalsCompletionModal } from './components/DailyGoalsCompletionModal';
import { DailyGoalSummaryModal } from './components/DailyGoalSummaryModal';
import type { DailyTimeGoal } from './components/DailyTimeGoalModal';
import { PauseSessionModal } from './components/PauseSessionModal';
import { SkillMasteryModal } from './components/SkillMasteryModal';
import { PersonalizeLearningModal, PlanType } from './components/PersonalizeLearningModal';
import { PlanConfirmationModal } from './components/PlanConfirmationModal';
import { SkillProgressModal } from './components/SkillProgressModal';
import { MyLearning } from './components/MyLearning';
import { Home } from './components/Home';
import { FeedPage, type CommunitySurface } from './components/FeedPage';
import { AssessmentStart } from './components/AssessmentStart';
import { AssessmentResult } from './components/AssessmentResult';
import { BadgeAchievement } from './components/BadgeAchievement';
import { COURSE_DATA } from './constants';
import type { FeedCohortId } from './constants/feedCohorts';
import {
  aggregateSkillPoints,
  buildDailyGoalLessonIds,
  courseCompletionDisplayPercent,
  getSkillLevelLabel,
  getSkillPoints,
  SKILL_SUBSKILLS,
  sumLessonMinutes,
  sumLessonPoints
} from './skills';
import { Lesson, CourseData, Status, ContentType } from './types';

type View = 'learning' | 'dashboard' | 'home' | 'feed' | 'assessment' | 'assessment-result' | 'badge-achievement';

// Assessment sub-skill results - tracks points earned per sub-skill from assessments
export interface AssessmentSubSkillResults {
  "Prepare Datasets in Power BI": number;
  "Connecting and Importing Data": number;
  "Preparing and Cleaning Data": number;
  "Visualizing and Reporting Clean Data": number;
}

const App: React.FC = () => {
  // Initialize state with the constant data so we can modify it (e.g. mark as completed)
  const [courseData, setCourseData] = useState<CourseData>(COURSE_DATA);

  // Track active lesson by ID - Start at first lesson for Today's Goal design
  const [activeLessonId, setActiveLessonId] = useState<string>("m1-l1");
  
  // View State - Default to 'home' for logged in homepage (Community when Figma html-to-design capture is active)
  const [currentView, setCurrentView] = useState<View>(() =>
    typeof window !== 'undefined' && window.location.hash.includes('figmacapture') ? 'feed' : 'home'
  );
  
  // Assessment results - tracks sub-skill scores from the assessment
  // These values match what's shown in AssessmentResult: 10/10 correct for first skill, 
  // 3/10, 7/10, 6/10 correct for the others (based on mistakes: 7, 3, 4)
  const [assessmentResults, setAssessmentResults] = useState<AssessmentSubSkillResults | null>(null);

  // Modal State
  const [showModuleComplete, setShowModuleComplete] = useState(false);
  const [showDailyGoalsComplete, setShowDailyGoalsComplete] = useState(false);
  // New Modal States
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
  const [showPlanConfirmationModal, setShowPlanConfirmationModal] = useState(false);
  const [learningPlan, setLearningPlan] = useState<PlanType | null>(null);
  
  // Daily Time Goal Modal State
  const [dailyTimeGoal, setDailyTimeGoal] = useState<DailyTimeGoal>(60);
  const [dailyGoalLessonIds, setDailyGoalLessonIds] = useState<string[]>(() =>
    buildDailyGoalLessonIds(COURSE_DATA, "m1-l1", 60)
  );
  
  const [completedModuleTitle, setCompletedModuleTitle] = useState("");
  const [completedModuleHours, setCompletedModuleHours] = useState(0);
  const [completedModuleItems, setCompletedModuleItems] = useState(0);
  
  // Track daily goal completions to accumulate sub-skill points
  const [dailyGoalCompletions, setDailyGoalCompletions] = useState(0);
  
  // Skill Progress View State
  const [showSkillProgressView, setShowSkillProgressView] = useState(false);
  
  // Daily Goal Summary Modal State
  const [showDailyGoalSummaryModal, setShowDailyGoalSummaryModal] = useState(false);
  const [is1HourGoal, setIs1HourGoal] = useState(false);
  const [currentGoalProgress, setCurrentGoalProgress] = useState<{ earnedXP: number; totalXP: number } | null>(null);
  
  // Learning Time Tracking - tracks actual time spent learning
  const [learningStartTime, setLearningStartTime] = useState<number | null>(null);
  const [accumulatedLearningMinutes, setAccumulatedLearningMinutes] = useState(0);
  
  // Skill Mastery Modal State (for verified assessment prompt)
  const [showSkillMasteryModal, setShowSkillMasteryModal] = useState(false);

  // Skill Progress Modal State (for viewing skill details from daily goal)
  const [showSkillProgressModal, setShowSkillProgressModal] = useState(false);

  // Session Timer State - for pause/resume/extend functionality
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(60 * 60); // Default 60 min in seconds
  const [isEarlySessionEnd, setIsEarlySessionEnd] = useState(false);

  // Derive the active lesson object from the current course data state
  const activeLesson = useMemo(() => {
    for (const module of courseData.modules) {
      const lesson = module.lessons.find(l => l.id === activeLessonId);
      if (lesson) return lesson;
    }
    // Fallback to first if not found, though activeLessonId should be valid
    return courseData.modules[0].lessons[0];
  }, [courseData, activeLessonId]);

  // Derive the next lesson for video end modal
  const nextLessonInfo = useMemo(() => {
    let foundCurrent = false;
    let nextLesson: Lesson | null = null;
    let currentIndex = 0;
    let totalInGoal = dailyGoalLessonIds.length || 8;
    
    // Find current lesson index in daily goal
    const dailyGoalIndex = dailyGoalLessonIds.indexOf(activeLessonId);
    if (dailyGoalIndex !== -1 && dailyGoalLessonIds.length > 0) {
      currentIndex = dailyGoalIndex + 1;
      // Find next lesson from daily goal
      if (dailyGoalIndex < dailyGoalLessonIds.length - 1) {
        const nextLessonId = dailyGoalLessonIds[dailyGoalIndex + 1];
        for (const module of courseData.modules) {
          const lesson = module.lessons.find(l => l.id === nextLessonId);
          if (lesson) {
            nextLesson = lesson;
            break;
          }
        }
      }
    }
    
    // Fallback: find next lesson in module order if not found in daily goal
    if (!nextLesson) {
      for (const module of courseData.modules) {
        for (const lesson of module.lessons) {
          if (foundCurrent) {
            nextLesson = lesson;
            break;
          }
          if (lesson.id === activeLessonId) {
            foundCurrent = true;
            currentIndex = currentIndex || 1;
          }
        }
        if (nextLesson) break;
      }
    }
    
    return { nextLesson, currentIndex, totalInGoal };
  }, [courseData, activeLessonId, dailyGoalLessonIds]);

  // Calculate initial SP (History) to ensure daily goal starts at 0
  // We use the imported COURSE_DATA constant as the baseline "Snapshot" of previous session
  const initialSP = useMemo(() => {
    const videoReadingTypes = [ContentType.VIDEO, ContentType.READING, ContentType.PLUGIN];
    const points = COURSE_DATA.modules.reduce((acc, module) => {
      module.lessons.forEach(lesson => {
        if (lesson.status === Status.COMPLETED) {
          const p = getSkillPoints(lesson.type);
          if (videoReadingTypes.includes(lesson.type)) {
            acc.videoReading += p;
          } else {
            acc.other += p;
          }
        }
      });
      return acc;
    }, { videoReading: 0, other: 0 });
    return Math.min(points.videoReading, 500) + Math.min(points.other, 500);
  }, []);

  // Calculate snapshot of item counts at start of session
  const initialCounts = useMemo(() => {
    return COURSE_DATA.modules.reduce((acc, module) => {
       const learning = module.lessons.filter(l => 
         l.status === Status.COMPLETED && 
         (l.type === ContentType.VIDEO || l.type === ContentType.READING || l.type === ContentType.PLUGIN)
       ).length;
       const practice = module.lessons.filter(l => 
         l.status === Status.COMPLETED && 
         (l.type === ContentType.ASSIGNMENT || l.type === ContentType.PRACTICE)
       ).length;
       return { learning: acc.learning + learning, assignment: acc.assignment + practice };
    }, { learning: 0, assignment: 0 });
 }, []);

  // Calculate total SP based on completed lessons with capping logic
  const totalSP = useMemo(() => {
    const videoReadingTypes = [ContentType.VIDEO, ContentType.READING, ContentType.PLUGIN];
    
    const points = courseData.modules.reduce((acc, module) => {
      module.lessons.forEach(lesson => {
        if (lesson.status === Status.COMPLETED) {
          const p = getSkillPoints(lesson.type);
          if (videoReadingTypes.includes(lesson.type)) {
            acc.videoReading += p;
          } else {
            acc.other += p;
          }
        }
      });
      return acc;
    }, { videoReading: 0, other: 0 });

    return Math.min(points.videoReading, 500) + Math.min(points.other, 500);
  }, [courseData]);

  // Daily SP is the difference between current Total and Initial
  const dailySP = Math.max(0, totalSP - initialSP);

  // Calculate specific goal metrics (Total)
  const learningItemsCompletedTotal = useMemo(() => {
    return courseData.modules.reduce((acc, module) => {
      return acc + module.lessons.filter(l => 
        l.status === Status.COMPLETED && 
        (l.type === ContentType.VIDEO || l.type === ContentType.READING || l.type === ContentType.PLUGIN)
       ).length;
    }, 0);
  }, [courseData]);

  const assignmentItemsCompletedTotal = useMemo(() => {
    return courseData.modules.reduce((acc, module) => {
      return acc + module.lessons.filter(l => 
        l.status === Status.COMPLETED && 
        (l.type === ContentType.ASSIGNMENT || l.type === ContentType.PRACTICE)
      ).length;
    }, 0);
  }, [courseData]);

  // Daily counts are difference between Total and Initial Snapshot
  const dailyLearningItemsCompleted = Math.max(0, learningItemsCompletedTotal - initialCounts.learning);
  const dailyAssignmentItemsCompleted = Math.max(0, assignmentItemsCompletedTotal - initialCounts.assignment);

  const lessonsById = useMemo(() => {
    const entries = courseData.modules.flatMap((module) => module.lessons);
    return new Map(entries.map((lesson) => [lesson.id, lesson]));
  }, [courseData]);

  const dailyGoalLessons = useMemo(() => {
    return dailyGoalLessonIds
      .map((id) => lessonsById.get(id))
      .filter((lesson): lesson is Lesson => Boolean(lesson));
  }, [dailyGoalLessonIds, lessonsById]);

  const dailyGoalCompletedLessons = useMemo(
    () => dailyGoalLessons.filter((lesson) => lesson.status === Status.COMPLETED),
    [dailyGoalLessons]
  );

  const allCompletedLessons = useMemo(
    () => courseData.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.status === Status.COMPLETED),
    [courseData]
  );

  const dailyGoalSP = dailyGoalLessons.length ? sumLessonPoints(dailyGoalLessons) : 0;
  const dailyGoalEarnedXP = sumLessonPoints(dailyGoalCompletedLessons);
  const dailyGoalMinutes = dailyGoalLessons.length ? sumLessonMinutes(dailyGoalLessons) : 0;
  const dailyGoalCompletedMinutes = dailyGoalCompletedLessons.length
    ? sumLessonMinutes(dailyGoalCompletedLessons)
    : 0;

  const goalSkillPoints = aggregateSkillPoints(dailyGoalCompletedLessons);
  const cumulativeSkillPoints = aggregateSkillPoints(allCompletedLessons);
  
  // Calculate actual learning time from start time
  const actualLearningMinutes = useMemo(() => {
    if (!learningStartTime) return 0;
    const elapsedMs = Date.now() - learningStartTime;
    return Math.round(elapsedMs / 60000) + accumulatedLearningMinutes;
  }, [learningStartTime, accumulatedLearningMinutes, showDailyGoalSummaryModal]); // Re-calculate when modal opens
  
  const goalSummaryData = useMemo(() => {
    const progressPercent = dailyGoalSP > 0 ? Math.round((dailyGoalEarnedXP / dailyGoalSP) * 100) : 0;
    const progressLabel = getSkillLevelLabel(progressPercent);

    return {
      hoursLearned: actualLearningMinutes / 60,
      itemsCompleted: dailyGoalCompletedLessons.length,
      progressLabel,
      skills: SKILL_SUBSKILLS.map((name) => ({
        name,
        points: Math.min(25, cumulativeSkillPoints[name] || 0),
        total: 25,
        deltaPoints: goalSkillPoints[name] || 0
      })),
      showVerifyLink: false,
    };
  }, [actualLearningMinutes, dailyGoalCompletedLessons.length, dailyGoalEarnedXP, dailyGoalSP, goalSkillPoints, cumulativeSkillPoints]);

  // Calculate course and module completion stats
  const courseStats = useMemo(() => {
    // Find the current module based on active lesson
    const currentModule = courseData.modules.find(m => 
      m.lessons.some(l => l.id === activeLessonId)
    );
    
    // Course-level stats
    const totalLessons = courseData.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    const completedLessons = courseData.modules.reduce((acc, module) => 
      acc + module.lessons.filter(l => l.status === Status.COMPLETED).length, 0);
    const completionPercent = courseCompletionDisplayPercent(completedLessons, totalLessons);
    
    // Module-level stats
    const totalModuleLessons = currentModule ? currentModule.lessons.length : 0;
    const completedModuleLessons = currentModule 
      ? currentModule.lessons.filter(l => l.status === Status.COMPLETED).length 
      : 0;
    
    return {
      totalLessons,
      completedLessons,
      completionPercent,
      totalModuleLessons,
      completedModuleLessons
    };
  }, [courseData, activeLessonId]);

  // Sub-skills data for the SkillProgressModal
  const subSkillsData = useMemo(() => {
    return SKILL_SUBSKILLS.map((name) => ({
      name,
      points: Math.min(25, cumulativeSkillPoints[name] || 0),
      total: 25
    }));
  }, [cumulativeSkillPoints]);

  useEffect(() => {
    if (!dailyGoalLessonIds.length) {
      setDailyGoalLessonIds(buildDailyGoalLessonIds(courseData, activeLessonId, dailyTimeGoal));
    }
  }, [courseData, activeLessonId, dailyTimeGoal, dailyGoalLessonIds.length]);

  // Session timer countdown effect
  useEffect(() => {
    // Only run countdown when in learning view, not paused, and time remaining
    if (currentView !== 'learning' || isSessionPaused || sessionTimeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setSessionTimeRemaining(prev => {
        if (prev <= 1) {
          // Timer reached zero - could trigger end session or notification
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentView, isSessionPaused, sessionTimeRemaining]);

  // Initialize session timer when daily time goal changes
  useEffect(() => {
    setSessionTimeRemaining(dailyTimeGoal * 60);
  }, [dailyTimeGoal]);

  // Session timer handlers
  const handlePauseSession = () => {
    setIsSessionPaused(true);
    setShowPauseModal(true);
  };

  const handleResumeSession = () => {
    setIsSessionPaused(false);
    setShowPauseModal(false);
  };

  const handleAddTime = (minutes: number) => {
    setSessionTimeRemaining(prev => prev + (minutes * 60));
  };

  const handleEndSession = () => {
    setShowPauseModal(false);
    setIsSessionPaused(false);
    setIsEarlySessionEnd(true);
    setShowDailyGoalSummaryModal(true);
  };

  // Calculate items left in daily goal
  const itemsLeftInGoal = dailyGoalLessons.length - dailyGoalCompletedLessons.length;

  const timeGoalXpByMinutes = useMemo(() => {
    const build = (minutes: DailyTimeGoal) =>
      sumLessonPoints(
        buildDailyGoalLessonIds(courseData, activeLessonId, minutes)
          .map((id) => lessonsById.get(id))
          .filter((lesson): lesson is Lesson => Boolean(lesson))
      );

    return {
      15: build(15),
      30: build(30),
      60: build(60),
    };
  }, [courseData, activeLessonId, lessonsById]);

  const handleLessonSelect = (lesson: Lesson) => {
    setActiveLessonId(lesson.id);
  };

  const handleMarkLessonComplete = () => {
    const newCourseData = {
      ...courseData,
      modules: courseData.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => {
          if (lesson.id === activeLessonId) {
            return { ...lesson, status: Status.COMPLETED };
          }
          return lesson;
        })
      }))
    };
    setCourseData(newCourseData);
  };

  const handleNext = (options?: { skipDailyGoalGate?: boolean }) => {
    const expectedEndLesson = dailyGoalLessonIds[dailyGoalLessonIds.length - 1];
    const dailyGoalIndex = dailyGoalLessonIds.indexOf(activeLessonId);

    if (!options?.skipDailyGoalGate && expectedEndLesson && activeLessonId === expectedEndLesson) {
      const newCourseData = {
        ...courseData,
        modules: courseData.modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => {
            if (dailyGoalLessonIds.includes(lesson.id)) {
              return { ...lesson, status: Status.COMPLETED };
            }
            return lesson;
          })
        }))
      };
      setCourseData(newCourseData);
      
      // Check for module completion after daily goal lessons are marked complete
      const currentModule = newCourseData.modules.find(m => 
        m.lessons.some(l => l.id === activeLessonId)
      );
      if (currentModule) {
        const allModuleLessonsComplete = currentModule.lessons.every(l => l.status === Status.COMPLETED);
        if (allModuleLessonsComplete) {
          // Calculate module stats
          const totalMinutes = currentModule.lessons
            .filter(l => l.status === Status.COMPLETED && l.duration)
            .reduce((acc, lesson) => {
              const duration = lesson.duration || '';
              const minMatch = duration.match(/(\d+)\s*min/);
              const hourMatch = duration.match(/(\d+)\s*h/);
              const secMatch = duration.match(/(\d+)\s*sec/);
              
              if (hourMatch) return acc + parseInt(hourMatch[1]) * 60;
              else if (minMatch) return acc + parseInt(minMatch[1]);
              else if (secMatch) return acc + Math.round(parseInt(secMatch[1]) / 60);
              return acc;
            }, 0);
          
          const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
          const itemsCompleted = currentModule.lessons.filter(l => l.status === Status.COMPLETED).length;
          
          setCompletedModuleTitle(currentModule.title);
          setCompletedModuleHours(totalHours);
          setCompletedModuleItems(itemsCompleted);
          
          // Show module completion modal (will show instead of daily goal summary for module completion)
          const hasBigAnimationItem = dailyGoalLessonIds.includes('m1-l10');
          const rippleDuration = dailyGoalLessonIds.length * 300;
          const baseDelay = hasBigAnimationItem ? 4000 : 500;
          const delay = baseDelay + rippleDuration + 300;
          
          setTimeout(() => {
            setShowModuleComplete(true);
          }, delay);
          return;
        }
      }
      
      const hasBigAnimationItem = dailyGoalLessonIds.includes('m1-l10');
      const rippleDuration = dailyGoalLessonIds.length * 300;
      const baseDelay = hasBigAnimationItem ? 4000 : 500;
      const delay = baseDelay + rippleDuration + 300;

      setCurrentGoalProgress({ earnedXP: dailyGoalSP, totalXP: dailyGoalSP });
      setTimeout(() => {
        setIs1HourGoal(dailyTimeGoal === 60);
        setShowDailyGoalSummaryModal(true);
      }, delay);
      return;
    }

    let nextLessonId: string | null = null;
    let foundCurrent = false;
    let currentModuleId = "";

    // Find which module the current lesson belongs to
    for(const m of courseData.modules) {
      if (m.lessons.some(l => l.id === activeLessonId)) {
        currentModuleId = m.id;
        break;
      }
    }

    // Create a deep copy of the course data to update the status
    const newCourseData = {
      ...courseData,
      modules: courseData.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => {
          if (lesson.id === activeLessonId) {
            // Mark the current lesson as completed
            return { ...lesson, status: Status.COMPLETED };
          }
          return lesson;
        })
      }))
    };

    if (dailyGoalIndex >= 0 && dailyGoalIndex < dailyGoalLessonIds.length - 1) {
      nextLessonId = dailyGoalLessonIds[dailyGoalIndex + 1] || null;
    } else {
      // Find the next lesson to navigate to
      for (const module of newCourseData.modules) {
        if (nextLessonId) break; // Stop if we found the next one
        for (const lesson of module.lessons) {
          if (foundCurrent && !lesson.isLocked) {
            nextLessonId = lesson.id;
            break;
          }
          if (lesson.id === activeLessonId) {
            foundCurrent = true;
          }
        }
      }
    }

    // UPDATE: Update status immediately to trigger "check mark" and "line fill" animation
    setCourseData(newCourseData);

    // DELAY navigation to allow visual transition (1s)
    setTimeout(() => {
        // Daily Goal Logic - Track completions
        const dailyGoalEndLessons = ['m1-l10', 'm1-l14', 'm1-l19', 'm1-l25'];
        if (dailyGoalEndLessons.includes(activeLessonId)) {
            setDailyGoalCompletions(prev => prev + 1);
        }

        // Module Completion Logic
        if (currentModuleId) {
           const updatedModule = newCourseData.modules.find(m => m.id === currentModuleId);
           if (updatedModule) {
             const allComplete = updatedModule.lessons.every(l => l.status === Status.COMPLETED);
             if (allComplete) {
                setCompletedModuleTitle(updatedModule.title);
                
                const totalMinutes = updatedModule.lessons
                  .filter(l => l.status === Status.COMPLETED && l.duration)
                  .reduce((acc, lesson) => {
                    const duration = lesson.duration || '';
                    const minMatch = duration.match(/(\d+)\s*min/);
                    const hourMatch = duration.match(/(\d+)\s*h/);
                    const secMatch = duration.match(/(\d+)\s*sec/);
                    
                    if (hourMatch) return acc + parseInt(hourMatch[1]) * 60;
                    else if (minMatch) return acc + parseInt(minMatch[1]);
                    else if (secMatch) return acc + Math.round(parseInt(secMatch[1]) / 60);
                    return acc;
                  }, 0);
                
                const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
                const itemsCompleted = updatedModule.lessons.filter(l => l.status === Status.COMPLETED).length;
                
                setCompletedModuleHours(totalHours);
                setCompletedModuleItems(itemsCompleted);
                
                setShowDailyGoalsComplete(false);
                setShowModuleComplete(true);
             }
           }
        }

        // Navigate
        if (nextLessonId) {
          setActiveLessonId(nextLessonId);
        }
    }, 1000); // 1 second delay
  };

  const navigateToDashboard = () => {
    setShowModuleComplete(false);
    setShowDailyGoalsComplete(false);
    setShowSkillProgressView(false);
    setCurrentView('dashboard');
  };

  const navigateToLearning = () => {
    // Start tracking learning time when user navigates to learning
    if (!learningStartTime) {
      setLearningStartTime(Date.now());
    }
    setCurrentView('learning');
  };
  
  
  // Handle going back from skill progress view to results
  const handleBackFromSkillProgress = () => {
    setShowSkillProgressView(false);
  };
  
  // Handle "Next item" click from results page - determines if we show summary modal
  const handleResultsNextItem = () => {
    handleNext();
  };
  
  // Handle "Continue" click from DailyGoalSummaryModal
  const handleDailyGoalSummaryContinue = () => {
    setShowDailyGoalSummaryModal(false);
    
    // Ensure we're in learning view
    setCurrentView('learning');
    
    // Start tracking learning time if not already
    if (!learningStartTime) {
      setLearningStartTime(Date.now());
    }

    // Proceed to next item
    handleNext({ skipDailyGoalGate: true });
  };
  
  // Handle closing SkillMasteryModal (when user dismisses or completes)
  const handleSkillMasteryClose = () => {
    setShowSkillMasteryModal(false);
    handleNext({ skipDailyGoalGate: true });
  };
  
  // Handle taking assessment from SkillMasteryModal
  const handleSkillMasteryTakeAssessment = () => {
    setShowSkillMasteryModal(false);
    navigateToAssessment();
  };
  
  // Handle "verify your skills" link from DailyGoalSummaryModal
  const handleVerifySkillsFromSummary = () => {
    setShowDailyGoalSummaryModal(false);
    setCurrentView('dashboard');
  };
  
  // Handle "I'll pause for today" from DailyGoalSummaryModal
  const handlePauseForToday = () => {
    setShowDailyGoalSummaryModal(false);
    setCurrentView('home');
  };

  // Handle showing daily goal progress from sidebar header click
  const handleShowDailyGoalProgress = (data: { earnedXP: number; totalXP: number }) => {
    setCurrentGoalProgress(data);
    setShowDailyGoalSummaryModal(true);
  };

  // When true, MainContent will auto-play the video (e.g. after "Continue watching" on home)
  const [autoPlayLearningVideo, setAutoPlayLearningVideo] = useState(false);

  // Logic to start the Resume flow - go straight to learning (no time goal modal)
  const handleResumeClick = () => {
    setDailyGoalLessonIds(buildDailyGoalLessonIds(courseData, activeLessonId, dailyTimeGoal));
    if (!learningStartTime) setLearningStartTime(Date.now());
    setAutoPlayLearningVideo(true);
    setCurrentView('learning');
  };

  const handleCreatePlan = (plan: PlanType) => {
    setLearningPlan(plan);
    setShowPersonalizeModal(false);
    setShowPlanConfirmationModal(true);
  };

  const handlePlanConfirmed = () => {
    setShowPlanConfirmationModal(false);
    navigateToLearning();
  };

  const navigateToHome = () => {
    setCurrentView('home');
  };

  const [feedInitialCohortId, setFeedInitialCohortId] = useState<FeedCohortId | undefined>(undefined);
  const [feedInitialCommunityTab, setFeedInitialCommunityTab] = useState<CommunitySurface | undefined>(
    undefined
  );

  const navigateToFeed = useCallback((opts?: { cohortId?: FeedCohortId; tab?: CommunitySurface }) => {
    if (opts?.cohortId) setFeedInitialCohortId(opts.cohortId);
    if (opts?.tab) setFeedInitialCommunityTab(opts.tab);
    setCurrentView('feed');
  }, []);

  useEffect(() => {
    if (currentView !== 'feed') {
      setFeedInitialCohortId(undefined);
      setFeedInitialCommunityTab(undefined);
    }
  }, [currentView]);

  const navigateToAssessment = () => {
    setCurrentView('assessment');
  }

  // Simulate finishing assessment and going to results
  const handleFinishAssessment = () => {
    // Set assessment results based on what's shown in AssessmentResult page:
    // - "Prepare Datasets in Power BI": 10/10 correct = 100 points (verified)
    // - "Connecting and Importing Data": 3/10 correct (7 incorrect) = 30 points
    // - "Preparing and Cleaning Data": 7/10 correct (3 incorrect) = 70 points
    // - "Visualizing and Reporting Clean Data": 6/10 correct (4 incorrect) = 60 points
    setAssessmentResults({
      "Prepare Datasets in Power BI": 100,
      "Connecting and Importing Data": 30,
      "Preparing and Cleaning Data": 70,
      "Visualizing and Reporting Clean Data": 60,
    });
    setCurrentView('assessment-result');
  }

  // Simulate successful retry leading to badge achievement
  const handleRetryAssessment = () => {
    setCurrentView('badge-achievement');
  }

  // Determine header props based on view
  const isAssessmentResultView = currentView === 'assessment-result' || currentView === 'badge-achievement';

  return (
    <SiteVariantProvider>
    <div className="flex flex-col h-screen bg-[var(--cds-color-grey-25)] text-[var(--cds-color-grey-975)]">
      <Header 
        currentSP={dailySP} // Use daily SP for the header goal
        dailyGoalSP={isAssessmentResultView ? 650 : dailyGoalSP} // Higher goal for result view
        learningItemsCompleted={dailyLearningItemsCompleted} 
        assignmentItemsCompleted={dailyAssignmentItemsCompleted} 
        onDailyGoalComplete={() => {
          // Disable modal popup on points threshold (e.g. at Cassie video) to prevent interruption
          // setShowDailyGoalsComplete(true);
          setDailyGoalCompletions(prev => prev + 1);
        }}
        hideProgress={true} // Always hide the top progress bar as per new design request
        backgroundColor={(currentView === 'dashboard' || currentView === 'home' || currentView === 'feed' || currentView === 'assessment' || isAssessmentResultView) ? 'bg-[var(--cds-color-white)]' : 'bg-[var(--cds-color-grey-25)]'}
        showPartnerLogo={currentView !== 'dashboard' && currentView !== 'home' && currentView !== 'feed' && currentView !== 'assessment' && !isAssessmentResultView}
        onLogoClick={navigateToHome}
        isHomeView={currentView === 'home' || currentView === 'dashboard' || currentView === 'feed'}
        showPrimaryNavLinks={
          currentView === 'home' ||
          currentView === 'dashboard' ||
          currentView === 'feed' ||
          currentView === 'learning'
        }
        onNavigate={(view) => setCurrentView(view)}
        careerTitle={currentView === 'home' || currentView === 'dashboard' || currentView === 'feed' ? 'Data Analyst' : undefined}
        primaryNavView={
          currentView === 'home' || currentView === 'dashboard' || currentView === 'feed'
            ? currentView
            : 'home'
        }
      />
      
      <div className="flex flex-1 overflow-hidden relative bg-[var(--cds-color-white)]">
        {currentView === 'home' && (
          <Home 
            onResume={handleResumeClick} 
            currentSP={totalSP} // Keep Total SP for leaderboard/overview
            courseData={courseData}
            dailySP={dailySP}
            dailyGoalSP={dailyGoalSP}
            learningItemsCompleted={dailyLearningItemsCompleted}
            assignmentItemsCompleted={dailyAssignmentItemsCompleted}
            learningPlan={learningPlan}
            dailyGoalCompletions={dailyGoalCompletions}
            assessmentResults={assessmentResults}
            onNavigateToDashboard={navigateToDashboard}
            onNavigateToFeed={navigateToFeed}
            onTakeSkillAssessment={navigateToAssessment}
            dailyTimeGoal={dailyTimeGoal}
            introModalClosed={true}
          />
        )}

        {currentView === 'feed' && (
          <FeedPage
            initialSelectedCohortId={feedInitialCohortId}
            initialCommunityTab={feedInitialCommunityTab}
          />
        )}

        {currentView === 'learning' && (
          <>
            <Sidebar 
              data={courseData} 
              activeLessonId={activeLessonId} 
              onSelectLesson={handleLessonSelect}
              shouldStartAnimation={true}
              onTrackCareer={navigateToDashboard}
              onAdjustPlan={() => setShowPersonalizeModal(true)}
              dailyTimeGoal={dailyTimeGoal}
              dailyGoalLessonIds={dailyGoalLessonIds}
              onShowDailyGoalProgress={handleShowDailyGoalProgress}
              dailyEarnedXP={dailySP}
              onShowSkillProgressModal={() => setShowSkillProgressModal(true)}
              onNavigateToMyLearning={navigateToDashboard}
              sessionTimeRemaining={sessionTimeRemaining}
              isSessionPaused={isSessionPaused}
              onPauseSession={handlePauseSession}
              onAddTime={handleAddTime}
            />
            <MainContent 
              activeLesson={activeLesson} 
              onNext={handleNext} 
              onMarkComplete={handleMarkLessonComplete}
              onTakeAssessment={navigateToAssessment}
              onViewSkillProgress={navigateToDashboard}
              showSkillProgressView={showSkillProgressView}
              onBackFromSkillProgress={handleBackFromSkillProgress}
              onResultsNextItem={handleResultsNextItem}
              nextLesson={nextLessonInfo.nextLesson}
              currentLessonIndex={nextLessonInfo.currentIndex}
              totalLessonsInGoal={nextLessonInfo.totalInGoal}
              autoPlayVideoOnMount={autoPlayLearningVideo}
              onConsumedAutoPlay={() => setAutoPlayLearningVideo(false)}
            />
          </>
        )}

        {currentView === 'dashboard' && (
          <MyLearning 
            onContinueCourse={navigateToLearning}
            activeLesson={activeLesson}
            courseData={courseData}
            totalSP={totalSP} // Keep Total SP for cumulative tracking
            dailyGoalCompletions={dailyGoalCompletions}
            onTakeSkillAssessment={navigateToAssessment}
            assessmentResults={assessmentResults}
          />
        )}

        {currentView === 'assessment' && (
          <AssessmentStart 
             onStart={handleFinishAssessment} 
             onNext={navigateToDashboard} 
          />
        )}

        {currentView === 'assessment-result' && (
          <AssessmentResult 
             onRetry={handleRetryAssessment}
             onViewSkillProgress={navigateToDashboard}
             assessmentResults={assessmentResults}
          />
        )}

        {currentView === 'badge-achievement' && (
          <BadgeAchievement 
            onHome={navigateToHome}
            onContinue={navigateToLearning}
            onTrackCareer={navigateToDashboard}
            assessmentResults={assessmentResults}
          />
        )}
        
        <ModuleCompletionModal 
          isOpen={showModuleComplete} 
          moduleTitle={completedModuleTitle}
          hoursLearned={completedModuleHours}
          itemsCompleted={completedModuleItems}
          onClose={() => setShowModuleComplete(false)}
          onTrackCareerProgress={navigateToDashboard}
          onSkillBreakdown={navigateToDashboard}
          totalModules={courseData.modules.length}
          completedModules={courseData.modules.filter(m => 
            m.lessons.every(l => l.status === Status.COMPLETED)
          ).length}
          moduleXP={(() => {
            const currentModule = courseData.modules.find(m => 
              m.lessons.some(l => l.id === activeLessonId)
            );
            if (!currentModule) return 0;
            return currentModule.lessons
              .filter(l => l.status === Status.COMPLETED)
              .reduce((acc, lesson) => acc + getSkillPoints(lesson.type), 0);
          })()}
          skills={SKILL_SUBSKILLS.map((name) => ({
            name,
            points: Math.min(25, cumulativeSkillPoints[name] || 0),
            total: 25,
            earnedXP: Math.min(8, goalSkillPoints[name] || 0)
          }))}
        />
        
        <DailyGoalsCompletionModal
          isOpen={showDailyGoalsComplete}
          onClose={() => setShowDailyGoalsComplete(false)}
          onTrackCareerProgress={navigateToDashboard}
          totalSP={totalSP}
        />

        <DailyGoalSummaryModal
          isOpen={showDailyGoalSummaryModal}
          onClose={() => {
            setShowDailyGoalSummaryModal(false);
            setCurrentGoalProgress(null);
            setIsEarlySessionEnd(false);
          }}
          onContinue={handleDailyGoalSummaryContinue}
          onPause={handlePauseForToday}
          hoursLearned={goalSummaryData.hoursLearned}
          itemsCompleted={goalSummaryData.itemsCompleted}
          earnedXP={currentGoalProgress?.earnedXP ?? dailyGoalEarnedXP}
          skills={goalSummaryData.skills}
          progressPercent={currentGoalProgress 
            ? Math.round((currentGoalProgress.earnedXP / currentGoalProgress.totalXP) * 100) 
            : (dailyGoalSP ? Math.round((dailyGoalEarnedXP / dailyGoalSP) * 100) : 0)}
          progressLabel={goalSummaryData.progressLabel}
          is1HourGoal={is1HourGoal}
          onVerifySkills={handleVerifySkillsFromSummary}
          showVerifyLink={goalSummaryData.showVerifyLink}
          skillTitle="Visualizing and Reporting Clean Data"
          totalModuleItems={courseStats.totalModuleLessons}
          completedModuleItems={courseStats.completedModuleLessons}
          courseCompletionPercent={courseStats.completionPercent}
          isEarlyEnd={isEarlySessionEnd}
        />

        {/* Pause Session Modal */}
        {showPauseModal && (
          <PauseSessionModal
            xpEarned={dailyGoalEarnedXP}
            itemsLeft={itemsLeftInGoal}
            timeRemaining={sessionTimeRemaining}
            onResume={handleResumeSession}
            onEndSession={handleEndSession}
          />
        )}

        <SkillMasteryModal
          isOpen={showSkillMasteryModal}
          onClose={handleSkillMasteryClose}
          onTakeAssessment={handleSkillMasteryTakeAssessment}
        />

        <SkillProgressModal
          isOpen={showSkillProgressModal}
          onClose={() => setShowSkillProgressModal(false)}
          onSeeFullProgress={() => {
            setShowSkillProgressModal(false);
            navigateToDashboard();
          }}
          skillName="Visualizing and Reporting Clean Data"
          skillPoints={Math.min(25, cumulativeSkillPoints["Visualizing and Reporting Clean Data"] || 0)}
          skillTotal={25}
          subSkills={subSkillsData}
        />

        {/* SkillAssessmentModal intentionally removed */}

        <PersonalizeLearningModal 
          isOpen={showPersonalizeModal}
          onClose={() => setShowPersonalizeModal(false)}
          onCreatePlan={handleCreatePlan}
        />

        <PlanConfirmationModal
          isOpen={showPlanConfirmationModal}
          onClose={() => setShowPlanConfirmationModal(false)}
          planType={learningPlan || 'Regular'}
          onStartLearning={handlePlanConfirmed}
        />

      </div>
    </div>
    </SiteVariantProvider>
  );
};

export default App;
