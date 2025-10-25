import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path = [], ...rest } = req.query as Record<string, any>;
  const segs = Array.isArray(path) ? path.join('/') : String(path || '');

  // 원본 URL 구성
  const url = new URL(`https://apis.data.go.kr/${segs}`);
  // ⚠️ 쿼리 전부 보존 (필터 다 살아감)
  Object.entries(rest).forEach(([k, v]) => {
    (Array.isArray(v) ? v : [v]).forEach((vv) =>
      url.searchParams.append(k, String(vv)),
    );
  });

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }

  const upstream = await fetch(url.toString(), { method: 'GET' });
  const body = Buffer.from(await upstream.arrayBuffer());

  // CORS 헤더 "하나만" (원본 서버의 중복값 무시)
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  return res.status(upstream.status).send(body);
}
