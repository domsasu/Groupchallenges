import React from 'react';
import { FEED_COHORT_META, type FeedCohortId } from '../../constants/feedCohorts';

export interface SuggestChallengeStripCardProps {
  cohortId: FeedCohortId;
  isSelected: boolean;
  onSelect: () => void;
  /** Full-width card for left discovery column; default is horizontal strip sizing. */
  variant?: 'strip' | 'stack';
}

/**
 * Slim strip for cohorts with no upcoming challenge — dashed outline, no hero graphic
 * (aligned with the old “suggest a challenge” empty state).
 */
export const SuggestChallengeStripCard: React.FC<SuggestChallengeStripCardProps> = ({
  cohortId,
  isSelected,
  onSelect,
  variant = 'strip',
}) => {
  const headline = 'Add a challenge';
  const stack = variant === 'stack';
  const cohortPill = FEED_COHORT_META[cohortId].pillLabel;

  const stripClasses = `h-[235px] w-[7.5rem] shrink-0 snap-start items-center justify-center rounded-2xl text-center ${
    isSelected
      ? 'border-[var(--cds-color-blue-700)] bg-[var(--cds-color-blue-25)] ring-2 ring-[var(--cds-color-blue-700)]/25'
      : 'border-[var(--cds-color-grey-200)] bg-transparent hover:border-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-grey-25)]'
  }`;

  const stackClasses = `w-full min-h-[5.5rem] items-stretch justify-center rounded-xl text-left ${
    isSelected
      ? 'border-[var(--cds-color-blue-700)] bg-[var(--cds-color-grey-25)] ring-1 ring-[var(--cds-color-blue-700)]'
      : 'border-[var(--cds-color-grey-300)] bg-[var(--cds-color-white)] hover:border-[var(--cds-color-grey-400)]'
  }`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col overflow-hidden border-2 border-dashed px-2.5 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)] ${
        stack ? stackClasses : stripClasses
      }`}
      aria-pressed={isSelected}
      aria-label={`${headline} for ${cohortPill}. Show details below.`}
    >
      {stack ? (
        <div className="w-full text-left">
          <p className="text-[10px] font-medium text-[var(--cds-color-grey-500)]">{cohortPill}</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-[var(--cds-color-grey-975)]">{headline}</p>
        </div>
      ) : (
        <p className="line-clamp-5 w-full text-sm font-semibold leading-snug text-[var(--cds-color-grey-975)]">{headline}</p>
      )}
    </button>
  );
};
