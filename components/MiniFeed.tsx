/**
 * Mini feed — compact Home preview of the user’s first joined cohort (video clips only).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_FEED_DISCIPLINE_SLUGS,
  FEED_COHORT_META,
  JOINED_FEED_COHORT_IDS,
  getFeedPlaceholderItems,
  type FeedCohortId,
  type FeedPlaceholderItem,
} from '../constants/feedCohorts';
import {
  DATA_SCIENCE_DISCIPLINE_SLUG,
  FEED_DATA_SCIENCE_PREVIEW_VIDEOS,
} from '../constants/feedPreviewVideos';
import { Icons } from './Icons';
import { isFeedElementFullyVisible } from './feed/feedViewport';
import type { CommunitySurface } from './FeedPage';

const PAGE_SIZE = 5;
const MAX_MINI_FEED_ITEMS = 9;

/**
 * Caps reel height to the viewport so 9:16 tiles don’t overflow short screens.
 * width ≤ min(column, 55dvh×9/16) keeps aspect ratio while fitting vertically.
 */
const MINI_FEED_REEL_SIZE =
  'aspect-[9/16] w-full min-w-0 max-w-[min(100%,calc(55dvh*9/16))] mx-auto shrink-0 overflow-hidden';

/** Video preview: square bottom edge where the clip meets the title row (Reels-style). */
const MINI_FEED_VIDEO_FRAME = `relative ${MINI_FEED_REEL_SIZE} rounded-t-[var(--cds-border-radius-200)] rounded-b-none bg-[var(--cds-color-grey-100)]`;

/** Hover: landscape preview inside the rail (16:9), width driven by flex parent. */
const MINI_FEED_VIDEO_FRAME_EXPANDED =
  'relative aspect-video w-full shrink-0 overflow-hidden rounded-t-[var(--cds-border-radius-200)] rounded-b-none bg-[var(--cds-color-grey-100)] max-w-none mx-0 transition-[aspect-ratio] duration-300 ease-out';

/** Default mini-feed preview clip (`public/videos/career-change-mini.mov`). */
const MINI_FEED_CLIP_VIDEO_SRC = '/videos/career-change-mini.mov';

/** Second video slot uses Sprint 2 Coursera mini clip (`public/videos/coursera-video-mini.mov`). */
const MINI_FEED_CLIP_VIDEO_SRC_SECOND = '/videos/coursera-video-mini.mov';

/** Third video slot (`public/videos/career-change-3-mini.mov`). */
const MINI_FEED_CLIP_VIDEO_SRC_THIRD = '/videos/career-change-3-mini.mov';

const MINI_FEED_CLIP_SRC_BY_VIDEO_INDEX: readonly string[] = [
  MINI_FEED_CLIP_VIDEO_SRC,
  MINI_FEED_CLIP_VIDEO_SRC_SECOND,
  MINI_FEED_CLIP_VIDEO_SRC_THIRD,
];

/** Each video slot plays this long before rotation advances to the next video in the row. */
const MINI_FEED_SEGMENT_MS = 5000;
const MINI_FEED_SEGMENT_SEC = MINI_FEED_SEGMENT_MS / 1000;

interface MiniFeedClipVideoProps {
  sectionActive: boolean;
  /** Only this tile’s player runs for each rotation slice. */
  isActiveSegment: boolean;
  /** Bumps when the same slot is chosen again so the clip restarts (single-video row). */
  segmentNonce: number;
  userUnmuted: boolean;
  onToggleMute: () => void;
  /** Media URL; defaults to career-change mini clip. */
  src?: string;
}

