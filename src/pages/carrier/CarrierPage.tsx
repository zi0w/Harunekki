// src/pages/carrier/CarrierPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { createDiaryWithPlaces } from '@/lib/supabase/diaries';
import { supabase } from '@/lib/supabase/supabase';
import {
  ensureUserExists,
  fetchAllLikedItems,
  fetchLikeCounts,
} from '@/lib/supabase/likes';
import type { LikedItem } from '@/types/LikedItem';
import LocationIcon from '@/assets/icons/home/location.svg';
import LikeIcon from '@/assets/icons/home/heart.svg';

export default function CarrierPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [stores, setStores] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ 좋아요한 항목 불러오기
  useEffect(() => {
    fetchAllLikedItems()
      .then((res) => {
        setStores(res);
      })
      .catch((err) => {
        console.error('좋아요 항목 불러오기 실패:', err.message);
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    async function loadLikedItems() {
      try {
        const likedItems = await fetchAllLikedItems();
        const restIds = likedItems
          .filter((item) => item.type === 'restaurant')
          .map((item) => item.id);

        const likeCountMap = await fetchLikeCounts(restIds);

        const enrichedItems = likedItems.map((item) => ({
          ...item,
          likeCount: likeCountMap[item.id] ?? 0,
        }));

        setStores(enrichedItems);
      } catch (err) {
        console.error('좋아요 항목 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLikedItems();
  }, []);

  const handleDelete = (id: string) => {
    setStores((prev) => prev.filter((s) => s.id !== id));
  };

  const handleConfirm = async () => {
    if (!title || !dateRange) {
      alert('다이어리 제목과 여행 일정을 입력해주세요.');
      return;
    }

    const confirmed = window.confirm('여행지를 확정하시겠어요?');
    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await ensureUserExists();

      const diary = await createDiaryWithPlaces({
        userId: user.id,
        title,
        startDate: dateRange[0].toISOString().slice(0, 10),
        endDate: dateRange[1].toISOString().slice(0, 10),
        stores,
      });

      navigate('/carrier/makediary', {
        state: {
          diaryId: diary.id,
          title,
          dateRange,
          stores,
        },
      });
    } catch (err) {
      console.error('다이어리 저장 실패:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col h-screen px-4">
      <div className="mt-4">
        <label
          className="text-[#383D48]
      text-base
      font-bold
      leading-[1.5rem]
      tracking-[-0.008rem]
      text-center
    "
        >
          다이어리 제목
        </label>

        <div className="mt-3 relative">
          <input
            type="text"
            maxLength={18}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="다이어리 제목을 입력하세요"
            className="
      w-full 
      px-4 py-3 
      rounded-[0.75rem] 
      bg-[#FDFDFE] 
      shadow-[inset_0_0_4px_0_#BEC4D3] 
      flex flex-col justify-center items-end gap-2 
      focus:outline-none
         text-[#596072] 
    text-base 
    font-normal 
    leading-[1.5rem] 
    tracking-[-0.02rem]
  "
          />

          <span className="absolute right-3 top-5 text-xs text-gray-500">
            {title.length}/18
          </span>
        </div>
      </div>

      <div className="mt-4">
        <label
          className="
            text-[#383D48]
            text-base
            font-bold
            leading-[1.5rem]
            tracking-[-0.008rem]
            text-center
            mb-3
          "
        >
          여행 일정
        </label>

        <button
          onClick={() => setCalendarOpen(true)}
          className="
    w-full 
    px-4 py-3 
    rounded-[0.75rem] 
    bg-[#FDFDFE] 
    shadow-[inset_0_0_4px_0_#BEC4D3] 
    justify-center items-end gap-2 
    focus:outline-none
    text-left
    text-[#596072] 
    text-base 
    font-normal 
    leading-[1.5rem] 
    tracking-[-0.02rem]
    mt-3
  "
        >
          {dateRange
            ? `${dateRange[0].toLocaleDateString()} ~ ${dateRange[1].toLocaleDateString()}`
            : '여행 일정을 선택해주세요'}
        </button>
      </div>

      {calendarOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <Calendar
              selectRange
              onChange={(value) => {
                setDateRange(value as [Date, Date]);
                setCalendarOpen(false);
              }}
            />
            <button
              onClick={() => setCalendarOpen(false)}
              className="mt-2 w-full bg-gray-200 py-2 rounded-lg"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-center text-sm text-gray-400">불러오는 중...</p>
        ) : stores.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            좋아요한 항목이 없습니다.
          </p>
        ) : (
          stores.map((store) => (
            <div
              key={store.id}
              className="relative group overflow-hidden rounded-lg shadow mb-3 bg-white"
            >
              {/* 컨텐츠 영역 - hover 시 왼쪽으로 슬라이드 */}
              <div className="flex transition-transform duration-300 group-hover:-translate-x-[4rem]">
                <img
                  src={store.img || 'https://picsum.photos/200/120'}
                  alt={store.title}
                  className="w-24 h-20 object-cover"
                />
                <div className="flex-1 px-3 py-2 min-w-0">
                  {/* 가게 이름 */}
                  <p className="text-[1rem] text-[#383D48] truncate font-[Kakao Small Sans]">
                    {store.title}
                  </p>

                  {/* 위치 정보 */}
                  <p className="text-[0.875rem] text-[#596072] flex items-center gap-1 truncate font-[Kakao Small Sans]">
                    <img
                      src={LocationIcon}
                      alt="location"
                      className="w-4 h-4"
                    />
                    {store.location ?? '위치 정보 없음'}
                  </p>

                  {/* 좋아요 수 */}
                  <p className="text-[0.875rem] text-[#596072] flex items-center gap-1 font-[Kakao Small Sans]">
                    <img src={LikeIcon} alt="like" className="w-4 h-4" />
                    좋아요 {store.likeCount ?? 0}
                  </p>
                </div>
              </div>

              {/* 삭제 버튼 - hover 시 등장 */}
              <button
                onClick={() => handleDelete(store.id)}
                className="absolute right-0 top-0 bottom-0 w-[4rem] bg-[#EF6F6F] text-white text-sm font-semibold flex items-center justify-center transition-opacity duration-300 group-hover:opacity-100 opacity-0"
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 px-4 pb-6 pt-2 border-t">
        <button
          onClick={handleConfirm}
          className="w-full text-white py-3 font-semibold"
          style={{
            borderRadius: '0.75rem',
            background: '#EF6F6F',
            boxShadow: '0 4px 20px 0 #BEC4D3',
          }}
        >
          여행지 확정하기
        </button>
      </div>
    </div>
  );
}
