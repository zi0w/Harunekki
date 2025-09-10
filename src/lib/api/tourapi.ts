import axios, { AxiosError } from 'axios';

const SERVICE_KEY = import.meta.env.VITE_TOURAPI_KEY; // 디코딩 키 그대로 사용

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
      const status = error.response?.status;
      const data = error.response?.data as unknown;
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
  return {
    items: body.items?.item ?? [],
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
// src/lib/api/tourapi.ts
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