const MiniFeedClipVideo: React.FC<MiniFeedClipVideoProps> = ({
  sectionActive,
  isActiveSegment,
  segmentNonce,
  userUnmuted,
  onToggleMute,
  src = MINI_FEED_CLIP_VIDEO_SRC,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!sectionActive) {
      v.pause();
      v.currentTime = 0;
      return;
    }
    if (!isActiveSegment) {
      v.pause();
      v.currentTime = 0;
      return;
    }
    v.currentTime = 0;
    void v.play().catch(() => {});
  }, [sectionActive, isActiveSegment, segmentNonce, src]);

  const capSegment = useCallback(() => {
    const v = videoRef.current;
    if (!v || !sectionActive || !isActiveSegment) return;
    if (v.currentTime >= MINI_FEED_SEGMENT_SEC) {
      v.pause();
    }
  }, [sectionActive, isActiveSegment]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener('timeupdate', capSegment);
    return () => v.removeEventListener('timeupdate', capSegment);
  }, [capSegment, segmentNonce]);

  return (
    <>
      <video
        ref={videoRef}
        className="pointer-events-none h-full w-full object-cover object-center"
        src={src}
        playsInline
        preload="auto"
        muted={!userUnmuted}
        aria-hidden
        disablePictureInPicture
      />
      <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-black/55 px-2.5 py-1.5 text-[var(--cds-color-white)] shadow-sm backdrop-blur-[2px] transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          aria-label={userUnmuted ? 'Mute preview clip' : 'Unmute preview clip'}
        >
          {userUnmuted ? (
            <Icons.VolumeX className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          ) : (
            <Icons.Volume className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          )}
          <span className="text-xs font-medium leading-none text-white">{userUnmuted ? 'Mute' : 'Unmute'}</span>
        </button>
      </div>
    </>
  );
};

export interface MiniFeedProps {
  /** Opens Community with an optional cohort pre-selected (matches mini-feed cohort). */
  onOpenFeed: (opts?: { cohortId?: FeedCohortId; tab?: CommunitySurface }) => void;
  /**
   * When the mini-feed section is fully on-screen and at least one preview video is cycling,
   * `true` so the parent can pause competing hero autoplay (e.g. Home intro video).
   */
  onMiniFeedClipPlayingChange?: (playing: boolean) => void;
}

