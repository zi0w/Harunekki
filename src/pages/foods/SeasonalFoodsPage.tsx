import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ArrowLocation from '@/assets/icons/home/location.svg';
import { fetchSeasonalFoods, type SeasonalCard } from '@/lib/api/seasonalFoods';

// 제철 음식용 간단한 카드 컴포넌트
function SeasonalFoodCard({ item }: { item: SeasonalCard }) {
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
      </div>
    </Link>
  );
}

export default function SeasonalFoodsPage() {
  const [items, setItems] = useState<SeasonalCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSeasonalFoods = async () => {
      try {
        setLoading(true);
        const foodCards = await fetchSeasonalFoods();
        setItems(foodCards);
      } catch (error) {
        console.error('제철음식 데이터 로드 실패:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadSeasonalFoods();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[20.9375rem]">
        <div className="mt-4 text-center">
          <h2 className="text-lg font-bold text-[#383D48] mb-2">
            {new Date().getMonth() + 1}월 제철 음식
          </h2>
          <p className="text-sm text-[#8A8A8A]">
            제철 음식 정보를 불러오는 중...
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[20.9375rem]">
      <div className="mt-4 text-center">
        <h2 className="text-lg font-bold text-[#383D48] mb-2">
          {new Date().getMonth() + 1}월 제철 음식
        </h2>
        <p className="text-sm text-[#8A8A8A]">
          이달의 신선한 제철 음식을 만나보세요
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-y-6 gap-x-4">
        {items.map((item) => (
          <SeasonalFoodCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
