import { useState } from 'react';
import { supabase } from '@/lib/supabase/supabase';

type Props =
  | {
      type: 'poi';
      id: string;
      initialCount?: number;
      initialLiked?: boolean;
      size?: number;
    }
  | {
      type: 'food';
      id: string;
      initialCount?: number;
      initialLiked?: boolean;
      size?: number;
    };

export default function LikeButton(props: Props) {
  const [count, setCount] = useState(props.initialCount ?? 0);
  const [liked, setLiked] = useState(props.initialLiked ?? false);
  const size = props.size ?? 18;

  async function toggle() {
    try {
      // optimistic UI
      setLiked((v) => !v);
      setCount((c) => c + (liked ? -1 : +1));

      if (props.type === 'poi') {
        const { data, error } = await supabase.rpc('toggle_like', {
          p_content_id: props.id,
        });
        if (error) throw error;
        const row = data?.[0];
        setLiked(!!row?.liked);
        setCount(Number(row?.like_count ?? 0));
      } else {
        const { data, error } = await supabase.rpc('toggle_food_like', {
          p_food_id: props.id,
        });
        if (error) throw error;
        const row = data?.[0];
        setLiked(!!row?.liked);
        setCount(Number(row?.like_count ?? 0));
      }
    } catch {
      // 롤백
      setLiked((v) => !v);
      setCount((c) => c + (liked ? +1 : -1));
      // TODO: toast 에러 표시
    }
  }

  return (
    <button
      aria-label="like"
      onClick={toggle}
      className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm hover:shadow"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={liked ? '#EF6F6F' : 'none'}
        stroke={liked ? '#EF6F6F' : '#111'}
        strokeWidth="1.8"
      >
        <path d="M12 21s-6.716-4.35-9.333-7.2C1.5 12.5 1 10.5 2.5 9c1.5-1.5 4-1.4 5.5.2L12 13l4-3.8c1.5-1.6 4-1.7 5.5-.2 1.5 1.5 1 3.5-.167 4.8C18.716 16.65 12 21 12 21z" />
      </svg>
      <span className="text-sm text-[#383D48]">{count}</span>
    </button>
  );
}
