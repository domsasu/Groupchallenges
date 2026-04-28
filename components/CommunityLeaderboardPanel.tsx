import React from 'react';
import {
  COHORTS,
  COHORT_LEADERBOARD,
  MiniLeaderboardRow,
  type CohortId,
} from './MyLearning';

export interface CommunityLeaderboardPanelProps {
  selectedCohort: CohortId;
  onSelectCohort: (id: CohortId) => void;
  /** Optional id for the page heading (e.g. modal `aria-labelledby`). */
  headingId?: string;
}

export function CommunityLeaderboardPanel({
  selectedCohort,
  onSelectCohort,
  headingId,
}: CommunityLeaderboardPanelProps) {
  const board = COHORT_LEADERBOARD[selectedCohort];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h2 id={headingId} className="cds-subtitle-lg text-[var(--cds-color-grey-975)]">
          Leaderboard
        </h2>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {COHORTS.map((cohort) => {
            const isActive = cohort.id === selectedCohort;
            return (
              <button
                key={cohort.id}
                type="button"
                onClick={() => onSelectCohort(cohort.id)}
                className={`cds-body-secondary h-8 rounded-[var(--cds-border-radius-400)] px-3 py-1 transition-colors ${
                  isActive
                    ? 'bg-[var(--cds-color-grey-800)] text-[var(--cds-color-white)]'
                    : 'bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] text-[var(--cds-color-grey-975)] hover:bg-[var(--cds-color-grey-25)]'
                }`}
              >
                {cohort.label}{' '}
                <span
                  className={isActive ? 'text-[var(--cds-color-grey-200)]' : 'text-[var(--cds-color-grey-600)]'}
                >
                  {cohort.members.toLocaleString()}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--cds-color-grey-600)] transition-colors hover:bg-[var(--cds-color-grey-50)] hover:text-[var(--cds-color-grey-975)]"
            aria-label="Join a cohort"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
              add
            </span>
          </button>
        </div>
      </div>

      <p className="max-w-3xl cds-body-tertiary text-[var(--cds-color-grey-600)]">
        Rankings use total learning hours logged in the cohort you have selected. Use the cohort pills above to switch
        boards and compare how you rank.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-5">
          <p className="cds-body-tertiary mb-1.5 text-[var(--cds-color-grey-600)]">Top 3</p>
          <div className="space-y-1">
            {board.top3.map((p) => (
              <React.Fragment key={p.rank}>
                <MiniLeaderboardRow peer={p} isUser={p.rank === board.userRank} isMedal />
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-5">
          <p className="cds-body-tertiary mb-1.5 text-[var(--cds-color-grey-600)]">Around you</p>
          <div className="space-y-1">
            {board.around.map((p) => (
              <React.Fragment key={p.rank}>
                <MiniLeaderboardRow peer={p} isUser={p.rank === board.userRank} isMedal={false} />
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
