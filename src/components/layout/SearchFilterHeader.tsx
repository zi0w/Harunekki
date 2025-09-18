import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
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
}: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const basePath = pathname.endsWith('/filter')
    ? pathname.replace('/filter', '')
    : pathname;

  const isFilterPage = pathname.endsWith('/filter');

  const handleSearch = () => {
    const keyword = searchKeyword.trim();
    if (!keyword) return;
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
    // 입력값은 그대로 두고, 페이지 이동은 SearchPage에서 처리
  };

  // 👉 다른 경로로 이동했을 때만 검색어 초기화
  useEffect(() => {
    if (!pathname.startsWith('/search')) {
      setSearchKeyword('');
    }
  }, [pathname, setSearchKeyword]);

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
            <button
              onClick={handleSearch}
              className="p-0 w-5 h-5 flex items-center justify-center bg-[#F0F0F0] appearance-none border-none outline-none"
            >
              <img src={SearchIcon} className="w-full h-full" alt="검색" />
            </button>

            <input
              type="text"
              placeholder="음식명으로 검색해보세요."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="bg-transparent text-sm text-[#383D48] flex-1 outline-none"
            />
          </div>

          <button
            onClick={() => {
              navigate(isFilterPage ? basePath : `${basePath}/filter`);
            }}
            className="shrink-0 ml-2 bg-[#F9FAFB] appearance-none border-none outline-none"
          >
            <img src={FilterIcon} className="w-6 h-6" alt="필터" />
          </button>
        </div>
      }
    />
  );
}
