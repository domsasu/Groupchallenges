import React from 'react';
import {
  FEED_COHORT_META,
  JOINABLE_FEED_COHORT_IDS,
  JOINED_FEED_COHORT_IDS,
  type FeedCohortId,
} from '../../constants/feedCohorts';
import { CohortRailAvatar } from './CohortRailAvatar';

function formatMemberLabel(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+ members`;
  if (n >= 1000) return `${Math.round(n / 1000)}K+ members`;
  return `${n}+ members`;
}

function MemberCountAndActivity({
  memberCount,
  activityPill,
}: {
  memberCount: number;
  activityPill?: string;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="cds-body-tertiary text-[var(--cds-color-grey-500)]">
        {formatMemberLabel(memberCount)}
      </span>
      {activityPill ? (
        <span className="inline-flex max-w-full items-center rounded border border-[var(--cds-color-green-200)] bg-[var(--cds-color-green-25)] px-1.5 py-px text-[10px] font-medium leading-tight text-[var(--cds-color-green-800)]">
          {activityPill}
        </span>
      ) : null}
    </div>
  );
}

interface FeedDiscoverRailProps {
  /** `null` = show the mixed “all snacks” stream. */
  activeCohortId: FeedCohortId | null;
  onSelectCohort: (id: FeedCohortId | null) => void;
  /** Called when the user joins a cohort from the discover list (not yet a member). */
  onJoinCohort: (id: FeedCohortId) => void;
  /** Override default joined cohort order (e.g. after user joins from discover). */
  joinedCohortIds?: FeedCohortId[];
  joinableCohortIds?: FeedCohortId[];
}

export const FeedDiscoverRail: React.FC<FeedDiscoverRailProps> = ({
  activeCohortId,
  onSelectCohort,
  onJoinCohort,
  joinedCohortIds = JOINED_FEED_COHORT_IDS,
  joinableCohortIds = JOINABLE_FEED_COHORT_IDS,
}) => (
  <aside className="space-y-4">
    <div className="mb-3">
      <h2 className="cds-subtitle-lg text-[var(--cds-color-grey-975)]">My Cohorts</h2>
      <p className="cds-body-tertiary mt-1.5 max-w-prose text-[var(--cds-color-grey-600)] leading-relaxed">
        View top content in your community, and join new cohorts
      </p>
    </div>
    <ul className="space-y-3">
      {joinedCohortIds.map((id) => {
        const c = FEED_COHORT_META[id];
        const isActive = activeCohortId !== null && activeCohortId === id;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelectCohort(id)}
              className={`w-full rounded-[var(--cds-border-radius-200)] border bg-[var(--cds-color-white)] p-4 text-left shadow-sm transition-colors ${
                isActive
                  ? 'border-[var(--cds-color-blue-700)] ring-1 ring-[var(--cds-color-blue-700)]'
                  : 'border-[var(--cds-color-grey-100)] hover:border-[var(--cds-color-grey-200)]'
              }`}
            >
              <div className="flex gap-3">
                <CohortRailAvatar cohortId={id} label={c.label} variant="joined" />
                <div className="min-w-0 flex-1">
                  <p
                    className={`cds-subtitle-sm ${isActive ? 'text-[var(--cds-color-grey-975)]' : 'text-[var(--cds-color-grey-900)]'}`}
                  >
                    {c.label}
                  </p>
                  <p
                    className={`cds-body-tertiary mt-1 text-[var(--cds-color-grey-600)] ${isActive ? 'leading-relaxed' : 'line-clamp-2'}`}
                  >
                    {c.shortDescription}
                  </p>
                  <MemberCountAndActivity memberCount={c.memberCount} activityPill={c.activityPill} />
                </div>
              </div>
            </button>
          </li>
        );
      })}
      {joinableCohortIds.length > 0 && joinedCohortIds.length > 0 ? (
        <li className="list-none py-3" aria-hidden="true">
          <div className="h-px w-full bg-[var(--cds-color-grey-100)]" />
        </li>
      ) : null}
      {joinableCohortIds.map((id) => {
        const c = FEED_COHORT_META[id];
        const isActive = activeCohortId !== null && activeCohortId === id;
        return (
          <li key={id}>
            <div
              className={`flex items-start gap-3 rounded-[var(--cds-border-radius-200)] border bg-[var(--cds-color-white)] p-4 shadow-sm transition-colors ${
                isActive
                  ? 'border-[var(--cds-color-blue-700)] ring-1 ring-[var(--cds-color-blue-700)]'
                  : 'border-[var(--cds-color-grey-100)] hover:border-[var(--cds-color-grey-200)]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectCohort(id)}
                className="flex min-w-0 flex-1 gap-3 text-left transition-colors hover:opacity-[0.92] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-500)] focus-visible:ring-offset-2"
              >
                <CohortRailAvatar
                  cohortId={id}
                  label={c.label}
                  variant={isActive ? 'discoverActive' : 'discoverIdle'}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`cds-subtitle-sm ${isActive ? 'text-[var(--cds-color-grey-975)]' : 'text-[var(--cds-color-grey-900)]'}`}
                  >
                    {c.label}
                  </p>
                  <p
                    className={`cds-body-tertiary mt-0.5 text-[var(--cds-color-grey-600)] ${isActive ? 'leading-relaxed' : 'truncate'}`}
                  >
                    {c.shortDescription}
                  </p>
                  <MemberCountAndActivity memberCount={c.memberCount} activityPill={c.activityPill} />
                </div>
              </button>
              {isActive ? (
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-[var(--cds-color-blue-700)] px-3 py-1.5 cds-body-secondary font-medium text-[var(--cds-color-white)] transition-colors hover:bg-[var(--cds-color-blue-800)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-500)] focus-visible:ring-offset-2"
                  aria-label={`Join ${c.label}`}
                  onClick={() => onJoinCohort(id)}
                >
                  Join
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>

    <p className="cds-body-tertiary text-[var(--cds-color-grey-400)]">Help · Terms · Privacy</p>
  </aside>
);
