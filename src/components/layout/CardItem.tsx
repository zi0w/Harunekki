// src/components/layout/CardItem.tsx
import { Link } from 'react-router-dom';
import ArrowLocation from '@/assets/icons/home/location.svg';
import LikeLocation from '@/assets/icons/home/heart.svg';

export type Card = {
  id: string;
  title: string;
  location: string;
  img: string;
  views: number;
  liked: boolean;
  likeCount: number;
  category?: string;
  isSeasonal?: boolean;
  isLocalSpecial?: boolean;
};

export default function CardItem({
  item,
}: {
  item: Card & { type?: 'food' | 'poi' };
}) {
  return (
    <Link
      to={
        item.isSeasonal
          ? `/foods/seasonal/detail?id=${encodeURIComponent(item.id)}`
          : `/restaurants/detail?id=${encodeURIComponent(item.id)}`
      }
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
