// src/pages/auth/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';

export default function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        nav('/login', { replace: true });
        return;
      }

      const user = session.user;

      // 1) users 행 보장 (중복/경합 안전하게 upsert)
      const { error: upsertErr } = await supabase
        .from('users')
        .upsert(
          { id: user.id, name: user.user_metadata?.name ?? null },
          { onConflict: 'id' },
        );
      if (upsertErr) {
        console.error('users upsert error:', upsertErr);
        nav('/login', { replace: true });
        return;
      }

      // 2) 온보딩 완료 여부 판단
      const { data: row, error: fetchErr } = await supabase
        .from('users')
        .select('name, age, gender')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchErr) {
        console.error('users fetch error:', fetchErr);
        nav('/login', { replace: true });
        return;
      }

      const completed = !!(
        row?.name &&
        row?.age !== null &&
        row?.age !== undefined &&
        row?.gender
      );
      nav(completed ? '/' : '/onboarding', { replace: true });
    })();
  }, [nav]);

  return <div className="grid h-dvh place-items-center">로그인 처리 중…</div>;
}
