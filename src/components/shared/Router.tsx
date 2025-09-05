import Layout from '@/components/shared/Layout';
import AuthCallback from '@/pages/auth/AuthCallback';
import LoginPage from '@/pages/auth/LoginPage';
import OnboardingPage from '@/pages/auth/OnboardingPage';
import DiaryPage from '@/pages/diary/DiaryPage';
import HomePage from '@/pages/home/HomePage';
import LikesPage from '@/pages/likes/LikesPage';
import MyBadges from '@/pages/mypage/MyBadges';
import MyInfo from '@/pages/mypage/MyInfo';
import MyInfoEdit from '@/pages/mypage/MyInfoEdit';
import MyPage from '@/pages/mypage/MyPage';
import RecommendPage from '@/pages/recommend/RecommendPage';
import SearchPage from '@/pages/search/SearchPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/recommend" element={<RecommendPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="likes" element={<LikesPage />} />
          <Route path="diary" element={<DiaryPage />} />
          <Route path="mypage" element={<MyPage />} />
          <Route path="mypage/info" element={<MyInfo />} />
          <Route path="mypage/info/edit" element={<MyInfoEdit />} />
          <Route path="mypage/badges" element={<MyBadges />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
