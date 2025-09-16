import Layout from '@/components/shared/Layout';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import AuthCallback from '@/pages/auth/AuthCallback';
import EmailLoginPage from '@/pages/auth/EmailLoginPage';
import EmailSignupPage from '@/pages/auth/EmailSignupPage';
import LoginPage from '@/pages/auth/LoginPage';
import OnboardingPage from '@/pages/auth/OnboardingPage';
import DiaryPage from '@/pages/diary/DiaryPage';
import DiaryDetailPage from '@/pages/diary/DiaryDetailPage';
import DiaryRecordPage from '@/pages/diary/DiaryRecordPage';
import EventPage from '@/pages/event/EventPage';
import SeasonalFoodDetailPage from '@/pages/foods/SeasonalFoodDetailPage';
import SeasonalFoodsPage from '@/pages/foods/SeasonalFoodsPage';
import HomePage from '@/pages/home/HomePage';
import MyBadges from '@/pages/mypage/MyBadges';
import MyInfo from '@/pages/mypage/MyInfo';
import MyInfoEdit from '@/pages/mypage/MyInfoEdit';
import MyPage from '@/pages/mypage/MyPage';
import RecommendPage from '@/pages/recommend/RecommendPage';
import HotRestaurantsPage from '@/pages/restaurants/HotRestaurantsPage';
import SearchPage from '@/pages/search/SearchPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LikedFilterPage from '@/pages/likes/LikedFilterPage';
import { useState } from 'react';
import LikedPage from '@/pages/likes/LikesPage';

const Router = () => {
  const [searchKeyword] = useState('');
  const [filter, setFilter] = useState<{
    categories: string[];
    seasonalOnly: boolean;
    localOnly: boolean;
  }>({
    categories: [],
    seasonalOnly: false,
    localOnly: false,
  });

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* 공개 페이지 (로그인 불필요) */}
          <Route
            path="/"
            element={
              <ProtectedRoute requireAuth={false}>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="/foods/seasonal" element={<SeasonalFoodsPage />} />
          <Route
            path="/foods/seasonal/detail"
            element={<SeasonalFoodDetailPage />}
          />
          <Route path="/restaurants/hot" element={<HotRestaurantsPage />} />
          <Route path="/recommend" element={<RecommendPage />} />
          <Route path="/event" element={<EventPage />} />
          <Route path="search" element={<SearchPage />} />

          {/* 인증 관련 페이지 */}
          <Route path="login" element={<LoginPage />} />
          <Route path="auth/email-login" element={<EmailLoginPage />} />
          <Route path="auth/email-signup" element={<EmailSignupPage />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="onboarding" element={<OnboardingPage />} />

          {/* 보호된 페이지 (로그인 필요) */}
          <Route
            path="likes"
            element={
              <ProtectedRoute requireAuth={true}>
                <LikedPage
                  filterOptions={filter}
                  searchKeyword={searchKeyword}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/likes/filter"
            element={
              <ProtectedRoute requireAuth={true}>
                <LikedFilterPage
                  filter={filter}
                  setFilter={setFilter}
                  onClose={() => window.history.back()}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/search/filter"
            element={
              <ProtectedRoute requireAuth={true}>
                <LikedFilterPage
                  filter={filter}
                  setFilter={setFilter}
                  onClose={() => window.history.back()}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="diary"
            element={
              <ProtectedRoute requireAuth={true}>
                <DiaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="diary/:id"
            element={
              <ProtectedRoute requireAuth={true}>
                <DiaryDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="diary/:diaryId/place/:placeId"
            element={
              <ProtectedRoute requireAuth={true}>
                <DiaryRecordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="mypage"
            element={
              <ProtectedRoute requireAuth={true}>
                <MyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="mypage/info"
            element={
              <ProtectedRoute requireAuth={true}>
                <MyInfo />
              </ProtectedRoute>
            }
          />
          <Route
            path="mypage/info/edit"
            element={
              <ProtectedRoute requireAuth={true}>
                <MyInfoEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="mypage/badges"
            element={
              <ProtectedRoute requireAuth={true}>
                <MyBadges />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
