import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ArrowLocation from '@/assets/icons/home/location.svg';
import LikeLocation from '@/assets/icons/home/heart.svg';
import HeartIcon from '@/assets/icons/like/heart.svg';
import HeartFilledIcon from '@/assets/icons/like/heartClicked.svg';
import { supabase } from '@/lib/supabase/supabase';
import { ensureUserExists, toggleLike } from '@/lib/supabase/likes';
import { useRestaurantEnhancedDescription } from '@/hooks/useRestaurantEnhancedDescription';

// 식당 상세 정보 타입
type DetailModel = {
  id: string;
  title: string;
  location: string;
  img: string;
  views: number;
  liked: boolean;
  likeCount: number;
  description?: string;
};

const RestaurantDetailPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<DetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  // 식당 설명 개선 훅 사용
  const { description: enhancedDescription, isEnhancing } =
    useRestaurantEnhancedDescription({
      title: detail?.title || '',
      location: detail?.location || '',
      originalDescription: detail?.description,
      enabled: !!detail?.title,
    });

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        setErrMsg(null);

        // URL 파라미터에서 ID 가져오기
        const id = searchParams.get('id');
        if (!id) {
          setErrMsg('식당 정보를 찾을 수 없습니다.');
          return;
        }

        // state에서 데이터 가져오기 (홈페이지에서 전달된 데이터)
        const item = location.state?.item;
        if (item) {
          setDetail({
            id: item.id,
            title: item.title,
            location: item.location,
            img: item.img,
            views: item.views || 0,
            liked: item.liked || false,
            likeCount: item.likeCount || 0,
          });
        } else {
          setErrMsg('식당 정보를 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('식당 상세 정보 로드 실패:', error);
        setErrMsg('식당 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [searchParams, location.state]);

  const handleToggleLike = async () => {
    if (!detail) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await ensureUserExists();
    } catch (e) {
      alert(e instanceof Error ? e.message : '유저 확인 중 오류');
      return;
    }

    setIsTogglingLike(true);

    try {
      const { liked, likeCount } = await toggleLike(detail.id);
      setDetail((prev) => (prev ? { ...prev, liked, likeCount } : null));
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : '좋아요 처리 중 오류가 발생했어요.',
      );
    } finally {
      setIsTogglingLike(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[20.9375rem] overflow-x-hidden">
      {/* 본문 */}
      <div className="px-4 pb-8">
        {/* 이미지 */}
        <div className="mt-3 rounded-2xl overflow-hidden bg-[#F4F5F7]">
          {detail?.img ? (
            <img
              src={detail.img}
              alt={detail.title}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full aspect-square bg-[#E9ECF1] flex items-center justify-center">
              <p className="text-[#8A8A8A] text-sm">이미지 없음</p>
            </div>
          )}
        </div>

        {/* 제목과 위치 */}
        <div className="mt-4">
          <h1 className="text-[#383D48] font-kakaoBig text-[20px] leading-7 tracking-[-0.025rem] mb-2">
            {detail?.title || '식당 이름'}
          </h1>

          <div className="flex items-center gap-1 mb-3">
            <img src={ArrowLocation} className="w-4 h-4" alt="" />
            <p className="text-[#596072] font-kakaoSmall text-[14px] leading-5 tracking-[-0.0175rem]">
              {detail?.location || '주소 정보 없음'}
            </p>
          </div>

          {/* 좋아요 버튼과 조회수 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <img src={LikeLocation} className="w-4 h-4" alt="" />
              <p className="text-[#596072] font-kakaoSmall text-[14px]">
                {detail?.views?.toLocaleString() || '0'}명이 봤어요
              </p>
            </div>

            <button
              onClick={handleToggleLike}
              disabled={isTogglingLike}
              className="flex items-center gap-1 bg-transparent p-0 select-none disabled:opacity-50"
            >
              <span className="block w-[1.25rem] h-[1.25rem]">
                <img
                  src={detail?.liked ? HeartFilledIcon : HeartIcon}
                  alt=""
                  className="w-full h-full"
                  draggable={false}
                />
              </span>
              <span className="text-[#596072] font-kakaoSmall text-[14px]">
                {detail?.likeCount?.toLocaleString() || '0'}
              </span>
            </button>
          </div>
        </div>

        {/* 설명 */}
        <div className="mt-6">
          <h3 className="text-[#383D48] font-kakaoSmall font-bold mb-3">
            식당 소개
          </h3>
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
                '이 식당에 대한 자세한 정보를 준비 중입니다.'}
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
};

export default RestaurantDetailPage;
