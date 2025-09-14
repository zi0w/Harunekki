// src/pages/restaurants/HotRestaurantsPage.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { fetchAreaBasedList } from '@/lib/api/tourapi';
import CardItem, { type Card } from '@/components/layout/CardItem';
import { fetchLikeCounts, fetchMyLiked } from '@/lib/supabase/likes';
import { searchKakaoPlaces } from '@/lib/kakao/searchKakaoPlaces';

const REGIONS: Array<{ label: string; code?: number }> = [
  { label: '전체', code: undefined },
  { label: '서울', code: 1 },
  { label: '인천', code: 2 },
  { label: '경기', code: 31 },
  { label: '강원', code: 32 },
  { label: '대전', code: 3 },
  { label: '세종', code: 8 },
];

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
        // deduped 만든 뒤에 추가
        const ids = deduped.map((d) => d.id);
        try {
          const [countsMap, myLikedSet] = await Promise.all([
            fetchLikeCounts(ids), // { [id]: number }
            fetchMyLiked(ids), // Set<string>
          ]);

          deduped.forEach((card) => {
            card.likeCount = countsMap[card.id] ?? 0;
            card.liked = myLikedSet.has(card.id);
          });
        } catch (e) {
          // 집계 실패해도 목록은 보여주자 (조용히 스킵)
          console.warn('like info merge failed:', e);
        }

        // kakao 검색 결과 title 기준으로 우선순위 매기기
        const placePriority = new Map<string, number>();
        const kakaoPlaces = await searchKakaoPlaces('음식점');
        kakaoPlaces.forEach((place: { place_name: string }, idx: number) => {
          placePriority.set(place.place_name, idx);
        });

        const sorted = deduped.sort((a: Card, b: Card) => {
          const aPriority = placePriority.get(a.title) ?? 999;
          const bPriority = placePriority.get(b.title) ?? 999;
          return aPriority - bPriority;
        });

        setItems((prev) => {
          const merged = nextPage === 1 ? sorted : [...prev, ...sorted];
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
