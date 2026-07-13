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

/** 기존 events.json의 이벤트 수 (없거나 깨졌으면 0) */
function existingEventCount(outputPath: string): number {
  try {
    const parsed = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/**
 * 크롤 결과가 신뢰할 만한지 검증한다.
 *
 * 소스 사이트가 구조를 바꾸면 파서는 조용히 0개를 리턴한다. 그대로 저장하면
 * events.json이 빈 배열로 덮어써지고 사이트에서 대회가 전부 사라진다.
 * (2026-03 ~ 07 실제로 발생) 그래서 결과가 의심스러우면 저장하지 않고 실패시킨다.
 */
function assertResultIsSane(newCount: number, oldCount: number) {
  if (newCount === 0) {
    throw new Error(
      "크롤 결과가 0개입니다. 소스 사이트 구조가 바뀌었을 가능성이 높습니다. " +
        "events.json을 덮어쓰지 않고 중단합니다."
    );
  }

  // 기존 데이터가 충분히 쌓여 있는데 절반 이하로 급감하면 파싱 사고로 간주
  const SHRINK_LIMIT = 0.5;
  if (oldCount >= 20 && newCount < oldCount * SHRINK_LIMIT) {
    if (process.env.ALLOW_SHRINK === "1") {
      console.warn(
        `경고: 이벤트가 ${oldCount} → ${newCount}개로 급감했지만 ALLOW_SHRINK=1이라 진행합니다.`
      );
      return;
    }
    throw new Error(
      `이벤트가 ${oldCount} → ${newCount}개로 급감했습니다(50% 초과 감소). ` +
        "파싱 오류가 의심되어 중단합니다. 의도한 변화라면 ALLOW_SHRINK=1로 재실행하세요."
    );
  }
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

    // Save to public/data/events.json
    const outputDir = path.resolve(__dirname, "../../public/data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "events.json");

    // 저장 전 검증 - 실패하면 기존 events.json을 그대로 둔다
    const oldCount = existingEventCount(outputPath);
    assertResultIsSane(uniqueEvents.length, oldCount);
    console.log(`\n검증 통과: ${oldCount} → ${uniqueEvents.length} events`);

    // 포스터 이미지는 검증을 통과한 결과에 대해서만 수집 (느린 작업)
    await fetchPosterUrls(uniqueEvents);

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
