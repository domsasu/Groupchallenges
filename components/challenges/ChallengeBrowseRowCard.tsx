import React, { useMemo } from 'react';
import {
  formatChallengeCardHeroLabel,
  formatProgressGoalQuantityLineForFraction,
  type CommunityChallenge,
} from '../../constants/communityChallenges';
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
import { resolveChallengeBrowseRowImageSrc } from '../../constants/challengeMiniCardImage';
import { FEED_COHORT_META } from '../../constants/feedCohorts';
import { challengeWhyJoinOneLiner } from './challengeListOneLiner';

export interface ChallengeBrowseRowCardProps {
  challenge: CommunityChallenge;
  onOpenDetail: () => void;
  onJoin: () => void;
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

  return (
    <div className="flex w-full items-stretch gap-3 rounded-xl border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] p-3 text-left shadow-sm transition hover:border-[var(--cds-color-grey-300)] sm:gap-4 sm:p-4">
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
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-950">
              {formatChallengeCardHeroLabel(challenge)}
            </span>
            <span className="text-[10px] font-semibold text-[var(--cds-color-grey-900)]">{cohortMeta.pillLabel}</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-snug text-[var(--cds-color-grey-975)] sm:text-base">
            {challenge.name}
          </p>
          {oneLiner ? (
            <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--cds-color-grey-600)]">{oneLiner}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--cds-color-grey-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--cds-color-grey-700)]">
              <MetricIcon className="h-2.5 w-2.5 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
              {CHALLENGE_METRIC_LABELS[challenge.challengeMetric]}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--cds-color-grey-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--cds-color-grey-700)]">
              <PartIcon className="h-2.5 w-2.5 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
              {PARTICIPATION_MODE_LABELS[challenge.participationMode]}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--cds-color-grey-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--cds-color-grey-700)]">
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
      <div className="flex min-w-max shrink-0 flex-col justify-center self-stretch whitespace-nowrap border-l border-[var(--cds-color-grey-100)] pl-3 sm:pl-4">
        {mode === 'join' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            className="shrink-0 whitespace-nowrap rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
          >
            {label}
          </button>
        ) : mode === 'joined' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="shrink-0 whitespace-nowrap rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-300)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[var(--cds-color-grey-800)] shadow-none transition hover:border-[var(--cds-color-grey-400)] hover:bg-[var(--cds-color-grey-25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
          >
            {label}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="shrink-0 whitespace-nowrap rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-300)] bg-[var(--cds-color-white)] px-4 py-2.5 text-sm font-semibold text-[var(--cds-color-grey-800)] shadow-sm transition hover:border-[var(--cds-color-grey-400)] hover:bg-[var(--cds-color-grey-25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
          >
            {label}
          </button>
        )}
      </div>
    </div>
  );
};
