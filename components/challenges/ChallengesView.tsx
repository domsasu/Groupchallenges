import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MOCK_COMMUNITY_CHALLENGES, type CommunityChallenge } from '../../constants/communityChallenges';
import {
  clearChallengeJoinedViaFlow,
  markChallengeJoinedViaFlow,
  mergeCommunityChallengesWithStorage,
  persistChallengesFromMock,
  VIBE_CHALLENGE_ID,
} from '../../constants/communityChallengesPersistence';
import { FEED_COHORT_META, type FeedCohortId } from '../../constants/feedCohorts';
import {
  challengesMatchingStatusTab,
  DEFAULT_CHALLENGE_DISCOVERY_FILTERS,
  filterChallengesByDiscovery,
  sortDiscoveryChallenges,
  type ChallengeDiscoveryFilters,
  type ChallengesStatusTab,
} from '../../constants/challengeFilters';
import { useCommunityCohortMembership } from '../../context/CommunityCohortMembershipContext';
import { ChallengeDiscoveryFilterBar } from './ChallengeDiscoveryFilterBar';
import { ChallengeFullDetail } from './ChallengeFullDetail';
import { ChallengeJoinFlow } from './ChallengeJoinFlow';
import { ChallengeMiniCard } from './ChallengeMiniCard';
import { SuggestChallengeStripCard } from './SuggestChallengeStripCard';

type ChallengeSelection =
  | { kind: 'challenge'; id: string }
  | { kind: 'suggest'; cohortId: FeedCohortId }
  | null;

