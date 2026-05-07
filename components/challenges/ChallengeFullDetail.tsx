import React from 'react';
import type { CommunityChallenge } from '../../constants/communityChallenges';
import {
  approxHeadcountForGroup,
  buildSoloLeaderboardRows,
  formatChallengeCardHeroLabel,
  formatProgressGoalQuantityLineForFraction,
  getGroupProgressTowardGoal,
  parseChallengeGoalTotalUnits,
  parseMilestoneNumericCaps,
  tierColumnIndexForCompletedUnits,
  type SoloLeaderboardRow,
} from '../../constants/communityChallenges';
import { groupSquadForChallenge } from '../../constants/challengeSquads';
import {
  CHALLENGE_METRIC_LABELS,
  DURATION_BUCKET_LABELS,
  PARTICIPATION_MODE_LABELS,
  isCohortCollectiveChallenge,
  isIndividualChallenge,
} from '../../constants/challengeTaxonomy';
import {
  CHALLENGE_METRIC_ICONS,
  DURATION_BUCKET_ICONS,
  PARTICIPATION_MODE_ICONS,
} from '../../constants/challengePillIcons';
import { resolveChallengeDetailHeroImageSrc } from '../../constants/challengeMiniCardImage';
import { FEED_COHORT_META } from '../../constants/feedCohorts';
import { Icons } from '../Icons';
import { ChallengeDetailPanel } from './ChallengeDetailPanel';

// ─── helpers ───────────────────────────────────────────────────────────────

/** Lavender gradient — matches Browse / Active / Completed tabs (`ChallengeDiscoveryFilterBar`, Figma LOHP). */
const CHALLENGE_BUCKET_CARD_GRADIENT =
  'linear-gradient(-61.1deg, rgb(241, 238, 255) 17.86%, rgb(240, 242, 255) 75.22%)';

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
    <div
      className="w-fit inline-grid grid-cols-2 divide-x divide-[var(--cds-color-grey-200)] overflow-hidden rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-200)]"
      style={{ backgroundImage: CHALLENGE_BUCKET_CARD_GRADIENT }}
    >
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
        <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">
          {isCohortCollectiveChallenge(challenge)
            ? 'Shared cohort goal'
            : isIndividualChallenge(challenge)
              ? 'Challenge goal'
              : 'Team goal'}
        </p>
        <p className="mt-1 text-[18px] font-bold tabular-nums leading-tight text-[var(--cds-color-grey-975)]">
          {goalTotal}
          <span className="ml-1 text-sm font-medium text-[var(--cds-color-grey-500)]">{unitLabel}</span>
        </p>
      </div>
    </div>
  );
}

/** 0–1 progress toward the challenge’s final goal (explicit per-group map when present). */
function groupProgressTowardFinalGoal(challenge: CommunityChallenge, groupNumber: number): number {
  const explicit = challenge.groupProgressTowardGoal?.[groupNumber];
  if (explicit != null) return Math.min(1, Math.max(0, explicit));
  const layout = challenge.groupsAtMilestoneTier;
  if (layout) {
    for (let t = 0; t < layout.length; t++) {
      if (layout[t]?.includes(groupNumber)) {
        return getGroupProgressTowardGoal(challenge, groupNumber, t);
      }
    }
  }
  return 0;
}

