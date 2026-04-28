import { ContentType, CourseData, Lesson, Status } from './types';

export const SKILL_SUBSKILLS = [
  "Prepare Datasets in Power BI",
  "Connecting and Importing Data",
  "Preparing and Cleaning Data",
  "Visualizing and Reporting Clean Data",
] as const;

export type SkillLevelLabel = "Practicing" | "Developing" | "Comprehending";

export const getSkillLevelLabel = (percent: number): SkillLevelLabel => {
  if (percent >= 90) return "Comprehending";
  if (percent >= 40) return "Developing";
  return "Practicing";
};

/** Whole-number course % for UI. Uses ceil so targets like ~30% work with integer lesson counts (e.g. 20/68 → 30%). */
export function courseCompletionDisplayPercent(
  completed: number,
  total: number
): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.ceil((completed / total) * 100));
}

export const LESSON_SKILL_TAGS: Record<string, string[]> = {
  "m1-l1": ["Visualizing and Reporting Clean Data"],
  "m1-l2": ["Visualizing and Reporting Clean Data"],
  "m1-l3": ["Visualizing and Reporting Clean Data"],
  "m1-l4": ["Visualizing and Reporting Clean Data"],
  "m1-l5": ["Visualizing and Reporting Clean Data"],
  "m1-l6": ["Visualizing and Reporting Clean Data"],
  "m1-l7": ["Connecting and Importing Data"],
  "m1-l8": ["Connecting and Importing Data"],
  "m1-l9": ["Prepare Datasets in Power BI"],
  "m1-l10": ["Visualizing and Reporting Clean Data", "Preparing and Cleaning Data"],
  "m1-l11": ["Connecting and Importing Data"],
  "m1-l12": ["Visualizing and Reporting Clean Data"],
  "m1-l13": ["Preparing and Cleaning Data"],
  "m1-l14": ["Visualizing and Reporting Clean Data", "Preparing and Cleaning Data"],
};

export const getSkillPoints = (type: ContentType): number => {
  switch (type) {
    case ContentType.PRACTICE:
    case ContentType.ASSIGNMENT:
    case ContentType.PLUGIN:
    case ContentType.LAB:
      return 5;
    case ContentType.QUIZ:
    case ContentType.ASSESSMENT:
      return 15;
    case ContentType.VIDEO:
    case ContentType.READING:
      return 1;
    default:
      return 5;
  }
};

export const parseDurationToMinutes = (duration?: string): number => {
  if (!duration) return 5;

  const hourMatch = duration.match(/(\d+)\s*h/);
  const minMatch = duration.match(/(\d+)\s*min/);
  const secMatch = duration.match(/(\d+)\s*sec/);

  if (hourMatch) return parseInt(hourMatch[1], 10) * 60;
  if (minMatch) return parseInt(minMatch[1], 10);
  if (secMatch) return Math.max(1, Math.round(parseInt(secMatch[1], 10) / 60));

  return 5;
};

export const sumLessonMinutes = (lessons: Lesson[]): number =>
  lessons.reduce((acc, lesson) => acc + parseDurationToMinutes(lesson.duration), 0);

export const sumLessonPoints = (lessons: Lesson[]): number =>
  lessons.reduce((acc, lesson) => acc + getSkillPoints(lesson.type), 0);

export const getLessonSkillTags = (lessonId: string): string[] =>
  LESSON_SKILL_TAGS[lessonId] || [];

export const aggregateSkillPoints = (lessons: Lesson[]): Record<string, number> => {
  const totals: Record<string, number> = {};
  const fallbackTags = ["Visualizing and Reporting Clean Data"];

  lessons.forEach((lesson) => {
    const tags = getLessonSkillTags(lesson.id);
    const points = getSkillPoints(lesson.type);
    const resolvedTags = tags.length ? tags : fallbackTags;
    const effectiveTags = points > 1 ? resolvedTags : [resolvedTags[0]];
    const share = Math.floor(points / effectiveTags.length);
    const remainder = points % effectiveTags.length;

    effectiveTags.forEach((tag, index) => {
      const add = share + (index === 0 ? remainder : 0);
      totals[tag] = (totals[tag] || 0) + add;
    });
  });

  return totals;
};

export const buildDailyGoalLessonIds = (
  courseData: CourseData,
  startLessonId: string | null,
  timeMinutes: number
): string[] => {
  if (!courseData.modules.length) return [];

  let module = courseData.modules.find((m) => m.lessons.some((l) => l.id === startLessonId));
  if (!module) module = courseData.modules[0];

  let startIndex = startLessonId
    ? module.lessons.findIndex((l) => l.id === startLessonId)
    : -1;
  if (startIndex === -1) {
    startIndex = module.lessons.findIndex((l) => l.status !== Status.COMPLETED);
  }
  if (startIndex === -1) startIndex = 0;

  const lessonIds: string[] = [];
  let totalMinutes = 0;

  for (let i = startIndex; i < module.lessons.length; i += 1) {
    const lesson = module.lessons[i];
    const duration = parseDurationToMinutes(lesson.duration);

    if (lessonIds.length === 0 || totalMinutes + duration <= timeMinutes) {
      lessonIds.push(lesson.id);
      totalMinutes += duration;
    }

    if (totalMinutes >= timeMinutes) break;
  }

  if (!lessonIds.length && module.lessons.length) {
    lessonIds.push(module.lessons[0].id);
  }

  return lessonIds;
};
