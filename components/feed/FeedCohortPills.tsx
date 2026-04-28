import React from 'react';
import {
  Brackets,
  Briefcase,
  FlaskConical,
  Globe,
  Grid3x3,
  Laptop,
  LayoutGrid,
  Paintbrush,
  Rocket,
  ShieldPlus,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { COURSERA_BROWSE_DISCIPLINES } from '../../constants/feedCohorts';

/** Icons aligned with Coursera browse category pills (coursera.org). */
const DISCIPLINE_ICON_BY_SLUG: Record<string, LucideIcon> = {
  'arts-and-humanities': Paintbrush,
  business: Briefcase,
  'computer-science': Brackets,
  'data-science': TrendingUp,
  health: ShieldPlus,
  'information-technology': Laptop,
  'language-learning': Globe,
  'math-and-logic': Grid3x3,
  'personal-development': Rocket,
  'physical-science-and-engineering': FlaskConical,
  'social-sciences': Users,
};

export type FeedCohortPillsCourseraProps = {
  variant: 'coursera';
  /** Selected browse disciplines; empty = “All”. */
  selectedSlugs: string[];
  onToggleSlug: (slug: string) => void;
  onClearDisciplines: () => void;
  compact?: boolean;
};

export type FeedCohortPillsDefaultProps = {
  variant?: 'default';
  /** `null` = no career-area filter (cohort feed only). */
  activeSlug: string | null;
  onSelectSlug: (slug: string | null) => void;
  compact?: boolean;
};

export type FeedCohortPillsProps = FeedCohortPillsCourseraProps | FeedCohortPillsDefaultProps;

const pillClassesDefault = (active: boolean, compact: boolean) =>
  `shrink-0 rounded-[var(--cds-border-radius-400)] font-medium leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-1 ${
    compact ? 'px-1.5 py-px text-[11px]' : 'px-2 py-0.5 text-xs'
  } ${
    active
      ? 'bg-[var(--cds-color-grey-800)] text-[var(--cds-color-white)]'
      : 'border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] text-[var(--cds-color-grey-800)] hover:bg-[var(--cds-color-grey-25)]'
  }`;

const courseraPillClasses = (pressed: boolean) =>
  `inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0056d2] focus-visible:ring-offset-2 ${
    pressed
      ? 'border-[#0056d2] bg-[#d2e7fb] text-[#0d1f3c] shadow-sm'
      : 'border-[#dcecf9] bg-[#e8f4fd] text-[#232323] hover:bg-[#ddeef9]'
  }`;

function isCourseraMulti(props: FeedCohortPillsProps): props is FeedCohortPillsCourseraProps {
  return props.variant === 'coursera';
}

/** Coursera.org browse career areas — independent of cohort membership. */
export const FeedCohortPills: React.FC<FeedCohortPillsProps> = (props) => {
  const compact = props.compact ?? false;

  if (isCourseraMulti(props)) {
    const { selectedSlugs, onToggleSlug, onClearDisciplines } = props;
    const noneSelected = selectedSlugs.length === 0;

    return (
      <div className="min-w-0 flex-1">
        <div
          role="group"
          aria-label="Coursera discipline filters. Multiple selections allowed; All clears filters."
          className="flex w-full min-w-0 flex-wrap items-center gap-2 py-0.5"
        >
          <button
            key="__all_disciplines__"
            type="button"
            aria-pressed={noneSelected}
            className={courseraPillClasses(noneSelected)}
            onClick={onClearDisciplines}
          >
            <LayoutGrid className="h-4 w-4 shrink-0 stroke-[1.75] text-current opacity-90" aria-hidden />
            <span>All</span>
          </button>
          {COURSERA_BROWSE_DISCIPLINES.map(({ slug, label }) => {
            const Icon = DISCIPLINE_ICON_BY_SLUG[slug] ?? Globe;
            const pressed = selectedSlugs.includes(slug);

            return (
              <button
                key={slug}
                type="button"
                aria-pressed={pressed}
                className={courseraPillClasses(pressed)}
                onClick={() => onToggleSlug(slug)}
              >
                <Icon className="h-4 w-4 shrink-0 stroke-[1.75] text-current opacity-90" aria-hidden />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const { activeSlug, onSelectSlug } = props;

  return (
    <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        role="tablist"
        aria-label="Feed scope and Coursera discipline filters"
        className={`flex w-max max-w-none flex-nowrap items-center ${compact ? 'gap-1' : 'gap-1.5 py-1'} py-0.5`}
      >
        {COURSERA_BROWSE_DISCIPLINES.map(({ slug, label }) => {
          const selected = activeSlug === slug;

          return (
            <button
              key={slug}
              type="button"
              role="tab"
              aria-selected={selected}
              className={pillClassesDefault(selected, compact)}
              onClick={() => onSelectSlug(slug)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
