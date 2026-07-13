import axios from "axios";
import * as vm from "vm";
import type { MarathonEvent, RegistrationStatus } from "../lib/types";
import { normalizeRegion, normalizeDistances } from "./normalize";

const BASE_URL = "https://marathongo.co.kr";

interface RawRace {
  raceName: string;
  raceDetailUrl: string;
  raceDate: string;
  raceStart?: string;
  raceTypeList: string;
  regionCategory: string;
  region: string;
  place: string;
  host: string;
  applicationStartDate: string;
  applicationEndDate: string;
  homepageUrl: string;
  phone?: string;
  email?: string;
  intro?: string;
}

function parseRegistrationStatus(
  startDate: string,
  endDate: string
): RegistrationStatus {
  const today = new Date().toISOString().split("T")[0];
  if (!startDate || !endDate) return "접수마감";
  if (today < startDate) return "접수예정";
  if (today <= endDate) return "접수중";
  return "접수마감";
}

function parseDistances(raceTypeList: string): string[] {
  if (!raceTypeList) return ["기타"];
  return raceTypeList
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function generateId(name: string, date: string): string {
  const slug = name
    .replace(/[^\w가-힣\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 50);
  return `marathongo-${slug}-${date}`;
}

/**
 * raceName 키 위치에서 역방향으로 배열 리터럴의 시작(`[`)을 찾는다.
 * 객체의 첫 필드가 무엇이든(`[{raceName:`, `[{id:1,raceName:` 등) 대응하기 위함.
 * 배열 리터럴이 아니면(예: `e.raceName` 같은 참조) -1.
 */
function findArrayStart(src: string, keyIdx: number): number {
  for (let i = keyIdx; i >= 0; i--) {
    const c = src[i];
    if (c === "{") {
      let j = i - 1;
      while (j >= 0 && /\s/.test(src[j])) j--;
      return src[j] === "[" ? j : -1;
    }
    // 객체 시작을 만나기 전에 닫는 괄호가 나오면 리터럴 내부가 아니다
    if (c === "}" || c === "]" || c === ";") return -1;
  }
  return -1;
}

/** 문자열 리터럴을 건너뛰며 짝이 맞는 닫는 대괄호를 찾는다 */
function findArrayEnd(src: string, startIdx: number): number {
  let depth = 0;
  let quote: string | null = null;

  for (let i = startIdx; i < src.length; i++) {
    const c = src[i];

    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }

    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) return i + 1;
  }
  return -1;
}

/**
 * 번들에는 국내 대회 배열과 해외 대회 배열이 함께 들어있다.
 * 해외 배열은 raceDetailUrl 없이 ogLink를 쓰므로 이걸로 구분한다.
 */
function isDomesticRaceArray(value: unknown): value is RawRace[] {
  if (!Array.isArray(value) || value.length === 0) return false;

  const sample = value.slice(0, 10);
  const domestic = sample.filter(
    (r) => r && typeof r === "object" && "raceDetailUrl" in r
  );
  return domestic.length > sample.length / 2;
}

/** JS 번들에서 대회 데이터 배열을 추출하고 vm으로 안전하게 평가 */
function extractRacesFromBundle(src: string): RawRace[] {
  const KEY = "raceName:";
  let searchFrom = 0;

  // raceName이 여러 번 등장할 수 있으므로 실제로 파싱되는 배열이 나올 때까지 시도
  for (;;) {
    const keyIdx = src.indexOf(KEY, searchFrom);
    if (keyIdx === -1) return [];
    searchFrom = keyIdx + KEY.length;

    const startIdx = findArrayStart(src, keyIdx);
    if (startIdx === -1) continue;

    const endIdx = findArrayEnd(src, startIdx);
    if (endIdx === -1) continue;

    try {
      const result = vm.runInNewContext(
        `(${src.substring(startIdx, endIdx)})`,
        {},
        { timeout: 5000 }
      );
      if (isDomesticRaceArray(result)) {
        return result as RawRace[];
      }
    } catch {
      // 이 후보는 배열 리터럴이 아니었다 - 다음 raceName 위치로
    }
  }
}

export async function crawlMarathonGo(): Promise<MarathonEvent[]> {
  console.log("Fetching data from marathongo.co.kr JS bundle...");

  // Step 1: 메인 페이지에서 JS chunk URL 수집
  const mainPage = await axios.get(`${BASE_URL}/raceSchedule/domestic`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    timeout: 30000,
  });

  const jsChunks = [
    ...mainPage.data.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g),
  ].map((m: RegExpMatchArray) => m[1]);

  console.log(`Found ${jsChunks.length} JS chunks, scanning for race data...`);

  // Step 2: homepageUrl이 포함된 chunk에서 데이터 추출
  let rawRaces: RawRace[] = [];

  for (const chunk of jsChunks) {
    try {
      const res = await axios.get(`${BASE_URL}${chunk}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 15000,
      });
      const src: string = res.data;

      if (!src.includes("homepageUrl")) continue;

      console.log(`Found data chunk: ${chunk.split("/").pop()}`);
      rawRaces = extractRacesFromBundle(src);
      console.log(`Extracted ${rawRaces.length} races from JS bundle`);

      if (rawRaces.length > 0) break;
    } catch {
      continue;
    }
  }

  if (rawRaces.length === 0) {
    console.error("Failed to find race data in JS bundles");
    return [];
  }

  // Step 3: MarathonEvent 형식으로 변환 (미래 이벤트만)
  const today = new Date().toISOString().split("T")[0];
  const events: MarathonEvent[] = [];

  for (const race of rawRaces) {
    if (!race.raceName || !race.raceDate) continue;
    if (race.raceDate < today) continue;

    const region = normalizeRegion(
      race.region || race.regionCategory || "기타"
    );
    const distances = normalizeDistances(parseDistances(race.raceTypeList));
    const regStatus = parseRegistrationStatus(
      race.applicationStartDate,
      race.applicationEndDate
    );

    const detailUrl = race.raceDetailUrl
      ? `${BASE_URL}/raceDetail/${race.raceDetailUrl}`
      : `${BASE_URL}/raceSchedule/domestic`;

    const homepageUrl = race.homepageUrl?.trim() || "";

    events.push({
      id: generateId(race.raceName, race.raceDate),
      title: race.raceName,
      eventDate: race.raceDate,
      ...(race.applicationStartDate && {
        registrationStart: race.applicationStartDate,
      }),
      ...(race.applicationEndDate && {
        registrationEnd: race.applicationEndDate,
      }),
      location: race.place || race.region || "미정",
      region,
      distances: distances.length > 0 ? distances : ["기타"],
      ...(race.host && { organizer: race.host }),
      sourceUrl: homepageUrl || detailUrl,
      registrationStatus: regStatus,
      registrationUrl: homepageUrl || detailUrl,
      source: "마라톤GO",
    });
  }

  console.log(`Converted ${events.length} future events`);
  return events;
}
