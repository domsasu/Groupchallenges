import React, { useState } from 'react';

/** Leaderboard deadline (cohort due) — local calendar date. */
const LEADERBOARD_DUE_DATE = new Date(2026, 2, 29);

function daysLeftUntilLeaderboardDue(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(LEADERBOARD_DUE_DATE);
  due.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.round((due.getTime() - today.getTime()) / 86400000)
  );
}

/** Desk-calendar chip: “Days left” + remaining day count. */
function DueCalendarChip({ daysLeft }: { daysLeft: number }) {
  return (
    <div
      className="flex h-12 min-w-[72px] shrink-0 flex-col overflow-hidden rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-300)] bg-[var(--cds-color-white)] shadow-[var(--cds-elevation-level1)]"
      aria-hidden
    >
      <div className="flex min-h-[22px] shrink-0 items-center justify-center border-b border-[var(--cds-color-grey-200)] bg-[var(--cds-color-red-25)] px-1 pt-0.5">
        <span className="cds-body-tertiary text-center leading-tight text-[var(--cds-color-grey-975)]">
          Days left
        </span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--cds-color-white)] px-1 pb-0.5 pt-0.5">
        <span className="cds-action-secondary leading-none text-[var(--cds-color-grey-975)] tabular-nums">
          {daysLeft}
        </span>
      </div>
    </div>
  );
}

/** Tier honors artwork: `public/1 honor.svg` … `3 honor.svg` (gold / silver / bronze fills). */
const HONOR_MEDAL_SRC: Record<1 | 2 | 3, string> = {
  1: '/1%20honor.svg',
  2: '/2%20honor.svg',
  3: '/3%20honor.svg',
};

