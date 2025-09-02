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
      nav(session ? '/' : '/login', { replace: true }); // 로그인 성공 → 홈으로
    })();
  }, [nav]);

  return <div className="grid h-dvh place-items-center">로그인 처리 중…</div>;
};

export default AuthCallback;
