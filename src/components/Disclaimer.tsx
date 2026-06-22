export default function Disclaimer({ text }: { text?: string }) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-900">
      <p className="font-semibold">⚠️ 重要提示</p>
      <p className="mt-1">
        {text ??
          "本系統只幫你整理資料及估計，不代表政府已批准申請。最終批核以政府部門公佈為準，請以官方連結最新資料為準。"}
      </p>
    </div>
  );
}
