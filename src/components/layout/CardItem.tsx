// src/components/restaurants/CardItem.tsx
import { Link, useNavigate } from 'react-router-dom';
import ArrowLocation from '@/assets/icons/home/location.svg';
import LikeLocation from '@/assets/icons/home/heart.svg';
import HeartIcon from '@/assets/icons/like/heart.svg';
import HeartFilledIcon from '@/assets/icons/like/heartClicked.svg';
import { toggleLike } from '@/lib/supabase/likes';
import { supabase } from '@/lib/supabase/supabase';

export type Card = {
  id: string;
  title: string;
  location: string;
  img: string;
  views: number;
  liked: boolean;
  likeCount: number;
};

export default function CardItem({
  item,
  setItems,
}: {
  item: Card;
  setItems: React.Dispatch<React.SetStateAction<Card[]>>;
}) {
  const navigate = useNavigate();

  return (
    <Link
      to={`/foods/seasonal/detail?id=${encodeURIComponent(item.id)}`}
      state={{ item }}
      className="block relative rounded-2xl"
    >
      {/* 이미지 */}
      <div className="relative w-full h-[150px] rounded-2xl overflow-hidden bg-[#f4f5f7]">
        {item.img ? (
          <img
            src={item.img}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#e9ecf1]" />
        )}

        {/* 이미지 우측하단 하트 버튼 */}
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // 로그인 체크
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
              alert('로그인이 필요합니다.');
              navigate('/login');
              return;
            }

            // 1) 낙관적 업데이트
            setItems((prev) =>
              prev.map((x) =>
                x.id === item.id
                  ? {
                      ...x,
                      liked: !x.liked,
                      likeCount: Math.max(0, x.likeCount + (x.liked ? -1 : 1)),
                    }
                  : x,
              ),
            );

            try {
              // 2) 서버 토글
              const { liked, likeCount } = await toggleLike(item.id);

              // 3) 서버 결과 반영
              setItems((prev) =>
                prev.map((x) =>
                  x.id === item.id ? { ...x, liked, likeCount } : x,
                ),
              );
            } catch (err) {
              // 실패 시 롤백
              setItems((prev) =>
                prev.map((x) =>
                  x.id === item.id
                    ? {
                        ...x,
                        liked: !x.liked,
                        likeCount: Math.max(
                          0,
                          x.likeCount + (x.liked ? 1 : -1),
                        ),
                      }
                    : x,
                ),
              );
              alert(
                err instanceof Error
                  ? err.message
                  : '좋아요 처리 중 오류가 발생했어요.',
              );
            }
          }}
          aria-label={item.liked ? '좋아요 취소' : '좋아요'}
          className="absolute bottom-2 right-2 z-10 bg-transparent p-0 select-none"
        >
          <span className="block w-[1.25rem] h-[1.25rem]">
            <img
              src={item.liked ? HeartFilledIcon : HeartIcon}
              alt=""
              className="w-full h-full"
              draggable={false}
            />
          </span>
        </button>
      </div>

      {/* 텍스트 */}
      <div className="mt-3">
        <p className="truncate text-[#383D48] font-kakaoSmall text-[16px] leading-6 tracking-[-0.02rem]">
          {item.title.length > 13 ? item.title.slice(0, 13) + '…' : item.title}
        </p>
        <div className="flex items-center gap-1">
          <img src={ArrowLocation} className="w-4 h-4" alt="" />
          <p className="truncate text-[#596072] font-kakaoSmall text-[14px] leading-[1.26rem] tracking-[-0.0175rem]">
            {item.location || '주소 정보 없음'}
          </p>
        </div>

        {/* 좋아요 수 */}
        <div className="flex items-center gap-1 mt-1">
          <img src={LikeLocation} className="w-4 h-4" alt="" />
          <p className="text-[#596072] font-kakaoSmall text-[14px]">
            {item.likeCount.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
