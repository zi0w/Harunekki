import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// XML을 JSON으로 변환하는 함수
const parseXmlToJson = (xmlText: string): any => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const result: any = {};
    const response = xmlDoc.querySelector('response');
    if (response) {
      result.response = {};
      const header = response.querySelector('header');
      if (header) {
        result.response.header = {};
        const resultCode = header.querySelector('resultCode')?.textContent;
        const resultMsg = header.querySelector('resultMsg')?.textContent;
        result.response.header.resultCode = resultCode;
        result.response.header.resultMsg = resultMsg;
      }
      const body = response.querySelector('body');
      if (body) {
        result.response.body = {};
        const items = body.querySelectorAll('item');
        if (items.length > 0) {
          result.response.body.items = Array.from(items).map((item) => {
            const itemData: any = {};
            Array.from(item.children).forEach((child) => {
              itemData[child.tagName] = child.textContent;
            });
            return itemData;
          });
        }
      }
    }
    return result;
  } catch (error) {
    console.error('XML 파싱 실패:', error);
    return {};
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== 'GET') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    const apiKey = Deno.env.get('NONGSARO_API_KEY');
    if (!apiKey) {
      console.error('NONGSARO_API_KEY missing');
      return new Response('NONGSARO_API_KEY missing', {
        status: 500,
        headers: corsHeaders,
      });
    }

    const url = `http://api.nongsaro.go.kr/service/nvpcFdCkry/fdNmLst?apikey=${apiKey}&schType=B&tema_ctg01=TM003&numOfRows=10`;

    console.log('Fetching from:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Supabase-Edge-Function)',
      },
    });

    if (!response.ok) {
      console.error(`API 호출 실패: ${response.status}`);
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    // XML 응답을 텍스트로 받아서 처리
    const xmlText = await response.text();
    console.log('XML 응답:', xmlText.substring(0, 200) + '...');

    // XML을 JSON으로 변환하는 간단한 파싱
    const data = parseXmlToJson(xmlText);
    console.log('API response received:', data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Seasonal foods API error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  }
});
