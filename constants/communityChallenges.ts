import { JOINED_FEED_COHORT_IDS, type FeedCohortId } from './feedCohorts';
import type {
  ChallengeDurationBucket,
  ChallengeMetric,
  ChallengeParticipationMode,
} from './challengeTaxonomy';

/**
 * Mock challenges include joined-cohort rows plus discover-only cohorts for Browse filters.
 */

export type ChallengeLifecycle = 'active' | 'upcoming' | 'completed';

/** Visual tier for strip card art + labels (Silver / Gold / Platinum / Diamond). */
export type ChallengeVisualTier = 'silver' | 'gold' | 'platinum' | 'diamond';

export interface ChallengeMilestone {
  id: string;
  label: string;
  /** Display like "5 lessons" */
  target?: string;
}

export interface ChallengeMember {
  id: string;
  displayName: string;
  /** Contribution points for ranking */
  contribution: number;
  /** Initial high-fives from mock; UI can increment */
  highFiveCount: number;
  /** Highlight current user */
  isCurrentUser?: boolean;
}

export interface CommunityChallenge {
  id: string;
  name: string;
  cohortId: FeedCohortId;
  /** How progress competes or aggregates across the cohort. */
  participationMode: ChallengeParticipationMode;
  /** What kind of learning signal the challenge measures. */
  challengeMetric: ChallengeMetric;
  /** Coarse window for filters (independent of exact ISO dates). */
  durationBucket: ChallengeDurationBucket;
  lifecycle: ChallengeLifecycle;
  /** 1-based */
  groupIndex: number;
  groupCount: number;
  /** This group's rank among all groups in the challenge (1 = leading). */
  groupPlace: number;
  approxGroupSize: number;
  whyJoin: string;
  milestones: ChallengeMilestone[];
  /** 0-based index into `milestones` — tier this group is in (highlighted on the card). */
  currentTierIndex?: number;
  /**
   * For each milestone index, 1-based group numbers whose **current** highest tier is exactly
   * that milestone (each group appears once across the array).
   */
  groupsAtMilestoneTier?: number[][];
  steps: string[];
  /** ISO date strings for display */
  startsAt: string;
  endsAt: string;
  daysLeft?: number;
  /** Simulated enrollment */
  optedIn: boolean;
  outcome?: {
    won: boolean;
    /** User's rank in group when completed */
    userRank: number;
    /** Headline number for shareout (e.g. peers in group) */
    shareoutPeerCount: number;
    /** Celebration hero — award name (default Longest Streak in UI). */
    awardLabel?: string;
    /** Optional learner stat shown after the award (e.g. courses completed). */
    completedCourseCount?: number;
  };
  members?: ChallengeMember[];
  /** Tier shown on challenge strip card illustration and footer (independent of milestone naming). */
  visualTier: ChallengeVisualTier;
  /** Progress toward current challenge goal, 0–1 (drives progress bar on strip card). */
  cardProgress: number;
  /**
   * Optional per-group progress toward the final goal (0–1), keyed by 1-based group number.
   * Used in challenge detail hover tooltips; if omitted, a tier-based estimate is shown.
   */
  groupProgressTowardGoal?: Record<number, number>;
  /**
   * Learner’s share of progress toward the same goal as the challenge (0–1), for active-detail “Your contribution”.
   */
  learnerContributionProgress?: number;
  /**
   * Learner’s individual contribution target in the same units as the final milestone (e.g. 5 for “5 modules”).
   * Shown on the Home sidebar mini card alongside the team goal.
   */
  learnerGoalUnits?: number;
  /** Optional strip/hero art URL; defaults to tier ring SVG from `visualTier`. */
  cardHeroImageSrc?: string;
  /** When set, replaces “Great job {squad}!” on the completed-challenge celebration hero. */
  completedHeroSubline?: string;
}

