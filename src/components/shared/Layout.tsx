import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
  const { pathname } = useLocation();
  const hideChrome =
    pathname === '/login' || pathname.startsWith('/auth') || pathname === '/onboarding';

  return (
    // 바깥 프레임(375 x 812)은 그대로 유지
    <div className="relative mx-auto w-[375px] h-[812px] bg-[#F9FAFB] overflow-hidden">
      {/* 메인을 세로 플렉스 컨테이너로 */}
      <main className="flex h-full flex-col">
        {/* 헤더 (옵션) */}
        {!hideChrome && <Header />}

        {/* 스크롤 되는 본문 영역: 남은 공간을 모두 차지 */}
        <div className={`flex-1 overflow-y-auto ${hideChrome ? '' : 'pt-[54px]'}`}>
          <Outlet />
        </div>

        {/* 네비게이션 바: 메인 div의 가장 아래 (레이아웃 공간을 차지) */}
        {!hideChrome && <BottomNav />}
      </main>
    </div>
  );
};

export default Layout;
