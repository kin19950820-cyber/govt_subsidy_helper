import Link from "next/link";

const NAV = [
  { href: "/finder", label: "搵津貼" },
  { href: "/benefits", label: "分類瀏覽" },
  { href: "/schemes", label: "所有津貼" },
  { href: "/checklist", label: "文件清單" },
  { href: "/profile", label: "我的資料" },
  { href: "/drafts", label: "申請草稿" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            🎒
          </span>
          <span className="text-lg font-bold text-brand">津貼助手</span>
        </Link>
        <Link href="/finder" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
          開始
        </Link>
      </div>
      <nav className="mx-auto max-w-3xl overflow-x-auto px-2 pb-2">
        <ul className="flex gap-2 whitespace-nowrap">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-block rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
