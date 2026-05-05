import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BarChart3,
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  Layers,
  LayoutGrid,
  Repeat,
  User,
  Users,
  UsersRound,
} from 'lucide-react';
import type {
  ChallengeDurationBucket,
  ChallengeMetric,
  ChallengeParticipationMode,
} from './challengeTaxonomy';

/** Icons for challenge metric taxonomy — matches filter chips + card pills */
export const CHALLENGE_METRIC_ICONS: Record<ChallengeMetric, LucideIcon> = {
  quantity: BarChart3,
  time: Clock,
  consistency: Repeat,
  mastery: Award,
  breadth: LayoutGrid,
  depth: Layers,
};

export const PARTICIPATION_MODE_ICONS: Record<ChallengeParticipationMode, LucideIcon> = {
  individual: User,
  inner_cohort: Users,
  cohort_collective: UsersRound,
};

export const DURATION_BUCKET_ICONS: Record<ChallengeDurationBucket, LucideIcon> = {
  week: Calendar,
  month: CalendarDays,
  quarter: CalendarRange,
};
