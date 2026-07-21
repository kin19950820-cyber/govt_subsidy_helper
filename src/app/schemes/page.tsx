import { Suspense } from "react";
import Link from "next/link";
import { getActiveSchemes } from "@/lib/schemes";
import SchemesBrowser from "@/components/SchemesBrowser";
import Disclaimer from "@/components/Disclaimer";

// SSG + 每日 ISR（公開列表頁）。?group= 由 client 端讀取，避免整頁轉 dynamic。
export const revalidate = 86400;

export default async function SchemesPage() {
  const schemes = await getActiveSchemes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">所有津貼</h1>
        <p className="mt-1 text-stone-600">
          用下面嘅選單揀受惠群組（學生 / 長者 / 其他），再撳入去睇詳情。
        </p>
      </div>

      <Link href="/finder" className="btn-primary w-full">
        🔍 唔知揀邊個？答幾條問題幫你搵
      </Link>

      <Suspense>
        <SchemesBrowser schemes={schemes} />
      </Suspense>

      <Disclaimer />
    </div>
  );
}
