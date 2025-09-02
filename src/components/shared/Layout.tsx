import Header from '@/components/layout/Header';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();
  const hideHeader = location.pathname === '/login';

  return (
    <div className="relative mx-auto w-full w-[375px] h-[812px] bg-[#F9FAFB] overflow-hidden">
      <main className="pt-[54px] pb-[34px] h-full overflow-y-auto">
        {!hideHeader && <Header />}
        <Outlet />
      </main>
      {/* 나중에 footer 필요시 이 위치에 넣으면 됨! */}
    </div>
  );
};

export default Layout;
