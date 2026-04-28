import React from 'react';
import type { FeedCohortId } from '../../constants/feedCohorts';

export interface SuggestChallengeStripCardProps {
  cohortId: FeedCohortId;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Slim strip for cohorts with no upcoming challenge — dashed outline, no hero graphic
 * (aligned with the old “suggest a challenge” empty state).
 */
export const SuggestChallengeStripCard: React.FC<SuggestChallengeStripCardProps> = ({
  cohortId,
  isSelected,
  onSelect,
}) => {
  const headline = 'Add a challenge';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-[235px] w-[7.5rem] shrink-0 snap-start flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-2.5 py-2 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)] ${
        isSelected
          ? 'border-[var(--cds-color-blue-700)] bg-[var(--cds-color-blue-25)] ring-2 ring-[var(--cds-color-blue-700)]/25'
          : 'border-[var(--cds-color-grey-200)] bg-transparent hover:border-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-grey-25)]'
      }`}
      aria-pressed={isSelected}
      aria-label={`${headline}. Show details below.`}
    >
      <p className="line-clamp-5 w-full text-sm font-semibold leading-snug text-[var(--cds-color-grey-975)]">{headline}</p>
    </button>
  );
};
