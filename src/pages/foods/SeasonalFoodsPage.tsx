import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import ArrowLocation from '@/assets/icons/home/location.svg';
import LikeButton from '@/components/common/LikeButton';
import { Link } from 'react-router-dom';

type SeasonalFood = {
  id: string;
  name: string;
  region_code: number | null;
  months: number[];
  aliases: string[] | null;
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

function regionLabel(code?: number | null) {
  if (!code) return '전국';
  return REGIONS.find((r) => r.code === code)?.label ?? '전국';
}

async function fetchFoods(region?: number, onlyThisMonth = true) {
  const nowMonth = new Date().getMonth() + 1;
  let q = supabase.from('seasonal_foods').select('*');
  if (region) q = q.eq('region_code', region);
  const { data, error } = await q;
  if (error) throw error;
  const list = (data ?? []) as SeasonalFood[];

  if (!onlyThisMonth) return list;

  return list.filter((f) => {
    const arr = (f.months ?? []) as unknown[];
    // 문자열/숫자 혼재 대비
    return arr.map((m) => Number(m)).includes(nowMonth);
  });
}

async function findFoodThumb(
  name: string,
  region?: number,
  aliases?: string[] | null,
) {
  // tour_pois에서 이미지 있는 첫 레코드 하나 찾기
  const terms = [name, ...(aliases ?? [])];
  for (const t of terms) {
    let q = supabase
      .from('tour_pois')
      .select('firstimage,firstimage2')
      .not('firstimage', 'is', null)
      .limit(1);
    if (region) q = q.eq('areacode', region);
    q = q.ilike('title', `%${t}%`);
    const { data } = await q;
    const hit = data?.[0];
    if (hit?.firstimage || hit?.firstimage2) {
      return hit.firstimage || hit.firstimage2;
    }
  }
  return undefined;
}

export default function SeasonalFoodsPage() {
  const [activeRegion, setActiveRegion] = useState<number | undefined>(
    undefined,
  );
  const [onlyThisMonth, setOnlyThisMonth] = useState(true);
  const [foods, setFoods] = useState<SeasonalFood[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const list = await fetchFoods(activeRegion, onlyThisMonth);
        setFoods(list);
      } catch (e: any) {
        setErr(e.message ?? '불러오기 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, [activeRegion, onlyThisMonth]);

  // 썸네일 비동기 수집
  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      const map: Record<string, string | undefined> = {};
      for (const f of foods) {
        if (ctrl.signal.aborted) return;
        const img = await findFoodThumb(
          f.name,
          f.region_code ?? undefined,
          f.aliases ?? [],
        );
        map[f.id] = img;
      }
      if (!ctrl.signal.aborted) setThumbs(map);
    })();

    return () => ctrl.abort();
  }, [foods]);

  const tabs = useMemo(
    () =>
      REGIONS.map((r) => (
        <button
          key={r.label}
          onClick={() => setActiveRegion(r.code)}
          className={`relative shrink-0 px-2 py-2 font-kakaoSmall text-[14px] ${
            activeRegion === r.code
              ? 'text-[#EF6F6F] font-bold bg-[#F9FAFB]'
              : 'text-[#8A8A8A] bg-[#F9FAFB]'
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
      <div className="mt-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="inline-flex gap-3 px-2">{tabs}</div>
      </div>

      <div className="mt-3 px-2">
        <label className="inline-flex items-center gap-2 text-[13px] text-[#596072]">
          <input
            type="checkbox"
            className="accent-[#EF6F6F]"
            checked={onlyThisMonth}
            onChange={(e) => setOnlyThisMonth(e.target.checked)}
          />
          이번 달 제철만 보기
        </label>
      </div>

      {err && (
        <div className="mt-3 mx-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-y-6 gap-x-4 px-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full h-[150px] bg-[#eee] rounded-2xl" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-3/4 bg-[#eee] rounded" />
                  <div className="h-3 w-1/2 bg-[#eee] rounded" />
                </div>
              </div>
            ))
          : foods.map((f) => (
              <Link
                key={f.id}
                to={`/foods/seasonal/detail?id=${encodeURIComponent(f.id)}`}
                state={{
                  item: {
                    id: f.id,
                    title: f.name,
                    region: f.region_code ?? undefined,
                  },
                }}
                className="block relative rounded-2xl"
              >
                <div className="w-full h-[150px] rounded-2xl overflow-hidden bg-[#f4f5f7]">
                  {thumbs[f.id] ? (
                    <img
                      src={thumbs[f.id]}
                      alt={f.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#e9ecf1]" />
                  )}
                </div>

                <div className="mt-3 flex flex-col items-start gap-1">
                  <p className="truncate text-[#383D48] font-kakaoSmall text-[16px] leading-6 tracking-[-0.02rem]">
                    {f.name.length > 11 ? f.name.slice(0, 11) + '…' : f.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <img src={ArrowLocation} className="w-4 h-4" alt="" />
                    <p className="text-[#596072] font-kakaoSmall text-[14px] leading-[1.26rem] tracking-[-0.0175rem]">
                      {regionLabel(f.region_code)}
                    </p>
                  </div>
                </div>

                {/* 음식 좋아요(개념 좋아요) */}
                <div className="absolute right-2 top-2">
                  <LikeButton type="food" id={f.id} />
                </div>
              </Link>
            ))}
      </div>

      {!loading && !err && foods.length === 0 && (
        <div className="mt-8 text-center text-[#8A8A8A] text-sm">
          표시할 결과가 없습니다.
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}
