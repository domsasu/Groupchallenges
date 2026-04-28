import {
  PUBLISHED_ARTICLES_BY_COHORT,
  type PublishedArticleRecord,
} from './publishedArticles.generated';

/** Feed-only cohort model; presentation data for FeedPage (not tied to course XP). */

export type FeedCohortId =
  | 'enrolled'
  | 'ai'
  | 'workingparents'
  | 'design'
  | 'healthcare'
  | 'engineering'
  | 'business'
  | 'marketing'
  | 'finance'
  | 'education'
  | 'startups';

export interface FeedCohortMeta {
  id: FeedCohortId;
  label: string;
  pillLabel: string;
  memberCount: number;
  shortDescription: string;
  joinedByDefault: boolean;
  /** Small green tag next to member count: “New activity” / “New post”. */
  activityPill?: string;
}

export const FEED_COHORT_META: Record<FeedCohortId, FeedCohortMeta> = {
  workingparents: {
    id: 'workingparents',
    label: 'Working parents',
    pillLabel: '#workingparents',
    memberCount: 634,
    shortDescription:
      'Parents fitting coursework around nap time, daycare, and school pickups—small daily blocks add up.',
    joinedByDefault: true,
    activityPill: 'New activity',
  },
  enrolled: {
    id: 'enrolled',
    label: 'Coursera community',
    pillLabel: '#coursera',
    memberCount: 1255,
    shortDescription:
      'The broader Coursera learner community. Track how your cohort engages with courses over time.',
    joinedByDefault: true,
  },
  ai: {
    id: 'ai',
    label: 'AI & data',
    pillLabel: '#AIpowered',
    memberCount: 842,
    shortDescription:
      'Focused on AI, ML, and data. Stay motivated with learners on a similar path.',
    joinedByDefault: true,
    activityPill: 'New post',
  },
  design: {
    id: 'design',
    label: 'Design',
    pillLabel: '#design',
    memberCount: 128000,
    shortDescription:
      'Product design, UX research, and visual craft—snippets from top UX programs.',
    joinedByDefault: false,
    activityPill: 'New activity',
  },
  healthcare: {
    id: 'healthcare',
    label: 'Healthcare',
    pillLabel: 'Healthcare',
    memberCount: 89400,
    shortDescription:
      'Clinical data, public health, and healthcare analytics learning communities.',
    joinedByDefault: false,
  },
  engineering: {
    id: 'engineering',
    label: 'Engineering',
    pillLabel: 'Engineering',
    memberCount: 210000,
    shortDescription: 'Software, systems, and tech career learners pooling course clips.',
    joinedByDefault: false,
  },
  business: {
    id: 'business',
    label: 'Business',
    pillLabel: 'Business',
    memberCount: 156000,
    shortDescription: 'MBA skills, strategy, and operations—feed from related certificates.',
    joinedByDefault: false,
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing',
    pillLabel: 'Marketing',
    memberCount: 98500,
    shortDescription: 'Growth, brand, and digital marketing cohort content.',
    joinedByDefault: false,
  },
  finance: {
    id: 'finance',
    label: 'Finance',
    pillLabel: 'Finance',
    memberCount: 72300,
    shortDescription: 'Accounting, FP&A, and investing programs in one stream.',
    joinedByDefault: false,
    activityPill: 'New post',
  },
  education: {
    id: 'education',
    label: 'Education',
    pillLabel: 'Education',
    memberCount: 54200,
    shortDescription: 'Teaching, learning design, and EdTech specializations.',
    joinedByDefault: false,
  },
  startups: {
    id: 'startups',
    label: 'Startups',
    pillLabel: 'Startups',
    memberCount: 318000,
    shortDescription: 'Founders and early operators sharing startup-relevant courses.',
    joinedByDefault: false,
  },
};

/**
 * Top-level “Explore categories” from coursera.org/browse.
 * Independent from cohorts: cohorts curate feed content; disciplines are a separate career-area filter.
 */
export interface CourseraBrowseDiscipline {
  slug: string;
  label: string;
}

