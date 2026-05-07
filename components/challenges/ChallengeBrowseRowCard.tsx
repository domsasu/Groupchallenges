import React, { useMemo } from 'react';
import {
  formatChallengeCardHeroLabel,
  formatChallengeParticipantJoinedLine,
  formatProgressGoalQuantityLineForFraction,
  type CommunityChallenge,
} from '../../constants/communityChallenges';
import {
  CHALLENGE_METRIC_LABELS,
  DURATION_BUCKET_LABELS,
  PARTICIPATION_MODE_LABELS,
  type ChallengeMetric,
  type ChallengeParticipationMode,
} from '../../constants/challengeTaxonomy';
import {
  CHALLENGE_METRIC_ICONS,
  DURATION_BUCKET_ICONS,
  PARTICIPATION_MODE_ICONS,
} from '../../constants/challengePillIcons';
import { resolveChallengeBrowseRowImageSrc } from '../../constants/challengeMiniCardImage';
import { FEED_COHORT_META } from '../../constants/feedCohorts';
import { Icons } from '../Icons';
import { challengeWhyJoinOneLiner } from './challengeListOneLiner';

/** Compact pill copy on browse rows (filters/detail keep full taxonomy strings). */
function browseRowMetricPillLabel(metric: ChallengeMetric): string {
  return metric === 'quantity' ? 'Quantity' : CHALLENGE_METRIC_LABELS[metric];
}

/** Short labels on browse rows: drop “ compete” from Solo / Teams. */
function browseRowParticipationPillLabel(mode: ChallengeParticipationMode): string {
  if (mode === 'individual') return 'Solo';
  if (mode === 'inner_cohort') return 'Teams';
  return PARTICIPATION_MODE_LABELS[mode];
}

export interface ChallengeBrowseRowCardProps {
  challenge: CommunityChallenge;
  onOpenDetail: () => void;
  onJoin: () => void;
  /** Shown beside “See details” when the learner has joined an active/upcoming challenge. */
  onShareChallenge?: () => void;
}

type JoinCtaMode = 'join' | 'joined' | 'view';

function joinCtaForChallenge(challenge: CommunityChallenge): {
  mode: JoinCtaMode;
  label: string;
} {
  const isCompleted = challenge.lifecycle === 'completed';
  const isUpcoming = challenge.lifecycle === 'upcoming';
  const isActive = challenge.lifecycle === 'active';
  const showJoin = (isActive && !challenge.optedIn) || (isUpcoming && !challenge.optedIn);

  if (isCompleted) {
    return { mode: 'view', label: 'View' };
  }
  if (showJoin) {
    return { mode: 'join', label: 'Join' };
  }
  if ((isActive || isUpcoming) && challenge.optedIn) {
    return { mode: 'joined', label: 'See details' };
  }
  return { mode: 'view', label: 'View' };
}