export const MOCK_COMMUNITY_CHALLENGES: CommunityChallenge[] = [
  {
    id: 'ch-active-workingparents-nap-module',
    name: 'Nap time, grind time',
    cohortId: 'workingparents',
    participationMode: 'inner_cohort',
    challengeMetric: 'quantity',
    durationBucket: 'month',
    lifecycle: 'active',
    groupIndex: 3,
    groupCount: 5,
    groupPlace: 2,
    approxGroupSize: 127,
    whyJoin:
      '#workingparents cohort: knocking out course modules when kids are asleep, at daycare, or away—about 30–60 minutes a day adds up as your group pushes toward 100 modules together.',
    milestones: [
      { id: 'm1', label: 'Silver', target: '25 modules' },
      { id: 'm2', label: 'Gold', target: '50 modules' },
      { id: 'm3', label: 'Platinum', target: '75 modules' },
      { id: 'm4', label: 'Diamond', target: '100 modules' },
    ],
    steps: [
      'Aim to complete 5 modules by doing 30–60 min a day.',
      'Carve focused time during naps or after bedtime—protect those windows on your calendar.',
      'Use daycare, school, or when a partner has the kids to knock out a module or two.',
    ],
    startsAt: '2026-04-15',
    endsAt: '2026-05-27',
    daysLeft: 30,
    optedIn: true,
    currentTierIndex: 3,
    /**
     * Aligned with `resolveGroupsAtTierColumns`: caps [25,50,75,100] place groups by
     * completed modules (0–24 → Silver col, 25–49 → Gold, 50–74 → Platinum, 75–99 → Diamond).
     */
    groupsAtMilestoneTier: [
      [2],
      [1, 5],
      [3, 4],
      [],
    ],
    visualTier: 'gold',
    /** Learner squad (Amber Foxes): 78/100 modules — strip + ChallengeFullDetail progress. */
    cardProgress: 0.78,
    groupProgressTowardGoal: {
      /** Red Apes — 52 modules (Platinum column). */
      1: 0.52,
      /** Blue Herons — 26 modules (Gold column). */
      2: 0.26,
      /** Amber Foxes — 78 modules (Diamond band, toward 100). */
      3: 0.78,
      /** Emerald Otters — 75 modules (Diamond band). */
      4: 0.75,
      /** Violet Pandas — 60 modules (Platinum column). */
      5: 0.6,
    },
    learnerContributionProgress: 0,
    learnerGoalUnits: 5,
  },
  {
    id: 'ch-active-ai-vibe-coding',
    name: "It's a Vibe",
    cohortId: 'ai',
    participationMode: 'inner_cohort',
    challengeMetric: 'time',
    durationBucket: 'month',
    lifecycle: 'active',
    groupIndex: 2,
    groupCount: 4,
    groupPlace: 1,
    approxGroupSize: 180,
    whyJoin:
      'The #AIpowered cohort knows vibe coding is the future of design. Work alongside your team to be the first to log 100 hours of vibe coding courses.',
    milestones: [
      { id: 'v1', label: 'Quarter century', target: '25 hrs' },
      { id: 'v2', label: 'Halfway', target: '50 hrs' },
      { id: 'v3', label: 'Full send', target: '100 hrs' },
    ],
    steps: [
      'Your contribution goal: ~10 hours of vibe coding over the next 2 weeks toward the squad’s 100-hour target.',
      'Check out Scrimba courses for easy to follow vibe coding courses.',
      'Apply your knowledge to reinforce learnings; use Claude Code, Cursor, or AI Studio.',
    ],
    startsAt: '2026-04-03',
    endsAt: '2026-05-15',
    daysLeft: 30,
    optedIn: true,
    currentTierIndex: 0,
    /**
     * Before joining, all squads sit at the first milestone (25h); per-group hours:
     * Gold Saturn 10h, Jade Mercury 5h, Rose Europa 5h, Azure Mars 2h.
     */
    groupsAtMilestoneTier: [[1, 2, 3, 4], [], []],
    /** Progress toward 100h goal (0–1): 10, 5, 5, 2 hours → tier column under 25h cap. */
    groupProgressTowardGoal: {
      1: 0.1,
      2: 0.05,
      3: 0.05,
      4: 0.02,
    },
    visualTier: 'platinum',
    cardProgress: 0,
    cardHeroImageSrc: '/challenges/vibe-coding-challenge.svg',
    learnerContributionProgress: 0,
    learnerGoalUnits: 10,
  },
  {
    id: 'ch-upcoming-enrolled-streak',
    name: '14-Day Consistency Streak',
    cohortId: 'enrolled',
    participationMode: 'individual',
    challengeMetric: 'consistency',
    durationBucket: 'month',
    lifecycle: 'upcoming',
    groupIndex: 2,
    groupCount: 6,
    groupPlace: 4,
    approxGroupSize: 209,
    whyJoin:
      'Consistency beats intensity: a two-week streak wires a cue–routine–reward loop that supports any certificate path.',
    milestones: [
      { id: 'm1', label: 'Week 1', target: '7 days of learning' },
      { id: 'm2', label: 'Week 2', target: '14 days of learning' },
    ],
    steps: [
      'Log at least 20 minutes of learning on each streak day.',
      'Miss one “life happens” day without breaking the streak count.',
      'Share one takeaway in your group when you hit day 7.',
    ],
    startsAt: '2026-05-22',
    endsAt: '2026-06-06',
    daysLeft: undefined,
    optedIn: false,
    currentTierIndex: 0,
    groupsAtMilestoneTier: [
      [2, 4, 5, 6],
      [1, 3],
    ],
    visualTier: 'silver',
    cardProgress: 0,
  },
  {
    id: 'ch-upcoming-ai-gab-lab-500',
    name: 'Prompt runners unite!',
    cohortId: 'ai',
    participationMode: 'inner_cohort',
    challengeMetric: 'time',
    durationBucket: 'month',
    lifecycle: 'upcoming',
    groupIndex: 1,
    groupCount: 4,
    groupPlace: 1,
    approxGroupSize: 211,
    learnerGoalUnits: 25,
    whyJoin:
      'Your cohort is chasing 500 hours of real back-and-forth with the AI coach—talking things through beats passive watching, and every threaded chat nudges the group meter.',
    milestones: [
      { id: 'm1', label: 'Silver', target: '125 hrs' },
      { id: 'm2', label: 'Gold', target: '250 hrs' },
      { id: 'm3', label: 'Platinum', target: '375 hrs' },
      { id: 'm4', label: 'Diamond', target: '500 hrs' },
    ],
    steps: [
      'Spend time in conversational coach threads—follow-ups, clarifications, and “what if” tangents count; one-shot prompts don’t.',
      'Carve a few standing slots per week for voice or text dialogue so the habit sticks.',
      'Drop your funniest or most surprisingly useful coach exchange in the cohort channel to keep the gab going.',
    ],
    startsAt: '2026-05-18',
    endsAt: '2026-06-18',
    optedIn: false,
    currentTierIndex: 0,
    groupsAtMilestoneTier: [
      [1],
      [2],
      [3],
      [4],
    ],
    visualTier: 'platinum',
    cardProgress: 0.12,
  },
  {
    id: 'ch-completed-enrolled-relay',
    name: 'Deep learning challenge',
    cohortId: 'ai',
    participationMode: 'inner_cohort',
    challengeMetric: 'depth',
    durationBucket: 'month',
    lifecycle: 'completed',
    groupIndex: 6,
    groupCount: 6,
    groupPlace: 1,
    approxGroupSize: 251,
    whyJoin:
      'Teams in the #AIpowered cohort work together to complete the most Deep Learning content.',
    milestones: [
      { id: 'm1', label: 'Relay leg 1', target: '25% course' },
      { id: 'm2', label: 'Relay leg 2', target: '50% course' },
      { id: 'm3', label: 'Finish', target: '100% course' },
    ],
    steps: [
      'Assign roles: lead learner, note-taker, timekeeper.',
      'Complete your leg before handing off in the group thread.',
      'Celebrate each leg in the cohort feed.',
    ],
    startsAt: '2026-03-01',
    endsAt: '2026-03-28',
    optedIn: true,
    outcome: {
      won: true,
      userRank: 2,
      shareoutPeerCount: 72,
      awardLabel: 'Longest Streak',
      completedCourseCount: 4,
    },
    completedHeroSubline: 'Your group completed 200 Deep Learning courses!',
    currentTierIndex: 2,
    groupsAtMilestoneTier: [[], [], [1, 2, 3, 4, 5, 6]],
    visualTier: 'diamond',
    cardProgress: 1,
    members: [
      { id: 'u1', displayName: 'Maya Chen', contribution: 420, highFiveCount: 18, isCurrentUser: false },
      { id: 'u2', displayName: 'You', contribution: 310, highFiveCount: 12, isCurrentUser: true },
      { id: 'u3', displayName: 'Ravi Patel', contribution: 298, highFiveCount: 9, isCurrentUser: false },
      { id: 'u4', displayName: 'Sam Okonkwo', contribution: 275, highFiveCount: 7, isCurrentUser: false },
      { id: 'u5', displayName: 'Zoe Martin', contribution: 260, highFiveCount: 5, isCurrentUser: false },
    ],
  },
  {
    id: 'ch-upcoming-design-systems-breadth',
    name: 'Design systems crawl',
    cohortId: 'design',
    participationMode: 'inner_cohort',
    challengeMetric: 'breadth',
    durationBucket: 'month',
    lifecycle: 'upcoming',
    groupIndex: 1,
    groupCount: 6,
    groupPlace: 3,
    approxGroupSize: 118,
    whyJoin:
      'Explore five distinct product-design domains as a squad—tokens, research ops, prototyping, accessibility, and critique—and compete within your cohort.',
    milestones: [
      { id: 'd1', label: 'Foundations', target: '1 domain' },
      { id: 'd2', label: 'Midpoint', target: '3 domains' },
      { id: 'd3', label: 'Breadth', target: '5 domains' },
    ],
    steps: [
      'Each member picks a domain to “own” for a week and shares a 5-minute recap.',
      'Rotate ownership so everyone touches at least two domains.',
      'Capstone: one combined Figma library audit submitted as a group.',
    ],
    startsAt: '2026-05-25',
    endsAt: '2026-06-24',
    optedIn: false,
    currentTierIndex: 0,
    groupsAtMilestoneTier: [[1, 2, 3, 4, 5, 6], [], []],
    visualTier: 'silver',
    cardProgress: 0,
  },
  {
    id: 'ch-upcoming-startups-capstone-collective',
    name: 'Capstone relay',
    cohortId: 'startups',
    participationMode: 'cohort_collective',
    challengeMetric: 'depth',
    durationBucket: 'quarter',
    lifecycle: 'upcoming',
    groupIndex: 1,
    groupCount: 1,
    groupPlace: 1,
    approxGroupSize: 4200,
    whyJoin:
      'One cohort-wide meter: collectively finish three startup-relevant certificates this quarter—no squads racing each other. See how many #startups can collect!',
    milestones: [
      { id: 's1', label: 'First cert', target: '1 certificate' },
      { id: 's2', label: 'Momentum', target: '2 certificates' },
      { id: 's3', label: 'Quarter close', target: '3 certificates' },
    ],
    steps: [
      'Pick certificates that map to your venture thesis; every completion adds to the shared tally.',
      'Post proof links in the cohort channel so moderators can verify.',
      'Optional office hours: twice a month for blockers.',
    ],
    startsAt: '2026-06-01',
    endsAt: '2026-08-31',
    optedIn: false,
    currentTierIndex: 0,
    groupsAtMilestoneTier: [[1], [], []],
    visualTier: 'gold',
    cardProgress: 0,
  },
  {
    id: 'ch-upcoming-engineering-quiz-mastery',
    name: 'Systems quiz sprint',
    cohortId: 'engineering',
    participationMode: 'inner_cohort',
    challengeMetric: 'mastery',
    durationBucket: 'week',
    lifecycle: 'upcoming',
    groupIndex: 2,
    groupCount: 5,
    groupPlace: 2,
    approxGroupSize: 142,
    whyJoin:
      'Short window: squads inside #Engineering compete on weekly quiz averages—highest mean score wins bragging rights.',
    milestones: [
      { id: 'q1', label: 'Warm-up', target: '70% avg' },
      { id: 'q2', label: 'Final', target: '90% avg' },
    ],
    steps: [
      'Each group nominates a quiz captain to schedule two practice sessions.',
      'Everyone completes the same timed quiz set; lowest score is dropped from the average.',
      'Tie-breaker: fastest median completion time.',
    ],
    startsAt: '2026-05-12',
    endsAt: '2026-05-19',
    optedIn: false,
    currentTierIndex: 0,
    groupsAtMilestoneTier: [
      [1, 3, 4, 5],
      [2],
    ],
    visualTier: 'platinum',
    cardProgress: 0.08,
  },
  {
    id: 'ch-completed-marketing-breadth',
    name: 'Channel mix explorer',
    cohortId: 'marketing',
    participationMode: 'individual',
    challengeMetric: 'breadth',
    durationBucket: 'quarter',
    lifecycle: 'completed',
    groupIndex: 1,
    groupCount: 12,
    groupPlace: 5,
    approxGroupSize: 198,
    whyJoin:
      'Individual leaderboard: learners logged touchpoints across paid, organic, lifecycle, and partner channels.',
    milestones: [
      { id: 'mk1', label: 'Bronze', target: '4 channels' },
      { id: 'mk2', label: 'Silver', target: '8 channels' },
    ],
    steps: [
      'Document one real campaign touchpoint per channel with a screenshot.',
      'Peer-review two other learners’ channel maps.',
      'Publish a one-page “mix diagnosis” for a brand you admire.',
    ],
    startsAt: '2026-01-05',
    endsAt: '2026-03-28',
    optedIn: false,
    outcome: {
      won: false,
      userRank: 14,
      shareoutPeerCount: 210,
      awardLabel: 'Top breadth',
    },
    currentTierIndex: 1,
    groupsAtMilestoneTier: [[], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
    visualTier: 'silver',
    cardProgress: 1,
  },
];

function parseChallengeLocalDate(isoDate: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return new Date(isoDate);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Hero pill on slim challenge cards — days left, start date, or completion date.
 */
export function formatChallengeCardHeroLabel(challenge: CommunityChallenge): string {
  switch (challenge.lifecycle) {
    case 'active': {
      let days = challenge.daysLeft;
      if (days === undefined) {
        const end = parseChallengeLocalDate(challenge.endsAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        days = Math.ceil((end.getTime() - today.getTime()) / 86400000);
      }
      if (days <= 0) return 'Ends today';
      if (days === 1) return '1 day left';
      return `${days} days left`;
    }
    case 'upcoming': {
      const d = parseChallengeLocalDate(challenge.startsAt);
      const s = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `Starts ${s}`;
    }
    case 'completed': {
      const d = parseChallengeLocalDate(challenge.endsAt);
      const s = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `Completed ${s}`;
    }
  }
}

function ordinalPlace(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

export function formatGroupPlaceLine(
  c: Pick<CommunityChallenge, 'groupIndex' | 'groupCount' | 'groupPlace'>
): string {
  return `Group ${c.groupIndex} is in ${ordinalPlace(c.groupPlace)} place out of ${c.groupCount}`;
}

export function formatYouAreInGroupLine(
  c: Pick<CommunityChallenge, 'groupIndex' | 'groupCount'>
): string {
  return `You are in group ${c.groupIndex} out of ${c.groupCount}`;
}

export function formatGroupsAtMilestoneLine(groupNumbers: number[]): string {
  if (groupNumbers.length === 0) return 'No groups at this tier yet.';
  const sorted = [...groupNumbers].sort((a, b) => a - b);
  return sorted.length === 1 ? `Group ${sorted[0]}` : `Groups ${sorted.join(', ')}`;
}

/**
 * "Progress to goal" quantity when the final milestone has a numeric target (e.g. "25 lessons", "30 hrs").
 * Uses `cardProgress` × final cap. Returns null if targets are not parseable (fallback to % in UI).
 */
export function formatProgressGoalQuantityLine(challenge: CommunityChallenge): string | null {
  const milestones = challenge.milestones;
  if (milestones.length === 0) return null;
  const lastTarget = milestones[milestones.length - 1]?.target;
  if (!lastTarget) return null;
  const numbers = lastTarget.match(/\d+(?:\.\d+)?/g);
  if (!numbers?.length) return null;
  const total = parseFloat(numbers[numbers.length - 1]);
  if (!Number.isFinite(total) || total <= 0) return null;
  const p = Math.min(1, Math.max(0, challenge.cardProgress));
  const completed = Math.round(p * total);
  const t = lastTarget.toLowerCase();
  if (/%/.test(t)) {
    return `${completed} / ${total}%`;
  }
  if (/\bhrs?\b|hours?/.test(t)) {
    return `${completed} / ${total} hrs`;
  }
  if (/\bdays?\b/.test(t)) {
    return `${completed} / ${total} days`;
  }
  if (/\bmodules?\b/.test(t)) {
    return `${completed} / ${total} modules`;
  }
  if (/\blessons?\b/.test(t)) {
    return `${completed} / ${total} lessons`;
  }
  if (/\bcourses?\b/.test(t)) {
    return `${completed} / ${total} courses`;
  }
  if (/\bclasses?\b/.test(t)) {
    return `${completed} / ${total} classes`;
  }
  return `${completed} / ${total}`;
}

/**
 * Goal-only line for compact surfaces (e.g. challenge strip cards): "3 courses", "100 modules".
 * Does not include progress toward the goal; the bar still reflects `cardProgress`.
 */
export function formatProgressGoalTotalLabel(challenge: CommunityChallenge): string | null {
  const milestones = challenge.milestones;
  if (milestones.length === 0) return null;
  const lastTarget = milestones[milestones.length - 1]?.target;
  if (!lastTarget) return null;
  const numbers = lastTarget.match(/\d+(?:\.\d+)?/g);
  if (!numbers?.length) return null;
  const total = parseFloat(numbers[numbers.length - 1]);
  if (!Number.isFinite(total) || total <= 0) return null;
  const totalRounded = Math.round(total);
  const t = lastTarget.toLowerCase();
  if (/%/.test(t)) {
    return `${totalRounded}%`;
  }
  if (/\bhrs?\b|hours?/.test(t)) {
    return `${totalRounded} hrs`;
  }
  if (/\bdays?\b/.test(t)) {
    return `${totalRounded} days`;
  }
  if (/\bmodules?\b/.test(t)) {
    return `${totalRounded} modules`;
  }
  if (/\blessons?\b/.test(t)) {
    return `${totalRounded} lessons`;
  }
  if (/\bcourses?\b/.test(t)) {
    return `${totalRounded} courses`;
  }
  if (/\bclasses?\b/.test(t)) {
    return `${totalRounded} classes`;
  }
  return `${totalRounded}`;
}

/** Same as formatProgressGoalQuantityLine but with an explicit progress fraction (e.g. another group’s pace). */
export function formatProgressGoalQuantityLineForFraction(
  challenge: CommunityChallenge,
  progress01: number
): string | null {
  return formatProgressGoalQuantityLine({ ...challenge, cardProgress: progress01 });
}

/** Total goal units from the last milestone target (matches `formatProgressGoalQuantityLine`). */
export function parseChallengeGoalTotalUnits(challenge: CommunityChallenge): number | null {
  const milestones = challenge.milestones;
  if (milestones.length === 0) return null;
  const lastTarget = milestones[milestones.length - 1]?.target;
  if (!lastTarget) return null;
  const numbers = lastTarget.match(/\d+(?:\.\d+)?/g);
  if (!numbers?.length) return null;
  const total = parseFloat(numbers[numbers.length - 1]);
  return Number.isFinite(total) && total > 0 ? total : null;
}

/** Ordered numeric caps from each milestone target (e.g. 25 / 50 / 75 / 100 modules). */
export function parseMilestoneNumericCaps(challenge: CommunityChallenge): number[] {
  const out: number[] = [];
  for (const m of challenge.milestones) {
    if (!m.target) return [];
    const numbers = m.target.match(/\d+(?:\.\d+)?/g);
    if (!numbers?.length) return [];
    const v = parseFloat(numbers[numbers.length - 1]);
    if (!Number.isFinite(v)) return [];
    out.push(v);
  }
  return out;
}

/**
 * Which milestone column (0-based) a completed quantity belongs in: [0, cap[0]), [cap[0], cap[1]), …
 * Example: caps [25,50,75,100] → 32 completed → index 1 (Gold).
 */
export function tierColumnIndexForCompletedUnits(completed: number, caps: number[]): number {
  if (caps.length === 0) return 0;
  const c = Math.max(0, completed);
  for (let i = 0; i < caps.length; i++) {
    if (c < caps[i]) return i;
  }
  return caps.length - 1;
}

/**
 * Fill % for the connector **before** milestone `segmentIndex + 1` (same index as in ChallengeFullDetail: `i > 0` → `segmentIndex = i - 1`).
 * Each segment spans the interval between consecutive caps: `[caps[k], caps[k+1]]` for `k = segmentIndex`
 * (e.g. caps [25,50,75,100] → segment 0 is 25→50, segment 1 is 50→75, segment 2 is 75→100).
 */
export function connectorSegmentFillPercentForModules(
  segmentIndex: number,
  caps: number[],
  unitsCompleted: number
): number {
  if (caps.length < 2) return 0;
  const maxSeg = caps.length - 2;
  if (segmentIndex < 0 || segmentIndex > maxSeg) return 0;
  const lo = caps[segmentIndex];
  const hi = caps[segmentIndex + 1];
  if (hi <= lo) return 0;
  const m = Math.max(0, unitsCompleted);
  if (m <= lo) return 0;
  if (m >= hi) return 100;
  return ((m - lo) / (hi - lo)) * 100;
}

/**
 * Places each group under the milestone column that matches its progress vs caps.
 * Falls back to `groupsAtMilestoneTier` when per-group progress or caps can’t be derived.
 */
export function resolveGroupsAtTierColumns(challenge: CommunityChallenge): number[][] | undefined {
  const staticLayout = challenge.groupsAtMilestoneTier;
  if (!staticLayout) return undefined;
  const map = challenge.groupProgressTowardGoal;
  const total = parseChallengeGoalTotalUnits(challenge);
  const caps = parseMilestoneNumericCaps(challenge);
  if (
    !map ||
    total == null ||
    caps.length === 0 ||
    caps.length !== challenge.milestones.length
  ) {
    return staticLayout;
  }
  const n = challenge.groupCount;
  const buckets: number[][] = Array.from({ length: caps.length }, () => []);
  for (let g = 1; g <= n; g++) {
    const p = map[g];
    if (p == null) return staticLayout;
    const completed = Math.round(Math.min(1, Math.max(0, p)) * total);
    const col = tierColumnIndexForCompletedUnits(completed, caps);
    buckets[col].push(g);
  }
  for (const row of buckets) row.sort((a, b) => a - b);
  return buckets;
}

/** Resolves 0–1 progress for a group: uses mock map when present, else tier-column estimate. */
export function getGroupProgressTowardGoal(
  challenge: CommunityChallenge,
  groupNumber: number,
  tierColumnIndex: number
): number {
  const explicit = challenge.groupProgressTowardGoal?.[groupNumber];
  if (explicit != null) return Math.min(1, Math.max(0, explicit));
  const n = challenge.milestones.length;
  if (n <= 0) return 0;
  return Math.min(1, (tierColumnIndex + 1) / n);
}

/**
 * Stable mock headcount per squad (~200 learners) for tooltips; varies slightly by group + challenge id.
 */
export function approxHeadcountForGroup(challenge: CommunityChallenge, groupNumber: number): number {
  const base = challenge.approxGroupSize ?? 200;
  const salt =
    groupNumber * 31 +
    challenge.groupCount * 7 +
    challenge.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const jitter = salt % 19; // 0..18
  const n = base - 9 + jitter;
  return Math.max(192, Math.min(208, n));
}

export function challengesForLifecycle(
  list: CommunityChallenge[],
  lifecycle: ChallengeLifecycle
): CommunityChallenge[] {
  return list.filter((x) => x.lifecycle === lifecycle);
}

/**
 * Active challenges ranked for promo tiles — cohort scale weighted slightly by engagement on the goal bar.
 */
export function popularOngoingChallenges(list: CommunityChallenge[], limit = 3): CommunityChallenge[] {
  const active = list.filter((c) => c.lifecycle === 'active');
  const score = (c: CommunityChallenge) =>
    c.approxGroupSize * (1 + 0.4 * Math.min(1, Math.max(0, c.cardProgress)));
  return [...active].sort((a, b) => score(b) - score(a)).slice(0, limit);
}

/** Same cohort order as My Cohorts / Feed discover rail (`JOINED_FEED_COHORT_IDS`). */
export function sortChallengesByJoinedCohortOrder(challenges: CommunityChallenge[]): CommunityChallenge[] {
  return sortChallengesByCohortMembershipOrder(challenges, JOINED_FEED_COHORT_IDS);
}

/** Order by learner’s cohort list (joined defaults + any discover joins). */
export function sortChallengesByCohortMembershipOrder(
  challenges: CommunityChallenge[],
  joinedCohortIds: readonly FeedCohortId[]
): CommunityChallenge[] {
  const rank = (cohortId: FeedCohortId) => {
    const i = joinedCohortIds.indexOf(cohortId);
    return i === -1 ? 999 : i;
  };
  return [...challenges].sort((a, b) => {
    const d = rank(a.cohortId) - rank(b.cohortId);
    if (d !== 0) return d;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Community → Challenges Browse tab: cohorts listed first in the strip (then other joined, then discover).
 */
export const UPCOMING_STRIP_COHORT_PRIORITY: FeedCohortId[] = ['ai', 'workingparents', 'enrolled'];

export function sortChallengesForChallengesView(
  challenges: CommunityChallenge[],
  lifecycle: ChallengeLifecycle,
  joinedCohortIds: readonly FeedCohortId[] = JOINED_FEED_COHORT_IDS
): CommunityChallenge[] {
  const list = challengesForLifecycle(challenges, lifecycle);
  if (lifecycle !== 'upcoming') {
    return sortChallengesByCohortMembershipOrder(list, joinedCohortIds);
  }
  const priority = (cohortId: FeedCohortId) => {
    const i = UPCOMING_STRIP_COHORT_PRIORITY.indexOf(cohortId);
    if (i !== -1) return i;
    const j = joinedCohortIds.indexOf(cohortId);
    return 10 + (j === -1 ? 999 : j);
  };
  return [...list].sort((a, b) => {
    const d = priority(a.cohortId) - priority(b.cohortId);
    if (d !== 0) return d;
    return a.name.localeCompare(b.name);
  });
}
