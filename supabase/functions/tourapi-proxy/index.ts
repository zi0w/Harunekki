import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const apiPath = url.searchParams.get('path');
    const serviceKey = Deno.env.get('TOURAPI_KEY');

    if (!apiPath || !serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // TourAPI 기본 URL
    const baseUrl = 'https://apis.data.go.kr/B551011/KorService2';
    const targetUrl = `${baseUrl}/${apiPath}`;

    // 요청 파라미터 구성
    const requestParams = new URLSearchParams();
    requestParams.set('serviceKey', serviceKey);
    requestParams.set('MobileOS', 'ETC');
    requestParams.set('MobileApp', 'harunekki');
    requestParams.set('_type', 'json');

    // 원본 요청의 쿼리 파라미터 추가
    const originalUrl = new URL(req.url);
    for (const [key, value] of originalUrl.searchParams.entries()) {
      if (key !== 'path') {
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
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
