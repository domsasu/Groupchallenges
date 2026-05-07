import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { FEED_COHORT_META, type FeedCohortId } from '../../constants/feedCohorts';
import { useCommunityCohortMembership } from '../../context/CommunityCohortMembershipContext';
import type { CommunityChallenge } from '../../constants/communityChallenges';
import {
  DEFAULT_CHALLENGE_DISCOVERY_FILTERS,
  filterChallengesByDiscovery,
  type ChallengeDiscoveryFilters,
  type ChallengesStatusTab,
} from '../../constants/challengeFilters';
import {
  CHALLENGE_METRIC_LABELS,
  PARTICIPATION_MODE_LABELS,
  type ChallengeMetric,
  type ChallengeParticipationMode,
} from '../../constants/challengeTaxonomy';

export interface ChallengeDiscoveryFilterBarProps {
  /** Section currently in view (scroll spy) — drives jumper emphasis. */
  activeSection: ChallengesStatusTab;
  /** Scroll the main page to the corresponding discovery section. */
  onJump: (tab: ChallengesStatusTab) => void;
  filters: ChallengeDiscoveryFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<ChallengeDiscoveryFilters>>;
  /** Non-zero when taxonomy/cohort filters differ from defaults (shown on filter icon). */
  activeFilterCount?: number;
  /** When false, only section jumpers render here — use `ChallengeDiscoveryFiltersSection` below the hero/list. */
  showFilters?: boolean;
}

export interface ChallengeDiscoveryFiltersSectionProps {
  filters: ChallengeDiscoveryFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<ChallengeDiscoveryFilters>>;
  activeFilterCount?: number;
  /** Optional heading shown to the left of the Filters control (e.g. Browse). */
  leadingTitle?: React.ReactNode;
  /** Browse-tab pool used for facet counts in dropdowns (matches `browseBase` in ChallengesView). */
  browsePoolForFacetCounts?: CommunityChallenge[];
}

type OpenBucket = null | 'participation' | 'metric';

