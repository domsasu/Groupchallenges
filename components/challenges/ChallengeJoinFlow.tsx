import React, { useCallback, useEffect, useState } from 'react';
import type { CommunityChallenge } from '../../constants/communityChallenges';
import { VIBE_ENROLLED_COURSE } from '../../constants/joinFlowEnrolledCourse';
import { groupSquadForChallenge } from '../../constants/challengeSquads';
import { EnrolledCourseMiniCard } from './EnrolledCourseMiniCard';
import { CHALLENGE_TIER_ART_SRC } from '../../constants/challengeTierVisuals';
import { FEED_COHORT_META } from '../../constants/feedCohorts';

export interface ChallengeJoinFlowProps {
  challenge: CommunityChallenge;
  onClose: () => void;
  /** Called with the randomly assigned 1-based group index when the learner finishes the flow. */
  onComplete: (groupIndex: number) => void;
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
export const ChallengeJoinFlow: React.FC<ChallengeJoinFlowProps> = ({ challenge, onClose, onComplete }) => {
  const cohortMeta = FEED_COHORT_META[challenge.cohortId];
  const isUpcoming = challenge.lifecycle === 'upcoming';
  const tierSrc = challenge.cardHeroImageSrc ?? CHALLENGE_TIER_ART_SRC[challenge.visualTier];

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

  const handleStartIntro = useCallback(() => {
    setStep('assign');
  }, []);

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

  const tips = challenge.steps.slice(0, 3);
  const assignSquad = groupSquadForChallenge(challenge, cycleDisplayIndex);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--cds-color-grey-975)]/60 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
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
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-[var(--cds-color-grey-500)] transition-colors hover:bg-[var(--cds-color-grey-100)] hover:text-[var(--cds-color-grey-800)]"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'intro' && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="relative overflow-hidden bg-gradient-to-b from-[#1a1d22] to-[#141518] px-6 pb-8 pt-10">
              <div className="pointer-events-none absolute left-6 top-16 h-2 w-2 rounded-full bg-emerald-400/40 animate-pulse" />
              <div
                className="pointer-events-none absolute right-10 top-24 h-2.5 w-2.5 rounded-full bg-white/25 animate-pulse"
                style={{ animationDelay: '200ms' }}
              />
              <div
                className="pointer-events-none absolute bottom-8 left-1/4 h-1.5 w-1.5 rounded-full bg-emerald-300/35 animate-pulse"
                style={{ animationDelay: '400ms' }}
              />
              <div className="flex justify-center">
                <div className="animate-float relative">
                  <img
                    src={tierSrc}
                    alt=""
                    className="h-[100px] w-[100px] object-contain drop-shadow-lg"
                    loading="eager"
                    decoding="async"
                  />
                </div>
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
            {challenge.id === 'ch-active-ai-vibe-coding' && (
              <EnrolledCourseMiniCard
                callout="Suggested course for vibe coding"
                imageSrc={VIBE_ENROLLED_COURSE.imageSrc}
                provider={VIBE_ENROLLED_COURSE.provider}
                title={VIBE_ENROLLED_COURSE.title}
                type={VIBE_ENROLLED_COURSE.type}
                rating={VIBE_ENROLLED_COURSE.rating}
                href={VIBE_ENROLLED_COURSE.href}
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
