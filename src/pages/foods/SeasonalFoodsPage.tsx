import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { fetchAreaBasedList } from '@/lib/api/tourapi';
import ArrowLocation from '@/assets/icons/home/location.svg';
import { Link } from 'react-router-dom';

type Card = {
  id: string;
  title: string;
  location: string;
  img: string;
  views: number;
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

const FoodCard = ({ item }: { item: Card }) => (
  <Link
    to={`/foods/seasonal/detail?id=${encodeURIComponent(item.id)}`}
    state={{ item }} // 상세에서 즉시 쓰도록 전달(선택)
    className="block relative rounded-2xl"
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
    <div className="mt-3 flex flex-col items-start gap-1">
      <p className="truncate text-[#383D48] font-kakaoSmall text-[16px] leading-6 tracking-[-0.02rem]">
        {item.title.length > 11 ? item.title.slice(0, 11) + '…' : item.title}
      </p>
      <div className="flex items-center gap-1">
        <img src={ArrowLocation} className="w-4 h-4" alt="" />
        <p className="text-[#596072] font-kakaoSmall text-[14px] leading-[1.26rem] tracking-[-0.0175rem]">
          {item.location
            ? item.location.length > 10
              ? item.location.slice(0, 10) + '…'
              : item.location
            : '주소 정보 없음'}
        </p>
      </div>
    </div>
  </Link>
);

export default function SeasonalFoodsPage() {
  const [activeRegion, setActiveRegion] = useState<number | undefined>(
    undefined,
  );
  const [items, setItems] = useState<Card[]>([]);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // 최신값 유지용 refs
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

  // 지역 변경 시 초기화
  useEffect(() => {
    setItems([]);
    setErrMsg(null);
    setHasMore(true);
    pageRef.current = 0;
    idSetRef.current.clear();
    abortRef.current?.abort();
    abortRef.current = null;
  }, [activeRegion]);

  const loadPage = useCallback(
    async (nextPage: number) => {
      if (loadingRef.current) return;
      if (!hasMoreRef.current && nextPage !== 1) return;

      // 진행 중 요청 취소
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      loadingRef.current = true;
      setErrMsg(null);

      try {
        const { items: list, total: totalResp } = await fetchAreaBasedList({
          areaCode: activeRegion,
          contentTypeId: 39,
          pageNo: nextPage,
          numOfRows: 40, // 왕복 줄이기
          arrange: 'Q',
          signal: controller.signal,
        });

        const mapped: Card[] = (list || []).map((it) => ({
          id: it.contentid,
          title: it.title ?? '',
          location: it.addr1 ?? '',
          img: it.firstimage || it.firstimage2 || '', // 외부 FALLBACK 제거
          views: Math.floor(Math.random() * 3000) + 300, // 데모 숫자 유지(원하면 제거 가능)
        }));

        // 중복 제거
        const deduped: Card[] = [];
        for (const m of mapped) {
          if (!idSetRef.current.has(m.id)) {
            idSetRef.current.add(m.id);
            deduped.push(m);
          }
        }

        // 병합 후 길이 기준으로 hasMore 계산
        setItems((prev) => {
          const merged = nextPage === 1 ? deduped : [...prev, ...deduped];
          setHasMore((totalResp || 0) > merged.length);
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

  // 첫 로드
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  // 옵저버 생성(한 번)
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

  // 초기 kick: 첫 페이지가 화면을 못 채우면 연쇄 로드
  useEffect(() => {
    if (!hasMore || loadingRef.current) return;
    const id = window.setTimeout(() => {
      const el = sentinelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight) {
        loadPage(pageRef.current + 1);
      }
    }, 60);
    return () => window.clearTimeout(id);
  }, [items.length, hasMore, loadPage]);

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

  const skeletons = Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="animate-pulse">
      <div className="w-full h-[150px] bg-[#eee] rounded-2xl" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 bg-[#eee] rounded" />
        <div className="h-3 w-1/2 bg-[#eee] rounded" />
        <div className="h-3 w-1/3 bg-[#eee] rounded" />
      </div>
    </div>
  ));

  return (
    <div className="mx-auto w-full max-w-[20.9375rem] overflow-x-hidden">
      {/* 상단 탭 */}
      <div className="mt-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="inline-flex gap-3 px-2">{tabs}</div>
      </div>

      {/* 상태 메시지 */}
      {errMsg && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errMsg}
        </div>
      )}

      {/* 카드 그리드 */}
      <div className="mt-4 grid grid-cols-2 gap-y-6 gap-x-4">
        {items.length === 0 && loading
          ? skeletons
          : items.map((it) => <FoodCard key={it.id} item={it} />)}
      </div>

      {/* 빈 상태 */}
      {!loading && !errMsg && items.length === 0 && (
        <div className="mt-8 text-center text-[#8A8A8A] text-sm">
          표시할 결과가 없습니다.
        </div>
      )}

      {/* sentinel: 보이면 다음 페이지 로드 */}
      <div ref={sentinelRef} className="h-10" />

      {/* 로딩/끝 상태 */}
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

      <div className="h-6" />
    </div>
  );
}
