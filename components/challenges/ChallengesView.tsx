import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MOCK_COMMUNITY_CHALLENGES,
  popularOngoingChallenges,
  type CommunityChallenge,
} from '../../constants/communityChallenges';
import {
  clearChallengeJoinedViaFlow,
  markChallengeJoinedViaFlow,
  mergeCommunityChallengesWithStorage,
  persistChallengesFromMock,
  VIBE_CHALLENGE_ID,
} from '../../constants/communityChallengesPersistence';
import { type FeedCohortId } from '../../constants/feedCohorts';
import {
  challengesMatchingStatusTab,
  DEFAULT_CHALLENGE_DISCOVERY_FILTERS,
  filterChallengesByDiscovery,
  sortDiscoveryChallenges,
  type ChallengeDiscoveryFilters,
  type ChallengesStatusTab,
} from '../../constants/challengeFilters';
import { useCommunityCohortMembership } from '../../context/CommunityCohortMembershipContext';
import { ChallengeBrowseRowCard } from './ChallengeBrowseRowCard';
import { ChallengeDetailModal } from './ChallengeDetailModal';
import {
  ChallengeDiscoveryFilterBar,
  ChallengeDiscoveryFiltersSection,
} from './ChallengeDiscoveryFilterBar';
import { ChallengeJoinFlow } from './ChallengeJoinFlow';
import { ChallengeRecommendedStrip } from './ChallengeRecommendedStrip';

type ChallengeSelection = { kind: 'challenge'; id: string } | null;

function buildInitialChallengeSelection(
  joinedCohortIds: FeedCohortId[],
  initialOpenChallengeId: string | undefined,
  initialChallengesStatusTab: ChallengesStatusTab | undefined
): ChallengeSelection {
  const list = mergeCommunityChallengesWithStorage(
    MOCK_COMMUNITY_CHALLENGES.map((c) => ({ ...c, members: c.members?.map((m) => ({ ...m })) }))
  );
  const tab: ChallengesStatusTab =
    initialChallengesStatusTab ?? (initialOpenChallengeId ? 'active' : 'browse');
  if (initialOpenChallengeId && list.some((c) => c.id === initialOpenChallengeId)) {
    return { kind: 'challenge', id: initialOpenChallengeId };
  }
  const baseForTab = challengesMatchingStatusTab(list, tab);
  const sortedForTab = sortDiscoveryChallenges(baseForTab, tab, joinedCohortIds);
  if (sortedForTab.length > 0) {
    return { kind: 'challenge', id: sortedForTab[0]!.id };
  }
  const browseBase = challengesMatchingStatusTab(list, 'browse');
  const sortedBrowse = sortDiscoveryChallenges(browseBase, 'browse', joinedCohortIds);
  if (sortedBrowse.length > 0) {
    return { kind: 'challenge', id: sortedBrowse[0]!.id };
  }
  const activeJoined = list.filter((c) => c.lifecycle === 'active' && c.optedIn);
  if (activeJoined.length > 0) {
    const sorted = sortDiscoveryChallenges(activeJoined, 'active', joinedCohortIds);
    return { kind: 'challenge', id: sorted[0]!.id };
  }
  return null;
}

