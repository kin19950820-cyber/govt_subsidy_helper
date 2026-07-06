import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "津貼助手 | 香港政府津貼一站式",
  description:
    "幫香港市民（學生家庭、長者、殘疾人士等）快速搵到政府津貼同支援服務，了解資格、準備文件、整理申請資料。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d6e6e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant-HK">
      <body>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-3xl px-4 py-10 text-center text-sm text-stone-500">
          <p>津貼助手 · 只供參考，並非政府官方網站</p>
          <p className="mt-1">如有疑問，請聯絡學校社工或致電相關政府部門。</p>
          <a href="/admin/schemes" className="mt-2 inline-block text-stone-400 underline">
            管理員入口
          </a>
        </footer>
      </body>
    </html>
  );
}
