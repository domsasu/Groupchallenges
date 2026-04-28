import type { CommunityChallenge } from './communityChallenges';

/** 1-based group index → colored squad name (prototype squads). */
export function groupSquadForIndex(g: number): {
  label: string;
  muted: string;
  active: string;
} {
  const squads: Record<number, { label: string; muted: string; active: string }> = {
    1: {
      label: 'Red Apes',
      muted: 'border-red-200 bg-red-50 text-red-950',
      active: 'border-red-500 bg-red-100 text-red-950 shadow-sm ring-2 ring-red-400/40',
    },
    2: {
      label: 'Blue Herons',
      muted: 'border-sky-200 bg-sky-50 text-sky-950',
      active: 'border-sky-500 bg-sky-100 text-sky-950 shadow-sm ring-2 ring-sky-400/40',
    },
    3: {
      label: 'Amber Foxes',
      muted: 'border-amber-200 bg-amber-50 text-amber-950',
      active: 'border-amber-500 bg-amber-100 text-amber-950 shadow-sm ring-2 ring-amber-400/40',
    },
    4: {
      label: 'Emerald Otters',
      muted: 'border-emerald-200 bg-emerald-50 text-emerald-950',
      active: 'border-emerald-500 bg-emerald-100 text-emerald-950 shadow-sm ring-2 ring-emerald-400/40',
    },
    5: {
      label: 'Violet Pandas',
      muted: 'border-violet-200 bg-violet-50 text-violet-950',
      active: 'border-violet-500 bg-violet-100 text-violet-950 shadow-sm ring-2 ring-violet-400/40',
    },
    6: {
      label: 'Copper Monsteras',
      muted: 'border-rose-300 bg-rose-50 text-rose-950',
      active: 'border-rose-500 bg-rose-100 text-rose-950 shadow-sm ring-2 ring-rose-400/40',
    },
  };
  return (
    squads[g] ?? {
      label: `Group ${g}`,
      muted:
        'border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] text-[var(--cds-color-grey-800)]',
      active:
        'border-[var(--cds-color-blue-500)] bg-[var(--cds-color-blue-25)] text-[var(--cds-color-grey-975)] shadow-sm ring-2 ring-[var(--cds-color-blue-400)]/35',
    }
  );
}

const AI_COLOR_WORDS = [
  'Crimson',
  'Azure',
  'Violet',
  'Emerald',
  'Gold',
  'Rose',
  'Cobalt',
  'Amber',
  'Jade',
  'Sapphire',
] as const;

const AI_PLANET_WORDS = [
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
  'Europa',
  'Titan',
] as const;

