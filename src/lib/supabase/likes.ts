import { supabase } from '@/lib/supabase/supabase';
import type { LikedItem } from '@/types/LikedItem';

/** ✅ 좋아요 토글 (로그인 필요, 서버에서 상태 반환) */
export async function toggleLike(contentId: string) {
  const { data, error } = await supabase.rpc('toggle_like', {
    p_content_id: contentId,
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  return {
    liked: !!row?.liked,
    likeCount: Number(row?.like_count ?? 0),
  };
}

/** ✅ 좋아요 수 집계 (비로그인도 가능) */
export async function fetchLikeCounts(contentIds: string[]) {
  if (!contentIds.length) return {};

  const { data, error } = await supabase
    .from('restaurant_like_counts') // ← 집계용 뷰 사용 시
    .select('content_id, like_count')
    .in('content_id', contentIds);

  if (error) throw new Error(error.message);

  return (data ?? []).reduce<Record<string, number>>((acc, cur) => {
    acc[cur.content_id] = Number(cur.like_count ?? 0);
    return acc;
  }, {});
}

/** ✅ 로그인한 유저가 누른 좋아요 목록 */
export async function fetchMyLiked(contentIds: string[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !contentIds.length) return new Set<string>();

  const { data, error } = await supabase
    .from('restaurant_likes')
    .select('content_id')
    .eq('user_id', user.id)
    .in('content_id', contentIds);

  if (error) throw new Error(error.message);

  return new Set((data ?? []).map((d) => d.content_id));
}
export async function ensureUserExists() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw userError ?? new Error('No user');

  // 기존 유저가 있는지 확인
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingUser) {
    // 새 유저인 경우에만 insert (소셜 로그인 시 name 포함, 이메일 로그인 시 null)
    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      name: user.user_metadata?.name ?? null,
    });
    if (insertError) throw insertError;
  }
  // 기존 유저가 있으면 아무것도 하지 않음 (기존 데이터 보존)
}

/** ✅ 음식 + 식당 좋아요 전체 가져오기 */
export async function fetchAllLikedItems(): Promise<LikedItem[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  // 1. 음식 좋아요 가져오기
  const { data: likedFoods, error: likedFoodsError } = await supabase
    .from('food_likes')
    .select('food_id') // join 필요
    .eq('user_id', user.id);

  if (likedFoodsError) throw new Error(likedFoodsError.message);

  const foodIds = likedFoods.map((d) => d.food_id);
  const { data: foods, error: foodsError } = await supabase
    .from('seasonal_foods')
    .select('*')
    .in('id', foodIds);

  if (foodsError) throw new Error(foodsError.message);

  const foodItems: LikedItem[] = (foods ?? []).map((f) => ({
    id: f.id,
    title: f.name,
    img: '', // 음식은 이미지 없으면 비워둠 (필요시 썸네일 추가 가능)
    category: '',
    isSeasonal: true,
    isLocal: f.region_code != null,
    type: 'food',
  }));

  // 2. 식당 좋아요 가져오기
  const { data: likedRestaurants, error: likedRestError } = await supabase
    .from('restaurant_likes')
    .select('content_id') // join 필요
    .eq('user_id', user.id);

  if (likedRestError) throw new Error(likedRestError.message);

  const restIds = likedRestaurants.map((d) => d.content_id);
  const { data: pois, error: poisError } = await supabase
    .from('tour_pois')
    .select('*')
    .in('contentid', restIds);

  if (poisError) throw new Error(poisError.message);

  const restaurantItems: LikedItem[] = (pois ?? []).map((r) => ({
    id: r.contentid,
    title: r.title,
    img: r.firstimage ?? '',
    location: r.addr1 ?? '',
    category: r.category ?? '',
    isSeasonal: r.is_seasonal ?? false,
    isLocal: r.is_local_special ?? false,
    type: 'restaurant',
  }));

  // 3. 음식 + 식당 합치기
  return [...foodItems, ...restaurantItems];
}
