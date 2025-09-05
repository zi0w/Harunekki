import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import HeaderBar from '@/components/layout/HeaderBar';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
  const { pathname } = useLocation();

  const isAuth = pathname === '/login' || pathname.startsWith('/auth');
  const isOnboarding = pathname === '/onboarding';
  const isInfo = pathname.startsWith('/mypage/info');
  const isInfoEdit = pathname === '/mypage/info/edit';
  const isBadge = pathname.startsWith('/mypage/badges'); // ← 앞에 슬래시 빠졌던 거도 고쳐줌

  const hideFooter =
    pathname === '/login' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/mypage/info') ||
    pathname.startsWith('/mypage/badges');

  return (
    <div className="relative w-[375px] h-[812px] bg-[#F9FAFB] overflow-hidden">
      <div className="flex h-full flex-col">
        {/* 헤더 */}
        {!isAuth &&
          (isInfo ? (
            <HeaderBar
              variant="back"
              title={isInfoEdit ? '내 정보 수정' : '내 정보'}
              backTo={isInfoEdit ? '/mypage/info' : '/mypage'}
              heightClassName="h-[94px]"
              bgClassName="bg-[#F9FAFB]"
            />
          ) : isBadge ? (
            <HeaderBar
              variant="back"
              title="내가 받은 뱃지"
              backTo="/mypage"
              heightClassName="h-[94px]"
              bgClassName="bg-[#F9FAFB]"
            />
          ) : (
            <Header />
          ))}

        {/* 콘텐츠 */}
        <main className="flex-1 mx-5">
          <Outlet />
        </main>

        {/* 하단 네비 */}
        <footer className="h-[102px] shrink-0 bg-[#FDFDFE]">
          {!hideFooter && <BottomNav />}
        </footer>
      </div>
    </div>
  );
};

export default Layout;