export const MiniFeed: React.FC<MiniFeedProps> = ({ onOpenFeed, onMiniFeedClipPlayingChange }) => {
  const firstCohortId: FeedCohortId = JOINED_FEED_COHORT_IDS[0] ?? 'workingparents';
  const cohortMeta = FEED_COHORT_META[firstCohortId];
  /** Matches FeedPage default pills so preview MOV assets align with Community timeline. */
  const dataScienceLensActive = DEFAULT_FEED_DISCIPLINE_SLUGS.includes(DATA_SCIENCE_DISCIPLINE_SLUG);

  const openCommunityFeed = useCallback(() => {
    onOpenFeed({ cohortId: firstCohortId, tab: 'feed' });
  }, [onOpenFeed, firstCohortId]);

  /**
   * Video rows only. Lead with the same video sequence as Community for the first joined cohort
   * (e.g. #workingparents) and default discipline pills; then fill from the prior cross-cohort pool.
   */
  const allItems = useMemo(() => {
    const seen = new Set<string>();
    const out: FeedPlaceholderItem[] = [];
    const take = (item: FeedPlaceholderItem) => {
      if (item.type !== 'video') return;
      const k = `${item.type}\0${item.title}`;
      if (seen.has(k)) return;
      seen.add(k);
      if (out.length >= MAX_MINI_FEED_ITEMS) return;
      out.push(item);
    };

    const lead = getFeedPlaceholderItems(firstCohortId, {
      disciplineSlugs: [...DEFAULT_FEED_DISCIPLINE_SLUGS],
    });
    for (const it of lead) {
      take(it);
      if (out.length >= MAX_MINI_FEED_ITEMS) return out;
    }

    for (const id of JOINED_FEED_COHORT_IDS) {
      for (const item of getFeedPlaceholderItems(id, {})) {
        take(item);
        if (out.length >= MAX_MINI_FEED_ITEMS) return out;
      }
    }
    return out;
  }, [firstCohortId]);

  const sectionRef = useRef<HTMLElement | null>(null);
  const [sectionFullyOnScreen, setSectionFullyOnScreen] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const update = () => {
      setSectionFullyOnScreen(isFeedElementFullyVisible(el));
    };

    const obs = new IntersectionObserver(update, {
      root: null,
      threshold: Array.from({ length: 21 }, (_, i) => i / 20),
    });
    obs.observe(el);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('scroll', update, { passive: true });
      vv.addEventListener('resize', update);
    }
    update();

    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (vv) {
        vv.removeEventListener('scroll', update);
        vv.removeEventListener('resize', update);
      }
    };
  }, []);

  const pageCount = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const [pageIndex, setPageIndex] = useState(0);
  const safePage = Math.min(pageIndex, pageCount - 1);
  const items = useMemo(
    () => allItems.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [allItems, safePage]
  );

  const videoSlotIndices = useMemo(() => items.map((_, idx) => idx), [items]);

  const [activeVideoSlotQi, setActiveVideoSlotQi] = useState(0);
  const [segmentNonce, setSegmentNonce] = useState(0);
  const [clipUnmuted, setClipUnmuted] = useState(false);

  /** Desktop: hovered video tile grows to 16:9; siblings shrink (bounded by section column). */
  const [expandedVideoTileIndex, setExpandedVideoTileIndex] = useState<number | null>(null);

  useEffect(() => {
    setExpandedVideoTileIndex(null);
  }, [safePage, items]);

  useEffect(() => {
    setPageIndex((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  useEffect(() => {
    setActiveVideoSlotQi(0);
    setSegmentNonce(0);
  }, [safePage, items]);

  useEffect(() => {
    if (!sectionFullyOnScreen) {
      setClipUnmuted(false);
      setExpandedVideoTileIndex(null);
    }
  }, [sectionFullyOnScreen]);

  useEffect(() => {
    if (!sectionFullyOnScreen || videoSlotIndices.length === 0) return;
    /** Pause rotation while a video tile is hovered so only that clip plays and segmentNonce does not restart it every slice. */
    if (expandedVideoTileIndex !== null) return;
    const id = window.setInterval(() => {
      setSegmentNonce((n) => n + 1);
      setActiveVideoSlotQi((q) => {
        const len = videoSlotIndices.length;
        if (len <= 1) return 0;
        return (q + 1) % len;
      });
    }, MINI_FEED_SEGMENT_MS);
    return () => window.clearInterval(id);
  }, [sectionFullyOnScreen, videoSlotIndices, safePage, expandedVideoTileIndex]);

  const miniFeedPreviewVideosActive =
    sectionFullyOnScreen && videoSlotIndices.length > 0;

  useEffect(() => {
    onMiniFeedClipPlayingChange?.(miniFeedPreviewVideosActive);
  }, [miniFeedPreviewVideosActive, onMiniFeedClipPlayingChange]);

  const activeVideoItemIndex =
    videoSlotIndices.length > 0 ? videoSlotIndices[activeVideoSlotQi % videoSlotIndices.length]! : -1;

  return (
    <section
      ref={sectionRef}
      className="rounded-[var(--cds-border-radius-200)] bg-[var(--cds-color-white)] p-4 sm:p-5 text-left"
      aria-label={`Feed for ${cohortMeta.label}. Use See all to open the full feed.`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={openCommunityFeed}
          className="inline-flex items-center gap-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2"
        >
          <span className="cds-subtitle-md text-[var(--cds-color-grey-975)]">See all</span>
          <span className="material-symbols-rounded text-[var(--cds-color-grey-600)]" style={{ fontSize: '20px' }}>
            arrow_forward
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:grid-rows-[auto_auto] sm:items-stretch sm:gap-x-5 sm:gap-y-4">
        <div className="flex min-h-0 w-full flex-col items-center justify-center gap-2 border-b border-[var(--cds-color-grey-100)] pb-4 text-center sm:row-start-1 sm:col-start-1 sm:h-full sm:border-b-0 sm:border-r sm:border-[var(--cds-color-grey-100)] sm:pb-0 sm:pr-5">
          <p className="cds-body-secondary max-w-[12rem] text-[var(--cds-color-grey-800)]">
            Interest in your cohort
          </p>
          <span className="cds-body-tertiary rounded-[var(--cds-border-radius-400)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] px-2 py-0.5 text-[var(--cds-color-grey-700)]">
            {cohortMeta.pillLabel}
          </span>
        </div>

        <div className="grid min-h-0 min-w-0 grid-cols-2 items-stretch gap-2 sm:row-start-1 sm:col-start-2 sm:flex sm:min-h-0 sm:min-w-0 sm:flex-nowrap sm:items-stretch sm:gap-3">
            {items.map((item, i) => {
              const globalIndex = safePage * PAGE_SIZE + i;
              const rowKey = `mini-${globalIndex}-${item.type}-${item.title.slice(0, 32)}`;
              const openRow = openCommunityFeed;

              const isThisVideoExpanded = expandedVideoTileIndex === i;
              const isRowExpanded = expandedVideoTileIndex !== null;

              const tileFlexClass = isThisVideoExpanded
                ? 'sm:flex-[2.35_1_0%] sm:min-w-0 sm:z-10'
                : isRowExpanded
                  ? 'sm:flex-[0.68_1_0%] sm:min-w-[3.25rem]'
                  : 'sm:flex-1 sm:min-w-0';

              const tileBase =
                `flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] text-left transition-colors hover:border-[var(--cds-color-grey-200)] hover:bg-[var(--cds-color-grey-50)] sm:transition-[flex-grow,flex-basis] sm:duration-300 sm:ease-out ${tileFlexClass}`;

              const isActiveVideoSegment =
                expandedVideoTileIndex !== null
                  ? i === expandedVideoTileIndex
                  : i === activeVideoItemIndex;
              const videoOrdinalAmongVideos = i;
              const clipSrc =
                dataScienceLensActive &&
                videoOrdinalAmongVideos < FEED_DATA_SCIENCE_PREVIEW_VIDEOS.length
                  ? FEED_DATA_SCIENCE_PREVIEW_VIDEOS[videoOrdinalAmongVideos]!
                  : MINI_FEED_CLIP_SRC_BY_VIDEO_INDEX[
                      dataScienceLensActive
                        ? videoOrdinalAmongVideos - FEED_DATA_SCIENCE_PREVIEW_VIDEOS.length
                        : videoOrdinalAmongVideos
                    ] ?? MINI_FEED_CLIP_VIDEO_SRC;

              const videoFrameClass = isThisVideoExpanded
                ? `${MINI_FEED_VIDEO_FRAME_EXPANDED} group`
                : `${MINI_FEED_VIDEO_FRAME} group transition-[aspect-ratio] duration-300 ease-out`;

              const videoMeta = (
                <>
                  <div className={videoFrameClass}>
                    <MiniFeedClipVideo
                      sectionActive={sectionFullyOnScreen}
                      isActiveSegment={isActiveVideoSegment}
                      segmentNonce={segmentNonce}
                      userUnmuted={clipUnmuted}
                      onToggleMute={() => setClipUnmuted((m) => !m)}
                      src={clipSrc}
                    />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-end px-2 pb-2 pt-1.5">
                    <p className="cds-body-secondary line-clamp-2 text-[var(--cds-color-grey-975)]">{item.title}</p>
                  </div>
                </>
              );

              return (
                <div
                  key={rowKey}
                  role="button"
                  tabIndex={0}
                  className={`${tileBase} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2`}
                  onClick={openRow}
                  onMouseEnter={() => {
                    if (sectionFullyOnScreen) setExpandedVideoTileIndex(i);
                  }}
                  onMouseLeave={() => setExpandedVideoTileIndex(null)}
                  onFocusCapture={() => {
                    if (sectionFullyOnScreen) setExpandedVideoTileIndex(i);
                  }}
                  onBlurCapture={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      setExpandedVideoTileIndex(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openRow();
                    }
                  }}
                >
                  {videoMeta}
                </div>
              );
            })}
        </div>

        {pageCount > 1 ? (
          <div
            className="flex gap-2 sm:col-start-2 sm:row-start-2"
            role="navigation"
            aria-label="Feed pages"
          >
            {Array.from({ length: pageCount }, (_, p) => (
              <button
                key={p}
                type="button"
                aria-current={p === safePage ? 'page' : undefined}
                aria-label={`Page ${p + 1} of ${pageCount}`}
                onClick={() => setPageIndex(p)}
                className={
                  p === safePage
                    ? 'h-2 w-6 shrink-0 rounded-full bg-[var(--cds-color-grey-975)] transition-colors'
                    : 'h-2 w-2 shrink-0 rounded-full bg-[var(--cds-color-grey-200)] transition-colors hover:bg-[var(--cds-color-grey-300)]'
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
