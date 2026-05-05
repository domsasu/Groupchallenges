import React, { useEffect, useMemo, useState } from 'react';
import { useSiteVariant } from '../context/SiteVariantContext';
import {
  DEFAULT_FEED_DISCIPLINE_SLUGS,
  JOINABLE_FEED_COHORT_IDS,
  JOINED_FEED_COHORT_IDS,
  getAllStreamFeedPlaceholderItems,
  getFeedPlaceholderItems,
  type FeedCohortId,
  type FeedPlaceholderItem,
} from '../constants/feedCohorts';
import { FeedCohortPills } from './feed/FeedCohortPills';
import { FeedDiscoverRail } from './feed/FeedDiscoverRail';
import { FeedTimeline } from './feed/FeedTimeline';
import { Icons } from './Icons';
import { enrichFeedVideoThumbnails } from '../services/unsplashThumbnails';
import { CommunityCohortMembershipProvider } from '../context/CommunityCohortMembershipContext';
import { ChallengesView } from './challenges/ChallengesView';

export type CommunitySurface = 'feed' | 'challenges';

export interface FeedPageProps {
  /** When opening Community from Home mini-feed, select this cohort (same as mini-feed lead cohort). */
  initialSelectedCohortId?: FeedCohortId;
  /** Open Community on Feed vs Challenges (e.g. deep link from Home). */
  initialCommunityTab?: CommunitySurface;
}

export const FeedPage: React.FC<FeedPageProps> = ({ initialSelectedCohortId, initialCommunityTab }) => {
  const { variant, surface } = useSiteVariant();
  /** `null` = All snacks stream (mixed cohorts). */
  const [selectedCohortId, setSelectedCohortId] = useState<FeedCohortId | null>(
    () => initialSelectedCohortId ?? null
  );
  /** Multi-select Coursera browse disciplines; empty = same as “All” (no discipline lens). */
  const [activeDisciplineSlugs, setActiveDisciplineSlugs] = useState<string[]>(() => [
    ...DEFAULT_FEED_DISCIPLINE_SLUGS,
  ]);
  /** Cohorts the user joined via the rail CTA (moved from discover into “yours”). */
  const [joinedViaRailIds, setJoinedViaRailIds] = useState<FeedCohortId[]>([]);

  const [communitySurface, setCommunitySurface] = useState<CommunitySurface>(
    () => initialCommunityTab ?? 'challenges'
  );

  useEffect(() => {
    if (initialCommunityTab) setCommunitySurface(initialCommunityTab);
  }, [initialCommunityTab]);

  const railJoinedIds = useMemo(
    () => [...JOINED_FEED_COHORT_IDS, ...joinedViaRailIds],
    [joinedViaRailIds]
  );
  const railJoinableIds = useMemo(
    () => JOINABLE_FEED_COHORT_IDS.filter((id) => !joinedViaRailIds.includes(id)),
    [joinedViaRailIds]
  );

  const allStreamCohortIds = useMemo(
    () => [...railJoinedIds, ...railJoinableIds],
    [railJoinedIds, railJoinableIds]
  );

  const disciplineKey = useMemo(
    () => [...activeDisciplineSlugs].sort().join('|'),
    [activeDisciplineSlugs]
  );

  const feedItems = useMemo(
    () =>
      selectedCohortId === null
        ? getAllStreamFeedPlaceholderItems(allStreamCohortIds, {
            disciplineSlugs: activeDisciplineSlugs,
          })
        : getFeedPlaceholderItems(selectedCohortId, {
            disciplineSlugs: activeDisciplineSlugs,
          }),
    [selectedCohortId, allStreamCohortIds, activeDisciplineSlugs]
  );

  const [feedItemsWithThumbs, setFeedItemsWithThumbs] = useState<FeedPlaceholderItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFeedItemsWithThumbs(null);
    enrichFeedVideoThumbnails(feedItems).then((enriched) => {
      if (!cancelled) setFeedItemsWithThumbs(enriched);
    });
    return () => {
      cancelled = true;
    };
  }, [feedItems]);

  const timelineItems = feedItemsWithThumbs ?? feedItems;

  return (
    <CommunityCohortMembershipProvider>
      <div className="flex-1 bg-[var(--cds-color-grey-25)] overflow-y-auto custom-scrollbar">
        <div
          className={`relative bg-[var(--cds-color-grey-25)] min-h-[min(100%,calc(100vh-5rem))] ${surface.feedBackdropExtraClassName}`}
          data-site-variant={variant}
        >
          {/* Full-bleed white bar so no grey shows at viewport edges; tab labels align with page column below. */}
          <div className="relative z-0 mx-auto max-w-[1440px] px-4 pb-4 md:px-6 md:pb-5 pt-6">
            <div className="relative z-0">
              <ChallengesView />
            </div>
          </div>
        </div>
      </div>
    </CommunityCohortMembershipProvider>
  );
};
