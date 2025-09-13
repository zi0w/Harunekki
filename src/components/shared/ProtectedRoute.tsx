import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAuth?: boolean; // true: 로그인 필요, false: 비로그인 필요
};

export default function ProtectedRoute({
  children,
  requireAuth = true,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const authenticated = !!user;
        setIsAuthenticated(authenticated);

        if (requireAuth && !authenticated) {
          // 로그인이 필요한 페이지인데 로그인되지 않음
          navigate('/login', { replace: true });
        }
        // requireAuth=false인 경우는 로그인 상태와 관계없이 접근 허용
      } catch (error) {
        console.error('Auth check error:', error);
        if (requireAuth) {
          navigate('/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, requireAuth]);

  // 로딩 중이거나 로그인이 필요한 페이지인데 인증되지 않았으면 로딩 표시
  if (loading || (requireAuth && !isAuthenticated)) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EF6F6F] mx-auto mb-4"></div>
          <p className="text-[#596072]">로딩 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
