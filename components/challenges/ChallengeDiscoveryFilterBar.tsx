import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
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
}

type OpenBucket = null | 'participation' | 'metric' | 'duration';

const SECTION_JUMPERS: { id: ChallengesStatusTab; label: string }[] = [
  { id: 'browse', label: 'Browse' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

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

  /** Scroll filters into view under sticky section jumpers when expanding (after open animation). */
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

  /** Coursera-style pills — CDS chips use rounded-full */
  const chipClass = (on: boolean) =>
    `inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] font-medium leading-tight transition shadow-[inset_0_0_0_1px_var(--cds-color-grey-300)] ${
      on
        ? 'bg-[var(--cds-color-grey-900)] text-[var(--cds-color-white)] shadow-[inset_0_0_0_1px_var(--cds-color-grey-900)]'
        : 'bg-[var(--cds-color-white)] text-[var(--cds-color-grey-800)] hover:bg-[var(--cds-color-grey-25)] hover:shadow-[inset_0_0_0_1px_var(--cds-color-grey-400)]'
    }`;

  /** Coursera browse–style anchored panel (CDS dialog radius 16px) */
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
      className="absolute left-0 right-auto top-[calc(100%+6px)] z-50 w-[min(calc(100vw-2rem),400px)] overflow-hidden rounded-2xl bg-[var(--cds-color-white)] shadow-[0_8px_32px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--cds-color-grey-200)]"
    >
      <div className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain p-5">{children}</div>
      <div className="flex items-center justify-end gap-3 border-t border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] px-5 py-3.5">
        {footerStart ? <div className="mr-auto min-w-0">{footerStart}</div> : null}
        <button
          type="button"
          className="rounded-lg bg-[var(--cds-color-blue-700)] px-5 py-2.5 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_var(--cds-color-blue-700)] transition hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
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
    <div ref={filtersSectionRef} className="mb-3 shrink-0 space-y-3 px-1">
      <div
        className={`flex flex-wrap items-center gap-3 px-0.5 ${leadingTitle ? 'justify-between' : 'justify-end'}`}
      >
        {leadingTitle ? <div className="min-w-0">{leadingTitle}</div> : null}
        <button
          type="button"
          aria-expanded={filtersExpanded}
          aria-controls="challenge-discovery-filters"
          aria-label={filtersExpanded ? 'Hide filter and sort options' : 'Open filter and sort options'}
          onClick={() => setFiltersExpanded((v) => !v)}
          className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[var(--cds-color-white)] px-4 text-sm font-semibold text-[var(--cds-color-grey-975)] shadow-[inset_0_0_0_1px_var(--cds-color-grey-300)] transition hover:bg-[var(--cds-color-grey-25)] hover:shadow-[inset_0_0_0_1px_var(--cds-color-grey-400)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-[var(--cds-color-grey-700)]" aria-hidden strokeWidth={2} />
          <span>Filter & sort</span>
          {activeFilterCount > 0 ? (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--cds-color-blue-700)] px-1 text-[10px] font-bold text-white">
              {activeFilterCount > 9 ? '9+' : activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Coursera-style collapsible row: Participation | Challenge type | Duration */}
      <div
        id="challenge-discovery-filters"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${filtersExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        {/* When expanded, overflow must be visible — anchored panels use position:absolute below triggers and would be clipped by overflow-hidden (collapse animation still uses 0fr row). */}
        <div className={filtersExpanded ? 'min-h-0 overflow-visible' : 'min-h-0 overflow-hidden'}>
          <div
            className={`pt-2 transition-opacity duration-300 ease-out ${filtersExpanded ? 'opacity-100' : 'opacity-0'}`}
          >
            <div ref={wrapRef} className="relative">
              <div
                className="flex flex-wrap items-stretch justify-start gap-3"
                role="group"
                aria-label="Refine challenges"
              >
          {FILTER_SEGMENTS.map((seg) => {
            const open = openBucket === seg.key;
            return (
              <div key={seg.key} className="relative min-w-0 flex-1 basis-[calc(50%-0.375rem)] sm:basis-auto sm:flex-initial">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={open ? seg.ariaControls : undefined}
                  aria-haspopup="dialog"
                  onClick={() => toggleBucket(seg.key)}
                  className={`flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg bg-[var(--cds-color-white)] px-3 text-left transition sm:h-11 sm:min-w-[12rem] sm:max-w-[16rem] sm:px-4 ${
                    open
                      ? 'shadow-[inset_0_0_0_2px_var(--cds-color-blue-700)]'
                      : 'shadow-[inset_0_0_0_1px_var(--cds-color-grey-300)] hover:bg-[var(--cds-color-grey-25)] hover:shadow-[inset_0_0_0_1px_var(--cds-color-grey-400)]'
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]`}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-normal text-[var(--cds-color-grey-975)]">
                    {seg.title}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--cds-color-grey-600)] transition-transform duration-200 ${
                      open ? 'rotate-180 text-[var(--cds-color-blue-700)]' : ''
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
                        <p className="text-sm font-semibold text-[var(--cds-color-grey-975)]">Competition style</p>
                        <p className="mt-1.5 text-[13px] leading-snug text-[var(--cds-color-grey-600)]">
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
                        <p className="text-sm font-semibold text-[var(--cds-color-grey-975)]">Cohort</p>
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
                      <p className="text-sm font-semibold text-[var(--cds-color-grey-975)]">Challenge type</p>
                      <p className="text-[13px] leading-snug text-[var(--cds-color-grey-600)]">
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
                      <p className="text-sm font-semibold text-[var(--cds-color-grey-975)]">Duration</p>
                      <p className="text-[13px] leading-snug text-[var(--cds-color-grey-600)]">
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
