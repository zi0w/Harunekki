import axios, { AxiosError } from 'axios';
import { supabase } from '../supabase/supabase';

const SERVICE_KEY = import.meta.env.VITE_TOURAPI_KEY; // 디코딩 키 그대로 사용

export async function fetchPopularRestaurants(limit = 50) {
  const { data, error } = await supabase
    .from('tour_pois')
    .select('*')
    .order('like_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
export async function searchKakaoPlaces(query: string) {
  const url = 'https://dapi.kakao.com/v2/local/search/keyword.json';
  const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

  const res = await axios.get(url, {
    params: { query },
    headers: {
      Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
    },
  });
  console.log('[KAKAO API KEY]', KAKAO_REST_API_KEY);
  return res.data.documents; // 배열
}
export type ListItem = {
  contentid: string;
  title: string;
  addr1?: string;
  firstimage?: string;
  firstimage2?: string;
  areacode?: string;
  sigungucode?: string;
  contenttypeid?: string;
  mapx?: string;
  mapy?: string;
};

export type ApiListResponse = {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: {
      items: { item: ListItem[] } | null;
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
};

const clientV2 = axios.create({
  baseURL: '/tourapi/B551011/KorService2',
  timeout: 15000,
  headers: { Accept: 'application/json' },
  params: {
    serviceKey: SERVICE_KEY,
    MobileOS: 'ETC',
    MobileApp: 'harunekki',
    _type: 'json',
  },
  validateStatus: (s) => s >= 200 && s < 300,
});

const clientV2Detail = axios.create({
  baseURL: '/tourapi/B551011/KorService2',
  timeout: 15000,
  headers: { Accept: 'application/json' },
  validateStatus: (s) => s >= 200 && s < 300,
});

function attachInterceptor(c: typeof clientV2) {
  c.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      if (!error.response) {
        // 응답 자체가 없음 (ex: CORS, DNS 오류, 서버 죽음 등)
        return Promise.reject(
          new Error(`[HTTP ❌ NO RESPONSE] ${error.message}`),
        );
      }

      const status = error.response.status;
      const data = error.response.data;
      let snippet = '';
      try {
        snippet =
          typeof data === 'string'
            ? data.slice(0, 300)
            : (JSON.stringify(data)?.slice(0, 300) ?? '');
      } catch {
        /* noop */
      }
      return Promise.reject(
        new Error(`[HTTP ${status}] ${snippet || 'No payload'}`),
      );
    },
  );
}

attachInterceptor(clientV2);
attachInterceptor(clientV2Detail);

function ensureJson<T>(data: unknown): T {
  if (typeof data === 'string') {
    const s = data.trim();
    if (s.startsWith('<')) {
      throw new Error(`Non-JSON payload (XML/HTML): ${s.slice(0, 200)}`);
    }
    try {
      return JSON.parse(s) as T;
    } catch {
      throw new Error(`String payload is not JSON: ${s.slice(0, 200)}`);
    }
  }
  return data as T;
}
function safeSnippet(v: unknown): string {
  try {
    return JSON.stringify(v)?.slice(0, 300) ?? '';
  } catch {
    return '';
  }
}
function guardBody(json: ApiListResponse, debugPrefix: string) {
  if (!json?.response) {
    const snippet = safeSnippet(json);
    throw new Error(
      `${debugPrefix}: unexpected payload (no 'response'). ${snippet}`,
    );
  }
  const header = json.response.header;
  if (!header) {
    const snippet = safeSnippet(json.response);
    throw new Error(`${debugPrefix}: missing response.header. ${snippet}`);
  }
  const body = json.response.body;
  if (!body) {
    const { resultCode, resultMsg } = header;
    throw new Error(
      `${debugPrefix}: missing response.body (code=${resultCode}, msg=${resultMsg})`,
    );
  }
  return body;
}

// 간단 에러(JSON) 포맷 감지 & throw

function hasKey(o: unknown, key: string): o is Record<string, unknown> {
  return typeof o === 'object' && o !== null && key in o;
}

function isSimpleErrorPayload(
  v: unknown,
): v is { resultCode?: unknown; resultMsg?: unknown } {
  return hasKey(v, 'resultCode') || hasKey(v, 'resultMsg');
}

function getStringProp(o: unknown, key: string): string | undefined {
  if (!hasKey(o, key)) return undefined;
  const val = (o as Record<string, unknown>)[key];
  return typeof val === 'string' ? val : undefined;
}

function throwIfSimpleError(v: unknown, where: string): void {
  if (isSimpleErrorPayload(v)) {
    const code = getStringProp(v, 'resultCode') ?? 'UNKNOWN';
    const msg = getStringProp(v, 'resultMsg') ?? 'Unknown error';
    throw new Error(`${where}: ${code} - ${msg}`);
  }
}

/** 지역 코드 목록 */
export async function fetchAreaCodes() {
  const { data } = await clientV2.get('/areaCode2', {
    params: { numOfRows: 50 },
  });
  const json = ensureJson<ApiListResponse>(data);
  const body = guardBody(json, 'areaCode2');
  return body.items?.item ?? [];
}

/** 지역/카테고리 목록 */
export async function fetchAreaBasedList({
  areaCode,
  sigunguCode,
  contentTypeId,
  pageNo = 1,
  numOfRows = 20,
  arrange = 'Q',
  signal,
  keyword,
}: {
  areaCode?: number;
  sigunguCode?: number;
  contentTypeId?: number;
  pageNo?: number;
  numOfRows?: number;
  arrange?: 'A' | 'C' | 'D' | 'O' | 'Q' | 'R';
  signal?: AbortSignal;
  keyword?: string;
}) {
  const endpoint = keyword ? '/searchKeyword2' : '/areaBasedList2';

  const { data } = await clientV2.get(endpoint, {
    params: {
      arrange,
      pageNo,
      numOfRows,
      areaCode,
      sigunguCode,
      contentTypeId,
      ...(keyword ? { keyword } : {}),
    },
    signal,
  });

  const json = ensureJson<ApiListResponse>(data);
  const body = guardBody(json, endpoint.replace('/', ''));

  const items = body.items?.item ?? [];

  await Promise.all(
    items.map((item) =>
      supabase.from('tour_pois').upsert({
        contentid: item.contentid,
        title: item.title,
        addr1: item.addr1,
        firstimage: item.firstimage,
        firstimage2: item.firstimage2,
        areacode: item.areacode ? parseInt(item.areacode) : undefined,
        sigungucode: item.sigungucode ? parseInt(item.sigungucode) : undefined,
        contenttypeid: item.contenttypeid
          ? parseInt(item.contenttypeid)
          : undefined,
        mapx: item.mapx ? parseFloat(item.mapx) : undefined,
        mapy: item.mapy ? parseFloat(item.mapy) : undefined,
        raw: item,
        updated_at: new Date().toISOString(),
      }),
    ),
  );

  return {
    items,
    total: body.totalCount ?? 0,
  };
}

/** 상세 — 설명(overview) 제거 */
export type DetailCommonItem = {
  contentid: string;
  title?: string;
  addr1?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
};

export async function fetchDetailCommon(
  contentId: string,
): Promise<DetailCommonItem> {
  const { data } = await clientV2Detail.get('/detailCommon2', {
    params: {
      serviceKey: SERVICE_KEY,
      contentId,
      MobileOS: 'ETC',
      MobileApp: 'harunekki',
      _type: 'json',
    },
  });
  throwIfSimpleError(data, 'detailCommon2');
  const json = ensureJson<ApiListResponse>(data);
  const body = guardBody(json, 'detailCommon2');
  return (body.items?.item?.[0] ?? {}) as DetailCommonItem;
}
