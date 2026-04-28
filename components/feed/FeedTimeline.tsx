import React from 'react';
import {
  DATA_SCIENCE_DISCIPLINE_SLUG,
  FEED_DATA_SCIENCE_PREVIEW_VIDEOS,
} from '../../constants/feedPreviewVideos';
import type { FeedCohortId, FeedPlaceholderItem } from '../../constants/feedCohorts';
import { FeedMediaCard } from './FeedMediaCard';

interface FeedTimelineProps {
  cohortId: FeedCohortId | 'all';
  items: FeedPlaceholderItem[];
  /** When `data-science` is selected, first two timeline videos use Sprint 2 preview clips. */
  activeDisciplineSlugs?: string[];
}

export const FeedTimeline: React.FC<FeedTimelineProps> = ({
  cohortId,
  items,
  activeDisciplineSlugs = [],
}) => {
  const dataScienceDisciplineActive = activeDisciplineSlugs.includes(DATA_SCIENCE_DISCIPLINE_SLUG);
  let videoOrdinal = 0;

  return (
    <div className="space-y-6">
      {items.map((item, i) => {
        let feedPreviewVideoSrc: string | undefined;
        if (item.type === 'video') {
          if (dataScienceDisciplineActive && videoOrdinal < FEED_DATA_SCIENCE_PREVIEW_VIDEOS.length) {
            feedPreviewVideoSrc = FEED_DATA_SCIENCE_PREVIEW_VIDEOS[videoOrdinal];
          }
          videoOrdinal += 1;
        }

        return (
          <FeedMediaCard
            key={`${cohortId}-${i}-${item.type}`}
            item={item}
            feedPreviewVideoSrc={feedPreviewVideoSrc}
          />
        );
      })}
    </div>
  );
};
