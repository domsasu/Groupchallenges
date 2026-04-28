
import React, { useState } from 'react';
import { CourseData, Lesson, Status } from '../types';
import { courseCompletionDisplayPercent } from '../skills';
import { LetterAvatar } from './WeeklyLearningLeaderboard';

interface MyLearningProps {
  onContinueCourse: () => void;
  activeLesson: Lesson;
  courseData: CourseData;
  totalSP: number;
  dailyGoalCompletions: number;
  onTakeSkillAssessment?: () => void;
  assessmentResults?: Record<string, number> | null;
}

type TabId = 'in-progress' | 'saved' | 'completed' | 'skills';

const TABS: { id: TabId; label: string }[] = [
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'saved', label: 'Saved' },
  { id: 'skills', label: 'Certificates & Badges' },
];

/* ------------------------------------------------------------------ */
/*  March 2026 calendar data                                          */
/* ------------------------------------------------------------------ */
const MARCH_2026_OFFSET = 6; // March 1 2026 is a Sunday → 6 blank cells (Mon-start grid)
const MARCH_2026_DAYS = 31;
const TODAY = 24;
const COMPLETED_DAYS = new Set([2, 3, 5, 9, 10, 11, 12, 16, 17, 18, 19, 20, 23]);
const ALL_GOALS_DAYS = new Set([3, 10, 11, 17, 18, 19]);

/* ------------------------------------------------------------------ */
/*  Mock enrolled specialization data                                 */
/* ------------------------------------------------------------------ */
const SENSORY_DESCRIPTION =
  'Foundations of Sensory Science explores how to use human senses to evaluate a wide variety of food, beverage, and non-food products. This specialization is for anyone interested in understanding and deepening their appreciation of products that are experienced with the senses. This may include people interested in sensory science as a profession, consumer';
const SENSORY_COURSES = [
  'Introduction to Sensory Science',
  'Sensory Practices and Principles',
  'Advanced Sensory Evaluation',
  'Sensory Science Capstone',
];

/* ------------------------------------------------------------------ */
/*  Left Sidebar                                                      */
/* ------------------------------------------------------------------ */