const SECTION_JUMPERS: { id: ChallengesStatusTab; label: string }[] = [
  { id: 'browse', label: 'Browse' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

/** Coursera search–style row: checkbox, label, (count) */
function FacetCheckboxRow({
  inputId,
  checked,
  onChange,
  label,
  count,
}: {
  inputId: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  count: number;
}) {
  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-2.5 transition-colors hover:bg-[var(--cds-color-grey-25)] sm:px-2"
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 rounded-[3px] border-[var(--cds-color-grey-300)] text-[var(--cds-color-blue-700)] accent-[var(--cds-color-blue-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
      />
      <span className="min-w-0 flex-1 text-sm leading-snug text-[var(--cds-color-grey-975)]">{label}</span>
      <span className="shrink-0 tabular-nums text-sm text-[var(--cds-color-grey-500)]">({count})</span>
    </label>
  );
}

export const ChallengeDiscoveryStatusTabs: React.FC<
  Pick<ChallengeDiscoveryFilterBarProps, 'activeSection' | 'onJump'>
> = ({ activeSection, onJump }) => (
  <nav aria-label="Challenge sections" className="px-0.5">
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:gap-x-10">
      {SECTION_JUMPERS.map((t) => {
        const current = activeSection === t.id;
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onJump(t.id)}
              aria-current={current ? 'true' : undefined}
              className={`relative border-none bg-transparent pb-1 text-[clamp(0.9375rem,1.6vw,1.0625rem)] tracking-[-0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)] ${
                current
                  ? 'font-semibold text-[var(--cds-color-grey-975)]'
                  : 'font-normal text-[var(--cds-color-grey-500)] hover:text-[var(--cds-color-grey-700)]'
              }`}
            >
              {t.label}
              {current ? (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--cds-color-blue-700)]"
                  aria-hidden
                />
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);

export const ChallengeDiscoveryFiltersSection: React.FC<ChallengeDiscoveryFiltersSectionProps> = ({
  filters,
  onFiltersChange,
  activeFilterCount = 0,
  leadingTitle,
  browsePoolForFacetCounts,
}) => {
  const { joinedCohortIds } = useCommunityCohortMembership();
  const joinedSet = useMemo(() => new Set(joinedCohortIds), [joinedCohortIds]);

  const browsePool = browsePoolForFacetCounts ?? [];

  const poolSansParticipationModes = useMemo(
    () =>
      filterChallengesByDiscovery(
        browsePool,
        { ...filters, participationModes: [] },
        joinedCohortIds
      ),
    [browsePool, filters, joinedCohortIds]
  );

  const poolSansMetrics = useMemo(
    () => filterChallengesByDiscovery(browsePool, { ...filters, metrics: [] }, joinedCohortIds),
    [browsePool, filters, joinedCohortIds]
  );

  const poolSansCohortFacet = useMemo(
    () =>
      filterChallengesByDiscovery(
        browsePool,
        { ...filters, cohortScope: 'all', cohortIds: [] },
        joinedCohortIds
      ),
    [browsePool, filters, joinedCohortIds]
  );

  const participationCount = useCallback(
    (mode: ChallengeParticipationMode) =>
      poolSansParticipationModes.filter((c) => c.participationMode === mode).length,
    [poolSansParticipationModes]
  );

  const metricCount = useCallback(
    (m: ChallengeMetric) => poolSansMetrics.filter((c) => c.challengeMetric === m).length,
    [poolSansMetrics]
  );

  const myCohortsFacetCount = poolSansCohortFacet.filter((c) => joinedSet.has(c.cohortId)).length;

  const removeMyCohortTag = useCallback(
    (id: FeedCohortId) => {
      onFiltersChange((f) => {
        if (f.cohortScope !== 'my_cohorts') return f;
        const base = f.cohortIds.length > 0 ? f.cohortIds : [...joinedCohortIds];
        const next = base.filter((x) => x !== id);
        return { ...f, cohortIds: next };
      });
    },
    [joinedCohortIds, onFiltersChange]
  );

  const myCohortTagsShown = useMemo(() => {
    if (filters.cohortScope !== 'my_cohorts') return [];
    if (filters.cohortIds.length > 0) {
      return filters.cohortIds.filter((id) => joinedSet.has(id));
    }
    return [...joinedCohortIds];
  }, [filters.cohortScope, filters.cohortIds, joinedCohortIds, joinedSet]);

  const [openBucket, setOpenBucket] = useState<OpenBucket>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const filtersSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openBucket) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpenBucket(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenBucket(null);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openBucket]);

  const toggleBucket = (b: Exclude<OpenBucket, null>) => {
    setOpenBucket((prev) => (prev === b ? null : b));
  };

  /** Coursera search–style dropdown: title header, scroll body, sticky footer (Clear all + View). */
  const FilterDropdownPanel = ({
    title,
    subtitle,
    children,
    id,
    panelLabel,
    onView,
    footerClearAll,
  }: {
    title: string;
    subtitle?: React.ReactNode;
    children: React.ReactNode;
    id: string;
    panelLabel: string;
    onView: () => void;
    footerClearAll?: React.ReactNode;
  }) => (
    <div
      id={id}
      role="dialog"
      aria-label={panelLabel}
      className="absolute left-0 right-auto top-[calc(100%+8px)] z-50 flex max-h-[min(72vh,560px)] w-[min(calc(100vw-2rem),440px)] flex-col overflow-hidden rounded-2xl border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
    >
      <div className="shrink-0 px-5 pb-3 pt-5">
        <p className="text-[17px] font-bold leading-snug tracking-tight text-[var(--cds-color-grey-975)]">{title}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-0 [scrollbar-width:thin]">
        {subtitle ? (
          <p className="mb-4 text-[13px] leading-relaxed text-[var(--cds-color-grey-600)]">{subtitle}</p>
        ) : null}
        {children}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-[8pt] border-t border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] px-5 py-3.5">
        <button
          type="button"
          className="shrink-0 rounded-md bg-[var(--cds-color-blue-700)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
          onClick={onView}
        >
          View
        </button>
        {footerClearAll ?? null}
      </div>
    </div>
  );

  const FILTER_SEGMENTS = [
    {
      key: 'participation' as const,
      title: 'Participation',
      ariaControls: 'challenge-filter-participation',
      panelLabel: 'Participation and cohort filters',
    },
    {
      key: 'metric' as const,
      title: 'Challenge type',
      ariaControls: 'challenge-filter-metric',
      panelLabel: 'Challenge type filters',
    },
  ] as const;

  return (
    <div ref={filtersSectionRef} className="mb-3 shrink-0 px-1">
      <div className="flex flex-col gap-4">
        {leadingTitle ? <div className="min-w-0">{leadingTitle}</div> : null}

        {/* Pill triggers + optional active-filter badge / clear (inline). */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {activeFilterCount > 0 ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--cds-color-blue-700)] px-1.5 text-[10px] font-bold leading-none text-white">
                {activeFilterCount > 9 ? '9+' : activeFilterCount}
              </span>
              <button
                type="button"
                className="cds-action-secondary text-[13px] font-semibold text-[var(--cds-color-blue-700)] underline-offset-2 hover:underline"
                onClick={() => onFiltersChange({ ...DEFAULT_CHALLENGE_DISCOVERY_FILTERS })}
              >
                Clear all
              </button>
            </div>
          ) : null}

          <div
            id="challenge-discovery-filters"
            ref={wrapRef}
            className="relative flex min-w-0 flex-1 flex-wrap items-center gap-2"
          >
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Refine challenges">
          {FILTER_SEGMENTS.map((seg) => {
            const open = openBucket === seg.key;
            return (
              <div key={seg.key} className="relative min-w-0 sm:flex-initial">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={open ? seg.ariaControls : undefined}
                  aria-haspopup="dialog"
                  onClick={() => toggleBucket(seg.key)}
                  className={`inline-flex h-9 max-w-full min-w-0 items-center gap-2 rounded-full border border-[var(--cds-color-grey-300)] bg-[var(--cds-color-white)] py-0 pl-4 pr-3 text-left text-sm font-normal text-[var(--cds-color-grey-975)] transition hover:bg-[var(--cds-color-grey-25)] ${
                    open
                      ? 'border-[var(--cds-color-grey-800)] ring-2 ring-[var(--cds-color-grey-800)] ring-offset-2 ring-offset-[var(--cds-color-white)]'
                      : ''
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]`}
                >
                  <span className="min-w-0 truncate">{seg.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--cds-color-grey-600)] transition-transform duration-200 ${
                      open ? 'rotate-180 text-[var(--cds-color-grey-900)]' : ''
                    }`}
                    aria-hidden
                    strokeWidth={2}
                  />
                </button>

                {openBucket === 'participation' && seg.key === 'participation' ? (
                  <FilterDropdownPanel
                    title={seg.title}
                    id="challenge-filter-participation"
                    panelLabel={seg.panelLabel}
                    onView={() => setOpenBucket(null)}
                    footerClearAll={
                      <button
                        type="button"
                        className="text-sm font-semibold text-[var(--cds-color-blue-700)] underline-offset-2 hover:underline"
                        onClick={() =>
                          onFiltersChange((f) => ({
                            ...f,
                            participationModes: [],
                            cohortScope: 'all',
                            cohortIds: [],
                          }))
                        }
                      >
                        Clear all
                      </button>
                    }
                  >
                    <div className="space-y-5">
                      <section>
                        <p className="text-[13px] leading-relaxed text-[var(--cds-color-grey-600)]">
                          Solo compete towards a goal, compete in teams, or collaborate with others towards a common
                          goal.
                        </p>
                        <ul className="mt-3 space-y-0">
                          {(Object.keys(PARTICIPATION_MODE_LABELS) as ChallengeParticipationMode[]).map((m) => (
                            <li key={m}>
                              <FacetCheckboxRow
                                inputId={`challenge-facet-participation-${m}`}
                                checked={filters.participationModes.includes(m)}
                                onChange={() =>
                                  onFiltersChange((f) => ({
                                    ...f,
                                    participationModes: toggleInList(f.participationModes, m),
                                  }))
                                }
                                label={PARTICIPATION_MODE_LABELS[m]}
                                count={participationCount(m)}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>

                      <div className="h-px bg-[var(--cds-color-grey-100)]" />

                      <section>
                        <p className="text-sm font-semibold text-[var(--cds-color-grey-975)]">Cohort</p>
                        <ul className="mt-3 space-y-0">
                          <li>
                            <FacetCheckboxRow
                              inputId="challenge-facet-my-cohorts"
                              checked={filters.cohortScope === 'my_cohorts'}
                              onChange={() =>
                                onFiltersChange((f) => ({
                                  ...f,
                                  cohortScope: f.cohortScope === 'my_cohorts' ? 'all' : 'my_cohorts',
                                  cohortIds: [],
                                }))
                              }
                              label="My cohorts"
                              count={myCohortsFacetCount}
                            />
                          </li>
                        </ul>

                        {filters.cohortScope === 'my_cohorts' ? (
                          <div className="mt-3">
                            {joinedCohortIds.length === 0 ? (
                              <p className="text-[12px] text-[var(--cds-color-grey-600)]">
                                You haven&apos;t joined any cohorts yet.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {myCohortTagsShown.map((id) => (
                                  <span
                                    key={id}
                                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] py-1 pl-2.5 pr-1 text-[12px] font-medium text-[var(--cds-color-grey-975)]"
                                  >
                                    <span className="min-w-0 truncate">{FEED_COHORT_META[id].pillLabel}</span>
                                    <button
                                      type="button"
                                      className="shrink-0 rounded-full p-0.5 text-[var(--cds-color-grey-600)] hover:bg-[var(--cds-color-grey-200)] hover:text-[var(--cds-color-grey-975)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--cds-color-blue-700)]"
                                      aria-label={`Remove ${FEED_COHORT_META[id].pillLabel} from filter`}
                                      onClick={() => removeMyCohortTag(id)}
                                    >
                                      <X className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </section>
                    </div>
                  </FilterDropdownPanel>
                ) : null}

                {openBucket === 'metric' && seg.key === 'metric' ? (
                  <FilterDropdownPanel
                    title={seg.title}
                    subtitle="What the challenge measures—quantity, time on task, streaks, or consistency."
                    id="challenge-filter-metric"
                    panelLabel={seg.panelLabel}
                    onView={() => setOpenBucket(null)}
                    footerClearAll={
                      <button
                        type="button"
                        className="text-sm font-semibold text-[var(--cds-color-blue-700)] underline-offset-2 hover:underline"
                        onClick={() => onFiltersChange((f) => ({ ...f, metrics: [] }))}
                      >
                        Clear all
                      </button>
                    }
                  >
                    <ul className="space-y-0">
                      {(Object.keys(CHALLENGE_METRIC_LABELS) as ChallengeMetric[]).map((m) => (
                        <li key={m}>
                          <FacetCheckboxRow
                            inputId={`challenge-facet-metric-${m}`}
                            checked={filters.metrics.includes(m)}
                            onChange={() =>
                              onFiltersChange((f) => ({
                                ...f,
                                metrics: toggleInList(f.metrics, m),
                              }))
                            }
                            label={CHALLENGE_METRIC_LABELS[m]}
                            count={metricCount(m)}
                          />
                        </li>
                      ))}
                    </ul>
                  </FilterDropdownPanel>
                ) : null}
              </div>
            );
          })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChallengeDiscoveryFilterBar: React.FC<ChallengeDiscoveryFilterBarProps> = ({
  showFilters = true,
  activeSection,
  onJump,
  filters,
  onFiltersChange,
  activeFilterCount = 0,
}) => (
  <div className="shrink-0 space-y-3 px-1 pt-1">
    <ChallengeDiscoveryStatusTabs activeSection={activeSection} onJump={onJump} />
    {showFilters ? (
      <ChallengeDiscoveryFiltersSection
        filters={filters}
        onFiltersChange={onFiltersChange}
        activeFilterCount={activeFilterCount}
      />
    ) : null}
  </div>
);