export const ChallengeBrowseRowCard: React.FC<ChallengeBrowseRowCardProps> = ({
  challenge,
  onOpenDetail,
  onJoin,
  onShareChallenge,
}) => {
  const cohortMeta = FEED_COHORT_META[challenge.cohortId];
  const MetricIcon = CHALLENGE_METRIC_ICONS[challenge.challengeMetric];
  const PartIcon = PARTICIPATION_MODE_ICONS[challenge.participationMode];
  const DurIcon = DURATION_BUCKET_ICONS[challenge.durationBucket];
  const teamProgressTowardGoal =
    challenge.groupProgressTowardGoal?.[challenge.groupIndex] != null
      ? Math.min(1, Math.max(0, challenge.groupProgressTowardGoal[challenge.groupIndex]!))
      : Math.min(1, Math.max(0, challenge.cardProgress));
  const progressLine = formatProgressGoalQuantityLineForFraction(challenge, teamProgressTowardGoal);
  const thumbSrc = resolveChallengeBrowseRowImageSrc(challenge);
  const showProgress =
    challenge.lifecycle !== 'upcoming' &&
    (challenge.lifecycle === 'completed' || challenge.optedIn) &&
    progressLine;
  const oneLiner = useMemo(() => challengeWhyJoinOneLiner(challenge.whyJoin), [challenge.whyJoin]);
  const { mode, label } = joinCtaForChallenge(challenge);
  const joinedSocialProofLine = mode === 'join' ? formatChallengeParticipantJoinedLine(challenge) : null;

  return (
    <div className="flex w-full items-stretch gap-3 rounded-xl border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] p-3 text-left shadow-sm transition-[border-color,box-shadow] hover:border-[var(--cds-color-grey-300)] hover:shadow-md sm:gap-4 sm:p-4">
      <button
        type="button"
        onClick={onOpenDetail}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)] sm:gap-4"
      >
        <div
          className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-[var(--cds-color-grey-100)] ring-1 ring-[var(--cds-color-grey-100)] sm:h-[100px] sm:w-[100px]"
          aria-hidden
        >
          <img
            src={thumbSrc}
            alt=""
            className="h-full w-full object-cover object-top"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cds-color-blue-700)]">
              {formatChallengeCardHeroLabel(challenge)}
            </span>
            <span className="text-[11px] font-medium text-[var(--cds-color-grey-600)]">{cohortMeta.pillLabel}</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-snug text-[var(--cds-color-grey-975)] sm:text-base">
            {challenge.name}
          </p>
          {oneLiner ? (
            <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--cds-color-grey-600)]">{oneLiner}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="inline-flex items-center gap-0.5 rounded-full border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] px-2 py-0.5 text-[10px] font-medium text-[var(--cds-color-grey-700)]">
              <MetricIcon className="h-2.5 w-2.5 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
              {browseRowMetricPillLabel(challenge.challengeMetric)}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] px-2 py-0.5 text-[10px] font-medium text-[var(--cds-color-grey-700)]">
              <PartIcon className="h-2.5 w-2.5 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
              {browseRowParticipationPillLabel(challenge.participationMode)}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] px-2 py-0.5 text-[10px] font-medium text-[var(--cds-color-grey-700)]">
              <DurIcon className="h-2.5 w-2.5 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
              {DURATION_BUCKET_LABELS[challenge.durationBucket]}
            </span>
          </div>
          {showProgress ? (
            <div className="mt-3 max-w-md">
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--cds-color-grey-100)]">
                <div
                  className="h-full rounded-full bg-[var(--cds-color-green-700)]"
                  style={{ width: `${Math.min(100, Math.max(0, Math.round(teamProgressTowardGoal * 100)))}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] tabular-nums text-[var(--cds-color-grey-600)]">{progressLine}</p>
            </div>
          ) : null}
        </div>
      </button>
      <div
        className={`flex shrink-0 flex-col justify-start self-start ${
          mode === 'joined'
            ? 'min-w-0 max-w-[min(18rem,calc(100vw-8rem))]'
            : mode === 'view'
              ? 'min-w-[7.25rem] max-w-[10rem]'
              : 'w-[5.75rem] sm:w-[6.5rem]'
        }`}
      >
        {mode === 'join' ? (
          <div className="flex flex-col items-stretch gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onJoin();
              }}
              className="w-full rounded-lg bg-[var(--cds-color-blue-700)] px-3 py-2 text-center text-sm font-semibold text-white shadow-[inset_0_0_0_1px_var(--cds-color-blue-700)] transition hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
            >
              {label}
            </button>
            {joinedSocialProofLine ? (
              <p className="text-center text-[11px] leading-tight text-[var(--cds-color-grey-600)]">
                {joinedSocialProofLine}
              </p>
            ) : null}
          </div>
        ) : mode === 'joined' ? (
          <div className="flex w-full min-w-0 flex-row items-center gap-2">
            {onShareChallenge ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShareChallenge();
                }}
                aria-label="Share challenge"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--cds-color-white)] text-[var(--cds-color-grey-975)] shadow-[inset_0_0_0_1px_var(--cds-color-grey-300)] transition hover:bg-[var(--cds-color-grey-25)] hover:shadow-[inset_0_0_0_1px_var(--cds-color-grey-400)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
              >
                <Icons.Share className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.5} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail();
              }}
              className="min-w-0 flex-1 rounded-lg bg-[var(--cds-color-white)] px-3 py-2 text-center text-sm font-semibold text-[var(--cds-color-grey-975)] shadow-[inset_0_0_0_1px_var(--cds-color-grey-300)] transition hover:bg-[var(--cds-color-grey-25)] hover:shadow-[inset_0_0_0_1px_var(--cds-color-grey-400)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
            >
              {label}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="w-full rounded-lg bg-[var(--cds-color-white)] px-3 py-2 text-center text-sm font-semibold text-[var(--cds-color-grey-975)] shadow-[inset_0_0_0_1px_var(--cds-color-grey-300)] transition hover:bg-[var(--cds-color-grey-25)] hover:shadow-[inset_0_0_0_1px_var(--cds-color-grey-400)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
          >
            {label}
          </button>
        )}
      </div>
    </div>
  );
};
