// src/pages/foods/SeasonalFoodDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ArrowLocation from '@/assets/icons/home/location.svg';
import { fetchDetailCommon, type DetailCommonItem } from '@/lib/api/tourapi';
// 좋아요 관련

import RedHeartIcon from '@/assets/icons/like/Pressedheart.svg';
import BgHeartIcon from '@/assets/icons/like/Default.svg';
import BgHeartFilledIcon from '@/assets/icons/like/Clicked.svg';
import { supabase } from '@/lib/supabase/supabase';
import {
  toggleLike as rpcToggleLike,
  fetchLikeCounts,
  fetchMyLiked,
} from '@/lib/supabase/likes';

// 리스트 카드와 동일한 최소 필드
type DetailModel = {
  id: string;
  title: string;
  location: string;
  img: string;
};

export default function SeasonalFoodDetailPage() {
  const [params] = useSearchParams();
  const contentId = params.get('id') ?? '';

  const { state } = useLocation() as {
    state?: { item?: Partial<DetailModel> };
  };
  const seed = state?.item;

  const navigate = useNavigate();

  const [detail, setDetail] = useState<DetailModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // ❤️ 좋아요 상태
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 상세 로드
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        setErrMsg(null);

        // 1) state 기반 초기값
        const base: DetailModel | null = seed
          ? {
              id: String(contentId || seed.id || ''),
              title: seed.title ?? '',
              location: seed.location ?? '',
              img: seed.img ?? '',
            }
          : null;
        if (!cancelled && base) setDetail(base);

        // 2) 상세 조회로 보강
        if (contentId) {
          const d: DetailCommonItem = await fetchDetailCommon(contentId);
          if (cancelled) return;

          setDetail((prev) => ({
            id: contentId,
            title: d.title || prev?.title || '',
            location: d.addr1 || prev?.location || '',
            img: d.firstimage || d.firstimage2 || prev?.img || '',
          }));
        }
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

  // ❤️ 좋아요 초기 집계/내가 눌렀는지 조회
  useEffect(() => {
    let cancelled = false;
    async function loadLikes() {
      if (!contentId) return;
      try {
        // 집계
        const counts = await fetchLikeCounts([contentId]); // { [id]: number }
        const cnt = counts[contentId] ?? 0;
        if (!cancelled) setLikeCount(cnt);

        // 내 좋아요 여부
        const mySet = await fetchMyLiked([contentId]); // Set<string>
        if (!cancelled) setLiked(mySet.has(contentId));
      } catch (e) {
        // 실패해도 UI는 계속
        console.warn('loadLikes failed:', e);
      }
    }
    loadLikes();
    return () => {
      cancelled = true;
    };
  }, [contentId]);

  // 좋아요 토글 핸들러
  async function onToggleLike() {
    // 로그인 체크
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    // 낙관적 업데이트
    setLiked((prev) => !prev);
    setLikeCount((prev) => Math.max(0, prev + (liked ? -1 : 1)));

    try {
      const { liked: serverLiked, likeCount: serverCount } =
        await rpcToggleLike(contentId);
      setLiked(Boolean(serverLiked));
      setLikeCount(Number(serverCount ?? 0));
    } catch (err) {
      // 롤백
      setLiked((prev) => !prev);
      setLikeCount((prev) => Math.max(0, prev + (liked ? 1 : -1)));
      alert(
        err instanceof Error
          ? err.message
          : '좋아요 처리 중 오류가 발생했어요.',
      );
    }
  }

  const title = useMemo(
    () => detail?.title || '제철 음식 상세',
    [detail?.title],
  );

  return (
    <div className="mx-auto w-full max-w-[20.9375rem] overflow-x-hidden">
      {/* 본문 */}
      <div className="px-4 pb-8">
        {/* 이미지 */}
        <div className="mt-3 rounded-2xl overflow-hidden bg-[#F4F5F7] relative">
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

          {/* 이미지 우측 상단 하트 버튼 */}
          <button
            type="button"
            onClick={onToggleLike}
            aria-label={liked ? '좋아요 취소' : '좋아요'}
            className=" absolute bottom-0 right-0 z-10 bg-transparent p-0 select-none active:scale-100"
          >
            <span className="block w-[5.25rem] h-[5.25rem]">
              <img
                src={liked ? BgHeartFilledIcon : BgHeartIcon}
                alt=""
                className="w-full h-full"
                draggable={false}
              />
            </span>
          </button>
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

        {/* 좋아요 수 (주소 밑) */}
        <div className="mt-2 flex items-center gap-1">
          <img src={RedHeartIcon} className="w-4 h-4" alt="좋아요 수" />
          <span className="text-[#596072] font-kakaoSmall text-[14px] leading-[1.26rem] tracking-[-0.0175rem]">
            {likeCount.toLocaleString()}
          </span>
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
