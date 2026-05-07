/** Discovery / filter taxonomy for group challenges (mock-first; API can mirror later). */

export type ChallengeParticipationMode = 'individual' | 'inner_cohort' | 'cohort_collective';

/** One shared cohort meter — no squads; mocks should use `groupCount: 1`. */
export function isCohortCollectiveChallenge(c: {
  participationMode: ChallengeParticipationMode;
}): boolean {
  return c.participationMode === 'cohort_collective';
}

/** Solo vs cohort leaderboard — not squad-assigned; UI must not use `groupCount` as team count. */
export function isIndividualChallenge(c: {
  participationMode: ChallengeParticipationMode;
}): boolean {
  return c.participationMode === 'individual';
}

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
