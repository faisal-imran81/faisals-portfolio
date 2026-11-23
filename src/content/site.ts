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

export type ProjectStatus = "In development" | "Live" | "Coursework" | "Built";

export type Project = {
  id: string;
  index: string;
  name: string;
  kicker: string;
  summary: string;
  status: ProjectStatus;
  context?: string;
  year: string;
  stack: string[];
  highlights: string[];
  metrics?: { label: string; value: string }[];
  source?: string;
  live?: string;
  viz: "pipeline" | "cards" | "wellness" | "levels" | "chat" | "crud" | "cnn";
  accent: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    id: "launchflow",
    index: "01",
    name: "LaunchFlow",
    kicker: "Final Year Project",
    summary:
      "My final year project, and I'm still building it. You paste in a GitHub repo link. LaunchFlow works out the stack, writes a Dockerfile and a GitHub Actions workflow, builds the image, pushes it to AWS ECR and deploys it to EC2. The logs stream back to your browser while it runs.",
    status: "In development",
    context: "Final Year Project at FAST-NUCES. Still in progress.",
    year: "Since 2026",
    stack: ["React 19", "Express 5", "Node.js", "Groq", "Supabase", "Docker", "AWS ECR", "AWS EC2", "Nginx", "SSE"],
    highlights: [
      "Detects the stack by looking at the repo's files. Right now it handles Node.js, Python, Go, Java, Ruby, PHP and Rust.",
      "Uses an LLM through Groq to write the Dockerfile and CI workflow, then runs a real Docker build, pushes to ECR and deploys to EC2.",
      "Streams build and container logs to the browser in real time with Server-Sent Events.",
      "Writes the Nginx reverse proxy config for you and keeps a history of every deployment.",
    ],
    metrics: [
      { label: "Tests passing", value: "691" },
      { label: "Pipeline steps", value: "6" },
      { label: "Stacks detected", value: "7" },
    ],
    source: "https://github.com/faisal-imran81/launchflow",
    viz: "pipeline",
    accent: "#c8f135",
    featured: true,
  },
  {
    id: "solace",
    index: "02",
    name: "Solace",
    kicker: "Mental wellness app",
    summary:
      "A mental wellness app with an AI chat, a mood tracker and a journal. If someone types something that sounds like a crisis, it shows them helpline links straight away.",
    status: "Live",
    year: "2026",
    stack: ["Next.js 16", "React Three Fiber", "FastAPI", "Groq", "Prisma", "PostgreSQL", "Clerk", "Railway"],
    highlights: [
      "Chat replies stream in word by word over SSE, using LLaMA 3.1 through Groq.",
      "Each journal entry gets a sentiment label and a reflection prompt from the AI.",
      "A keyword check catches crisis messages and shows links to real helplines.",
    ],
    metrics: [
      { label: "Streaming chat", value: "SSE" },
      { label: "Mood chart", value: "7-day" },
      { label: "Breathing exercise", value: "4-7-8" },
    ],
    source: "https://github.com/faisal-imran81/Solace",
    live: "https://solace-web-fm4f-gamma.vercel.app",
    viz: "wellness",
    accent: "#9db7ff",
    featured: true,
  },
  {
    id: "elucid",
    index: "03",
    name: "Elucid",
    kicker: "AI tutor",
    summary:
      "Type in a topic and choose how deep the explanation should go, from ELI5 up to PhD level. It also saves your history and bookmarks, and keeps track of your daily learning streak.",
    status: "Live",
    year: "2026",
    stack: ["React Native", "Expo SDK 54", "Groq", "Supabase", "react-native-web"],
    highlights: [
      "A difficulty selector with five levels that changes how the explanation is written.",
      "Guest mode, so people can try it without making an account.",
      "One React Native codebase that runs on iOS, Android and the web.",
    ],
    source: "https://github.com/faisal-imran81/Elucid-AI-Tutor",
    live: "https://elucid-ai-tutor.vercel.app",
    viz: "levels",
    accent: "#7ef0d0",
  },
  {
    id: "muslimeen",
    index: "04",
    name: "Muslimeen",
    kicker: "Qur'an chat app",
    summary:
      "A chat app for asking questions about the Qur'an. Each answer comes with the Surah and verse it's based on, and your conversations are saved so you can come back to them.",
    status: "Live",
    year: "2026",
    stack: ["React Native", "Expo Router", "TypeScript", "Supabase", "Groq"],
    highlights: [
      "Answers include the Surah and verse they refer to.",
      "Chat sessions are stored in Supabase, indexed by user, session and time.",
      "Email and password sign-in, with dark and light themes.",
    ],
    source: "https://github.com/faisal-imran81/Muslimeen",
    live: "https://quran-chat-app-seven.vercel.app/",
    viz: "chat",
    accent: "#e9d8a6",
  },
  {
    id: "ta-platform",
    index: "05",
    name: "TA & Faculty Platform",
    kicker: "MERN project",
    summary:
      "A web app where teaching assistants and faculty can manage users, announcements, tasks, office hours and shared study material in one place.",
    status: "Built",
    year: "2026",
    stack: ["React", "React Router", "Node.js", "Express", "MongoDB", "Mongoose"],
    highlights: [
      "Five REST resources, each with full create, read, update and delete.",
      "Announcements have priority levels, and tasks have status tracking.",
    ],
    source: "https://github.com/faisal-imran81/ta-faculty-platform",
    viz: "crud",
    accent: "#d4a5ff",
  },
  {
    id: "cifar",
    index: "06",
    name: "Robust CIFAR-10",
    kicker: "Deep Learning coursework",
    summary:
      "A course assignment where I had to train an image classifier on only 500 CIFAR-10 images, then test it on a corrupted version of the test set. I built a small CNN with an Inception-style module from scratch, without any pretrained weights.",
    status: "Coursework",
    year: "Fall 2026",
    stack: ["PyTorch", "torchvision", "NumPy", "Colab"],
    highlights: [
      "The model has 46,674 parameters, well under the 1 million limit.",
      "Photometric augmentation helped the most with the corrupted images.",
      "Accuracy on the corrupted test set went from 0.222 to 0.261. Overfitting was the main problem with so little data.",
    ],
    source: "https://github.com/faisal-imran81/dlp-assignment2-cifar10",
    viz: "cnn",
    accent: "#ff8f8f",
  },
  {
    id: "flashforge",
    index: "07",
    name: "FlashForge AI",
    kicker: "FlyRank capstone",
    summary:
      "Paste in your lecture notes or just a topic, and it gives you a set of flashcards to study from. I built it as my capstone at FlyRank. I picked this problem because I've wasted a lot of time making flashcards by hand myself.",
    status: "Live",
    context: "My capstone project for the FlyRank AI internship.",
    year: "2026",
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "Groq SDK", "Vitest", "Vercel"],
    highlights: [
      "Sends your notes to an LLM through Groq and gets back question and answer pairs.",
      "Has 20 tests written with Vitest and Testing Library, plus a README that gets a new developer running in under 5 minutes.",
      "I ran Lighthouse on it and got 90 for performance, 95 for accessibility and 100 for SEO.",
    ],
    metrics: [
      { label: "Performance", value: "90" },
      { label: "Accessibility", value: "95" },
      { label: "SEO", value: "100" },
      { label: "Tests", value: "20" },
    ],
    source: "https://github.com/faisal-imran81/flashforge-ai",
    live: "https://flashforge-ai-ten.vercel.app",
    viz: "cards",
    accent: "#ffb86b",
  },
];