export interface ChallengesViewProps {
  /** When true, parent shells (e.g. Feed) should disable their own vertical scroll so fixed overlays show a single scrollbar. */
  onScrollLockChange?: (locked: boolean) => void;
  /** Deep link: open full-screen challenge detail on load (e.g. Home sidebar carousel). */
  initialOpenChallengeId?: string;
  /** Initial Browse / Active / Completed tab (parent may pass `active` when deep-linking). */
  initialChallengesStatusTab?: ChallengesStatusTab;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  onScrollLockChange,
  initialOpenChallengeId,
  initialChallengesStatusTab,
}) => {
  const { joinedCohortIds, isInCohort, joinCohort } = useCommunityCohortMembership();

  const [challenges, setChallenges] = useState<CommunityChallenge[]>(() =>
    mergeCommunityChallengesWithStorage(
      MOCK_COMMUNITY_CHALLENGES.map((c) => ({ ...c, members: c.members?.map((m) => ({ ...m })) }))
    )
  );

  useEffect(() => {
    persistChallengesFromMock(challenges);
  }, [challenges]);

  const [statusTab, setStatusTab] = useState<ChallengesStatusTab>(() =>
    initialChallengesStatusTab ?? (initialOpenChallengeId ? 'active' : 'browse')
  );

  const [filters, setFilters] = useState<ChallengeDiscoveryFilters>(() => ({
    ...DEFAULT_CHALLENGE_DISCOVERY_FILTERS,
  }));

  const [selection, setSelection] = useState<ChallengeSelection>(() =>
    buildInitialChallengeSelection(joinedCohortIds, initialOpenChallengeId, initialChallengesStatusTab)
  );

  const [detailModalOpen, setDetailModalOpen] = useState(() => Boolean(initialOpenChallengeId));

  /** Skip the first tab/filter sync that would close the deep-linked detail modal. */
  const skipNextTabSyncCloseRef = useRef(Boolean(initialOpenChallengeId));

  const baseForTab = useMemo(
    () => challengesMatchingStatusTab(challenges, statusTab),
    [challenges, statusTab]
  );

  const filteredSorted = useMemo(() => {
    const filtered = filterChallengesByDiscovery(baseForTab, filters, joinedCohortIds);
    return sortDiscoveryChallenges(filtered, statusTab, joinedCohortIds);
  }, [baseForTab, filters, joinedCohortIds, statusTab]);

  const recommendedActive = useMemo(() => {
    if (statusTab !== 'browse') return [];
    const limit = 3;
    const activeTop = popularOngoingChallenges(challenges, limit);
    if (activeTop.length >= limit) return activeTop;
    const taken = new Set(activeTop.map((c) => c.id));
    const browsePool = challenges.filter(
      (c) =>
        !taken.has(c.id) &&
        (c.lifecycle === 'upcoming' || (c.lifecycle === 'active' && !c.optedIn))
    );
    const sortedRest = sortDiscoveryChallenges(browsePool, 'browse', joinedCohortIds);
    return [...activeTop, ...sortedRest].slice(0, limit);
  }, [challenges, statusTab, joinedCohortIds]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.participationModes.length > 0) n++;
    if (filters.metrics.length > 0) n++;
    if (filters.durationBuckets.length > 0) n++;
    if (filters.cohortScope !== 'all') n++;
    if (filters.cohortIds.length > 0) n++;
    return n;
  }, [filters]);

  const hasChallengeList = filteredSorted.length > 0;

  const challengeForDetail = useMemo(() => {
    if (!selection || selection.kind !== 'challenge') return null;
    return challenges.find((c) => c.id === selection.id) ?? null;
  }, [selection, challenges]);

  /** When tab or filters change, keep selection if possible; else first challenge. Close detail modal (except first sync after deep link). */
  useEffect(() => {
    const syncSelection = () => {
      setSelection((prev) => {
        if (prev?.kind === 'challenge' && filteredSorted.some((c) => c.id === prev.id)) {
          return prev;
        }
        if (filteredSorted.length > 0) {
          return { kind: 'challenge', id: filteredSorted[0]!.id };
        }
        return null;
      });
    };

    if (skipNextTabSyncCloseRef.current) {
      skipNextTabSyncCloseRef.current = false;
      syncSelection();
      return;
    }

    setDetailModalOpen(false);
    syncSelection();
  }, [statusTab, filters, filteredSorted]);

  const toggleOptedIn = useCallback((id: string) => {
    setChallenges((prev) => {
      const next = prev.map((c) => {
        if (c.id !== id) return c;
        const joining = !c.optedIn;
        if (!joining && id === VIBE_CHALLENGE_ID) {
          clearChallengeJoinedViaFlow(VIBE_CHALLENGE_ID);
        }
        return {
          ...c,
          optedIn: joining,
          learnerContributionProgress: joining
            ? c.learnerContributionProgress == null
              ? 0
              : c.learnerContributionProgress
            : undefined,
        };
      });
      persistChallengesFromMock(next);
      return next;
    });
  }, []);

  const [joinFlowChallengeId, setJoinFlowChallengeId] = useState<string | null>(null);

  const joinFlowChallenge = useMemo(
    () => (joinFlowChallengeId ? challenges.find((c) => c.id === joinFlowChallengeId) ?? null : null),
    [joinFlowChallengeId, challenges]
  );

  const beginJoinChallenge = useCallback((id: string) => {
    setJoinFlowChallengeId(id);
  }, []);

  const completeJoinChallenge = useCallback(
    (id: string, groupIndex: number, lifecycle?: CommunityChallenge['lifecycle']) => {
      markChallengeJoinedViaFlow(id);
      setChallenges((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            optedIn: true,
            groupIndex,
            learnerContributionProgress:
              c.learnerContributionProgress == null ? 0 : c.learnerContributionProgress,
          };
        })
      );
      setJoinFlowChallengeId(null);
      if (lifecycle === 'active') {
        setStatusTab('active');
      }
      setSelection({ kind: 'challenge', id });
    },
    []
  );

  const handleRequestJoinChallenge = useCallback(
    (challengeId: string, cohortId: FeedCohortId) => {
      if (!isInCohort(cohortId)) {
        joinCohort(cohortId);
      }
      beginJoinChallenge(challengeId);
    },
    [isInCohort, joinCohort, beginJoinChallenge]
  );

  const openChallengeModal = useCallback((id: string) => {
    setSelection({ kind: 'challenge', id });
    setDetailModalOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailModalOpen(false);
  }, []);

  useEffect(() => {
    if (!detailModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetailModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [detailModalOpen, closeDetailModal]);

  const scrollLockedBehindOverlay = detailModalOpen || joinFlowChallengeId != null;

  useEffect(() => {
    onScrollLockChange?.(scrollLockedBehindOverlay);
  }, [scrollLockedBehindOverlay, onScrollLockChange]);

  return (
    <>
      {/* Single page scroll lives on the Feed shell — avoid a nested overflow-y here (duplicate scrollbars). */}
      {/* Avoid overflow-x-hidden here — it clips absolutely positioned filter flyouts that extend past the column edge. */}
      <div className="flex w-full flex-col gap-0 overflow-x-visible">
        <header className="sticky top-0 z-30 bg-[var(--cds-color-white)] pb-3 shadow-[0_1px_0_rgba(15,23,42,0.06)] supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:bg-[var(--cds-color-white)]/92">
          <ChallengeDiscoveryFilterBar
            showFilters={false}
            statusTab={statusTab}
            onStatusTabChange={setStatusTab}
            filters={filters}
            onFiltersChange={setFilters}
            activeFilterCount={activeFilterCount}
          />
        </header>

        <section className="px-1 pb-4 pt-2" aria-label="Challenge discovery">
          {statusTab === 'browse' ? (
            <div className="mb-[24pt]">
              <ChallengeRecommendedStrip
                challenges={recommendedActive}
                onOpenDetail={openChallengeModal}
                onJoin={(c) => handleRequestJoinChallenge(c.id, c.cohortId)}
              />
            </div>
          ) : null}
          <ChallengeDiscoveryFiltersSection
            statusTab={statusTab}
            filters={filters}
            onFiltersChange={setFilters}
            activeFilterCount={activeFilterCount}
          />
          {statusTab === 'browse' ? (
            <p className="mb-3 px-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--cds-color-grey-500)]">
              Recommended for you
            </p>
          ) : null}
          <div role="tabpanel" aria-labelledby={`challenge-status-${statusTab}`} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {!hasChallengeList ? (
              <p className="col-span-full cds-body-secondary text-[var(--cds-color-grey-600)]">
                No challenges in this category.
              </p>
            ) : (
              filteredSorted.map((c) => (
                <ChallengeBrowseRowCard
                  key={c.id}
                  challenge={c}
                  onOpenDetail={() => openChallengeModal(c.id)}
                  onJoin={() => handleRequestJoinChallenge(c.id, c.cohortId)}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {detailModalOpen && selection?.kind === 'challenge' && challengeForDetail && (
        <ChallengeDetailModal
          challenge={challengeForDetail}
          optedIn={challengeForDetail.optedIn}
          userInCohort={isInCohort(challengeForDetail.cohortId)}
          onClose={closeDetailModal}
          onToggleOptIn={() => toggleOptedIn(challengeForDetail.id)}
          onRequestJoinChallenge={() =>
            handleRequestJoinChallenge(challengeForDetail.id, challengeForDetail.cohortId)
          }
          onResumeLearning={() => {
            window.alert('Resume learning would open your course (preview).');
          }}
          onOpenShareout={
            challengeForDetail.lifecycle === 'completed' && challengeForDetail.outcome
              ? () => {
                  window.alert('Shareout would open here (preview).');
                }
              : undefined
          }
        />
      )}

      {joinFlowChallenge && (
        <ChallengeJoinFlow
          challenge={joinFlowChallenge}
          onClose={() => setJoinFlowChallengeId(null)}
          onComplete={(groupIndex) =>
            completeJoinChallenge(joinFlowChallenge.id, groupIndex, joinFlowChallenge.lifecycle)
          }
          onResumeLearning={() => {
            window.alert('Resume learning would open your course (preview).');
          }}
        />
      )}
    </>
  );
};
