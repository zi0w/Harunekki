import { useState, useEffect } from 'react';
import { enhanceRestaurantDescription } from '@/lib/api/restaurantEnhancer';

interface UseRestaurantEnhancedDescriptionProps {
  title: string;
  location: string;
  originalDescription?: string;
  enabled?: boolean;
}

export const useRestaurantEnhancedDescription = ({
  title,
  location,
  originalDescription,
  enabled = true,
}: UseRestaurantEnhancedDescriptionProps) => {
  const [description, setDescription] = useState(originalDescription || '');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // 항상 AI 설명을 생성하되, 기존 설명이 있으면 그것을 기반으로 개선
    setIsEnhancing(true);
    setError(null);

    enhanceRestaurantDescription({
      title,
      location,
      originalDescription,
    })
      .then((result) => {
        if (result.success) {
          setDescription(result.enhancedDescription);
        } else {
          setDescription(
            originalDescription || `${title}에 대한 식당 정보입니다.`,
          );
          setError(result.error || '설명 개선 실패');
        }
      })
      .catch((err) => {
        console.error('식당 설명 개선 중 오류:', err);
        setDescription(
          originalDescription || `${title}에 대한 식당 정보입니다.`,
        );
        setError(err.message || '알 수 없는 오류');
      })
      .finally(() => {
        setIsEnhancing(false);
      });
  }, [title, location, originalDescription, enabled]);

  return {
    description,
    isEnhancing,
    error,
  };
};