function HonorMedalIcon({
  rank,
  dense,
}: {
  rank: 1 | 2 | 3;
  dense?: boolean;
}) {
  return (
    <img
      src={HONOR_MEDAL_SRC[rank]}
      alt=""
      className={dense ? 'h-5 w-5 shrink-0' : 'h-6 w-6 shrink-0'}
      aria-hidden
      title={rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
    />
  );
}

export type PeerRow = {
  letter: string;
  pseudonym: string;
  hoursLabel: string;
  isLive?: boolean;
};

/** Mock peers: rank 1–20 (historical educators + hours). Learner is shown at the active user rank, not as a row here. */
const PEER_BY_RANK: Record<number, PeerRow> = {
  1: { letter: 'M', pseudonym: 'Maria Montessori', hoursLabel: '16h', isLive: true },
  2: { letter: 'J', pseudonym: 'John Dewey', hoursLabel: '15.5h' },
  3: { letter: 'P', pseudonym: 'Paulo Freire', hoursLabel: '15h' },
  4: { letter: 'H', pseudonym: 'Horace Mann', hoursLabel: '14.5h', isLive: true },
  5: { letter: 'C', pseudonym: 'Charlotte Mason', hoursLabel: '14h' },
  6: { letter: 'B', pseudonym: 'Booker T. Washington', hoursLabel: '13.5h' },
  7: { letter: 'D', pseudonym: 'Dorothea Beale', hoursLabel: '13h' },
  8: { letter: 'F', pseudonym: 'Friedrich Fröbel', hoursLabel: '12.5h' },
  9: { letter: 'E', pseudonym: 'Emma Willard', hoursLabel: '12h' },
  10: { letter: 'J', pseudonym: 'Jaime Escalante', hoursLabel: '11.5h' },
  11: { letter: 'M', pseudonym: 'Mary McLeod Bethune', hoursLabel: '11h' },
  12: { letter: 'H', pseudonym: 'Henry Barnard', hoursLabel: '10.5h' },
  13: { letter: 'P', pseudonym: 'Prudence Crandall', hoursLabel: '10h' },
  14: { letter: 'T', pseudonym: 'Thomas Gallaudet', hoursLabel: '9.5h' },
  15: { letter: 'E', pseudonym: 'Ellen Key', hoursLabel: '9h' },
  16: { letter: 'Z', pseudonym: 'Anton Makarenko', hoursLabel: '8.5h', isLive: true },
  17: { letter: 'A', pseudonym: 'Anna Julia Cooper', hoursLabel: '8h' },
  18: { letter: 'J', pseudonym: 'James Pillans', hoursLabel: '7.5h' },
  19: { letter: 'E', pseudonym: 'Elizabeth Blackwell', hoursLabel: '7h' },
  20: { letter: 'O', pseudonym: 'Ovide Decroly', hoursLabel: '6.5h' },
};

/** #AIpowered cohort — mock leaderboard rows. */
const PEER_BY_RANK_AI: Record<number, PeerRow> = {
  1: { letter: 'A', pseudonym: 'Ada Lovelace', hoursLabel: '19h', isLive: true },
  2: { letter: 'A', pseudonym: 'Alan Turing', hoursLabel: '17.5h' },
  3: { letter: 'G', pseudonym: 'Geoffrey Hinton', hoursLabel: '17h' },
  4: { letter: 'F', pseudonym: 'Fei-Fei Li', hoursLabel: '16.5h', isLive: true },
  5: { letter: 'Y', pseudonym: 'Yann LeCun', hoursLabel: '16h' },
  6: { letter: 'D', pseudonym: 'Demis Hassabis', hoursLabel: '15.5h' },
  7: { letter: 'A', pseudonym: 'Andrew Ng', hoursLabel: '15h' },
  8: { letter: 'J', pseudonym: 'Joy Buolamwini', hoursLabel: '14.5h' },
  9: { letter: 'T', pseudonym: 'Timnit Gebru', hoursLabel: '14h' },
  10: { letter: 'K', pseudonym: 'Kate Crawford', hoursLabel: '13.5h' },
  11: { letter: 'D', pseudonym: 'Daphne Koller', hoursLabel: '13h' },
  12: { letter: 'J', pseudonym: 'Jürgen Schmidhuber', hoursLabel: '12.5h' },
  13: { letter: 'I', pseudonym: 'Ian Goodfellow', hoursLabel: '12h' },
  14: { letter: 'R', pseudonym: 'Rachel Thomas', hoursLabel: '11.5h' },
  15: { letter: 'S', pseudonym: 'Soumith Chintala', hoursLabel: '11h' },
  16: { letter: 'C', pseudonym: 'Chris Olah', hoursLabel: '10.5h', isLive: true },
  17: { letter: 'L', pseudonym: 'Lilian Weng', hoursLabel: '10h' },
  18: { letter: 'M', pseudonym: 'Margaret Mitchell', hoursLabel: '9.5h' },
  19: { letter: 'S', pseudonym: 'Sebastian Thrun', hoursLabel: '9h' },
  20: { letter: 'P', pseudonym: 'Peter Norvig', hoursLabel: '8.5h' },
};

/** #workingparents cohort — mock leaderboard rows. */
const PEER_BY_RANK_CAREER: Record<number, PeerRow> = {
  1: { letter: 'M', pseudonym: 'Maya Chen', hoursLabel: '15h', isLive: true },
  2: { letter: 'R', pseudonym: 'Ravi Patel', hoursLabel: '14.5h' },
  3: { letter: 'S', pseudonym: 'Sam Okonkwo', hoursLabel: '14h' },
  4: { letter: 'L', pseudonym: 'Leah Morrison', hoursLabel: '13.5h', isLive: true },
  5: { letter: 'J', pseudonym: 'Jordan Kim', hoursLabel: '13h' },
  6: { letter: 'T', pseudonym: 'Taylor Brooks', hoursLabel: '12.5h' },
  7: { letter: 'N', pseudonym: 'Nina Alvarez', hoursLabel: '12h' },
  8: { letter: 'O', pseudonym: 'Omar Haddad', hoursLabel: '11.5h' },
  9: { letter: 'E', pseudonym: 'Elena Rossi', hoursLabel: '11h' },
  10: { letter: 'D', pseudonym: 'Dev Singh', hoursLabel: '10.5h' },
  11: { letter: 'C', pseudonym: 'Casey Wu', hoursLabel: '10h' },
  12: { letter: 'A', pseudonym: 'Alex Rivera', hoursLabel: '9.5h' },
  13: { letter: 'B', pseudonym: 'Blake Foster', hoursLabel: '9h' },
  14: { letter: 'H', pseudonym: 'Hannah Lee', hoursLabel: '8.5h' },
  15: { letter: 'G', pseudonym: 'Gabe Ortiz', hoursLabel: '8h' },
  16: { letter: 'I', pseudonym: 'Ivy Nakamura', hoursLabel: '7.5h', isLive: true },
  17: { letter: 'V', pseudonym: 'Vik Desai', hoursLabel: '7h' },
  18: { letter: 'W', pseudonym: 'Will Carter', hoursLabel: '6.5h' },
  19: { letter: 'Z', pseudonym: 'Zoe Martin', hoursLabel: '6h', isLive: true },
  20: { letter: 'K', pseudonym: 'Kai Berg', hoursLabel: '5.5h' },
};

type LeaderboardTabId = 'enrolled' | 'ai' | 'workingparents';

const LEADERBOARD_TABS: { id: LeaderboardTabId; label: string }[] = [
  { id: 'workingparents', label: '#workingparents' },
  { id: 'enrolled', label: '#coursera' },
  { id: 'ai', label: '#AIpowered' },
];

const PEERS_BY_TAB: Record<LeaderboardTabId, Record<number, PeerRow>> = {
  enrolled: PEER_BY_RANK,
  ai: PEER_BY_RANK_AI,
  workingparents: PEER_BY_RANK_CAREER,
};

/** Learner rank per cohort tab — varies so “Around you” reflects different standings. */
const USER_RANK_BY_TAB: Record<LeaderboardTabId, number> = {
  enrolled: 15,
  ai: 6,
  workingparents: 18,
};

/** Priya’s displayed hours at her rank for each cohort (overrides peer row when she’s the learner). */
const LEARNER_HOURS_BY_TAB: Record<LeaderboardTabId, Record<number, string>> = {
  enrolled: { 15: '9h' },
  ai: { 6: '15h' },
  workingparents: { 18: '6.5h' },
};

export type LeaderboardLayoutMode = 'stacked' | 'split';

export interface WeeklyLearningLeaderboardProps {
  learnerDisplayName?: string;
  /** `split` places Top 3 and Around you in two columns on md+ viewports to reduce vertical height. */
  layout?: LeaderboardLayoutMode;
}

/**
 * Pastel avatar fills in ROYGBIV order (two lightness passes). CDS has no orange token —
 * warm yellows stand in for O. Indigo ≈ deep blue; violet ≈ purple + pink.
 */
const PASTEL_AVATAR_BGS = [
  'bg-[var(--cds-color-red-50)]',
  'bg-[var(--cds-color-yellow-25)]',
  'bg-[var(--cds-color-yellow-50)]',
  'bg-[var(--cds-color-green-50)]',
  'bg-[var(--cds-color-blue-50)]',
  'bg-[var(--cds-color-blue-100)]',
  'bg-[var(--cds-color-purple-50)]',
  'bg-[var(--cds-color-red-25)]',
  'bg-[var(--cds-color-blue-25)]',
  'bg-[var(--cds-color-yellow-50)]',
  'bg-[var(--cds-color-green-100)]',
  'bg-[var(--cds-color-aqua-50)]',
  'bg-[var(--cds-color-purple-25)]',
  'bg-[var(--cds-color-pink-50)]',
] as const;

/** FNV-1a — spreads strings more evenly than a simple polynomial hash. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pastelAvatarBg(seed: string): string {
  return PASTEL_AVATAR_BGS[hashSeed(seed) % PASTEL_AVATAR_BGS.length];
}

export function LetterAvatar({
  letter,
  seed,
  isLive,
  size = 'default',
  className = '',
}: {
  letter: string;
  /** Stable id for color (e.g. pseudonym); defaults to letter. */
  seed?: string;
  isLive?: boolean;
  /** `compact` — small hero facepile (shorter than default row avatars). */
  /** `leaderboard` — dense rows in WeeklyLearningLeaderboard. */
  size?: 'default' | 'compact' | 'leaderboard';
  className?: string;
}) {
  const bgClass = pastelAvatarBg(seed ?? letter);
  const sizeClass =
    size === 'compact'
      ? 'h-6 w-6 min-h-6 min-w-6 cds-body-tertiary'
      : size === 'leaderboard'
        ? 'h-7 w-7 min-h-7 min-w-7 cds-body-secondary'
        : 'h-9 w-9 cds-action-secondary';

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full ${sizeClass} ${bgClass} text-[var(--cds-color-grey-975)] ${className}`}
    >
      <span className="leading-none">{letter}</span>
      {isLive && (
        <span
          className={`cds-live-pulse-dot absolute z-[1] rounded-full border-2 border-[var(--cds-color-white)] bg-[var(--cds-color-green-600)] ${
            size === 'leaderboard'
              ? '-bottom-px -right-px h-2 w-2'
              : '-bottom-0.5 -right-0.5 h-2.5 w-2.5'
          }`}
          aria-hidden
        />
      )}
    </div>
  );
}

function LeaderboardTabButton({
  tab,
  selected,
  onSelect,
}: {
  tab: (typeof LEADERBOARD_TABS)[number];
  selected: boolean;
  onSelect: (id: LeaderboardTabId) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`leaderboard-tab-${tab.id}`}
      aria-selected={selected}
      aria-controls={`leaderboard-panel-${tab.id}`}
      tabIndex={selected ? 0 : -1}
      className={`relative min-h-[48px] min-w-[44px] shrink-0 cursor-pointer border-0 bg-transparent px-0 pb-3 pt-3 text-left transition-colors cds-body-tertiary ${
        selected
          ? 'text-[var(--cds-color-grey-975)]'
          : 'text-[var(--cds-color-grey-600)] hover:text-[var(--cds-color-grey-900)]'
      } `}
      onClick={() => onSelect(tab.id)}
    >
      {tab.label}
      {selected ? (
        <span
          className="absolute bottom-0 left-0 right-0 h-1 rounded-t-[var(--cds-border-radius-50)] bg-[var(--cds-color-grey-975)]"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

function LeaderboardSectionDivider({ label }: { label: string }) {
  return (
    <div className="mb-2 flex min-h-[14px] items-center gap-2 sm:gap-3">
      <p className="cds-body-tertiary shrink-0 text-[var(--cds-color-grey-600)]">
        {label}
      </p>
      <div
        className="min-h-0 flex-1 border-t border-dashed border-[var(--cds-color-grey-200)]"
        role="separator"
        aria-hidden
      />
    </div>
  );
}

function TopThreeRows({ peerByRank }: { peerByRank: Record<number, PeerRow> }) {
  return (
    <>
      {([1, 2, 3] as const).map((rank) => {
        const row = peerByRank[rank];
        return (
          <div
            key={rank}
            className="flex h-[38px] min-h-[38px] items-center gap-2 border-b border-[var(--cds-color-grey-100)] last:border-b-0 sm:gap-3"
          >
            <div
              className="flex h-5 min-w-[20px] shrink-0 items-center justify-start"
              aria-label={`Rank ${rank}`}
            >
              <HonorMedalIcon rank={rank} dense />
            </div>
            <LetterAvatar
              letter={row.letter}
              seed={row.pseudonym}
              isLive={row.isLive}
              size="leaderboard"
            />
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
              <span className="cds-body-secondary min-w-0 truncate text-[var(--cds-color-grey-975)]">
                {row.pseudonym}
              </span>
              <span className="cds-body-secondary shrink-0 tabular-nums text-[var(--cds-color-grey-975)]">
                {row.hoursLabel}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}

function NeighborhoodRows({
  activeTab,
  userRank,
  neighborhoodRanks,
  peerByRank,
  learnerDisplayName,
  learnerLetter,
  learnerHours,
}: {
  activeTab: LeaderboardTabId;
  userRank: number;
  neighborhoodRanks: number[];
  peerByRank: Record<number, PeerRow>;
  learnerDisplayName: string;
  learnerLetter: string;
  learnerHours: string;
}) {
  return (
    <>
      {neighborhoodRanks.map((rank) => {
        const isLearner = rank === userRank;
        const peer = peerByRank[rank];
        if (!peer && !isLearner) return null;

        const displayName = isLearner ? learnerDisplayName : peer!.pseudonym;
        const letter = isLearner ? learnerLetter : peer!.letter;
        const hours = isLearner ? learnerHours : peer!.hoursLabel;
        const live = isLearner ? true : !!peer!.isLive;

        return (
          <div
            key={`${activeTab}-${userRank}-${rank}`}
            className={`flex h-[38px] min-h-[38px] items-center gap-1.5 ${
              isLearner
                ? 'rounded-none bg-[#FFF4E8] -mx-4 px-4'
                : ''
            }`}
          >
            <div
              className="flex h-5 min-w-[20px] shrink-0 items-center justify-start"
              aria-label={`Rank ${rank}`}
            >
              <span
                className={`tabular-nums text-left ${
                  isLearner
                    ? 'cds-action-secondary text-[var(--cds-color-blue-900)]'
                    : 'cds-body-secondary text-[var(--cds-color-grey-600)]'
                }`}
              >
                {rank}
              </span>
            </div>
            <LetterAvatar
              letter={letter}
              seed={displayName}
              isLive={live}
              size="leaderboard"
            />
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
              <span
                className={`min-w-0 truncate ${
                  isLearner
                    ? 'cds-action-secondary text-[var(--cds-color-grey-975)]'
                    : 'cds-body-secondary text-[var(--cds-color-grey-975)]'
                }`}
              >
                {displayName}
              </span>
              <span
                className={`shrink-0 tabular-nums text-[var(--cds-color-grey-975)] ${
                  isLearner ? 'cds-action-secondary' : 'cds-body-secondary'
                }`}
              >
                {hours}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}

export const WeeklyLearningLeaderboard: React.FC<
  WeeklyLearningLeaderboardProps
> = ({ learnerDisplayName = 'Priya', layout = 'stacked' }) => {
  const [activeTab, setActiveTab] = useState<LeaderboardTabId>('enrolled');

  const peerByRank = PEERS_BY_TAB[activeTab];

  const userRank = USER_RANK_BY_TAB[activeTab];

  /** One peer above and one below the learner (three rows total). */
  const neighborhoodRanks = [userRank - 1, userRank, userRank + 1];

  const learnerLetter = learnerDisplayName.charAt(0).toUpperCase() || 'P';
  const learnerHours =
    LEARNER_HOURS_BY_TAB[activeTab][userRank] ??
    peerByRank[userRank]?.hoursLabel ??
    '7.5h';

  const leaderboardDaysLeft = daysLeftUntilLeaderboardDue();
  const leaderboardDueAria = `Due March 29, 2026. ${leaderboardDaysLeft} day${leaderboardDaysLeft === 1 ? '' : 's'} left.`;

  return (
    <section
      className="mt-5 w-full max-w-[950px] rounded-[var(--cds-border-radius-200)] bg-[var(--cds-color-white)] p-3 shadow-[var(--cds-elevation-level1)] sm:p-4"
      aria-label="Leaderboard"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex flex-col gap-0.5">
          <h2
            id="leaderboard-heading"
            className="cds-action-secondary text-[var(--cds-color-grey-975)]"
          >
            Leaderboard
          </h2>
          <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">
            Based on learning time spent this week
          </p>
        </div>
        <div className="flex items-center gap-9">
          <div
            className="w-fit max-w-full border-b border-[var(--cds-color-grey-100)]"
            role="tablist"
            aria-labelledby="leaderboard-heading"
          >
            <div className="flex flex-wrap items-end gap-4">
              {LEADERBOARD_TABS.map((tab) => (
                <LeaderboardTabButton
                  key={tab.id}
                  tab={tab}
                  selected={activeTab === tab.id}
                  onSelect={setActiveTab}
                />
              ))}
            </div>
          </div>
          <div
            className="shrink-0"
            title={leaderboardDueAria}
            aria-label={leaderboardDueAria}
          >
            <DueCalendarChip daysLeft={leaderboardDaysLeft} />
          </div>
        </div>
      </div>

      <div
        key={activeTab}
        id={`leaderboard-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`leaderboard-tab-${activeTab}`}
      >
        {layout === 'split' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)] md:items-start md:gap-x-0 md:gap-y-0">
            <div className="min-w-0 md:pr-10">
              <LeaderboardSectionDivider label="Top 3" />
              <div className="space-y-0">
                <TopThreeRows peerByRank={peerByRank} />
              </div>
            </div>
            <div className="min-w-0 border-t border-[var(--cds-color-grey-200)] pt-4 md:border-t-0 md:border-l md:border-[var(--cds-color-grey-200)] md:pt-0 md:pl-8 md:pr-2">
              <div className="space-y-0">
                <LeaderboardSectionDivider label="Around you" />
                <NeighborhoodRows
                  activeTab={activeTab}
                  userRank={userRank}
                  neighborhoodRanks={neighborhoodRanks}
                  peerByRank={peerByRank}
                  learnerDisplayName={learnerDisplayName}
                  learnerLetter={learnerLetter}
                  learnerHours={learnerHours}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top 3 — medal icons; stacked layout has no “Top 3” divider (medals imply it). */}
            <div className="mb-3 space-y-0">
              <TopThreeRows peerByRank={peerByRank} />
            </div>
            <div className="space-y-0">
              <LeaderboardSectionDivider label="Around you" />
              <NeighborhoodRows
                activeTab={activeTab}
                userRank={userRank}
                neighborhoodRanks={neighborhoodRanks}
                peerByRank={peerByRank}
                learnerDisplayName={learnerDisplayName}
                learnerLetter={learnerLetter}
                learnerHours={learnerHours}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export interface LeaderboardWidgetProps {
  learnerDisplayName?: string;
  onNavigateToMyLearning?: () => void;
}

