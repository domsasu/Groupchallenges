import { MOCK_COMMUNITY_CHALLENGES, type CommunityChallenge } from './communityChallenges';

/** Bump version to reset persisted enrollment to mock defaults (e.g. after join-flow behavior changes). */
const STORAGE_KEY = 'groupchallenge.communityChallenges.v7';

/**
 * Set only when the learner finishes the multi-step Community join modal (`completeJoinChallenge`).
 * Vibe “joined” / Home widget must not rely on `optedIn` in STORAGE_KEY alone (legacy could show joined after refresh).
 * v2: reset stale flags; pair with `clearChallengeJoinedViaFlow` when the learner leaves the challenge.
 */
const JOIN_FLOW_COMPLETED_KEY = 'groupchallenge.joinFlowCompleted.v2';

/** Stable id for “It’s a Vibe” (used by tests / deep links). */
export const VIBE_CHALLENGE_ID = 'ch-active-ai-vibe-coding' as const;

export type StoredChallengeFields = Pick<
  CommunityChallenge,
  'optedIn' | 'groupIndex' | 'learnerContributionProgress'
>;

export type ChallengeOverridesMap = Record<string, Partial<StoredChallengeFields>>;

function readOverrides(): ChallengeOverridesMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ChallengeOverridesMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeOverrides(map: ChallengeOverridesMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
}

function readJoinFlowCompleted(): Record<string, true> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(JOIN_FLOW_COMPLETED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, true>;
  } catch {
    return {};
  }
}

/** Call when the learner completes the join modal so “joined” / Home streak widget can appear after refresh. */
export function markChallengeJoinedViaFlow(challengeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const prev = readJoinFlowCompleted();
    if (prev[challengeId]) return;
    const next = { ...prev, [challengeId]: true as const };
    window.localStorage.setItem(JOIN_FLOW_COMPLETED_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

/** Call when the learner leaves “It’s a Vibe” so reload does not re-apply joined state from `markChallengeJoinedViaFlow`. */
export function clearChallengeJoinedViaFlow(challengeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const prev = readJoinFlowCompleted();
    if (!prev[challengeId]) return;
    const next = { ...prev };
    delete next[challengeId];
    window.localStorage.setItem(JOIN_FLOW_COMPLETED_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

/** Merge mock challenges with enrollment saved from Community → Challenges (join flow). */
export function mergeCommunityChallengesWithStorage(base: CommunityChallenge[]): CommunityChallenge[] {
  const overrides = readOverrides();
  const joinDone = readJoinFlowCompleted();
  return base.map((c) => {
    if (c.id === VIBE_CHALLENGE_ID) {
      const o = overrides[c.id];
      // An explicit leave (optedIn: false) always wins, even if join-flow key was cleared.
      if (o?.optedIn === false) {
        return { ...c, ...o, optedIn: false };
      }
      const completed = joinDone[VIBE_CHALLENGE_ID] === true;
      if (!completed) {
        // User never joined via flow — return mock default without override.
        return { ...c };
      }
      // Joined via flow and no explicit leave — show as joined, apply any other overrides.
      return {
        ...c,
        ...(o ?? {}),
        optedIn: true,
      };
    }
    const o = overrides[c.id];
    if (!o) return c;
    return {
      ...c,
      ...o,
    };
  });
}

/** Diff vs mock defaults — only persist fields we allow overriding. */
export function persistChallengesFromMock(current: CommunityChallenge[]): void {
  const mockById = new Map(MOCK_COMMUNITY_CHALLENGES.map((c) => [c.id, c]));
  const next: ChallengeOverridesMap = {};
  for (const c of current) {
    const m = mockById.get(c.id);
    if (!m) continue;
    const patch: Partial<StoredChallengeFields> = {};
    if (c.optedIn !== m.optedIn) patch.optedIn = c.optedIn;
    if (c.groupIndex !== m.groupIndex) patch.groupIndex = c.groupIndex;
    if (c.learnerContributionProgress !== m.learnerContributionProgress) {
      patch.learnerContributionProgress = c.learnerContributionProgress;
    }
    if (Object.keys(patch).length > 0) next[c.id] = patch;
  }
  writeOverrides(next);
}
