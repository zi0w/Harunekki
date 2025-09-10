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
    <div className="relative w-full min-w-[375px] min-h-[812px] bg-[#F9FAFB] mx-auto flex flex-col">
      <div className="flex h-full min-h-0 flex-col">
        {!isAuth &&
          (isInfo || isBadges ? (
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
              heightClassName="h-[94px]"
              bgClassName="bg-[#F9FAFB]"
              withBorder={false}
            />
          ) : isRecommend ? (
            <HeaderBar
              variant="back"
              title="AI 추천"
              backTo={isRecommendChat ? '/recommend' : '/'}
              heightClassName="h-[94px]"
              bgClassName="bg-[#F9FAFB]"
              withBorder={false}
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
              heightClassName="h-[60px]"
              bgClassName="bg-[#F9FAFB]"
              withBorder={false}
            />
          ) : isSeasonalFoods ? (
            <HeaderBar
              variant="back"
              title="이달의 제철 음식"
              backTo="/" // 돌아갈 경로 지정 가능
              heightClassName="h-[64px]"
              bgClassName="bg-[#F9FAFB]"
            />
          ) : isHotRestaurants ? (
            <HeaderBar
              variant="back"
              title="지금 가장 인기있는 식당"
              backTo="/"
              heightClassName="h-[64px]"
              bgClassName="bg-[#F9FAFB]"
            />
          ) : (
            <Header />
          ))}

        <main className="flex-1 min-h-0 mx-5 overflow-y-auto">
          <Outlet />
        </main>

        {!hideFooter && (
          <div className="sticky bottom-0 z-10 bg-[#F9FAFB]">
            <div className="h-[68px] shrink-0">
              <BottomNav />
            </div>
          </div>
        )}
        <div className="h-[34px] shrink-0" />
      </div>
    </div>
  );
};

export default Layout;
