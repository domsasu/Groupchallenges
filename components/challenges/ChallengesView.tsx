import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MOCK_COMMUNITY_CHALLENGES,
  challengesForLifecycle,
  sortChallengesByJoinedCohortOrder,
  sortChallengesForChallengesView,
  type ChallengeLifecycle,
  type CommunityChallenge,
} from '../../constants/communityChallenges';
import {
  clearChallengeJoinedViaFlow,
  markChallengeJoinedViaFlow,
  mergeCommunityChallengesWithStorage,
  persistChallengesFromMock,
  VIBE_CHALLENGE_ID,
} from '../../constants/communityChallengesPersistence';
import { FEED_COHORT_META, JOINED_FEED_COHORT_IDS, type FeedCohortId } from '../../constants/feedCohorts';
import { ChallengeCard } from './ChallengeCard';
import { ChallengeFullDetail } from './ChallengeFullDetail';
import { ChallengeJoinFlow } from './ChallengeJoinFlow';
import { SuggestChallengeStripCard } from './SuggestChallengeStripCard';

const STATUS_TABS: { id: ChallengeLifecycle; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'upcoming', label: 'Browse' },
  { id: 'completed', label: 'Completed' },
];

type ChallengeSelection =
  | { kind: 'challenge'; id: string }
  | { kind: 'suggest'; cohortId: FeedCohortId }
  | null;