function TodaysGoals() {
  const items = [
    { icon: 'star', text: 'Complete any 3 learning items · 0/3' },
    { icon: 'menu_book', text: 'Complete a reading' },
    { icon: 'local_fire_department', text: 'Progress toward your weekly streak' },
  ];
  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-4">
      <h3 className="cds-action-secondary text-[var(--cds-color-grey-975)] mb-3">
        Today's goals
      </h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.text} className="flex items-start gap-2">
            <span className="material-symbols-rounded text-[var(--cds-color-blue-700)] shrink-0" style={{ fontSize: 20 }}>
              {item.icon}
            </span>
            <span className="cds-body-secondary text-[var(--cds-color-grey-700)]">
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LearningPlanCalendar() {
  // Sunday-start calendar (per Figma)
  const dayHeaderLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  // March 1, 2026 is a Sunday → offset 0 for Sunday-start grid
  const sundayOffset = 0;

  const blanks = Array.from({ length: sundayOffset }, (_, i) => (
    <div key={`blank-${i}`} />
  ));

  const days = Array.from({ length: MARCH_2026_DAYS }, (_, i) => {
    const day = i + 1;
    const isToday = day === TODAY;
    const isAllGoals = ALL_GOALS_DAYS.has(day);
    const isCompleted = COMPLETED_DAYS.has(day);

    let cellClass =
      'flex h-9 w-9 items-center justify-center rounded-full cds-body-secondary transition-colors cursor-default';
    if (isToday) {
      cellClass += ' border-2 border-[var(--cds-color-emphasis-quaternary-bg-strong)] text-[var(--cds-color-emphasis-quaternary-bg-strong)]';
    } else if (isCompleted || isAllGoals) {
      cellClass += ' relative text-[var(--cds-color-grey-975)]';
    } else if (day > TODAY) {
      cellClass += ' text-[var(--cds-color-grey-400)]';
    } else {
      cellClass += ' text-[var(--cds-color-grey-975)]';
    }

    return (
      <div key={day} className="flex items-center justify-center">
        <div className={cellClass}>
          {day}
          {isCompleted && !isToday && (
            <span className={`absolute bottom-[5px] left-0 right-0 mx-auto rounded-full ${isAllGoals ? 'h-[2px] w-3 bg-[var(--cds-color-emphasis-quaternary-bg-strong)]' : 'h-[5px] w-[5px] bg-[var(--cds-color-emphasis-quaternary-bg-strong)]'}`} />
          )}
        </div>
      </div>
    );
  });

  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-5">
      {/* Month header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="cds-subtitle-md text-[var(--cds-color-grey-975)]">January 2026</span>
        <div className="flex items-center gap-1">
          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-600)]">
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>chevron_left</span>
          </button>
          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-600)]">
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center mb-1">
        {dayHeaderLabels.map((h) => (
          <div key={h} className="cds-body-tertiary text-[var(--cds-color-grey-600)] py-1.5">{h}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {blanks}
        {days}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 cds-body-tertiary text-[var(--cds-color-grey-600)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--cds-color-emphasis-quaternary-bg-strong)]" />
          1+ items completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 rounded-full bg-[var(--cds-color-emphasis-quaternary-bg-strong)]" />
          All daily goals completed
        </span>
      </div>

      {/* Last 4 weeks */}
      <div className="mt-4 pt-4 border-t border-[var(--cds-color-grey-100)]">
        <p className="cds-subtitle-md text-[var(--cds-color-grey-600)] mb-3">Last 4 weeks</p>
        <div className="flex gap-6">
          <div>
            <p className="cds-title-xs text-[var(--cds-color-grey-975)]">20</p>
            <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">Daily goals completed</p>
          </div>
          <div>
            <p className="cds-title-xs text-[var(--cds-color-grey-975)]">50</p>
            <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">Minutes learned</p>
          </div>
          <div>
            <p className="cds-title-xs text-[var(--cds-color-grey-975)]">20</p>
            <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">Items completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cohort Selection                                                  */
/* ------------------------------------------------------------------ */

export type CohortId = 'enrolled' | 'ai' | 'workingparents';

export const COHORTS: { id: CohortId; label: string; members: number; summary: string }[] = [
  {
    id: 'workingparents',
    label: '#workingparents',
    members: 634,
    summary:
      'Parents fitting coursework around nap time, daycare, and school pickups—small daily blocks add up.',
  },
  {
    id: 'enrolled',
    label: '#coursera',
    members: 1255,
    summary: 'The broader Coursera learner community. Track how your cohort engages with courses over time.',
  },
  {
    id: 'ai',
    label: '#AIpowered',
    members: 842,
    summary: 'Focused on AI, ML, and data. Compare study habits and stay motivated with learners on a similar path.',
  },
];

export interface LeaderboardPeer {
  rank: number;
  letter: string;
  name: string;
  hours: string;
  isLive?: boolean;
}

export const COHORT_LEADERBOARD: Record<CohortId, { top3: LeaderboardPeer[]; around: LeaderboardPeer[]; userRank: number }> = {
  enrolled: {
    top3: [
      { rank: 1, letter: 'M', name: 'Maria Montessori', hours: '16h', isLive: true },
      { rank: 2, letter: 'J', name: 'John Dewey', hours: '15.5h' },
      { rank: 3, letter: 'P', name: 'Paulo Freire', hours: '15h' },
    ],
    around: [
      { rank: 14, letter: 'T', name: 'Thomas Gallaudet', hours: '9.5h' },
      { rank: 15, letter: 'P', name: 'Priya', hours: '9h' },
      { rank: 16, letter: 'A', name: 'Anton Makarenko', hours: '8.5h', isLive: true },
    ],
    userRank: 15,
  },
  ai: {
    top3: [
      { rank: 1, letter: 'A', name: 'Ada Lovelace', hours: '19h', isLive: true },
      { rank: 2, letter: 'A', name: 'Alan Turing', hours: '17.5h' },
      { rank: 3, letter: 'G', name: 'Geoffrey Hinton', hours: '17h' },
    ],
    around: [
      { rank: 5, letter: 'Y', name: 'Yann LeCun', hours: '16h' },
      { rank: 6, letter: 'P', name: 'Priya', hours: '15h' },
      { rank: 7, letter: 'A', name: 'Andrew Ng', hours: '15h' },
    ],
    userRank: 6,
  },
  workingparents: {
    top3: [
      { rank: 1, letter: 'M', name: 'Maya Chen', hours: '15h', isLive: true },
      { rank: 2, letter: 'R', name: 'Ravi Patel', hours: '14.5h' },
      { rank: 3, letter: 'S', name: 'Sam Okonkwo', hours: '14h' },
    ],
    around: [
      { rank: 17, letter: 'V', name: 'Vik Desai', hours: '7h' },
      { rank: 18, letter: 'P', name: 'Priya', hours: '6.5h' },
      { rank: 19, letter: 'Z', name: 'Zoe Martin', hours: '6h', isLive: true },
    ],
    userRank: 18,
  },
};

export const HONOR_MEDAL_SRC: Record<1 | 2 | 3, string> = {
  1: '/1%20honor.svg',
  2: '/2%20honor.svg',
  3: '/3%20honor.svg',
};

export function MiniLeaderboardRow({
  peer,
  isUser,
  isMedal,
  compact,
}: {
  peer: LeaderboardPeer;
  isUser: boolean;
  isMedal: boolean;
  /** Tighter row for condensed layouts (e.g. Home). Parent panel should use `p-3` when compact. */
  compact?: boolean;
}) {
  const pad = compact ? '-mx-3 px-3' : '-mx-5 px-5';
  return (
    <div
      className={`flex items-center gap-1.5 ${
        compact ? 'h-8 min-h-8' : 'h-[38px] min-h-[38px]'
      } ${isUser ? `rounded-none bg-[#FFF4E8] ${pad}` : ''}`}
    >
      <span className={`${compact ? 'w-6' : 'w-7'} shrink-0 text-left`}>
        {isMedal ? (
          <img
            src={HONOR_MEDAL_SRC[peer.rank as 1 | 2 | 3]}
            alt=""
            className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} inline-block`}
            aria-hidden
          />
        ) : (
          <span
            className={`tabular-nums text-left text-xs ${isUser ? 'cds-action-secondary text-[var(--cds-color-grey-975)]' : 'cds-body-secondary text-[var(--cds-color-grey-600)]'}`}
          >
            {peer.rank}
          </span>
        )}
      </span>
      <LetterAvatar
        letter={peer.letter}
        seed={peer.name}
        isLive={isUser || !!peer.isLive}
        size={compact ? 'compact' : 'leaderboard'}
      />
      <span
        className={`min-w-0 flex-1 truncate ${compact ? 'text-xs' : ''} ${isUser ? 'cds-action-secondary text-[var(--cds-color-grey-975)]' : 'cds-body-secondary text-[var(--cds-color-grey-975)]'}`}
      >
        {peer.name}
      </span>
      <span
        className={`shrink-0 tabular-nums ${compact ? 'text-xs' : ''} ${isUser ? 'cds-action-secondary text-[var(--cds-color-grey-975)]' : 'cds-body-secondary text-[var(--cds-color-grey-600)]'}`}
      >
        {peer.hours}
      </span>
    </div>
  );
}

function CohortLeaderboard({
  selectedCohort,
  onSelectCohort,
}: {
  selectedCohort: CohortId;
  onSelectCohort: (id: CohortId) => void;
}) {
  const activeCohort = COHORTS.find((c) => c.id === selectedCohort);

  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="cds-subtitle-md text-[var(--cds-color-grey-975)]">Cohorts</h3>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-600)] hover:text-[var(--cds-color-grey-975)] transition-colors"
          aria-label="Join a cohort"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
        </button>
      </div>

      {/* Cohort chips */}
      <div className="flex flex-wrap gap-2">
        {COHORTS.map((cohort) => {
          const isActive = cohort.id === selectedCohort;
          return (
            <button
              key={cohort.id}
              type="button"
              onClick={() => onSelectCohort(cohort.id)}
              className={`cds-body-tertiary rounded-[var(--cds-border-radius-400)] px-3 py-1.5 transition-colors ${
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
      </div>

      {activeCohort && (
        <div className="mt-4 pt-4 border-t border-[var(--cds-color-grey-100)]">
          <p className="cds-action-secondary text-[var(--cds-color-grey-975)]">{activeCohort.label}</p>
          <p className="cds-body-secondary text-[var(--cds-color-grey-600)] mt-1">
            {activeCohort.members.toLocaleString()} members
          </p>
          <p className="cds-body-secondary text-[var(--cds-color-grey-700)] mt-3 leading-snug">
            {activeCohort.summary}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Content — Course Cards                                       */
/* ------------------------------------------------------------------ */

function SpecializationCard({
  onResume,
}: {
  onResume: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeCourse, setActiveCourse] = useState(0);

  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] overflow-hidden">
      {/* Top section: image + info */}
      <div className="flex gap-4 p-5 pb-0">
        <img
          src="/course2/sensory-cert-hero.png"
          alt="Essentials of Sensory Science"
          className="h-[100px] w-[100px] shrink-0 rounded-[var(--cds-border-radius-100)] object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/course2/UC-Davis-Emblem.png';
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="cds-subtitle-md text-[var(--cds-color-grey-975)]">
              Essentials of Sensory Science
            </h3>
            <button type="button" className="shrink-0 text-[var(--cds-color-grey-600)] hover:text-[var(--cds-color-grey-975)]">
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>more_horiz</span>
            </button>
          </div>
          <p className={`cds-body-secondary text-[var(--cds-color-grey-600)] mt-1 ${expanded ? '' : 'line-clamp-3'}`}>
            {SENSORY_DESCRIPTION}
          </p>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="cds-action-secondary text-[var(--cds-color-blue-700)] hover:underline mt-1 flex items-center gap-0.5"
          >
            {expanded ? 'Less' : 'More'}
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {/* Course selector row */}
      <div className="px-5 pt-3 pb-3 flex items-center gap-3">
        <span className="cds-body-secondary text-[var(--cds-color-grey-600)] shrink-0">
          {SENSORY_COURSES.length} courses
        </span>
        <div className="flex gap-2">
          {SENSORY_COURSES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveCourse(idx)}
              className={`flex h-7 w-7 items-center justify-center rounded-full cds-body-secondary transition-colors ${
                idx === activeCourse
                  ? 'border-2 border-[var(--cds-color-blue-700)] text-[var(--cds-color-blue-700)]'
                  : 'bg-[var(--cds-color-grey-100)] text-[var(--cds-color-grey-600)]'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Expand/collapse chevron */}
      <div className="flex justify-center pb-1">
        <span className="material-symbols-rounded text-[var(--cds-color-grey-400)]" style={{ fontSize: 20 }}>
          expand_more
        </span>
      </div>

      {/* Active sub-course row */}
      <div className="border-t border-[var(--cds-color-grey-100)] flex items-center gap-4 px-5 py-4">
        <img
          src="/course2/UC-Davis-Emblem.png"
          alt="UC Davis"
          className="h-14 w-14 shrink-0 rounded-[var(--cds-border-radius-100)] object-contain bg-[var(--cds-color-grey-25)] p-1"
        />
        <div className="min-w-0 flex-1">
          <p className="cds-action-secondary text-[var(--cds-color-grey-975)]">
            {SENSORY_COURSES[activeCourse]}
          </p>
          <p className="cds-body-tertiary text-[var(--cds-color-grey-600)] mt-0.5">
            Started
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="cds-body-tertiary text-[var(--cds-color-grey-600)] shrink-0">
                Progress: 2%
              </span>
              <div className="h-1.5 flex-1 rounded-full bg-[var(--cds-color-grey-100)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--cds-color-green-700)]" style={{ width: '2%' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="cds-body-tertiary text-[var(--cds-color-grey-600)] flex items-center gap-1 whitespace-nowrap">
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>flag</span>
            Ends on Mar 30, 2026
          </span>
          <button
            type="button"
            onClick={onResume}
            className="cds-action-secondary rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-5 py-1.5 text-[var(--cds-color-white)] hover:bg-[var(--cds-color-blue-800)] transition-colors"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}

function PickUpBanner() {
  return (
    <div className="flex items-start gap-3 rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-yellow-200)] bg-[var(--cds-color-yellow-25)] px-5 py-4">
      <span className="material-symbols-rounded text-[var(--cds-color-yellow-700)] shrink-0 mt-0.5" style={{ fontSize: 20 }}>
        info
      </span>
      <div className="min-w-0 flex-1">
        <p className="cds-action-secondary text-[var(--cds-color-grey-975)]">
          Pick up where you left off
        </p>
        <p className="cds-body-secondary text-[var(--cds-color-grey-700)] mt-0.5">
          Don't let the great things you learned fade away! Reset your deadlines and complete your assignments every week.
        </p>
      </div>
      <button
        type="button"
        className="cds-action-secondary shrink-0 rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-red-700)] px-4 py-1.5 text-[var(--cds-color-red-700)] hover:bg-[var(--cds-color-red-25)] transition-colors whitespace-nowrap"
      >
        Reset my deadlines
      </button>
    </div>
  );
}

function SecondCourseCard({
  courseData,
  onContinue,
}: {
  courseData: CourseData;
  onContinue: () => void;
}) {
  const totalLessons = courseData.modules.reduce((a, m) => a + m.lessons.length, 0);
  const completedLessons = courseData.modules.reduce(
    (a, m) => a + m.lessons.filter((l) => l.status === Status.COMPLETED).length,
    0
  );
  const pct = courseCompletionDisplayPercent(completedLessons, totalLessons);

  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] overflow-hidden">
      <div className="flex gap-4 p-5">
        <img
          src="/google-logo-9822%201.svg"
          alt="Google"
          className="h-14 w-14 shrink-0 rounded-[var(--cds-border-radius-100)] object-contain bg-[var(--cds-color-grey-25)] p-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="cds-subtitle-md text-[var(--cds-color-grey-975)]">
              Vibe Coding Essentials - Build Apps with AI
            </h3>
            <button type="button" className="shrink-0 text-[var(--cds-color-grey-600)] hover:text-[var(--cds-color-grey-975)]">
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>more_horiz</span>
            </button>
          </div>
          <p className="cds-body-secondary text-[var(--cds-color-grey-600)] mt-1 line-clamp-2">
            Learn to build full-stack applications using AI coding assistants. This course covers prompt engineering for code generation, debugging with AI, and deploying modern web apps — no prior coding experience required.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="cds-body-tertiary text-[var(--cds-color-grey-600)]">
              Progress: {pct}%
            </span>
            <div className="h-1.5 w-32 rounded-full bg-[var(--cds-color-grey-100)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--cds-color-green-700)]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <button
              type="button"
              onClick={onContinue}
              className="cds-action-secondary text-[var(--cds-color-blue-700)] hover:underline ml-auto"
            >
              Continue learning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

export const MyLearning: React.FC<MyLearningProps> = ({
  onContinueCourse,
  courseData,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('in-progress');
  const [selectedCohort, setSelectedCohort] = useState<CohortId>('workingparents');

  return (
    <div className="flex flex-col flex-1 overflow-y-auto max-w-[1440px] mx-auto bg-[var(--cds-color-white)] custom-scrollbar">
      {/* Greeting header */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--cds-color-blue-700)] flex items-center justify-center text-[var(--cds-color-white)] cds-action-primary shrink-0">
            PP
          </div>
          <div>
            <h1 className="cds-title-xs text-[var(--cds-color-grey-975)]">Good morning, Priya</h1>
            <p className="cds-body-secondary text-[var(--cds-color-grey-600)]">
              Your goal is to start your career as a <span className="underline">Data Analyst</span>{'  '}<a href="#" className="text-[var(--cds-color-blue-700)]">Edit goal</a>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs — underline style per Figma */}
      <div className="sticky top-0 z-10 bg-[var(--cds-color-white)] px-6 border-b border-[var(--cds-color-grey-100)]">
        <div className="flex gap-6">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`cds-body-secondary py-3 transition-colors border-b-2 ${
                  isActive
                    ? 'border-[var(--cds-color-grey-975)] text-[var(--cds-color-grey-975)]'
                    : 'border-transparent text-[var(--cds-color-grey-600)] hover:text-[var(--cds-color-grey-975)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column content */}
      <div className="flex gap-6 px-6 pb-10 pt-6">
        {/* Main content - left */}
        <div className="flex-1 min-w-0 space-y-5">
          {activeTab === 'in-progress' && (
            <>
              <SpecializationCard onResume={onContinueCourse} />
              <SecondCourseCard courseData={courseData} onContinue={onContinueCourse} />
            </>
          )}

          {activeTab === 'saved' && (
            <EmptyTab icon="bookmark" title="Saved courses" body="Courses you save will appear here so you can come back to them later." />
          )}

          {activeTab === 'completed' && (
            <EmptyTab icon="check_circle" title="Completed courses" body="Courses you finish will appear here along with your certificates." />
          )}

          {activeTab === 'skills' && (
            <EmptyTab icon="workspace_premium" title="Certificates & Badges" body="Your earned certificates and badges will appear here." />
          )}
        </div>

        {/* Right sidebar */}
        <aside className="hidden md:flex w-[400px] shrink-0 flex-col gap-4">
          <LearningPlanCalendar />
          <CohortLeaderboard selectedCohort={selectedCohort} onSelectCohort={setSelectedCohort} />
        </aside>
      </div>
    </div>
  );
};

function EmptyTab({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-10 text-center">
      <span className="material-symbols-rounded text-[var(--cds-color-grey-300)] mb-3 inline-block" style={{ fontSize: 48 }}>
        {icon}
      </span>
      <h3 className="cds-subtitle-md text-[var(--cds-color-grey-975)] mb-2">{title}</h3>
      <p className="cds-body-secondary text-[var(--cds-color-grey-600)] max-w-md mx-auto">{body}</p>
    </div>
  );
}
