import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icons } from '../Icons';
import { isFeedElementFullyVisible } from './feedViewport';

const DEFAULT_MAX_SECONDS = 10;

interface FeedAutoplayPreviewVideoProps {
  src: string;
  poster?: string;
  /** Autoplay runs muted and pauses after this many seconds (while fully visible). */
  maxAutoplaySeconds?: number;
  thumbnailAttribution?: string;
  thumbnailAttributionUrl?: string;
}

/**
 * Muted autoplay while the block is fully on-screen; pauses after `maxAutoplaySeconds`.
 * Scroll away → pause without resetting; scroll back → resume from the same timestamp (until cap).
 * Unmute control on hover/focus (same idea as Home mini-feed clips).
 */
export const FeedAutoplayPreviewVideo: React.FC<FeedAutoplayPreviewVideoProps> = ({
  src,
  poster,
  maxAutoplaySeconds = DEFAULT_MAX_SECONDS,
  thumbnailAttribution,
  thumbnailAttributionUrl,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevSrcRef = useRef(src);
  const [fullyVisible, setFullyVisible] = useState(false);
  const [userUnmuted, setUserUnmuted] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const update = () => setFullyVisible(isFeedElementFullyVisible(el));

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

  useEffect(() => {
    if (!fullyVisible) setUserUnmuted(false);
  }, [fullyVisible]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (prevSrcRef.current !== src) {
      prevSrcRef.current = src;
      v.currentTime = 0;
    }

    if (!fullyVisible) {
      v.pause();
      return;
    }

    if (v.currentTime >= maxAutoplaySeconds) {
      v.pause();
      return;
    }

    void v.play().catch(() => {});
  }, [fullyVisible, src, maxAutoplaySeconds]);

  const capSegment = useCallback(() => {
    const v = videoRef.current;
    if (!v || !fullyVisible) return;
    if (v.currentTime >= maxAutoplaySeconds) v.pause();
  }, [fullyVisible, maxAutoplaySeconds]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener('timeupdate', capSegment);
    return () => v.removeEventListener('timeupdate', capSegment);
  }, [capSegment, src]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = !userUnmuted;
  }, [userUnmuted]);

  return (
    <div
      ref={rootRef}
      className="group relative mb-3 aspect-video w-full overflow-hidden rounded-lg bg-[var(--cds-color-grey-100)]"
    >
      <video
        ref={videoRef}
        className="pointer-events-none h-full w-full object-cover object-center"
        src={src}
        poster={poster}
        playsInline
        preload="auto"
        muted={!userUnmuted}
        loop={false}
        disablePictureInPicture
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-black/55 px-2.5 py-1.5 text-[var(--cds-color-white)] shadow-sm backdrop-blur-[2px] transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={(e) => {
            e.stopPropagation();
            setUserUnmuted((m) => !m);
          }}
          aria-label={userUnmuted ? 'Mute preview' : 'Unmute preview'}
        >
          {userUnmuted ? (
            <Icons.VolumeX className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          ) : (
            <Icons.Volume className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          )}
          <span className="text-xs font-medium leading-none text-white">{userUnmuted ? 'Mute' : 'Unmute'}</span>
        </button>
      </div>
      {thumbnailAttribution && thumbnailAttributionUrl ? (
        <div className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-10">
          <a
            href={thumbnailAttributionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cds-body-tertiary block text-[11px] leading-snug text-white drop-shadow-sm hover:underline"
          >
            {thumbnailAttribution}
          </a>
        </div>
      ) : (
        <p className="pointer-events-none absolute bottom-2 left-2 right-2 cds-body-tertiary text-xs text-white/90 drop-shadow-sm">
          Preview clip · autoplays muted when fully on screen (up to {maxAutoplaySeconds}s)
        </p>
      )}
    </div>
  );
};
