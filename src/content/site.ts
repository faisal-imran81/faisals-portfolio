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
