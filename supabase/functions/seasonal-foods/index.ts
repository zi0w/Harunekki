import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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

    const url = `https://apis.data.go.kr/nongsaro/service/nvpcFdCkry/fdNmLst?apiKey=${apiKey}&apiType=json&pageNo=1&numOfRows=30&schType=B&tema_ctg01=TM003`;

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

    const data = await response.json();
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
