import React, { useEffect, useState } from 'react';
import type { FeedCohortId } from '../../constants/feedCohorts';
import { fetchCohortAvatarImageUrl } from '../../services/unsplashThumbnails';

export type CohortRailAvatarVariant = 'joined' | 'discoverActive' | 'discoverIdle';

interface CohortRailAvatarProps {
  cohortId: FeedCohortId;
  label: string;
  variant: CohortRailAvatarVariant;
}

export const CohortRailAvatar: React.FC<CohortRailAvatarProps> = ({ cohortId, label, variant }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const initials = label.slice(0, 2).toUpperCase();

  useEffect(() => {
    let cancelled = false;
    void fetchCohortAvatarImageUrl(cohortId).then((url) => {
      if (!cancelled && url) setImageUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [cohortId]);

  const ringClass =
    variant === 'discoverIdle'
      ? 'ring-1 ring-[var(--cds-color-grey-200)]'
      : 'ring-2 ring-[var(--cds-color-white)] shadow-sm';

  const placeholderBg =
    variant === 'discoverIdle'
      ? 'bg-[var(--cds-color-grey-100)] text-[var(--cds-color-grey-600)]'
      : 'bg-[var(--cds-color-blue-100)] text-[var(--cds-color-blue-800)]';

  return (
    <div
      className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full ${ringClass} ${!imageUrl ? placeholderBg : 'bg-[var(--cds-color-grey-100)]'}`}
      title={imageUrl ? `Cohort image · ${label}` : label}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="cohort-rail-avatar-motion absolute left-1/2 top-1/2 min-h-[135%] min-w-[135%] -translate-x-1/2 -translate-y-1/2 object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center cds-body-tertiary text-xs font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
};
