import Header from '@/components/layout/Header';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="relative mx-auto w-full max-w-[375px] h-[812px] bg-[#F9FAFB] overflow-hidden">
      <main className="pt-[54px] pb-[34px] h-full overflow-y-auto">
        <Header />
        <Outlet />
      </main>
      {/* 나중에 footer 필요시 이 위치에 넣으면 됨! */}
    </div>
  );
};

export default Layout;
