import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CommunityChallenge } from '../../constants/communityChallenges';
import {
  CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW,
  VIBE_ENROLLED_COURSE,
} from '../../constants/joinFlowEnrolledCourse';
import { groupSquadForChallenge } from '../../constants/challengeSquads';
import { EnrolledCourseMiniCard } from './EnrolledCourseMiniCard';
import { resolveChallengeMiniCardImageSrc } from '../../constants/challengeMiniCardImage';
import { FEED_COHORT_META } from '../../constants/feedCohorts';
import { VIBE_CHALLENGE_ID } from '../../constants/communityChallengesPersistence';

export interface ChallengeJoinFlowProps {
  challenge: CommunityChallenge;
  onClose: () => void;
  /** Called with the randomly assigned 1-based group index when the learner finishes the flow. */
  onComplete: (groupIndex: number) => void;
  /** For generic challenges, recap “Resume” runs after join completes (opens learner’s in-progress course). */
  onResumeLearning?: () => void;
}

type Step = 'intro' | 'assign' | 'recap';

function parseChallengeLocalDate(isoDate: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return new Date(isoDate);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Three-step modal: intro (tier art), animated squad assignment, recap with goal + tips + CTAs.
 */
export const ChallengeJoinFlow: React.FC<ChallengeJoinFlowProps> = ({
  challenge,
  onClose,
  onComplete,
  onResumeLearning,
}) => {
  const cohortMeta = FEED_COHORT_META[challenge.cohortId];
  const isUpcoming = challenge.lifecycle === 'upcoming';
  const joinHeroSrc = resolveChallengeMiniCardImageSrc(challenge);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [step, setStep] = useState<Step>('intro');
  const [cycleDisplayIndex, setCycleDisplayIndex] = useState(1);
  /** Rolled when this dialog mounts — parent does not opt in until `onComplete` runs. */
  const [targetGroupIndex] = useState(() => Math.floor(Math.random() * challenge.groupCount) + 1);

  const startDateLabel = isUpcoming
    ? parseChallengeLocalDate(challenge.startsAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  useEffect(() => {
    setStep('intro');
    setCycleDisplayIndex(1);
  }, [challenge.id]);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      const AC =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AC();
      }
      void audioCtxRef.current.resume();
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const playSelectionTick = useCallback(
    (groupIndex: number) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      const base = 460;
      const freq = base + ((groupIndex - 1) % Math.max(1, challenge.groupCount)) * 32;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(0.055, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.034);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    },
    [challenge.groupCount]
  );

  const playResolveChime = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime;
    const freqs = [640, 860, 1020];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = 'sine';
      const start = t + i * 0.055;
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.065, start + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0008, start + 0.22);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  }, []);

  useEffect(() => {
    if (step !== 'assign') return;
    playSelectionTick(cycleDisplayIndex);
  }, [step, cycleDisplayIndex, playSelectionTick]);

  useEffect(() => {
    if (step !== 'recap') return;
    playResolveChime();
  }, [step, playResolveChime]);

  useEffect(() => {
    return () => {
      try {
        void audioCtxRef.current?.suspend();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const handleStartIntro = useCallback(() => {
    ensureAudioContext();
    setStep('assign');
  }, [ensureAudioContext]);

  useEffect(() => {
    if (step !== 'assign' || targetGroupIndex < 1) return;

    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      setCycleDisplayIndex((tick % challenge.groupCount) + 1);
    }, 85);

    const land = setTimeout(() => {
      clearInterval(interval);
      setCycleDisplayIndex(targetGroupIndex);
    }, 2000);

    const toRecap = setTimeout(() => {
      setStep('recap');
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(land);
      clearTimeout(toRecap);
    };
  }, [step, targetGroupIndex, challenge.groupCount]);

  const finishJoin = useCallback(() => {
    if (targetGroupIndex < 1) return;
    onComplete(targetGroupIndex);
    onClose();
  }, [targetGroupIndex, onComplete, onClose]);

  /** On recap, dismissing still commits the join (same as primary CTAs). Earlier steps cancel without joining. */
  const handleDismiss = useCallback(() => {
    if (step === 'recap' && targetGroupIndex >= 1) {
      finishJoin();
      return;
    }
    onClose();
  }, [step, targetGroupIndex, finishJoin, onClose]);

  const resumeCurrentCourseAndFinish = useCallback(() => {
    finishJoin();
    onResumeLearning?.();
  }, [finishJoin, onResumeLearning]);

  const tips = challenge.steps.slice(0, 3);
  const assignSquad = groupSquadForChallenge(challenge, cycleDisplayIndex);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--cds-color-grey-975)]/60 backdrop-blur-sm"
        aria-hidden
        onClick={handleDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="challenge-join-flow-title"
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[var(--cds-color-white)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-[var(--cds-color-grey-500)] transition-colors hover:bg-[var(--cds-color-grey-100)] hover:text-[var(--cds-color-grey-800)]"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'intro' && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="relative overflow-hidden bg-gradient-to-b from-[#1a1d22] to-[#141518] pb-8">
              <div className="relative aspect-[21/9] min-h-[100px] max-h-[220px] w-full overflow-hidden bg-[#141518]">
                <img
                  src={joinHeroSrc}
                  alt=""
                  className="h-full w-full object-cover object-top"
                  loading="eager"
                  decoding="async"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(20,21,24,0.92)_0%,rgba(20,21,24,0.35)_45%,transparent_100%)]"
                  aria-hidden
                />
                <div className="pointer-events-none absolute left-4 top-4 h-2 w-2 rounded-full bg-emerald-400/40 animate-pulse" />
                <div
                  className="pointer-events-none absolute right-8 top-6 h-2.5 w-2.5 rounded-full bg-white/25 animate-pulse"
                  style={{ animationDelay: '200ms' }}
                />
                <div
                  className="pointer-events-none absolute bottom-4 left-1/4 h-1.5 w-1.5 rounded-full bg-emerald-300/35 animate-pulse"
                  style={{ animationDelay: '400ms' }}
                />
              </div>
            </div>
            <div className="space-y-4 px-6 pb-6 pt-2">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--cds-color-grey-500)]">
                {cohortMeta.pillLabel}
              </p>
              <h2 id="challenge-join-flow-title" className="text-center text-xl font-bold text-[var(--cds-color-grey-975)]">
                {challenge.name}
              </h2>
              <p className="cds-body-secondary text-center text-[var(--cds-color-grey-700)]">{challenge.whyJoin}</p>
              {isUpcoming && startDateLabel && (
                <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-center text-sm text-amber-950">
                  This challenge starts <strong>{startDateLabel}</strong>. You can join now—we’ll place you in a squad;
                  rankings go live when the challenge begins.
                </p>
              )}
              {!isUpcoming && (
                <p className="text-center text-sm text-[var(--cds-color-grey-600)]">
                  You’ll join learners in <strong>{cohortMeta.pillLabel}</strong>, split into separate squads that
                  compete on one shared goal.
                </p>
              )}
              <button
                type="button"
                onClick={handleStartIntro}
                className="mt-2 w-full rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
              >
                Start challenge
              </button>
            </div>
          </div>
        )}

        {step === 'assign' && targetGroupIndex >= 1 && (
          <div className="flex flex-col items-center px-6 pb-10 pt-12">
            <p className="max-w-sm text-center text-sm text-[var(--cds-color-grey-700)]">
              The cohort is divided into <strong>{challenge.groupCount} squads</strong>. Each squad competes toward the
              same goal—we’re finding your team…
            </p>
            <div
              className={`mt-8 inline-flex min-h-[52px] min-w-[12rem] items-center justify-center rounded-full border px-5 py-2.5 text-center text-sm font-bold transition-all duration-200 ${assignSquad.active}`}
            >
              {assignSquad.label}
            </div>
            <p className="mt-6 text-center text-xs text-[var(--cds-color-grey-500)]">Placing you…</p>
          </div>
        )}

        {step === 'recap' && targetGroupIndex >= 1 && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6 pt-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cds-color-grey-500)]">You’re in</p>
              <div
                className={`mx-auto mt-2 inline-flex items-center rounded-full border px-4 py-2 text-sm font-bold ${groupSquadForChallenge(challenge, targetGroupIndex).active}`}
              >
                {groupSquadForChallenge(challenge, targetGroupIndex).label}
              </div>
            </div>
            {tips.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[var(--cds-color-grey-975)]">Ways to get started</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[var(--cds-color-grey-700)]">
                  {tips.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {challenge.id === VIBE_CHALLENGE_ID ? (
              <EnrolledCourseMiniCard
                callout="You've already started a relevant course"
                imageSrc={VIBE_ENROLLED_COURSE.imageSrc}
                provider={VIBE_ENROLLED_COURSE.provider}
                title={VIBE_ENROLLED_COURSE.title}
                type={VIBE_ENROLLED_COURSE.type}
                rating={VIBE_ENROLLED_COURSE.rating}
                completionPercent={VIBE_ENROLLED_COURSE.completionPercent}
                href={VIBE_ENROLLED_COURSE.href}
                onCommitJoin={finishJoin}
                ctaLabel="Let's go!"
              />
            ) : (
              <EnrolledCourseMiniCard
                callout="Your enrolled course — activity here counts toward your squad's goal."
                imageSrc={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.imageSrc}
                provider={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.provider}
                title={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.title}
                type={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.type}
                rating={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.rating}
                completionPercent={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.completionPercent}
                href={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.href}
                onCommitJoin={onResumeLearning ? resumeCurrentCourseAndFinish : finishJoin}
                ctaLabel={onResumeLearning ? 'Resume my course' : 'Continue'}
              />
            )}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  finishJoin();
                }}
                className="rounded-[var(--cds-border-radius-100)] border-0 bg-transparent px-4 py-2.5 text-sm font-semibold text-[var(--cds-color-blue-700)] transition-colors hover:bg-[var(--cds-color-grey-25)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
              >
                View challenge details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
