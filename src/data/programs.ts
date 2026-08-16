import type { Program } from "@/types/program";

/**
 * Seed catalogue. The API layer falls back to this list when the backend
 * is unreachable, so the UI stays demonstrable without a running server.
 */
export const seedPrograms: Program[] = [
  {
    id: "prg-web",
    code: "WEB",
    title: "Web Development",
    description:
      "Full-stack web engineering — semantic HTML and modern CSS through to React, Node.js APIs and production deployment.",
    level: "diploma",
    status: "active",
    durationMonths: 12,
    totalCredits: 36,
    coordinator: "Dr. Ayesha Khan",
    courseIds: [],
    courseCount: 8,
    studentCount: 142,
    color: "#4338ca",
  },
  {
    id: "prg-ai",
    code: "AI",
    title: "Artificial Intelligence",
    description:
      "Machine learning foundations, neural networks, natural language processing and applied model deployment.",
    level: "graduate",
    status: "active",
    durationMonths: 18,
    totalCredits: 48,
    coordinator: "Dr. Bilal Ahmed",
    courseIds: [],
    courseCount: 10,
    studentCount: 96,
    color: "#0f766e",
  },
  {
    id: "prg-ds",
    code: "DS",
    title: "Data Science",
    description:
      "Statistics, Python data tooling, visualisation and analytics workflows for real business datasets.",
    level: "diploma",
    status: "active",
    durationMonths: 12,
    totalCredits: 33,
    coordinator: "Prof. Sana Malik",
    courseIds: [],
    courseCount: 7,
    studentCount: 118,
    color: "#1d4ed8",
  },
  {
    id: "prg-cyber",
    code: "SEC",
    title: "Cyber Security",
    description:
      "Network defence, secure application design, ethical hacking practice and incident response procedures.",
    level: "certificate",
    status: "active",
    durationMonths: 9,
    totalCredits: 24,
    coordinator: "Mr. Hamza Sheikh",
    courseIds: [],
    courseCount: 6,
    studentCount: 74,
    color: "#be123c",
  },
  {
    id: "prg-mobile",
    code: "MOB",
    title: "Mobile App Development",
    description:
      "Cross-platform mobile engineering with React Native and Flutter, covering release and store publishing.",
    level: "certificate",
    status: "active",
    durationMonths: 8,
    totalCredits: 21,
    coordinator: "Ms. Nida Raza",
    courseIds: [],
    courseCount: 5,
    studentCount: 63,
    color: "#a1600a",
  },
  {
    id: "prg-cloud",
    code: "CLD",
    title: "Cloud & DevOps",
    description:
      "Containers, CI/CD pipelines, infrastructure as code and cloud architecture on major providers.",
    level: "diploma",
    status: "draft",
    durationMonths: 10,
    totalCredits: 30,
    coordinator: "Mr. Usman Tariq",
    courseIds: [],
    courseCount: 6,
    studentCount: 0,
    color: "#7c3aed",
  },
];
