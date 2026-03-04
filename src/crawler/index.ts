import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { crawlMarathonGo } from "./marathongo";
import { deduplicateEvents } from "./normalize";
import type { MarathonEvent } from "../lib/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 상대경로를 절대 URL로 변환 */
function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

/** 각 대회 sourceUrl에서 og:image 메타태그 추출 */
async function fetchPosterUrls(
  events: MarathonEvent[]
): Promise<MarathonEvent[]> {
  const CONCURRENCY = 5;
  const TIMEOUT = 5000;
  let success = 0;
  let fail = 0;

  console.log(
    `\nFetching poster images from ${events.length} event pages (concurrency: ${CONCURRENCY})...`
  );

  // 동시 요청 제한을 위해 배치 처리
  for (let i = 0; i < events.length; i += CONCURRENCY) {
    const batch = events.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map(async (evt) => {
        if (!evt.sourceUrl || !evt.sourceUrl.startsWith("http")) return;

        try {
          const res = await axios.get(evt.sourceUrl, {
            timeout: TIMEOUT,
            headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
            maxRedirects: 3,
            // SSL 검증 실패해도 시도
            httpsAgent: new (require("https").Agent)({
              rejectUnauthorized: false,
            }),
          });

          const $ = cheerio.load(res.data);
          const ogImage =
            $('meta[property="og:image"]').attr("content") ||
            $('meta[name="og:image"]').attr("content") ||
            $('meta[property="twitter:image"]').attr("content");

          if (ogImage) {
            evt.posterUrl = resolveUrl(evt.sourceUrl, ogImage);
            success++;
          }
        } catch {
          // 실패는 무시 - posterUrl 없이 진행
        }
      })
    );

    fail += batch.length - batch.filter((_, idx) => {
      const r = results[idx];
      return r.status === "fulfilled" && events[i + idx].posterUrl;
    }).length + batch.filter((_, idx) => events[i + idx].posterUrl).length - success + fail;

    // 진행률 표시 (20개마다)
    if ((i + CONCURRENCY) % 20 === 0 || i + CONCURRENCY >= events.length) {
      const done = Math.min(i + CONCURRENCY, events.length);
      process.stdout.write(`\r  Progress: ${done}/${events.length} (posters found: ${success})`);
    }
  }

  console.log(
    `\n  Poster fetch complete: ${success}/${events.length} (${Math.round((success / events.length) * 100)}%)`
  );

  return events;
}

async function main() {
  console.log("=== Marathon Calendar Crawler ===");
  console.log(`Start time: ${new Date().toISOString()}\n`);

  try {
    // Crawl marathongo.co.kr
    const events = await crawlMarathonGo();

    // Deduplicate
    const uniqueEvents = deduplicateEvents(events);
    console.log(
      `\nAfter deduplication: ${uniqueEvents.length} events (removed ${events.length - uniqueEvents.length} duplicates)`
    );

    // Sort by event date
    uniqueEvents.sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );

    // Fetch poster images from og:image
    await fetchPosterUrls(uniqueEvents);

    // Save to public/data/events.json
    const outputDir = path.resolve(__dirname, "../../public/data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "events.json");
    fs.writeFileSync(
      outputPath,
      JSON.stringify(uniqueEvents, null, 2),
      "utf-8"
    );

    console.log(`\nSaved ${uniqueEvents.length} events to ${outputPath}`);
    console.log(`End time: ${new Date().toISOString()}`);

    // Print summary
    const statusCounts = { 접수중: 0, 접수예정: 0, 접수마감: 0 };
    let posterCount = 0;
    for (const e of uniqueEvents) {
      statusCounts[e.registrationStatus]++;
      if (e.posterUrl) posterCount++;
    }
    console.log("\n=== Summary ===");
    console.log(`Total events: ${uniqueEvents.length}`);
    console.log(`접수중: ${statusCounts["접수중"]}`);
    console.log(`접수예정: ${statusCounts["접수예정"]}`);
    console.log(`접수마감: ${statusCounts["접수마감"]}`);
    console.log(`포스터 이미지: ${posterCount}/${uniqueEvents.length}`);
  } catch (error) {
    console.error("Crawler failed:", error);
    process.exit(1);
  }
}

main();
