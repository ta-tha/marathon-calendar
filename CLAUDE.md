# 마라톤 캘린더 프로젝트 규칙

## 수동 대회 등록 규칙

사용자가 마라톤/런닝 대회 URL을 보내주면:

1. **페이지 HTML을 먼저 확인** - cheerio 방식으로 텍스트 추출 가능한지 판단
2. **이미지 기반 사이트인 경우** - 페이지의 이미지를 다운로드하여 직접 분석 (Vision)
3. **추출할 정보**: 대회명, 행사일, 접수기간(시작/마감), 장소, 지역, 종목(거리), 참가비, 접수 URL, 주최, 접수상태, 포스터 이미지 URL
4. **`public/data/manual-events.json`에 직접 등록** - 기존 데이터를 읽고 새 이벤트를 추가
5. **등록 후 바로 커밋 & 푸시** - Vercel 자동 배포 트리거

### 이벤트 데이터 형식
```json
{
  "id": "manual-{슬러그}-{날짜}",
  "title": "대회명",
  "eventDate": "YYYY-MM-DD",
  "registrationStart": "YYYY-MM-DD",
  "registrationEnd": "YYYY-MM-DD",
  "location": "장소",
  "region": "서울|경기|인천|부산|대구|대전|광주|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주|기타",
  "distances": ["풀코스", "하프", "10K", "5K", ...],
  "fee": "참가비",
  "registrationUrl": "접수 URL",
  "sourceUrl": "원본 페이지 URL",
  "registrationStatus": "접수중|접수예정|접수마감",
  "organizer": "주최",
  "posterUrl": "포스터 이미지 URL",
  "source": "수동등록"
}
```

## 프로젝트 구조
- Next.js 16 (App Router) + Tailwind CSS + Glassmorphism 디자인
- NextAuth v5 (Google OAuth) - 관리자: heensbee@gmail.com
- 크롤링: 마라톤GO + 러너블 (매일 새벽 3시 GitHub Actions)
- 배포: Vercel (marathon-calendar.vercel.app)

## 주요 파일
- `public/data/events.json` - 크롤러 수집 데이터
- `public/data/manual-events.json` - 수동 등록 데이터
- `src/app/admin/page.tsx` - 관리자 페이지 (/admin)
- `src/app/api/admin/scrape/route.ts` - URL 스크래핑 API
- `src/app/api/manual-events/route.ts` - 수동 이벤트 CRUD API
- `.github/workflows/crawl.yml` - 크롤링 워크플로우
