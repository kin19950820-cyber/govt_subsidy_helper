export default function ProgressSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number; // 0-indexed
}) {
  return (
    <ol className="flex items-center gap-2" aria-label="進度">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full text-base font-bold",
                done
                  ? "bg-brand text-white"
                  : active
                    ? "border-2 border-brand bg-white text-brand"
                    : "border-2 border-stone-300 bg-white text-stone-400",
              ].join(" ")}
            >
              {done ? "✓" : i + 1}
            </div>
            <span
              className={[
                "text-center text-xs",
                active ? "font-semibold text-brand" : "text-stone-500",
              ].join(" ")}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
