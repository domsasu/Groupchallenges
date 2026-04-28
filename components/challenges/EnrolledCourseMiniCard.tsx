import React from 'react';

export interface EnrolledCourseMiniCardProps {
  callout: string;
  imageSrc: string;
  provider: string;
  title: string;
  type: string;
  rating: number;
  href: string;
}

/**
 * Compact course row matching Home “Trending now” mini cards — image, provider, title, type · ★ rating.
 */
export const EnrolledCourseMiniCard: React.FC<EnrolledCourseMiniCardProps> = ({
  callout,
  imageSrc,
  provider,
  title,
  type,
  rating,
  href,
}) => {
  return (
    <div className="mt-6 rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] p-3">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--cds-color-grey-600)]">{callout}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group min-w-0 flex-1 rounded-[var(--cds-border-radius-100)] outline-none ring-[var(--cds-color-blue-700)] transition-shadow focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <div className="flex items-center gap-3 rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-white)] p-2 shadow-sm ring-1 ring-[var(--cds-color-grey-100)] transition-colors hover:ring-[var(--cds-color-grey-200)]">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--cds-border-radius-50)] bg-[var(--cds-color-grey-100)]">
              <img src={imageSrc} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-1">
                <div
                  className="h-[18px] w-[18px] shrink-0 rounded-[var(--cds-border-radius-50)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)]"
                  aria-hidden
                />
                <span className="cds-body-secondary text-[var(--cds-color-grey-600)]">{provider}</span>
              </div>
              <p className="cds-subtitle-sm text-[var(--cds-color-grey-975)] group-hover:text-[var(--cds-color-blue-700)]">{title}</p>
              <div className="flex items-center gap-2 cds-body-tertiary text-[var(--cds-color-grey-600)]">
                <span>{type}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <span
                    className="material-symbols-rounded text-[var(--cds-color-grey-975)]"
                    style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  {rating}
                </span>
              </div>
            </div>
          </div>
        </a>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full shrink-0 items-center justify-center rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)] sm:w-auto sm:self-center"
        >
          View course
        </a>
      </div>
    </div>
  );
};
