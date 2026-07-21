import Link from "next/link";
import {
  getCategories,
  getLifeEvents,
  getCategory,
  getLifeEvent,
  categoryCounts,
  queryBenefits,
} from "@/lib/benefits/registry";
import Disclaimer from "@/components/Disclaimer";
import VerificationBadge from "@/components/VerificationBadge";

export const dynamic = "force-dynamic";

export default function BenefitsPage({
  searchParams,
}: {
  searchParams: { category?: string; event?: string };
}) {
  const categories = getCategories();
  const lifeEvents = getLifeEvents();
  const counts = categoryCounts();
  const categoryCode = searchParams.category;
  const lifeEvent = searchParams.event;

  const filtered = queryBenefits({ categoryCode, lifeEvent });
  const activeCat = categoryCode ? getCategory(categoryCode) : undefined;
  const activeEvent = lifeEvent ? getLifeEvent(lifeEvent) : undefined;
  const hasFilter = Boolean(categoryCode || lifeEvent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">福利及公共服務</h1>
        <p className="mt-1 text-stone-600">
          按分類或人生階段瀏覽政府福利。全部資料來自官方，並持續更新。
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">按分類</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories
            .filter((c) => (counts[c.code] ?? 0) > 0)
            .map((c) => (
              <Link
                key={c.code}
                href={`/benefits?category=${c.code}`}
                className={[
                  "card flex flex-col gap-1 py-4",
                  categoryCode === c.code ? "border-brand ring-2 ring-brand/30" : "",
                ].join(" ")}
              >
                <span className="text-2xl" aria-hidden>
                  {c.icon}
                </span>
                <span className="font-semibold leading-tight">{c.name_zh}</span>
                <span className="text-sm text-stone-500">{counts[c.code]} 項</span>
              </Link>
            ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">按人生階段</h2>
        <div className="flex flex-wrap gap-2">
          {lifeEvents.map((e) => (
            <Link
              key={e.code}
              href={`/benefits?event=${e.code}`}
              className={[
                "chip border",
                lifeEvent === e.code
                  ? "border-brand bg-brand text-white"
                  : "border-stone-300 bg-white text-stone-700",
              ].join(" ")}
            >
              {e.name_zh}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {activeCat
              ? activeCat.name_zh
              : activeEvent
                ? activeEvent.name_zh
                : "全部福利"}
            <span className="ml-2 text-base font-normal text-stone-500">
              {filtered.length} 項
            </span>
          </h2>
          {hasFilter && (
            <Link href="/benefits" className="text-sm text-brand">
              清除篩選
            </Link>
          )}
        </div>

        {filtered.map((b) => (
          <Link
            key={b.slug}
            href={`/schemes/${b.slug}`}
            className="card block hover:border-brand"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="chip border-brand/30 bg-brand/10 text-brand">
                  {getCategory(b.categoryCode)?.name_zh}
                </span>
                <h3 className="mt-2 text-lg font-bold">{b.nameZh}</h3>
                <p className="text-sm text-stone-500">{b.nameEn}</p>
              </div>
              <VerificationBadge
                status={b.status}
                lastVerified={b.lastUpdated}
                active={b.active}
              />
            </div>
            <p className="mt-2 text-stone-700">{b.summary}</p>
          </Link>
        ))}
      </section>

      <Disclaimer />
    </div>
  );
}
