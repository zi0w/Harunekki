import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
  const { pathname } = useLocation();
  const hideHeader =
    pathname === '/login' || pathname.startsWith('/auth');
  const hideFooter = 
    pathname === '/login' || pathname === '/onboarding';

  return (
    <div className="relative w-[375px] h-[812px] bg-[#F9FAFB] overflow-hidden">
      <div className="flex h-full flex-col">
        {/* 헤더 자리: 높이 고정 */}
        <header className="h-[94px] shrink-0">
          {!hideHeader && <Header />}
        </header>

        {/* 콘텐츠: 남는 공간 전부 차지, 스크롤 가능 */}
        <main className="flex-1 mx-5">
          <Outlet />
        </main>

        {/* 하단 네비 자리: 높이 고정 */}
        <footer className="h-[102px] shrink-0 bg-[#FDFDFE]">
          {!hideFooter && <BottomNav />}
        </footer>
      </div>
    </div>
  );
};

export default Layout;
