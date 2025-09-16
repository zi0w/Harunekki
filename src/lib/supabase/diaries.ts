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
}: {
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  stores: Array<{ id: string; title: string; type: 'restaurant' | 'food' }>;
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

  // Day별 4개씩 나누기
  const placeRows = stores.map((item, index) => ({
    diary_id: diary.id,
    day: Math.floor(index / 4) + 1,
    order_index: (index % 4) + 1,
    place_name: item.title,
    poi_id: item.type === 'restaurant' ? item.id : null,
    food_id: item.type === 'food' ? item.id : null,
  }));

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
