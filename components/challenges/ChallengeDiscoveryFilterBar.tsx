import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Award, ChevronDown, Compass, ListFilter, X, Zap } from 'lucide-react';
import { FEED_COHORT_META, type FeedCohortId } from '../../constants/feedCohorts';
import { useCommunityCohortMembership } from '../../context/CommunityCohortMembershipContext';
import {
  type ChallengeDiscoveryFilters,
  type ChallengesStatusTab,
  type CohortScopeFilter,
} from '../../constants/challengeFilters';
import {
  CHALLENGE_METRIC_LABELS,
  DURATION_BUCKET_LABELS,
  PARTICIPATION_MODE_LABELS,
  type ChallengeDurationBucket,
  type ChallengeMetric,
  type ChallengeParticipationMode,
} from '../../constants/challengeTaxonomy';
import {
  CHALLENGE_METRIC_ICONS,
  DURATION_BUCKET_ICONS,
  PARTICIPATION_MODE_ICONS,
} from '../../constants/challengePillIcons';

export interface ChallengeDiscoveryFilterBarProps {
  statusTab: ChallengesStatusTab;
  onStatusTabChange: (tab: ChallengesStatusTab) => void;
  filters: ChallengeDiscoveryFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<ChallengeDiscoveryFilters>>;
  /** Non-zero when taxonomy/cohort filters differ from defaults (shown on filter icon). */
  activeFilterCount?: number;
  /** When false, only status tabs render here — use `ChallengeDiscoveryFiltersSection` below the hero/list. */
  showFilters?: boolean;
}

export interface ChallengeDiscoveryFiltersSectionProps {
  statusTab: ChallengesStatusTab;
  filters: ChallengeDiscoveryFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<ChallengeDiscoveryFilters>>;
  activeFilterCount?: number;
}

type OpenBucket = null | 'participation' | 'metric' | 'duration';

/** LOHP bucketing pattern — matches lavender cards in Figma node 5239:45914 */
const BUCKET_CARD_GRADIENT =
  'linear-gradient(-61.1deg, rgb(241, 238, 255) 17.86%, rgb(240, 242, 255) 75.22%)';

const STATUS_TABS: {
  id: ChallengesStatusTab;
  label: string;
  Icon: typeof Compass;
}[] = [
  { id: 'browse', label: 'Browse', Icon: Compass },
  { id: 'active', label: 'Active', Icon: Zap },
  { id: 'completed', label: 'Completed', Icon: Award },
];

/** Applied to Lucide icons when this bucket tab is selected (see `index.css`) */
const STATUS_TAB_SELECTED_ICON_CLASS: Record<ChallengesStatusTab, string> = {
  browse: 'challenge-tab-icon-compass-selected',
  active: 'challenge-tab-icon-zap-selected',
  completed: 'challenge-tab-icon-award-selected',
};

const COHORT_SCOPE_ROWS: { id: Extract<CohortScopeFilter, 'all' | 'my_cohorts'>; title: string; hint: string }[] = [
  { id: 'all', title: 'All cohorts', hint: 'Show challenges from every cohort that matches other filters' },
  {
    id: 'my_cohorts',
    title: 'My cohorts',
    hint: 'Only challenges from cohorts you belong to — refine with tags below',
  },
];

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export const ChallengeDiscoveryStatusTabs: React.FC<
  Pick<ChallengeDiscoveryFilterBarProps, 'statusTab' | 'onStatusTabChange'>
