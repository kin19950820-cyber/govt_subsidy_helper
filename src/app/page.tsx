import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import { AUDIENCE_LABELS, AUDIENCE_ORDER } from "@/lib/types";

const GROUP_ICON: Record<string, string> = {
  student: "🎒",
  elderly: "👵",
  low_income: "🏠",
  disability: "♿",
  other: "❓",
};

const FEATURES = [
  { icon: "🔍", title: "幾條問題搵津貼", desc: "答幾條簡單問題，即刻睇邊啲津貼可能啱你。", href: "/finder" },
  { icon: "📋", title: "一張文件清單", desc: "幫你整合所有需要嘅文件，唔使周圍搵。", href: "/checklist" },
  { icon: "📝", title: "幫你填表", desc: "用你儲存咗嘅資料，整理成申請草稿。", href: "/drafts" },
  { icon: "📚", title: "睇晒所有津貼", desc: "每個津貼有簡單說明同申請步驟。", href: "/schemes" },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-b from-brand to-brand-dark p-7 text-white">
        <h1 className="text-3xl font-bold leading-snug">
          幫你屋企嘅學生
          <br />
          搵返應得嘅津貼
        </h1>
        <p className="mt-3 text-lg text-white/90">
          專為香港低收入家庭而設。用簡單問題，幫你睇邊啲學生津貼可能啱你，再教你點樣準備同申請。
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/finder" className="btn bg-white text-brand hover:bg-stone-100">
            🔍 開始搵津貼
          </Link>
          <Link href="/schemes" className="btn border-2 border-white/70 text-white hover:bg-white/10">
            睇所有津貼
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">你屬於邊個群組？</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {AUDIENCE_ORDER.map((g) => (
            <Link
              key={g}
              href={`/schemes?group=${g}`}
              className="card flex flex-col items-center gap-1 py-4 text-center hover:border-brand"
            >
              <span className="text-3xl" aria-hidden>
                {GROUP_ICON[g]}
              </span>
              <span className="font-semibold">{AUDIENCE_LABELS[g]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href} className="card hover:border-brand">
            <div className="text-3xl" aria-hidden>
              {f.icon}
            </div>
            <h2 className="mt-2 text-xl font-bold">{f.title}</h2>
            <p className="mt-1 text-stone-600">{f.desc}</p>
          </Link>
        ))}
      </section>

      <section className="card bg-brand/5">
        <h2 className="text-xl font-bold">點樣用？</h2>
        <ol className="mt-3 space-y-2 text-lg">
          <li>1️⃣ 答幾條關於你屋企嘅問題。</li>
          <li>2️⃣ 睇邊啲津貼「很可能適合」或「可能適合」。</li>
          <li>3️⃣ 跟住一張清單，準備好所有文件。</li>
          <li>4️⃣ 幫你整理申請資料，自己檢查後先去交。</li>
        </ol>
      </section>

      <Disclaimer />
    </div>
  );
}
