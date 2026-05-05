import React from 'react';
import {
  formatChallengeCardHeroLabel,
  formatProgressGoalQuantityLine,
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
import { resolveChallengeMiniCardImageSrc } from '../../constants/challengeMiniCardImage';
import { FEED_COHORT_META } from '../../constants/feedCohorts';

export interface ChallengeMiniCardProps {
  challenge: CommunityChallenge;
  isSelected: boolean;
  onSelect: () => void;
}

export const ChallengeMiniCard: React.FC<ChallengeMiniCardProps> = ({
  challenge,
  isSelected,
  onSelect,
}) => {
  const cohortMeta = FEED_COHORT_META[challenge.cohortId];
  const MetricIcon = CHALLENGE_METRIC_ICONS[challenge.challengeMetric];
  const PartIcon = PARTICIPATION_MODE_ICONS[challenge.participationMode];
  const DurIcon = DURATION_BUCKET_ICONS[challenge.durationBucket];
  const progressLine = formatProgressGoalQuantityLine(challenge);
  const thumbSrc = resolveChallengeMiniCardImageSrc(challenge);
  const showProgress =
    challenge.lifecycle !== 'upcoming' &&
    (challenge.lifecycle === 'completed' || challenge.optedIn) &&
    progressLine;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`flex w-full items-center gap-3 rounded-xl border bg-[var(--cds-color-white)] p-3 text-left shadow-sm transition hover:border-[var(--cds-color-grey-300)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)] ${
        isSelected
          ? 'border-[var(--cds-color-blue-700)] ring-1 ring-[var(--cds-color-blue-700)]'
          : 'border-[var(--cds-color-grey-200)]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-950">
          {formatChallengeCardHeroLabel(challenge)}
        </span>
        <span className="text-[10px] font-semibold text-[var(--cds-color-grey-900)]">{cohortMeta.pillLabel}</span>
        </div>
        <p className="mt-[calc(0.5rem+6pt)] text-sm font-semibold leading-snug text-[var(--cds-color-grey-975)]">{challenge.name}</p>
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
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--cds-color-grey-100)]">
            <div
              className="h-full rounded-full bg-[var(--cds-color-grey-700)]"
              style={{ width: `${Math.min(100, Math.max(0, Math.round(challenge.cardProgress * 100)))}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] tabular-nums text-[var(--cds-color-grey-600)]">{progressLine}</p>
        </div>
        ) : null}
      </div>

      <div
        className="relative h-[75px] w-[75px] shrink-0 overflow-hidden rounded-lg bg-[var(--cds-color-grey-100)] ring-1 ring-[var(--cds-color-grey-100)]"
        aria-hidden
      >
        <img
          src={thumbSrc}
          alt=""
          className="h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
      </div>
    </button>
  );
};
