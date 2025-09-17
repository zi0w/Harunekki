// src/pages/foods/SeasonalFoodDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import ArrowLocation from '@/assets/icons/home/location.svg';
import { useEnhancedDescription } from '@/hooks/useEnhancedDescription';

// 제철 음식 상세 정보 타입
type DetailModel = {
  id: string;
  title: string;
  location: string;
  img: string;
  description: string;
};

export default function SeasonalFoodDetailPage() {
  const [params] = useSearchParams();
  const contentId = params.get('id') ?? '';

  const { state } = useLocation() as {
    state?: { item?: Partial<DetailModel> };
  };
  const seed = state?.item;

  const [detail, setDetail] = useState<DetailModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // 상세 로드
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        setErrMsg(null);

        // state 기반 초기값 설정
        const base: DetailModel | null = seed
          ? {
              id: String(contentId || seed.id || ''),
              title: seed.title ?? '',
              location: seed.location ?? '',
              img: seed.img ?? '',
              description: seed.description ?? '',
            }
          : null;
        if (!cancelled && base) setDetail(base);
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : '상세 정보를 불러오지 못했습니다.';
        if (!cancelled) setErrMsg(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
      if (!contentId) {
        setErrMsg('잘못된 접근입니다.');
        setLoading(false);
        return;
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [contentId, seed]);

  const title = useMemo(
    () => detail?.title || '제철 음식 상세',
    [detail?.title],
  );

  // 설명 개선 훅 사용
  const { description: enhancedDescription, isEnhancing } =
    useEnhancedDescription({
      title: detail?.title || '',
      originalDescription: detail?.description,
      location: detail?.location,
      enabled: !!detail?.title,
    });

  return (
    <div className="mx-auto w-full max-w-[20.9375rem] overflow-x-hidden">
      {/* 본문 */}
      <div className="px-4 pb-8">
        {/* 이미지 */}
        <div className="mt-3 rounded-2xl overflow-hidden bg-[#F4F5F7]">
          {detail?.img ? (
            <img
              src={detail.img}
              alt={title}
              className="w-full object-cover flex h-[19.75rem] items-center gap-3 self-stretch"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-[220px] bg-[#E9ECF1]" />
          )}
        </div>

        {/* 타이틀 */}
        <h2 className="mt-4 font-kakaoBig text-[18px] text-[#383D48]">
          {title}
        </h2>

        {/* 주소 */}
        <div className="mt-2 flex items-center gap-1 text-[#596072]">
          <img src={ArrowLocation} className="w-4 h-4" alt="" />
          <span className="font-kakaoSmall text-[14px] leading-6 tracking-[-0.0175rem]">
            {detail?.location || '주소 정보 없음'}
          </span>
        </div>

        {/* 설명 */}
        <div className="mt-4">
          {isEnhancing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <p className="text-[#596072] font-kakaoSmall text-[14px] leading-6 tracking-[-0.0175rem]">
                더 나은 설명을 준비하고 있어요...
              </p>
            </div>
          ) : (
            <p className="text-[#596072] font-kakaoSmall text-[14px] leading-6 tracking-[-0.0175rem]">
              {enhancedDescription ||
                detail?.description ||
                '제철 음식에 대한 설명이 없습니다.'}
            </p>
          )}
        </div>

        {/* 로딩/에러 상태 */}
        {loading && (
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-[#eee] rounded" />
            <div className="h-4 bg-[#eee] rounded w-5/6" />
            <div className="h-4 bg-[#eee] rounded w-2/3" />
          </div>
        )}
        {errMsg && !loading && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errMsg}
          </div>
        )}
      </div>
    </div>
  );
}
