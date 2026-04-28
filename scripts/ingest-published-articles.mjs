/**
 * Reads data/published-articles.csv and writes constants/publishedArticles.generated.ts
 * Run: npm run ingest:articles
 */
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'data/published-articles.csv');
const outPath = path.join(root, 'constants/publishedArticles.generated.ts');

const COHORT_IDS = [
  'enrolled',
  'ai',
  'workingparents',
  'design',
  'healthcare',
  'engineering',
  'business',
  'marketing',
  'finance',
  'education',
  'startups',
];

const MAX_PER_COHORT = 200;

/** @param {Record<string,string>} row */
function normalizeRow(row) {
  return {
    title: (row['Title'] ?? '').trim(),
    url: (row['URL'] ?? '').trim(),
    category: (row['Category'] ?? '').trim(),
    subcategory: (row['Subcategory'] ?? '').trim(),
    epic: (row['Epic'] ?? '').trim(),
    persona: (row['Persona'] ?? '').trim(),
    articleType: (row['Article type'] ?? '').trim(),
    writer: (row['Original writer/translator'] ?? '').trim(),
    status: (row['Article status'] ?? '').trim(),
    country: (row['Target country'] ?? '').trim(),
  };
}

/** @param {ReturnType<normalizeRow>} r */
function haystack(r) {
  return `${r.category}|${r.subcategory}|${r.epic}|${r.persona}|${r.title}`.toLowerCase();
}

/**
 * Multi-label cohort classification (keywords on Category / Subcategory / Epic / Persona / Title).
 * @param {ReturnType<normalizeRow>} r
 * @returns {Set<string>}
 */
function cohortsForRow(r) {
  const h = haystack(r);
  const cat = r.category.toLowerCase();
  const sub = r.subcategory.toLowerCase();
  const epic = r.epic.toLowerCase();
  const persona = r.persona.toLowerCase();

  const set = new Set();

  if (epic.includes('switching careers') || (cat.includes('career') && persona.includes('switcher'))) {
    set.add('workingparents');
  }

  if (
    h.includes('entrepreneurship') ||
    h.includes('startup') ||
    /\bventure\b/.test(h) ||
    epic.includes('career coach') ||
    (cat === 'business' && (h.includes('founder') || h.includes('entrepreneur')))
  ) {
    set.add('startups');
  }

  if (
    sub.includes('marketing') ||
    cat.includes('marketing') ||
    epic.includes('digital marketer') ||
    (epic.includes('brand') && cat === 'business')
  ) {
    set.add('marketing');
  }

  if (
    sub.includes('finance') ||
    epic.includes('finance') ||
    sub.includes('accounting') ||
    epic.includes('accounting') ||
    epic.includes('accountant') ||
    h.includes('fp&a')
  ) {
    set.add('finance');
  }

  if (
    h.includes('data science') ||
    h.includes('machine learning') ||
    h.includes('generative ai') ||
    h.includes('deep learning') ||
    h.includes('artificial intelligence') ||
    h.includes('neural network') ||
    epic.includes('data scientist') ||
    sub.includes('data science')
  ) {
    set.add('ai');
  }

  if (
    epic.includes('ux designer') ||
    epic.includes('graphic designer') ||
    sub.includes('design and product') ||
    sub.includes('ux') ||
    h.includes('user experience') ||
    h.includes('usability') ||
    h.includes('figma') ||
    h.includes('sketch vs') ||
    epic.includes('ui designer')
  ) {
    set.add('design');
  }

  if (
    cat === 'health' ||
    sub.includes('public health') ||
    sub.includes('health care') ||
    epic.includes('community health') ||
    epic.includes('clinical') ||
    epic.includes('nursing') ||
    h.includes('healthcare') ||
    h.includes('mha ') ||
    h.includes('health administration')
  ) {
    set.add('healthcare');
  }

  if (
    cat === 'it' ||
    sub.includes('it support') ||
    sub.includes('networks and security') ||
    epic.includes('it support') ||
    epic.includes('software eng') ||
    h.includes('system administrator') ||
    h.includes('cybersecurity') ||
    h.includes('cloud computing') ||
    h.includes('devops') ||
    cat.includes('computer science') ||
    sub.includes('computer science')
  ) {
    set.add('engineering');
  }

  const title = r.title.toLowerCase();
  if (
    sub.includes('teaching') ||
    sub.includes('education') ||
    epic.includes('teacher') ||
    epic.includes('education') ||
    h.includes('instructional design') ||
    h.includes("master's in education") ||
    h.includes('masters in education') ||
    epic.includes('professor') ||
    (cat.includes('degree') && /\b(education|teaching|curriculum|pedagogy|edtech)\b/.test(title))
  ) {
    set.add('education');
  }

  if (
    cat === 'business' ||
    sub.includes('leadership and management') ||
    epic.includes('project manager') ||
    /\bmba\b/.test(h)
  ) {
    set.add('business');
  }

  if (set.size === 0) {
    set.add('enrolled');
  }

  return set;
}

/** @param {ReturnType<normalizeRow>} r */
function recordForOutput(r) {
  return {
    title: r.title,
    url: r.url,
    category: r.category,
    subcategory: r.subcategory,
    epic: r.epic,
    persona: r.persona,
    articleType: r.articleType,
    writer: r.writer,
  };
}

function main() {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true,
  });

  /** @type {Map<string, Map<string, ReturnType<recordForOutput>>>} */
  const byCohort = new Map();
  for (const id of COHORT_IDS) {
    byCohort.set(id, new Map());
  }

  for (const row of rows) {
    const r = normalizeRow(row);
    if (r.status !== 'Published') continue;
    if (r.country !== 'US') continue;
    if (!r.title || !r.url) continue;

    const cohorts = cohortsForRow(r);
    const rec = recordForOutput(r);
    for (const c of cohorts) {
      const m = byCohort.get(c);
      if (!m.has(r.url)) m.set(r.url, rec);
    }
  }

  /** @type {Record<string, ReturnType<recordForOutput>[]>} */
  const out = {};
  for (const id of COHORT_IDS) {
    const arr = [...byCohort.get(id).values()].slice(0, MAX_PER_COHORT);
    out[id] = arr;
  }

  const header = `/* eslint-disable */
// Generated by scripts/ingest-published-articles.mjs — run: npm run ingest:articles

export interface PublishedArticleRecord {
  title: string;
  url: string;
  category: string;
  subcategory: string;
  epic: string;
  persona: string;
  articleType: string;
  writer: string;
}

export type PublishedArticleCohortId =
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

export const PUBLISHED_ARTICLES_BY_COHORT: Record<
  PublishedArticleCohortId,
  PublishedArticleRecord[]
> = `;

  fs.writeFileSync(outPath, `${header}${JSON.stringify(out, null, 2)};\n`, 'utf8');
  console.log(`Wrote ${outPath} (${rows.length} CSV rows processed)`);
  for (const id of COHORT_IDS) {
    console.log(`  ${id}: ${out[id].length} articles`);
  }
}

main();