> = ({ statusTab, onStatusTabChange }) => (
  <div
    className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3"
    role="tablist"
    aria-label="Challenge list"
  >
    {STATUS_TABS.map((t) => {
      const selected = statusTab === t.id;
      const Icon = t.Icon;
      return (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={selected}
          id={`challenge-status-${t.id}`}
          tabIndex={selected ? 0 : -1}
          onClick={() => onStatusTabChange(t.id)}
          style={{ backgroundImage: BUCKET_CARD_GRADIENT }}
          className={`relative flex min-h-[57px] w-full items-center justify-between gap-2 rounded-[14px] px-3 py-3 text-left shadow-sm transition sm:min-h-[64px] sm:px-4 ${
            selected
              ? 'shadow-md ring-2 ring-[var(--cds-color-blue-700)] ring-offset-2 ring-offset-[var(--cds-color-white)]'
              : 'ring-1 ring-[rgba(0,0,0,0.06)] hover:ring-[var(--cds-color-grey-300)] hover:shadow-md'
          } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]`}
        >
          <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center">
            <span className="font-semibold leading-5 tracking-[-0.02em] text-[var(--cds-color-grey-975)] text-[clamp(0.875rem,2vw,1.05rem)]">
              {t.label}
            </span>
          </div>
          <div
            className="relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center text-[var(--cds-color-blue-700)] sm:h-[28px] sm:w-[28px]"
            aria-hidden
          >
            <Icon
              className={`h-[26px] w-[26px] sm:h-[28px] sm:w-[28px] ${selected ? STATUS_TAB_SELECTED_ICON_CLASS[t.id] : ''}`}
              strokeWidth={1.25}
            />
          </div>
        </button>
      );
    })}
  </div>
);

