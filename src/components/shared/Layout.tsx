import Header from '@/components/layout/Header';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <>
      <Header />
      <main className="w-[23.4375rem] h-[50.75rem] mx-auto bg-[#fff] overflow-hidden">
        <Outlet />
      </main>
      {/* 나중에 footer 필요시 이 위치에 넣으면 됨! */}
      {/* <Footer />  */}
    </>
  );
};

export default Layout;
