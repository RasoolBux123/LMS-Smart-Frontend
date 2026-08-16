import type { CourseworkKind } from "@/types";

export interface CourseworkLabels {
  plural: string;
  singular: string;
  subtitle: string;
  basePath: string;
}

export const courseworkLabels: Record<CourseworkKind, CourseworkLabels> = {
  assignment: {
    plural: "Assignments",
    singular: "assignment",
    subtitle: "All assignments across your enrolled courses.",
    basePath: "/student/assignments",
  },
  quiz: {
    plural: "Quizzes",
    singular: "quiz",
    subtitle: "All quizzes across your enrolled courses.",
    basePath: "/student/quizzes",
  },
  exam: {
    plural: "Exams",
    singular: "exam",
    subtitle: "All exams across your enrolled courses.",
    basePath: "/student/exams",
  },
  project: {
    plural: "Projects",
    singular: "project",
    subtitle: "All projects across your enrolled courses.",
    basePath: "/student/projects",
  },
};



// import type { CourseworkKind } from "@/types";

// export interface CourseworkLabels {
//   /** Plural heading, e.g. "Assignments" */
//   plural: string;
//   /** Lowercase singular used inside sentences, e.g. "assignment" */
//   singular: string;
//   /** Page subtitle on the list screen */
//   subtitle: string;
//   /** Route prefix for the student pages */
//   basePath: string;
// }

// export const courseworkLabels: Record<CourseworkKind, CourseworkLabels> = {
//   assignment: {
//     plural: "Assignments",
//     singular: "assignment",
//     subtitle: "All assignments across your enrolled courses.",
//     basePath: "/student/assignments",
//   },
//   quiz: {
//     plural: "Quizzes",
//     singular: "quiz",
//     subtitle: "All quizzes across your enrolled courses.",
//     basePath: "/student/quizzes",
//   },
//   exam: {
//     plural: "Exams",
//     singular: "exam",
//     subtitle: "All exams across your enrolled courses.",
//     basePath: "/student/exams",
//   },
//   project: {
//     plural: "Projects",
//     singular: "project",
//     subtitle: "All projects across your enrolled courses.",
//     basePath: "/student/projects",
//   },
// };
