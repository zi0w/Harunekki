// src/pages/search/SearchPage.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchAreaBasedList } from '@/lib/api/tourapi';
import CardItem, { type Card } from '@/components/layout/CardItem';
import { fetchLikeCounts, fetchMyLiked } from '@/lib/supabase/likes';
import { searchKakaoPlaces } from '@/lib/kakao/searchKakaoPlaces';
import { useLocation } from 'react-router-dom';
import { CATEGORY_MAP, CATEGORY_KEYWORDS } from '@/constants/categoryMap';

type FilterOptions = {
  categories: string[];
  seasonalOnly: boolean;
  localOnly: boolean;
};

export default function SearchPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchKeyword = queryParams.get('q') ?? '';

  // ✅ location.state에서 filter 가져오기
  const stateFilter = (location.state as { filter?: FilterOptions })?.filter;

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    seasonalOnly: false,
    localOnly: false,
  });

  // ✅ location.state가 바뀔 때 filterOptions 갱신
  useEffect(() => {
    if (stateFilter) {
      setFilterOptions(stateFilter);
    }
  }, [stateFilter]);

  useEffect(() => {
    console.log('✅ SearchPage 필터 업데이트됨:', filterOptions);
  }, [filterOptions]);

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

      setLoading(true);
      loadingRef.current = true;
      setErrMsg(null);

      try {
        const { items: list, total } = await fetchAreaBasedList({
          contentTypeId: 39,
          pageNo: nextPage,
          numOfRows: 40,
          keyword: searchKeyword || undefined,
        });

        const mapped: Card[] = (list || []).map((it) => ({
          id: it.contentid,
          title: it.title ?? '',
          location: it.addr1 ?? '',
          img: it.firstimage || it.firstimage2 || '',
          views: Math.floor(Math.random() * 5000) + 500,
          liked: false,
          likeCount: 0,
          category: (it.cat3 as string) ?? '', // ✅ cat3 보존
        }));

        // 중복 제거
        const deduped: Card[] = [];
        for (const m of mapped) {
          if (!idSetRef.current.has(m.id)) {
            idSetRef.current.add(m.id);
            deduped.push(m);
          }
        }

        // 좋아요 정보 병합
        const ids = deduped.map((d) => d.id);
        try {
          const [countsMap, myLikedSet] = await Promise.all([
            fetchLikeCounts(ids),
            fetchMyLiked(ids),
          ]);
          deduped.forEach((card) => {
            card.likeCount = countsMap[card.id] ?? 0;
            card.liked = myLikedSet.has(card.id);
          });
        } catch (e) {
          console.warn('like info merge failed:', e);
        }

        // 🔹 필터링
        const filtered = deduped.filter((card) => {
          const matchKeyword =
            !searchKeyword ||
            card.title.toLowerCase().includes(searchKeyword.toLowerCase());

          const matchCategory =
            filterOptions.categories.length === 0 ||
            filterOptions.categories.some((selected) => {
              const codes = CATEGORY_MAP[selected] ?? [];
              const keywords = CATEGORY_KEYWORDS[selected] ?? [];

              return (
                codes.some(
                  (code) => card.category?.startsWith(code), // ✅ 앞자리 매칭
                ) || keywords.some((kw) => card.title.includes(kw))
              );
            });

          const matchSeasonal =
            !filterOptions.seasonalOnly || (card as any).isSeasonal === true;
          const matchLocal =
            !filterOptions.localOnly || (card as any).isLocal === true;

          return matchKeyword && matchCategory && matchSeasonal && matchLocal;
        });

        // 🔹 정렬
        const kakaoPlaces = await searchKakaoPlaces('음식점');
        const placePriority = new Map<string, number>();
        kakaoPlaces.forEach((place: { place_name: string }, idx: number) => {
          placePriority.set(place.place_name, idx);
        });

        const sorted = filtered.sort((a, b) => {
          const aPriority = placePriority.get(a.title) ?? 999;
          const bPriority = placePriority.get(b.title) ?? 999;
          return aPriority - bPriority;
        });

        // 🔹 상태 업데이트
        setItems((prev) => {
          const merged = nextPage === 1 ? sorted : [...prev, ...sorted];
          setHasMore((total || 0) > merged.length);
          return merged;
        });

        pageRef.current = nextPage;
      } catch (e: unknown) {
        const isAbort =
          (e instanceof DOMException && e.name === 'AbortError') ||
          (typeof e === 'object' &&
            e !== null &&
            'code' in e &&
            (e as { code: string }).code === 'ERR_CANCELED');
        if (!isAbort) {
          setErrMsg(
            e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.',
          );
        }
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [searchKeyword, filterOptions],
  );

  // 초기화 + 첫 로딩
  useEffect(() => {
    setItems([]);
    setErrMsg(null);
    setHasMore(true);
    pageRef.current = 0;
    idSetRef.current.clear();
    abortRef.current?.abort();
    abortRef.current = null;
    loadPage(1);
  }, [searchKeyword, filterOptions, loadPage]);

  // 무한스크롤 옵저버
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

  return (
    <div className="mx-auto w-full max-w-[20.9375rem] overflow-x-hidden">
      {errMsg && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errMsg}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-y-6 gap-x-4">
        {items.map((it) => (
          <CardItem key={it.id} item={it} />
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
