import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { JOINED_FEED_COHORT_IDS, FEED_COHORT_META, type FeedCohortId } from '../constants/feedCohorts';

const STORAGE_KEY = 'groupchallenge.extraCohortJoins.v1';

const KNOWN_COHORT_IDS = new Set(Object.keys(FEED_COHORT_META) as FeedCohortId[]);

function readStoredExtraJoins(): FeedCohortId[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: FeedCohortId[] = [];
    const seen = new Set<FeedCohortId>();
    for (const id of parsed) {
      if (typeof id !== 'string' || !KNOWN_COHORT_IDS.has(id as FeedCohortId)) continue;
      const cid = id as FeedCohortId;
      if (seen.has(cid)) continue;
      seen.add(cid);
      out.push(cid);
    }
    return out;
  } catch {
    return [];
  }
}

function writeStoredExtraJoins(ids: FeedCohortId[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export interface CommunityCohortMembershipValue {
  /** Default joined cohorts plus any the learner joined from discover. */
  joinedCohortIds: FeedCohortId[];
  isInCohort: (id: FeedCohortId) => boolean;
  /** Adds a discover cohort to “yours”; no-op if already a member. */
  joinCohort: (id: FeedCohortId) => void;
}

const CommunityCohortMembershipContext = createContext<CommunityCohortMembershipValue | null>(null);

export const CommunityCohortMembershipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [extraJoinedIds, setExtraJoinedIds] = useState<FeedCohortId[]>(() => readStoredExtraJoins());

  const joinedCohortIds = useMemo(() => {
    const seen = new Set<FeedCohortId>();
    const out: FeedCohortId[] = [];
    for (const id of JOINED_FEED_COHORT_IDS) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    for (const id of extraJoinedIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }, [extraJoinedIds]);

  const isInCohort = useCallback(
    (id: FeedCohortId) => joinedCohortIds.includes(id),
    [joinedCohortIds]
  );

  const joinCohort = useCallback((id: FeedCohortId) => {
    if (!KNOWN_COHORT_IDS.has(id)) return;
    if (JOINED_FEED_COHORT_IDS.includes(id)) return;
    setExtraJoinedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      writeStoredExtraJoins(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      joinedCohortIds,
      isInCohort,
      joinCohort,
    }),
    [joinedCohortIds, isInCohort, joinCohort]
  );

  return (
    <CommunityCohortMembershipContext.Provider value={value}>{children}</CommunityCohortMembershipContext.Provider>
  );
};

export function useCommunityCohortMembership(): CommunityCohortMembershipValue {
  const ctx = useContext(CommunityCohortMembershipContext);
  if (!ctx) {
    throw new Error('useCommunityCohortMembership must be used within CommunityCohortMembershipProvider');
  }
  return ctx;
}

/** For surfaces that may render outside the provider (e.g. Storybook). */
export function useCommunityCohortMembershipOptional(): CommunityCohortMembershipValue | null {
  return useContext(CommunityCohortMembershipContext);
}
