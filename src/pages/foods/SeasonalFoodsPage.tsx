import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import CardItem, { type Card } from '@/components/layout/CardItem';
import { fetchLikeCounts, fetchMyLiked } from '@/lib/supabase/likes';

const REGIONS: Array<{ label: string; code?: number }> = [
  { label: '전체', code: undefined },
  { label: '서울', code: 1 },
  { label: '인천', code: 2 },
  { label: '경기', code: 31 },
  { label: '강원', code: 32 },
  { label: '대전', code: 3 },
  { label: '세종', code: 8 },
];

async function fetchFoods(region?: number) {
  const nowMonth = new Date().getMonth() + 1;
  let q = supabase.from('seasonal_foods').select('*');
  if (region) q = q.eq('region_code', region);
  const { data, error } = await q;
  if (error) throw error;
  const list = (data ?? []) as any[];

  return list.filter((f) => {
    const arr = (f.months ?? []) as unknown[];
    return arr.map((m) => Number(m)).includes(nowMonth);
  });
}

async function findFoodThumb(
  name: string,
  region?: number,
  aliases?: string[] | null,
) {
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
  const [activeRegion, setActiveRegion] = useState<number | undefined>();
  const [items, setItems] = useState<Card[]>([]);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrMsg(null);
      try {
        const raw = await fetchFoods(activeRegion);
        const mapped: Card[] = await Promise.all(
          raw.map(async (f) => {
            const img = await findFoodThumb(f.name, f.region_code, f.aliases);
            return {
              id: f.id,
              title: f.name,
              location:
                REGIONS.find((r) => r.code === f.region_code)?.label ?? '전국',
              img: img ?? '',
              views: Math.floor(Math.random() * 5000) + 500,
              liked: false,
              likeCount: 0,
            };
          }),
        );

        const ids = mapped.map((m) => m.id);
        const [countsMap, myLikedSet] = await Promise.all([
          fetchLikeCounts(ids, 'food_likes', 'food_id'),
          fetchMyLiked(ids, 'food_likes', 'food_id'),
        ]);

        mapped.forEach((m) => {
          m.likeCount = countsMap[m.id] ?? 0;
          m.liked = myLikedSet.has(m.id);
        });

        setItems(mapped);
      } catch (e: any) {
        setErrMsg(e.message ?? '불러오기 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, [activeRegion]);

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
    </div>
  );
}