/**
 * Compact sidebar widget — shows the learner's rank, hours, days left,
 * and a 3-row "Around you" snapshot. Acts as an entry point to the full
 * leaderboard on My Learning.
 */
export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  learnerDisplayName = 'Priya',
  onNavigateToMyLearning,
}) => {
  const activeTab: LeaderboardTabId = 'workingparents';
  const peerByRank = PEERS_BY_TAB[activeTab];
  const userRank = USER_RANK_BY_TAB[activeTab];
  const learnerLetter = learnerDisplayName.charAt(0).toUpperCase() || 'P';
  const learnerHours =
    LEARNER_HOURS_BY_TAB[activeTab][userRank] ??
    peerByRank[userRank]?.hoursLabel ??
    '7.5h';
  const neighborhoodRanks = [userRank - 1, userRank, userRank + 1];
  const daysLeft = daysLeftUntilLeaderboardDue();

  const cohortLabel = LEADERBOARD_TABS.find((t) => t.id === activeTab)?.label ?? activeTab;

  return (
    <button
      type="button"
      className="w-full text-left bg-[var(--cds-color-white)] rounded-[var(--cds-border-radius-200)] p-4 cursor-pointer"
      aria-label="View full leaderboard on My Learning"
      onClick={onNavigateToMyLearning}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="cds-action-secondary text-[var(--cds-color-grey-975)]">
            Leaderboard
          </h3>
          <span className="cds-body-tertiary text-[var(--cds-color-grey-600)]">
            {cohortLabel}
          </span>
        </div>
        <span className="cds-body-tertiary text-[var(--cds-color-red-700)]">
          {daysLeft}d left
        </span>
      </div>

      {/* Around you — 3 rows */}
      <div className="space-y-1">
        <NeighborhoodRows
          activeTab={activeTab}
          userRank={userRank}
          neighborhoodRanks={neighborhoodRanks}
          peerByRank={peerByRank}
          learnerDisplayName={learnerDisplayName}
          learnerLetter={learnerLetter}
          learnerHours={learnerHours}
        />
      </div>
    </button>
  );
};

