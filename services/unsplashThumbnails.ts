import { COHORT_AVATAR_UNSPLASH_QUERY } from '../constants/cohortAvatarQueries';
import type { FeedCohortId, FeedPlaceholderItem } from '../constants/feedCohorts';

function stableHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const avatarUrlCache = new Map<string, string | null>();
const avatarUrlInflight = new Map<string, Promise<string | null>>();

export interface UnsplashThumbnailResult {
  thumbnailUrl: string;
  thumbnailAttribution: string;
  thumbnailAttributionUrl: string;
}

const cache = new Map<string, UnsplashThumbnailResult | null>();
const inflight = new Map<string, Promise<UnsplashThumbnailResult | null>>();

/** Strip feed boilerplate and take the strongest segment for image search. */
export function sanitizeTitleForUnsplashQuery(title: string): string {
  const withoutPrefix = title
    .replace(/^Course clip ·\s*/i, '')
    .replace(/^Instructor tip ·\s*/i, '');
  const parts = withoutPrefix
    .split('·')
    .map((p) => p.trim())
    .filter(Boolean);
  const query = (parts.length > 0 ? parts[parts.length - 1] : withoutPrefix.trim()) || 'online learning';
  const q = query.slice(0, 80).trim();
  return q || 'online learning';
}

async function fetchUnsplashThumbnailInner(
  query: string,
  accessKey: string
): Promise<UnsplashThumbnailResult | null> {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('orientation', 'landscape');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    results?: Array<{
      urls?: { regular?: string; small?: string };
      links?: { html?: string; download_location?: string };
      user?: { name?: string };
    }>;
  };

  const photo = data.results?.[0];
  if (!photo) return null;

  const downloadLocation = photo.links?.download_location;
  if (downloadLocation) {
    void fetch(`${downloadLocation}?client_id=${accessKey}`).catch(() => {});
  }

  const thumbUrl = photo.urls?.regular ?? photo.urls?.small;
  if (!thumbUrl) return null;

  const photographer = photo.user?.name ?? 'Photographer';
  const page = photo.links?.html ?? 'https://unsplash.com';

  return {
    thumbnailUrl: thumbUrl,
    thumbnailAttribution: `Photo by ${photographer} on Unsplash`,
    thumbnailAttributionUrl: page,
  };
}

async function fetchUnsplashSquarishThumbnail(
  query: string,
  page: number,
  accessKey: string
): Promise<UnsplashThumbnailResult | null> {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('page', String(Math.max(1, page)));
  url.searchParams.set('orientation', 'squarish');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    results?: Array<{
      urls?: { thumb?: string; small?: string; regular?: string };
      links?: { html?: string; download_location?: string };
      user?: { name?: string };
    }>;
  };

  const photo = data.results?.[0];
  if (!photo) return null;

  const downloadLocation = photo.links?.download_location;
  if (downloadLocation) {
    void fetch(`${downloadLocation}?client_id=${accessKey}`).catch(() => {});
  }

  const thumbUrl = photo.urls?.small ?? photo.urls?.thumb ?? photo.urls?.regular;
  if (!thumbUrl) return null;

  const photographer = photo.user?.name ?? 'Photographer';
  const photoPage = photo.links?.html ?? 'https://unsplash.com';

  return {
    thumbnailUrl: thumbUrl,
    thumbnailAttribution: `Photo by ${photographer} on Unsplash`,
    thumbnailAttributionUrl: photoPage,
  };
}

/**
 * Squarish Unsplash image URL for feed rail cohort avatars (stable page per cohort for variety).
 * Falls back to `null` without `VITE_UNSPLASH_ACCESS_KEY` — UI should show initials.
 */
export async function fetchCohortAvatarImageUrl(cohortId: FeedCohortId): Promise<string | null> {
  const cacheKey = cohortId;
  if (avatarUrlCache.has(cacheKey)) {
    return avatarUrlCache.get(cacheKey) ?? null;
  }

  const pending = avatarUrlInflight.get(cacheKey);
  if (pending) return pending;

  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY?.trim();
  if (!accessKey) {
    avatarUrlCache.set(cacheKey, null);
    return null;
  }

  const query = COHORT_AVATAR_UNSPLASH_QUERY[cohortId];
  if (!query) {
    avatarUrlCache.set(cacheKey, null);
    return null;
  }

  const page = 1 + (stableHash(cohortId) % 6);

  const promise = (async (): Promise<string | null> => {
    try {
      let result = await fetchUnsplashSquarishThumbnail(query, page, accessKey);
      if (!result && page > 1) {
        result = await fetchUnsplashSquarishThumbnail(query, 1, accessKey);
      }
      const imageUrl = result?.thumbnailUrl ?? null;
      avatarUrlCache.set(cacheKey, imageUrl);
      return imageUrl;
    } catch {
      avatarUrlCache.set(cacheKey, null);
      return null;
    } finally {
      avatarUrlInflight.delete(cacheKey);
    }
  })();

  avatarUrlInflight.set(cacheKey, promise);
  return promise;
}

/**
 * Search Unsplash for one landscape image. Results are cached per query.
 * Requires `VITE_UNSPLASH_ACCESS_KEY` (demo/local only — do not ship to public production without a proxy).
 */
export async function fetchUnsplashThumbnail(query: string): Promise<UnsplashThumbnailResult | null> {
  const key = query.toLowerCase().trim();
  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY?.trim();
  if (!accessKey) {
    cache.set(key, null);
    return null;
  }

  const promise = (async (): Promise<UnsplashThumbnailResult | null> => {
    try {
      const result = await fetchUnsplashThumbnailInner(query, accessKey);
      cache.set(key, result);
      return result;
    } catch {
      cache.set(key, null);
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Attach Unsplash thumbnails to video cards (parallel per item; queries deduped via cache). */
export async function enrichFeedVideoThumbnails(
  items: FeedPlaceholderItem[]
): Promise<FeedPlaceholderItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.type !== 'video') return item;
      if (item.thumbnailUrl) return item;
      const query = sanitizeTitleForUnsplashQuery(item.title);
      const thumb = await fetchUnsplashThumbnail(query);
      if (!thumb) return item;
      return { ...item, ...thumb };
    })
  );
}
