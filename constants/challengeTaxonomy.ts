/** Discovery / filter taxonomy for group challenges (mock-first; API can mirror later). */

export type ChallengeParticipationMode = 'individual' | 'inner_cohort' | 'cohort_collective';

/** Time on task, streak/consistency, or learning items / modules completed */
export type ChallengeMetric = 'quantity' | 'time' | 'consistency';

export type ChallengeDurationBucket = 'week' | 'month' | 'quarter';

export const PARTICIPATION_MODE_LABELS: Record<ChallengeParticipationMode, string> = {
  individual: 'Solo compete',
  inner_cohort: 'Teams compete',
  cohort_collective: 'Collaborate',
};

export const CHALLENGE_METRIC_LABELS: Record<ChallengeMetric, string> = {
  quantity: 'Quantity · items/modules',
  time: 'Time',
  consistency: 'Consistency',
};

export const DURATION_BUCKET_LABELS: Record<ChallengeDurationBucket, string> = {
  week: '1 week',
  month: 'Month',
  quarter: 'Quarter',
};