/** Solo mode: top cohort learners + optional “You” row below rank 5. */
function IndividualLeaderboard({
  challenge,
  optedIn,
  milestoneCaps,
}: {
  challenge: CommunityChallenge;
  optedIn: boolean;
  milestoneCaps: number[];
}) {
  const lastTarget = challenge.milestones[challenge.milestones.length - 1]?.target;
  const unitLabel = extractUnitLabel(lastTarget);
  const goalTotal = parseChallengeGoalTotalUnits(challenge);
  const { top, yours } = buildSoloLeaderboardRows(challenge, { optedIn });

  const milestoneSummaryForProgress = (progress01: number): { title: string; subtitle: string | null } => {
    if (goalTotal != null && milestoneCaps.length === challenge.milestones.length) {
      const units = Math.round(Math.min(1, Math.max(0, progress01)) * goalTotal);
      const col = tierColumnIndexForCompletedUnits(units, milestoneCaps);
      const m = challenge.milestones[col];
      if (!m) return { title: '—', subtitle: null };
      const cap = milestoneCaps[col];
      return {
        title: m.label,
        subtitle: cap != null ? `${cap} ${unitLabel}`.trim() : m.target ?? null,
      };
    }
    return { title: '—', subtitle: null };
  };

  const goalProgressLine = (progress01: number): string => {
    if (goalTotal != null && unitLabel) {
      const u = Math.round(Math.min(1, Math.max(0, progress01)) * goalTotal);
      return `${u} / ${goalTotal} ${unitLabel}`;
    }
    return (
      formatProgressGoalQuantityLineForFraction(challenge, progress01) ?? `${Math.round(progress01 * 100)}%`
    );
  };

  const pillMuted =
    'border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] text-[var(--cds-color-grey-800)]';
  const pillActive =
    'border-[var(--cds-color-blue-500)] bg-[var(--cds-color-blue-25)] text-[var(--cds-color-grey-975)] shadow-sm ring-2 ring-[var(--cds-color-blue-400)]/35';

  const renderRow = (row: SoloLeaderboardRow, key: string, borderBottom: boolean) => {
    const { title: milestoneTitle, subtitle: milestoneSubtitle } = milestoneSummaryForProgress(row.progress01);
    return (
      <li
        key={key}
        className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap ${
          borderBottom ? 'border-b border-[var(--cds-color-grey-100)]' : ''
        } ${row.isYou ? 'bg-[var(--cds-color-blue-25)]' : ''}`}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-semibold text-[var(--cds-color-grey-500)]"
          aria-label={`Rank ${row.rank}`}
        >
          {row.rank}
        </span>

        <div className="min-w-0 flex-1 basis-[min(100%,16rem)]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[11px] font-bold leading-tight ${row.isYou ? pillActive : pillMuted}`}
            >
              {row.displayLabel}
            </span>
          </div>
        </div>

        <div className="flex w-[calc(50%-0.75rem)] flex-col sm:w-[9rem] sm:shrink-0">
          <span className="text-[12px] font-semibold leading-tight text-[var(--cds-color-grey-975)]">
            {milestoneTitle}
          </span>
          {milestoneSubtitle ? (
            <span className="mt-0.5 text-[11px] leading-snug text-[var(--cds-color-grey-600)]">
              {milestoneSubtitle}
            </span>
          ) : null}
        </div>

        <span className="ml-auto w-[calc(50%-0.75rem)] text-right text-[13px] font-semibold tabular-nums text-[var(--cds-color-grey-975)] sm:ml-0 sm:w-[7.25rem] sm:shrink-0">
          {goalProgressLine(row.progress01)}
        </span>
      </li>
    );
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)]">
        <div className="px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-[var(--cds-color-grey-975)]">Cohort leaderboard</p>
          <p className="mt-0.5 cds-body-tertiary text-[var(--cds-color-grey-600)]">
            Solo rankings toward the challenge goal
            {goalTotal != null && unitLabel ? (
              <>
                {' '}
                ({goalTotal} {unitLabel})
              </>
            ) : null}
            .
            {optedIn
              ? ' Top learners shown; your row appears below if you’re outside the top five.'
              : ' Top learners in this cohort.'}
          </p>
        </div>

        <div
          className="hidden items-center gap-3 border-b border-[var(--cds-color-grey-200)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cds-color-grey-800)] sm:flex"
          aria-hidden
        >
          <span className="flex w-6 shrink-0 justify-center">#</span>
          <span className="min-w-0 flex-1">Learner</span>
          <span className="w-[9rem] shrink-0">Next milestone</span>
          <span className="w-[7.25rem] shrink-0 text-right">Goal progress</span>
        </div>

        <ol>
          {top.map((row, idx) =>
            renderRow(row, `solo-${row.rank}`, idx < top.length - 1 || yours != null)
          )}
          {yours ? (
            <li
              role="presentation"
              className="list-none border-b border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--cds-color-grey-500)]"
            >
              Your rank
            </li>
          ) : null}
          {yours ? renderRow(yours, 'solo-you', false) : null}
        </ol>
      </div>
    </div>
  );
}

/**
 * Single leaderboard for active challenges: all squads ranked by overall pace toward the team goal,
 * with milestone tier and full goal progress columns (same list chrome as the prior milestone panel).
 */
