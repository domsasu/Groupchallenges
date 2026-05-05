/** Discovery / filter taxonomy for group challenges (mock-first; API can mirror later). */

export type ChallengeParticipationMode = 'individual' | 'inner_cohort' | 'cohort_collective';

export type ChallengeMetric = 'quantity' | 'time' | 'consistency' | 'mastery' | 'breadth' | 'depth';

export type ChallengeDurationBucket = 'week' | 'month' | 'quarter';

export const PARTICIPATION_MODE_LABELS: Record<ChallengeParticipationMode, string> = {
  individual: 'Solo',
  inner_cohort: 'Within cohort',
  cohort_collective: 'Cohort goal',
};

export const CHALLENGE_METRIC_LABELS: Record<ChallengeMetric, string> = {
  quantity: 'Quantity',
  time: 'Time',
  consistency: 'Consistency',
  mastery: 'Mastery',
  breadth: 'Breadth',
  depth: 'Depth',
};

export const DURATION_BUCKET_LABELS: Record<ChallengeDurationBucket, string> = {
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
};
