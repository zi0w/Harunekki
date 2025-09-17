import { supabase } from '@/lib/supabase/supabase';

export type Diary = {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  cover_image?: string;
  region_name?: string;
  created_at: string;
};

export type DiaryPlace = {
  id: string;
  diary_id: string;
  place_name: string;
  day: number;
  order_index: number;
  visited: boolean;
  poi_id?: string;
  created_at: string;
  tour_pois?: {
    contentid: string;
    title: string;
    addr1: string | null;
    mapx: number | null;
    mapy: number | null;
    firstimage: string | null;
  };
};

/** ✅ 다이어리 + 장소 생성 */
// 예시
export async function createDiaryWithPlaces({
  userId,
  title,
  startDate,
  endDate,
  stores,
  dayPlaces,
  regionName,
}: {
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  stores: Array<{ id: string; title: string; type: 'restaurant' | 'food' }>;
  dayPlaces?: Array<{
    day: number;
    order_index: number;
    store: { id: string; title: string; type: 'restaurant' | 'food' };
  }>;
  regionName?: string;
}) {
  const { data: diary, error } = await supabase
    .from('diaries')
    .insert({
      user_id: userId,
      title,
      start_date: startDate,
      end_date: endDate,
      region_name: regionName,
    })
    .select('*')
    .single();

  if (error) throw error;

  // 실제 여행 일정에 맞춰서 day 계산 (로컬 시간대 사용)
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 로컬 시간대로 날짜만 추출 (시간 무시)
  const startLocal = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  // 날짜 차이를 정확히 계산
  const timeDiff = endLocal.getTime() - startLocal.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const totalDays = daysDiff + 1; // 시작일 포함

  // dayPlaces가 있으면 사용자가 설정한 배치를 사용, 없으면 자동 분배
  let placeRows;

  if (dayPlaces && dayPlaces.length > 0) {
    // 사용자가 설정한 day별 배치 사용
    placeRows = dayPlaces.map(({ day, order_index, store }) => ({
      diary_id: diary.id,
      day,
      order_index,
      place_name: store.title,
      poi_id: store.type === 'restaurant' ? store.id : null,
      food_id: store.type === 'food' ? store.id : null,
    }));
  } else {
    // 기존 자동 분배 로직
    placeRows = stores.map((item, index) => {
      // 전체 장소 수를 여행 일수로 나누어서 각 day에 몇 개씩 배치할지 계산
      const placesPerDay = Math.ceil(stores.length / totalDays);
      const day = Math.min(Math.floor(index / placesPerDay) + 1, totalDays);

      // 각 day 내에서의 순서 계산
      const dayStartIndex = (day - 1) * placesPerDay;
      const orderInDay = index - dayStartIndex + 1;

      return {
        diary_id: diary.id,
        day,
        order_index: orderInDay,
        place_name: item.title,
        poi_id: item.type === 'restaurant' ? item.id : null,
        food_id: item.type === 'food' ? item.id : null,
      };
    });
  }

  const { error: placeError } = await supabase
    .from('diary_places')
    .insert(placeRows);

  if (placeError) throw placeError;

  return diary;
}

/** ✅ 내 다이어리 전체 조회 */
export async function fetchDiaries(userId: string): Promise<Diary[]> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** ✅ 특정 다이어리 + 장소 조회 */
export async function fetchDiaryWithPlaces(diaryId: string) {
  const { data: diary, error: diaryError } = await supabase
    .from('diaries')
    .select('*')
    .eq('id', diaryId)
    .single();

  if (diaryError) throw diaryError;

  const { data: places, error: placeError } = await supabase
    .from('diary_places')
    .select(
      `
      id,
      day,
      order_index,
      place_name,
      visited,
      poi_id,
      food_id,
      tour_pois (
        contentid,
        title,
        addr1,
        firstimage,
        mapx,
        mapy
      ),
      seasonal_foods (
        id,
        name,
        region_code
      )
    `,
    )
    .eq('diary_id', diaryId)
    .order('day', { ascending: true })
    .order('order_index', { ascending: true });

  if (placeError) throw placeError;

  return { diary, places };
}

