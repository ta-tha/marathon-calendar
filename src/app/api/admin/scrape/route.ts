import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import axios from "axios";
import * as cheerio from "cheerio";
import type { MarathonEvent, Region } from "@/lib/types";

const REGIONS: Region[] = [
  "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

const DISTANCES = ["풀코스", "풀마라톤", "하프", "하프마라톤", "10K", "10km", "5K", "5km", "3K", "3km", "8K", "8km", "울트라"];

function extractDates(text: string): string[] {
  const dates: string[] = [];
  // YYYY-MM-DD or YYYY.MM.DD or YYYY년 MM월 DD일
  const patterns = [
    /20\d{2}[-./]\s*\d{1,2}[-./]\s*\d{1,2}/g,
    /20\d{2}년\s*\d{1,2}월\s*\d{1,2}일/g,
  ];
  for (const p of patterns) {
    const matches = text.match(p);
    if (matches) {
      for (const m of matches) {
        const cleaned = m.replace(/[년월.]/g, "-").replace(/[일\s]/g, "").replace(/-+/g, "-");
        const parts = cleaned.split("-").map((s) => s.trim());
        if (parts.length === 3) {
          const [y, mo, d] = parts;
          const formatted = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
          if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) dates.push(formatted);
        }
      }
    }
  }
  return [...new Set(dates)].sort();
}

function extractDistances(text: string): string[] {
  const found: string[] = [];
  const normalized = text.toLowerCase();
  if (normalized.includes("풀코스") || normalized.includes("풀마라톤") || normalized.includes("42.195")) found.push("풀코스");
  if (normalized.includes("하프") || normalized.includes("21.0975")) found.push("하프");
  for (const d of ["10K", "10km", "5K", "5km", "3K", "3km", "8K", "8km"]) {
    if (normalized.includes(d.toLowerCase())) {
      found.push(d.toUpperCase().replace("KM", "K"));
    }
  }
  if (normalized.includes("울트라")) found.push("울트라");
  return [...new Set(found)];
}

function extractRegion(text: string): Region {
  for (const r of REGIONS) {
    if (text.includes(r)) return r;
  }
  return "기타";
}

function extractLocation(text: string): string {
  // 서울, 경기 등 지역명 + 구체적 장소
  const locationPatterns = [
    /장소\s*[:\-]\s*(.+)/,
    /개최\s*장소\s*[:\-]\s*(.+)/,
    /집결지\s*[:\-]\s*(.+)/,
    /출발\s*[:\-]\s*(.+)/,
  ];
  for (const p of locationPatterns) {
    const match = text.match(p);
    if (match) return match[1].trim().substring(0, 50);
  }
  return "";
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await request.json();
    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "유효한 URL을 입력하세요." }, { status: 400 });
    }

    const res = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      maxRedirects: 5,
    });

    const $ = cheerio.load(res.data);

    // 메타 태그 추출
    const ogTitle = $('meta[property="og:title"]').attr("content") || "";
    const ogDesc = $('meta[property="og:description"]').attr("content") || "";
    const ogImage = $('meta[property="og:image"]').attr("content") || "";
    const pageTitle = $("title").text() || "";

    // 전체 텍스트 추출
    $("script, style, nav, footer, header").remove();
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const allText = `${ogTitle} ${ogDesc} ${pageTitle} ${bodyText}`;

    // 정보 추출
    const title = ogTitle || pageTitle || "";
    const dates = extractDates(allText);
    const distances = extractDistances(allText);
    const region = extractRegion(allText);
    const location = extractLocation(bodyText);

    // 날짜 분류: 가장 미래 날짜를 행사일로, 나머지를 접수기간으로 추정
    const today = new Date().toISOString().split("T")[0];
    const futureDates = dates.filter((d) => d >= today);
    const eventDate = futureDates.length > 0 ? futureDates[futureDates.length - 1] : dates[dates.length - 1] || "";
    const registrationEnd = futureDates.length > 1 ? futureDates[0] : "";

    const slug = title.replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "").toLowerCase();
    const event: Partial<MarathonEvent> = {
      id: `manual-${slug}-${eventDate}`,
      title: title.substring(0, 100),
      eventDate,
      registrationEnd: registrationEnd || undefined,
      location: location || "",
      region,
      distances: distances.length > 0 ? distances : ["기타"],
      sourceUrl: url,
      registrationUrl: url,
      registrationStatus: "접수중",
      posterUrl: ogImage ? new URL(ogImage, url).href : undefined,
      source: "수동등록",
    };

    return NextResponse.json({ event, rawDates: dates });
  } catch (error) {
    return NextResponse.json(
      { error: `URL을 불러올 수 없습니다: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
