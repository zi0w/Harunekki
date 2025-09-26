// src/pages/likes/LikedPage.tsx
import { useEffect, useState } from 'react';
import { fetchAllLikedItems, ensureUserExists } from '@/lib/supabase/likes';
import CardItem, { type Card } from '@/components/layout/CardItem';
import { supabase } from '@/lib/supabase/supabase';
import { useLocation } from 'react-router-dom';
import type { LikedItem } from '@/types/LikedItem';
import { CATEGORY_MAP } from '@/constants/categoryMap';

type FilterOptions = {
  categories: string[];
  seasonalOnly: boolean;
  localOnly: boolean;
};

interface Props {
  searchKeyword: string;
  filterOptions: FilterOptions;
}

export default function LikedPage({ searchKeyword, filterOptions }: Props) {
  const [items, setItems] = useState<LikedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const stateFilter = (location.state as { filter?: FilterOptions })?.filter;
  const effectiveFilter = stateFilter ?? filterOptions;

  useEffect(() => {
    fetchAllLikedItems()
      .then((res) => {
        setItems(res);
        setLoading(false);
      })
      .catch((error) => {
        console.error('좋아요 아이템 로드 실패:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    ensureUserExists()
      .then(() => {
        supabase.auth.getUser();
      })
      .catch((err) => {
        console.error('유저 등록 실패:', err.message);
      });
  }, []);

  useEffect(() => {
    const keyword = (searchKeyword ?? '').trim().toLowerCase();

    const result = items.filter((item) => {
      const matchKeyword = item.title.toLowerCase().includes(keyword);
      // 🔹 카테고리 필터 (CATEGORY_MAP 적용)
      const matchCategory =
        effectiveFilter.categories.length === 0 ||
        effectiveFilter.categories.some((selected) => {
          const validValues = CATEGORY_MAP[selected];
          return validValues?.includes(item.category ?? '');
        });

      // 🔹 제철음식 필터
      const matchSeasonal =
        !effectiveFilter.seasonalOnly || item.isSeasonal === true;

      // 🔹 지역특산물 필터
      const matchLocal = !effectiveFilter.localOnly || item.isLocal === true;

      return matchKeyword && matchCategory && matchSeasonal && matchLocal;
    });
    setFilteredItems(result);
  }, [items, searchKeyword, effectiveFilter]);

  return (
    <div className="mx-auto w-full max-w-[20.9375rem] overflow-x-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EF6F6F]"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-10 text-center text-sm text-[#8A8A8A]">
          좋아요한 항목이 없습니다.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-y-6 gap-x-4">
          {filteredItems.map((item) => {
            const cardItem: Card & { type?: 'food' | 'poi' } = {
              id: item.id,
              title: item.title,
              img: item.img,
              location: item.location ?? '',
              views: 0,
              liked: true,
              likeCount: 1,
              isLocalSpecial: item.isLocal ?? false,
              type: item.type === 'restaurant' ? 'poi' : item.type, // 타입 변환
            };

            return <CardItem key={`${item.type}_${item.id}`} item={cardItem} />;
          })}
        </div>
      )}
    </div>
  );
}
