import React from 'react';
import type { CommunityChallenge } from '../../constants/communityChallenges';
import { ChallengeFullDetail } from './ChallengeFullDetail';

export interface ChallengeDetailModalProps {
  challenge: CommunityChallenge;
  optedIn: boolean;
  userInCohort: boolean;
  onClose: () => void;
  onToggleOptIn: () => void;
  onRequestJoinChallenge: () => void;
  onResumeLearning?: () => void;
  onOpenShareout?: () => void;
}

/**
 * Full-screen challenge detail with an app-style back affordance (join flow may stack above at higher z-index).
 */
export const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  challenge,
  optedIn,
  userInCohort,
  onClose,
  onToggleOptIn,
  onRequestJoinChallenge,
  onResumeLearning,
  onOpenShareout,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-detail-modal-title"
      className="fixed inset-0 z-[100] flex flex-col bg-[var(--cds-color-grey-25)]"
    >
      <header className="sticky top-0 z-[110] flex shrink-0 items-center gap-3 border-b border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-3 pl-[max(0.75rem,env(safe-area-inset-left))]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--cds-color-grey-800)] transition hover:bg-[var(--cds-color-grey-200)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cds-color-blue-700)]"
          aria-label="Back"
        >
          <span className="material-symbols-rounded text-[24px]" aria-hidden>
            arrow_back
          </span>
        </button>
        <h2
          id="challenge-detail-modal-title"
          className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-[var(--cds-color-grey-975)]"
        >
          {challenge.name}
        </h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[max(0.75rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
        <ChallengeFullDetail
          challenge={challenge}
          optedIn={optedIn}
          userInCohort={userInCohort}
          onToggleOptIn={onToggleOptIn}
          onRequestJoinChallenge={onRequestJoinChallenge}
          onResumeLearning={onResumeLearning}
          onOpenShareout={onOpenShareout}
          onBack={onClose}
        />
      </div>
    </div>
  );
};
