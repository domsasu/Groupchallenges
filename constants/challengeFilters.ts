import {
  sortChallengesByCohortMembershipOrder,
  UPCOMING_STRIP_COHORT_PRIORITY,
  type CommunityChallenge,
} from './communityChallenges';
import type { FeedCohortId } from './feedCohorts';
import type { ChallengeMetric, ChallengeParticipationMode } from './challengeTaxonomy';

export type ChallengesStatusTab = 'active' | 'browse' | 'completed';

/** Maps UI tab to underlying lifecycle filtering (same rules as legacy ChallengesView). */
export function challengesMatchingStatusTab(
  list: CommunityChallenge[],
  tab: ChallengesStatusTab
): CommunityChallenge[] {
  if (tab === 'active') {
    return list.filter((c) => c.lifecycle === 'active' && c.optedIn);
  }
  if (tab === 'browse') {
    return list.filter((c) => c.lifecycle === 'upcoming' || (c.lifecycle === 'active' && !c.optedIn));
  }
  return list.filter((c) => c.lifecycle === 'completed');
}

export type CohortScopeFilter = 'all' | 'my_cohorts' | 'discover';

export interface ChallengeDiscoveryFilters {
  /** Empty = all modes */
  participationModes: ChallengeParticipationMode[];
  /** Empty = all metrics */
  metrics: ChallengeMetric[];
  cohortScope: CohortScopeFilter;
  /** When non-empty, challenge.cohortId must be in this set (in addition to cohortScope). */
  cohortIds: FeedCohortId[];
}

export const DEFAULT_CHALLENGE_DISCOVERY_FILTERS: ChallengeDiscoveryFilters = {
  participationModes: [],
  metrics: [],
  cohortScope: 'all',
  cohortIds: [],
};

/** Sort order for the left rail after tab + discovery filters (Browse uses cohort priority). */
export function sortDiscoveryChallenges(
  list: CommunityChallenge[],
  tab: ChallengesStatusTab,
  joinedCohortIds: readonly FeedCohortId[]
): CommunityChallenge[] {
  if (tab === 'browse') {
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
  return sortChallengesByCohortMembershipOrder(list, joinedCohortIds);
}

export function filterChallengesByDiscovery(
  challenges: CommunityChallenge[],
  filters: ChallengeDiscoveryFilters,
  joinedCohortIds: readonly FeedCohortId[]
): CommunityChallenge[] {
  const joinedSet = new Set(joinedCohortIds);
  return challenges.filter((c) => {
    if (filters.participationModes.length > 0 && !filters.participationModes.includes(c.participationMode)) {
      return false;
    }
    if (filters.metrics.length > 0 && !filters.metrics.includes(c.challengeMetric)) {
      return false;
    }
    if (filters.cohortScope === 'my_cohorts' && !joinedSet.has(c.cohortId)) {
      return false;
    }
    if (filters.cohortScope === 'discover' && joinedSet.has(c.cohortId)) {
      return false;
    }
    if (filters.cohortIds.length > 0 && !filters.cohortIds.includes(c.cohortId)) {
      return false;
    }
    return true;
  });
}
