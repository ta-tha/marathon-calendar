import type { MarathonEvent, Region } from "../lib/types";
import { REGIONS } from "../lib/types";

const REGION_MAP: Record<string, Region> = {
  서울: "서울",
  서울특별시: "서울",
  경기: "경기",
  경기도: "경기",
  인천: "인천",
  인천광역시: "인천",
  부산: "부산",
  부산광역시: "부산",
  대구: "대구",
  대구광역시: "대구",
  대전: "대전",
  대전광역시: "대전",
  광주: "광주",
  광주광역시: "광주",
  울산: "울산",
  울산광역시: "울산",
  세종: "세종",
  세종특별자치시: "세종",
  강원: "강원",
  강원도: "강원",
  강원특별자치도: "강원",
  충북: "충북",
  충청북도: "충북",
  충남: "충남",
  충청남도: "충남",
  전북: "전북",
  전라북도: "전북",
  전북특별자치도: "전북",
  전남: "전남",
  전라남도: "전남",
  경북: "경북",
  경상북도: "경북",
  경남: "경남",
  경상남도: "경남",
  제주: "제주",
  제주특별자치도: "제주",
  제주도: "제주",
};

// City-to-region mapping for when only a city name is given
const CITY_TO_REGION: Record<string, Region> = {
  수원: "경기",
  성남: "경기",
  고양: "경기",
  용인: "경기",
  부천: "경기",
  안양: "경기",
  안산: "경기",
  남양주: "경기",
  화성: "경기",
  평택: "경기",
  의정부: "경기",
  파주: "경기",
  시흥: "경기",
  김포: "경기",
  광명: "경기",
  광주: "경기", // 경기도 광주시
  군포: "경기",
  이천: "경기",
  오산: "경기",
  하남: "경기",
  양주: "경기",
  구리: "경기",
  포천: "경기",
  양평: "경기",
  여주: "경기",
  동두천: "경기",
  가평: "경기",
  연천: "경기",
  과천: "경기",
  의왕: "경기",
  춘천: "강원",
  원주: "강원",
  강릉: "강원",
  속초: "강원",
  동해: "강원",
  태백: "강원",
  삼척: "강원",
  홍천: "강원",
  횡성: "강원",
  평창: "강원",
  정선: "강원",
  철원: "강원",
  화천: "강원",
  양구: "강원",
  인제: "강원",
  고성: "강원",
  양양: "강원",
  청주: "충북",
  충주: "충북",
  제천: "충북",
  보은: "충북",
  옥천: "충북",
  영동: "충북",
  증평: "충북",
  진천: "충북",
  괴산: "충북",
  음성: "충북",
  단양: "충북",
  천안: "충남",
  공주: "충남",
  보령: "충남",
  아산: "충남",
  서산: "충남",
  논산: "충남",
  계룡: "충남",
  당진: "충남",
  금산: "충남",
  부여: "충남",
  서천: "충남",
  청양: "충남",
  홍성: "충남",
  예산: "충남",
  태안: "충남",
  전주: "전북",
  군산: "전북",
  익산: "전북",
  정읍: "전북",
  남원: "전북",
  김제: "전북",
  완주: "전북",
  진안: "전북",
  무주: "전북",
  장수: "전북",
  임실: "전북",
  순창: "전북",
  고창: "전북",
  부안: "전북",
  목포: "전남",
  여수: "전남",
  순천: "전남",
  나주: "전남",
  광양: "전남",
  담양: "전남",
  곡성: "전남",
  구례: "전남",
  고흥: "전남",
  보성: "전남",
  화순: "전남",
  장흥: "전남",
  강진: "전남",
  해남: "전남",
  영암: "전남",
  무안: "전남",
  함평: "전남",
  영광: "전남",
  장성: "전남",
  완도: "전남",
  진도: "전남",
  신안: "전남",
  포항: "경북",
  경주: "경북",
  김천: "경북",
  안동: "경북",
  구미: "경북",
  영주: "경북",
  영천: "경북",
  상주: "경북",
  문경: "경북",
  경산: "경북",
  의성: "경북",
  청송: "경북",
  영양: "경북",
  영덕: "경북",
  청도: "경북",
  고령: "경북",
  성주: "경북",
  칠곡: "경북",
  예천: "경북",
  봉화: "경북",
  울진: "경북",
  울릉: "경북",
  창원: "경남",
  진주: "경남",
  통영: "경남",
  사천: "경남",
  김해: "경남",
  밀양: "경남",
  거제: "경남",
  양산: "경남",
  의령: "경남",
  함안: "경남",
  창녕: "경남",
  // 고성: "경남", // NOTE: 고성은 강원(고성군)과 경남(고성군) 모두 존재. 강원 우선 매핑됨.
  남해: "경남",
  하동: "경남",
  산청: "경남",
  함양: "경남",
  거창: "경남",
  합천: "경남",
  서귀포: "제주",
};

export function normalizeRegion(raw: string): Region {
  const trimmed = raw.trim();

  // Direct match
  if (REGION_MAP[trimmed]) return REGION_MAP[trimmed];

  // Check if any known region/city is a prefix
  for (const [key, region] of Object.entries(REGION_MAP)) {
    if (trimmed.startsWith(key)) return region;
  }

  // Check city mapping
  for (const [city, region] of Object.entries(CITY_TO_REGION)) {
    if (trimmed.includes(city)) return region;
  }

  // Check if any REGIONS value is included
  for (const r of REGIONS) {
    if (trimmed.includes(r)) return r;
  }

  return "기타";
}

const DISTANCE_MAP: Record<string, string> = {
  풀: "풀코스",
  풀코스: "풀코스",
  "full": "풀코스",
  "42.195km": "풀코스",
  "42km": "풀코스",
  하프: "하프",
  "half": "하프",
  "21.0975km": "하프",
  "21km": "하프",
  "100km": "100K",
  "80km": "80K",
  "70km": "70K",
  "60km": "60K",
  "50km": "50K",
  "30km": "30K",
  "20km": "20K",
  "10km": "10K",
  "10k": "10K",
  "5km": "5K",
  "5k": "5K",
  "3km": "3K",
  "3k": "3K",
  "2km": "2K",
  울트라: "울트라",
};

export function normalizeDistances(distances: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const d of distances) {
    const lower = d.toLowerCase().trim();
    const normalized = DISTANCE_MAP[lower] || d;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

export function deduplicateEvents(
  events: MarathonEvent[]
): MarathonEvent[] {
  const seen = new Map<string, MarathonEvent>();

  for (const event of events) {
    // Create a dedup key from title + date
    const key = `${event.title.replace(/\s+/g, "")}_${event.eventDate}`;

    if (!seen.has(key)) {
      seen.set(key, event);
    }
  }

  return Array.from(seen.values());
}
