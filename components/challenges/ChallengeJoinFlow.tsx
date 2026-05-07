import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CommunityChallenge } from '../../constants/communityChallenges';
import {
  CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW,
  VIBE_ENROLLED_COURSE,
} from '../../constants/joinFlowEnrolledCourse';
import { groupSquadForChallenge } from '../../constants/challengeSquads';
import { EnrolledCourseMiniCard } from './EnrolledCourseMiniCard';
import { FEED_COHORT_META } from '../../constants/feedCohorts';
import { VIBE_CHALLENGE_ID } from '../../constants/communityChallengesPersistence';
import {
  isCohortCollectiveChallenge,
  isIndividualChallenge,
} from '../../constants/challengeTaxonomy';

export interface ChallengeJoinFlowProps {
  challenge: CommunityChallenge;
  onClose: () => void;
  /** Called with the randomly assigned 1-based group index when the learner finishes the flow. */
  onComplete: (groupIndex: number) => void;
  /** For generic challenges, recap “Resume” runs after join completes (opens learner’s in-progress course). */
  onResumeLearning?: () => void;
}

type Step = 'assign' | 'recap';

const JOIN_FLOW_Z = 2147483646;

function parseChallengeLocalDate(isoDate: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return new Date(isoDate);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Join modal: optional squad placement (`inner_cohort` with multiple squads), then recap with tips + CTAs.
 * Solo, collective, and single-squad challenges skip placement and open directly on recap.
 */
export const ChallengeJoinFlow: React.FC<ChallengeJoinFlowProps> = ({
  challenge,
  onClose,
  onComplete,
  onResumeLearning,
}) => {
  const cohortMeta = FEED_COHORT_META[challenge.cohortId];
  const isUpcoming = challenge.lifecycle === 'upcoming';
  const audioCtxRef = useRef<AudioContext | null>(null);

  const showSquadAssignment =
    challenge.participationMode === 'inner_cohort' && challenge.groupCount > 1;

  const [step, setStep] = useState<Step>(() => (showSquadAssignment ? 'assign' : 'recap'));
  /** User tapped Assign — starts cycling animation (multi-squad only). */
  const [placementStarted, setPlacementStarted] = useState(() => !showSquadAssignment);
  const [cycleDisplayIndex, setCycleDisplayIndex] = useState(1);
  /** Rolled when placement runs — parent does not opt in until `onComplete` runs. Always `1` when no squad assignment. */
  const [targetGroupIndex, setTargetGroupIndex] = useState(1);

  const startDateLabel = isUpcoming
    ? parseChallengeLocalDate(challenge.startsAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  useEffect(() => {
    const assign = challenge.participationMode === 'inner_cohort' && challenge.groupCount > 1;
    setStep(assign ? 'assign' : 'recap');
    setPlacementStarted(!assign);
    setCycleDisplayIndex(1);
    setTargetGroupIndex(
      assign ? Math.floor(Math.random() * challenge.groupCount) + 1 : 1
    );
  }, [challenge.id, challenge.participationMode, challenge.groupCount]);

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

  const startPlacement = useCallback(() => {
    ensureAudioContext();
    setPlacementStarted(true);
  }, [ensureAudioContext]);

  useEffect(() => {
    if (step !== 'assign' || !placementStarted || targetGroupIndex < 1) return;

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
  }, [step, placementStarted, targetGroupIndex, challenge.groupCount]);

  const finishJoin = useCallback(() => {
    if (targetGroupIndex < 1) return;
    onComplete(targetGroupIndex);
    onClose();
  }, [targetGroupIndex, onComplete, onClose]);

  /** On recap, dismissing still commits the join (same as primary CTAs). Assign (before placement) closes without joining. */
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
  const recapSquad = groupSquadForChallenge(challenge, targetGroupIndex);

  const overlay = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: JOIN_FLOW_Z }}
    >
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

        {step === 'assign' && targetGroupIndex >= 1 && !placementStarted && showSquadAssignment ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6 pt-10">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--cds-color-grey-500)]">
              {cohortMeta.pillLabel}
            </p>
            <h2
              id="challenge-join-flow-title"
              className="mt-2 text-center text-xl font-bold leading-snug text-[var(--cds-color-grey-975)]"
            >
              {challenge.name}
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-[var(--cds-color-grey-700)]">{challenge.whyJoin}</p>
            <p className="mt-4 max-w-sm self-center text-center text-sm text-[var(--cds-color-grey-700)]">
              The cohort is divided into <strong>{challenge.groupCount} squads</strong>. Tap <strong>Assign</strong> to
              find your team.
            </p>
            <button
              type="button"
              onClick={startPlacement}
              className="mt-6 w-full rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
            >
              Assign
            </button>
          </div>
        ) : null}

        {step === 'assign' && targetGroupIndex >= 1 && placementStarted ? (
          <div className="flex flex-col items-center px-6 pb-10 pt-12">
            <h2 id="challenge-join-flow-title" className="sr-only">
              {challenge.name}
            </h2>
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
        ) : null}

        {step === 'recap' && targetGroupIndex >= 1 && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6 pt-8">
            <h2 id="challenge-join-flow-title" className="sr-only">
              {challenge.name}
            </h2>
            <div className="text-center">
              <p className="text-xs font-semibold text-[var(--cds-color-grey-500)]">
                {isCohortCollectiveChallenge(challenge)
                  ? 'You’re enrolled!'
                  : isIndividualChallenge(challenge)
                    ? 'You’re competing'
                    : 'You’re in cohort group'}
              </p>
              <div
                className={`mx-auto mt-2 inline-flex items-center rounded-full border px-4 py-2 text-sm font-bold ${recapSquad.active}`}
              >
                {isCohortCollectiveChallenge(challenge)
                  ? `${cohortMeta.label} · Collaborative effort`
                  : recapSquad.label}
              </div>
              {isIndividualChallenge(challenge) ? (
                <p className="mt-2 max-w-sm mx-auto text-sm leading-relaxed text-[var(--cds-color-grey-700)]">
                  You’re on your own — no teams. Your activity moves you on the cohort leaderboard.
                </p>
              ) : null}
            </div>
            {isUpcoming && startDateLabel ? (
              <p className="mt-6 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-center text-sm text-amber-950">
                This challenge starts <strong>{startDateLabel}</strong>.{' '}
                {isCohortCollectiveChallenge(challenge)
                  ? 'Cohort progress and the shared meter start when the challenge begins.'
                  : isIndividualChallenge(challenge)
                    ? 'Individual rankings and your place on the cohort leaderboard update when the challenge begins.'
                    : 'Rankings go live when the challenge begins.'}
              </p>
            ) : null}
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
                callout={
                  isCohortCollectiveChallenge(challenge)
                    ? "Your enrolled course — activity here counts toward your cohort's shared goal."
                    : isIndividualChallenge(challenge)
                      ? 'Your enrolled course — activity here counts toward your standing on the cohort leaderboard.'
                      : "Your enrolled course — activity here counts toward your squad's goal."
                }
                imageSrc={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.imageSrc}
                provider={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.provider}
                title={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.title}
                type={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.type}
                rating={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.rating}
                completionPercent={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.completionPercent}
                href={CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW.href}
                onCommitJoin={onResumeLearning ? resumeCurrentCourseAndFinish : finishJoin}
                ctaLabel={onResumeLearning ? 'Resume' : 'Continue'}
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

  if (typeof document === 'undefined') return overlay;
  return createPortal(overlay, document.body);
};
