import DynamicFinder from "./DynamicFinder";

// 動態問卷（C4）：問題由資格規則 + ApplicantFacts 產生，結果即時、可解釋。
// 舊的 sessionStorage 答案會自動帶入；/results 與 legacy 配對路徑仍然保留。
export default function FinderPage() {
  return <DynamicFinder />;
}