export const COURSERA_BROWSE_DISCIPLINES: CourseraBrowseDiscipline[] = [
  { slug: 'arts-and-humanities', label: 'Arts and Humanities' },
  { slug: 'business', label: 'Business' },
  { slug: 'computer-science', label: 'Computer Science' },
  { slug: 'data-science', label: 'Data Science' },
  { slug: 'health', label: 'Health' },
  { slug: 'information-technology', label: 'Information Technology' },
  { slug: 'language-learning', label: 'Language Learning' },
  { slug: 'math-and-logic', label: 'Math and Logic' },
  { slug: 'personal-development', label: 'Personal Development' },
  {
    slug: 'physical-science-and-engineering',
    label: 'Physical Science and Engineering',
  },
  { slug: 'social-sciences', label: 'Social Sciences' },
];

/** Initial top-bar discipline selection on Feed (multi-select; empty = “All”). */
export const DEFAULT_FEED_DISCIPLINE_SLUGS: readonly string[] = ['data-science'];

const KNOWN_DISCIPLINE_SLUGS = new Set(COURSERA_BROWSE_DISCIPLINES.map((d) => d.slug));

export function normalizeFeedDisciplineSlugs(slugs: readonly string[] | undefined): string[] {
  if (!slugs?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of slugs) {
    if (!KNOWN_DISCIPLINE_SLUGS.has(s) || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function courseraDisciplineLabelForSlug(slug: string): string | undefined {
  return COURSERA_BROWSE_DISCIPLINES.find((d) => d.slug === slug)?.label;
}

function disciplineLabelsJoined(slugs: string[]): string | undefined {
  if (slugs.length === 0) return undefined;
  const parts = slugs.map((s) => courseraDisciplineLabelForSlug(s)).filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

function disciplineCompositeKey(slugs: string[]): string | null {
  return slugs.length ? [...slugs].sort().join('\0') : null;
}

/** Cohorts shown as “yours” in the left rail (not in discipline pills). */
export const JOINED_FEED_COHORT_IDS: FeedCohortId[] = (
  Object.keys(FEED_COHORT_META) as FeedCohortId[]
).filter((id) => FEED_COHORT_META[id].joinedByDefault);

/** True when any joined cohort has a live activity signal (`activityPill` in meta, e.g. “New activity”). */
export function joinedFeedCohortsHaveNewActivity(): boolean {
  return JOINED_FEED_COHORT_IDS.some((id) => Boolean(FEED_COHORT_META[id].activityPill));
}

/** Generic / discover cohort pills (may overlap conceptually with joinable). */
export const DISCOVER_FEED_COHORT_IDS: FeedCohortId[] = (
  Object.keys(FEED_COHORT_META) as FeedCohortId[]
).filter((id) => !FEED_COHORT_META[id].joinedByDefault);

/** Right rail: cohorts the user can join (placeholders). */
export const JOINABLE_FEED_COHORT_IDS: FeedCohortId[] = [...DISCOVER_FEED_COHORT_IDS];

export type FeedPlaceholderMediaType = 'video' | 'article' | 'podcast';

export interface FeedPlaceholderItem {
  type: FeedPlaceholderMediaType;
  title: string;
  subtitle: string;
  meta: string;
  /** Coursera article URL when `type === 'article'` and sourced from published CSV. */
  articleUrl?: string;
  /** Anchor/RSS enclosure URL when `type === 'podcast'` (MP3/M4A). */
  podcastAudioUrl?: string;
  /** Unsplash (or other) thumbnail for video rows — filled client-side when API key is set. */
  thumbnailUrl?: string;
  /** E.g. "Photo by Name on Unsplash" — show near thumbnail per Unsplash guidelines. */
  thumbnailAttribution?: string;
  /** Photographer / photo page on Unsplash. */
  thumbnailAttributionUrl?: string;
}

const cohortFeedCopy: Record<FeedCohortId, { theme: string; courseHint: string }> = {
  workingparents: {
    theme: 'Parent learners',
    courseHint: 'Flexible certificate courses you can pace in short sessions',
  },
  enrolled: {
    theme: 'General learning',
    courseHint: 'Courses across Coursera',
  },
  ai: {
    theme: 'AI & machine learning',
    courseHint: 'ML / GenAI specializations',
  },
  design: {
    theme: 'UX & product design',
    courseHint: 'UX Design & Figma fundamentals',
  },
  healthcare: {
    theme: 'Healthcare analytics',
    courseHint: 'Healthcare data & public health programs',
  },
  engineering: {
    theme: 'Engineering & tech',
    courseHint: 'CS and software engineering programs',
  },
  business: {
    theme: 'Business fundamentals',
    courseHint: 'Business and strategy certificates',
  },
  marketing: {
    theme: 'Marketing & growth',
    courseHint: 'Digital marketing and brand courses',
  },
  finance: {
    theme: 'Finance & accounting',
    courseHint: 'Finance and accounting specializations',
  },
  education: {
    theme: 'Education & learning',
    courseHint: 'Teaching and instructional design programs',
  },
  startups: {
    theme: 'Startups & entrepreneurship',
    courseHint: 'Entrepreneurship and venture programs',
  },
};

function lensSuffix(disciplineLabel: string | undefined): string {
  return disciplineLabel
    ? ` Your cohort is highlighting ${disciplineLabel.toLowerCase()}—adjacent ideas from the broader catalog.`
    : '';
}

/**
 * Episodes from **The Coursera Podcast** (public Spotify / Apple Podcasts listings).
 * Episode titles match the show; blurbs are short demo copy for this placeholder feed.
 */
const COURSERA_PODCAST_SHOW = 'The Coursera Podcast';

const COURSERA_PODCAST_EPISODES: ReadonlyArray<{
  title: string;
  blurb: string;
  meta: string;
  /** RSS enclosure from https://anchor.fm/s/e96159c4/podcast/rss */
  audioUrl: string;
}> = [
  {
    title: 'Generative AI for Everyone with Andrew Ng',
    blurb: 'Andrew Ng on making generative AI approachable for learners and teams.',
    meta: 'Podcast · ~30 min',
    audioUrl:
      'https://anchor.fm/s/e96159c4/podcast/play/81027816/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2024-0-9%2F362776822-44100-2-6d0a6c03e31c5.m4a',
  },
  {
    title: 'Learning About Learning with Barbara Oakley',
    blurb: 'Barbara Oakley on how the brain learns—and practical study strategies.',
    meta: 'Podcast · ~28 min',
    audioUrl:
      'https://anchor.fm/s/e96159c4/podcast/play/77036348/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2023-9-10%2F350587218-44100-2-a9423f35c954a.m4a',
  },
  {
    title: 'Supporting Military Transitions with the USO',
    blurb: 'How partners help service members build skills for civilian careers.',
    meta: 'Podcast · ~35 min',
    audioUrl:
      'https://anchor.fm/s/e96159c4/podcast/play/114753323/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2026-0-29%2Fd942a9ec-f0fa-a90a-b1d2-75ecad8363c8.mp3',
  },
  {
    title: 'Building the Workforce of Tomorrow with AWS',
    blurb: 'Cloud skills, credentials, and training at scale for the labor market.',
    meta: 'Podcast · ~32 min',
    audioUrl:
      'https://anchor.fm/s/e96159c4/podcast/play/108394858/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-8-16%2F407603484-44100-2-860770ade8047.m4a',
  },
  {
    title: 'Navigating Disruption with Suraj Srinivasan',
    blurb: 'Strategy and leadership when industries and business models shift fast.',
    meta: 'Podcast · ~40 min',
    audioUrl:
      'https://anchor.fm/s/e96159c4/podcast/play/99013582/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-1-25%2Fff2d02b5-a1fa-9931-caac-f710a519dc4b.mp3',
  },
  {
    title: 'The Power of Prompt Engineering with Dr. Jules White',
    blurb: 'Prompt design as a skill—patterns, pitfalls, and what works in practice.',
    meta: 'Podcast · ~26 min',
    audioUrl:
      'https://anchor.fm/s/e96159c4/podcast/play/85551908/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2024-3-17%2F374657392-44100-2-0bc6050b96e2.m4a',
  },
  {
    title: 'Redefining Career Readiness with Texas A&M',
    blurb: 'Universities and employers aligning on what “career ready” means now.',
    meta: 'Podcast · ~33 min',
    audioUrl:
      'https://anchor.fm/s/e96159c4/podcast/play/111379434/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-10-18%2F412735608-44100-2-6557354f5e87.m4a',
  },
  {
    title: 'AI and Global Competitiveness with Ylli Bajraktari',
    blurb: 'Policy, talent, and national competitiveness in an AI-driven economy.',
    meta: 'Podcast · ~38 min',
    audioUrl:
      'https://anchor.fm/s/e96159c4/podcast/play/100372654/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-25%2F80bd76e8-5104-45ef-e6d2-7088ea541ebb.mp3',
  },
];

function podcastEpisodePairForCohort(
  cohortId: FeedCohortId
): [ (typeof COURSERA_PODCAST_EPISODES)[number], (typeof COURSERA_PODCAST_EPISODES)[number] ] {
  const n = COURSERA_PODCAST_EPISODES.length;
  let h = 2166136261;
  const seedStr = `coursera-podcast:${cohortId}`;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const start = (h >>> 0) % n;
  return [COURSERA_PODCAST_EPISODES[start]!, COURSERA_PODCAST_EPISODES[(start + 1) % n]!];
}

function podcastPlaceholderFromTemplateKey(
  key: 'p1' | 'p2',
  cohortId: FeedCohortId,
  lens: string,
  disciplineTag: string
): FeedPlaceholderItem {
  const [first, second] = podcastEpisodePairForCohort(cohortId);
  const e = key === 'p1' ? first : second;
  return {
    type: 'podcast',
    title: `${e.title}${disciplineTag}`,
    subtitle: `${e.blurb} — ${COURSERA_PODCAST_SHOW}.${lens}`,
    meta: e.meta,
    podcastAudioUrl: e.audioUrl,
  };
}

/** Substrings matched against category | subcategory | epic | title for browse-discipline lens. */
const DISCIPLINE_ARTICLE_KEYWORDS: Record<string, readonly string[]> = {
  'arts-and-humanities': ['humanities', 'liberal arts', 'history', 'philosophy', 'fine arts', 'literature', 'language arts'],
  business: ['business', 'mba', 'leadership', 'management', 'marketing', 'finance', 'accounting', 'entrepreneur'],
  'computer-science': ['computer science', 'software', 'programming', 'developer', 'engineering', 'algorithm'],
  'data-science': ['data science', 'machine learning', 'analytics', 'statistics', 'data analyst', 'big data'],
  health: ['health', 'clinical', 'public health', 'nursing', 'medicine', 'healthcare', 'patient'],
  'information-technology': ['it support', 'certification', 'network', 'cybersecurity', 'system admin', 'cloud', 'devops'],
  'language-learning': ['language', 'spanish', 'french', 'english', 'bilingual', 'esl'],
  'math-and-logic': ['math', 'calculus', 'algebra', 'logic', 'statistics'],
  'personal-development': ['career', 'soft skills', 'motivation', 'productivity', 'well-being', 'mindset'],
  'physical-science-and-engineering': ['physics', 'chemistry', 'engineering degree', 'mechanical', 'electrical'],
  'social-sciences': ['psychology', 'sociology', 'economics', 'political', 'anthropology'],
};

function publishedArticleHaystack(r: PublishedArticleRecord): string {
  return `${r.category}|${r.subcategory}|${r.epic}|${r.title}`.toLowerCase();
}

function articleMatchesDisciplineSlug(slug: string, r: PublishedArticleRecord): boolean {
  const kws = DISCIPLINE_ARTICLE_KEYWORDS[slug];
  if (!kws?.length) return true;
  const h = publishedArticleHaystack(r);
  return kws.some((kw) => h.includes(kw));
}

function articleMatchesAnyDisciplineSlug(slugs: string[], r: PublishedArticleRecord): boolean {
  return slugs.some((slug) => articleMatchesDisciplineSlug(slug, r));
}

function articlePoolForCohort(
  cohortId: FeedCohortId,
  disciplineSlugs: string[]
): PublishedArticleRecord[] {
  const pool = PUBLISHED_ARTICLES_BY_COHORT[cohortId];
  if (disciplineSlugs.length === 0 || pool.length === 0) return pool;
  const filtered = pool.filter((r) => articleMatchesAnyDisciplineSlug(disciplineSlugs, r));
  return filtered.length > 0 ? filtered : pool;
}

function articlePairForCohort(
  cohortId: FeedCohortId,
  disciplineSlugs: string[],
  seedKey: string
): [PublishedArticleRecord, PublishedArticleRecord] {
  const pool = articlePoolForCohort(cohortId, disciplineSlugs);
  const n = pool.length;
  const fallback: PublishedArticleRecord = {
    title: 'Coursera articles',
    url: 'https://www.coursera.org/articles',
    category: 'Learning',
    subcategory: '',
    epic: '',
    persona: '',
    articleType: '',
    writer: '',
  };
  if (n === 0) return [fallback, fallback];

  let h = 2166136261;
  const seedStr = `coursera-article:${cohortId}:${seedKey}`;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const start = (h >>> 0) % n;
  let secondIdx = (h >>> 16) % n;
  if (secondIdx === start) secondIdx = (start + 1) % n;
  // n === 1: secondIdx === start is acceptable (duplicate article)
  return [pool[start]!, pool[secondIdx]!];
}

function articleMetaFromType(articleType: string): string {
  const t = articleType.trim().toLowerCase();
  if (t.includes('long explainer')) return 'Article · 8 min read';
  if (t.includes('degree overview')) return 'Article · 6 min read';
  if (t === 'skills') return 'Article · 4 min read';
  if (t.includes('career options') || t.includes('career path')) return 'Article · 5 min read';
  if (t.includes('comparison')) return 'Article · 7 min read';
  if (t.includes('interview')) return 'Article · 6 min read';
  if (t.includes('how to')) return 'Article · 5 min read';
  if (t.includes('salary')) return 'Article · 6 min read';
  if (t.includes('certification')) return 'Article · 5 min read';
  if (t.includes('resume')) return 'Article · 4 min read';
  return 'Article · Coursera';
}

function articlePlaceholderFromTemplateKey(
  key: 'a1' | 'a2',
  cohortId: FeedCohortId,
  disciplineSlugs: string[],
  seedKey: string,
  lens: string,
  disciplineTag: string
): FeedPlaceholderItem {
  const [first, second] = articlePairForCohort(cohortId, disciplineSlugs, seedKey);
  const r = key === 'a1' ? first : second;
  const byline = r.writer ? ` · ${r.writer}` : '';
  return {
    type: 'article',
    title: `${r.title}${disciplineTag}`,
    subtitle: `Coursera article · ${r.category}${byline}.${lens}`,
    meta: articleMetaFromType(r.articleType),
    articleUrl: r.url,
  };
}

/** Six placeholder slots (two of each media type); order is shuffled per cohort below. */
type FeedMediaTemplateKey = 'v1' | 'v2' | 'a1' | 'a2' | 'p1' | 'p2';

function itemFromTemplate(
  key: FeedMediaTemplateKey,
  cohortId: FeedCohortId,
  theme: string,
  courseHint: string,
  lens: string,
  disciplineTag: string,
  disciplineSlugs: string[],
  articleSeedKey: string
): FeedPlaceholderItem {
  switch (key) {
    case 'v1':
      return {
        type: 'video',
        title: `Course clip · ${theme}${disciplineTag}`,
        subtitle: `Pooled from ${courseHint}—placeholder lesson highlight.${lens}`,
        meta: 'Video · 4:12',
      };
    case 'v2':
      return {
        type: 'video',
        title: `Instructor tip · ${theme}${disciplineTag}`,
        subtitle: `Short placeholder walkthrough tied to courses learners in this cohort take.${lens}`,
        meta: 'Video · 2:05',
      };
    case 'a1':
      return articlePlaceholderFromTemplateKey('a1', cohortId, disciplineSlugs, articleSeedKey, lens, disciplineTag);
    case 'a2':
      return articlePlaceholderFromTemplateKey('a2', cohortId, disciplineSlugs, articleSeedKey, lens, disciplineTag);
    case 'p1':
      return podcastPlaceholderFromTemplateKey('p1', cohortId, lens, disciplineTag);
    case 'p2':
      return podcastPlaceholderFromTemplateKey('p2', cohortId, lens, disciplineTag);
  }
}

/** Per-cohort media order so each cohort feels like a distinct feed (same six templates, different rhythm). */
const FEED_MEDIA_ORDER_BY_COHORT: Record<FeedCohortId, FeedMediaTemplateKey[]> = {
  workingparents: ['a1', 'v1', 'p1', 'a2', 'v2', 'p2'],
  enrolled: ['a1', 'v2', 'p1', 'p2', 'v1', 'a2'],
  ai: ['v1', 'p2', 'a1', 'v2', 'p1', 'a2'],
  design: ['a2', 'p1', 'v1', 'a1', 'p2', 'v2'],
  healthcare: ['v2', 'a1', 'p1', 'v1', 'a2', 'p2'],
  engineering: ['p2', 'v1', 'a2', 'p1', 'v2', 'a1'],
  business: ['v2', 'a2', 'p2', 'v1', 'a1', 'p1'],
  marketing: ['a1', 'p2', 'v2', 'p1', 'a2', 'v1'],
  finance: ['p1', 'a2', 'v1', 'p2', 'a1', 'v2'],
  education: ['v1', 'a1', 'p1', 'v2', 'a2', 'p2'],
  startups: ['a2', 'v2', 'p1', 'a1', 'v1', 'p2'],
};

function stableDisciplineShuffleSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — deterministic PRNG for reproducible order per slug. */
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleTemplateKeysWithSeed(keys: FeedMediaTemplateKey[], seed: number): FeedMediaTemplateKey[] {
  const copy = [...keys];
  const rand = mulberry32(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Base cohort rhythm when no browse tag is selected; otherwise a distinct video/article/podcast order per tag set. */
function feedTemplateKeysForCohort(
  cohortId: FeedCohortId,
  disciplineComposite: string | null
): FeedMediaTemplateKey[] {
  const base = FEED_MEDIA_ORDER_BY_COHORT[cohortId];
  if (!disciplineComposite) return base;
  const seed = stableDisciplineShuffleSeed(`${cohortId}\0${disciplineComposite}`);
  return shuffleTemplateKeysWithSeed(base, seed);
}

function itemsForCohort(
  id: FeedCohortId,
  disciplineSlugs: string[]
): FeedPlaceholderItem[] {
  const { theme, courseHint } = cohortFeedCopy[id];
  const disciplineLabel = disciplineLabelsJoined(disciplineSlugs);
  const composite = disciplineCompositeKey(disciplineSlugs);
  const lens = lensSuffix(disciplineLabel);
  const disciplineTag = disciplineLabel ? ` · ${disciplineLabel}` : '';
  const order = feedTemplateKeysForCohort(id, composite);
  const articleSeedKey = composite ?? 'all';
  return order.map((key) =>
    itemFromTemplate(key, id, theme, courseHint, lens, disciplineTag, disciplineSlugs, articleSeedKey)
  );
}

export interface GetFeedPlaceholderItemsOptions {
  /**
   * Coursera browse discipline slugs (multi-select).
   * Empty or omitted = no discipline filter (same as “All”).
   */
  disciplineSlugs?: string[];
}

export function getFeedPlaceholderItems(
  cohortId: FeedCohortId,
  options?: GetFeedPlaceholderItemsOptions
): FeedPlaceholderItem[] {
  const slugs = normalizeFeedDisciplineSlugs(options?.disciplineSlugs);
  return itemsForCohort(cohortId, slugs);
}

/** Interleaved items from each cohort for the Snacks “all” stream (one card per cohort per round). */
export function getAllStreamFeedPlaceholderItems(
  cohortIds: FeedCohortId[],
  options?: GetFeedPlaceholderItemsOptions
): FeedPlaceholderItem[] {
  if (cohortIds.length === 0) return [];
  const perCohort = cohortIds.map((id) => getFeedPlaceholderItems(id, options));
  const maxLen = Math.max(...perCohort.map((c) => c.length), 0);
  const out: FeedPlaceholderItem[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (let j = 0; j < perCohort.length; j++) {
      const row = perCohort[j];
      const item = row[i];
      if (item) out.push(item);
    }
  }
  const firstPodcastIdx = out.findIndex((item) => item.type === 'podcast');
  if (firstPodcastIdx > 0) {
    const [podcastLead] = out.splice(firstPodcastIdx, 1);
    out.unshift(podcastLead);
  }
  return out;
}
