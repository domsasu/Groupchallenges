import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CommunityChallenge } from '../../constants/communityChallenges';
import { formatChallengeCardHeroLabel } from '../../constants/communityChallenges';
import { resolveChallengeDetailHeroImageSrc } from '../../constants/challengeMiniCardImage';
import { FEED_COHORT_META } from '../../constants/feedCohorts';
import { challengeWhyJoinOneLiner } from './challengeListOneLiner';

/** Promo-style panel backgrounds (Coursera LOHP–like alternation). */
const SLIDE_PANEL_BGS = ['#faf8f5', '#eef4f9', '#f3f0fa'] as const;

/** Always surface three promo tiles when the parent passes enough challenges (see `ChallengesView`). */
const TOP_SLIDE_COUNT = 3;

const MS_PER_CHAR = 22;
const TYPING_START_DELAY_MS = 280;

function useCarouselTypingLine(
  line: string | null,
  isActive: boolean
): { visibleText: string; typingComplete: boolean } {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [displayedLen, setDisplayedLen] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => {
    if (!line || !isActive) {
      setDisplayedLen(0);
      return;
    }
    if (reducedMotion) {
      setDisplayedLen(line.length);
      return;
    }
    setDisplayedLen(0);
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const startId = window.setTimeout(() => {
      if (cancelled) return;
      let len = 0;
      intervalId = window.setInterval(() => {
        if (cancelled) return;
        len += 1;
        setDisplayedLen(len);
        if (len >= line.length && intervalId != null) {
          window.clearInterval(intervalId);
          intervalId = undefined;
        }
      }, MS_PER_CHAR);
    }, TYPING_START_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      if (intervalId != null) window.clearInterval(intervalId);
    };
  }, [line, isActive, reducedMotion]);

  if (!line) return { visibleText: '', typingComplete: true };
  if (!isActive) return { visibleText: line, typingComplete: true };
  if (reducedMotion) return { visibleText: line, typingComplete: true };
  const typingComplete = displayedLen >= line.length;
  return { visibleText: line.slice(0, displayedLen), typingComplete };
}

function readSlideStridePx(scroller: HTMLDivElement): number {
  const slide = scroller.querySelector<HTMLElement>('[data-carousel-slide]');
  if (!slide) return Math.max(1, scroller.clientWidth);
  const gapRaw = getComputedStyle(scroller).gap || getComputedStyle(scroller).columnGap || '0';
  const gap = Number.parseFloat(gapRaw) || 0;
  return slide.getBoundingClientRect().width + gap;
}

export interface ChallengeRecommendedStripProps {
  challenges: CommunityChallenge[];
  onOpenDetail: (id: string) => void;
  onJoin: (challenge: CommunityChallenge) => void;
}

