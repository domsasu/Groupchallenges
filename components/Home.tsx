
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icons } from './Icons';
import {
  CohortId,
  COHORTS,
  COHORT_LEADERBOARD,
  MiniLeaderboardRow,
} from './MyLearning';
import { LetterAvatar } from './WeeklyLearningLeaderboard';
import { CourseData, Status, ContentType } from '../types';
import { PlanType } from './PersonalizeLearningModal';
import {
  aggregateSkillPoints,
  courseCompletionDisplayPercent,
  SKILL_SUBSKILLS,
  buildDailyGoalLessonIds,
  sumLessonPoints,
} from '../skills';
import { useSiteVariant } from '../context/SiteVariantContext';
import { MiniFeed } from './MiniFeed';
import type { FeedCohortId } from '../constants/feedCohorts';
import { FEED_COHORT_META } from '../constants/feedCohorts';
import {
  formatChallengeCardHeroLabel,
  formatProgressGoalQuantityLine,
  parseChallengeGoalTotalUnits,
  MOCK_COMMUNITY_CHALLENGES,
  type CommunityChallenge,
} from '../constants/communityChallenges';
import { mergeCommunityChallengesWithStorage } from '../constants/communityChallengesPersistence';
import { resolveChallengeMiniCardImageSrc } from '../constants/challengeMiniCardImage';
import type { CommunitySurface, NavigateToCommunityOpts } from './FeedPage';

// Assessment sub-skill results type - matches App.tsx
interface AssessmentSubSkillResults {
  "Prepare Datasets in Power BI": number;
  "Connecting and Importing Data": number;
  "Preparing and Cleaning Data": number;
  "Visualizing and Reporting Clean Data": number;
}

interface HomeProps {
  onResume: () => void;
  currentSP: number;
  courseData: CourseData;
  dailySP: number;
  dailyGoalSP: number;
  learningItemsCompleted: number;
  assignmentItemsCompleted: number;
  learningPlan?: PlanType | null;
  dailyGoalCompletions?: number;
  assessmentResults?: AssessmentSubSkillResults | null;
  onNavigateToDashboard?: () => void;
  onNavigateToFeed?: (opts?: NavigateToCommunityOpts) => void;
  onTakeSkillAssessment?: () => void;
  dailyTimeGoal?: number;
  introModalClosed?: boolean;
  enrolledCoursesLoading?: boolean;
}

// Calculate career progress based on skills XP (matches MyLearning.tsx logic)
const calculateCareerProgress = (assessmentComplete: boolean, dataAcquisitionProgress: number): { earned: number; total: number; percentage: number } => {
  const maxTotalPoints = 100; // Each skill totals 100
  
  const skillsProgress = [
    assessmentComplete ? maxTotalPoints : dataAcquisitionProgress, // Data Acquisition and Preparation
    0,                       // Data Transformation and Manipulation
    100,                     // Data Analysis and Exploration (verified)
    0,                       // Data Visualization and Reporting
    0,                       // Statistical Modeling and Inference
    0,                       // Database Operations for Data Analysis
    0,                       // GenAI Assistance
  ];
  
  const totalEarned = skillsProgress.reduce((sum, p) => sum + p, 0);
  const totalPossible = skillsProgress.length * maxTotalPoints;
  const percentage = Math.round((totalEarned / totalPossible) * 100);
  
  return { earned: totalEarned, total: totalPossible, percentage };
};

type CourseCohort =
  | { style: 'enrolled'; hashtag: '#AIpowered' | '#workingparents'; count: number }
  | { style: 'trending'; hashtag: '#AIpowered' | '#workingparents' };

// Placeholder course card data
const recommendedCourses: Array<{
  id: number;
  title: string;
  provider: string;
  skills: string[];
  rating: number;
  reviews: string;
  level: string;
  duration: string;
  image: string;
  isTopRecommendation: boolean;
  cohort: CourseCohort;
}> = [
  {
    id: 1,
    title: "Generative AI for Data Scientists",
    provider: "IBM",
    skills: ["Python Programming", "Microsoft Excel", "Data Visualization"],
    rating: 4.8,
    reviews: "147K",
    level: "Beginner",
    duration: "6 months",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400",
    isTopRecommendation: true,
    cohort: { style: 'enrolled', hashtag: '#AIpowered', count: 12 },
  },
  {
    id: 2,
    title: "Generative AI for Data Scientists",
    provider: "IBM",
    skills: ["Python Programming", "Microsoft Excel", "Data Visualization"],
    rating: 4.8,
    reviews: "147K",
    level: "Beginner",
    duration: "6-4 months",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400",
    isTopRecommendation: false,
    cohort: { style: 'trending', hashtag: '#workingparents' },
  },
  {
    id: 3,
    title: "Generative AI for Data Scientists",
    provider: "IBM",
    skills: ["Python Programming", "Microsoft Excel", "Data Visualization"],
    rating: 4.8,
    reviews: "147K",
    level: "Beginner",
    duration: "6-6 months",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=400",
    isTopRecommendation: false,
    cohort: { style: 'enrolled', hashtag: '#workingparents', count: 8 },
  },
  {
    id: 4,
    title: "Generative AI",
    provider: "IBM",
    skills: ["Python Programming", "Microsoft Excel", "Data Visualization"],
    rating: 4.8,
    reviews: "147K",
    level: "Beginner",
    duration: "Profess...",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=400",
    isTopRecommendation: false,
    cohort: { style: 'trending', hashtag: '#AIpowered' },
  },
];

function cohortStatusFullText(cohort: CourseCohort): string {
  if (cohort.style === 'enrolled') {
    return `${cohort.count} in ${cohort.hashtag} enrolled`;
  }
  return `Trending in ${cohort.hashtag}`;
}

const COHORT_LINE_TYPE_MS = 32;