export const WeeklyLearningLeaderboardSkeleton: React.FC = () => (
  <div
    className="mt-5 w-full max-w-[950px] animate-pulse rounded-[var(--cds-border-radius-200)] bg-[var(--cds-color-white)] p-3 sm:p-4"
    aria-hidden
  >
    <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div className="h-5 w-28 shrink-0 rounded bg-[var(--cds-color-grey-100)]" />
      <div className="flex items-center gap-3">
        <div className="flex gap-4 pb-2">
          <div className="h-8 w-28 rounded bg-[var(--cds-color-grey-100)]" />
          <div className="flex gap-2">
            <div className="h-8 w-10 rounded bg-[var(--cds-color-grey-100)]" />
            <div className="h-8 w-24 rounded bg-[var(--cds-color-grey-100)]" />
          </div>
        </div>
        <div className="h-12 w-[72px] shrink-0 rounded bg-[var(--cds-color-grey-100)]" />
      </div>
    </div>
    <div className="mb-3 space-y-2">
      <div className="mb-2 h-4 w-16 rounded bg-[var(--cds-color-grey-100)]" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-9 rounded bg-[var(--cds-color-grey-100)]"
        />
      ))}
    </div>
    <div className="mb-2 flex min-h-[14px] items-center gap-3">
      <div className="h-4 w-24 shrink-0 rounded bg-[var(--cds-color-grey-100)]" />
      <div className="min-h-0 flex-1 border-t border-dashed border-[var(--cds-color-grey-200)]" />
    </div>
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-9 rounded bg-[var(--cds-color-grey-100)]"
        />
      ))}
    </div>
  </div>
);
