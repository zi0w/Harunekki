import { supabase } from '@/lib/supabase/supabase';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
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

      // 1) Supabase에서 user 조회
      const { data: row } = await supabase
        .from('users')
        .select('name, age, gender')
        .eq('id', user.id)
        .maybeSingle();

      // 2) 없으면 생성
      if (!row) {
        await supabase.from('users').insert({
          id: user.id,
          name: user.user_metadata?.name ?? null,
        });
      }

      // 3) 온보딩 완료 판정
      const r = row ?? { name: null, age: null, gender: null };
      const completed = !!(r.name && r.age !== null && r.gender);

      nav(completed ? '/' : '/onboarding', { replace: true });
    })();
  }, [nav]);

  return <div className="grid h-dvh place-items-center">로그인 처리 중…</div>;
};

export default AuthCallback;