function RecommendedStripSlide({
  c,
  idx,
  isActive,
  panelBg,
  onOpenDetail,
  onJoin,
}: {
  c: CommunityChallenge;
  idx: number;
  isActive: boolean;
  panelBg: string;
  onOpenDetail: (id: string) => void;
  onJoin: (challenge: CommunityChallenge) => void;
}) {
  const heroSrc = resolveChallengeDetailHeroImageSrc(c);
  const line = challengeWhyJoinOneLiner(c.whyJoin);
  const canJoin =
    (c.lifecycle === 'active' && !c.optedIn) || (c.lifecycle === 'upcoming' && !c.optedIn);
  const showSeeDetails =
    isActive &&
    (c.lifecycle === 'active' || c.lifecycle === 'upcoming') &&
    c.optedIn;
  const { visibleText, typingComplete } = useCarouselTypingLine(line, isActive);
  const showJoinButton = canJoin && isActive;
  const showDetailsButton = showSeeDetails;

  return (
    <article
      data-carousel-slide
      tabIndex={0}
      aria-label={`${c.name}. Open challenge details.`}
      onClick={() => onOpenDetail(c.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(c.id);
        }
      }}
      className="flex max-h-[min(calc(240px_+_25pt),calc(42svh_+_25pt))] min-h-[calc(9.5rem_+_25pt)] w-[calc(100%-3rem-125pt)] min-w-[calc(100%-3rem-125pt)] max-w-[calc(100%-3rem-125pt)] shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] shadow-[var(--cds-elevation-level1)] transition hover:border-[var(--cds-color-grey-400)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)] sm:max-h-[min(calc(220px_+_25pt),calc(36svh_+_25pt))] sm:min-h-[calc(9.5rem_+_25pt)] sm:flex-row"
    >
      <div
        className="flex min-h-0 flex-1 flex-col justify-center gap-3 px-4 py-5 sm:max-w-[54%] sm:gap-3.5 sm:py-6 sm:pl-5 sm:pr-4"
        style={{ backgroundColor: panelBg }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-950 sm:text-[10px]">
            {formatChallengeCardHeroLabel(c)}
          </span>
          <span className="rounded-full border border-[var(--cds-color-grey-300)] bg-[var(--cds-color-white)]/80 px-2 py-0.5 text-[10px] font-semibold text-[var(--cds-color-grey-800)] sm:text-[11px]">
            {FEED_COHORT_META[c.cohortId].pillLabel}
          </span>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-[clamp(1.05rem,2.6vw,1.45rem)] font-bold leading-snug tracking-tight text-[var(--cds-color-grey-975)]">
            {c.name}
          </h3>
          {line ? (
            <p className="max-w-xl min-h-[3.25rem] text-[13px] leading-relaxed text-[var(--cds-color-grey-700)] sm:min-h-[3.75rem] sm:text-[14px]">
              {visibleText}
              {isActive && !typingComplete ? (
                <span
                  className="ml-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-[var(--cds-color-grey-700)] align-middle"
                  aria-hidden
                />
              ) : null}
            </p>
          ) : null}
        </div>
        {showJoinButton ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onJoin(c);
              }}
              className="inline-flex items-center justify-center rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)] sm:px-5 sm:text-sm"
            >
              Join
            </button>
          </div>
        ) : showDetailsButton ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(c.id);
              }}
              className="inline-flex items-center justify-center rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-300)] bg-transparent px-4 py-2.5 text-xs font-semibold text-[var(--cds-color-grey-800)] shadow-none transition hover:border-[var(--cds-color-grey-400)] hover:bg-[var(--cds-color-grey-25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)] sm:px-5 sm:text-sm"
            >
              See details
            </button>
          </div>
        ) : null}
      </div>
      <div className="relative min-h-[calc(7rem_+_25pt)] flex-1 overflow-hidden bg-[var(--cds-color-grey-100)] sm:min-h-0 sm:min-w-[46%]">
        <img
          src={heroSrc}
          alt=""
          className="h-full w-full object-cover object-top"
          loading={idx === 0 ? 'eager' : 'lazy'}
          decoding="async"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(250,248,245,0.5)_0%,transparent_18%),linear-gradient(to_top,rgba(15,23,42,0.12)_0%,transparent_40%)] sm:bg-[linear-gradient(to_right,rgba(250,248,245,0.65)_0%,transparent_22%),linear-gradient(to_top,rgba(15,23,42,0.12)_0%,transparent_45%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-4 right-4 hidden h-20 w-20 rounded-full border-[3px] border-white/90 shadow-lg sm:block md:bottom-5 md:right-5 md:h-24 md:w-24"
          aria-hidden
        />
      </div>
    </article>
  );
}

export const ChallengeRecommendedStrip: React.FC<ChallengeRecommendedStripProps> = ({
  challenges,
  onOpenDetail,
  onJoin,
}) => {
  const slides = useMemo(() => challenges.slice(0, TOP_SLIDE_COUNT), [challenges]);
  const slideKey = useMemo(() => slides.map((s) => s.id).join('|'), [slides]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const syncIndexFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || slides.length === 0) return;
    const stride = readSlideStridePx(el);
    if (stride <= 0) return;
    const i = Math.round(el.scrollLeft / stride);
    setActiveIdx(Math.min(slides.length - 1, Math.max(0, i)));
  }, [slides.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    syncIndexFromScroll();
    el.addEventListener('scroll', syncIndexFromScroll, { passive: true });
    const ro = new ResizeObserver(() => syncIndexFromScroll());
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', syncIndexFromScroll);
      ro.disconnect();
    };
  }, [syncIndexFromScroll, slides.length]);

  const scrollToSlide = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const stride = readSlideStridePx(el);
    const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = Math.min(index * stride, maxLeft);
    el.scrollTo({ left, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollLeft = 0;
    setActiveIdx(0);
  }, [slideKey]);

  if (slides.length === 0) return null;

  return (
    <section aria-label="Top challenges" className="space-y-3 px-1 pt-[24pt]">
      <p className="px-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--cds-color-grey-500)]">
        Top challenges
      </p>
      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Top challenges carousel"
        >
          {slides.map((c, idx) => (
            <RecommendedStripSlide
              key={c.id}
              c={c}
              idx={idx}
              isActive={idx === activeIdx}
              panelBg={SLIDE_PANEL_BGS[idx % SLIDE_PANEL_BGS.length]}
              onOpenDetail={onOpenDetail}
              onJoin={onJoin}
            />
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div
          className="flex items-center gap-2 px-0.5"
          role="tablist"
          aria-label="Choose top challenge slide"
        >
          {slides.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => scrollToSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIdx
                  ? 'w-10 bg-[var(--cds-color-grey-800)]'
                  : 'w-6 bg-[var(--cds-color-grey-300)] hover:bg-[var(--cds-color-grey-400)]'
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};