function MilestoneLeaderboard({
  challenge,
  optedIn,
  milestoneCaps,
}: {
  challenge: CommunityChallenge;
  optedIn: boolean;
  milestoneCaps: number[];
}) {
  const lastTarget = challenge.milestones[challenge.milestones.length - 1]?.target;
  const unitLabel = extractUnitLabel(lastTarget);
  const goalTotal = parseChallengeGoalTotalUnits(challenge);

  if (isIndividualChallenge(challenge)) {
    return (
      <IndividualLeaderboard challenge={challenge} optedIn={optedIn} milestoneCaps={milestoneCaps} />
    );
  }

  const allGroupNumbers = Array.from({ length: challenge.groupCount }, (_, i) => i + 1);
  const sortedGroups = [...allGroupNumbers].sort(
    (a, b) => groupProgressTowardFinalGoal(challenge, b) - groupProgressTowardFinalGoal(challenge, a)
  );

  const collective = isCohortCollectiveChallenge(challenge);

  const milestoneSummaryForGroup = (g: number, progress01: number): { title: string; subtitle: string | null } => {
    if (goalTotal != null && milestoneCaps.length === challenge.milestones.length) {
      const units = Math.round(Math.min(1, Math.max(0, progress01)) * goalTotal);
      const col = tierColumnIndexForCompletedUnits(units, milestoneCaps);
      const m = challenge.milestones[col];
      if (!m) return { title: '—', subtitle: null };
      const cap = milestoneCaps[col];
      return {
        title: m.label,
        subtitle: cap != null ? `${cap} ${unitLabel}`.trim() : m.target ?? null,
      };
    }
    return { title: '—', subtitle: null };
  };

  const goalProgressLine = (progress01: number): string => {
    if (goalTotal != null && unitLabel) {
      const u = Math.round(Math.min(1, Math.max(0, progress01)) * goalTotal);
      return `${u} / ${goalTotal} ${unitLabel}`;
    }
    return (
      formatProgressGoalQuantityLineForFraction(challenge, progress01) ?? `${Math.round(progress01 * 100)}%`
    );
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)]">
        <div className="px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-[var(--cds-color-grey-975)]">
            {collective ? 'Cohort progress' : 'Team leaderboard'}
          </p>
          <p className="mt-0.5 cds-body-tertiary text-[var(--cds-color-grey-600)]">
            {collective ? (
              <>
                Progress toward the shared cohort goal
                {goalTotal != null && unitLabel ? (
                  <>
                    {' '}
                    ({goalTotal} {unitLabel})
                  </>
                ) : null}
                .
              </>
            ) : (
              <>
                Squads ranked by progress toward the team goal
                {goalTotal != null && unitLabel ? (
                  <>
                    {' '}
                    ({goalTotal} {unitLabel})
                  </>
                ) : null}
                .
              </>
            )}
          </p>
        </div>

        <div
          className="hidden items-center gap-3 border-b border-[var(--cds-color-grey-200)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cds-color-grey-800)] sm:flex"
          aria-hidden
        >
          {!collective ? <span className="flex w-6 shrink-0 justify-center">#</span> : null}
          <span className="min-w-0 flex-1">{collective ? 'Cohort' : 'Team'}</span>
          <span className="w-[9rem] shrink-0">Next milestone</span>
          <span className="w-[7.25rem] shrink-0 text-right">Goal progress</span>
        </div>

        <ol>
          {sortedGroups.map((g, rankIdx) => {
            const squad = groupSquadForChallenge(challenge, g);
            const isYours = optedIn && g === challenge.groupIndex;
            const progress01 = groupProgressTowardFinalGoal(challenge, g);
            const { title: milestoneTitle, subtitle: milestoneSubtitle } = milestoneSummaryForGroup(g, progress01);
            const headcount = approxHeadcountForGroup(challenge, g);
            const rank = rankIdx + 1;

            return (
              <li
                key={g}
                className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap ${
                  rankIdx < sortedGroups.length - 1 ? 'border-b border-[var(--cds-color-grey-100)]' : ''
                } ${isYours ? 'bg-[var(--cds-color-blue-25)]' : ''}`}
              >
                {!collective ? (
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-semibold text-[var(--cds-color-grey-500)]"
                    aria-label={`Rank ${rank}`}
                  >
                    {rank}
                  </span>
                ) : null}

                <div className="min-w-0 flex-1 basis-[min(100%,16rem)]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[11px] font-bold leading-tight ${squad.muted}`}
                    >
                      {squad.label}
                    </span>
                  </div>
                  <p className="mt-0.5 cds-body-tertiary text-[var(--cds-color-grey-500)]">
                    ~{headcount.toLocaleString()} members
                  </p>
                </div>

                <div className="flex w-[calc(50%-0.75rem)] flex-col sm:w-[9rem] sm:shrink-0">
                  <span className="text-[12px] font-semibold leading-tight text-[var(--cds-color-grey-975)]">
                    {milestoneTitle}
                  </span>
                  {milestoneSubtitle ? (
                    <span className="mt-0.5 text-[11px] leading-snug text-[var(--cds-color-grey-600)]">
                      {milestoneSubtitle}
                    </span>
                  ) : null}
                </div>

                <span className="ml-auto w-[calc(50%-0.75rem)] text-right text-[13px] font-semibold tabular-nums text-[var(--cds-color-grey-975)] sm:ml-0 sm:w-[7.25rem] sm:shrink-0">
                  {goalProgressLine(progress01)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** Challenge tips card shown in the body (not just the footer). */
function ChallengeTipsCard({ steps, className = '' }: { steps: string[]; className?: string }) {
  if (steps.length === 0) return null;
  return (
    <div
      className={`rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] px-4 py-4 sm:h-full sm:min-h-0 ${className}`.trim()}
    >
      <h4 className="cds-subtitle-sm flex items-center gap-1.5 text-[var(--cds-color-grey-975)]">
        <span className="material-symbols-rounded text-[16px] text-[var(--cds-color-amber-700)]" aria-hidden>
          lightbulb
        </span>
        Challenge tips
      </h4>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 cds-body-secondary text-[var(--cds-color-grey-700)]">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

/** Minimal milestone list + goal summary for unjoined/upcoming challenges. */
function UnjoinedGoalPreview({
  challenge,
  tipsAside,
}: {
  challenge: CommunityChallenge;
  /** Rendered to the right of the goal summary on sm+; stacks below on narrow viewports. */
  tipsAside?: React.ReactNode;
}) {
  const goalTotal = parseChallengeGoalTotalUnits(challenge);
  const lastTarget = challenge.milestones[challenge.milestones.length - 1]?.target;
  const unitLabel = extractUnitLabel(lastTarget);

  return (
    <div className="space-y-3">
      {/* Goal summary + optional tips (side-by-side from sm) */}
      <div
        className={`flex flex-col gap-4 ${tipsAside ? 'sm:flex-row sm:items-stretch sm:gap-4 md:gap-6' : ''}`}
      >
        <div
          className="w-fit shrink-0 self-start inline-grid grid-cols-2 divide-x divide-[var(--cds-color-grey-200)] overflow-hidden rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-200)]"
          style={{ backgroundImage: CHALLENGE_BUCKET_CARD_GRADIENT }}
        >
          <div className="px-4 py-3">
            <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">Your goal</p>
            <p className="mt-0.5 text-[18px] font-bold tabular-nums leading-tight text-[var(--cds-color-grey-975)]">
              {challenge.learnerGoalUnits ?? goalTotal}
              <span className="ml-1 text-sm font-medium text-[var(--cds-color-grey-500)]">{unitLabel}</span>
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">
              {isCohortCollectiveChallenge(challenge)
                ? 'Shared cohort goal'
                : isIndividualChallenge(challenge)
                  ? 'Challenge goal'
                  : 'Team goal'}
            </p>
            <p className="mt-0.5 text-[18px] font-bold tabular-nums leading-tight text-[var(--cds-color-grey-975)]">
              {goalTotal}
              <span className="ml-1 text-sm font-medium text-[var(--cds-color-grey-500)]">{unitLabel}</span>
            </p>
          </div>
        </div>
        {tipsAside ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{tipsAside}</div>
        ) : null}
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
  /** Hero share control next to Join (active/upcoming, not yet opted in). */
  onShareChallenge?: () => void;
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
  onShareChallenge,
  onOpenShareout,
  onResumeLearning,
  learnerFirstName = 'Priya',
}) => {
  const isCompleted = challenge.lifecycle === 'completed';
  const isUpcoming = challenge.lifecycle === 'upcoming';
  const isActive = challenge.lifecycle === 'active';

  const milestoneCaps = parseMilestoneNumericCaps(challenge);
  const learnerGroupSquad = groupSquadForChallenge(challenge, challenge.groupIndex);
  const collectiveChallenge = isCohortCollectiveChallenge(challenge);
  const individualChallenge = isIndividualChallenge(challenge);
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
  const detailHeroSrc = resolveChallengeDetailHeroImageSrc(challenge);

  return (
    <div className="overflow-visible rounded-2xl border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] shadow-[var(--cds-elevation-level1)]">

      {/* ── Hero banner + meta pills / CTAs overlay ───────────────── */}
      <div className="relative aspect-[21/9] max-h-[min(200px,32svh)] min-h-[88px] w-full overflow-hidden rounded-t-2xl bg-[var(--cds-color-grey-100)]">
        <img
          src={detailHeroSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          loading="lazy"
          decoding="async"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.45)_38%,rgba(0,0,0,0.1)_68%,transparent_100%)]"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 px-4 pb-4 pt-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="line-clamp-2 max-w-[min(100%,14rem)] rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-semibold leading-snug text-sky-950 shadow-sm">
              {formatChallengeCardHeroLabel(challenge)}
            </span>
            <span className="rounded-md border border-white/30 bg-white/90 px-2 py-0.5 text-[11px] font-medium text-[var(--cds-color-grey-900)] shadow-sm backdrop-blur-[2px]">
              {cohortMeta.pillLabel}
              {userInCohort ? ' · member' : ' · not joined'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-white/30 bg-white/90 px-2 py-0.5 text-[11px] text-[var(--cds-color-grey-800)] shadow-sm backdrop-blur-[2px]">
              <ParticipationIcon className="h-3 w-3 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
              {PARTICIPATION_MODE_LABELS[challenge.participationMode]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-white/30 bg-white/90 px-2 py-0.5 text-[11px] text-[var(--cds-color-grey-800)] shadow-sm backdrop-blur-[2px]">
              <MetricIcon className="h-3 w-3 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
              {CHALLENGE_METRIC_LABELS[challenge.challengeMetric]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-white/30 bg-white/90 px-2 py-0.5 text-[11px] text-[var(--cds-color-grey-800)] shadow-sm backdrop-blur-[2px]">
              <DurationIcon className="h-3 w-3 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
              {DURATION_BUCKET_LABELS[challenge.durationBucket]}
            </span>
          </div>
          {(isActive && !optedIn) || isUpcoming ? (
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
              {(isActive && !optedIn) || (isUpcoming && !optedIn) ? (
                <div className="flex w-full flex-row items-center justify-end gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onShareChallenge?.()}
                    aria-label="Share challenge"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/45 bg-black/30 text-white shadow-md backdrop-blur-md transition hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <Icons.Share className="h-[18px] w-[18px] shrink-0 text-white" aria-hidden strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={joinChallenge}
                    className="rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-4 py-2 cds-action-secondary text-[var(--cds-color-white)] shadow-md hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
                  >
                    {joinPrimaryLabel}
                  </button>
                </div>
              ) : null}
              {isUpcoming && optedIn && (
                <span
                  className="rounded-[var(--cds-border-radius-100)] border border-white/40 bg-white/90 px-4 py-2 cds-action-secondary text-[var(--cds-color-grey-975)] shadow-md backdrop-blur-[2px]"
                  role="status"
                >
                  Joined
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Header (title + description) ───────────────────────── */}
      <div className="relative overflow-hidden border-b border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] px-4 pb-4 pt-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold leading-snug text-[var(--cds-color-grey-975)] sm:text-xl">{challenge.name}</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--cds-color-grey-700)]">{challenge.whyJoin}</p>
          {!userInCohort && showJoinCta ? (
            <div className="rounded-lg border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] px-3 py-2.5 text-sm text-[var(--cds-color-grey-800)]">
              <p className="font-bold text-[var(--cds-color-grey-975)]">{cohortMeta.label}</p>
              <p className="mt-1 text-[var(--cds-color-grey-700)]">{cohortMeta.shortDescription}</p>
              <p className="mt-1.5 text-xs text-[var(--cds-color-grey-600)]">
                {cohortMeta.memberCount.toLocaleString()} members · joining enrolls you in this cohort and opts you into the
                challenge.
              </p>
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
                    {challenge.completedHeroSubline ??
                      (collectiveChallenge
                        ? 'Great job contributing to the cohort goal!'
                        : individualChallenge
                          ? 'Great job on the cohort leaderboard!'
                          : `Great job ${learnerGroupSquad.label}!`)}
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

            {/* Your goal vs Team goal + tips (tips sit higher for active joined, same pattern as preview) */}
            {challenge.steps.length > 0 ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-4 md:gap-6">
                <div className="shrink-0 self-start">
                  <GoalSummaryCard challenge={challenge} />
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <ChallengeTipsCard steps={challenge.steps} />
                </div>
              </div>
            ) : (
              <GoalSummaryCard challenge={challenge} />
            )}

            {/* Milestone leaderboard */}
            <MilestoneLeaderboard challenge={challenge} optedIn={optedIn} milestoneCaps={milestoneCaps} />
          </>
        )}

        {/* ACTIVE (not joined) or UPCOMING: simplified goal + milestones + tips */}
        {!isCompleted && (!optedIn || isUpcoming) && challenge.milestones.length > 0 && (
          <UnjoinedGoalPreview
            challenge={challenge}
            tipsAside={
              challenge.steps.length > 0 ? <ChallengeTipsCard steps={challenge.steps} /> : undefined
            }
          />
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
