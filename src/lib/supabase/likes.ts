// lib/supabase/likes.ts
import { supabase } from '@/lib/supabase/supabase';

/** 단일 컨텐츠 좋아요 토글 (로그인 필요) */
export async function toggleLike(contentId: string) {
  const { data, error } = await supabase.rpc('toggle_like', {
    p_content_id: contentId,
  });
  if (error) throw new Error(error.message); // 서버의 상세 에러(미로그인 등)가 alert로 보이게
  const row = Array.isArray(data) ? data[0] : data;
  return { liked: !!row?.liked, likeCount: Number(row?.like_count ?? 0) };
}

/** 여러 컨텐츠의 좋아요 집계를 가져오기 (비로그인도 가능) */
export async function fetchLikeCounts(contentIds: string[]) {
  if (!contentIds.length) return {};

  const { data, error } = await supabase
    .from('restaurant_like_counts')
    .select('content_id, like_count')
    .in('content_id', contentIds);

  if (error) throw new Error(error.message);

  // { [content_id]: like_count } 형태로 변환
  return (data ?? []).reduce<Record<string, number>>((acc, cur) => {
    acc[cur.content_id] = Number(cur.like_count ?? 0);
    return acc;
  }, {});
}

/** 현재 로그인 사용자가 눌러둔 좋아요 목록(해당 contentIds 범위에서만) */
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
