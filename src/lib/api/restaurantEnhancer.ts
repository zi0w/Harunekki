import { supabase } from '@/lib/supabase/supabase';

export interface RestaurantEnhancementRequest {
  title: string;
  location: string;
  originalDescription?: string;
}

export interface RestaurantEnhancementResponse {
  enhancedDescription: string;
  success: boolean;
  error?: string;
}

// Supabase Edge Function을 사용하여 식당 설명을 개선하는 함수
export const enhanceRestaurantDescription = async (
  request: RestaurantEnhancementRequest,
): Promise<RestaurantEnhancementResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'enhance-restaurant-description',
      {
        body: {
          title: request.title,
          location: request.location,
          originalDescription: request.originalDescription,
        },
      },
    );

    if (error) {
      console.error('Restaurant enhancement error:', error);
      return {
        enhancedDescription:
          request.originalDescription ||
          `${request.title}은(는) ${request.location}에 위치한 맛있는 식당입니다.`,
        success: false,
        error: error.message,
      };
    }

    return {
      enhancedDescription:
        data?.enhancedDescription ||
        request.originalDescription ||
        `${request.title}은(는) ${request.location}에 위치한 맛있는 식당입니다.`,
      success: true,
    };
  } catch (error) {
    console.error('Restaurant enhancement error:', error);
    return {
      enhancedDescription:
        request.originalDescription ||
        `${request.title}은(는) ${request.location}에 위치한 맛있는 식당입니다.`,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
