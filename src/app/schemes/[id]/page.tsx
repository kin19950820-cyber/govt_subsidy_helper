import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchemeById } from "@/lib/schemes";
import { DOCUMENT_LABELS } from "@/lib/types";
import Disclaimer from "@/components/Disclaimer";

export const dynamic = "force-dynamic";

export default async function SchemeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const scheme = await getSchemeById(params.id);
  if (!scheme) notFound();

  return (
    <div className="space-y-6">
      <div>
        <span className="chip border-brand/30 bg-brand/10 text-brand">
          {scheme.category}
        </span>
        <h1 className="mt-2 text-2xl font-bold">{scheme.nameZh}</h1>
        <p className="text-stone-500">{scheme.nameEn}</p>
      </div>

      <a
        href={scheme.officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary w-full"
      >
        🔗 去官方連結睇詳情
      </a>

      <Section title="簡單說明">
        <p>{scheme.summary}</p>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card bg-green-50">
          <h2 className="font-bold text-green-800">✅ 適合邊類家庭</h2>
          <p className="mt-2 text-stone-700">{scheme.suitableFor}</p>
        </div>
        <div className="card bg-rose-50">
          <h2 className="font-bold text-rose-800">🚫 不適合邊類家庭</h2>
          <p className="mt-2 text-stone-700">{scheme.notSuitableFor}</p>
        </div>
      </div>

      <Section title="申請資格">
        <ul className="space-y-2">
          {scheme.eligibility.map((e, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand">•</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="需要文件">
        <ul className="space-y-2">
          {scheme.documents.map((d) => (
            <li key={d} className="flex gap-2">
              <span aria-hidden>📎</span>
              <span>{DOCUMENT_LABELS[d]}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="申請步驟（簡單講）">
        <ol className="space-y-3">
          {scheme.steps.map((s) => (
            <li key={s.order} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                {s.order}
              </span>
              <span className="pt-1">{s.text}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="申請表格">
        <a
          href={scheme.formUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full"
        >
          📝 下載 / 開啟申請表
        </a>
      </Section>

      <div className="card space-y-2 bg-stone-100 text-stone-700">
        <p>
          <span className="font-semibold">負責部門：</span>
          {scheme.department}
        </p>
        <p>
          <span className="font-semibold">查詢電話：</span>
          <a href={`tel:${scheme.phone.replace(/\s/g, "")}`} className="text-brand underline">
            {scheme.phone}
          </a>
        </p>
        <p>
          <span className="font-semibold">最後更新日期：</span>
          {scheme.lastVerified}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={`/drafts/${scheme.id}`} className="btn-primary flex-1">
          📝 幫我整理申請資料
        </Link>
        <Link href="/checklist" className="btn-secondary flex-1">
          整文件清單
        </Link>
      </div>

      <Disclaimer text={scheme.disclaimer} />

      <Link href="/schemes" className="block text-center text-brand">
        ← 返回所有津貼
      </Link>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <h2 className="text-xl font-bold text-stone-900">{title}</h2>
      <div className="mt-3 text-stone-700">{children}</div>
    </section>
  );
}
