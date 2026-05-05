import React, { useEffect, useState } from 'react';
import type { CommunityChallenge } from '../../constants/communityChallenges';
import {
  approxHeadcountForGroup,
  formatChallengeCardHeroLabel,
  formatProgressGoalQuantityLineForFraction,
  getGroupProgressTowardGoal,
  parseChallengeGoalTotalUnits,
  parseMilestoneNumericCaps,
  resolveGroupsAtTierColumns,
} from '../../constants/communityChallenges';
import { groupSquadForChallenge } from '../../constants/challengeSquads';
import {
  CHALLENGE_METRIC_LABELS,
  DURATION_BUCKET_LABELS,
  PARTICIPATION_MODE_LABELS,
} from '../../constants/challengeTaxonomy';
import {
  CHALLENGE_METRIC_ICONS,
  DURATION_BUCKET_ICONS,
  PARTICIPATION_MODE_ICONS,
} from '../../constants/challengePillIcons';
import { FEED_COHORT_META } from '../../constants/feedCohorts';
import { Icons } from '../Icons';
import { ChallengeDetailPanel } from './ChallengeDetailPanel';

// ─── helpers ───────────────────────────────────────────────────────────────

/** Extract the unit word from a milestone target string, e.g. "100 hrs" → "hrs". */
function extractUnitLabel(target: string | undefined): string {
  if (!target) return '';
  const m = target.trim().match(/^\d+(?:\.\d+)?\s+(.+)$/);
  return m ? m[1].trim() : '';
}

// ─── sub-components ────────────────────────────────────────────────────────