export const ChallengeDiscoveryFiltersSection: React.FC<ChallengeDiscoveryFiltersSectionProps> = ({
  statusTab,
  filters,
  onFiltersChange,
  activeFilterCount = 0,
}) => {
  const { joinedCohortIds } = useCommunityCohortMembership();
  const joinedSet = useMemo(() => new Set(joinedCohortIds), [joinedCohortIds]);

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
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const filtersSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpenBucket(null);
  }, [statusTab]);

  /** Scroll filters into view under sticky Browse/Active/Completed tabs when expanding (after open animation). */
  useEffect(() => {
    if (!filtersExpanded) return;
    const t = window.setTimeout(() => {
      const el = filtersSectionRef.current;
      if (!el) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
    }, 320);
    return () => window.clearTimeout(t);
  }, [filtersExpanded]);

  useEffect(() => {
    if (!filtersExpanded) {
      setOpenBucket(null);
    }
  }, [filtersExpanded]);

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

  useEffect(() => {
    if (!filtersExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersExpanded(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [filtersExpanded]);

  const toggleBucket = (b: Exclude<OpenBucket, null>) => {
    setOpenBucket((prev) => (prev === b ? null : b));
  };

  const chipClass = (on: boolean) =>
    `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
      on
        ? 'border-[var(--cds-color-grey-800)] bg-[var(--cds-color-grey-800)] text-[var(--cds-color-white)]'
        : 'border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] text-[var(--cds-color-grey-700)] hover:border-[var(--cds-color-grey-300)]'
    }`;

  /** Airbnb-style anchored panel under each trigger + optional secondary control + Done dismiss */
  const FilterDropdownPanel = ({
    children,
    id,
    panelLabel,
    onDone,
    footerStart,
  }: {
    children: React.ReactNode;
    id: string;
    panelLabel: string;
    onDone: () => void;
    /** Shown to the left of Done (e.g. Reset link) */
    footerStart?: React.ReactNode;
  }) => (
    <div
      id={id}
      role="dialog"
      aria-label={panelLabel}
      className="absolute right-0 left-auto top-[calc(100%+8px)] z-50 w-[min(calc(100vw-2rem),420px)] overflow-hidden rounded-2xl border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] shadow-[0_12px_40px_rgba(15,23,42,0.14)]"
    >
      <div className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain p-4">{children}</div>
      <div className="flex items-center justify-end gap-3 border-t border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] px-4 py-3">
        {footerStart ? <div className="mr-auto min-w-0">{footerStart}</div> : null}
        <button
          type="button"
          className="rounded-lg bg-[var(--cds-color-blue-700)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
          onClick={onDone}
        >
          Done
        </button>
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
    {
      key: 'duration' as const,
      title: 'Duration',
      ariaControls: 'challenge-filter-duration',
      panelLabel: 'Duration filters',
    },
  ] as const;

  return (
    <div
      ref={filtersSectionRef}
      className="mb-3 shrink-0 scroll-mt-28 space-y-3 px-1 md:scroll-mt-32"
    >
      <div className="flex justify-end px-0.5">
        <button
          type="button"
          aria-expanded={filtersExpanded}
          aria-controls="challenge-discovery-filters"
          onClick={() => setFiltersExpanded((v) => !v)}
          className="relative inline-flex h-10 items-center gap-2 rounded-full border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] px-3 text-sm font-semibold text-[var(--cds-color-grey-800)] shadow-sm transition hover:border-[var(--cds-color-grey-300)] hover:bg-[var(--cds-color-grey-25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
        >
          <ListFilter className="h-4 w-4 shrink-0 text-[var(--cds-color-grey-700)]" aria-hidden strokeWidth={2} />
          <span>Filters</span>
          {activeFilterCount > 0 ? (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--cds-color-blue-700)] px-1 text-[10px] font-bold text-white">
              {activeFilterCount > 9 ? '9+' : activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Filter buckets — collapsible; separate pill dropdowns (Airbnb-style bar) */}
      <div
        id="challenge-discovery-filters"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${filtersExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        {/* When expanded, overflow must be visible — anchored panels use position:absolute below triggers and would be clipped by overflow-hidden (collapse animation still uses 0fr row). */}
        <div className={filtersExpanded ? 'min-h-0 overflow-visible' : 'min-h-0 overflow-hidden'}>
          <div
            className={`pt-1 transition-opacity duration-300 ease-out ${filtersExpanded ? 'opacity-100' : 'opacity-0'}`}
          >
            <div ref={wrapRef} className="relative">
              <div
                className="flex flex-wrap items-stretch justify-end gap-2"
                role="group"
                aria-label="Refine challenges"
              >
          {FILTER_SEGMENTS.map((seg) => {
            const open = openBucket === seg.key;
            return (
              <div key={seg.key} className="relative min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:basis-auto sm:flex-initial">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={open ? seg.ariaControls : undefined}
                  onClick={() => toggleBucket(seg.key)}
                  className={`flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-[4pt] border border-solid bg-[var(--cds-color-white)] px-[18px] text-left transition sm:min-w-[11rem] sm:max-w-[14rem] ${
                    open
                      ? 'border-[var(--cds-color-blue-700)]'
                      : 'border-[#dbe0e1] hover:border-[var(--cds-color-grey-400)]'
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]`}
                >
                  <span className="min-w-0 flex-1 truncate text-[12px] font-semibold uppercase tracking-wide text-[#404b61]">
                    {seg.title}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      open ? 'rotate-180 text-[var(--cds-color-blue-700)]' : 'text-[#63676b]'
                    }`}
                    aria-hidden
                    strokeWidth={2}
                  />
                </button>

                {openBucket === 'participation' && seg.key === 'participation' ? (
                  <FilterDropdownPanel
                    id="challenge-filter-participation"
                    panelLabel={seg.panelLabel}
                    onDone={() => setOpenBucket(null)}
                    footerStart={
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--cds-color-grey-700)] underline-offset-2 hover:underline"
                        onClick={() =>
                          onFiltersChange((f) => ({
                            ...f,
                            participationModes: [],
                            cohortScope: 'all',
                            cohortIds: [],
                          }))
                        }
                      >
                        Reset
                      </button>
                    }
                  >
                    <div className="space-y-5">
                      <section>
                        <p className="text-xs font-semibold text-[var(--cds-color-grey-975)]">Competition style</p>
                        <p className="mt-1 text-[11px] text-[var(--cds-color-grey-600)]">
                          How you compete—solo leaderboard, squads within a cohort, or a shared cohort goal.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {(Object.keys(PARTICIPATION_MODE_LABELS) as ChallengeParticipationMode[]).map((m) => {
                            const PIcon = PARTICIPATION_MODE_ICONS[m];
                            return (
                              <button
                                key={m}
                                type="button"
                                className={chipClass(filters.participationModes.includes(m))}
                                onClick={() =>
                                  onFiltersChange((f) => ({
                                    ...f,
                                    participationModes: toggleInList(f.participationModes, m),
                                  }))
                                }
                              >
                                <PIcon className="h-3 w-3 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
                                {PARTICIPATION_MODE_LABELS[m]}
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      <div className="h-px bg-[var(--cds-color-grey-100)]" />

                      <section>
                        <p className="text-xs font-semibold text-[var(--cds-color-grey-975)]">Cohort</p>
                        <ul className="mt-3 space-y-1">
                          {COHORT_SCOPE_ROWS.map((row) => {
                            const selected = filters.cohortScope === row.id;
                            return (
                              <li key={row.id}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onFiltersChange((f) => ({
                                      ...f,
                                      cohortScope: row.id,
                                      cohortIds: [],
                                    }))
                                  }
                                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition ${
                                    selected ? 'bg-[var(--cds-color-grey-25)]' : 'hover:bg-[var(--cds-color-grey-25)]'
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                      selected
                                        ? 'border-[var(--cds-color-grey-900)]'
                                        : 'border-[var(--cds-color-grey-300)] bg-[var(--cds-color-white)]'
                                    }`}
                                    aria-hidden
                                  >
                                    {selected ? (
                                      <span className="block h-2 w-2 rounded-full bg-[var(--cds-color-grey-900)]" />
                                    ) : null}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-[var(--cds-color-grey-975)]">
                                      {row.title}
                                    </span>
                                    <span className="mt-0.5 block text-[12px] leading-snug text-[var(--cds-color-grey-600)]">
                                      {row.hint}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            );
                          })}
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
                    id="challenge-filter-metric"
                    panelLabel={seg.panelLabel}
                    onDone={() => setOpenBucket(null)}
                    footerStart={
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--cds-color-grey-700)] underline-offset-2 hover:underline"
                        onClick={() => onFiltersChange((f) => ({ ...f, metrics: [] }))}
                      >
                        Reset types
                      </button>
                    }
                  >
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[var(--cds-color-grey-975)]">Challenge type</p>
                      <p className="text-[11px] text-[var(--cds-color-grey-600)]">
                        What the challenge measures—quantity, time on task, streaks, scores, breadth, or depth.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Object.keys(CHALLENGE_METRIC_LABELS) as ChallengeMetric[]).map((m) => {
                          const MIcon = CHALLENGE_METRIC_ICONS[m];
                          return (
                            <button
                              key={m}
                              type="button"
                              className={chipClass(filters.metrics.includes(m))}
                              onClick={() =>
                                onFiltersChange((f) => ({
                                  ...f,
                                  metrics: toggleInList(f.metrics, m),
                                }))
                              }
                            >
                              <MIcon className="h-3 w-3 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
                              {CHALLENGE_METRIC_LABELS[m]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </FilterDropdownPanel>
                ) : null}

                {openBucket === 'duration' && seg.key === 'duration' ? (
                  <FilterDropdownPanel
                    id="challenge-filter-duration"
                    panelLabel={seg.panelLabel}
                    onDone={() => setOpenBucket(null)}
                    footerStart={
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--cds-color-grey-700)] underline-offset-2 hover:underline"
                        onClick={() => onFiltersChange((f) => ({ ...f, durationBuckets: [] }))}
                      >
                        Reset duration
                      </button>
                    }
                  >
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[var(--cds-color-grey-975)]">Duration</p>
                      <p className="text-[11px] text-[var(--cds-color-grey-600)]">
                        Rough calendar window for the challenge (week, month, or quarter).
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Object.keys(DURATION_BUCKET_LABELS) as ChallengeDurationBucket[]).map((d) => {
                          const DIcon = DURATION_BUCKET_ICONS[d];
                          return (
                            <button
                              key={d}
                              type="button"
                              className={chipClass(filters.durationBuckets.includes(d))}
                              onClick={() =>
                                onFiltersChange((f) => ({
                                  ...f,
                                  durationBuckets: toggleInList(f.durationBuckets, d),
                                }))
                              }
                            >
                              <DIcon className="h-3 w-3 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
                              {DURATION_BUCKET_LABELS[d]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
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
    </div>
  );
};

export const ChallengeDiscoveryFilterBar: React.FC<ChallengeDiscoveryFilterBarProps> = ({
  showFilters = true,
  statusTab,
  onStatusTabChange,
  filters,
  onFiltersChange,
  activeFilterCount = 0,
}) => (
  <div className="shrink-0 space-y-3 px-1 pt-1">
    <ChallengeDiscoveryStatusTabs statusTab={statusTab} onStatusTabChange={onStatusTabChange} />
    {showFilters ? (
      <ChallengeDiscoveryFiltersSection
        statusTab={statusTab}
        filters={filters}
        onFiltersChange={onFiltersChange}
        activeFilterCount={activeFilterCount}
      />
    ) : null}
  </div>
);
