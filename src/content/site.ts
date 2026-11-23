/**
 * Single source of truth for every fact on the site.
 * Everything here is verified against Faisal's brief, public GitHub READMEs
 * and LinkedIn. Do not add experience or claims that are not verified.
 */

export const site = {
  name: "Faisal Imran",
  initials: "FI",
  role: "Software Engineer",
  positioning: "Software Engineer · CS Major at FAST · DevOps Enthusiast",
  headline: "I build things. Then make them work.",
  intro:
    "I'm a CS student at FAST-NUCES. I build web projects, enjoy solving the problems behind them, and keep learning about backend development and DevOps along the way.",
  tagline: ["Build", "Break", "Learn", "Ship"] as const,
  location: "Faisalabad, Pakistan",
  timezone: "Asia/Karachi",
  email: "faisalimran.builds@gmail.com",
  github: "https://github.com/faisal-imran81",
  githubHandle: "faisal-imran81",
  linkedin: "https://www.linkedin.com/in/faisal-imran-623284373",
  description:
    "I'm Faisal Imran, a CS student at FAST-NUCES. I build web and mobile projects with TypeScript, Next.js and React Native, and I'm learning backend development and DevOps.",
} as const;

export const education = {
  degree: "BS Computer Science",
  school: "FAST-NUCES",
  campus: "Chiniot-Faisalabad Campus",
  start: "Aug 2023",
  end: "Jun 2027",
  status: "Final year",
};

export const certification = {
  title: "Python for Data Science, AI & Development",
};

export const navItems = [
  { id: "about", label: "About" },
  { id: "arsenal", label: "Skills" },
  { id: "work", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "journey", label: "Journey" },
  { id: "exploring", label: "Learning" },
  { id: "contact", label: "Contact" },
] as const;

export const mindset = [
  {
    step: "Build",
    line: "Get a working version out.",
    body: "I'd rather have something rough that runs than a perfect plan. Most of what I know, I learned by building first and figuring it out as I went.",
  },
  {
    step: "Break",
    line: "Break it before someone else does.",
    body: "Bad inputs, failing tests, deploys that don't come up. I want to find these problems on my own machine, not after someone starts using it.",
  },
  {
    step: "Learn",
    line: "Understand why it broke.",
    body: "Fixing the bug is only half of it. I try to understand what actually went wrong, so I don't repeat it in the next project.",
  },
  {
    step: "Ship",
    line: "Put it where people can use it.",
    body: "A live link and a README someone else can follow. Until then, it's just code sitting on my laptop.",
  },
] as const;

export type SkillGroup = {
  id: string;
  label: string;
  note: string;
  items: { name: string; level?: "core" | "learning" }[];
};

export const arsenal: SkillGroup[] = [
  {
    id: "core",
    label: "Core",
    note: "What I use the most",
    items: [
      { name: "TypeScript", level: "core" },
      { name: "Next.js", level: "core" },
      { name: "Three.js", level: "core" },
      { name: "React", level: "core" },
    ],
  },
  {
    id: "interface",
    label: "Frontend",
    note: "Web and mobile interfaces",
    items: [
      { name: "React Native" },
      { name: "Expo" },
      { name: "Tailwind CSS" },
      { name: "Framer Motion" },
      { name: "React Three Fiber" },
      { name: "JavaScript" },
    ],
  },
  {
    id: "systems",
    label: "Backend",
    note: "APIs and databases behind my apps",
    items: [
      { name: "Node.js" },
      { name: "Express" },
      { name: "Python" },
      { name: "FastAPI" },
      { name: "Supabase" },
      { name: "PostgreSQL" },
      { name: "MongoDB" },
      { name: "Prisma" },
    ],
  },
  {
    id: "ai",
    label: "AI",
    note: "Adding AI features to my projects",
    items: [
      { name: "Groq API" },
      { name: "Gemini API" },
      { name: "Anthropic Claude" },
      { name: "OpenRouter" },
      { name: "Structured prompting" },
      { name: "PyTorch (coursework)" },
    ],
  },
  {
    id: "infra",
    label: "DevOps",
    note: "Still learning these, mostly through LaunchFlow",
    items: [
      { name: "Docker", level: "learning" },
      { name: "AWS EC2, S3 and ECR", level: "learning" },
      { name: "Linux", level: "learning" },
      { name: "GitHub Actions", level: "learning" },
      { name: "Nginx", level: "learning" },
      { name: "Git" },
      { name: "Vercel" },
    ],
  },
  {
    id: "foundations",
    label: "Foundations",
    note: "What I started with at university",
    items: [{ name: "C++" }, { name: "Python" }, { name: "Assembly" }],
  },
];
