import type { FeedCohortId } from './feedCohorts';

/**
 * Unsplash search terms per cohort for rail avatars (squarish photos; stable page offset varies results).
 */
export const COHORT_AVATAR_UNSPLASH_QUERY: Record<FeedCohortId, string> = {
  workingparents: 'parent studying at home evening learning laptop',
  enrolled: 'diverse students online learning community',
  ai: 'artificial intelligence technology abstract',
  design: 'UX product design creative workspace',
  healthcare: 'healthcare medical innovation',
  engineering: 'software developer technology workspace',
  business: 'business leadership strategy meeting',
  marketing: 'digital marketing creative campaign',
  finance: 'finance analytics corporate',
  education: 'teaching education classroom technology',
  startups: 'startup entrepreneur innovation workspace',
};
