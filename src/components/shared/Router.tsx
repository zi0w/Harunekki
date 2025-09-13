import Layout from '@/components/shared/Layout';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import AuthCallback from '@/pages/auth/AuthCallback';
import LoginPage from '@/pages/auth/LoginPage';
import OnboardingPage from '@/pages/auth/OnboardingPage';
import DiaryPage from '@/pages/diary/DiaryPage';
import DiaryDetailPage from '@/pages/diary/DiaryDetailPage';
import DiaryRecordPage from '@/pages/diary/DiaryRecordPage';
import SeasonalFoodDetailPage from '@/pages/foods/SeasonalFoodDetailPage';
import SeasonalFoodsPage from '@/pages/foods/SeasonalFoodsPage';
import HomePage from '@/pages/home/HomePage';
import LikesPage from '@/pages/likes/LikesPage';
import MyBadges from '@/pages/mypage/MyBadges';
import MyInfo from '@/pages/mypage/MyInfo';
import MyInfoEdit from '@/pages/mypage/MyInfoEdit';
import MyPage from '@/pages/mypage/MyPage';
import RecommendPage from '@/pages/recommend/RecommendPage';
import HotRestaurantsPage from '@/pages/restaurants/HotRestaurantsPage';
import SearchPage from '@/pages/search/SearchPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const Router = () => {
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
          <Route path="search" element={<SearchPage />} />

          {/* 인증 관련 페이지 */}
          <Route path="login" element={<LoginPage />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="onboarding" element={<OnboardingPage />} />

          {/* 보호된 페이지 (로그인 필요) */}
          <Route
            path="likes"
            element={
              <ProtectedRoute requireAuth={true}>
                <LikesPage />
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
