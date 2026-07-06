import Link from "next/link";
import { getActiveSchemes } from "@/lib/schemes";
import SchemesBrowser from "@/components/SchemesBrowser";
import Disclaimer from "@/components/Disclaimer";
import { AUDIENCE_ORDER, AudienceGroup } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SchemesPage({
  searchParams,
}: {
  searchParams: { group?: string };
}) {
  const schemes = await getActiveSchemes();
  const g = searchParams.group;
  const initialGroup =
    g && (AUDIENCE_ORDER as string[]).includes(g)
      ? (g as AudienceGroup)
      : "all";

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

      <SchemesBrowser schemes={schemes} initialGroup={initialGroup} />

      <Disclaimer />
    </div>
  );
}
