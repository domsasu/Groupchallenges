import type { ChallengeVisualTier } from './communityChallenges';

/** Public URLs for tier ring illustrations (placeholders until final art). */
export const CHALLENGE_TIER_ART_SRC: Record<ChallengeVisualTier, string> = {
  silver: '/challenges/tier-silver.svg',
  gold: '/challenges/tier-gold.svg',
  platinum: '/challenges/tier-platinum.svg',
  diamond: '/challenges/tier-diamond.svg',
};

export const CHALLENGE_TIER_DISPLAY_NAME: Record<ChallengeVisualTier, string> = {
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
};

/** Tailwind bg class for progress fill on strip cards (high contrast on dark track). */
export const CHALLENGE_TIER_PROGRESS_TONE: Record<ChallengeVisualTier, string> = {
  silver: 'bg-[#C0C0C0]',
  gold: 'bg-[#E5C158]',
  platinum: 'bg-[#A7D8F0]',
  diamond: 'bg-[#B9F2FF]',
};
