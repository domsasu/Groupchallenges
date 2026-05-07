import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  approxHeadcountForGroup,
  buildSoloLeaderboardRows,
  cohortParticipantEstimateForChallenge,
  formatProgressGoalQuantityLineForFraction,
  parseChallengeGoalTotalUnits,
  parseMilestoneNumericCaps,
  soloLearnerRankForChallenge,
  tierColumnIndexForCompletedUnits,
  type CommunityChallenge,
  type SoloLeaderboardRow,
} from '../../constants/communityChallenges';
import { groupSquadForChallenge } from '../../constants/challengeSquads';
import { isCohortCollectiveChallenge, isIndividualChallenge } from '../../constants/challengeTaxonomy';
import { Icons } from '../Icons';

function formatOrdinal(n: number): string {
  const abs = Math.abs(n);
  const rem100 = abs % 100;
  const rem10 = abs % 10;
  let suf = 'th';
  if (rem10 === 1 && rem100 !== 11) suf = 'st';
  else if (rem10 === 2 && rem100 !== 12) suf = 'nd';
  else if (rem10 === 3 && rem100 !== 13) suf = 'rd';
  return `${n}${suf}`;
}

/** Match milestone / goal copy used on challenge detail leaderboard. */
function extractUnitLabel(target: string | undefined): string {
  if (!target) return '';
  const m = target.trim().match(/^\d+(?:\.\d+)?\s+(.+)$/);
  return m ? m[1].trim() : '';
}

