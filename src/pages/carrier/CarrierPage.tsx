import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import pinWhite from '@/assets/icons/carrier/pinWhite.svg';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { createDiaryWithPlaces } from '@/lib/supabase/diaries';
import { supabase } from '@/lib/supabase/supabase';
import {
  ensureUserExists,
  fetchAllLikedItems,
  fetchLikeCounts,
} from '@/lib/supabase/likes';
import type { LikedItem } from '@/types/LikedItem';
import LocationIcon from '@/assets/icons/home/location.svg';
import LikeIcon from '@/assets/icons/home/heart.svg';
import Modal from '@/components/common/Modal';

export default function CarrierPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [stores, setStores] = useState<LikedItem[]>([]);
  const [groupedStores, setGroupedStores] = useState<
    Record<string, LikedItem[]>
  >({});
  const [recommendedRegion, setRecommendedRegion] = useState<string | null>(
    null,
  );
  const [filterRecommendedOnly, setFilterRecommendedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // ✅ 지역명 추출 함수 (내부 정의)
  function extractRegionFromLocation(location: string): string {
    if (!location) return '기타';
    const match = location.match(
      /^(서울|부산|대전|대구|광주|인천|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/,
    );
    return match?.[1] ?? '기타';
  }
  async function fetchPoiDetails(
    ids: string[],
  ): Promise<Record<string, { mapx: number; mapy: number }>> {
    const { data, error } = await supabase
      .from('tour_pois')
      .select('contentid, mapx, mapy')
      .in('contentid', ids);

    if (error) {
      console.error('map 좌표 가져오기 실패:', error);
      return {};
    }

    const result: Record<string, { mapx: number; mapy: number }> = {};
    for (const row of data) {
      result[row.contentid] = {
        mapx: Number(row.mapx),
        mapy: Number(row.mapy),
      };
    }

    return result;
  }
  // ✅ 좋아요 항목 로딩
  useEffect(() => {
    async function loadLikedItems() {
      try {
        const likedItems = await fetchAllLikedItems();
        const restIds = likedItems
          .filter((item) => item.type === 'restaurant')
          .map((item) => item.id);

        const likeCountMap = await fetchLikeCounts(restIds);

        const enrichedItems = likedItems.map((item) => ({
          ...item,
          likeCount: likeCountMap[item.id] ?? 0,
        }));

        setStores(enrichedItems);

        const regionMap: Record<string, LikedItem[]> = {};
        for (const item of enrichedItems) {
          const region = extractRegionFromLocation(item.location ?? '');
          if (!regionMap[region]) {
            regionMap[region] = [];
          }
          regionMap[region].push(item);
        }
        setGroupedStores(regionMap);

        // 강원도가 있으면 우선 추천, 없으면 가장 많은 좋아요 지역 추천
        const preferredRegions = ['강원', '서울', '경기', '부산', '제주'];
        let recommendedRegion = '';

        for (const region of preferredRegions) {
          if (regionMap[region] && regionMap[region].length > 0) {
            recommendedRegion = region;
            break;
          }
        }

        // 선호 지역에 없으면 가장 많은 좋아요 지역으로
        if (!recommendedRegion) {
          recommendedRegion = Object.entries(regionMap).reduce(
            (max, entry) => (entry[1].length > max[1].length ? entry : max),
            ['', [] as LikedItem[]],
          )[0];
        }

        setRecommendedRegion(recommendedRegion);
      } catch (err) {
        console.error('좋아요 항목 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLikedItems();
  }, []);

  const handleDelete = (id: string) => {
    const updated = stores.filter((s) => s.id !== id);
    setStores(updated);

    const regionMap: Record<string, LikedItem[]> = {};
    for (const item of updated) {
      const region = extractRegionFromLocation(item.location ?? '');
      if (!regionMap[region]) {
        regionMap[region] = [];
      }
      regionMap[region].push(item);
    }
    setGroupedStores(regionMap);

    // 강원도가 있으면 우선 추천, 없으면 가장 많은 좋아요 지역 추천
    const preferredRegions = ['강원', '서울', '경기', '부산', '제주'];
    let recommendedRegion = '';

    for (const region of preferredRegions) {
      if (regionMap[region] && regionMap[region].length > 0) {
        recommendedRegion = region;
        break;
      }
    }

    // 선호 지역에 없으면 가장 많은 좋아요 지역으로
    if (!recommendedRegion) {
      recommendedRegion = Object.entries(regionMap).reduce(
        (max, entry) => (entry[1].length > max[1].length ? entry : max),
        ['', [] as LikedItem[]],
      )[0];
    }

    setRecommendedRegion(recommendedRegion);
  };
  async function fetchExistingPoiIds(ids: string[]): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('tour_pois')
      .select('contentid')
      .in('contentid', ids);

    if (error) {
      console.error('tour_pois 조회 실패:', error);
      return new Set();
    }

    return new Set(data.map((row) => row.contentid));
  }

  const handleConfirm = async () => {
    if (!title || !dateRange) {
      setShowValidationModal(true);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await ensureUserExists();

      const regionFilteredStores = filterRecommendedOnly
        ? stores.filter(
            (store) =>
              extractRegionFromLocation(store.location ?? '') ===
              recommendedRegion,
          )
        : stores;

      // 1️⃣ POI ID 추출
      const restaurantIds = regionFilteredStores
        .filter((s) => s.type === 'restaurant')
        .map((s) => s.id);

      // 2️⃣ Supabase에 존재하는 POI만 추리기
      const existingPoiIds = await fetchExistingPoiIds(restaurantIds);

      const filteredStores = regionFilteredStores.filter((store) => {
        if (store.type === 'restaurant') {
          return existingPoiIds.has(store.id);
        }
        return true;
      });

      // 3️⃣ 좌표 데이터도 함께 조회
      const poiDetails = await fetchPoiDetails(
        filteredStores.filter((s) => s.type === 'restaurant').map((s) => s.id),
      );

      // 4️⃣ 좌표 병합
      const storesWithCoords = filteredStores.map((store) => {
        const coords = poiDetails[store.id];
        return {
          ...store,
          mapx: coords?.mapx ?? null,
          mapy: coords?.mapy ?? null,
        };
      });

      // 5️⃣ 실제 장소들의 지역 확인하여 regionName 결정
      const actualRegions = new Set<string>();
      for (const store of storesWithCoords) {
        const region = extractRegionFromLocation(store.location ?? '');
        if (region && region !== '기타') {
          actualRegions.add(region);
        }
      }

      let regionName: string;
      if (actualRegions.size === 0) {
        regionName = '국내 여행';
      } else if (actualRegions.size === 1) {
        const singleRegion = Array.from(actualRegions)[0];
        regionName = singleRegion === '강원' ? '강원특별자치도' : singleRegion;
      } else {
        regionName = '국내 여행';
      }

      // 6️⃣ Supabase에 저장
      const diary = await createDiaryWithPlaces({
        userId: user.id,
        title,
        startDate: dateRange[0].toISOString().slice(0, 10),
        endDate: dateRange[1].toISOString().slice(0, 10),
        stores: storesWithCoords,
        regionName,
      });

      // 7️⃣ MakeDiaryPage로 이동 + 좌표 포함된 stores 넘김
      navigate('/carrier/makediary', {
        state: {
          diaryId: diary.id,
          title,
          dateRange,
          stores: storesWithCoords,
        },
      });
    } catch (err) {
      console.error('다이어리 저장 실패:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  function getPostposition(word: string, josa: [string, string]) {
    const code = word.charCodeAt(word.length - 1);
    const hasJong = (code - 44032) % 28 !== 0;
    return word + (hasJong ? josa[0] : josa[1]);
  }
  return (
    <div className="flex flex-col h-screen px-4 font-[Kakao Small Sans]">
      <div className="mt-4">
        <label className="text-[#383D48] text-base font-bold text-center">
          다이어리 제목
        </label>
        <div className="mt-3 relative">
          <input
            type="text"
            maxLength={18}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="다이어리 제목을 입력하세요"
            className="w-full px-4 py-3 rounded-[0.75rem] bg-[#FDFDFE] shadow-[inset_0_0_4px_0_#BEC4D3] text-[#596072] text-base focus:outline-none"
          />
          <span className="absolute right-3 top-5 text-xs text-gray-500">
            {title.length}/18
          </span>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-[#383D48] text-base font-bold text-center mb-3">
          여행 일정
        </label>
        <button
          onClick={() => setCalendarOpen(true)}
          className="w-full px-4 py-3 rounded-[0.75rem] bg-[#FDFDFE] shadow-[inset_0_0_4px_0_#BEC4D3] text-left text-[#596072] text-base mt-3"
        >
          {dateRange
            ? `${dateRange[0].toLocaleDateString()} ~ ${dateRange[1].toLocaleDateString()}`
            : '여행 일정을 선택해주세요'}
        </button>
      </div>

      {calendarOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <Calendar
              selectRange
              onChange={(value) => {
                setDateRange(value as [Date, Date]);
                setCalendarOpen(false);
              }}
            />
            <button
              onClick={() => setCalendarOpen(false)}
              className="mt-2 w-full bg-[#EF6F6F] py-2 rounded-lg"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 추천 UI */}
      {recommendedRegion && (
        <div className="mt-6 p-4 rounded-xl bg-[#FDFDFE] border border-[#EF6F6F] shadow">
          <p className="text-[#EF6F6F] text-sm font-bold mb-1">추천 여행지</p>
          <p className="text-left text-[#383D48] text-base font-bold">
            {getPostposition(
              recommendedRegion === '강원'
                ? '강원특별자치도'
                : recommendedRegion,
              ['으로', '로'],
            )}{' '}
            여행을 떠나보는 건 어떨까요?
          </p>
          <button
            className="mt-2 text-sm p-0 text-[#EF6F6F] underline text-[0.875rem] flex items-center truncate"
            onClick={() => setFilterRecommendedOnly((prev) => !prev)}
          >
            {filterRecommendedOnly
              ? '전체 지역 보기'
              : `${recommendedRegion === '강원' ? '강원특별자치도' : recommendedRegion}만 보기`}
          </button>
        </div>
      )}
      <button
        onClick={() => navigate('/search')}
        className="mt-4 w-full py-2 bg-[#EF6F6F] text-white font-semibold rounded-lg transition shadow flex justify-center items-center gap-2"
      >
        <img src={pinWhite} alt="검색" className="w-4 h-4 " />
        탐색하러 가기
      </button>

      <div className="mt-6 flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <p className="text-center text-sm text-gray-400">불러오는 중...</p>
        ) : stores.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            좋아요한 항목이 없습니다.
          </p>
        ) : (
          Object.entries(groupedStores)
            .filter(([region]) =>
              filterRecommendedOnly ? region === recommendedRegion : true,
            )
            .map(([region, items]) => (
              <div key={region} className="mb-6">
                <h2 className="text-lg font-bold text-[#383D48] mb-2">
                  {region}
                </h2>
                {items.map((store) => (
                  <div
                    key={store.id}
                    className="relative group overflow-hidden rounded-lg shadow mb-3 bg-white"
                  >
                    <div className="flex transition-transform duration-300 group-hover:-translate-x-[4rem]">
                      <img
                        src={store.img || 'https://picsum.photos/200/120'}
                        alt={store.title}
                        className="w-24 h-20 object-cover"
                      />
                      <div className="flex-1 px-3 py-2 min-w-0">
                        <p className="text-[1rem] text-[#383D48] truncate font-[Kakao Small Sans]">
                          {store.title}
                        </p>
                        <p className="text-[0.875rem] text-[#596072] flex items-center gap-1 truncate font-[Kakao Small Sans]">
                          <img
                            src={LocationIcon}
                            alt="location"
                            className="w-4 h-4"
                          />
                          {store.location ?? '위치 정보 없음'}
                        </p>
                        <p className="text-[0.875rem] text-[#596072] flex items-center gap-1 font-[Kakao Small Sans]">
                          <img src={LikeIcon} alt="like" className="w-4 h-4" />
                          {store.likeCount ?? 0}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(store.id)}
                      className="absolute right-0 top-0 bottom-0 w-[4rem] bg-[#EF6F6F] text-white text-sm font-semibold flex items-center justify-center transition-opacity duration-300 group-hover:opacity-100 opacity-0"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            ))
        )}
        <div className="shrink-0 pb-6 pt-2 border-t">
          <button
            onClick={handleConfirm}
            className="w-full text-white py-3 font-semibold"
            style={{
              borderRadius: '0.75rem',
              background: '#EF6F6F',
              boxShadow: '0 4px 20px 0 #BEC4D3',
            }}
          >
            여행지 확정하기
          </button>
        </div>
      </div>

      {/* 검증 모달 */}
      <Modal
        open={showValidationModal}
        title="입력 정보 확인"
        description="다이어리 제목과 여행 일정을 입력해주세요."
        confirmText="확인"
        onConfirm={() => setShowValidationModal(false)}
        onClose={() => setShowValidationModal(false)}
      />
    </div>
  );
}
