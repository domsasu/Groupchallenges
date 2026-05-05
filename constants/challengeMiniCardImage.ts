import type { CommunityChallenge } from './communityChallenges';
import type { FeedCohortId } from './feedCohorts';

/**
 * Unsplash thumbnails for mini-cards (75×75 CSS; request ~150px for sharpness).
 * Per-challenge picks keep mocks visually distinct; cohort fallbacks cover future rows.
 */
const UNSPLASH_PARAMS = 'w=150&h=150&fit=crop&auto=format&q=80';

function u(src: string): string {
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}${UNSPLASH_PARAMS}`;
}

/** Curated per mock challenge id — themes match cohort + challenge topic */
const MINI_CARD_IMAGE_BY_CHALLENGE_ID: Record<string, string> = {
  'ch-active-workingparents-nap-module': u(
    'https://images.unsplash.com/photo-1544776193-352d25ca82cd'
  ),
  'ch-active-ai-vibe-coding': u('https://images.unsplash.com/photo-1677442136019-21780ecad995'),
  'ch-upcoming-enrolled-streak': u('https://images.unsplash.com/photo-1434030216411-0b793f4b4173'),
  'ch-upcoming-ai-gab-lab-500': u('https://images.unsplash.com/photo-1620712943543-bcc4688e7485'),
  'ch-completed-enrolled-relay': u('https://images.unsplash.com/photo-1535378917042-10a22c31d466'),
  'ch-upcoming-design-systems-breadth': u('https://images.unsplash.com/photo-1586717791821-3f44a563fa4c'),
  'ch-upcoming-startups-capstone-collective': u(
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c'
  ),
  'ch-upcoming-engineering-quiz-mastery': u('https://images.unsplash.com/photo-1581092160562-40aa08e78837'),
  'ch-completed-marketing-breadth': u('https://images.unsplash.com/photo-1552664730-d307ca884978'),
};

const MINI_CARD_IMAGE_BY_COHORT: Record<FeedCohortId, string> = {
  workingparents: u('https://images.unsplash.com/photo-1511895426328-dc8714191300'),
  enrolled: u('https://images.unsplash.com/photo-1523240795612-9a054b0db644'),
  ai: u('https://images.unsplash.com/photo-1677442136019-21780ecad995'),
  design: u('https://images.unsplash.com/photo-1561070791-2526d30994b5'),
  healthcare: u('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d'),
  engineering: u('https://images.unsplash.com/photo-1581092160562-40aa08e78837'),
  business: u('https://images.unsplash.com/photo-1556761175-5973dc0f32e7'),
  marketing: u('https://images.unsplash.com/photo-1552664730-d307ca884978'),
  finance: u('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3'),
  education: u('https://images.unsplash.com/photo-1503676260728-1c00da094a0b'),
  startups: u('https://images.unsplash.com/photo-1522071820081-009f0129c71c'),
};

/**
 * Remote hero art (if ever used) wins; else challenge-specific Unsplash; else cohort theme.
 */
export function resolveChallengeMiniCardImageSrc(challenge: CommunityChallenge): string {
  const hero = challenge.cardHeroImageSrc;
  if (hero?.startsWith('http')) {
    return u(hero.split('?')[0]!);
  }
  const byId = MINI_CARD_IMAGE_BY_CHALLENGE_ID[challenge.id];
  if (byId) return byId;
  return MINI_CARD_IMAGE_BY_COHORT[challenge.cohortId] ?? MINI_CARD_IMAGE_BY_COHORT.enrolled;
}
