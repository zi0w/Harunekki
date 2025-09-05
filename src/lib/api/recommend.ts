import { supabase } from '@/lib/supabase/supabase';

export async function askRecommend(query: string) {
  const { data, error } = await supabase.functions.invoke('recommend', {
    body: { query },
  });
  if (error) throw error;
  return (data as { text: string }).text;
}
