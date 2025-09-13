// HomePage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ArrowRight from '@/assets/icons/home/arrow_right.svg';
import BannerImg from '@/assets/icons/home/Banner.png';
import ArrowLocation from '@/assets/icons/home/location.svg';
import LikeLocation from '@/assets/icons/home/heart.svg';

import { fetchAreaBasedList, type ListItem } from '@/lib/api/tourapi';

type Food = {
  id: string;
  title: string;
  location: string;
  views: number;
  img: string;
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mapToFood(it: ListItem): Food {
  return {
    id: it.contentid,
    title: it.title ?? '',
    location: it.addr1 ?? '주소 정보 없음',
    img: it.firstimage || it.firstimage2 || '',
    views: Math.floor(Math.random() * 3000) + 300,
  };
}

const SectionHeader = ({ title, to }: { title: string; to?: string }) => (
  <div className="flex w-full justify-between items-end">
    <h4 className="hdr-h4">{title}</h4>
    {to ? (
      <Link
        to={to}
        className="flex items-center gap-[0.125rem] px-1 py-1 pl-2 body-s400"
      >
        전체보기
        <img src={ArrowRight} alt="더보기" className="w-3 h-3 aspect-square" />
      </Link>
    ) : null}
  </div>
);

const ChipRowCard = ({ item }: { item: Food }) => (
  <Link
    to={`/foods/seasonal/detail?id=${encodeURIComponent(item.id)}`}
    state={{ item }}
    className="inline-flex flex-col w-[104px] mr-4 shrink-0"
    aria-label={item.title}
  >
    <div className="w-[6.25rem] h-[6.25rem] rounded-xl overflow-hidden bg-gray-200">
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
    <p className="mt-3 truncate text-[#383D48] font-kakaoSmall text-base leading-6 tracking-[-0.02rem]">
      {item.title}
    </p>
    <div className="mt-1 flex items-center gap-1 self-stretch">
      <img src={ArrowLocation} className="w-4 h-4 aspect-square" alt="" />
      <p className="truncate text-[#596072] font-kakaoSmall text-[0.875rem] font-normal leading-[1.26rem] tracking-[-0.0175rem]">
        {item.location.length > 5
          ? item.location.slice(0, 5) + '…'
          : item.location}
      </p>
    </div>
  </Link>
);

const RestaurantCard = ({ item }: { item: Food }) => (
  <Link
    to={`/foods/seasonal/detail?id=${encodeURIComponent(item.id)}`}
    state={{ item }}
    aria-label={item.title}
    className="flex w-40 flex-col items-start gap-3 rounded-2xl"
  >
    <div className="w-full h-[150px] rounded-2xl overflow-hidden bg-[#f4f5f7]">
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

    <div className="flex flex-col gap-1 w-full mb-6">
      <p className="truncate text-[#383D48] font-kakaoSmall text-[16px] leading-6 tracking-[-0.02rem]">
        {item.title.length > 13 ? item.title.slice(0, 13) + '…' : item.title}
      </p>
      <div className="flex items-center gap-1">
        <img src={ArrowLocation} className="w-4 h-4" alt="" />
        <p className="truncate text-[#596072] font-kakaoSmall text-[0.875rem] font-normal leading-[1.26rem] tracking-[-0.0175rem]">
          {item.location}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <img src={LikeLocation} className="w-4 h-4" alt="" />
        <p className="truncate text-[#596072] font-kakaoSmall text-[0.875rem] font-normal leading-[1.26rem] tracking-[-0.0175rem]">
          {item.views.toLocaleString()}
        </p>
      </div>
    </div>
  </Link>
);

const HomePage = () => {
  const [seasonalFoods, setSeasonalFoods] = useState<Food[]>([]);
  const [sfLoading, setSfLoading] = useState(false);
  const [sfError, setSfError] = useState<string | null>(null);

  const [hotRestaurants, setHotRestaurants] = useState<Food[]>([]);
  const [hotLoading, setHotLoading] = useState(false);
  const [hotError, setHotError] = useState<string | null>(null);

  // 제철 음식
  useEffect(() => {
    let cancelled = false;

    async function loadSeasonal() {
      setSfLoading(true);
      setSfError(null);
      try {
        const { items } = await fetchAreaBasedList({
          contentTypeId: 39,
          pageNo: 1,
          numOfRows: 80,
          arrange: 'Q',
        });

        const mapped = (items || []).map(mapToFood);
        const withImg = mapped.filter((m) => !!m.img);
        const randomPick = shuffle(withImg).slice(0, 12);

        if (!cancelled) setSeasonalFoods(randomPick);
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : '제철 음식 데이터를 불러오지 못했습니다.';
        if (!cancelled) setSfError(msg);
      } finally {
        if (!cancelled) setSfLoading(false);
      }
    }

    loadSeasonal();
    return () => {
      cancelled = true;
    };
  }, []);

  // 인기 식당
  useEffect(() => {
    let cancelled = false;

    async function loadHot() {
      setHotLoading(true);
      setHotError(null);
      try {
        const { items } = await fetchAreaBasedList({
          contentTypeId: 39,
          pageNo: 1,
          numOfRows: 40,
          arrange: 'Q',
        });

        const mapped = (items || []).map(mapToFood);
        const withViews = mapped.map((m) => ({
          ...m,
          views: Math.floor(Math.random() * 5000) + 500,
        }));
        withViews.sort((a, b) => b.views - a.views);

        const top = withViews.slice(0, 6);
        if (!cancelled) setHotRestaurants(top);
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : '인기 식당을 불러오지 못했습니다.';
        if (!cancelled) setHotError(msg);
      } finally {
        if (!cancelled) setHotLoading(false);
      }
    }

    loadHot();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full">
      {/* 배너 */}
      <Link to="/recommend" className="flex-1 block mt-5">
        <div className="relative overflow-hidden rounded-lg drop-shadow-sm">
          <img src={BannerImg} alt="배너" className="w-full h-auto" />
        </div>
      </Link>

      {/* 이달의 제철 음식 */}
      <section className="mt-6">
        <div className="flex w-full flex-col items-start gap-y-6">
          <SectionHeader title="이달의 제철 음식" to="/foods/seasonal" />

          {sfError && (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {sfError}
            </div>
          )}

          <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
            {sfLoading && seasonalFoods.length === 0 ? (
              <div className="flex gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="inline-flex flex-col w-[104px] mr-4">
                    <div className="w-[6.25rem] h-[6.25rem] rounded-xl bg-[#eee] animate-pulse" />
                    <div className="mt-3 h-4 w-20 bg-[#eee] rounded animate-pulse" />
                    <div className="mt-2 h-3 w-12 bg-[#eee] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : seasonalFoods.length > 0 ? (
              seasonalFoods.map((f) => <ChipRowCard key={f.id} item={f} />)
            ) : (
              !sfLoading &&
              !sfError && (
                <div className="text-sm text-[#8A8A8A]">
                  표시할 결과가 없습니다.
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* 지금 가장 인기있는 식당 (API 연동) */}
      <section className="mt-8">
        <div className="flex w-full flex-col items-start gap-6">
          <SectionHeader
            title="지금 가장 인기있는 식당"
            to="/restaurants/hot"
          />

          {hotError && (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {hotError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 w-full">
            {hotLoading && hotRestaurants.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="w-full h-[150px] bg-[#eee] rounded-2xl" />
                    <div className="mt-3 space-y-2">
                      <div className="h-4 w-3/4 bg-[#eee] rounded" />
                      <div className="h-3 w-1/2 bg-[#eee] rounded" />
                    </div>
                  </div>
                ))
              : hotRestaurants.length > 0
                ? hotRestaurants.map((r) => (
                    <RestaurantCard key={r.id} item={r} />
                  ))
                : !hotLoading &&
                  !hotError && (
                    <div className="text-sm text-[#8A8A8A] col-span-2">
                      표시할 결과가 없습니다.
                    </div>
                  )}
          </div>
        </div>
      </section>

      <div className="h-20" />
    </div>
  );
};

export default HomePage;
