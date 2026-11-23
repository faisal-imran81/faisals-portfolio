import { SplitWords } from "./SplitWords";
import { Reveal } from "./Reveal";

type Props = {
  index: string;
  label: string;
  title: string;
  accent?: number[];
  aside?: React.ReactNode;
  id?: string;
};

/** Editorial section opener: mono index rail + large split headline. */
export function SectionHeading({ index, label, title, accent, aside, id }: Props) {
  return (
    <div className="grid gap-8 md:grid-cols-12 md:gap-6">
      <Reveal className="md:col-span-3">
        <div className="flex items-center gap-3 label-mono">
          <span className="text-acid">{index}</span>
          <span className="h-px w-8 bg-line-strong" />
          <span>{label}</span>
        </div>
      </Reveal>
      <div className="md:col-span-9">
        <SplitWords as="h2" id={id} text={title} accent={accent} className="display-lg text-balance" />
        {aside ? <Reveal delay={0.15} className="mt-8 max-w-xl text-paper-dim">{aside}</Reveal> : null}
      </div>
    </div>
  );
}
