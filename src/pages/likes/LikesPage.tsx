// src/pages/likes/LikedPage.tsx
import { useEffect, useState } from 'react';
import { fetchAllLikedItems, ensureUserExists } from '@/lib/supabase/likes';
import CardItem, { type Card } from '@/components/layout/CardItem';
import { supabase } from '@/lib/supabase/supabase';

import type { LikedItem } from '@/types/LikedItem';

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

  useEffect(() => {
    fetchAllLikedItems().then((res) => {
      console.log('불러온 좋아요 아이템:', res);
      setItems(res);
    });
  }, []);

  useEffect(() => {
    ensureUserExists()
      .then(() => {
        supabase.auth.getUser().then(({ data }) => {
          console.log('현재 로그인 유저 ID:', data.user?.id);
        });
      })
      .catch((err) => {
        console.error('유저 등록 실패:', err.message);
      });
  }, []);

  useEffect(() => {
    const keyword = (searchKeyword ?? '').trim().toLowerCase();

    const result = items.filter((item) => {
      const matchKeyword = item.title.toLowerCase().includes(keyword);
      const matchCategory =
        filterOptions.categories.length === 0 ||
        filterOptions.categories.includes(item.category ?? '');
      const matchSeasonal =
        !filterOptions.seasonalOnly || item.isSeasonal === true;
      const matchLocal = !filterOptions.localOnly || item.isLocal === true;
      return matchKeyword && matchCategory && matchSeasonal && matchLocal;
    });
    setFilteredItems(result);
  }, [items, searchKeyword, filterOptions]);

  return (
    <div className="mx-auto w-full max-w-[20.9375rem] overflow-x-hidden">
      {filteredItems.length === 0 ? (
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

            return (
              <CardItem
                key={`${item.type}_${item.id}`}
                item={cardItem}
                setItems={() => {}}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
