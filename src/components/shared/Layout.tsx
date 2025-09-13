import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import HeaderBar from '@/components/layout/HeaderBar';
import { Outlet, useLocation } from 'react-router-dom';
import CartIcon from '@/assets/icons/header/suitcase.svg';
const Layout = () => {
  const { pathname } = useLocation();

  const isHome = pathname === '/';
  const isSeasonalFoods = pathname.startsWith('/foods/seasonal');
  const isHotRestaurants = pathname.startsWith('/restaurants/hot');

  const isAuth = pathname === '/login' || pathname.startsWith('/auth');
  const isOnboarding = pathname === '/onboarding';

  // 마이페이지 상세
  const isInfo = pathname.startsWith('/mypage/info');
  const isInfoEdit = pathname === '/mypage/info/edit';
  const isBadges = pathname.startsWith('/mypage/badges');

  // 추천 페이지
  const isRecommend = pathname.startsWith('/recommend');
  const isRecommendChat = pathname.startsWith('/recommend/chat');

  // 하단 네비는 특정 화면에서만 숨김 처리
  const hideFooter =
    isAuth ||
    isOnboarding ||
    isInfo ||
    isBadges ||
    isRecommend ||
    isRecommendChat;

  return (
    <div className="w-full sm:max-w-[375px] h-full bg-[#F9FAFB] flex flex-col relative">
      {/* 상단 헤더 - 고정 */}
      {!isAuth && (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full sm:max-w-[375px] z-50 bg-[#F9FAFB]">
          {isInfo || isBadges ? (
            <HeaderBar
              variant="back"
              title={
                isInfo
                  ? isInfoEdit
                    ? '내 정보 수정'
                    : '내 정보'
                  : '내가 받은 뱃지'
              }
              backTo={
                isInfo ? (isInfoEdit ? '/mypage/info' : '/mypage') : '/mypage'
              }
              heightClassName="h-[40px]"
              bgClassName="bg-[#F9FAFB]"
              withBorder={true}
            />
          ) : isRecommend ? (
            <HeaderBar
              variant="back"
              title="AI 추천"
              backTo={isRecommendChat ? '/recommend' : '/'}
              heightClassName="h-[40px]"
              bgClassName="bg-[#F9FAFB]"
              withBorder={true}
            />
          ) : isHome ? (
            <HeaderBar
              variant="logo"
              rightSlot={
                <img
                  src={CartIcon}
                  alt="장바구니"
                  className="h-5 w-5 cursor-pointer"
                />
              }
              heightClassName="h-[40px]"
              bgClassName="bg-[#F9FAFB]"
              withBorder={true}
            />
          ) : isSeasonalFoods ? (
            <HeaderBar
              variant="back"
              title="이달의 제철 음식"
              backTo="/"
              heightClassName="h-[40px]"
              bgClassName="bg-[#F9FAFB]"
              withBorder={true}
            />
          ) : isHotRestaurants ? (
            <HeaderBar
              variant="back"
              title="지금 가장 인기있는 식당"
              backTo="/"
              heightClassName="h-[40px]"
              bgClassName="bg-[#F9FAFB]"
              withBorder={true}
            />
          ) : (
            <Header />
          )}
        </div>
      )}

      {/* 메인 콘텐츠 영역 - 스크롤 가능 */}
      <main
        className={`flex-1 overflow-y-auto scrollbar-hide ${
          !isAuth ? 'pt-[40px]' : ''
        } ${!hideFooter ? 'pb-[68px]' : ''}`}
      >
        <div className="px-5">
          <Outlet />
        </div>
      </main>

      {/* 하단 네비게이션 - 고정 */}
      {!hideFooter && (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full sm:max-w-[375px] z-50 bg-[#FDFDFE] border-t">
          <BottomNav />
        </div>
      )}
    </div>
  );
};

export default Layout;
