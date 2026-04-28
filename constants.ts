import { CourseData, ContentType, Status } from './types';
import { getSkillPoints } from './skills';

export { getSkillPoints };

export const COURSE_DATA: CourseData = {
  title: "Foundations: Data, Data, Everywhere",
  provider: "Google",
  modules: [
    {
      id: "m1",
      title: "Introducing data analytics and analytical thinking",
      description: "Module 1",
      isOpen: true,
      lessons: [
        { id: "m1-l1", title: "Choosing the right chart for your data", type: ContentType.VIDEO, duration: "4 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l2", title: "Best practices for clean data visualizations", type: ContentType.VIDEO, duration: "2 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l3", title: "Formatting data for effective reporting", type: ContentType.READING, duration: "4 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l4", title: "Common visualization mistakes to avoid", type: ContentType.READING, duration: "4 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l5", title: "Design principles for clear dashboards", type: ContentType.PLUGIN, duration: "10 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l6", title: "Telling stories with your data", type: ContentType.VIDEO, duration: "4 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l7", title: "Origins of the data analysis process", type: ContentType.READING, duration: "8 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l8", title: "How data analysts approach tasks", type: ContentType.READING, duration: "8 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l9", title: "Cassie: Dimensions of data analytics", type: ContentType.VIDEO, duration: "4 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l10", title: "Create a sales performance dashboard", type: ContentType.PRACTICE, duration: "30 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l11", title: "What is the data ecosystem?", type: ContentType.VIDEO, duration: "4 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l12", title: "How data informs better decisions", type: ContentType.VIDEO, duration: "4 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l13", title: "Data and gut instinct", type: ContentType.READING, duration: "4 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l14", title: "Test your knowledge on the data ecosystem", type: ContentType.ASSIGNMENT, duration: "10 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l15", title: "Discover data skill sets", type: ContentType.VIDEO, duration: "46 sec", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l16", title: "Key data analyst skills", type: ContentType.VIDEO, duration: "6 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l17", title: "Use data analytics skills in a business scenario", type: ContentType.READING, duration: "8 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l18", title: "Practice data analyst skills", type: ContentType.PLUGIN, duration: "10 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l19", title: "Test your knowledge on data analyst skills", type: ContentType.PRACTICE, duration: "8 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l20", title: "All about thinking analytically", type: ContentType.VIDEO, duration: "5 min", status: Status.COMPLETED, isLocked: false },
        { id: "m1-l21", title: "Explore core analytical skills", type: ContentType.VIDEO, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m1-l22", title: "Use the five whys for root cause analysis", type: ContentType.READING, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m1-l23", title: "Data drives successful outcomes", type: ContentType.VIDEO, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m1-l24", title: "Witness data magic", type: ContentType.VIDEO, duration: "5 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m1-l25", title: "Test your knowledge on analytical thinking and outcomes", type: ContentType.PRACTICE, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m1-l26", title: "What to expect moving forward", type: ContentType.VIDEO, duration: "1 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m1-l27", title: "Glossary terms from course 1, module 1", type: ContentType.READING, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m1-l28", title: "Assessment-taking strategies", type: ContentType.READING, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m1-l29", title: "Module 1 challenge", type: ContentType.ASSIGNMENT, duration: "40 min", status: Status.NOT_STARTED, isLocked: false }
      ]
    },
    {
      id: "m2",
      title: "The wonderful world of data",
      description: "Module 2",
      isOpen: true,
      lessons: [
        { id: "m2-l1", title: "Learn about data phases and tools", type: ContentType.VIDEO, duration: "2 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l2", title: "Phases of data analysis", type: ContentType.PLUGIN, duration: "10 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l3", title: "Stages of the data life cycle", type: ContentType.VIDEO, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l4", title: "Variations of the data life cycle", type: ContentType.READING, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l5", title: "Test your knowledge on the data life cycle", type: ContentType.PRACTICE, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l6", title: "The phases of data analysis and this program", type: ContentType.VIDEO, duration: "6 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l7", title: "More on the phases of data analysis and this program", type: ContentType.READING, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l8", title: "Molly: Example of the data analysis process", type: ContentType.VIDEO, duration: "6 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l9", title: "Test your knowledge on the data analysis process", type: ContentType.PRACTICE, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l10", title: "Explore data analyst tools", type: ContentType.VIDEO, duration: "6 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l11", title: "Key data analyst tools", type: ContentType.READING, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l12", title: "Choose the right tool for the job", type: ContentType.READING, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l13", title: "Self-Reflection: Review past concepts", type: ContentType.PRACTICE, duration: "20 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l14", title: "Test your knowledge on the data analysis toolbox", type: ContentType.PRACTICE, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l15", title: "Glossary terms from course 1, module 2", type: ContentType.READING, duration: "2 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m2-l16", title: "Module 2 challenge", type: ContentType.ASSIGNMENT, duration: "50 min", status: Status.NOT_STARTED, isLocked: false }
      ]
    },
    {
      id: "m3",
      title: "Set up your data analytics toolbox",
      description: "Module 3",
      isOpen: true,
      lessons: [
        { id: "m3-l1", title: "The ins and outs of core data tools", type: ContentType.VIDEO, duration: "2 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l2", title: "Step-by-Step: Make spreadsheets your friend", type: ContentType.READING, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l3", title: "Make spreadsheets your friend", type: ContentType.VIDEO, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l4", title: "Hands-On Activity: Generate a chart from a spreadsheet", type: ContentType.PRACTICE, duration: "1 h", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l5", title: "More spreadsheet resources", type: ContentType.READING, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l6", title: "Test your knowledge on spreadsheet basics", type: ContentType.PRACTICE, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l7", title: "SQL in action", type: ContentType.VIDEO, duration: "3 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l8", title: "SQL guide: Getting started", type: ContentType.READING, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l9", title: "Angie: Everyday struggles when learning new skills", type: ContentType.VIDEO, duration: "1 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l10", title: "Endless SQL possibilities", type: ContentType.READING, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l11", title: "Become a data viz whiz", type: ContentType.VIDEO, duration: "5 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l12", title: "Plan a data visualization", type: ContentType.READING, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l13", title: "Lilah: The power of a visualization", type: ContentType.VIDEO, duration: "2 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l14", title: "Test your knowledge on SQL and data visualization", type: ContentType.PRACTICE, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l15", title: "Glossary terms from course 1, module 3", type: ContentType.READING, duration: "2 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m3-l16", title: "Module 3 challenge", type: ContentType.ASSIGNMENT, duration: "50 min", status: Status.NOT_STARTED, isLocked: false }
      ]
    },
    {
      id: "m4",
      title: "Become a fair and impactful data professional",
      description: "Module 4",
      isOpen: true,
      lessons: [
        { id: "m4-l1", title: "Let's get down to business", type: ContentType.VIDEO, duration: "49 sec", status: Status.NOT_STARTED, isLocked: false },
        { id: "m4-l2", title: "The job of a data analyst", type: ContentType.VIDEO, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m4-l3", title: "Joey: Path to becoming a data analyst", type: ContentType.VIDEO, duration: "2 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m4-l4", title: "Self-Reflection: Business use of data", type: ContentType.PRACTICE, duration: "20 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m4-l5", title: "Tony: Supporting careers in data analytics", type: ContentType.VIDEO, duration: "2 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m4-l6", title: "Test your knowledge on data analyst roles", type: ContentType.PLUGIN, duration: "10 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "m4-l7", title: "The power of data in business", type: ContentType.VIDEO, duration: "4 min", status: Status.NOT_STARTED, isLocked: false }
      ]
    }
  ]
};

/** Introduction to Sensory Science (Essentials of Sensory Science specialization) */
export const SENSORY_COURSE_DATA: CourseData = {
  title: "Introduction to Sensory Science",
  provider: "UC Davis",
  theme: 'yellow',
  logoUrl: '/course2/UC-Davis-Emblem.png',
  heroImageUrl: '/course2/sensory-cert-hero.png',
  isSpecialization: true,
  welcomeLabel: 'Specialization',
  modules: [
    {
      id: "s1",
      title: "Introduction to Sensory Science",
      description: "Module 1",
      isOpen: true,
      lessons: [
        { id: "s1-l1", title: "Course Introduction", type: ContentType.READING, duration: "6 min", status: Status.COMPLETED, isLocked: false },
        { id: "s1-l2", title: "Module Introduction", type: ContentType.VIDEO, duration: "6 min", status: Status.COMPLETED, isLocked: false },
        { id: "s1-l3", title: "What are the Sensory Sciences: A Historical Presentation", type: ContentType.VIDEO, duration: "17 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "s1-l4", title: "What are the Sensory Sciences: Sensory Evaluation Definition", type: ContentType.VIDEO, duration: "4 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "s1-l5", title: "What are the Sensory Sciences: The Senses", type: ContentType.VIDEO, duration: "8 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "s1-l6", title: "What are the Sensory Sciences: Academic Disciplines Involved in Sensory Science", type: ContentType.VIDEO, duration: "7 min", status: Status.NOT_STARTED, isLocked: false },
        { id: "s1-l7", title: "What are the Sensory Sciences: Classification of Test Methods", type: ContentType.VIDEO, duration: "8 min", status: Status.NOT_STARTED, isLocked: false }
      ]
    }
  ]
};

export const ENROLLED_COURSES: CourseData[] = [COURSE_DATA, SENSORY_COURSE_DATA];
