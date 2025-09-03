import { NavLink } from 'react-router-dom';

import home from '@/assets/icons/nav/nav_home.png';
import homeActive from '@/assets/icons/nav/nav_home_active.png';
import search from '@/assets/icons/nav/nav_search.png';
import searchActive from '@/assets/icons/nav/nav_search_active.png';
import likes from '@/assets/icons/nav/nav_like.png';
import likesActive from '@/assets/icons/nav/nav_like_active.png';
import diary from '@/assets/icons/nav/nav_diary.png';
import diaryActive from '@/assets/icons/nav/nav_diary_active.png';
import mypage from '@/assets/icons/nav/nav_mypage.png';
import mypageActive from '@/assets/icons/nav/nav_mypage_active.png';

const items = [
  { to: '/', label: '홈', icon: home, iconActive: homeActive, end: true },
  { to: '/search', label: '탐색', icon: search, iconActive: searchActive },
  { to: '/likes', label: '찜', icon: likes, iconActive: likesActive },
  { to: '/diary', label: '다이어리', icon: diary, iconActive: diaryActive },
  {
    to: '/mypage',
    label: '마이페이지',
    icon: mypage,
    iconActive: mypageActive,
  },
];

export default function BottomNav() {
  return (
    <nav
      className="
        h-[64px] w-full
        bg-white/95 backdrop-blur border-t
        pb-[calc(env(safe-area-inset-bottom,0px))]
      "
      aria-label="하단 네비게이션"
    >
      <ul className="grid grid-cols-5 h-full">
        {items.map(({ to, icon, iconActive, end, alt }) => (
          <li key={to} className="h-full">
            <NavLink
              to={to}
              end={end}
              className="flex h-full items-center justify-center"
            >
              {({ isActive }) => (
                <img
                  src={isActive ? iconActive : icon}
                  alt={alt}
                  width={48}
                  height={48}
                  draggable={false}
                  className="pointer-events-none select-none"
                />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
