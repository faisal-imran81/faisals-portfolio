const resources = ["users", "announcements", "tasks", "sessions", "resources"];
const methods = ["GET", "POST", "PUT", "DEL"];

/** TA platform: five REST resources × four verbs. */
export function CrudViz({ accent }: { accent: string }) {
  return (
    <div className="overflow-x-auto p-5 sm:p-8">
      <table className="w-full min-w-[320px] font-mono text-[0.625rem] uppercase tracking-[0.1em]">
        <thead>
          <tr className="text-mute">
            <th className="pb-3 text-left font-normal">/api/</th>
            {methods.map((m) => (
              <th key={m} className="pb-3 text-center font-normal">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resources.map((r) => (
            <tr key={r} className="border-t hairline">
              <td className="py-2.5 normal-case tracking-normal text-paper-dim">{r}</td>
              {methods.map((m) => (
                <td key={m} className="py-2.5 text-center">
                  <span className="inline-block size-2 rounded-[2px]" style={{ background: m === "GET" ? accent : "rgb(239 236 228 / .25)" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex gap-4 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-mute">
        <span>React</span><span>→</span><span>Express</span><span>→</span><span>MongoDB</span>
      </div>
    </div>
  );
}