export const ChallengesView: React.FC = () => {
  const { joinedCohortIds, isInCohort, joinCohort } = useCommunityCohortMembership();

  const [challenges, setChallenges] = useState<CommunityChallenge[]>(() =>
    mergeCommunityChallengesWithStorage(
      MOCK_COMMUNITY_CHALLENGES.map((c) => ({ ...c, members: c.members?.map((m) => ({ ...m })) }))
    )
  );

  useEffect(() => {
    persistChallengesFromMock(challenges);
  }, [challenges]);

  const [statusTab, setStatusTab] = useState<ChallengesStatusTab>(() => {
    const initial = mergeCommunityChallengesWithStorage(MOCK_COMMUNITY_CHALLENGES);
    const hasActive = initial.some((c) => c.lifecycle === 'active' && c.optedIn);
    return hasActive ? 'active' : 'browse';
  });

  const [filters, setFilters] = useState<ChallengeDiscoveryFilters>(() => ({
    ...DEFAULT_CHALLENGE_DISCOVERY_FILTERS,
  }));

  const [selection, setSelection] = useState<ChallengeSelection>(() => {
    const list = mergeCommunityChallengesWithStorage(MOCK_COMMUNITY_CHALLENGES);
    const activeJoined = list.filter((c) => c.lifecycle === 'active' && c.optedIn);
    if (activeJoined.length > 0) {
      const sorted = sortDiscoveryChallenges(activeJoined, 'active', joinedCohortIds);
      return { kind: 'challenge', id: sorted[0]!.id };
    }
    const browse = list.filter((c) => c.lifecycle === 'upcoming' || (c.lifecycle === 'active' && !c.optedIn));
    const sortedBrowse = sortDiscoveryChallenges(browse, 'browse', joinedCohortIds);
    return sortedBrowse.length > 0 ? { kind: 'challenge', id: sortedBrowse[0]!.id } : null;
  });

  const baseForTab = useMemo(
    () => challengesMatchingStatusTab(challenges, statusTab),
    [challenges, statusTab]
  );

  const filteredSorted = useMemo(() => {
    const filtered = filterChallengesByDiscovery(baseForTab, filters, joinedCohortIds);
    return sortDiscoveryChallenges(filtered, statusTab, joinedCohortIds);
  }, [baseForTab, filters, joinedCohortIds, statusTab]);

  const cohortIdsWithoutUpcomingChallenge = useMemo(() => {
    if (statusTab !== 'browse') return [];
    const withBrowsable = new Set(
      challenges
        .filter((c) => c.lifecycle === 'upcoming' || (c.lifecycle === 'active' && !c.optedIn))
        .map((c) => c.cohortId)
    );
    return joinedCohortIds.filter((id) => !withBrowsable.has(id));
  }, [challenges, statusTab, joinedCohortIds]);

  const hasChallengeList = filteredSorted.length > 0;
  const hasSuggestStrip = statusTab === 'browse' && cohortIdsWithoutUpcomingChallenge.length > 0;
  const hasAnyStrip = hasChallengeList || hasSuggestStrip;

  const challengeForDetail = useMemo(() => {
    if (!selection || selection.kind !== 'challenge') return null;
    return challenges.find((c) => c.id === selection.id) ?? null;
  }, [selection, challenges]);

  /** When tab or filters change, keep selection if possible; else first challenge or suggest card. */
  useEffect(() => {
    setSelection((prev) => {
      if (prev?.kind === 'challenge' && filteredSorted.some((c) => c.id === prev.id)) {
        return prev;
      }
      if (filteredSorted.length > 0) {
        return { kind: 'challenge', id: filteredSorted[0]!.id };
      }
      if (statusTab === 'browse' && cohortIdsWithoutUpcomingChallenge.length > 0) {
        return { kind: 'suggest', cohortId: cohortIdsWithoutUpcomingChallenge[0]! };
      }
      return null;
    });
  }, [statusTab, filters, filteredSorted, cohortIdsWithoutUpcomingChallenge]);

  const suggestChallengeForCohort = useCallback((cohortLabel: string) => {
    window.alert(
      `Challenge proposals for ${cohortLabel} will be reviewed by cohort moderators. This is a preview—no request was sent.`
    );
  }, []);

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

  const completeJoinChallenge = useCallback((id: string, groupIndex: number) => {
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
  }, []);

  const handleRequestJoinChallenge = useCallback(
    (challengeId: string, cohortId: FeedCohortId) => {
      if (!isInCohort(cohortId)) {
        joinCohort(cohortId);
      }
      beginJoinChallenge(challengeId);
    },
    [isInCohort, joinCohort, beginJoinChallenge]
  );

  const selectChallenge = (id: string) => {
    setSelection((prev) => (prev?.kind === 'challenge' && prev.id === id ? prev : { kind: 'challenge', id }));
  };

  const selectSuggest = (cohortId: FeedCohortId) => {
    setSelection((prev) =>
      prev?.kind === 'suggest' && prev.cohortId === cohortId ? prev : { kind: 'suggest', cohortId }
    );
  };

  const activeCount = useMemo(
    () => challenges.filter((c) => c.lifecycle === 'active' && c.optedIn).length,
    [challenges]
  );

  return (
    <>
    <div className="flex h-[calc(100dvh-5.5rem)] max-h-[calc(100dvh-5.5rem)] min-h-[22rem] w-full flex-col gap-0">
      {/* Airbnb-style filter rails — full width above the two-pane split */}
      <header className="shrink-0 border-b border-[var(--cds-color-grey-200)] pb-4">
        <ChallengeDiscoveryFilterBar
          statusTab={statusTab}
          onStatusTabChange={setStatusTab}
          activeJoinedCount={activeCount}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-0 lg:flex-row lg:items-stretch lg:gap-0 lg:pt-4">
      <section
        className="flex min-h-0 w-full min-w-0 flex-1 flex-col border-[var(--cds-color-grey-200)] lg:h-full lg:w-[30%] lg:max-w-[min(100%,380px)] lg:flex-none lg:shrink-0 lg:border-r lg:pr-4"
        aria-label="Challenge discovery"
      >
        <div
          className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] custom-scrollbar"
          role="tabpanel"
          aria-labelledby={`challenge-status-${statusTab}`}
        >
          {!hasAnyStrip ? (
            <p className="cds-body-secondary text-[var(--cds-color-grey-600)]">No challenges in this category.</p>
          ) : (
            <>
              {filteredSorted.map((c) => (
                <ChallengeMiniCard
                  key={c.id}
                  challenge={c}
                  isSelected={selection?.kind === 'challenge' && selection.id === c.id}
                  onSelect={() => selectChallenge(c.id)}
                />
              ))}
              {statusTab === 'browse' &&
                cohortIdsWithoutUpcomingChallenge.map((cohortId) => (
                  <SuggestChallengeStripCard
                    key={`suggest-${cohortId}`}
                    cohortId={cohortId}
                    variant="stack"
                    isSelected={selection?.kind === 'suggest' && selection.cohortId === cohortId}
                    onSelect={() => selectSuggest(cohortId)}
                  />
                ))}
            </>
          )}
        </div>
      </section>

      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-t border-[var(--cds-color-grey-200)] pt-4 lg:h-full lg:w-[70%] lg:flex-1 lg:border-t-0 lg:border-l-0 lg:pt-0 lg:pl-4"
        aria-label="Challenge details"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] custom-scrollbar">
        {selection?.kind === 'challenge' && challengeForDetail && (
          <ChallengeFullDetail
            challenge={challengeForDetail}
            optedIn={challengeForDetail.optedIn}
            userInCohort={isInCohort(challengeForDetail.cohortId)}
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

        {selection?.kind === 'suggest' && (
          <div className="overflow-hidden rounded-2xl border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] shadow-[var(--cds-elevation-level1)]">
            {(() => {
              const meta = FEED_COHORT_META[selection.cohortId];
              return (
                <>
                  <div className="border-b border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] px-4 py-4 sm:px-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] px-2.5 py-0.5 cds-body-secondary text-[var(--cds-color-grey-975)]">
                        {meta.pillLabel}
                      </span>
                    </div>
                    <h2 className="cds-subtitle-md text-[var(--cds-color-grey-975)]">No upcoming challenge yet</h2>
                    <p className="mt-1 cds-body-tertiary text-[var(--cds-color-grey-600)]">
                      {meta.label} · {meta.memberCount.toLocaleString()} members
                    </p>
                  </div>
                  <div className="space-y-4 p-4 sm:p-5">
                    <p className="cds-body-secondary text-[var(--cds-color-grey-700)]">
                      There isn&apos;t an upcoming group challenge for this cohort yet. Suggest one so learners can opt
                      in when it starts.
                    </p>
                    <button
                      type="button"
                      onClick={() => suggestChallengeForCohort(meta.label)}
                      className="w-full rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-grey-900)] px-4 py-3 cds-action-secondary text-[var(--cds-color-white)] hover:bg-[var(--cds-color-grey-975)] sm:w-auto"
                    >
                      Suggest a challenge
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {!selection && (
          <div className="rounded-2xl border border-dashed border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] px-6 py-10 text-center">
            <p className="cds-body-secondary text-[var(--cds-color-grey-600)]">
              Select a challenge on the left to see details here.
            </p>
          </div>
        )}
        </div>
      </section>
      </div>
    </div>
    {joinFlowChallenge && (
      <ChallengeJoinFlow
        challenge={joinFlowChallenge}
        onClose={() => setJoinFlowChallengeId(null)}
        onComplete={(groupIndex) => completeJoinChallenge(joinFlowChallenge.id, groupIndex)}
      />
    )}
    </>
  );
};