export const ChallengesView: React.FC = () => {
  const [challenges, setChallenges] = useState<CommunityChallenge[]>(() =>
    mergeCommunityChallengesWithStorage(
      MOCK_COMMUNITY_CHALLENGES.map((c) => ({ ...c, members: c.members?.map((m) => ({ ...m })) }))
    )
  );

  useEffect(() => {
    persistChallengesFromMock(challenges);
  }, [challenges]);
  const [statusTab, setStatusTab] = useState<ChallengeLifecycle>(() => {
    const initial = mergeCommunityChallengesWithStorage(MOCK_COMMUNITY_CHALLENGES);
    const hasActive = initial.some((c) => c.lifecycle === 'active' && c.optedIn);
    return hasActive ? 'active' : 'upcoming';
  });
  const [selection, setSelection] = useState<ChallengeSelection>(() => {
    const list = sortChallengesByJoinedCohortOrder(
      MOCK_COMMUNITY_CHALLENGES.filter((c) => c.lifecycle === 'active' && c.optedIn)
    );
    return list.length > 0 ? { kind: 'challenge', id: list[0].id } : null;
  });
  /** Auto-select the first strip card when switching tabs so details always show without an extra click. */
  useEffect(() => {
    let list: CommunityChallenge[];
    if (statusTab === 'active') {
      list = sortChallengesByJoinedCohortOrder(
        challenges.filter((c) => c.lifecycle === 'active' && c.optedIn)
      );
    } else if (statusTab === 'upcoming') {
      list = challenges
        .filter((c) => c.lifecycle === 'upcoming' || (c.lifecycle === 'active' && !c.optedIn))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    } else {
      list = sortChallengesForChallengesView(challenges, statusTab);
    }
    if (list.length > 0) {
      setSelection({ kind: 'challenge', id: list[0].id });
      return;
    }
    if (statusTab === 'upcoming') {
      const withBrowsable = new Set(
        challenges
          .filter((c) => c.lifecycle === 'upcoming' || (c.lifecycle === 'active' && !c.optedIn))
          .map((c) => c.cohortId)
      );
      const missing = JOINED_FEED_COHORT_IDS.filter((id) => !withBrowsable.has(id));
      if (missing.length > 0) {
        setSelection({ kind: 'suggest', cohortId: missing[0] });
        return;
      }
    }
    setSelection(null);
    // Only re-run when the tab changes — avoid resetting selection when `challenges` updates (e.g. opt-in toggle).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [statusTab]);

  const filtered = useMemo(() => {
    if (statusTab === 'active') {
      return sortChallengesByJoinedCohortOrder(
        challenges.filter((c) => c.lifecycle === 'active' && c.optedIn)
      );
    }
    if (statusTab === 'upcoming') {
      return challenges
        .filter((c) => c.lifecycle === 'upcoming' || (c.lifecycle === 'active' && !c.optedIn))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }
    return sortChallengesForChallengesView(challenges, statusTab);
  }, [challenges, statusTab]);

  const cohortIdsWithoutUpcomingChallenge = useMemo(() => {
    if (statusTab !== 'upcoming') return [];
    const withBrowsable = new Set(
      challenges
        .filter((c) => c.lifecycle === 'upcoming' || (c.lifecycle === 'active' && !c.optedIn))
        .map((c) => c.cohortId)
    );
    return JOINED_FEED_COHORT_IDS.filter((id) => !withBrowsable.has(id));
  }, [challenges, statusTab]);

  const hasChallengeStrip = filtered.length > 0;
  const hasSuggestStrip = statusTab === 'upcoming' && cohortIdsWithoutUpcomingChallenge.length > 0;
  const hasAnyStrip = hasChallengeStrip || hasSuggestStrip;

  const challengeForDetail = useMemo(() => {
    if (!selection || selection.kind !== 'challenge') return null;
    return challenges.find((c) => c.id === selection.id) ?? null;
  }, [selection, challenges]);

  const suggestChallengeForCohort = useCallback((cohortLabel: string) => {
    window.alert(
      `Challenge proposals for ${cohortLabel} will be reviewed by cohort moderators. This is a preview—no request was sent.`
    );
  }, []);

  const toggleOptedIn = useCallback((id: string) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = !c.optedIn;
        if (!next && id === VIBE_CHALLENGE_ID) {
          clearChallengeJoinedViaFlow(VIBE_CHALLENGE_ID);
        }
        return {
          ...c,
          optedIn: next,
          learnerContributionProgress: next
            ? c.learnerContributionProgress == null
              ? 0
              : c.learnerContributionProgress
            : undefined,
        };
      })
    );
  }, []);

  const [joinFlowChallengeId, setJoinFlowChallengeId] = useState<string | null>(null);

  const joinFlowChallenge = useMemo(
    () => (joinFlowChallengeId ? challenges.find((c) => c.id === joinFlowChallengeId) ?? null : null),
    [joinFlowChallengeId, challenges]
  );

  /** Opens the join flow only — enrollment applies in `completeJoinChallenge` after the learner finishes. */
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

  const selectChallenge = (id: string) => {
    setSelection((prev) => (prev?.kind === 'challenge' && prev.id === id ? null : { kind: 'challenge', id }));
  };

  const selectSuggest = (cohortId: FeedCohortId) => {
    setSelection((prev) =>
      prev?.kind === 'suggest' && prev.cohortId === cohortId ? null : { kind: 'suggest', cohortId }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Challenge status">
        {STATUS_TABS.map((t) => {
          const selected = statusTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`challenge-status-${t.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setStatusTab(t.id)}
              className={`rounded-full px-4 py-2 cds-body-secondary transition-colors ${
                selected
                  ? 'bg-[var(--cds-color-white)] text-[var(--cds-color-grey-975)] shadow-sm ring-1 ring-[var(--cds-color-grey-200)]'
                  : 'bg-[var(--cds-color-grey-100)] text-[var(--cds-color-grey-700)] hover:bg-[var(--cds-color-grey-200)]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4" role="tabpanel" aria-labelledby={`challenge-status-${statusTab}`}>
        {!hasAnyStrip ? (
          <p className="cds-body-secondary text-[var(--cds-color-grey-600)]">No challenges in this category.</p>
        ) : (
          <>
            <div
              className="flex flex-row items-stretch gap-3 overflow-x-auto pl-[5px] pb-2 pt-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
              aria-label="Challenges and suggestions"
            >
              {filtered.map((c) => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  isSelected={selection?.kind === 'challenge' && selection.id === c.id}
                  onSelect={() => selectChallenge(c.id)}
                />
              ))}
              {statusTab === 'upcoming' &&
                cohortIdsWithoutUpcomingChallenge.map((cohortId) => (
                  <SuggestChallengeStripCard
                    key={`suggest-${cohortId}`}
                    cohortId={cohortId}
                    isSelected={selection?.kind === 'suggest' && selection.cohortId === cohortId}
                    onSelect={() => selectSuggest(cohortId)}
                  />
                ))}
            </div>

            {selection?.kind === 'challenge' && challengeForDetail && (
              <ChallengeFullDetail
                challenge={challengeForDetail}
                optedIn={challengeForDetail.optedIn}
                onToggleOptIn={() => toggleOptedIn(challengeForDetail.id)}
                onRequestJoinChallenge={() => beginJoinChallenge(challengeForDetail.id)}
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
                          <span className="rounded-full bg-[var(--cds-color-blue-25)] px-2.5 py-0.5 cds-body-secondary text-[var(--cds-color-grey-975)]">
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
                          className="w-full rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-4 py-3 cds-action-secondary text-[var(--cds-color-white)] hover:bg-[var(--cds-color-blue-800)] sm:w-auto"
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
                  Select a challenge above to read details here.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {joinFlowChallenge && (
        <ChallengeJoinFlow
          challenge={joinFlowChallenge}
          onClose={() => setJoinFlowChallengeId(null)}
          onComplete={(groupIndex) => completeJoinChallenge(joinFlowChallenge.id, groupIndex)}
        />
      )}
    </div>
  );
};
