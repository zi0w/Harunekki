import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import HeaderBar from '@/components/layout/HeaderBar';
import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CartIcon from '@/assets/icons/header/suitcase.svg';
import SearchFilterHeader from '../layout/SearchFilterHeader';

const Layout = () => {
  const { pathname } = useLocation();
  const [diaryTitle, setDiaryTitle] = useState<string>('다이어리');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 홈
  const isHome = pathname === '/';

  //제철음식 페이지
  const isSeasonalFoods = pathname.startsWith('/foods/seasonal');

  //인기 식당 페이지
  const isHotRestaurants = pathname.startsWith('/restaurants/hot');
  //검색 페이지
  const isSearch = pathname.startsWith('/search');
  // const isSearchFilter = pathname.startsWith('/search/filter');

  //좋아요한 페이지
  const isLiked = pathname.startsWith('/likes');
  // const isLikedFilter = pathname.startsWith('/likes/filter');

  const isAuth = pathname === '/login' || pathname.startsWith('/auth');
  const isOnboarding = pathname === '/onboarding';

  // 마이페이지 상세
  const isInfo = pathname.startsWith('/mypage/info');
  const isInfoEdit = pathname === '/mypage/info/edit';
  const isBadges = pathname.startsWith('/mypage/badges');

  // 추천 페이지
  const isRecommend = pathname.startsWith('/recommend');
  const isRecommendChat = pathname.startsWith('/recommend/chat');

  // 이벤트 페이지
  const isEvent = pathname.startsWith('/event');

  // 다이어리 페이지
  const isDiaryDetail =
    pathname.startsWith('/diary/') && pathname.split('/').length === 3;
  const isDiaryRecord =
    pathname.startsWith('/diary/') && pathname.includes('/place/');

  // 다이어리 제목 업데이트 감지
  useEffect(() => {
    const checkDiaryTitle = () => {
      const windowObj = window as unknown as {
        diaryTitle?: string;
        diaryLoading?: boolean;
      };
      const title = windowObj.diaryTitle;
      const loading = windowObj.diaryLoading;

      if (isDiaryDetail) {
        if (loading) {
          setDiaryTitle('로딩 중...');
        } else if (title) {
          setDiaryTitle(title);
        } else {
          setDiaryTitle('다이어리');
        }
      }
    };

    checkDiaryTitle();
    const interval = setInterval(checkDiaryTitle, 100);

    return () => clearInterval(interval);
  }, [isDiaryDetail, pathname]);

  // 하단 네비는 특정 화면에서만 숨김 처리
  const hideFooter =
    isAuth ||
    isOnboarding ||
    isInfo ||
    isBadges ||
    isRecommend ||
    isRecommendChat ||
    isDiaryDetail ||
    isDiaryRecord ||
    isEvent;

  return (
    <div
      className="w-full sm:max-w-[375px] h-full flex flex-col relative"
      style={{
        background: isDiaryDetail
          ? 'linear-gradient(180deg, #F9FAFB 0%, rgba(239, 111, 111, 0.2) 100%)'
          : '#F9FAFB',
      }}
    >
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
          ) : isEvent ? (
            <HeaderBar
              variant="back"
              title="이벤트"
              backTo="/"
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
          ) : isDiaryDetail ? (
            <HeaderBar
              variant="back"
              title={diaryTitle}
              backTo="/diary"
              heightClassName="h-[40px]"
              bgClassName="bg-[#F9FAFB]"
              withBorder={true}
            />
          ) : isDiaryRecord ? (
            <HeaderBar
              variant="back"
              title="다이어리 기록"
              backTo={`/diary/${pathname.split('/')[2]}`}
              heightClassName="h-[40px]"
              bgClassName="bg-[#F9FAFB]"
              withBorder={true}
            />
          ) : isLiked ? (
            <SearchFilterHeader
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              onSearch={(keyword) => {
                setSearchKeyword(keyword);
              }}
              backTo="/"
            />
          ) : isSearch ? (
            <SearchFilterHeader
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              onSearch={(keyword) => {
                setSearchKeyword(keyword);
              }}
              backTo="/"
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
        } ${isEvent ? '' : 'pb-[68px]'}`}
      >
        <div className={isEvent ? '' : 'px-5'}>
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
