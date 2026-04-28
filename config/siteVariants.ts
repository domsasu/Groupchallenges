/**
 * Site presentation variants (Version 1–3). Course progress and `courseData` in App stay
 * shared across variants; only values consumed here fork the visible “design” of Home/Feed.
 *
 * How to customize ONE variant without affecting the others:
 * - Prefer editing only that variant’s entry in `VARIANT_SURFACE_CONFIG` below (classes,
 *   flags, copy snippets you thread through Home/Feed).
 * - For larger UI forks, add optional fields to `VariantSurfaceConfig`, then branch in
 *   `Home.tsx` / `FeedPage.tsx` on `surface.yourFlag` OR render a small component only
 *   when `variant === 'version-2'` (e.g. `components/variants/HomeHeroV2.tsx`).
 * - Do not duplicate all of `Home.tsx` per version unless necessary.
 */

export type SiteVariantId = 'version-1' | 'version-2' | 'version-3';

export const SITE_VARIANT_STORAGE_KEY = 'socialmotivation-site-variant';

export interface VariantSurfaceConfig {
  /** Extra classes on the Home hero band (outer colored region under header). */
  homeHeroExtraClassName: string;
  /** Extra classes on the Feed page backdrop section. */
  feedBackdropExtraClassName: string;
}

const BASE_SURFACE: VariantSurfaceConfig = {
  homeHeroExtraClassName: '',
  feedBackdropExtraClassName: '',
};

/**
 * Per-version surface defaults. All three match initially; change only one key’s fields
 * to experiment on that version alone.
 */
export const VARIANT_SURFACE_CONFIG: Record<SiteVariantId, VariantSurfaceConfig> = {
  'version-1': { ...BASE_SURFACE },
  'version-2': { ...BASE_SURFACE },
  'version-3': { ...BASE_SURFACE },
};

export const SITE_VARIANT_OPTIONS: readonly { id: SiteVariantId; label: string }[] = [
  { id: 'version-1', label: 'Version 1' },
  { id: 'version-2', label: 'Version 2' },
  { id: 'version-3', label: 'Version 3' },
] as const;

export function getVariantConfig(id: SiteVariantId): VariantSurfaceConfig {
  return VARIANT_SURFACE_CONFIG[id];
}

export function parseStoredVariant(raw: string | null): SiteVariantId {
  if (raw === 'version-1' || raw === 'version-2' || raw === 'version-3') return raw;
  return 'version-1';
}