function RecommendedCourseCard({
  course,
}: {
  course: (typeof recommendedCourses)[number];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fullText = cohortStatusFullText(course.cohort);
  const [typed, setTyped] = useState('');
  const [shouldType, setShouldType] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const checkFullyInView = (entry: IntersectionObserverEntry) => {
      if (!entry.isIntersecting) return false;
      const br = entry.boundingClientRect;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return br.top >= -2 && br.bottom <= vh + 2 && br.height > 0;
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const ratioOk = entry.intersectionRatio >= 0.985;
          const h = entry.boundingClientRect.height;
          const visibleFrac =
            h > 0 ? entry.intersectionRect.height / h : 0;
          const mostlyVisible = visibleFrac >= 0.92;
          if (ratioOk || checkFullyInView(entry) || mostlyVisible) {
            setShouldType(true);
            io.disconnect();
            return;
          }
        }
      },
      {
        threshold: Array.from({ length: 21 }, (_, i) => i / 20),
        rootMargin: '0px',
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldType) return;
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setTyped(fullText.slice(0, i));
      if (i >= fullText.length) window.clearInterval(timer);
    }, COHORT_LINE_TYPE_MS);
    return () => window.clearInterval(timer);
  }, [shouldType, fullText]);

  return (
    <div
      ref={cardRef}
      className="bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] rounded-[var(--cds-border-radius-200)] overflow-hidden hover:shadow-[var(--cds-elevation-level2)] transition-shadow group flex-1 min-w-0 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative h-[130px] overflow-hidden rounded-[var(--cds-border-radius-100)] m-2">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 rounded-[var(--cds-border-radius-100)]"
          style={{ backgroundImage: `url("${course.image}")` }}
        />
        {course.isTopRecommendation && (
          <div className="absolute top-2 left-2 bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] cds-subtitle-sm text-[var(--cds-color-grey-975)] px-2 py-0.5 rounded-[var(--cds-border-radius-400)]">
            Top recommendation
          </div>
        )}
      </div>

      <div className="px-3 pb-3 pt-1 flex flex-col flex-1">
        {/* Partner label */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 border border-[var(--cds-color-grey-100)] rounded-[var(--cds-border-radius-50)] flex items-center justify-center shrink-0 bg-[var(--cds-color-white)]">
            <span className="cds-body-tertiary text-[var(--cds-color-grey-975)] leading-none" style={{ fontSize: '8px' }}>{course.provider.slice(0, 3)}</span>
          </div>
          <span className="cds-body-tertiary text-[var(--cds-color-grey-600)]">{course.provider}</span>
        </div>

        {/* Title */}
        <h3 className="cds-subtitle-md text-[var(--cds-color-grey-975)] mb-2 line-clamp-2">
          {course.title}
        </h3>

        {/* Skills */}
        <p className="cds-body-secondary text-[var(--cds-color-grey-600)] mb-2 line-clamp-2">
          <span className="cds-subtitle-sm text-[var(--cds-color-grey-975)]">Skills you&apos;ll gain: </span>
          {course.skills.join(', ')}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 cds-body-secondary text-[var(--cds-color-grey-600)] mb-1.5">
          <span className="material-symbols-rounded text-[var(--cds-color-grey-975)]" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-[var(--cds-color-grey-975)]">{course.rating}</span>
          <span>· {course.reviews} reviews</span>
        </div>

        {/* Meta */}
        <p className="cds-body-tertiary text-[var(--cds-color-grey-600)] mb-2">
          {course.level} · Professional Certificate · {course.duration}
        </p>

        {/* Social proof */}
        <div
          className="mb-2 flex items-start gap-1.5"
          role="status"
          aria-label={fullText}
        >
          <span
            className="material-symbols-rounded shrink-0 text-[var(--cds-color-green-700)]"
            aria-hidden
            style={{ fontSize: '16px' }}
          >
            {course.cohort.style === 'enrolled' ? 'groups' : 'trending_up'}
          </span>
          <div className="relative flex-1 min-w-0">
            <p className="cds-body-tertiary invisible whitespace-pre-wrap break-words" aria-hidden>
              {fullText}
            </p>
            <p className="cds-body-tertiary text-[var(--cds-color-green-700)] absolute left-0 top-0 whitespace-pre-wrap break-words">
              {typed}
            </p>
          </div>
        </div>

        {/* Why recommended */}
        {course.isTopRecommendation && (
          <button type="button" className="flex items-center gap-1 cds-body-tertiary text-[var(--cds-color-blue-700)] mb-2 hover:underline">
            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>auto_awesome</span>
            Why is this recommended?
          </button>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* CTA */}
        <button
          type="button"
          className="w-full bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] cds-action-secondary py-2 rounded-[var(--cds-border-radius-100)] transition-colors mt-2"
        >
          Enroll for free
        </button>
      </div>
    </div>
  );
}

const trendingItems = {
  mostPopular: [
    { title: "Google AI Essentials", provider: "Google", type: "Specialization", rating: 4.9, image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=128&h=128" },
    { title: "Agentic AI and AI Agents", provider: "Microsoft", type: "Course", rating: 4.9, image: "https://images.unsplash.com/photo-1515879218367-8466d910auj7?auto=format&fit=crop&q=80&w=128&h=128" },
    { title: "Agentic AI and AI Agents", provider: "Meta", type: "Course", rating: 4.9, image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=128&h=128" },
  ],
  weeklySpotlight: [
    { title: "Successful Negotiation: Essential", provider: "IBM", type: "Specialization", rating: 4.9, image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=128&h=128" },
    { title: "Successful Negotiation: Essential", provider: "IBM", type: "Professional Certificate", rating: 4.9, image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=128&h=128" },
    { title: "Successful Negotiation: Essential", provider: "Google", type: "Professional Certificate", rating: 4.9, image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=128&h=128" },
  ],
  earnDegree: [
    { title: "Excel Skills for Business", provider: "University of Illinois", type: "Specialization", rating: 4.9, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=128&h=128" },
    { title: "Prompt Engineering for ChatGPT", provider: "IBM", type: "Course", rating: 4.9, image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=128&h=128" },
    { title: "Strategic Leadership and...", provider: "Macquarie University", type: "Course", rating: 4.9, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=128&h=128" },
  ]
};

const inDemandSkills = [
  "Natural Language", "Prompt Engineering", "Python", "Generative AI", 
  "Computer Vision", "SQL", "Responsible AI", "Prompt Engineering",
  "Computer Vision", "Computer Vision", "Computer Vision"
];

const collectionCourses = [
  {
    id: 1,
    title: "English for Career Development",
    provider: "University of Pennsylvania",
    description: "Skills you'll gain: Business communication, Human Resources, Interviewing Skills, Verbal Communication Skills, Language Learning",
    rating: 4.8,
    reviews: "16K",
    level: "Beginner",
    duration: "1-3 months",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 2,
    title: "English for Career Development",
    provider: "University of Pennsylvania",
    description: "Skills you'll gain: Business communication, Human Resources, Interviewing Skills, Verbal Communication Skills, Language Learning",
    rating: 4.8,
    reviews: "16K",
    level: "Beginner",
    duration: "1-3 months",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 3,
    title: "English for Career Development",
    provider: "University of Pennsylvania",
    description: "Skills you'll gain: Business communication, Human Resources, Interviewing Skills, Verbal Communication Skills, Language Learning",
    rating: 4.8,
    reviews: "16K",
    level: "Beginner",
    duration: "1-3 months",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 4,
    title: "English for Career Development",
    provider: "University of Pennsylvania",
    description: "Skills you'll gain: Business communication, Human Resources, Interviewing Skills, Verbal Communication Skills, Language Learning",
    rating: 4.8,
    reviews: "16K",
    level: "Beginner",
    duration: "1-3 months",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400"
  }
];

function HomeSidebarMiniChallenge({
  challenge,
  cohortPill,
}: {
  challenge: CommunityChallenge;
  cohortPill: string;
}) {
  const lifecyclePillClass =
    challenge.lifecycle === 'active'
      ? 'bg-emerald-500/90 text-white'
      : challenge.lifecycle === 'upcoming'
        ? 'bg-amber-500/90 text-white'
        : 'bg-[var(--cds-color-grey-200)] text-[var(--cds-color-grey-800)]';
  const thumbSrc = resolveChallengeMiniCardImageSrc(challenge);
  const teamGoalTotal = parseChallengeGoalTotalUnits(challenge);
  const lastTarget = challenge.milestones[challenge.milestones.length - 1]?.target ?? '';
  const unitLabel = lastTarget.match(/\d+\s*(.+)/)?.[1]?.trim() ?? '';
  const completedUnits =
    teamGoalTotal != null && challenge.learnerContributionProgress != null
      ? Math.round(challenge.learnerContributionProgress * teamGoalTotal)
      : null;
  const showGoalBreakdown =
    challenge.learnerGoalUnits != null && completedUnits != null && teamGoalTotal != null;

  const [showPersonalGoal, setShowPersonalGoal] = useState(true);
  useEffect(() => {
    if (!showGoalBreakdown) return;
    const timer = setInterval(() => setShowPersonalGoal((v) => !v), 3000);
    return () => clearInterval(timer);
  }, [showGoalBreakdown]);

  return (
    <div className="flex w-full items-stretch gap-3 text-left">
      <div className="min-w-0 flex-1">
        <span
          className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold leading-tight ${lifecyclePillClass}`}
        >
          {formatChallengeCardHeroLabel(challenge)}
        </span>
        <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-[var(--cds-color-grey-975)]">{challenge.name}</p>
        <p className="mt-1 text-[11px] leading-snug text-[var(--cds-color-grey-600)]">
          {cohortPill} challenge
        </p>
        {showGoalBreakdown ? (
          <div className="relative mt-1 h-[16px] overflow-hidden">
            <AnimatePresence mode="wait">
              {showPersonalGoal ? (
                <motion.p
                  key="personal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 text-[11px] font-medium leading-snug tabular-nums text-[var(--cds-color-grey-600)]"
                >
                  Your goal: {completedUnits} / {challenge.learnerGoalUnits} {unitLabel}
                </motion.p>
              ) : (
                <motion.p
                  key="team"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 text-[11px] font-medium leading-snug tabular-nums text-[var(--cds-color-grey-400)]"
                >
                  Team goal: {teamGoalTotal} {unitLabel}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <p className="mt-1 text-[11px] font-medium leading-snug tabular-nums text-[var(--cds-color-grey-600)]">
            {formatProgressGoalQuantityLine(challenge) ??
              `${Math.round(Math.min(1, Math.max(0, challenge.cardProgress)) * 100)}%`}
          </p>
        )}
      </div>
      <div className="relative h-[88px] w-[min(88px,28%)] min-w-[72px] shrink-0 overflow-hidden rounded-[calc(var(--cds-border-radius-100)-2px)] bg-[var(--cds-color-grey-100)]">
        <img
          src={thumbSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

function HomeChallengeCarousel({
  challenges,
  onNavigateToFeed,
}: {
  challenges: CommunityChallenge[];
  onNavigateToFeed?: (opts?: NavigateToCommunityOpts) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const challenge = challenges[currentIndex];
  if (!challenge) return null;

  return (
    <div className="mt-3 border-t border-[var(--cds-color-grey-100)] pt-3">
      {onNavigateToFeed ? (
        <button
          type="button"
          onClick={() =>
            onNavigateToFeed({
              tab: 'challenges',
              cohortId: challenge.cohortId,
              challengeId: challenge.id,
            })
          }
          className="w-full rounded-[var(--cds-border-radius-100)] border border-transparent bg-[var(--cds-color-grey-25)] p-3 text-left transition hover:border-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-white)] focus-visible:border-[var(--cds-color-blue-700)]"
        >
          <HomeSidebarMiniChallenge
            challenge={challenge}
            cohortPill={FEED_COHORT_META[challenge.cohortId].pillLabel}
          />
        </button>
      ) : (
        <div className="rounded-[var(--cds-border-radius-100)] border border-transparent bg-[var(--cds-color-grey-25)] p-3">
          <HomeSidebarMiniChallenge
            challenge={challenge}
            cohortPill={FEED_COHORT_META[challenge.cohortId].pillLabel}
          />
        </div>
      )}

      {challenges.length > 1 && (
        <div className="mt-3 flex items-center gap-1.5">
          {challenges.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Challenge ${i + 1} of ${challenges.length}`}
              aria-current={i === currentIndex ? true : undefined}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === currentIndex
                  ? 'w-6 bg-[var(--cds-color-grey-975)]'
                  : 'w-2 bg-[var(--cds-color-grey-300)] hover:bg-[var(--cds-color-grey-500)]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HomeLeaderboard({
  selectedCohort,
  onSelectCohort,
}: {
  selectedCohort: CohortId;
  onSelectCohort: (id: CohortId) => void;
}) {
  const board = COHORT_LEADERBOARD[selectedCohort];

  return (
    <div className="rounded-[var(--cds-border-radius-200)] bg-[var(--cds-color-white)] p-4 sm:p-5">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <h2 className="cds-subtitle-lg text-[var(--cds-color-grey-975)]">Leaderboard</h2>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {COHORTS.map((cohort) => {
              const isActive = cohort.id === selectedCohort;
              return (
                <button
                  key={cohort.id}
                  type="button"
                  onClick={() => onSelectCohort(cohort.id)}
                  className={`cds-body-secondary h-8 rounded-[var(--cds-border-radius-400)] px-3 py-1 transition-colors ${
                    isActive
                      ? 'bg-[var(--cds-color-grey-800)] text-[var(--cds-color-white)]'
                      : 'bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] text-[var(--cds-color-grey-975)] hover:bg-[var(--cds-color-grey-25)]'
                  }`}
                >
                  {cohort.label}{' '}
                  <span className={isActive ? 'text-[var(--cds-color-grey-200)]' : 'text-[var(--cds-color-grey-600)]'}>
                    {cohort.members.toLocaleString()}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--cds-color-grey-600)] transition-colors hover:bg-[var(--cds-color-grey-50)] hover:text-[var(--cds-color-grey-975)]"
              aria-label="Join a cohort"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                add
              </span>
            </button>
          </div>
        </div>

        <p className="max-w-3xl cds-body-tertiary text-[var(--cds-color-grey-600)]">
          Rankings use total learning hours logged in the cohort you have selected. Use the cohort pills above to switch
          boards and compare how you rank.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-5">
            <p className="cds-body-tertiary mb-1.5 text-[var(--cds-color-grey-600)]">Top 3</p>
            <div className="space-y-1">
              {board.top3.map((p) => (
                <MiniLeaderboardRow key={p.rank} peer={p} isUser={p.rank === board.userRank} isMedal />
              ))}
            </div>
          </div>

          <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-5">
            <p className="cds-body-tertiary mb-1.5 text-[var(--cds-color-grey-600)]">Around you</p>
            <div className="space-y-1">
              {board.around.map((p) => (
                <MiniLeaderboardRow key={p.rank} peer={p} isUser={p.rank === board.userRank} isMedal={false} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** When true, shows the cohort’s active/upcoming challenge (e.g. Working Parents) under Weekly streaks. */
const SHOW_HOME_COHORT_SIDEBAR_CHALLENGE = false;

/** Hide Working Parents “nap time” cohort card under streaks; show joined challenges via `joinedActiveHomeSidebarChallenges` instead. */
const HOME_SIDEBAR_EXCLUDED_CHALLENGE_ID = 'ch-active-workingparents-nap-module';

export const Home: React.FC<HomeProps> = ({ 
    onResume, 
    currentSP, 
    courseData, 
    dailySP, 
    dailyGoalSP, 
    learningItemsCompleted, 
    assignmentItemsCompleted,
    learningPlan,
    dailyGoalCompletions = 0,
    assessmentResults,
    onNavigateToDashboard,
    onNavigateToFeed,
    onTakeSkillAssessment,
    dailyTimeGoal = 60,
    introModalClosed = true,
    enrolledCoursesLoading = false,
}) => {
  const { variant, surface } = useSiteVariant();
  const streakHoursCompletedToday = 0;

  const [selectedChip, setSelectedChip] = useState('chip1');
  const [selectedCohort, setSelectedCohort] = useState<CohortId>('workingparents');

  /** Merged with Community tab enrollment (localStorage) so progress/join state stays in sync. */
  const mergedCommunityChallenges = mergeCommunityChallengesWithStorage(MOCK_COMMUNITY_CHALLENGES);
  const cohortKey = selectedCohort as FeedCohortId;
  const cohortList = mergedCommunityChallenges.filter((c) => c.cohortId === cohortKey);
  const sidebarHomeChallenge =
    cohortList.find((c) => c.lifecycle === 'active') ?? cohortList.find((c) => c.lifecycle === 'upcoming') ?? null;

  /** Mini challenge cards under streaks: any active challenge the learner joined (Community tab state), except the Working Parents nap-module card. */
  const joinedActiveHomeSidebarChallenges = mergedCommunityChallenges.filter(
    (c) => c.optedIn && c.lifecycle === 'active'
  );

  // Intro video: muted by default, end state for "Continue watching"
  const [introVideoMuted, setIntroVideoMuted] = useState(true);
  const [introVideoEnded, setIntroVideoEnded] = useState(false);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  /** Mini-feed reel previews below — pause hero when they’re active on screen. */
  const [miniFeedPreviewVideosActive, setMiniFeedPreviewVideosActive] = useState(false);

  useEffect(() => {
    const v = introVideoRef.current;
    if (!v) return;
    if (miniFeedPreviewVideosActive) {
      v.pause();
    } else if (!introVideoEnded) {
      void v.play().catch(() => {});
    }
  }, [miniFeedPreviewVideosActive, introVideoEnded]);
  
  // Animated percentage counter state
  const [displayedPercentage, setDisplayedPercentage] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  
  // Calculate career progress percentage
  const isAssessmentComplete = !!assessmentResults;
  
  const completedLessonsForSkills = courseData.modules
    .flatMap((m) => m.lessons)
    .filter((lesson) => lesson.status === Status.COMPLETED);
  const earnedSkillPoints = aggregateSkillPoints(completedLessonsForSkills);
  const maxSubSkillPoints = 25;
  const subSkillPoints = SKILL_SUBSKILLS.reduce<Record<string, number>>((acc, name) => {
    acc[name] = Math.min(maxSubSkillPoints, earnedSkillPoints[name] || 0);
    return acc;
  }, {});
  const dataAcquisitionProgress = SKILL_SUBSKILLS.reduce((sum, name) => sum + subSkillPoints[name], 0);

  const careerProgress = calculateCareerProgress(isAssessmentComplete, dataAcquisitionProgress);

  // Course completion: completed lessons / total lessons
  const totalLessons = courseData.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = courseData.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.status === Status.COMPLETED).length, 0);
  const completionPercentage = courseCompletionDisplayPercent(
    completedLessons,
    totalLessons
  );

  // Animate course completion percentage when intro modal closes or when returning to homepage
  useEffect(() => {
    // Don't start animation until intro modal is closed
    if (!introModalClosed) return;
    
    // Reset to 0 when animation should start
    setDisplayedPercentage(0);
    setIsBreathing(false);
    
    let intervalId: NodeJS.Timeout | null = null;
    
    // Start animation after a small delay (target = course completion, not career progress)
    const startDelay = setTimeout(() => {
      const targetPercentage = completionPercentage;
      const duration = 1500; // 1.5 seconds
      const steps = targetPercentage;
      const stepDuration = duration / Math.max(steps, 1);
      
      let currentStep = 0;
      intervalId = setInterval(() => {
        currentStep++;
        setDisplayedPercentage(Math.min(currentStep, targetPercentage));
        
        if (currentStep >= targetPercentage) {
          if (intervalId) clearInterval(intervalId);
          // Trigger breathing animation
          setIsBreathing(true);
          setTimeout(() => setIsBreathing(false), 600);
        }
      }, stepDuration);
    }, 300);
    
    return () => {
      clearTimeout(startDelay);
      if (intervalId) clearInterval(intervalId);
    };
  }, [introModalClosed, completionPercentage]); // Trigger when modal closes or course completion changes

  // Calculate today's learning plan based on recommended 30 min option
  const todaysPlan = useMemo(() => {
    // Use recommended 30 minutes for home page display
    const recommendedMinutes = 30;
    
    // Find first incomplete lesson to use as start
    const allLessons = courseData.modules.flatMap(m => m.lessons);
    const firstIncomplete = allLessons.find(l => l.status !== Status.COMPLETED);
    const startLessonId = firstIncomplete?.id || allLessons[0]?.id || null;
    
    const dailyGoalLessonIds = buildDailyGoalLessonIds(courseData, startLessonId, recommendedMinutes);
    const dailyGoalLessons = dailyGoalLessonIds
      .map(id => allLessons.find(l => l.id === id))
      .filter((l): l is NonNullable<typeof l> => Boolean(l));
    
    const totalXP = sumLessonPoints(dailyGoalLessons);
    const lessonCount = dailyGoalLessons.length;
    
    // Get lesson titles for the description
    const lessonTitles = dailyGoalLessons.map(l => l.title);
    
    // Create a dynamic description based on lesson topics
    const topicKeywords = lessonTitles.flatMap(title => {
      const keywords: string[] = [];
      if (title.toLowerCase().includes('chart')) keywords.push('charts');
      if (title.toLowerCase().includes('visual')) keywords.push('visualizations');
      if (title.toLowerCase().includes('data')) keywords.push('data analysis');
      if (title.toLowerCase().includes('clean')) keywords.push('data cleaning');
      if (title.toLowerCase().includes('practice') || title.toLowerCase().includes('best')) keywords.push('best practices');
      return keywords;
    });
    const uniqueTopics = [...new Set(topicKeywords)].slice(0, 3);
    
    const description = uniqueTopics.length > 0 
      ? `Today you'll explore ${uniqueTopics.join(', ')}.`
      : `Build your data visualization skills.`;
    
    const firstLesson = dailyGoalLessons[0];
    return {
      skillName: "Visualizing and Reporting Clean Data",
      totalXP,
      lessonCount,
      timeLabel: "30 min",
      lessonTitles,
      description: `${description} Complete your daily goal and keep your streak going!`,
      firstLesson: firstLesson ? { title: firstLesson.title, type: firstLesson.type, duration: firstLesson.duration || '' } : null
    };
  }, [courseData]);

  // Typewriter animation state for today's plan description
  const [typedText, setTypedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  
  useEffect(() => {
    if (!introModalClosed) return;
    
    const text = todaysPlan.description;
    let index = 0;
    setTypedText('');
    setIsTypingComplete(false);
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setTypedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTypingComplete(true);
        clearInterval(typeInterval);
      }
    }, 25);
    
    return () => clearInterval(typeInterval);
  }, [todaysPlan.description, introModalClosed]);

  return (
    <div className="flex-1 bg-[var(--cds-color-white)] overflow-y-auto custom-scrollbar">
      
      {/* Hero Banner - theme from course (blue default, yellow for Sensory); `surface.*` scopes per site variant */}
      <div
        className={`relative ${courseData.theme === 'yellow' ? 'bg-[var(--cds-color-yellow-25)]' : 'bg-[var(--cds-color-emphasis-primary-bg-weak)]'} ${surface.homeHeroExtraClassName}`}
        data-site-variant={variant}
      >
        {/* Background pattern: Yellow BG for Sensory course, else BG image C */}
        <div
          aria-hidden
          className="absolute inset-0 bg-no-repeat bg-[right_top] bg-[length:min(85%,900px)_auto] opacity-[0.55] pointer-events-none"
          style={{ backgroundImage: `url("${courseData.theme === 'yellow' ? '/course2/Yellow BG.png' : '/BG image C.png'}")` }}
        />
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-8">
          {enrolledCoursesLoading ? (
            /* Skeleton: header bar + main card + sidebar */
            <>
              <div className="mb-2">
                <div className="min-w-0 space-y-3">
                  <div className="h-5 w-48 bg-[var(--cds-color-grey-100)] rounded animate-pulse" />
                  <div className="h-6 w-64 bg-[var(--cds-color-grey-100)] rounded animate-pulse" />
                  <div className="h-4 w-32 bg-[var(--cds-color-grey-100)] rounded animate-pulse mt-3" />
                  <div className="h-2 max-w-[395px] bg-[var(--cds-color-grey-100)] rounded-full animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                <div className="lg:col-span-9 h-[320px] min-h-[300px] bg-[var(--cds-color-grey-100)] rounded-xl animate-pulse" />
                <div className="lg:col-span-3 space-y-3">
                  <div className="h-[140px] bg-[var(--cds-color-grey-100)] rounded-xl animate-pulse" />
                  <div className="h-[180px] bg-[var(--cds-color-grey-100)] rounded-xl animate-pulse" />
                </div>
              </div>
            </>
          ) : (
          <>
          {/* Learning preview section */}
          <div className="mb-2">
            <div className="min-w-0 flex flex-col items-start text-left">
              <p className="cds-body-primary text-[var(--cds-color-grey-975)] mb-[4pt]">
                Priya, welcome back to your {courseData.isSpecialization ? (
                  <>
                    <span className="underline">{courseData.provider}</span>{' '}
                    <span className="underline">Specialization</span>{' '}
                    course
                  </>
                ) : 'Google Course'}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="cds-title-xs text-[var(--cds-color-grey-900)] underline text-left">
                  {courseData.title}
                </span>
              </div>
              {/* Course progress: bar + label to the right */}
              <div className="mt-[12pt] flex w-full max-w-[560px] items-center gap-3">
                <div className="h-2 w-full max-w-[296px] min-w-0 shrink bg-[var(--cds-color-grey-200)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--cds-color-green-700)] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, displayedPercentage))}%` }}
                    role="progressbar"
                    aria-valuenow={displayedPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Course progress"
                  />
                </div>
                <p className="cds-body-primary shrink-0 text-base text-[var(--cds-color-grey-975)]">
                  {displayedPercentage}% Course complete
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            
            {/* Left: Course Card - slides up from below into position */}
            <div className="lg:col-span-9 min-w-0 animate-widget-slide-up self-start">
              <div className="bg-[var(--cds-color-white)] rounded-[var(--cds-border-radius-200)] min-h-[300px] flex flex-col relative overflow-visible">
                {/* Background SVG - Cropped on right side */}
                <div className="absolute right-0 top-0 bottom-0 w-[50%] overflow-hidden pointer-events-none">
                  <img 
                    src="/Data analyst background.svg" 
                    alt="" 
                    className="absolute right-[-80px] top-1/2 -translate-y-1/2 h-[140%] w-auto opacity-60"
                  />
                </div>
                
                <div className="flex flex-col md:flex-row gap-0 w-full h-full relative z-10 min-h-[300px]">
                  {/* Course Info - Left Side: fixed 475px on md+ */}
                  <div className="flex flex-col justify-between min-w-[200px] md:w-[475px] md:shrink-0 md:h-full pt-8 pr-[40pt] pb-[22px] pl-8 min-h-0 rounded-t-xl md:rounded-tr-none md:rounded-l-xl">
                    <div>
                      <div className="flex flex-col items-start gap-1.5">
                        <h2 className="cds-subtitle-lg text-[var(--cds-color-grey-975)] mb-1">
                          {todaysPlan.firstLesson ? `Up next: ${todaysPlan.firstLesson.title}` : courseData.title}
                        </h2>
                        <p className="cds-body-tertiary text-[var(--cds-color-grey-500)]">
                          {todaysPlan.firstLesson
                            ? `${todaysPlan.firstLesson.type} • ${todaysPlan.firstLesson.duration}`
                            : 'Google Data Analytics & E-commerce Professional Certificate'}
                        </p>
                      </div>
                    </div>

                    {/* AI Summary (What you will learn today) */}
                    {todaysPlan.firstLesson && (
                      <div className="mt-5 w-full">
                        <div className="w-full rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-4">
                          <div className="flex items-start gap-2.5 mb-3">
                            <Icons.CoachSparkle className="w-4 h-4 shrink-0" />
                            <h3 className="cds-subtitle-sm text-[var(--cds-color-grey-975)]">
                              By continuing, you will learn:
                            </h3>
                          </div>
                          <p className="cds-body-secondary text-[var(--cds-color-grey-600)] leading-relaxed">
                            {todaysPlan.description}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex w-full flex-row flex-wrap items-center justify-between gap-4 pb-1">
                      <button
                        type="button"
                        onClick={onResume}
                        className="bg-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-800)] text-[var(--cds-color-white)] font-semibold px-4 py-2 rounded-lg transition-colors text-center cds-action-secondary w-auto min-w-[140px] shrink-0"
                      >
                        {completedLessons > 0 ? 'Resume learning' : 'Start learning'}
                      </button>
                      <div className="flex h-8 shrink-0 items-center justify-end rounded px-2.5 bg-[var(--cds-color-white)]">
                        <img
                          src={courseData.logoUrl || "/google-logo-9822%201.svg"}
                          alt={courseData.provider}
                          className="h-8 max-h-8 w-auto object-contain object-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hero: video (with mute/continue) or reading thumbnail image */}
                  <div className="relative w-full md:flex-1 min-w-0 min-h-0 overflow-hidden group cursor-pointer rounded-b-xl md:rounded-b-none md:rounded-r-xl">
                    {(() => {
                      const useReadingHero = courseData.heroImageUrl && !courseData.heroVideoUrl;
                      const firstIsReading = todaysPlan.firstLesson?.type === ContentType.READING;
                      const showImageHero = useReadingHero || firstIsReading;
                      if (showImageHero && courseData.heroImageUrl) {
                        return (
                          <>
                            <img
                              src={courseData.heroImageUrl}
                              alt=""
                              className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center"
                            />
                            <button
                              type="button"
                              onClick={onResume}
                              className="absolute inset-0 cursor-pointer border-0 p-0 bg-transparent"
                              aria-label="Start reading - open first learning item"
                            />
                          </>
                        );
                      }
                      const videoSrc = courseData.heroVideoUrl || "/Video/GOOGLE INTRO VIDEO 1.mov";
                      return (
                        <>
                          <video
                            ref={introVideoRef}
                            src={videoSrc}
                            className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center scale-[1.2]"
                            muted={introVideoMuted}
                            autoPlay
                            playsInline
                            loop={false}
                            onEnded={() => setIntroVideoEnded(true)}
                          />
                          {!introVideoEnded && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                              <button
                                type="button"
                                onClick={onResume}
                                className="absolute inset-0 z-0 cursor-pointer border-0 p-0 bg-transparent"
                                aria-label="Open first learning item"
                              />
                            </>
                          )}
                          {todaysPlan.firstLesson && !introVideoEnded && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextMuted = !introVideoMuted;
                                setIntroVideoMuted(nextMuted);
                                const v = introVideoRef.current;
                                if (v) {
                                  v.muted = nextMuted;
                                  if (!nextMuted) v.play().catch(() => {});
                                }
                              }}
                              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 transition-colors hover:bg-black/40"
                              aria-label={introVideoMuted ? 'Unmute' : 'Mute'}
                            >
                              {introVideoMuted ? (
                                <Icons.VolumeX className="h-4 w-4 text-[var(--cds-color-white)]" />
                              ) : (
                                <Icons.Volume className="h-4 w-4 text-[var(--cds-color-white)]" />
                              )}
                            </button>
                          )}
                          {introVideoEnded && (
                            <button
                              type="button"
                              onClick={onResume}
                              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--cds-color-white)] animate-fade-in-soft bg-black/75 cursor-pointer border-0 p-0"
                              aria-label="Continue watching - open first learning item"
                            >
                              <p className="cds-subtitle-lg font-semibold">Continue watching</p>
                              <Icons.ChevronRight className="w-8 h-8" />
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar: slides up from below after left */}
            <div className="lg:col-span-3 space-y-3 min-w-0 animate-widget-slide-up-delay">
              
              {/* Today's Goal Widget */}
              <div className="bg-[var(--cds-color-white)] rounded-[var(--cds-border-radius-200)] p-4">
                <h3 className="cds-subtitle-sm text-[var(--cds-color-grey-975)] mb-2">Today&apos;s goals</h3>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2 py-1">
                    <Icons.TodoStarDone className="w-6 h-6 shrink-0" />
                    <p className="cds-body-secondary text-[var(--cds-color-grey-600)]">Gain 12XP for completing learning items</p>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <Icons.TodoStarUndone className="w-6 h-6 shrink-0" />
                    <p className="cds-body-secondary text-[var(--cds-color-grey-600)]">Unlock daily goal stats on <span className="underline">My Learning</span></p>
                  </div>
                </div>
              </div>

              {/* Weekly Streaks */}
              <div className="bg-[var(--cds-color-white)] rounded-[var(--cds-border-radius-200)] p-4">
                <h3 className="cds-subtitle-sm text-[var(--cds-color-grey-975)] mb-2">1 week streak</h3>

                <div className="flex gap-2 mb-1">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, i) => {
                    const status: 'checked' | 'today' | 'future' =
                      i === 4 ? 'today' : i < 4 ? 'checked' : 'future';
                    return (
                      <div key={day} className={`w-8 h-8 rounded-[var(--cds-border-radius-100)] flex items-center justify-center border
                        ${status === 'checked' ? 'bg-[var(--cds-color-purple-25)] border-[var(--cds-color-purple-200)]' : ''}
                        ${status === 'today' ? 'bg-[var(--cds-color-white)] border-[var(--cds-color-grey-100)]' : ''}
                        ${status === 'future' ? 'bg-[var(--cds-color-white)] border-[var(--cds-color-grey-100)]' : ''}
                      `}>
                        {status === 'checked'
                          ? <span className="material-symbols-rounded text-[var(--cds-color-purple-700)]" style={{ fontSize: '22px' }}>done</span>
                          : <span className={`cds-body-secondary ${status === 'today' ? 'text-[var(--cds-color-grey-975)]' : 'text-[var(--cds-color-grey-600)]'}`}>{day}</span>
                        }
                      </div>
                    )
                  })}
                </div>

                <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">
                  {streakHoursCompletedToday} hr completed today · 6.5h learned total
                </p>

                {SHOW_HOME_COHORT_SIDEBAR_CHALLENGE && sidebarHomeChallenge && (
                  <div className="mt-3 border-t border-[var(--cds-color-grey-100)] pt-3">
                    {onNavigateToFeed ? (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToFeed({
                            tab: 'challenges',
                            cohortId: selectedCohort as FeedCohortId,
                          })
                        }
                        className="w-full rounded-[var(--cds-border-radius-100)] border border-transparent bg-[var(--cds-color-grey-25)] p-3 text-left transition hover:border-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-white)] focus-visible:border-[var(--cds-color-blue-700)]"
                      >
                        <HomeSidebarMiniChallenge challenge={sidebarHomeChallenge} cohortPill={FEED_COHORT_META[sidebarHomeChallenge.cohortId].pillLabel} />
                      </button>
                    ) : (
                      <div className="rounded-[var(--cds-border-radius-100)] border border-transparent bg-[var(--cds-color-grey-25)] p-3">
                        <HomeSidebarMiniChallenge challenge={sidebarHomeChallenge} cohortPill={FEED_COHORT_META[sidebarHomeChallenge.cohortId].pillLabel} />
                      </div>
                    )}
                  </div>
                )}
                {joinedActiveHomeSidebarChallenges.length > 0 && (
                  <HomeChallengeCarousel
                    challenges={joinedActiveHomeSidebarChallenges}
                    onNavigateToFeed={onNavigateToFeed}
                  />
                )}
              </div>

            </div>

          </div>
          </>
          )}
        </div>
      </div>

      {/* White Content Area */}
      <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-12">

        <HomeLeaderboard selectedCohort={selectedCohort} onSelectCohort={setSelectedCohort} />

        {/* Course Recommendations - loads in after top section */}
        <div className="animate-widget-slide-up-content">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="cds-subtitle-lg text-[var(--cds-color-grey-975)]">
              Master SQL as a <span className="underline">data analyst</span>
            </h2>
            <button className="flex items-center gap-1 cds-action-secondary text-[var(--cds-color-blue-700)] hover:underline">
              <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>auto_awesome</span>
              Edit
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {recommendedCourses.map((course) => (
              <RecommendedCourseCard key={course.id} course={course} />
            ))}
          </div>

          {/* Pagination dots */}
          <div className="flex gap-2 mt-4">
            <div className="w-6 h-2 bg-[var(--cds-color-grey-975)] rounded-full"></div>
            <div className="w-2 h-2 bg-[var(--cds-color-grey-200)] rounded-full"></div>
            <div className="w-2 h-2 bg-[var(--cds-color-grey-200)] rounded-full"></div>
          </div>
        </div>

        {/* Trending Now */}
        <div>
          <h2 className="cds-subtitle-lg text-[var(--cds-color-grey-975)] mb-3">Trending now</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Most Popular */}
            <div className="bg-[var(--cds-color-grey-25)] rounded-[var(--cds-border-radius-200)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="cds-subtitle-md text-[var(--cds-color-grey-975)]">Most popular</h3>
                <span className="material-symbols-rounded text-[var(--cds-color-grey-600)]" style={{ fontSize: '20px' }}>arrow_forward</span>
              </div>
              <div className="flex flex-col gap-2">
                {trendingItems.mostPopular.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[var(--cds-color-white)] rounded-[var(--cds-border-radius-100)] p-2 cursor-pointer group">
                    <div className="w-16 h-16 rounded-[var(--cds-border-radius-50)] shrink-0 overflow-hidden bg-[var(--cds-color-grey-100)]">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-[18px] h-[18px] border border-[var(--cds-color-grey-100)] rounded-[var(--cds-border-radius-50)] shrink-0 bg-[var(--cds-color-white)]" />
                        <span className="cds-body-secondary text-[var(--cds-color-grey-600)]">{item.provider}</span>
                      </div>
                      <p className="cds-subtitle-sm text-[var(--cds-color-grey-975)] group-hover:text-[var(--cds-color-blue-700)]">{item.title}</p>
                      <div className="flex items-center gap-2 cds-body-tertiary text-[var(--cds-color-grey-600)]">
                        <span>{item.type}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-rounded text-[var(--cds-color-grey-975)]" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>star</span>
                          {item.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Spotlight */}
            <div className="bg-[var(--cds-color-grey-25)] rounded-[var(--cds-border-radius-200)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="cds-subtitle-md text-[var(--cds-color-grey-975)]">Weekly spotlight</h3>
                <span className="material-symbols-rounded text-[var(--cds-color-grey-600)]" style={{ fontSize: '20px' }}>arrow_forward</span>
              </div>
              <div className="flex flex-col gap-2">
                {trendingItems.weeklySpotlight.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[var(--cds-color-white)] rounded-[var(--cds-border-radius-100)] p-2 cursor-pointer group">
                    <div className="w-16 h-16 rounded-[var(--cds-border-radius-50)] shrink-0 overflow-hidden bg-[var(--cds-color-grey-100)]">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-[18px] h-[18px] border border-[var(--cds-color-grey-100)] rounded-[var(--cds-border-radius-50)] shrink-0 bg-[var(--cds-color-white)]" />
                        <span className="cds-body-secondary text-[var(--cds-color-grey-600)]">{item.provider}</span>
                      </div>
                      <p className="cds-subtitle-sm text-[var(--cds-color-grey-975)] group-hover:text-[var(--cds-color-blue-700)]">{item.title}</p>
                      <div className="flex items-center gap-2 cds-body-tertiary text-[var(--cds-color-grey-600)]">
                        <span>{item.type}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-rounded text-[var(--cds-color-grey-975)]" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>star</span>
                          {item.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Earn a degree */}
            <div className="bg-[var(--cds-color-grey-25)] rounded-[var(--cds-border-radius-200)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="cds-subtitle-md text-[var(--cds-color-grey-975)]">Earn a degree</h3>
                <span className="material-symbols-rounded text-[var(--cds-color-grey-600)]" style={{ fontSize: '20px' }}>arrow_forward</span>
              </div>
              <div className="flex flex-col gap-2">
                {trendingItems.earnDegree.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[var(--cds-color-white)] rounded-[var(--cds-border-radius-100)] p-2 cursor-pointer group">
                    <div className="w-16 h-16 rounded-[var(--cds-border-radius-50)] shrink-0 overflow-hidden bg-[var(--cds-color-grey-100)]">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-[18px] h-[18px] border border-[var(--cds-color-grey-100)] rounded-[var(--cds-border-radius-50)] shrink-0 bg-[var(--cds-color-white)]" />
                        <span className="cds-body-secondary text-[var(--cds-color-grey-600)]">{item.provider}</span>
                      </div>
                      <p className="cds-subtitle-sm text-[var(--cds-color-grey-975)] group-hover:text-[var(--cds-color-blue-700)]">{item.title}</p>
                      <div className="flex items-center gap-2 cds-body-tertiary text-[var(--cds-color-grey-600)]">
                        <span>{item.type}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-rounded text-[var(--cds-color-grey-975)]" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>star</span>
                          {item.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* In-demand Skills */}
        <div>
          <h2 className="cds-subtitle-lg text-[var(--cds-color-grey-975)] mb-4">In-demand skills</h2>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {inDemandSkills.map((skill, idx) => (
                <button
                  key={idx}
                  className="px-3 py-2 bg-[var(--cds-color-blue-25)] rounded-full cds-body-secondary text-[var(--cds-color-grey-975)] hover:bg-[var(--cds-color-blue-50)] transition-colors"
                >
                  {skill}
                </button>
              ))}
            </div>
            <button className="bg-[var(--cds-color-white)] rounded-[var(--cds-border-radius-100)] p-2 flex items-center justify-center shrink-0">
              <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>chevron_right</span>
            </button>
          </div>
        </div>

        {/* Collection Title */}
        <div>
          <h2 className="cds-subtitle-lg text-[var(--cds-color-grey-975)] mb-2">Collection Title</h2>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-1 mb-4">
            {['Chip 1', 'Chip 2', 'Chip 3'].map((chip, idx) => (
              <button
                key={chip}
                onClick={() => setSelectedChip(`chip${idx + 1}`)}
                className={`cds-body-secondary h-8 rounded-[var(--cds-border-radius-400)] px-3 py-1 transition-colors ${
                  selectedChip === `chip${idx + 1}`
                    ? 'bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] text-[var(--cds-color-grey-975)]'
                    : 'bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] text-[var(--cds-color-grey-975)] hover:bg-[var(--cds-color-grey-25)]'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Collection Cards */}
          <div className="flex gap-4">
            {collectionCourses.map((course) => (
              <div key={course.id} className="bg-[var(--cds-color-white)] border-2 border-[var(--cds-color-grey-100)] rounded-[var(--cds-border-radius-200)] overflow-hidden hover:shadow-[var(--cds-elevation-level2)] transition-shadow group flex-1 min-w-0 flex flex-col">
                {/* Course Image */}
                <div className="relative h-[171px] overflow-hidden rounded-[var(--cds-border-radius-100)] m-2">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 rounded-[var(--cds-border-radius-100)]" style={{ backgroundImage: `url("${course.image}")` }}></div>
                </div>

                {/* Course Content */}
                <div className="px-3 pb-3 pt-1 flex flex-col flex-1">
                  {/* Partner */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-6 h-6 border border-[var(--cds-color-grey-100)] rounded-[var(--cds-border-radius-50)] flex items-center justify-center shrink-0 bg-[var(--cds-color-white)]">
                      <span className="cds-body-tertiary text-[var(--cds-color-grey-975)] leading-none" style={{ fontSize: '8px' }}>UP</span>
                    </div>
                    <span className="cds-body-secondary text-[var(--cds-color-grey-600)]">{course.provider}</span>
                  </div>

                  {/* Title */}
                  <h3 className="cds-subtitle-md text-[var(--cds-color-grey-975)] mb-2">{course.title}</h3>

                  {/* Description */}
                  <p className="cds-body-secondary text-[var(--cds-color-grey-600)] mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  <div className="flex-1" />

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-1">
                    <span className="material-symbols-rounded text-[var(--cds-color-grey-975)]" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="cds-subtitle-md text-[var(--cds-color-grey-975)]">{course.rating}</span>
                    <span className="cds-body-secondary text-[var(--cds-color-grey-600)] ml-1">{course.reviews} reviews</span>
                  </div>

                  {/* Meta */}
                  <p className="cds-body-secondary text-[var(--cds-color-grey-600)]">
                    {course.level} · Course · {course.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Show more button */}
          <div className="mt-4">
            <button className="cds-action-secondary px-4 py-2 border border-[var(--cds-color-blue-700)] text-[var(--cds-color-blue-700)] rounded-[var(--cds-border-radius-100)] hover:bg-[var(--cds-color-blue-25)] transition-colors">
              Show more
            </button>
          </div>
        </div>

        {/* Mini feed — bottom of home; See all opens Community */}
        {onNavigateToFeed ? (
          <MiniFeed
            onOpenFeed={onNavigateToFeed}
            onMiniFeedClipPlayingChange={setMiniFeedPreviewVideosActive}
          />
        ) : null}

      </div>
    </div>
  );
};
