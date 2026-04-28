import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import { Icons } from '../Icons';
import type { FeedPlaceholderItem, FeedPlaceholderMediaType } from '../../constants/feedCohorts';
import { FeedAutoplayPreviewVideo } from './FeedAutoplayPreviewVideo';

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

function formatTimestamp(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface FeedMediaCardProps {
  item: FeedPlaceholderItem;
  /** Data Science discipline: first two feed videos use real preview MOV assets. */
  feedPreviewVideoSrc?: string;
}

function stableHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function engagementMetrics(type: FeedPlaceholderMediaType, title: string): { cheer: number; share: number } {
  const h = stableHash(`${type}\0${title}`);
  const pick = (min: number, max: number, rot: number) => {
    const span = max - min + 1;
    return min + Math.floor((h >>> rot) % span);
  };
  switch (type) {
    case 'video':
      return { cheer: pick(340, 5200, 0), share: pick(12, 890, 9) };
    case 'article':
      return { cheer: pick(28, 2100, 0), share: pick(2, 156, 9) };
    case 'podcast':
      return { cheer: pick(510, 12000, 0), share: pick(22, 1200, 9) };
  }
}

function formatEngagementCount(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 < 0.05 ? `${Math.floor(k)}K` : `${k.toFixed(1).replace(/\.0$/, '')}K`;
  }
  return n.toLocaleString();
}

