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

      // 1) users 행 보장 (기존 데이터 보존 - 이름 null로 덮어쓰지 않음)
      const metadataName =
        (
          user.user_metadata as Record<string, unknown> | undefined
        )?.name?.toString?.() ??
        (
          user.user_metadata as Record<string, unknown> | undefined
        )?.full_name?.toString?.() ??
        null;

      const { data: existing, error: fetchExistingErr } = await supabase
        .from('users')
        .select('id, name, age, gender')
        .eq('id', user.id)
        .maybeSingle();
      if (fetchExistingErr) {
        console.error('users fetch-existing error:', fetchExistingErr);
        nav('/login', { replace: true });
        return;
      }

      if (!existing) {
        const { error: insertErr } = await supabase
          .from('users')
          .insert({ id: user.id, name: metadataName });
        if (insertErr) {
          console.error('users insert error:', insertErr);
          nav('/login', { replace: true });
          return;
        }
      } else if (!existing.name && metadataName) {
        // 기존 레코드의 name이 비어있고 메타데이터에 이름이 있으면 보강
        const { error: updateErr } = await supabase
          .from('users')
          .update({ name: metadataName })
          .eq('id', user.id);
        if (updateErr) {
          console.warn('users name backfill warning:', updateErr);
        }
      }

      // 2) 온보딩 완료 여부 판단 (최신값 다시 조회)
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