/** Two-column goal summary shown at the top when the learner is enrolled. */
function GoalSummaryCard({ challenge }: { challenge: CommunityChallenge }) {
  const goalTotal = parseChallengeGoalTotalUnits(challenge);
  const lastTarget = challenge.milestones[challenge.milestones.length - 1]?.target;
  const unitLabel = extractUnitLabel(lastTarget);

  const completedPersonal =
    goalTotal != null && challenge.learnerContributionProgress != null
      ? Math.round(challenge.learnerContributionProgress * goalTotal)
      : 0;

  return (
    <div className="w-fit inline-grid grid-cols-2 divide-x divide-[var(--cds-color-grey-200)] overflow-hidden rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)]">
      <div className="px-4 py-3">
        <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">Your goal</p>
        <p className="mt-1 text-[18px] font-bold tabular-nums leading-tight text-[var(--cds-color-grey-975)]">
          {completedPersonal}
          <span className="ml-1 text-sm font-medium text-[var(--cds-color-grey-500)]">
            / {challenge.learnerGoalUnits ?? goalTotal} {unitLabel}
          </span>
        </p>
      </div>
      <div className="px-4 py-3">
        <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">Team goal</p>
        <p className="mt-1 text-[18px] font-bold tabular-nums leading-tight text-[var(--cds-color-grey-975)]">
          {goalTotal}
          <span className="ml-1 text-sm font-medium text-[var(--cds-color-grey-500)]">{unitLabel}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Milestone tabs + leaderboard for enrolled learners.
 * Defaults to the tab where the learner's own team sits; all tabs are clickable.
 */
function MilestoneLeaderboard({
  challenge,
  optedIn,
  milestoneCaps,
  learnerUnitsCompleted,
}: {
  challenge: CommunityChallenge;
  optedIn: boolean;
  milestoneCaps: number[];
  learnerUnitsCompleted: number | null;
}) {
  const tierGroupsLayout =
    resolveGroupsAtTierColumns(challenge) ?? challenge.groupsAtMilestoneTier;

  // Display nodes: prepend a "start" origin node before the real milestones
  const lastTarget = challenge.milestones[challenge.milestones.length - 1]?.target;
  const unitLabel = extractUnitLabel(lastTarget);
  const displayNodes = [
    { id: '__start__', label: 'Start', target: `0 ${unitLabel}`.trim(), isStart: true },
    ...challenge.milestones.map((m) => ({ ...m, isStart: false })),
  ];

  /**
   * The display node index the learner has actually completed/reached.
   * - 0  = still working toward the first milestone (sits on start node)
   * - k  = learner has crossed the cap of real milestone k (displayNodes[k])
   * This drives both "You're here" placement and the default selected tab.
   */
  const learnerHereDisplayIdx = (() => {
    if (!optedIn || learnerUnitsCompleted === null) return -1;
    let idx = 0; // start node — no milestone completed yet
    for (let k = 0; k < milestoneCaps.length; k++) {
      if (learnerUnitsCompleted >= milestoneCaps[k]) {
        idx = k + 1;
      } else {
        break;
      }
    }
    return idx;
  })();

  const defaultIdx = learnerHereDisplayIdx >= 0 ? learnerHereDisplayIdx : 0;
  const [selectedIdx, setSelectedIdx] = useState(defaultIdx);

  useEffect(() => {
    setSelectedIdx(defaultIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id, defaultIdx]);

  /**
   * Bucket mapping — display node i directly maps to tierGroupsLayout[i]:
   *   start node (i=0) → bucket 0 = groups working toward the first milestone
   *   25 hrs node (i=1) → bucket 1 = groups that have passed 25 hrs
   *   etc.
   * This means the 25 hrs badge shows how many teams have *passed* 25 hrs, not how many are heading there.
   */
  const realMilestoneIdx = selectedIdx;
  const selectedMilestone = challenge.milestones[realMilestoneIdx];
  const rawGroupsAtMilestone = tierGroupsLayout?.[realMilestoneIdx] ?? [];
  const sortedGroups = [...rawGroupsAtMilestone].sort((a, b) => {
    const pa = getGroupProgressTowardGoal(challenge, a, realMilestoneIdx);
    const pb = getGroupProgressTowardGoal(challenge, b, realMilestoneIdx);
    return pb - pa;
  });

  /**
   * Fill % for the connector drawn before display node `i` (i >= 1).
   * Only reflects the enrolled learner's group progress — grey for spectators.
   * lo = cap[i-2] (or 0 for i=1), hi = cap[i-1].
   */
  const connectorFill = (i: number): number => {
    if (!optedIn || learnerUnitsCompleted === null || milestoneCaps.length < i) return 0;
    const lo = i === 1 ? 0 : (milestoneCaps[i - 2] ?? 0);
    const hi = milestoneCaps[i - 1] ?? 0;
    if (hi <= lo) return 0;
    const u = learnerUnitsCompleted;
    if (u <= lo) return 0;
    if (u >= hi) return 100;
    return ((u - lo) / (hi - lo)) * 100;
  };

  const leaderboardTitle =
    sortedGroups.length > 0
      ? `Teams working toward ${selectedMilestone?.target ?? selectedMilestone?.label}`
      : `No teams at ${selectedMilestone?.target ?? selectedMilestone?.label} yet`;

  return (
    <div className="space-y-3">
      {/* ── Leaderboard panel (milestone track lives in the header) ── */}
      <div
        className="overflow-hidden rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)]"
      >
        {/* Panel header: milestone track */}
        <div className="border-b border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] px-5 pt-5 pb-4">
          <div
            className="overflow-x-auto"
            role="tablist"
            aria-label="Milestone levels"
          >
            <div className="relative flex min-w-max items-center">
              {displayNodes.map((m, i) => {
                const isSelected = i === selectedIdx;
                // "You're here" = the highest node the learner has actually completed.
                // If no milestone reached yet (e.g. 5 / 25 hrs), this is the start node (i=0).
                const isLearnerHere = optedIn && learnerHereDisplayIdx === i;
                // A real milestone node (i >= 1) is "past" if learner has cleared its cap
                const isPastLearner =
                  optedIn &&
                  !m.isStart &&
                  milestoneCaps.length >= i &&
                  learnerUnitsCompleted !== null &&
                  learnerUnitsCompleted >= (milestoneCaps[i - 1] ?? Infinity);
                // Team count only applies to real milestone nodes
                // Node i → bucket i: start(0)=teams heading to milestone 1, 25hrs(1)=teams past 25hrs, etc.
                const teamsHere = tierGroupsLayout?.[i]?.length ?? 0;
                const fillPct = connectorFill(i);

                return (
                  <React.Fragment key={m.id}>
                    {/* Connector segment before this node */}
                    {i > 0 && (
                      <div className="relative h-[2px] flex-1 min-w-[40px] bg-[var(--cds-color-grey-200)]">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-[var(--cds-color-blue-700)] transition-all duration-500"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    )}

                    {m.isStart ? (
                      /* ── Start origin node (same size as milestones, non-interactive) ── */
                      <div className="flex flex-col items-center">
                        <span className="mb-2 text-[13px] font-bold tabular-nums leading-tight text-[var(--cds-color-grey-400)]">
                          {m.target}
                        </span>
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${
                          optedIn
                            ? 'border-[var(--cds-color-blue-700)] bg-[var(--cds-color-blue-700)]'
                            : 'border-[var(--cds-color-grey-300)] bg-[var(--cds-color-white)]'
                        }`}>
                          <span className={`text-[13px] font-bold tabular-nums ${optedIn ? 'text-white' : 'text-[var(--cds-color-grey-600)]'}`}>
                            0
                          </span>
                        </div>
                        <span className="mt-2 text-[10px] leading-snug text-[var(--cds-color-grey-400)]">
                          {m.label}
                        </span>
                        {/* "You're here" on start when learner hasn't cleared any milestone yet */}
                        {isLearnerHere && (
                          <span className="mt-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold leading-none text-emerald-800">
                            You&apos;re here
                          </span>
                        )}
                      </div>
                    ) : (
                      /* ── Real milestone node (clickable tab) ── */
                      <button
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setSelectedIdx(i)}
                        className="relative flex flex-col items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cds-color-blue-700)]"
                      >
                        {/* Target label above node */}
                        <span
                          className={`mb-2 text-[13px] font-bold tabular-nums leading-tight transition-colors ${
                            isSelected
                              ? 'text-[var(--cds-color-blue-700)]'
                              : isPastLearner
                                ? 'text-[var(--cds-color-grey-600)]'
                                : 'text-[var(--cds-color-grey-975)]'
                          }`}
                        >
                          {m.target ?? m.label}
                        </span>

                        {/* Circle node:
                              - completed (isPastLearner): solid blue fill + check icon
                              - not yet reached (selected or not): identical grey outline + grey number */}
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                            isPastLearner
                              ? 'border-[var(--cds-color-blue-700)] bg-[var(--cds-color-blue-700)]'
                              : 'border-[var(--cds-color-grey-300)] bg-[var(--cds-color-white)]'
                          }`}
                        >
                          {isPastLearner ? (
                            <span className="material-symbols-rounded text-[22px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                              check
                            </span>
                          ) : (
                            <span className="text-[13px] font-bold tabular-nums text-[var(--cds-color-grey-600)]">
                              {i}
                            </span>
                          )}
                        </div>

                        {/* Milestone name below node */}
                        <span
                          className={`mt-2 text-[10px] leading-snug transition-colors ${
                            isSelected
                              ? 'font-semibold text-[var(--cds-color-blue-700)]'
                              : 'text-[var(--cds-color-grey-500)]'
                          }`}
                        >
                          {m.label}
                        </span>

                        {/* Team count */}
                        <span
                          className={`mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none ${
                            isSelected
                              ? 'bg-[var(--cds-color-blue-100)] text-[var(--cds-color-blue-800)]'
                              : 'bg-[var(--cds-color-grey-100)] text-[var(--cds-color-grey-500)]'
                          }`}
                        >
                          {teamsHere} team{teamsHere !== 1 ? 's' : ''}
                        </span>

                        {/* "You're here" chip */}
                        {isLearnerHere && (
                          <span className="mt-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold leading-none text-emerald-800">
                            You're here
                          </span>
                        )}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

        </div>

        {sortedGroups.length === 0 ? (
          /* Empty state */
          <div className="px-4 py-6 text-center">
            <span className="material-symbols-rounded text-[28px] text-[var(--cds-color-grey-300)]">
              emoji_events
            </span>
            <p className="mt-2 cds-body-secondary text-[var(--cds-color-grey-500)]">
              No teams here yet — be the first to reach this milestone!
            </p>
          </div>
        ) : (
          /* Ranked team list */
          <ol>
            {sortedGroups.map((g, rankIdx) => {
              const squad = groupSquadForChallenge(challenge, g);
              const isYours = optedIn && g === challenge.groupIndex;
              const progress01 = getGroupProgressTowardGoal(challenge, g, realMilestoneIdx);
              // Show progress toward the selected milestone cap (e.g. "10 / 25 hrs"),
              // not toward the final team goal (e.g. "10 / 100 hrs").
              const goalTotal = parseChallengeGoalTotalUnits(challenge);
              const milestoneCap = milestoneCaps[realMilestoneIdx] ?? null;
              const absoluteUnits =
                goalTotal != null ? Math.round(progress01 * goalTotal) : null;
              const progressLine =
                absoluteUnits != null && milestoneCap != null && unitLabel
                  ? `${absoluteUnits} / ${milestoneCap} ${unitLabel}`
                  : formatProgressGoalQuantityLineForFraction(challenge, progress01) ??
                    `${Math.round(progress01 * 100)}%`;
              const headcount = approxHeadcountForGroup(challenge, g);
              const rank = rankIdx + 1;

              return (
                <li
                  key={g}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    rankIdx < sortedGroups.length - 1
                      ? 'border-b border-[var(--cds-color-grey-100)]'
                      : ''
                  }`}
                >
                  {/* Rank number */}
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-semibold text-[var(--cds-color-grey-500)]"
                    aria-label={`Rank ${rank}`}
                  >
                    {rank}
                  </span>

                  {/* Squad info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[11px] font-bold leading-tight ${squad.muted}`}
                      >
                        {squad.label}
                      </span>
                      {isYours && (
                        <span className="cds-body-tertiary text-[var(--cds-color-grey-500)]">
                          Your team
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 cds-body-tertiary text-[var(--cds-color-grey-500)]">
                      ~{headcount.toLocaleString()} members
                    </p>
                  </div>

                  {/* Progress */}
                  <span className="shrink-0 text-right text-[13px] font-semibold tabular-nums text-[var(--cds-color-grey-975)]">
                    {progressLine}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

/** Challenge tips card shown in the body (not just the footer). */
function ChallengeTipsCard({ steps }: { steps: string[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] px-4 py-4">
      <h4 className="cds-subtitle-sm text-[var(--cds-color-grey-975)]">Challenge tips</h4>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 cds-body-secondary text-[var(--cds-color-grey-700)]">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

/** Minimal milestone list + goal summary for unjoined/upcoming challenges. */
function UnjoinedGoalPreview({ challenge }: { challenge: CommunityChallenge }) {
  const goalTotal = parseChallengeGoalTotalUnits(challenge);
  const lastTarget = challenge.milestones[challenge.milestones.length - 1]?.target;
  const unitLabel = extractUnitLabel(lastTarget);

  return (
    <div className="space-y-3">
      {/* Goal summary */}
      <div className="w-fit inline-grid grid-cols-2 divide-x divide-[var(--cds-color-grey-200)] overflow-hidden rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)]">
        <div className="px-4 py-3">
          <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">Your goal</p>
          <p className="mt-0.5 text-[18px] font-bold tabular-nums leading-tight text-[var(--cds-color-grey-975)]">
            {challenge.learnerGoalUnits ?? goalTotal}
            <span className="ml-1 text-sm font-medium text-[var(--cds-color-grey-500)]">{unitLabel}</span>
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">Team goal</p>
          <p className="mt-0.5 text-[18px] font-bold tabular-nums leading-tight text-[var(--cds-color-grey-975)]">
            {goalTotal}
            <span className="ml-1 text-sm font-medium text-[var(--cds-color-grey-500)]">{unitLabel}</span>
          </p>
        </div>
      </div>

      {/* Milestones list */}
      {challenge.milestones.length > 0 && (
        <div className="rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] px-4 py-3">
          <p className="cds-body-secondary font-semibold text-[var(--cds-color-grey-975)]">
            Milestones
          </p>
          <ol className="mt-3 space-y-2">
            {challenge.milestones.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--cds-color-grey-100)] text-[10px] font-bold text-[var(--cds-color-grey-600)]">
                  {i + 1}
                </span>
                <span className="cds-body-secondary text-[var(--cds-color-grey-975)]">
                  {m.target ?? m.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── props / main component ────────────────────────────────────────────────

export interface ChallengeFullDetailProps {
  challenge: CommunityChallenge;
  optedIn: boolean;
  /** When false, join CTA also adds the learner to the challenge cohort (handled by parent). */
  userInCohort: boolean;
  onToggleOptIn: () => void;
  onRequestJoinChallenge?: () => void;
  onOpenShareout?: () => void;
  onResumeLearning?: () => void;
  learnerFirstName?: string;
}

export const ChallengeFullDetail: React.FC<ChallengeFullDetailProps> = ({
  challenge,
  optedIn,
  userInCohort,
  onToggleOptIn,
  onRequestJoinChallenge,
  onOpenShareout,
  onResumeLearning,
  learnerFirstName = 'Priya',
}) => {
  const isCompleted = challenge.lifecycle === 'completed';
  const isUpcoming = challenge.lifecycle === 'upcoming';
  const isActive = challenge.lifecycle === 'active';

  // ── tier index for learner's group (determines default milestone tab) ──
  const milestoneCaps = parseMilestoneNumericCaps(challenge);
  const goalTotal = parseChallengeGoalTotalUnits(challenge);
  const learnerGroupExplicit = challenge.groupProgressTowardGoal?.[challenge.groupIndex];
  const progress01ForGoal = optedIn
    ? learnerGroupExplicit != null
      ? learnerGroupExplicit
      : challenge.cardProgress
    : null;
  const learnerUnitsCompleted =
    goalTotal != null && progress01ForGoal != null
      ? Math.round(Math.min(1, Math.max(0, progress01ForGoal)) * goalTotal)
      : null;
  const learnerGroupSquad = groupSquadForChallenge(challenge, challenge.groupIndex);
  const joinChallenge = onRequestJoinChallenge ?? onToggleOptIn;
  const cohortMeta = FEED_COHORT_META[challenge.cohortId];
  const showJoinCta = (isActive && !optedIn) || (isUpcoming && !optedIn);
  const joinPrimaryLabel =
    !userInCohort && showJoinCta
      ? `Join ${cohortMeta.pillLabel} & challenge`
      : 'Join challenge';

  const outcomeAwardLabel = challenge.outcome
    ? (challenge.outcome.awardLabel ?? 'Longest Streak').replace(/\.\s*$/, '')
    : '';
  const outcomeCourseCount = challenge.outcome?.completedCourseCount;
  const outcomeHasCourseStat = outcomeCourseCount != null && outcomeCourseCount > 0;

  const ParticipationIcon = PARTICIPATION_MODE_ICONS[challenge.participationMode];
  const MetricIcon = CHALLENGE_METRIC_ICONS[challenge.challengeMetric];
  const DurationIcon = DURATION_BUCKET_ICONS[challenge.durationBucket];

  return (
    <div className="overflow-visible rounded-2xl border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] shadow-[var(--cds-elevation-level1)]">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-t-2xl border-b border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] px-4 pb-4 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="line-clamp-2 max-w-[min(100%,14rem)] rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-semibold leading-snug text-sky-950">
                {formatChallengeCardHeroLabel(challenge)}
              </span>
              <span className="rounded-md border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] px-2 py-0.5 text-[11px] font-medium text-[var(--cds-color-grey-800)]">
                {cohortMeta.pillLabel}
                {userInCohort ? ' · member' : ' · not joined'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] px-2 py-0.5 text-[11px] text-[var(--cds-color-grey-700)]">
                <ParticipationIcon className="h-3 w-3 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
                {PARTICIPATION_MODE_LABELS[challenge.participationMode]}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] px-2 py-0.5 text-[11px] text-[var(--cds-color-grey-700)]">
                <MetricIcon className="h-3 w-3 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
                {CHALLENGE_METRIC_LABELS[challenge.challengeMetric]}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] px-2 py-0.5 text-[11px] text-[var(--cds-color-grey-700)]">
                <DurationIcon className="h-3 w-3 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
                {DURATION_BUCKET_LABELS[challenge.durationBucket]}
              </span>
            </div>
            <h2 className="text-lg font-semibold leading-snug text-[var(--cds-color-grey-975)] sm:text-xl">{challenge.name}</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--cds-color-grey-700)]">{challenge.whyJoin}</p>
            {!userInCohort && showJoinCta ? (
              <div className="rounded-lg border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] px-3 py-2.5 text-sm text-[var(--cds-color-grey-800)]">
                <p className="font-medium text-[var(--cds-color-grey-975)]">{cohortMeta.label}</p>
                <p className="mt-1 text-[var(--cds-color-grey-700)]">{cohortMeta.shortDescription}</p>
                <p className="mt-1.5 text-xs text-[var(--cds-color-grey-600)]">
                  {cohortMeta.memberCount.toLocaleString()} members · joining enrolls you in this cohort and opts you into
                  the challenge.
                </p>
              </div>
            ) : null}
          </div>
          {(isActive && !optedIn) || isUpcoming ? (
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
              {isActive && !optedIn && (
                <button
                  type="button"
                  onClick={joinChallenge}
                  className="rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-4 py-2 cds-action-secondary text-[var(--cds-color-white)] hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
                >
                  {joinPrimaryLabel}
                </button>
              )}
              {isUpcoming && optedIn && (
                <span
                  className="rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] px-4 py-2 cds-action-secondary text-[var(--cds-color-grey-975)] shadow-sm"
                  role="status"
                >
                  Joined ✓
                </span>
              )}
              {isUpcoming && !optedIn && (
                <button
                  type="button"
                  onClick={joinChallenge}
                  className="rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-4 py-2 cds-action-secondary text-[var(--cds-color-white)] hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
                >
                  {joinPrimaryLabel}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Body content ────────────────────────────────────────────────── */}
      <div className="space-y-4 p-4 sm:p-5">

        {/* COMPLETED: celebration banner (unchanged) */}
        {isCompleted && (
          <div className="overflow-hidden rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-100)] bg-[#F0F9F4]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(180px,360px)] sm:items-stretch sm:gap-8">
              <div className="flex min-w-0 flex-col justify-center gap-4 px-4 pt-5 pb-0 sm:px-6 sm:py-6">
                <div>
                  <p className="text-xl font-bold leading-tight tracking-tight text-[var(--cds-color-grey-975)] sm:text-2xl">
                    {FEED_COHORT_META[challenge.cohortId].pillLabel} cohort challenge winners
                  </p>
                  <p className="mt-2 text-sm font-medium leading-snug text-[var(--cds-color-grey-600)] sm:text-base">
                    {challenge.completedHeroSubline ?? `Great job ${learnerGroupSquad.label}!`}
                  </p>
                </div>
                {challenge.outcome && (
                  <p className="cds-body-secondary text-[var(--cds-color-grey-975)]">
                    {outcomeHasCourseStat ? (
                      <>
                        {learnerFirstName}, you completed{' '}
                        <strong>{outcomeCourseCount}</strong>{' '}
                        {outcomeCourseCount === 1 ? 'course' : 'courses'} and received the
                        award for <strong>{outcomeAwardLabel}</strong>.
                      </>
                    ) : (
                      <>
                        {learnerFirstName}, you received the award for{' '}
                        <strong>{outcomeAwardLabel}</strong>.
                      </>
                    )}
                  </p>
                )}
                {onOpenShareout ? (
                  <button
                    type="button"
                    onClick={onOpenShareout}
                    className="inline-flex w-fit items-center justify-center gap-2 rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
                  >
                    <Icons.Share className="h-4 w-4 shrink-0 text-white" aria-hidden />
                    Share
                  </button>
                ) : null}
              </div>
              <div className="relative h-full min-h-[180px] w-full overflow-hidden sm:min-h-0">
                <img
                  src="/challenges/completed-celebration-banner.png"
                  alt=""
                  className="h-full min-h-[180px] w-full object-cover object-right sm:min-h-0"
                  decoding="async"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE + JOINED: cohort label, goal summary, milestone leaderboard, tips */}
        {isActive && optedIn && challenge.milestones.length > 0 && (
          <>
            {/* Cohort + squad label row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="cds-subtitle-sm text-[var(--cds-color-grey-975)]">
                {FEED_COHORT_META[challenge.cohortId].pillLabel}
              </span>
              <span
                className={`inline-flex max-w-full shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-bold leading-tight ${learnerGroupSquad.active}`}
              >
                {learnerGroupSquad.label}
              </span>
            </div>

            {/* Your goal vs Team goal */}
            <GoalSummaryCard challenge={challenge} />

            {/* Milestone leaderboard */}
            <MilestoneLeaderboard
              challenge={challenge}
              optedIn={optedIn}
              milestoneCaps={milestoneCaps}
              learnerUnitsCompleted={learnerUnitsCompleted}
            />

            {/* Challenge tips */}
            {challenge.steps.length > 0 && (
              <ChallengeTipsCard steps={challenge.steps} />
            )}
          </>
        )}

        {/* ACTIVE (not joined) or UPCOMING: simplified goal + milestones + tips */}
        {!isCompleted && (!optedIn || isUpcoming) && challenge.milestones.length > 0 && (
          <>
            <UnjoinedGoalPreview challenge={challenge} />
            {challenge.steps.length > 0 && (
              <ChallengeTipsCard steps={challenge.steps} />
            )}
          </>
        )}

      </div>

      {/* ── Footer: action buttons (ChallengeDetailPanel) ──────────────── */}
      <div
        className="px-4 pb-5 pt-0 sm:px-5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <ChallengeDetailPanel
          challenge={challenge}
          optedIn={optedIn}
          onToggleOptIn={onToggleOptIn}
          onOpenShareout={onOpenShareout}
          onResumeLearning={onResumeLearning}
        />
      </div>
    </div>
  );
};
