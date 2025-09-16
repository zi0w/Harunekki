// src/pages/carrier/MakeDiaryPage.tsx
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadKakaoMapScript } from '@/lib/kakao/loadKakaoMap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import pinRed from '@/assets/icons/carrier/map_pin_RD.svg';
import pinYellow from '@/assets/icons/carrier/map_pin_YE.svg';
import pinGreen from '@/assets/icons/carrier/map_pin_GR.svg';
import pinBlue from '@/assets/icons/carrier/map_pin_BL.svg';

const pinIcons = [pinRed, pinYellow, pinGreen, pinBlue];

// 🔹 전역 kakao 타입 선언
declare global {
  interface Window {
    kakao: {
      maps: typeof kakao.maps;
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
      img?: string;
      location?: string;
      mapx?: number;
      mapy?: number;
    }[];
  } | null;

  // ✅ 여행 일자별 스토어를 그룹화한 상태로 관리
  const [days, setDays] = useState<{ [key: string]: typeof state.stores }>(
    () => {
      if (!state) return {};
      const result: { [key: string]: typeof state.stores } = {};
      const totalDays = Math.ceil((state?.stores.length ?? 0) / 4);

      for (let i = 0; i < totalDays; i++) {
        result[`day-${i}`] = state.stores.slice(i * 4, (i + 1) * 4);
      }
      return result;
    },
  );

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

    if (!destination) return;

    const sourceDay = source.droppableId;
    const destDay = destination.droppableId;

    const sourceItems = Array.from(days[sourceDay]);
    const [movedItem] = sourceItems.splice(source.index, 1);

    const destItems = Array.from(days[destDay]);
    destItems.splice(destination.index, 0, movedItem);

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
      <div className="flex-1 overflow-y-auto mt-5">
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
          onClick={() => navigate('/diary')}
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
