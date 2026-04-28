/**
 * Horizontal video strip for Community Feed — transparent chrome, scroll with prev/next.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FeedPlaceholderItem } from '../../constants/feedCohorts';
import {
  DATA_SCIENCE_DISCIPLINE_SLUG,
  FEED_DATA_SCIENCE_PREVIEW_VIDEOS,
} from '../../constants/feedPreviewVideos';
import { MiniFeedClipVideo } from '../MiniFeed';

const MAX_TILES = 40;
/** Five tiles across the scroller; `gap-4` → four gaps = `4rem`. */
const TILE_WIDTH_FIVE_ACROSS =
  'w-[calc((100%-4rem)/5)] min-w-0 max-w-[calc((100%-4rem)/5)] shrink-0';

const REEL =
  'aspect-[9/16] w-full min-w-0 max-w-[min(100%,calc(82dvh*9/16))] mx-auto shrink-0 overflow-hidden';
const FRAME = `relative ${REEL} rounded-t-[var(--cds-border-radius-200)] rounded-b-none bg-[var(--cds-color-grey-100)]`;

const FALLBACK_CLIPS = [
  '/videos/career-change-mini.mov',
  '/videos/coursera-video-mini.mov',
  '/videos/career-change-3-mini.mov',
];

function clipSrcForTile(tileIndex: number, dataScienceLensActive: boolean): string {
  if (dataScienceLensActive && tileIndex < FEED_DATA_SCIENCE_PREVIEW_VIDEOS.length) {
    return FEED_DATA_SCIENCE_PREVIEW_VIDEOS[tileIndex]!;
  }
  const ord = dataScienceLensActive ? tileIndex - FEED_DATA_SCIENCE_PREVIEW_VIDEOS.length : tileIndex;
  return FALLBACK_CLIPS[((ord % FALLBACK_CLIPS.length) + FALLBACK_CLIPS.length) % FALLBACK_CLIPS.length]!;
}

export interface FeedStackedGroupSectionProps {
  /** Stable key for tile React keys */
  sectionKey: string;
  items: FeedPlaceholderItem[];
  /** Discipline slugs from Feed pills — drives Data Science preview MOV routing (same as MiniFeed / FeedTimeline). */
  activeDisciplineSlugs: string[];
  /** Offset so each cohort row doesn’t reuse the same preview clip index 0..2 */
  previewIndexOffset?: number;
  /** Optional — e.g. focus cohort in sidebar */
  onSeeAll?: () => void;
  ariaLabel: string;
}

export const FeedStackedGroupSection: React.FC<FeedStackedGroupSectionProps> = ({
  sectionKey,
  items,
  activeDisciplineSlugs,
  previewIndexOffset = 0,
  onSeeAll,
  ariaLabel,
}) => {
  const dataScienceLensActive = activeDisciplineSlugs.includes(DATA_SCIENCE_DISCIPLINE_SLUG);
  const videoItems = useMemo(
    () => items.filter((i) => i.type === 'video').slice(0, MAX_TILES),
    [items]
  );

  const [clipUnmuted, setClipUnmuted] = useState(false);
  /** Only the hovered or focused tile plays; nothing autoplays on load. */
  const [playingTileIndex, setPlayingTileIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [carouselPage, setCarouselPage] = useState(0);
  const [carouselPageCount, setCarouselPageCount] = useState(1);

  const updateScrollButtons = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const cw = clientWidth || 1;
    const pages = Math.max(1, Math.ceil(scrollWidth / cw));
    const idx = Math.min(
      pages - 1,
      Math.max(0, Math.round(scrollLeft / Math.max(cw, 1)))
    );
    setCarouselPageCount(pages);
    setCarouselPage(idx);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateScrollButtons());
    ro.observe(el);
    return () => ro.disconnect();
  }, [videoItems, updateScrollButtons]);

  const scrollToCarouselPage = useCallback(
    (pageIndex: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const cw = el.clientWidth || 1;
      el.scrollTo({ left: pageIndex * cw, behavior: 'smooth' });
      window.setTimeout(updateScrollButtons, 350);
    },
    [updateScrollButtons]
  );

  return (
    <section className="text-left" aria-label={ariaLabel}>
      {onSeeAll ? (
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSeeAll}
            className="inline-flex items-center gap-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2"
          >
            <span className="cds-subtitle-md text-[var(--cds-color-grey-975)]">See all</span>
            <span className="material-symbols-rounded text-[var(--cds-color-grey-600)]" style={{ fontSize: '20px' }}>
              arrow_forward
            </span>
          </button>
        </div>
      ) : null}

      {/* Home-style horizontal strip + dot pagination (Master SQL recommendations on Home). */}
      <div className="relative isolate min-h-0 w-full overflow-visible">
        <div
          ref={scrollerRef}
          onScroll={updateScrollButtons}
          onMouseLeave={() => setPlayingTileIndex(null)}
          className="flex min-h-0 min-w-0 w-full gap-4 overflow-x-auto scroll-smooth pb-2 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {videoItems.map((item, i) => {
            const rowKey = `${sectionKey}-${i}-${item.title.slice(0, 24)}`;

            const tileBase = `flex h-full flex-col overflow-hidden rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] text-left transition-colors hover:border-[var(--cds-color-grey-200)] hover:bg-[var(--cds-color-grey-50)] ${TILE_WIDTH_FIVE_ACROSS}`;

            const globalVid = previewIndexOffset + i;
            const clipSrc = clipSrcForTile(globalVid, dataScienceLensActive);
            const isActiveSegment = playingTileIndex === i;

            return (
              <div
                key={rowKey}
                role="button"
                tabIndex={0}
                className={`${tileBase} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2`}
                onMouseEnter={() => setPlayingTileIndex(i)}
                onFocusCapture={() => setPlayingTileIndex(i)}
                onBlurCapture={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setPlayingTileIndex(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSeeAll?.();
                  }
                }}
              >
                <div className={`${FRAME} group`}>
                  <MiniFeedClipVideo
                    sectionActive
                    isActiveSegment={isActiveSegment}
                    segmentNonce={0}
                    userUnmuted={clipUnmuted}
                    onToggleMute={() => setClipUnmuted((m) => !m)}
                    src={clipSrc}
                  />
                </div>
                <div className="flex min-h-0 flex-1 flex-col justify-end px-2.5 pb-2.5 pt-2">
                  <p className="cds-body-secondary line-clamp-2 text-[var(--cds-color-grey-975)]">{item.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {carouselPageCount > 1 ? (
          <div
            className="flex justify-center gap-2 mt-4"
            role="tablist"
            aria-label="Video strip pages"
          >
            {Array.from({ length: carouselPageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === carouselPage}
                aria-label={`Page ${i + 1} of ${carouselPageCount}`}
                onClick={() => scrollToCarouselPage(i)}
                className={`shrink-0 rounded-full transition-[width,background-color] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2 ${
                  i === carouselPage
                    ? 'h-2 w-6 bg-[var(--cds-color-grey-975)]'
                    : 'h-2 w-2 bg-[var(--cds-color-grey-200)] hover:bg-[var(--cds-color-grey-400)]'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
