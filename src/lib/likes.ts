import { supabase } from '@/lib/supabase/supabase';

export async function getLikeCounts(contentIds: string[]) {
  if (!contentIds.length) return {};
  const { data, error } = await supabase.rpc('get_like_counts', {
    ids: contentIds,
  });
  if (error) throw error;
  const map: Record<string, number> = {};
  for (const row of data as { content_id: string; like_count: number }[]) {
    map[row.content_id] = Number(row.like_count);
  }
  return map;
}

export async function getUserLikesFor(
  userId: string | null,
  contentIds: string[],
) {
  if (!userId || !contentIds.length) return new Set<string>();
  const { data, error } = await supabase
    .from('likes')
    .select('content_id')
    .in('content_id', contentIds)
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((d) => d.content_id));
}

export async function toggleLike(contentId: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('로그인이 필요합니다.');

  // 이미 눌렀는지 확인
  const { data: existing, error: selErr } = await supabase
    .from('likes')
    .select('content_id')
    .eq('user_id', user.id)
    .eq('content_id', contentId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    // 좋아요 취소
    const { error: delErr } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('content_id', contentId);
    if (delErr) throw delErr;
    return { liked: false };
  } else {
    // 좋아요 추가
    const { error: insErr } = await supabase
      .from('likes')
      .insert({ user_id: user.id, content_id: contentId });
    if (insErr) throw insErr;
    return { liked: true };
  }
}
