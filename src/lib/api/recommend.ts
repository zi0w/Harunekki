import { supabase } from '@/lib/supabase/supabase';

export async function askRecommend(
  query: string,
  previousRecommendations?: string[],
  conversationHistory?: Array<{ role: string; content: string }>,
) {
  const { data, error } = await supabase.functions.invoke('recommend', {
    body: { query, previousRecommendations, conversationHistory },
  });
  if (error) throw error;
  return (data as { text: string }).text;
}
