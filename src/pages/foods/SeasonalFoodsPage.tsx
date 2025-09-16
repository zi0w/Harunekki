import { useEffect, useState } from 'react';
import axios from 'axios';
import CardItem, { type Card } from '@/components/layout/CardItem';

const REGIONS: Array<{ label: string; code?: number }> = [
  { label: '전체', code: undefined },
  { label: '서울', code: 1 },
  { label: '인천', code: 2 },
  { label: '경기', code: 31 },
  { label: '강원', code: 32 },
  { label: '대전', code: 3 },
  { label: '세종', code: 8 },
];

// TourAPI 호출 함수
async function fetchSeasonalFoods(region?: number) {
  const { data } = await axios.get(
    'https://apis.data.go.kr/B551011/KorService1/areaBasedList1',
    {
      params: {
        MobileOS: 'ETC',
        MobileApp: 'Harunekki',
        serviceKey: import.meta.env.VITE_TOURAPI_KEY, // .env에 넣기
        contentTypeId: 39,
        cat3: 'A05020700', // 지역특산음식
        numOfRows: 20,
        pageNo: 1,
        _type: 'json',
        ...(region ? { areaCode: region } : {}),
      },
    },
  );
  return data?.response?.body?.items?.item ?? [];
}

export default function SeasonalFoodsPage() {
  const [activeRegion, setActiveRegion] = useState<number | undefined>();
  const [items, setItems] = useState<Card[]>([]);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErrMsg(null);
      try {
        const foods = await fetchSeasonalFoods(activeRegion);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Card[] = foods.map((f: any) => ({
          id: f.contentid,
          title: f.title,
          location: f.addr1 ?? '전국',
          img: f.firstimage ?? '',
          views: Math.floor(Math.random() * 5000) + 500,
          liked: false,
          likeCount: 0,
        }));
        setItems(mapped);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setErrMsg(e.message ?? '불러오기 실패');
      }
    })();
  }, [activeRegion]);

  return (
    <div className="mx-auto w-full max-w-[20.9375rem]">
      <div className="mt-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="inline-flex gap-3 px-2">
          {REGIONS.map((r) => (
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
          ))}
        </div>
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
