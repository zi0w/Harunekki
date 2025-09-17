import OpenAI from 'https://esm.sh/openai@4.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 필요 시 특정 도메인으로 제한 가능
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // 1) Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response('OPENAI_API_KEY missing', {
        status: 500,
        headers: corsHeaders,
      });
    }

    const { query, previousRecommendations, conversationHistory } = await req
      .json()
      .catch(() => ({}));
    if (!query || typeof query !== 'string') {
      return new Response('Invalid query', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const openai = new OpenAI({ apiKey });

    const system = `너는 한국어로 답하는 여행 음식 추천 도우미 밥풀이야.

**절대 규칙:**
1. 반드시 "○○는 어떠세요?" 로 시작
2. 줄글로만 설명 (장소:, 메뉴:, 추천이유: 등 절대 사용 금지)
3. 이전 추천과 겹치지 않기

${
  previousRecommendations
    ? `이전 추천: ${previousRecommendations.join(', ')}`
    : ''
}

예시: "노랑가오리회는 어떠세요? 실제로 숙성시킨 노랑가오리 회는 살짝 담백하며 처음에는 부드럽지만 씹을수록 쫄깃한 식감이 나요. 간(애)도 별미인데 부드러우면서 기름진 맛이랍니다! 살의 빛깔은 흰색에 가까운 분홍빛이지만 중간중간 진하고 영롱한 붉은빛이 감돌고, 간은 살짝 노랑에서 분홍 색상을 띄어요. 전라도 지역에서는 노랑가오리를 전문으로 취급하는 식당이 간혹 있어서 드셔보시면 좋은 추억이 될거에요! 보통 기름, 소금을 찍고 깻잎장아찌에 같이 싸서 먹는데, 장아찌의 맛이 강하므로 노랑가오리 회의 담백함을 느끼고 싶다면 기름, 소금만 살짝 찍어서 먹으면 좋아요!"`;

    // 대화 히스토리 구성
    const messages = [{ role: 'system', content: system }];

    // 이전 대화 내용 추가
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // 현재 사용자 메시지 추가
    messages.push({ role: 'user', content: query });

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3, // 더 일관된 응답을 위해 낮춤
      messages,
    });

    const text =
      resp.choices?.[0]?.message?.content ?? '추천을 생성하지 못했어요.';
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e) {
    console.error(e);
    return new Response('Server error', { status: 500, headers: corsHeaders });
  }
});
