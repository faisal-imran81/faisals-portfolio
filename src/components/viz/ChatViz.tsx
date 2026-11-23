"use client";

import { Reveal } from "@/components/ui/Reveal";

/** Muslimeen: question → grounded answer with a citation chip → stored session. */
export function ChatViz({ accent }: { accent: string }) {
  return (
    <div className="grid gap-5 p-5 sm:grid-cols-[1.4fr_1fr] sm:p-8">
      <div className="space-y-3">
        <Reveal y={10} className="ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm bg-paper/8 px-3 py-2 text-[0.8125rem] text-paper-dim">
          What does the Qur&apos;an say about patience?
        </Reveal>
        <Reveal y={10} delay={0.2} className="max-w-[95%] rounded-lg rounded-bl-sm border border-line-strong px-3 py-2.5 text-[0.8125rem] leading-snug text-paper">
          An answer based on the text, along with where it comes from.
          <span className="mt-2 flex gap-2">
            <span className="rounded-full border px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em]" style={{ borderColor: `${accent}88`, color: accent }}>
              Surah and verse
            </span>
          </span>
        </Reveal>
      </div>
      <div className="border hairline bg-ink p-3 font-mono text-[0.625rem] leading-relaxed text-mute">
        <div className="mb-1 uppercase tracking-[0.14em] text-paper-dim">messages</div>
        <div>id · uuid</div>
        <div>user_id · uuid → auth.users</div>
        <div>session_id · text</div>
        <div>text · text</div>
        <div>is_user · bool</div>
        <div>created_at · tstz</div>
        <div className="mt-2" style={{ color: accent }}>indexed by user, session and time</div>
      </div>
    </div>
  );
}
