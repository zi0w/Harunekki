// components/Layout.tsx
// components/Layout.tsx
import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="w-[23.4375rem] h-[50.75rem] mx-auto bg-[#fff] overflow-hidden">
      {children}
    </div>
  );
};

export default Layout;
