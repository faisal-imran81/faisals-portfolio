import type { Project } from "@/content/site";
import { CardsViz } from "./CardsViz";
import { ChatViz } from "./ChatViz";
import { CnnViz } from "./CnnViz";
import { CrudViz } from "./CrudViz";
import { LevelsViz } from "./LevelsViz";
import { PipelineViz } from "./PipelineViz";
import { WellnessViz } from "./WellnessViz";
import { VizFrame } from "./Frame";

const labels: Record<Project["viz"], string> = {
  pipeline: "Deploy pipeline",
  cards: "From notes to flashcards",
  wellness: "Mood chart and chat",
  levels: "Difficulty levels",
  chat: "Answers with sources",
  crud: "API routes",
  cnn: "Test results",
};

export function ProjectViz({ project }: { project: Project }) {
  const a = project.accent;
  const body = {
    pipeline: <PipelineViz accent={a} />,
    cards: <CardsViz accent={a} />,
    wellness: <WellnessViz accent={a} />,
    levels: <LevelsViz accent={a} />,
    chat: <ChatViz accent={a} />,
    crud: <CrudViz accent={a} />,
    cnn: <CnnViz accent={a} />,
  }[project.viz];
  return (
    <VizFrame label={`Fig. ${project.index}: ${labels[project.viz]}`} accent={a}>
      {project.viz === "pipeline" ? <div className="p-4 sm:p-6">{body}</div> : body}
    </VizFrame>
  );
}
