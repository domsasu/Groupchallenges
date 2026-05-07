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

/** Anchor targets for section jumpers (also used by scroll spy). */
export const CHALLENGE_SECTION_IDS: Record<ChallengesStatusTab, string> = {
  browse: 'challenge-section-browse',
  active: 'challenge-section-active',
  completed: 'challenge-section-completed',
};

const SECTION_ORDER: ChallengesStatusTab[] = ['browse', 'active', 'completed'];

function getScrollParent(el: HTMLElement | null): Element | null {
  if (!el) return null;
  let parent: HTMLElement | null = el.parentElement;
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function scrollToChallengeSection(tab: ChallengesStatusTab) {
  const el = document.getElementById(CHALLENGE_SECTION_IDS[tab]);
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
}

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
  /** Initial Browse / Active / Completed section to scroll into view when landing on Challenges. */
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

  const [filters, setFilters] = useState<ChallengeDiscoveryFilters>(() => ({
    ...DEFAULT_CHALLENGE_DISCOVERY_FILTERS,
  }));

  const [selection, setSelection] = useState<ChallengeSelection>(() =>
    buildInitialChallengeSelection(joinedCohortIds, initialOpenChallengeId, initialChallengesStatusTab)
  );

  const [detailModalOpen, setDetailModalOpen] = useState(() => Boolean(initialOpenChallengeId));

  /** Skip the first list sync pass for deep-linked detail (selection hydration). */
  const skipNextFilterSyncCloseRef = useRef(Boolean(initialOpenChallengeId));

  /** Close detail only when discovery filters actually change (not when lists are recomputed). */
  const prevDiscoveryFiltersKeyRef = useRef<string | null>(null);

  const [activeSection, setActiveSection] = useState<ChallengesStatusTab>('browse');

  const discoveryRootRef = useRef<HTMLDivElement>(null);

  const browseBase = useMemo(
    () => challengesMatchingStatusTab(challenges, 'browse'),
    [challenges]
  );

  const browseList = useMemo(() => {
    const filtered = filterChallengesByDiscovery(browseBase, filters, joinedCohortIds);
    return sortDiscoveryChallenges(filtered, 'browse', joinedCohortIds);
  }, [browseBase, filters, joinedCohortIds]);

  const activeBase = useMemo(
    () => challengesMatchingStatusTab(challenges, 'active'),
    [challenges]
  );

  const activeList = useMemo(
    () => sortDiscoveryChallenges(activeBase, 'active', joinedCohortIds),
    [activeBase, joinedCohortIds]
  );

  const completedBase = useMemo(
    () => challengesMatchingStatusTab(challenges, 'completed'),
    [challenges]
  );

  const completedList = useMemo(
    () => sortDiscoveryChallenges(completedBase, 'completed', joinedCohortIds),
    [completedBase, joinedCohortIds]
  );

  const recommendedActive = useMemo(() => {
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
  }, [challenges, joinedCohortIds]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.participationModes.length > 0) n++;
    if (filters.metrics.length > 0) n++;
    if (filters.cohortScope !== 'all') n++;
    if (filters.cohortIds.length > 0) n++;
    return n;
  }, [filters]);

  const challengeForDetail = useMemo(() => {
    if (!selection || selection.kind !== 'challenge') return null;
    return challenges.find((c) => c.id === selection.id) ?? null;
  }, [selection, challenges]);

  /** Scroll lock only while the detail surface is actually mounted (avoids blank/black view if flag/list drift). */
  const challengeDetailSurfaceOpen = Boolean(
    detailModalOpen && selection?.kind === 'challenge' && challengeForDetail
  );

  const onJump = useCallback((tab: ChallengesStatusTab) => {
    scrollToChallengeSection(tab);
  }, []);

  /** Scroll spy: highlight the jumper for the section most visible within the Feed scroll container. */
  useEffect(() => {
    const rootEl = discoveryRootRef.current;
    const scrollRoot = getScrollParent(rootEl);
    const elements = SECTION_ORDER.map((tab) => document.getElementById(CHALLENGE_SECTION_IDS[tab])).filter(
      (el): el is HTMLElement => el != null
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length === 0) return;
        const best = intersecting.reduce((a, b) =>
          a.intersectionRatio >= b.intersectionRatio ? a : b
        );
        const id = best.target.id;
        const tab = SECTION_ORDER.find((t) => CHALLENGE_SECTION_IDS[t] === id);
        if (tab) setActiveSection(tab);
      },
      {
        root: scrollRoot instanceof HTMLElement ? scrollRoot : null,
        rootMargin: '-96px 0px -45% 0px',
        threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.5, 0.75, 1],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [browseList.length, activeList.length, completedList.length]);

  const initialLandingSectionRef = useRef(
    initialChallengesStatusTab ?? (initialOpenChallengeId ? 'active' : 'browse')
  );

  /** Deep-link: scroll to the requested section once on mount. */
  useEffect(() => {
    const id = CHALLENGE_SECTION_IDS[initialLandingSectionRef.current];
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    });
  }, []);

  /** When browse/active/completed lists change, keep selection valid (do not close detail modal here). */
  useEffect(() => {
    const syncSelection = () => {
      setSelection((prev) => {
        if (!prev || prev.kind !== 'challenge') return prev;
        const id = prev.id;
        const inAny =
          browseList.some((c) => c.id === id) ||
          activeList.some((c) => c.id === id) ||
          completedList.some((c) => c.id === id);
        if (inAny) return prev;
        if (browseList.length > 0) return { kind: 'challenge', id: browseList[0]!.id };
        if (activeList.length > 0) return { kind: 'challenge', id: activeList[0]!.id };
        if (completedList.length > 0) return { kind: 'challenge', id: completedList[0]!.id };
        return null;
      });
    };

    if (skipNextFilterSyncCloseRef.current) {
      skipNextFilterSyncCloseRef.current = false;
      syncSelection();
      return;
    }

    syncSelection();
  }, [browseList, activeList, completedList]);

  /** Closing on every list refresh was dropping the detail overlay immediately after open; only close when filters change. */
  useEffect(() => {
    const key = JSON.stringify(filters);
    if (prevDiscoveryFiltersKeyRef.current === null) {
      prevDiscoveryFiltersKeyRef.current = key;
      return;
    }
    if (prevDiscoveryFiltersKeyRef.current === key) return;
    prevDiscoveryFiltersKeyRef.current = key;
    setDetailModalOpen(false);
  }, [filters]);

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
      setSelection({ kind: 'challenge', id });
      if (lifecycle === 'active') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToChallengeSection('active');
          });
        });
      }
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

  const previewShareChallengeFromBrowse = useCallback(() => {
    window.alert('Share would open here (preview).');
  }, []);

  useEffect(() => {
    if (!detailModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetailModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [detailModalOpen, closeDetailModal]);

  /** Drop open flag if the selected challenge no longer resolves (keeps UI and scroll lock in sync). */
  useEffect(() => {
    if (detailModalOpen && !challengeForDetail) {
      setDetailModalOpen(false);
    }
  }, [detailModalOpen, challengeForDetail]);

  const scrollLockedBehindOverlay =
    challengeDetailSurfaceOpen || joinFlowChallengeId != null;

  useEffect(() => {
    onScrollLockChange?.(scrollLockedBehindOverlay);
  }, [scrollLockedBehindOverlay, onScrollLockChange]);

  const renderChallengeGrid = (
    list: CommunityChallenge[],
    emptyMessage = 'No challenges in this category.'
  ) => (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {list.length === 0 ? (
        <p className="col-span-full cds-body-secondary text-[var(--cds-color-grey-600)]">{emptyMessage}</p>
      ) : (
        list.map((c) => (
          <ChallengeBrowseRowCard
            key={c.id}
            challenge={c}
            onOpenDetail={() => openChallengeModal(c.id)}
            onJoin={() => handleRequestJoinChallenge(c.id, c.cohortId)}
            onShareChallenge={previewShareChallengeFromBrowse}
          />
        ))
      )}
    </div>
  );

  return (
    <>
      <div ref={discoveryRootRef} className="flex w-full flex-col gap-0 overflow-x-visible">
        <header className="sticky top-0 z-30 bg-[var(--cds-color-white)] pb-3 shadow-[0_1px_0_rgba(15,23,42,0.06)] supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:bg-[var(--cds-color-white)]/92">
          <ChallengeDiscoveryFilterBar
            showFilters={false}
            activeSection={activeSection}
            onJump={onJump}
            filters={filters}
            onFiltersChange={setFilters}
            activeFilterCount={activeFilterCount}
          />
        </header>

        <div className="px-1 pb-4 pt-2">
          <section
            id={CHALLENGE_SECTION_IDS.browse}
            aria-labelledby="challenge-heading-browse"
            className="scroll-mt-24 pb-[48pt] md:scroll-mt-28"
          >
            <div className="mb-[24pt]">
              <ChallengeRecommendedStrip
                challenges={recommendedActive}
                onOpenDetail={openChallengeModal}
                onJoin={(c) => handleRequestJoinChallenge(c.id, c.cohortId)}
              />
            </div>
            <ChallengeDiscoveryFiltersSection
              leadingTitle={
                <h2
                  id="challenge-heading-browse"
                  className="text-xl font-semibold tracking-tight text-[var(--cds-color-grey-975)] md:text-2xl"
                >
                  Browse
                </h2>
              }
              browsePoolForFacetCounts={browseBase}
              filters={filters}
              onFiltersChange={setFilters}
              activeFilterCount={activeFilterCount}
            />
            <p className="mb-3 px-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--cds-color-grey-500)]">
              Recommended for you
            </p>
            {renderChallengeGrid(browseList)}
          </section>

          <section
            id={CHALLENGE_SECTION_IDS.active}
            aria-labelledby="challenge-heading-active"
            className="scroll-mt-24 border-t border-[var(--cds-color-grey-100)] pb-[48pt] pt-10 md:scroll-mt-28 md:pt-12"
          >
            <h2
              id="challenge-heading-active"
              className="mb-4 px-0.5 text-xl font-semibold tracking-tight text-[var(--cds-color-grey-975)] md:text-2xl"
            >
              Active
            </h2>
            {renderChallengeGrid(activeList, 'Sign up for a challenge today!')}
          </section>

          <section
            id={CHALLENGE_SECTION_IDS.completed}
            aria-labelledby="challenge-heading-completed"
            className="scroll-mt-24 border-t border-[var(--cds-color-grey-100)] pt-10 md:scroll-mt-28 md:pt-12"
          >
            <h2
              id="challenge-heading-completed"
              className="mb-4 px-0.5 text-xl font-semibold tracking-tight text-[var(--cds-color-grey-975)] md:text-2xl"
            >
              Completed
            </h2>
            {renderChallengeGrid(completedList)}
          </section>
        </div>
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
          onShareChallenge={() => {
            window.alert('Share would open here (preview).');
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