export const FeedMediaCard: React.FC<FeedMediaCardProps> = ({ item, feedPreviewVideoSrc }) => {
  const {
    type,
    title,
    subtitle,
    meta,
    articleUrl,
    podcastAudioUrl,
    thumbnailUrl,
    thumbnailAttribution,
    thumbnailAttributionUrl,
  } = item;
  const podcastTitleId = useId();
  const podcastAudioRef = useRef<HTMLAudioElement>(null);
  const [podcastPlayerOpen, setPodcastPlayerOpen] = useState(false);
  const [podcastPlaying, setPodcastPlaying] = useState(true);
  const [podcastCurrentTime, setPodcastCurrentTime] = useState(0);
  const [podcastDuration, setPodcastDuration] = useState(0);
  const [podcastRateIdx, setPodcastRateIdx] = useState(1);
  const [podcastMuted, setPodcastMuted] = useState(false);
  const { cheer, share } = useMemo(() => engagementMetrics(type, title), [type, title]);
  const [cheered, setCheered] = useState(false);
  const [cheerBurstKey, setCheerBurstKey] = useState(0);
  const [cheerPopKey, setCheerPopKey] = useState(0);
  const displayedCheer = cheer + (cheered ? 1 : 0);

  const closePodcastPlayer = useCallback(() => {
    const a = podcastAudioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setPodcastPlayerOpen(false);
    setPodcastPlaying(false);
    setPodcastCurrentTime(0);
    setPodcastDuration(0);
    setPodcastRateIdx(1);
    setPodcastMuted(false);
  }, []);

  useEffect(() => {
    if (!podcastPlayerOpen || !podcastAudioUrl) return;
    void podcastAudioRef.current?.play().catch(() => {});
  }, [podcastPlayerOpen, podcastAudioUrl]);

  useEffect(() => {
    const a = podcastAudioRef.current;
    if (!podcastPlayerOpen || !a) return;
    const onTime = () => setPodcastCurrentTime(a.currentTime);
    const syncDuration = () => {
      const d = a.duration;
      setPodcastDuration(Number.isFinite(d) && d > 0 ? d : 0);
    };
    const onPlay = () => setPodcastPlaying(true);
    const onPause = () => setPodcastPlaying(false);
    const onEnded = () => setPodcastPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', syncDuration);
    a.addEventListener('durationchange', syncDuration);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    syncDuration();
    setPodcastCurrentTime(a.currentTime);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', syncDuration);
      a.removeEventListener('durationchange', syncDuration);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
    };
  }, [podcastPlayerOpen, podcastAudioUrl]);

  useEffect(() => {
    const a = podcastAudioRef.current;
    if (a) a.playbackRate = PLAYBACK_RATES[podcastRateIdx];
  }, [podcastRateIdx, podcastPlayerOpen]);

  useEffect(() => {
    const a = podcastAudioRef.current;
    if (a) a.muted = podcastMuted;
  }, [podcastMuted, podcastPlayerOpen]);

  const seekPodcast = useCallback((next: number) => {
    const a = podcastAudioRef.current;
    if (!a) return;
    const limit =
      podcastDuration > 0
        ? podcastDuration
        : Number.isFinite(a.duration) && a.duration > 0
          ? a.duration
          : 0;
    const clamped = limit > 0 ? Math.max(0, Math.min(limit, next)) : Math.max(0, next);
    a.currentTime = clamped;
    setPodcastCurrentTime(clamped);
  }, [podcastDuration]);

  const podcastProgressPct =
    podcastDuration > 0
      ? Math.min(100, Math.max(0, (podcastCurrentTime / podcastDuration) * 100))
      : 0;
  const podcastRemaining = Math.max(0, podcastDuration - podcastCurrentTime);
  const podcastRate = PLAYBACK_RATES[podcastRateIdx];

  useEffect(() => {
    if (!podcastPlayerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePodcastPlayer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [podcastPlayerOpen, closePodcastPlayer]);

  return (
    <article className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md bg-[var(--cds-color-grey-50)] px-2 py-0.5 cds-body-tertiary text-xs font-semibold uppercase tracking-wide text-[var(--cds-color-grey-600)]">
          {type === 'video' ? 'Video' : type === 'article' ? 'Article' : 'Coursera podcast'}
        </span>
        <span className="cds-body-tertiary text-[var(--cds-color-grey-500)]">{meta}</span>
      </div>

      {type === 'video' &&
        (feedPreviewVideoSrc ? (
          <FeedAutoplayPreviewVideo
            src={feedPreviewVideoSrc}
            poster={thumbnailUrl}
            maxAutoplaySeconds={10}
            thumbnailAttribution={thumbnailAttribution}
            thumbnailAttributionUrl={thumbnailAttributionUrl}
          />
        ) : (
          <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg bg-[var(--cds-color-grey-100)]">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <div
              className={`absolute inset-0 flex items-center justify-center ${
                thumbnailUrl ? 'bg-[var(--cds-color-grey-975)]/40' : 'bg-[var(--cds-color-grey-200)]/80'
              }`}
            >
              <button
                type="button"
                disabled
                aria-label={`Play video · ${title}`}
                className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-transparent p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 ${
                  thumbnailUrl
                    ? 'text-white focus-visible:ring-white focus-visible:ring-offset-black/40'
                    : 'text-[var(--cds-color-grey-975)] focus-visible:ring-[var(--cds-color-blue-500)]'
                }`}
              >
                <Icons.Play className="h-8 w-8 shrink-0 translate-x-px" strokeWidth={1.75} aria-hidden />
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
              <p className="absolute bottom-2 left-2 right-2 cds-body-tertiary text-xs text-[var(--cds-color-grey-700)]">
                Placeholder video thumbnail · cohort course clip
              </p>
            )}
          </div>
        ))}

      {type === 'article' && (
        <div className="mb-3 flex gap-3 rounded-lg border border-dashed border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] p-3">
          <Icons.Reading className="h-10 w-10 shrink-0 text-[var(--cds-color-grey-400)]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-2 w-full max-w-[90%] rounded bg-[var(--cds-color-grey-200)]" />
            <div className="h-2 w-full max-w-[75%] rounded bg-[var(--cds-color-grey-100)]" />
            <div className="h-2 w-full max-w-[60%] rounded bg-[var(--cds-color-grey-100)]" />
          </div>
        </div>
      )}

      {type === 'podcast' && (
        <div className="relative mb-3 overflow-hidden rounded-lg border border-[var(--cds-color-grey-100)] bg-[#0a2540]">
          <img
            src="/feed/coursera-podcast-banner.png"
            alt="The Coursera Podcast — Podcast · Coursera"
            className="block h-auto w-full max-w-full"
            loading="lazy"
            decoding="async"
          />
          {podcastPlayerOpen && podcastAudioUrl ? (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={podcastTitleId}
              className="absolute inset-0 z-10 flex flex-col"
            >
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
                aria-hidden
              />
              <span id={podcastTitleId} className="sr-only">
                {title}
              </span>
              <button
                type="button"
                className="absolute right-3 top-3 z-20 inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a2540]"
                aria-label="Close podcast player"
                onClick={closePodcastPlayer}
              >
                <Icons.Close className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              </button>
              <audio ref={podcastAudioRef} src={podcastAudioUrl} className="sr-only" preload="metadata" />
              <div
                className="relative z-[1] mt-auto w-full px-4 pb-4 pt-3 text-white"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cds-color-blue-700) 70%, transparent)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[var(--cds-color-blue-800)] shadow-sm transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cds-color-blue-700)]"
                    aria-label={podcastPlaying ? 'Pause' : 'Play'}
                    onClick={() => {
                      const a = podcastAudioRef.current;
                      if (!a) return;
                      if (podcastPlaying) void a.pause();
                      else void a.play();
                    }}
                  >
                    {podcastPlaying ? (
                      <Icons.Pause className="h-6 w-6 shrink-0" strokeWidth={2.25} aria-hidden />
                    ) : (
                      <Icons.Play className="h-6 w-6 shrink-0 translate-x-px" strokeWidth={2} aria-hidden />
                    )}
                  </button>
                  <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap sm:gap-3">
                    <button
                      type="button"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label="Rewind 15 seconds"
                      onClick={() => seekPodcast(podcastCurrentTime - 15)}
                    >
                      <span className="relative block h-7 w-7 shrink-0">
                        <RotateCcw
                          className="pointer-events-none absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <span className="pointer-events-none absolute left-1/2 top-1/2 z-[1] flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[10px] font-bold tabular-nums leading-none tracking-tight">
                          15
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label="Forward 30 seconds"
                      onClick={() => seekPodcast(podcastCurrentTime + 30)}
                    >
                      <span className="relative block h-7 w-7 shrink-0">
                        <RotateCw
                          className="pointer-events-none absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <span className="pointer-events-none absolute left-1/2 top-1/2 z-[1] flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[10px] font-bold tabular-nums leading-none tracking-tight">
                          30
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-10 min-h-10 shrink-0 items-center justify-center rounded-full border border-white/90 px-3 text-sm font-semibold leading-none tabular-nums text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label={`Playback speed ${podcastRate}x`}
                      onClick={() => setPodcastRateIdx((i) => (i + 1) % PLAYBACK_RATES.length)}
                    >
                      {podcastRate === 1 ? '1.0x' : `${podcastRate}x`}
                    </button>
                    <button
                      type="button"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label={podcastMuted ? 'Unmute' : 'Mute'}
                      onClick={() => setPodcastMuted((m) => !m)}
                    >
                      {podcastMuted ? (
                        <Icons.VolumeX className="h-6 w-6 shrink-0" strokeWidth={2} aria-hidden />
                      ) : (
                        <Icons.Volume className="h-6 w-6 shrink-0" strokeWidth={2} aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
                {/* h-3 wrapper = thumb diameter; timestamps sit flush under the track */}
                <div className="relative mt-4 w-full pt-2 pb-1">
                  <div className="relative mx-auto h-3 w-full">
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-1 -translate-y-1/2 rounded-full bg-white/35" />
                    <div
                      className={`pointer-events-none absolute left-0 top-1/2 z-0 h-1 -translate-y-1/2 bg-white ${
                        podcastProgressPct >= 99.5 ? 'rounded-full' : 'rounded-l-full'
                      }`}
                      style={{ width: `${podcastProgressPct}%` }}
                    />
                    <div
                      className="pointer-events-none absolute top-0 z-[1] h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-sm"
                      style={{ left: `${podcastProgressPct}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={podcastDuration > 0 ? podcastDuration : 100}
                      step={0.1}
                      value={podcastDuration > 0 ? podcastCurrentTime : 0}
                      aria-label="Seek"
                      onChange={(e) => seekPodcast(Number(e.target.value))}
                      className="absolute inset-x-0 top-1/2 z-[2] h-10 w-full -translate-y-1/2 cursor-pointer opacity-0"
                    />
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] font-medium leading-tight tabular-nums text-white/90">
                    <span>{formatTimestamp(podcastCurrentTime)}</span>
                    <span className="text-white/85">-{formatTimestamp(podcastRemaining)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <h3 className="cds-subtitle-sm min-w-0 flex-1 text-[var(--cds-color-grey-975)]">{title}</h3>
        {type === 'podcast' ? (
          <button
            type="button"
            disabled={!podcastAudioUrl}
            aria-expanded={podcastPlayerOpen}
            aria-label={`Play podcast · ${title}`}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-transparent p-1 text-[var(--cds-color-grey-975)] transition-colors hover:bg-[var(--cds-color-grey-100)] hover:text-[var(--cds-color-blue-700)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-500)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
            onClick={() => {
              if (!podcastAudioUrl) return;
              setPodcastPlayerOpen(true);
            }}
          >
            <Icons.Play className="h-8 w-8 shrink-0 translate-x-px" strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>
      <p className="mt-1.5 cds-body-secondary text-[var(--cds-color-grey-600)] leading-relaxed">
        {subtitle}
      </p>

      {type === 'article' && articleUrl ? (
        <p className="mt-2">
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cds-body-secondary text-sm font-semibold text-[var(--cds-color-blue-700)] hover:underline"
          >
            Read on Coursera
          </a>
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-[var(--cds-color-grey-50)] pt-3">
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 cds-body-tertiary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-500)] focus-visible:ring-offset-2 ${
            cheered
              ? 'text-[var(--cds-color-blue-700)]'
              : 'text-[var(--cds-color-grey-600)] hover:text-[var(--cds-color-blue-700)]'
          }`}
          aria-label={`Cheer · ${formatEngagementCount(displayedCheer)}`}
          aria-pressed={cheered}
          onClick={() => {
            setCheered((was) => {
              if (was) return false;
              setCheerBurstKey((k) => k + 1);
              setCheerPopKey((k) => k + 1);
              return true;
            });
          }}
        >
          <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
            {cheerBurstKey > 0 && (
              <span key={cheerBurstKey} className="feed-like-ripple" />
            )}
            <Icons.Like
              key={cheerPopKey}
              className={`relative z-[1] h-4 w-4 ${cheerPopKey ? 'animate-feed-like-icon-pop' : ''}`}
              strokeWidth={2}
              fill={cheered ? 'currentColor' : 'none'}
              aria-hidden
            />
          </span>
          <span className="tabular-nums">{formatEngagementCount(displayedCheer)}</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 cds-body-tertiary text-[var(--cds-color-grey-600)] hover:text-[var(--cds-color-blue-700)]"
          aria-label={`Share · ${formatEngagementCount(share)}`}
        >
          <Icons.Share className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="tabular-nums">{formatEngagementCount(share)}</span>
        </button>
      </div>
    </article>
  );
};
