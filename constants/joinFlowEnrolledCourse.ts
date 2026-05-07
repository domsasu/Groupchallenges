/** Coursera course suggested in the It’s a Vibe join recap (not an enrollment claim). */
export const VIBE_ENROLLED_COURSE = {
  href: 'https://www.coursera.org/programs/skillup-jst0u/learn/introduction-to-claude-code?authProvider=coursera&collectionId=skill~vibe-coding&source=search',
  title: 'Vibe Coding with Claude Code',
  provider: 'Scrimba',
  type: 'Course',
  rating: 4.3,
  /** Shown in join recap instead of star rating when learner has partial progress. */
  completionPercent: 32,
  imageSrc: '/challenges/vibe-coding-claude-code-thumb.svg',
} as const;

/** Mock learner “current” enrollment for generic challenge join recap (matches Home-style trending imagery). */
export const CURRENT_ENROLLED_COURSE_FOR_JOIN_FLOW = {
  href: 'https://www.coursera.org/professional-certificates/generative-ai-data-science',
  title: 'Generative AI for Data Scientists',
  provider: 'IBM',
  type: 'Professional Certificate',
  rating: 4.8,
  completionPercent: 42,
  imageSrc:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400',
} as const;
