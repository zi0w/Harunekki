// 제철음식 설명 개선을 위한 Supabase Edge Function 호출

import { supabase } from '@/lib/supabase/supabase';

export interface DescriptionEnhancementRequest {
  title: string;
  originalDescription?: string;
  location?: string;
}

export interface DescriptionEnhancementResponse {
  enhancedDescription: string;
  success: boolean;
  error?: string;
}

// Supabase Edge Function을 사용하여 제철음식 설명을 개선하는 함수
export const enhanceSeasonalFoodDescription = async (
  request: DescriptionEnhancementRequest,
): Promise<DescriptionEnhancementResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'enhance-description',
      {
        body: {
          title: request.title,
          originalDescription: request.originalDescription,
          location: request.location,
        },
      },
    );

    if (error) {
      throw new Error(`Supabase Function 호출 실패: ${error.message}`);
    }

    if (!data || !data.enhancedDescription) {
      throw new Error('설명 개선 결과를 받지 못했습니다.');
    }

    return {
      enhancedDescription: data.enhancedDescription,
      success: data.success || true,
    };
  } catch (error) {
    console.error('설명 개선 실패:', error);

    // Fallback: 기존 설명이나 기본 설명 사용
    const fallbackDescription =
      request.originalDescription ||
      `${request.title}은(는) ${request.location ? `${request.location}의 ` : ''}제철 음식으로, 신선하고 맛있는 특색을 자랑합니다.`;

    return {
      enhancedDescription: fallbackDescription,
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
};

// 여러 제철음식 설명을 일괄 개선하는 함수
export const enhanceMultipleDescriptions = async (
  items: Array<{
    id: string;
    title: string;
    originalDescription?: string;
    location?: string;
  }>,
): Promise<Map<string, string>> => {
  const enhancedDescriptions = new Map<string, string>();

  // API 호출을 순차적으로 처리 (rate limit 방지)
  for (const item of items) {
    try {
      const result = await enhanceSeasonalFoodDescription({
        title: item.title,
        originalDescription: item.originalDescription,
        location: item.location,
      });

      enhancedDescriptions.set(item.id, result.enhancedDescription);

      // API 호출 간격 조절 (1초 대기)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`설명 개선 실패 (${item.title}):`, error);
      // 실패 시 기존 설명 사용
      enhancedDescriptions.set(
        item.id,
        item.originalDescription || `${item.title}에 대한 제철 음식입니다.`,
      );
    }
  }

  return enhancedDescriptions;
};