function stableHash(parts: string[]): number {
  let h = 0;
  const s = parts.join('\0');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function aiColorPlanetLabel(challengeId: string, groupNumber: number): string {
  const h = stableHash([challengeId, String(groupNumber), 'ai-squad-label']);
  const c = AI_COLOR_WORDS[h % AI_COLOR_WORDS.length];
  const p = AI_PLANET_WORDS[(h >> 7) % AI_PLANET_WORDS.length];
  return `${c} ${p}`;
}

/**
 * “It’s a Vibe” — fixed squad names + pill colors that match the leading color word.
 * (Group progress toward 100h is driven separately in `communityChallenges`.)
 */
const VIBE_CHALLENGE_FIXED_SQUADS: Record<
  number,
  { label: string; muted: string; active: string }
> = {
  1: {
    label: 'Gold Saturn',
    muted: 'border-amber-300 bg-amber-50 text-amber-950',
    active: 'border-amber-500 bg-amber-100 text-amber-950 shadow-sm ring-2 ring-amber-400/40',
  },
  2: {
    label: 'Jade Mercury',
    muted: 'border-teal-300 bg-teal-50 text-teal-950',
    active: 'border-teal-500 bg-teal-100 text-teal-950 shadow-sm ring-2 ring-teal-400/40',
  },
  3: {
    label: 'Rose Europa',
    muted: 'border-rose-300 bg-rose-50 text-rose-950',
    active: 'border-rose-500 bg-rose-100 text-rose-950 shadow-sm ring-2 ring-rose-400/40',
  },
  4: {
    label: 'Azure Mars',
    muted: 'border-sky-300 bg-sky-50 text-sky-950',
    active: 'border-sky-500 bg-sky-100 text-sky-950 shadow-sm ring-2 ring-sky-400/40',
  },
};

/** Pill styles keyed by the first word of `aiColorPlanetLabel` — matches name, not a separate hash. */
const AI_COLOR_WORD_THEMES: Record<string, { muted: string; active: string }> = {
  Crimson: {
    muted: 'border-red-200 bg-red-50 text-red-950',
    active: 'border-red-500 bg-red-100 text-red-950 shadow-sm ring-2 ring-red-400/40',
  },
  Azure: {
    muted: 'border-sky-200 bg-sky-50 text-sky-950',
    active: 'border-sky-500 bg-sky-100 text-sky-950 shadow-sm ring-2 ring-sky-400/40',
  },
  Violet: {
    muted: 'border-violet-200 bg-violet-50 text-violet-950',
    active: 'border-violet-500 bg-violet-100 text-violet-950 shadow-sm ring-2 ring-violet-400/40',
  },
  Emerald: {
    muted: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    active: 'border-emerald-500 bg-emerald-100 text-emerald-950 shadow-sm ring-2 ring-emerald-400/40',
  },
  Gold: {
    muted: 'border-amber-300 bg-amber-50 text-amber-950',
    active: 'border-amber-500 bg-amber-100 text-amber-950 shadow-sm ring-2 ring-amber-400/40',
  },
  Rose: {
    muted: 'border-rose-300 bg-rose-50 text-rose-950',
    active: 'border-rose-500 bg-rose-100 text-rose-950 shadow-sm ring-2 ring-rose-400/40',
  },
  Cobalt: {
    muted: 'border-blue-200 bg-blue-50 text-blue-950',
    active: 'border-blue-600 bg-blue-100 text-blue-950 shadow-sm ring-2 ring-blue-400/40',
  },
  Amber: {
    muted: 'border-amber-200 bg-amber-50 text-amber-950',
    active: 'border-amber-500 bg-amber-100 text-amber-950 shadow-sm ring-2 ring-amber-400/40',
  },
  Jade: {
    muted: 'border-teal-200 bg-teal-50 text-teal-950',
    active: 'border-teal-500 bg-teal-100 text-teal-950 shadow-sm ring-2 ring-teal-400/40',
  },
  Sapphire: {
    muted: 'border-indigo-200 bg-indigo-50 text-indigo-950',
    active: 'border-indigo-500 bg-indigo-100 text-indigo-950 shadow-sm ring-2 ring-indigo-400/40',
  },
};

/** Fallback when label shape changes — keep rotation as last resort. */
const AI_THEME_ROTATION: { muted: string; active: string }[] = [
  AI_COLOR_WORD_THEMES.Crimson,
  AI_COLOR_WORD_THEMES.Azure,
  AI_COLOR_WORD_THEMES.Gold,
  AI_COLOR_WORD_THEMES.Emerald,
  AI_COLOR_WORD_THEMES.Violet,
  AI_COLOR_WORD_THEMES.Rose,
];

function themeForAiSquadLabel(label: string): { muted: string; active: string } {
  const first = label.trim().split(/\s+/)[0];
  if (first && AI_COLOR_WORD_THEMES[first]) {
    return AI_COLOR_WORD_THEMES[first];
  }
  const h = stableHash([label, 'ai-squad-theme-fallback']);
  return AI_THEME_ROTATION[h % AI_THEME_ROTATION.length];
}

/**
 * Squad label + pill styles for a group. **#AIpowered** cohort uses stable pseudo-random “Color + Planet” names.
 */
export function groupSquadForChallenge(challenge: CommunityChallenge, g: number): {
  label: string;
  muted: string;
  active: string;
} {
  if (challenge.cohortId === 'ai') {
    if (challenge.id === 'ch-active-ai-vibe-coding') {
      const fixed = VIBE_CHALLENGE_FIXED_SQUADS[g];
      if (fixed) return fixed;
    }
    const label = aiColorPlanetLabel(challenge.id, g);
    const theme = themeForAiSquadLabel(label);
    return { label, muted: theme.muted, active: theme.active };
  }
  return groupSquadForIndex(g);
}
