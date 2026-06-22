import { runCrawl } from "./crawler/crawl.js";
import { buildProcessed } from "./build/buildProcessed.js";
import { buildSeedSql } from "./build/buildSeedSql.js";
import { log } from "./util/log.js";

const HELP = `
HK Subsidy Research Agent

用法： npm run <command>

  crawl     從官方 WFSFAA 起始 URL 開始爬，下載 HTML/PDF，存 /data/raw 同 /data/extracted
  extract   （= build）由整理好嘅官方知識庫產生結構化資料
  build     產生 /data/processed/*.json 同 /supabase/*.sql
  all       crawl 之後再 build

只用政府官方來源。每個事實都帶 source_url + last_checked_at。
唔確定嘅資料會標記 needs_review = true，唔會聲稱保證合資格。
`;

async function main() {
  const cmd = process.argv[2] ?? "help";
  switch (cmd) {
    case "crawl":
      await runCrawl();
      break;
    case "extract":
    case "build":
      buildProcessed();
      buildSeedSql();
      break;
    case "all":
      await runCrawl();
      buildProcessed();
      buildSeedSql();
      break;
    default:
      console.log(HELP);
  }
}

main().catch((e) => {
  log.error(e);
  process.exit(1);
});