/** Stable mock stats per team for preview charts (deterministic from challenge + group). */
function mockTeamLearningStats(challengeId: string, groupNumber: number): { hours: number; activities: number } {
  const s = `${challengeId}\0${groupNumber}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  h = Math.abs(h);
  return {
    hours: 28 + (h % 62),
    activities: 12 + ((h >> 3) % 28),
  };
}

type RosterRow = {
  g: number;
  squad: ReturnType<typeof groupSquadForChallenge>;
  stats: { hours: number; activities: number };
};

/** When the learner’s group won, their squad should lead both mock metrics vs the field. */
function buildTeamRosterStats(challenge: CommunityChallenge): RosterRow[] {
  const teamIndices = Array.from({ length: challenge.groupCount }, (_, i) => i + 1);
  const base: RosterRow[] = teamIndices.map((g) => ({
    g,
    squad: groupSquadForChallenge(challenge, g),
    stats: mockTeamLearningStats(challenge.id, g),
  }));

  if (challenge.lifecycle !== 'completed' || !challenge.outcome?.won) {
    return base;
  }

  const winG = challenge.groupIndex;
  const others = base.filter((r) => r.g !== winG);
  const maxOtherH = others.length > 0 ? Math.max(...others.map((r) => r.stats.hours)) : 0;
  const maxOtherA = others.length > 0 ? Math.max(...others.map((r) => r.stats.activities)) : 0;

  return base.map((r) => {
    if (r.g !== winG) return r;
    return {
      ...r,
      stats: {
        hours: maxOtherH + 14,
        activities: maxOtherA + 12,
      },
    };
  });
}

/** Learner’s squad first, then remaining teams by group number. */
function orderRosterLearnerFirst(rows: RosterRow[], groupIndex: number): RosterRow[] {
  return [...rows].sort((a, b) => {
    const aMine = a.g === groupIndex ? 0 : 1;
    const bMine = b.g === groupIndex ? 0 : 1;
    if (aMine !== bMine) return aMine - bMine;
    return a.g - b.g;
  });
}

export interface ChallengeDetailPanelProps {
  challenge: CommunityChallenge;
  optedIn: boolean;
  onToggleOptIn: () => void;
  onOpenShareout?: () => void;
  /** Primary action when opted into an active challenge (e.g. jump back to course). */
  onResumeLearning?: () => void;
}

export const ChallengeDetailPanel: React.FC<ChallengeDetailPanelProps> = ({
  challenge,
  optedIn,
  onToggleOptIn,
  onOpenShareout,
  onResumeLearning,
}) => {
  const isCompleted = challenge.lifecycle === 'completed';
  const isUpcoming = challenge.lifecycle === 'upcoming';
  const reduceMotion = useReducedMotion();
  const outcomeHighlightRef = useRef<HTMLDivElement | null>(null);
  const confettiScheduledRef = useRef(false);
  const [teamRosterOpen, setTeamRosterOpen] = useState(false);
  const [rosterRevealCount, setRosterRevealCount] = useState(0);

  useEffect(() => {
    confettiScheduledRef.current = false;
    setTeamRosterOpen(false);
    setRosterRevealCount(0);
  }, [challenge.id]);

  const rosterStats = useMemo(
    () => orderRosterLearnerFirst(buildTeamRosterStats(challenge), challenge.groupIndex),
    [challenge]
  );

  const collectiveChallenge = isCohortCollectiveChallenge(challenge);
  const individualChallenge = isIndividualChallenge(challenge);

  const soloRevealSegments = useMemo(() => {
    if (!individualChallenge || !isCompleted || !challenge.outcome) return null;
    const { top, yours } = buildSoloLeaderboardRows(challenge, { optedIn: true });
    const seg: Array<{ kind: 'row'; row: SoloLeaderboardRow } | { kind: 'sep' }> = top.map((row) => ({
      kind: 'row' as const,
      row,
    }));
    if (yours) {
      seg.push({ kind: 'sep' });
      seg.push({ kind: 'row', row: yours });
    }
    return seg;
  }, [individualChallenge, isCompleted, challenge]);

  const rosterRevealTotal = soloRevealSegments?.length ?? rosterStats.length;

  /** When the roster opens, reveal teams one-by-one; smooth collapse resets the count. */
  useEffect(() => {
    if (!teamRosterOpen) {
      setRosterRevealCount(0);
      return;
    }
    const n = rosterRevealTotal;
    if (n === 0) return;

    if (reduceMotion) {
      setRosterRevealCount(n);
      return;
    }

    setRosterRevealCount(0);
    const initialDelayMs = 140;
    const staggerMs = 92;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let k = 1; k <= n; k++) {
      timers.push(
        setTimeout(() => setRosterRevealCount(k), initialDelayMs + (k - 1) * staggerMs)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [teamRosterOpen, rosterRevealTotal, reduceMotion]);

  const maxHours = Math.max(1, ...rosterStats.map((r) => r.stats.hours));
  const maxActivities = Math.max(1, ...rosterStats.map((r) => r.stats.activities));

  /** Fire as soon as a completed challenge with an outcome is shown (e.g. Completed tab), no scroll or delay. */
  useEffect(() => {
    if (!isCompleted || !challenge.outcome) return;
    if (confettiScheduledRef.current) return;
    confettiScheduledRef.current = true;

    queueMicrotask(() => {
      const el = outcomeHighlightRef.current;
      const rect = el?.getBoundingClientRect();
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const x = rect ? (rect.left + rect.width / 2) / w : 0.5;
      const y = rect ? (rect.top + rect.height / 2) / h : 0.45;
      const burst = {
        origin: { x, y } as const,
        particleCount: 85,
        spread: 70,
        startVelocity: 36,
        ticks: 200,
        gravity: 0.9,
      };
      void confetti({ ...burst, angle: 55 });
      void confetti({ ...burst, angle: 125 });
    });
  }, [isCompleted, challenge.outcome, challenge.id]);

  return (
    <div className="space-y-5">

      {isCompleted && challenge.outcome && (
        <div
          ref={outcomeHighlightRef}
          className="rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-white)] px-4 pb-4 pt-0"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="cds-body-secondary min-w-0 flex-1 text-[var(--cds-color-grey-975)]">
              {collectiveChallenge ? (
                <>
                  Everyone in your cohort worked toward <strong>one shared goal</strong> — thanks for contributing.
                </>
              ) : individualChallenge ? (
                <>
                  You finished <strong>{formatOrdinal(soloLearnerRankForChallenge(challenge))}</strong> among about{' '}
                  <strong>{cohortParticipantEstimateForChallenge(challenge).toLocaleString()}</strong> learners.
                </>
              ) : (
                <>
                  Your group placed <strong>1st</strong> out of {challenge.groupCount} teams.
                </>
              )}
            </p>
            <button
              type="button"
              id="challenge-view-team-trigger"
              aria-expanded={teamRosterOpen}
              aria-controls="challenge-team-roster-panel"
              onClick={() => setTeamRosterOpen((o) => !o)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] px-3 py-2 text-left cds-action-secondary text-[var(--cds-color-grey-975)] shadow-sm transition-[transform,box-shadow,background-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)] active:scale-[0.98]"
            >
              {collectiveChallenge ? 'View cohort' : individualChallenge ? 'View leaderboard' : 'View team'}
              <Icons.ChevronDown
                className={`h-4 w-4 shrink-0 text-[var(--cds-color-grey-600)] transition-transform duration-300 ease-out ${teamRosterOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
          </div>
          <AnimatePresence initial={false}>
            {teamRosterOpen && (
              <motion.div
                key="challenge-team-roster-panel"
                id="challenge-team-roster-panel"
                role="region"
                aria-labelledby="challenge-view-team-trigger"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.44,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="overflow-hidden"
              >
                <div className="mt-4 border-t border-[var(--cds-color-grey-100)] pt-4">
                  {individualChallenge && soloRevealSegments ? (
                    <ul className="space-y-3">
                      {soloRevealSegments.slice(0, rosterRevealCount).map((seg, idx) => {
                        if (seg.kind === 'sep') {
                          return (
                            <motion.li
                              key={`solo-sep-${idx}`}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: reduceMotion ? 0 : 0.35,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              role="presentation"
                              className="list-none rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--cds-color-grey-500)]"
                            >
                              Your rank
                            </motion.li>
                          );
                        }
                        const row = seg.row;
                        const goalTotal = parseChallengeGoalTotalUnits(challenge);
                        const lastTarget = challenge.milestones[challenge.milestones.length - 1]?.target;
                        const unitLabel = extractUnitLabel(lastTarget);
                        const milestoneCaps = parseMilestoneNumericCaps(challenge);
                        let progressLine: string;
                        if (goalTotal != null && unitLabel) {
                          const u = Math.round(Math.min(1, Math.max(0, row.progress01)) * goalTotal);
                          progressLine = `${u} / ${goalTotal} ${unitLabel}`;
                        } else {
                          progressLine =
                            formatProgressGoalQuantityLineForFraction(challenge, row.progress01) ??
                            `${Math.round(row.progress01 * 100)}%`;
                        }
                        let milestoneTitle = '—';
                        let milestoneSubtitle: string | null = null;
                        if (goalTotal != null && milestoneCaps.length === challenge.milestones.length) {
                          const units = Math.round(Math.min(1, Math.max(0, row.progress01)) * goalTotal);
                          const col = tierColumnIndexForCompletedUnits(units, milestoneCaps);
                          const m = challenge.milestones[col];
                          if (m) {
                            milestoneTitle = m.label;
                            const cap = milestoneCaps[col];
                            milestoneSubtitle = cap != null ? `${cap} ${unitLabel}`.trim() : m.target ?? null;
                          }
                        }
                        const pillMuted =
                          'border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] text-[var(--cds-color-grey-800)]';
                        const pillActive =
                          'border-[var(--cds-color-blue-500)] bg-[var(--cds-color-blue-25)] text-[var(--cds-color-grey-975)] shadow-sm ring-2 ring-[var(--cds-color-blue-400)]/35';
                        return (
                          <motion.li
                            key={row.isYou && row.rank > 5 ? `solo-you-${row.rank}` : `solo-r-${row.rank}-${idx}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: reduceMotion ? 0 : 0.4,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className={`rounded-[var(--cds-border-radius-100)] border px-3 py-3 ${
                              row.isYou
                                ? 'border-[var(--cds-color-blue-300)] bg-[var(--cds-color-blue-25)]'
                                : 'border-[var(--cds-color-grey-200)] bg-transparent'
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-semibold text-[var(--cds-color-grey-500)]">
                                {row.rank}
                              </span>
                              <span
                                className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-bold leading-tight ${row.isYou ? pillActive : pillMuted}`}
                              >
                                {row.displayLabel}
                              </span>
                              <div className="min-w-0 flex-1 text-right sm:text-left">
                                <span className="text-[12px] font-semibold text-[var(--cds-color-grey-975)]">
                                  {milestoneTitle}
                                </span>
                                {milestoneSubtitle ? (
                                  <span className="mt-0.5 block text-[11px] text-[var(--cds-color-grey-600)]">
                                    {milestoneSubtitle}
                                  </span>
                                ) : null}
                              </div>
                              <span className="w-full shrink-0 text-right text-[13px] font-semibold tabular-nums text-[var(--cds-color-grey-975)] sm:w-auto">
                                {progressLine}
                              </span>
                            </div>
                          </motion.li>
                        );
                      })}
                    </ul>
                  ) : (
                    <ul className="space-y-4">
                      {rosterStats.slice(0, rosterRevealCount).map(({ g, squad, stats }) => {
                        const isYours = g === challenge.groupIndex;
                        const memberCount = approxHeadcountForGroup(challenge, g);
                        const hoursPct = (stats.hours / maxHours) * 100;
                        const actPct = (stats.activities / maxActivities) * 100;
                        return (
                          <motion.li
                            key={g}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: reduceMotion ? 0 : 0.4,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className={`rounded-[var(--cds-border-radius-100)] border px-3 py-3 ${
                              isYours
                                ? 'border-[var(--cds-color-blue-300)] bg-[var(--cds-color-blue-25)]'
                                : 'border-[var(--cds-color-grey-200)] bg-transparent'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-bold leading-tight ${isYours ? squad.active : squad.muted}`}
                                >
                                  {squad.label}
                                </span>
                                {isYours ? (
                                  <span className="text-[11px] font-medium text-[var(--cds-color-blue-800)]">
                                    {collectiveChallenge ? 'your cohort' : 'your team'}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                                {!isYours && !collectiveChallenge ? (
                                  <span className="text-[10px] font-medium text-[var(--cds-color-grey-500)]">
                                    Team {g}
                                  </span>
                                ) : null}
                                <span
                                  className={`text-[10px] tabular-nums ${
                                    isYours
                                      ? 'font-semibold text-[var(--cds-color-blue-800)]'
                                      : 'font-medium text-[var(--cds-color-grey-600)]'
                                  }`}
                                >
                                  {memberCount.toLocaleString()} members
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              <div>
                                <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--cds-color-grey-600)]">
                                  <span>Hours logged</span>
                                  <span className="tabular-nums font-semibold text-[var(--cds-color-grey-800)]">
                                    {stats.hours}h
                                  </span>
                                </div>
                                <div
                                  className="h-2 w-full overflow-hidden rounded-full bg-[var(--cds-color-grey-200)]"
                                  role="presentation"
                                >
                                  <div
                                    className="h-full rounded-full bg-emerald-600 transition-[width] duration-300"
                                    style={{ width: `${hoursPct}%` }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--cds-color-grey-600)]">
                                  <span>Learning activities</span>
                                  <span className="tabular-nums font-semibold text-[var(--cds-color-grey-800)]">
                                    {stats.activities}
                                  </span>
                                </div>
                                <div
                                  className="h-2 w-full overflow-hidden rounded-full bg-[var(--cds-color-grey-200)]"
                                  role="presentation"
                                >
                                  <div
                                    className="h-full rounded-full bg-[var(--cds-color-blue-600)] transition-[width] duration-300"
                                    style={{ width: `${actPct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Enrolled learners: resume (active only) + leave — hero handles join for browse/upcoming. */}
      {!isCompleted && optedIn && (
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--cds-color-grey-100)] pt-4">
          {!isUpcoming ? (
            <button
              type="button"
              onClick={() => onResumeLearning?.()}
              className="rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-4 py-2 cds-action-secondary text-[var(--cds-color-white)] shadow-sm transition hover:bg-[var(--cds-color-blue-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
            >
              Resume learning
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToggleOptIn}
            className="rounded-[var(--cds-border-radius-100)] border-0 bg-transparent px-4 py-2 cds-action-secondary text-[var(--cds-color-blue-700)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
          >
            Leave challenge
          </button>
        </div>
      )}
    </div>
  );
};
