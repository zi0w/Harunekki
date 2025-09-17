import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      return new Response('NONGSARO_API_KEY missing', {
        status: 500,
        headers: corsHeaders,
      });
    }

    const url = new URL('https://apis.data.go.kr/nongsaro/service/nvpcFdCkry/fdNmLst');
    url.search = new URLSearchParams({
      apiKey: apiKey,
      apiType: 'json',
      pageNo: '1',
      numOfRows: '30',
      schType: 'B',
      tema_ctg01: 'TM003',
    }).toString();

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Seasonal foods API error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
