import Layout from '@/components/shared/Layout';
import LoginPage from '@/pages/auth/LoginPage';
import DiaryPage from '@/pages/diary/DiaryPage';
import HomePage from '@/pages/home/HomePage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="diary" element={<DiaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
