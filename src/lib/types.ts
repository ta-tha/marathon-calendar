export interface MarathonEvent {
  id: string;
  title: string;
  eventDate: string; // ISO 8601 (YYYY-MM-DD) - 행사일 (캘린더 배치 기준)
  registrationStart?: string; // ISO 8601 - 접수 시작일
  registrationEnd?: string; // ISO 8601 - 접수 마감일
  location: string;
  region: Region;
  distances: string[]; // e.g. ["풀코스", "하프", "10K"]
  fee?: string;
  registrationUrl?: string;
  sourceUrl: string;
  registrationStatus: RegistrationStatus;
  organizer?: string;
  posterUrl?: string; // 대회 포스터/OG 이미지 URL
  source: string; // 수집 출처 사이트명
}

export type Region =
  | "서울"
  | "경기"
  | "인천"
  | "부산"
  | "대구"
  | "대전"
  | "광주"
  | "울산"
  | "세종"
  | "강원"
  | "충북"
  | "충남"
  | "전북"
  | "전남"
  | "경북"
  | "경남"
  | "제주"
  | "기타";

export type RegistrationStatus = "접수중" | "접수예정" | "접수마감";

export const REGIONS: Region[] = [
  "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];
