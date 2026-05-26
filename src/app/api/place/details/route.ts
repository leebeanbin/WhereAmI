import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';

export interface PlaceOpenHour {
  label: string;
  time: string;
}

export interface PlaceReview {
  author: string;
  text: string;
  rating: number;
}

export interface PlaceMenu {
  name: string;
  price: string | null;
}

export interface PlaceDetailsDto {
  isOpen: boolean | null;
  openDesc: string | null;
  openHours: PlaceOpenHour[];
  rating: number | null;
  reviewCount: number | null;
  reviews: PlaceReview[];
  menus: PlaceMenu[];
  homepage: string | null;
  tags: string[];
}

const EMPTY: PlaceDetailsDto = {
  isOpen: null,
  openDesc: null,
  openHours: [],
  rating: null,
  reviewCount: null,
  reviews: [],
  menus: [],
  homepage: null,
  tags: [],
};

const HTML_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  'Referer': 'https://map.kakao.com/',
};

const JSON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Referer': 'https://map.kakao.com/',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Origin': 'https://map.kakao.com',
};

const FALLBACK_URLS = (id: string) => [
  `https://place.map.kakao.com/places/${id}`,
  `https://place.map.kakao.com/main/v/${id}`,
  `https://place.map.kakao.com/m/main/v/${id}`,
];

async function fetchPlaceData(placeId: string): Promise<{ data: any; source: string } | null> {
  // Primary: official Kakao Place web page — extract __NEXT_DATA__ embedded JSON
  try {
    const url = `https://place.kakao.com/stores/${placeId}`;
    const res = await fetch(url, { headers: HTML_HEADERS, cache: 'no-store' });
    if (res.ok) {
      const html = await res.text();
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (m?.[1]) {
        const nextData = JSON.parse(m[1]);
        console.log(`[place/details] __NEXT_DATA__ found at ${url}`);
        return { data: nextData, source: 'nextData' };
      }
      // Try alternate JSON embed patterns
      const m2 = html.match(/window\.__APP_DATA__\s*=\s*({[\s\S]*?});\s*<\/script>/);
      if (m2?.[1]) {
        return { data: JSON.parse(m2[1]), source: 'appData' };
      }
      console.warn(`[place/details] no embedded JSON at ${url} (${res.status})`);
    } else {
      console.warn(`[place/details] ${res.status} at place.kakao.com/stores/${placeId}`);
    }
  } catch (e: any) {
    console.warn(`[place/details] place.kakao.com failed: ${e.message}`);
  }

  // Fallback: try legacy API endpoints
  for (const url of FALLBACK_URLS(placeId)) {
    try {
      const res = await fetch(url, { headers: JSON_HEADERS, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        console.log(`[place/details] OK: ${url}`);
        return { data, source: 'legacy' };
      }
      console.warn(`[place/details] ${res.status}: ${url}`);
    } catch (e: any) {
      console.warn(`[place/details] error on ${url}: ${e.message}`);
    }
  }
  return null;
}

function extractFromNextData(nextData: any): any {
  const pageProps = nextData?.props?.pageProps ?? {};
  // Try common Next.js page data shapes from Kakao Place
  return (
    pageProps?.initialState?.place ??
    pageProps?.initialState ??
    pageProps?.placeData ??
    pageProps?.place ??
    pageProps?.placeInfo ??
    pageProps?.data ??
    pageProps
  );
}

function parseDetails(data: any, source: string): PlaceDetailsDto {
  let root = data;

  if (source === 'nextData') {
    root = extractFromNextData(data);
  } else if (source === 'appData') {
    root = data?.place ?? data;
  }

  const basicInfo = root.basicInfo ?? root.place ?? {};
  const openHour = basicInfo.openHour ?? root.openHour ?? {};
  const realtime = openHour.realtime ?? root.realtime ?? null;
  const comment = root.comment ?? root.reviews ?? {};
  const menuInfo = root.menuInfo ?? root.menu ?? {};

  const homepage: string | null =
    basicInfo.homepage || basicInfo.homepageList?.[0] || root.homepage || null;

  const tags: string[] = [
    ...(basicInfo.tags?.map((t: any) => t.tag ?? t).filter(Boolean) ?? []),
    ...(basicInfo.phyTag?.map((t: any) => t.tag ?? t).filter(Boolean) ?? []),
    ...(root.tags?.map((t: any) => t.tag ?? t ?? '').filter(Boolean) ?? []),
  ].slice(0, 8);

  const openRaw = realtime?.open ?? root.isOpen;
  const isOpen =
    openRaw === 'Y' || openRaw === true || openRaw === 'True'
      ? true
      : openRaw === 'N' || openRaw === false || openRaw === 'False'
        ? false
        : null;
  const openDesc: string | null = realtime?.desc ?? root.openDesc ?? null;

  const openHours: PlaceOpenHour[] = [];
  for (const period of openHour.periodList ?? root.periodList ?? []) {
    for (const t of period.timeList ?? []) {
      if (t.timeName && t.timeSE) {
        openHours.push({ label: t.timeName, time: t.timeSE });
      }
    }
  }
  for (const h of root.hours ?? []) {
    if (h.label && h.time) openHours.push({ label: h.label, time: h.time });
  }

  const scorecnt = Number(comment.scorecnt ?? comment.count ?? 0);
  const scoresum = Number(comment.scoresum ?? 0);
  const rating = scorecnt > 0 ? Math.round((scoresum / scorecnt) * 10) / 10
    : root.rating ? Number(root.rating) : null;
  const reviewCount = Number(comment.kamapComntcnt ?? comment.commentCount ?? comment.total ?? 0) || null;

  const reviews: PlaceReview[] = (comment.list ?? comment.items ?? root.reviews ?? [])
    .slice(0, 4)
    .map((r: any) => ({
      author: r.username || r.userInfo?.nickName || r.userInfo?.fullName || r.author || '모험가',
      text: r.contents || r.text || r.body || '',
      rating: Number(r.point ?? r.score ?? r.rating ?? 0),
    }))
    .filter((r: PlaceReview) => r.text.length > 0);

  const menus: PlaceMenu[] = (menuInfo.menuList ?? root.menus ?? [])
    .slice(0, 10)
    .map((m: any) => ({
      name: m.menu || m.name || '',
      price: m.price ? String(m.price).replace(/원$/, '').trim() : null,
    }))
    .filter((m: PlaceMenu) => m.name.length > 0);

  return { isOpen, openDesc, openHours, rating, reviewCount, reviews, menus, homepage, tags };
}

export async function GET(request: Request) {
  const parser = RequestParser.from(request);
  const placeId = parser.requireString('placeId');

  if (!placeId) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'placeId가 필요합니다.');
  }

  try {
    const result = await fetchPlaceData(placeId);
    if (!result) return ApiResponse.ok<PlaceDetailsDto>(EMPTY);
    return ApiResponse.ok<PlaceDetailsDto>(parseDetails(result.data, result.source));
  } catch (e: any) {
    console.warn('[place/details] unexpected error:', e.message);
    return ApiResponse.ok<PlaceDetailsDto>(EMPTY);
  }
}
