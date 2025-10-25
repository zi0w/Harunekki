import type { VercelRequest, VercelResponse } from '@vercel/node';

const TOURAPI_KEY = process.env.VITE_TOURAPI_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path = [], ...rest } = req.query as Record<string, any>;
  const segs = Array.isArray(path) ? path.join('/') : String(path || '');

  // 1. 원본 URL 구성
  const url = new URL(`https://apis.data.go.kr/${segs}`);

  // 2. 쿼리 파라미터 복사
  Object.entries(rest).forEach(([k, v]) => {
    (Array.isArray(v) ? v : [v]).forEach((vv) =>
      url.searchParams.append(k, String(vv)),
    );
  });

  // ✅ 3. 핵심 수정: TourAPI 키 추가 (누락 시 403 에러 발생 방지)
  if (TOURAPI_KEY) {
    // 키가 이미 쿼리에 있다면 덮어쓰거나, 없다면 새로 추가
    url.searchParams.set('serviceKey', TOURAPI_KEY);
  } else {
    console.error('Vercel 환경 변수 TOURAPI_KEY가 설정되지 않았습니다.');
    return res.status(500).send('API Key is missing on the server.');
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }

  // Upstream 요청 수행
  const upstream = await fetch(url.toString(), { method: 'GET' });
  const body = Buffer.from(await upstream.arrayBuffer());

  // CORS 헤더 설정 (이전과 동일)
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  return res.status(upstream.status).send(body);
}
