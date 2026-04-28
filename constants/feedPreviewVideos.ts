/** Coursera browse slug — when active, first N feed / mini-feed videos use `FEED_DATA_SCIENCE_PREVIEW_VIDEOS`. */
export const DATA_SCIENCE_DISCIPLINE_SLUG = 'data-science';

/**
 * First Data Science preview (`FeedAutoplayPreviewVideo` on Community + MiniFeed).
 * On disk: `public/videos/data-science-1.mov` — update from Sprint 2 `data science 1.mov`.
 */
export const DATA_SCIENCE_PRIMARY_PREVIEW_MOV = '/videos/data-science-1.mov';

/** Sprint 2 preview clips used on Community timeline and Home mini-feed when Data Science is selected. */
export const FEED_DATA_SCIENCE_PREVIEW_VIDEOS: readonly [string, string] = [
  DATA_SCIENCE_PRIMARY_PREVIEW_MOV,
  '/videos/data-science-2.mov',
];
