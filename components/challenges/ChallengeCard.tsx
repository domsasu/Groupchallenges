import React from 'react';
import {
  formatChallengeCardHeroLabel,
  formatProgressGoalTotalLabel,
  type CommunityChallenge,
} from '../../constants/communityChallenges';
import { CHALLENGE_TIER_ART_SRC, CHALLENGE_TIER_PROGRESS_TONE } from '../../constants/challengeTierVisuals';
import { FEED_COHORT_META } from '../../constants/feedCohorts';
import { Icons } from '../Icons';

export interface ChallengeCardProps {
  challenge: CommunityChallenge;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Slim vertical strip — tier art, progress, and selection state; detail panel below.
 */
export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, isSelected, onSelect }) => {
  const isCompleted = challenge.lifecycle === 'completed';
  const isUpcoming = challenge.lifecycle === 'upcoming';
  const isActive = challenge.lifecycle === 'active';

  const lifecyclePillClass =
    challenge.lifecycle === 'active'
      ? 'bg-emerald-500/90 text-white'
      : challenge.lifecycle === 'upcoming'
        ? 'bg-amber-500/90 text-white'
        : 'bg-white/20 text-white backdrop-blur-sm';

  const tierSrc = challenge.cardHeroImageSrc ?? CHALLENGE_TIER_ART_SRC[challenge.visualTier];
  const progressTone = CHALLENGE_TIER_PROGRESS_TONE[challenge.visualTier];
  const progressPct = Math.min(100, Math.max(0, Math.round(challenge.cardProgress * 100)));
  const moduleOrGoalLine = formatProgressGoalTotalLabel(challenge) ?? `${progressPct}%`;

  const showGroupProgressBar = !isUpcoming && (isCompleted || challenge.optedIn);

  const cardAriaLabel = isUpcoming
    ? `${challenge.name}. Show details below.`
    : !showGroupProgressBar
      ? `${challenge.name}. Show details below.`
      : `${challenge.name}. ${moduleOrGoalLine}.${challenge.optedIn ? ' Joined.' : ''} Show details below.`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-[235px] w-[7.5rem] shrink-0 snap-start flex-col rounded-2xl border-2 bg-[var(--cds-color-white)] text-left shadow-[var(--cds-elevation-level1)] transition hover:shadow-[var(--cds-elevation-level2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)] ${
        isSelected
          ? 'border-[var(--cds-color-blue-700)]'
          : 'border-[var(--cds-color-grey-200)]'
      }`}
      aria-pressed={isSelected}
      aria-label={cardAriaLabel}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[calc(1rem-2px)]">
        <div className="relative flex min-h-0 flex-[1.25] flex-col bg-[#141518]">
          <div className="relative z-10 flex flex-wrap items-start gap-1 px-2 pt-2">
            <span
              className={`line-clamp-2 max-w-[5.25rem] rounded-md px-1.5 py-0.5 text-[9px] font-semibold leading-tight ${lifecyclePillClass}`}
            >
              {formatChallengeCardHeroLabel(challenge)}
            </span>
          </div>
          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-1.5 py-0.5">
            <img
              src={tierSrc}
              alt=""
              className="max-h-[72px] w-full max-w-[4.5rem] object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
          {showGroupProgressBar && (
            <div
              className="relative z-10 mt-auto h-1 w-full shrink-0 bg-white/15"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progress ${progressPct} percent`}
            >
              <div className={`h-full ${progressTone}`} style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-start gap-0.5 bg-[var(--cds-color-white)] px-2 pb-2 pt-1.5">
          <p className="line-clamp-2 text-[13px] font-bold leading-tight text-[var(--cds-color-grey-975)]">{challenge.name}</p>
          {!isUpcoming && (
            <p className="text-[10px] font-semibold leading-snug tabular-nums text-[var(--cds-color-grey-600)]">
              {moduleOrGoalLine}
            </p>
          )}
          {isActive && challenge.optedIn && (
            <p className="pt-[2pt] text-xs font-semibold leading-tight text-[var(--cds-color-blue-700)]">Joined</p>
          )}
          <div className="mt-auto flex flex-col gap-1">
            {isCompleted && challenge.outcome?.won && (
              <span className="inline-flex" aria-label="Won">
                <Icons.Trophy className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              </span>
            )}
            <p className="truncate text-[9px] text-[var(--cds-color-grey-600)]">{FEED_COHORT_META[challenge.cohortId].pillLabel}</p>
          </div>
        </div>
      </div>
    </button>
  );
};
