import OpenAI from 'https://esm.sh/openai@4.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Preflight
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

    const { title, originalDescription, location } = await req
      .json()
      .catch(() => ({}));

    if (!title || typeof title !== 'string') {
      return new Response('Invalid title', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const openai = new OpenAI({ apiKey });

    const system = `너는 한국의 제철음식 전문가야. 주어진 제철음식에 대한 매력적이고 자연스러운 설명을 작성해줘.

**요구사항:**
1. 기존 설명이 있다면 그 내용을 기반으로 더 매끄럽고 자연스럽게 개선
2. 기존 설명이 없다면 음식의 특징과 맛을 생생하게 표현
3. 2-3문장으로 간결하게 작성
4. 제철음식의 특징과 맛을 강조
5. 계절적 특성을 언급
6. 자연스럽고 친근한 톤
7. 마케팅적이지 않고 진정성 있게
8. 설명만 작성하고 다른 내용은 포함하지 마세요

예시:
- 도토리밥은 가을의 대표적인 제철음식으로, 도토리의 고소한 맛과 쫄깃한 식감이 일품이에요. 특히 충청북도 지역에서는 전통적인 방식으로 조리한 도토리밥을 맛볼 수 있어 계절의 정취를 느낄 수 있습니다.
- 신선한 제철 재료로 만든 이 음식은 계절의 맛을 그대로 담고 있어요. 지역 특색이 잘 드러나는 전통적인 조리법으로 만들어져 더욱 특별한 맛을 자랑합니다.`;

    const prompt = `
음식명: ${title}
지역: ${location || '한국'}
기존 설명: ${originalDescription || '설명 없음'}

위 정보를 바탕으로 매력적인 제철음식 설명을 작성해주세요.`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const enhancedDescription =
      resp.choices?.[0]?.message?.content?.trim() ??
      `${title}은(는) ${location ? `${location}의 ` : ''}제철 음식으로, 신선하고 맛있는 특색을 자랑합니다.`;

    return new Response(
      JSON.stringify({
        enhancedDescription,
        success: true,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  } catch (e) {
    console.error('Description enhancement error:', e);

    // Fallback response
    const fallbackDescription = `${title}은(는) ${location ? `${location}의 ` : ''}제철 음식으로, 신선하고 맛있는 특색을 자랑합니다.`;

    return new Response(
      JSON.stringify({
        enhancedDescription: fallbackDescription,
        success: false,
        error: 'Server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  }
});
