// src/components/LikedFilterPage.tsx
import type { Dispatch, SetStateAction } from 'react';

const CATEGORY = [
  '한식',
  '중식',
  '일식',
  '분식',
  '양식',
  '제과',
  '패스트푸드',
  '치킨',
  '주점',
  '카페',
];
interface Props {
  filter: {
    categories: string[];
    seasonalOnly: boolean;
    localOnly: boolean;
  };
  setFilter: Dispatch<
    SetStateAction<{
      categories: string[];
      seasonalOnly: boolean;
      localOnly: boolean;
    }>
  >;
  onClose: () => void;
}

export default function LikedFilterPage({ filter, setFilter, onClose }: Props) {
  const toggleCategory = (cat: string) => {
    setFilter((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  };

  const toggleSwitch = (key: 'seasonalOnly' | 'localOnly') => {
    setFilter((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const reset = () => {
    setFilter({ categories: [], seasonalOnly: false, localOnly: false });
  };

  return (
    <div className="mx-auto w-full max-w-[20.9375rem] overflow-x-hidden mt-7">
      <h2 className="text-[15px] font-bold mb-3">카테고리</h2>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORY.map((cat) => (
          <button
            key={cat}
            className={`rounded-lg py-2 text-sm font-medium border ${
              filter.categories.includes(cat)
                ? 'bg-[#FEEFEF] text-[#EF6F6F] border-[#EF6F6F]'
                : 'bg-white text-[#8A8A8A] border-[#E0E0E0]'
            }`}
            onClick={() => toggleCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>제철 음식 식당 보기</span>
          <input
            type="checkbox"
            className="form-checkbox"
            checked={filter.seasonalOnly}
            onChange={() => toggleSwitch('seasonalOnly')}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>지역 특산물 식당 보기</span>
          <input
            type="checkbox"
            className="form-checkbox"
            checked={filter.localOnly}
            onChange={() => toggleSwitch('localOnly')}
          />
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="flex-1 py-3 rounded-lg text-sm bg-[#F5F5F5] text-[#8A8A8A]"
        >
          초기화
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-lg text-sm bg-[#EF6F6F] text-white"
        >
          적용
        </button>
      </div>
    </div>
  );
}
