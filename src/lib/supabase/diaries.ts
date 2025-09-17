import { supabase } from '@/lib/supabase/supabase';

export type Diary = {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  cover_image?: string;
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
}) {
  const { data: diary, error } = await supabase
    .from('diaries')
    .insert({
      user_id: userId,
      title,
      start_date: startDate,
      end_date: endDate,
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
