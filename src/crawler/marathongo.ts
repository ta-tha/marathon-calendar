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

/** JS 번들에서 대회 데이터 배열을 추출하고 vm으로 안전하게 평가 */
function extractRacesFromBundle(src: string): RawRace[] {
  const startIdx = src.indexOf("[{raceName:");
  if (startIdx === -1) return [];

  // 매칭되는 닫는 대괄호 찾기
  let depth = 0;
  let endIdx = startIdx;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === "[") depth++;
    if (src[i] === "]") {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  const arrayStr = src.substring(startIdx, endIdx);

  // vm.runInNewContext로 JS 객체 배열을 안전하게 평가
  try {
    const result = vm.runInNewContext(`(${arrayStr})`, {}, { timeout: 5000 });
    return result as RawRace[];
  } catch (e) {
    console.error("vm evaluation failed:", e);
    return [];
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
