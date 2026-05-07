import React from 'react';
import { createPortal } from 'react-dom';
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
  onShareChallenge?: () => void;
  onOpenShareout?: () => void;
}

/** Inline stacking so overlay works even if Tailwind arbitrary z-index utilities fail to load. */
const MODAL_OVERLAY_Z = 2147483000;

type BoundaryState = { error: Error | null };

class ChallengeDetailErrorBoundary extends React.Component<
  React.PropsWithChildren<{ challengeId: string }>,
  BoundaryState
> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: { challengeId: string }) {
    if (prevProps.challengeId !== this.props.challengeId && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="px-4 py-6 sm:px-6">
          <p className="text-base font-semibold text-[var(--cds-color-grey-975)]">
            This challenge couldn’t be displayed.
          </p>
          <p className="mt-2 text-sm text-[var(--cds-color-grey-700)]">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Full-screen challenge detail with an app-style back affordance (join flow may stack above at higher z-index).
 * Portaled to `document.body` so `fixed` sizing isn’t tied to nested overflow/transform ancestors.
 */
export const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  challenge,
  optedIn,
  userInCohort,
  onClose,
  onToggleOptIn,
  onRequestJoinChallenge,
  onResumeLearning,
  onShareChallenge,
  onOpenShareout,
}) => {
  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-detail-modal-title"
      className="fixed inset-0 flex min-w-0 w-full min-h-0 flex-col bg-[var(--cds-color-grey-25)]"
      style={{ zIndex: MODAL_OVERLAY_Z, minHeight: '100dvh', height: '100dvh' }}
    >
      <header
        className="sticky top-0 flex shrink-0 items-center gap-3 border-b border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-3 pl-[max(0.75rem,env(safe-area-inset-left))]"
        style={{ zIndex: MODAL_OVERLAY_Z + 1 }}
      >
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
        <ChallengeDetailErrorBoundary challengeId={challenge.id}>
          <ChallengeFullDetail
            challenge={challenge}
            optedIn={optedIn}
            userInCohort={userInCohort}
            onToggleOptIn={onToggleOptIn}
            onRequestJoinChallenge={onRequestJoinChallenge}
            onResumeLearning={onResumeLearning}
            onShareChallenge={onShareChallenge}
            onOpenShareout={onOpenShareout}
            onBack={onClose}
          />
        </ChallengeDetailErrorBoundary>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
};
