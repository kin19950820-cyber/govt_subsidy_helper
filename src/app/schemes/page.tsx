import Link from "next/link";
import { getActiveSchemes } from "@/lib/schemes";
import SchemeCard from "@/components/SchemeCard";
import Disclaimer from "@/components/Disclaimer";

export const dynamic = "force-dynamic";

export default async function SchemesPage() {
  const schemes = await getActiveSchemes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">所有學生津貼</h1>
        <p className="mt-1 text-stone-600">
          撳入去睇每個津貼嘅詳情、需要文件同申請步驟。
        </p>
      </div>

      <Link href="/finder" className="btn-primary w-full">
        🔍 唔知揀邊個？答幾條問題幫你搵
      </Link>

      <div className="space-y-4">
        {schemes.map((scheme) => (
          <SchemeCard key={scheme.id} scheme={scheme} />
        ))}
      </div>

      <Disclaimer />
    </div>
  );
}