/** ✅ 다이어리 삭제 */
export async function deleteDiary(diaryId: string) {
  // 1. 다이어리와 관련된 모든 장소들 삭제
  const { error: placesError } = await supabase
    .from('diary_places')
    .delete()
    .eq('diary_id', diaryId);

  if (placesError) throw placesError;

  // 2. 다이어리 삭제
  const { error: diaryError } = await supabase
    .from('diaries')
    .delete()
    .eq('id', diaryId);

  if (diaryError) throw diaryError;
}

/** ✅ 다이어리 커버 이미지 설정 */
export async function setDiaryCoverImage(
  diaryId: string,
  coverImageUrl: string,
) {
  const { error } = await supabase
    .from('diaries')
    .update({ cover_image: coverImageUrl })
    .eq('id', diaryId);

  if (error) throw error;
}

/** ✅ 기존 다이어리들의 region_name 업데이트 (장소명 기반) */
export async function updateDiaryRegionNames(userId: string) {
  // region_name이 NULL인 다이어리들 조회
  const { data: diaries, error: diariesError } = await supabase
    .from('diaries')
    .select(
      `
      id,
      diary_places!inner(place_name)
    `,
    )
    .eq('user_id', userId)
    .is('region_name', null);

  if (diariesError) throw diariesError;

  if (!diaries || diaries.length === 0) return;

  // 각 다이어리에 대해 지역명 추출 및 업데이트
  for (const diary of diaries) {
    const places = diary.diary_places;
    const placeNames = places.map(
      (place: { place_name: string }) => place.place_name,
    );

    // 장소명에서 지역명 추출
    const regionName = extractRegionNameFromPlaces(placeNames);

    // region_name 업데이트
    const { error: updateError } = await supabase
      .from('diaries')
      .update({ region_name: regionName })
      .eq('id', diary.id);

    if (updateError) {
      console.error(`다이어리 ${diary.id} 지역명 업데이트 실패:`, updateError);
    }
  }
}

/** 장소명에서 지역명 추출하는 헬퍼 함수 */
function extractRegionNameFromPlaces(placeNames: string[]): string {
  if (placeNames.length === 0) return '국내 여행';

  const foundRegions = new Set<string>();

  // 지역명 패턴들
  const regionPatterns = [
    /제주|제주도/,
    /서울|서울시/,
    /부산|부산시/,
    /대구|대구시/,
    /인천|인천시/,
    /광주|광주시/,
    /대전|대전시/,
    /울산|울산시/,
    /경기|경기도/,
    /강원|강원도/,
    /충북|충청북도/,
    /충남|충청남도/,
    /전북|전라북도/,
    /전남|전라남도/,
    /경북|경상북도/,
    /경남|경상남도/,
    /세종|세종시/,
  ];

  const specialCities = [
    '서울',
    '부산',
    '대구',
    '인천',
    '광주',
    '대전',
    '울산',
    '세종',
  ];

  // 모든 장소에서 지역명 패턴 매칭
  for (const placeName of placeNames) {
    for (const pattern of regionPatterns) {
      const match = placeName.match(pattern);
      if (match) {
        const region = match[0];

        // 특별시/광역시는 그대로 저장
        if (specialCities.includes(region)) {
          foundRegions.add(region);
          continue;
        }

        // 도 단위는 그대로 저장
        if (region.includes('도')) {
          foundRegions.add(region);
          continue;
        }

        // 시 단위는 그대로 저장
        if (region.includes('시')) {
          foundRegions.add(region);
          continue;
        }

        // 그 외에는 도 추가해서 저장
        foundRegions.add(region + '도');
      }
    }
  }

  // 지역이 하나도 발견되지 않으면 '국내 여행'
  if (foundRegions.size === 0) {
    return '국내 여행';
  }

  // 지역이 하나면 해당 지역 반환
  if (foundRegions.size === 1) {
    return Array.from(foundRegions)[0];
  }

  // 여러 지역이 섞여있으면 '국내 여행'
  return '국내 여행';
}
