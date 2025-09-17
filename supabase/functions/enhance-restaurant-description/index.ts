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

    const { title, location, originalDescription } = await req
      .json()
      .catch(() => ({}));

    if (!title || typeof title !== 'string') {
      return new Response('Invalid title', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const openai = new OpenAI({ apiKey });

    const system = `당신은 한국의 식당 정보 전문가입니다. 주어진 식당에 대한 정확하고 팩트 위주의 설명을 작성해주세요.

**요구사항:**
1. 실제 식당 정보를 기반으로 한 팩트 위주의 설명
2. 2-3문장으로 간결하게 작성
3. 식당의 특징과 메뉴, 분위기를 언급
4. 지역적 특색이 있다면 언급
5. 마케팅적이지 않고 객관적으로
6. 기존 설명이 있다면 그 내용을 참고하여 더 정확하게 개선
7. 설명만 작성하고 다른 내용은 포함하지 마세요

예시:
- 이 식당은 전통적인 한정식 전문점으로, 신선한 제철 재료를 사용한 정갈한 한정식 코스를 제공합니다. 조용하고 우아한 분위기에서 가족 모임이나 비즈니스 미팅에 적합한 공간입니다.
- 현지에서 오랫동안 사랑받아온 맛집으로, 특제 양념으로 조리한 대표 메뉴가 유명합니다. 넓은 주차 공간과 편안한 좌석으로 단체 손님들도 편리하게 이용할 수 있습니다.`;

    const prompt = `
식당명: ${title}
위치: ${location || '한국'}
기존 설명: ${originalDescription || '설명 없음'}

위 정보를 바탕으로 정확하고 팩트 위주의 식당 설명을 작성해주세요.`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.3, // 더 일관되고 정확한 결과를 위해 낮은 temperature
    });

    const enhancedDescription =
      resp.choices?.[0]?.message?.content?.trim() ??
      `${title}은(는) ${location ? `${location}에 위치한 ` : ''}맛있는 식당으로, 신선한 재료와 정성스러운 조리로 유명합니다.`;

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
    console.error('Restaurant description enhancement error:', e);

    // Fallback response
    const fallbackDescription = `${title}은(는) ${location ? `${location}에 위치한 ` : ''}맛있는 식당으로, 신선한 재료와 정성스러운 조리로 유명합니다.`;

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
