// src/pages/restaurants/HotRestaurantsPage.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { fetchAreaBasedList } from '@/lib/api/tourapi';
import ArrowLocation from '@/assets/icons/home/location.svg';
import { Link } from 'react-router-dom';
import LikeLocation from '@/assets/icons/home/heart.svg';
import HeartIcon from '@/assets/icons/like/heart.svg';
import HeartFilledIcon from '@/assets/icons/like/heartClicked.svg';

type Card = {
  id: string;
  title: string;
  location: string;
  img: string;
  views: number;
  liked: boolean;
  likeCount: number;
};

const REGIONS: Array<{ label: string; code?: number }> = [
  { label: '전체', code: undefined },
  { label: '서울', code: 1 },
  { label: '인천', code: 2 },
  { label: '경기', code: 31 },
  { label: '강원', code: 32 },
  { label: '대전', code: 3 },
  { label: '세종', code: 8 },
];

const CardItem = ({
  item,
  setItems,
}: {
  item: Card;
  setItems: React.Dispatch<React.SetStateAction<Card[]>>;
}) => {
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

        {/* 이미지 우측하단 하트 버튼 (링크 밖, 오버레이) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            setItems((prev) =>
              prev.map((x) =>
                x.id === item.id
                  ? {
                      ...x,
                      liked: !x.liked,
                      likeCount: x.likeCount + (x.liked ? -1 : 1),
                    }
                  : x,
              ),
            );
          }}
          aria-label={item.liked ? '좋아요 취소' : '좋아요'}
          className="absolute bottom-2 right-2 z-10 bg-transparent p-0 select-none active:scale-100"
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
};

export default function HotRestaurantsPage() {
  const [activeRegion, setActiveRegion] = useState<number | undefined>(
    undefined,
  );
  const [items, setItems] = useState<Card[]>([]);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const idSetRef = useRef<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const loadPage = useCallback(
    async (nextPage: number) => {
      if (loadingRef.current) return;
      if (!hasMoreRef.current && nextPage !== 1) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      loadingRef.current = true;
      setErrMsg(null);

      try {
        const { items: list, total } = await fetchAreaBasedList({
          areaCode: activeRegion,
          contentTypeId: 39, // 음식점
          pageNo: nextPage,
          numOfRows: 40,
          arrange: 'Q',
          signal: controller.signal,
        });

        const mapped: Card[] = (list || []).map((it) => ({
          id: it.contentid,
          title: it.title ?? '',
          location: it.addr1 ?? '',
          img: it.firstimage || it.firstimage2 || '',
          views: Math.floor(Math.random() * 5000) + 500,
          liked: false,
          likeCount: 0,
        }));
        // 중복 제거
        const deduped: Card[] = [];
        for (const m of mapped) {
          if (!idSetRef.current.has(m.id)) {
            idSetRef.current.add(m.id);
            deduped.push(m);
          }
        }

        setItems((prev) => {
          const merged = nextPage === 1 ? deduped : [...prev, ...deduped];
          setHasMore((total || 0) > merged.length);
          return merged;
        });
        pageRef.current = nextPage;
      } catch (e: unknown) {
        const isAbort = e instanceof DOMException && e.name === 'AbortError';
        if (!isAbort) {
          const msg =
            e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.';
          setErrMsg(msg);
        }
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [activeRegion],
  );
  useEffect(() => {
    // 초기화
    setItems([]);
    setErrMsg(null);
    setHasMore(true);
    pageRef.current = 0;
    idSetRef.current.clear();
    abortRef.current?.abort();
    abortRef.current = null;

    // 첫 페이지 로드
    loadPage(1);
  }, [activeRegion, loadPage]);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingRef.current && hasMoreRef.current) {
          loadPage(pageRef.current + 1);
        }
      },
      { root: null, rootMargin: '600px', threshold: 0.01 },
    );
    io.observe(sentinelRef.current);
    observerRef.current = io;
    return () => {
      io.disconnect();
      observerRef.current = null;
    };
  }, [loadPage]);

  const tabs = useMemo(
    () =>
      REGIONS.map((r) => (
        <button
          key={r.label}
          onClick={() => setActiveRegion(r.code)}
          className={`relative shrink-0 px-2 py-2 font-kakaoSmall text-[14px] ${
            activeRegion === r.code
              ? 'text-[#EF6F6F] font-bold bg-[#F9FAFB]'
              : 'text-[#8A8A8A] bg-[#F9FAFB] '
          }`}
        >
          {r.label}
          {activeRegion === r.code && (
            <span className="absolute left-1 right-1 -bottom-0.5 h-[2px] rounded bg-[#EF6F6F]" />
          )}
        </button>
      )),
    [activeRegion],
  );

  return (
    <div className="mx-auto w-full max-w-[20.9375rem] overflow-x-hidden">
      {/* 지역 탭 */}
      <div className="mt-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="inline-flex gap-3 px-2">{tabs}</div>
      </div>

      {errMsg && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errMsg}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-y-6 gap-x-4">
        {items.map((it) => (
          <CardItem key={it.id} item={it} setItems={setItems} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-10" />
      {loading && items.length > 0 && (
        <div className="my-4 text-center text-[#8A8A8A] text-sm">
          불러오는 중…
        </div>
      )}
      {!loading && items.length > 0 && !hasMore && (
        <div className="my-4 text-center text-[#8A8A8A] text-sm">
          마지막 결과입니다.
        </div>
      )}
    </div>
  );
}
