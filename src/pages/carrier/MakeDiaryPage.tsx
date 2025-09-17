// src/pages/carrier/MakeDiaryPage.tsx
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadKakaoMapScript } from '@/lib/kakao/loadKakaoMap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { createDiaryWithPlaces } from '@/lib/supabase/diaries';
import { supabase } from '@/lib/supabase/supabase';
import { ensureUserExists } from '@/lib/supabase/likes';
import pinRed from '@/assets/icons/carrier/map_pin_RD.svg';
import pinYellow from '@/assets/icons/carrier/map_pin_YE.svg';
import pinGreen from '@/assets/icons/carrier/map_pin_GR.svg';
import pinBlue from '@/assets/icons/carrier/map_pin_BL.svg';

const pinIcons = [pinRed, pinYellow, pinGreen, pinBlue];

// 🔹 전역 kakao 타입 선언
declare global {
  interface Window {
    kakao: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      maps: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  }
}
export default function MakeDiaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef<HTMLDivElement | null>(null);

  const state = (location.state ?? null) as {
    title: string;
    dateRange: [Date, Date];
    stores: {
      id: string;
      title: string;
      type: 'restaurant' | 'food';
      img?: string;
      location?: string;
      mapx?: number;
      mapy?: number;
    }[];
  } | null;
  type Store = {
    id: string;
    title: string;
    type: 'restaurant' | 'food';
    img?: string;
    location?: string;
    mapx?: number;
    mapy?: number;
  };

  // ✅ 여행 일자별 스토어를 그룹화한 상태로 관리
  const [days, setDays] = useState<{ [key: string]: Store[] }>(() => {
    if (!state) return {};

    const [startDate, endDate] = state.dateRange;
    // 로컬 시간대로 날짜만 추출 (시간 무시)
    const startLocal = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const endLocal = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );

    const timeDiff = endLocal.getTime() - startLocal.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const dayCount = daysDiff + 1; // 시작일 포함

    const result: { [key: string]: Store[] } = {};

    for (let i = 0; i < dayCount; i++) {
      result[`day-${i}`] = [];
    }

    state.stores.forEach((store, idx) => {
      const dayIndex = idx % dayCount;
      result[`day-${dayIndex}`].push(store);
    });

    return result;
  });

  useEffect(() => {
    if (!state) {
      navigate('/carrier', { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
    loadKakaoMapScript(apiKey).then(() => {
      console.log('카카오맵 SDK 로드 완료');
    });
  }, []);

  useEffect(() => {
    if (!state || !mapRef.current || !window.kakao || !window.kakao.maps)
      return;

    const { kakao } = window;
    const center =
      state.stores.find((s) => s.mapx && s.mapy) || state.stores[0];

    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(
        center?.mapy || 37.5665,
        center?.mapx || 126.978,
      ),
      level: 5,
    });

    state.stores.forEach((s) => {
      if (!s.mapx || !s.mapy) return;

      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(s.mapy, s.mapx),
        map,
      });

      const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:6px;font-size:12px;">${s.title}</div>`,
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(map, marker);
      });
    });
  }, [state]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (
      !destination ||
      (source.droppableId === destination.droppableId &&
        source.index === destination.index)
    )
      return;

    const sourceDay = source.droppableId;
    const destDay = destination.droppableId;

    const sourceItems = Array.from(days[sourceDay]);
    const destItems = Array.from(days[destDay]);
    const [movedItem] = sourceItems.splice(source.index, 1);

    // ✅ 중복 삽입 방지: 기존에 이미 있는지 확인 후 추가
    if (!destItems.find((item) => item.id === movedItem.id)) {
      destItems.splice(destination.index, 0, movedItem);
    }

    setDays({
      ...days,
      [sourceDay]: sourceItems,
      [destDay]: destItems,
    });
  };

  if (!state) return null;

  return (
    <div className="w-full max-w-[20.9375rem] mx-auto h-[100dvh] flex flex-col">
      {/* 1. 상단 영역 */}
      <div className=" shrink-0">
        <h1
          className=" mt-4 text-[1.25rem] font-bold leading-[2rem] tracking-[-0.01rem]"
          style={{ color: '#383D48', fontFamily: 'Kakao Big Sans' }}
        >
          {state.title}
        </h1>
        <p
          className="mb-4 text-[0.875rem] font-normal leading-[1.26rem] tracking-[-0.0175rem]"
          style={{ color: '#596072', fontFamily: 'Kakao Small Sans' }}
        >
          {state.dateRange[0].toLocaleDateString()} ~{' '}
          {state.dateRange[1].toLocaleDateString()}
        </p>
        <div className="relative h-[15rem] mb-4 mt-7">
          <div
            ref={mapRef}
            id="map"
            className="absolute inset-0 w-full h-full rounded-lg z-0"
          />
        </div>
      </div>

      {/* 2. 중간 드래그 영역 */}
      <div
        className="flex-1 overflow-y-auto mt-5"
        style={{
          scrollbarWidth: 'none' /* Firefox */,
          msOverflowStyle: 'none' /* IE and Edge */,
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-6 pb-4">
            {Object.entries(days).map(([dayId, items], i) => (
              <div key={dayId}>
                <h2 className="mb-2 flex items-center text-base font-normal text-[#8F96AB] leading-[1.5rem]">
                  <img src={pinIcons[i % 4]} className="w-6 h-6 mr-2" />
                  Day {i + 1}
                </h2>
                <Droppable droppableId={dayId}>
                  {(provided) => (
                    <div
                      className="space-y-3 min-h-[1rem]"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {items.map((s, idx) => (
                        <Draggable key={s.id} draggableId={s.id} index={idx}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center rounded-lg border bg-white p-2 shadow-sm"
                            >
                              <img
                                src={s.img || 'https://picsum.photos/100'}
                                alt={s.title}
                                className="h-16 w-16 rounded-lg object-cover"
                              />
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium">{s.title}</p>
                                <p className="text-xs text-gray-500">
                                  {s.location}
                                </p>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* 3. 하단 확정 버튼 */}
      <div className="shrink-0 px-4 pb-6 pt-2 border-t">
        <button
          onClick={async () => {
            if (!state) return;

            try {
              // 사용자가 설정한 day별 배치 정보 생성
              const dayPlaces: Array<{
                day: number;
                order_index: number;
                store: Store;
              }> = [];

              Object.entries(days).forEach(([dayKey, stores]) => {
                const dayNumber = parseInt(dayKey.replace('day-', '')) + 1; // day-0 -> 1, day-1 -> 2
                stores.forEach((store, index) => {
                  dayPlaces.push({
                    day: dayNumber,
                    order_index: index + 1,
                    store,
                  });
                });
              });

              // 사용자 확인
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) {
                alert('로그인이 필요합니다.');
                return;
              }

              await ensureUserExists();

              // 로컬 시간대로 날짜 문자열 생성
              const formatDate = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              };

              // 다이어리 생성
              const diary = await createDiaryWithPlaces({
                userId: user.id,
                title: state.title,
                startDate: formatDate(state.dateRange[0]),
                endDate: formatDate(state.dateRange[1]),
                stores: state.stores,
                dayPlaces,
              });

              // 다이어리 목록으로 이동
              navigate('/diary');
            } catch (error) {
              console.error('다이어리 생성 실패:', error);
              alert('다이어리 생성 중 오류가 발생했습니다.');
            }
          }}
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
