import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 인증 체크 (선택적)
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    console.warn('No authorization header provided, but continuing...');
  }

  try {
    const url = new URL(req.url);

    // path는 쿼리(path=...)와 경로 세그먼트(/areaBasedList2 등)를 모두 병합해서 사용
    const seg = url.pathname
      .replace(/.*tourapi-proxy\/?/, '')
      .replace(/^\/+/, '');
    let apiPath = (url.searchParams.get('path') || '').replace(/^\/+/, '');
    if (seg) {
      apiPath = apiPath ? `${apiPath.replace(/\/+$/, '')}/${seg}` : seg;
    }
    const serviceKey = Deno.env.get('TOURAPI_KEY');

    if (!apiPath || !serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // TourAPI 기본 URL 구성 (path가 전체 경로인지, 엔드포인트만 왔는지에 따라 처리)
    const root = 'https://apis.data.go.kr';
    const cleanPath = apiPath.replace(/^\/+/, '');

    let targetUrl = '';
    if (cleanPath.startsWith('B551011/')) {
      // 전체 경로가 넘어온 경우 (예: B551011/KorService2)
      targetUrl = `${root}/${cleanPath}`;
    } else {
      // 엔드포인트만 넘어온 경우 (예: areaBasedList2)
      targetUrl = `${root}/B551011/KorService2/${cleanPath}`;
    }

    // 요청 파라미터 구성
    const requestParams = new URLSearchParams();
    requestParams.set('serviceKey', serviceKey);
    requestParams.set('MobileOS', 'ETC');
    requestParams.set('MobileApp', 'harunekki');
    requestParams.set('_type', 'json');

    // 원본 요청의 쿼리 파라미터 추가
    const originalUrl = new URL(req.url);
    for (const [key, value] of originalUrl.searchParams.entries()) {
      if (
        !['path', 'serviceKey', 'MobileOS', 'MobileApp', '_type'].includes(key)
      ) {
        requestParams.set(key, value);
      }
    }

    const finalUrl = `${targetUrl}?${requestParams.toString()}`;

    console.log('TourAPI Proxy Request:', finalUrl);

    // TourAPI 호출
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Harunekki/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`TourAPI request failed: ${response.status}`);
    }

    const data = await response.text();

    return new Response(data, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('TourAPI Proxy Error:', error);

    return new Response(
      JSON.stringify({
        error: 'TourAPI proxy failed',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
