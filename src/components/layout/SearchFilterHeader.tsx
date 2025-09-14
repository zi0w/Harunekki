// src/components/layout/SearchFilterHeader.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import HeaderBar from '@/components/layout/HeaderBar';
import SearchIcon from '@/assets/icons/search/Search.svg';
import FilterIcon from '@/assets/icons/search/FIlter.svg';

interface Props {
  searchKeyword: string;
  setSearchKeyword: (value: string) => void;
  backTo?: string;
  onSearch?: (keyword: string) => void;
}

export default function SearchFilterHeader({
  searchKeyword,
  setSearchKeyword,
  backTo = '/',
  onSearch,
}: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // base path (likes or search 등)
  const basePath = pathname.endsWith('/filter')
    ? pathname.replace('/filter', '')
    : pathname;

  const isFilterPage = pathname.endsWith('/filter');
  const handleSearch = () => {
    if (onSearch) onSearch(searchKeyword.trim());
  };

  return (
    <HeaderBar
      variant="back"
      title=""
      backTo={backTo}
      heightClassName="h-[64px]"
      bgClassName="bg-[#F9FAFB]"
      withBorder={true}
      rightSlot={
        <div className="flex flex-1 items-center gap-2 ml-2">
          <div className="flex items-center gap-2 rounded-full bg-[#F0F0F0] px-3 py-2 flex-1">
            <img src={SearchIcon} className="w-full h-full" />
            <input
              type="text"
              placeholder="음식명으로 검색해보세요."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(); //
                }
              }}
              className="bg-transparent text-sm flex-1 outline-none"
            />
          </div>
          <button
            onClick={() => {
              navigate(isFilterPage ? basePath : `${basePath}/filter`);
            }}
            className="shrink-0 ml-2"
          >
            <img src={FilterIcon} className="w-6 h-6" />
          </button>
        </div>
      }
    />
  );
}
