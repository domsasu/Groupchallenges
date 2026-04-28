/**
 * Video-style stills in `public/thumbnails/` for Mini Feed video rows.
 * Add or replace files in that folder and keep this list in sync.
 */
export const MINI_FEED_THUMBNAIL_URLS: readonly string[] = [
  '/thumbnails/studio-recording-host.png',
  '/thumbnails/audio-editing-desk.png',
  '/thumbnails/interview-session.png',
  '/thumbnails/creator-home-studio.png',
  '/thumbnails/podcast-couch.png',
  '/thumbnails/creative-tech-desk.png',
  '/thumbnails/broadcast-desk.png',
];

export const MINI_FEED_THUMBNAIL_FALLBACK = '/feed/mini-feed-video-placeholder.png?v=3';

/** One random URL from the pool (call once per widget, e.g. ref initializer). */
export function pickRandomMiniFeedThumbnailUrl(): string {
  const list = MINI_FEED_THUMBNAIL_URLS;
  if (list.length === 0) return MINI_FEED_THUMBNAIL_FALLBACK;
  return list[Math.floor(Math.random() * list.length)]!;
}
