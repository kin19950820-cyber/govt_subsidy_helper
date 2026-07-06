import Link from "next/link";
import { AUDIENCE_LABELS, SubsidyScheme } from "@/lib/types";

export default function SchemeCard({ scheme }: { scheme: SubsidyScheme }) {
  return (
    <Link href={`/schemes/${scheme.id}`} className="card block hover:border-brand">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap gap-1">
            <span className="chip border-brand/30 bg-brand/10 text-brand">
              {scheme.category}
            </span>
            {scheme.audience.map((g) => (
              <span
                key={g}
                className="chip border-stone-300 bg-stone-100 text-stone-600"
              >
                {AUDIENCE_LABELS[g]}
              </span>
            ))}
          </div>
          <h3 className="mt-2 text-xl font-bold text-stone-900">
            {scheme.nameZh}
          </h3>
          <p className="text-sm text-stone-500">{scheme.nameEn}</p>
        </div>
        <span className="text-2xl" aria-hidden>
          📄
        </span>
      </div>
      <p className="mt-3 text-stone-700">{scheme.summary}</p>
      <p className="mt-3 text-sm font-semibold text-brand">睇詳情 →</p>
    </Link>
  );
}
