export enum ContentType {
  VIDEO = 'Video',
  READING = 'Reading',
  QUIZ = 'Quiz',
  PLUGIN = 'Ungraded Plugin',
  LAB = 'Lab',
  ASSIGNMENT = 'Graded Assignment',
  ASSESSMENT = 'Graded assessment',
  PRACTICE = 'Practice Assignment'
}

export enum Status {
  COMPLETED = 'Completed',
  IN_PROGRESS = 'In Progress',
  LOCKED = 'Locked',
  FAILED = 'Failed',
  NOT_STARTED = 'Not Started'
}

export interface Lesson {
  id: string;
  title: string;
  type: ContentType;
  duration?: string;
  status: Status;
  grade?: string;
  isLocked?: boolean;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  isOpen: boolean;
}

export interface CourseData {
  title: string;
  provider: string;
  modules: Module[];
  /** Theme for hero banner: default (blue) or yellow */
  theme?: 'default' | 'yellow';
  /** Logo image URL (e.g. provider emblem) */
  logoUrl?: string;
  /** Intro video URL; when absent and heroImageUrl set, hero shows image only */
  heroVideoUrl?: string;
  /** Hero thumbnail/image URL for reading-first courses */
  heroImageUrl?: string;
  /** If true, welcome message says "Specialization" */
  isSpecialization?: boolean;
  /** Override for welcome line, e.g. "Specialization" */
  welcomeLabel?: string;
}