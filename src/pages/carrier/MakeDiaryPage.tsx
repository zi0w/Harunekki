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
import Modal from '@/components/common/Modal';

const pinIcons = [pinRed, pinYellow, pinGreen, pinBlue];

// 🔹 전역 kakao 타입 선언
declare global {
  interface Window {
    kakao: {
      maps: any;
      [key: string]: any;
    };
  }
}

export default function MakeDiaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  type Store = {
    id: string;
    title: string;
    img?: string;
    location?: string;
    mapx?: number;
    mapy?: number;
  };

  // ✅ 여행 일자별 스토어를 그룹화한 상태로 관리
  const [days, setDays] = useState<{ [key: string]: Store[] }>(() => {
    if (!state) return {};
    const [startDate, endDate] = state.dateRange;

    const dayCount =
      Math.floor(
        (endDate.setHours(0, 0, 0, 0) - startDate.setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24),
      ) + 1;

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
    if (!state) navigate('/carrier', { replace: true });
  }, [state, navigate]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;

    loadKakaoMapScript(apiKey).then(() => {
      if (window.kakao && mapRef.current) {
        const { kakao } = window;

        // 지도 중심: 첫 번째 스토어 or 서울 기본
        const firstStore = state?.stores?.find((s) => s.mapy && s.mapx);
        const center = firstStore
          ? new kakao.maps.LatLng(firstStore.mapy!, firstStore.mapx!)
          : new kakao.maps.LatLng(37.5665, 126.978);

        const options = {
          center,
          level: 5,
        };

        // ✅ 지도 인스턴스 생성
        const map = new kakao.maps.Map(mapRef.current, options);
        mapInstanceRef.current = map;

        // ✅ 마커 렌더링
        markersRef.current.forEach((marker: any) => marker.setMap(null));
        markersRef.current = [];

        Object.entries(days).forEach(([, stores], index) => {
          stores.forEach((store) => {
            if (!store.mapx || !store.mapy) return;

            const markerImage = new kakao.maps.MarkerImage(
              pinIcons[index % pinIcons.length],
              new kakao.maps.Size(32, 32),
              { offset: new kakao.maps.Point(16, 32) },
            );

            const marker = new kakao.maps.Marker({
              position: new kakao.maps.LatLng(store.mapy, store.mapx),
              map,
              image: markerImage,
            });

            const infowindow = new kakao.maps.InfoWindow({
              content: `<div style="padding:6px;font-size:12px;">${store.title}</div>`,
            });

            kakao.maps.event.addListener(marker, 'click', () => {
              infowindow.open(map, marker);
            });

            markersRef.current.push(marker);
          });
        });
      }
    });
  }, [state, days]);

  // ✅ 지도 초기 생성
  useEffect(() => {
    if (!window.kakao || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const { kakao } = window;

    // 기존 마커 제거
    markersRef.current.forEach((marker: any) => marker.setMap(null));
    markersRef.current = [];

    Object.entries(days).forEach(([, stores], index) => {
      stores.forEach((store) => {
        if (!store.mapx || !store.mapy) return;

        const markerImage = new kakao.maps.MarkerImage(
          pinIcons[index % pinIcons.length],
          new kakao.maps.Size(32, 32),
          { offset: new kakao.maps.Point(16, 32) },
        );

        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(store.mapy, store.mapx),
          map,
          image: markerImage,
        });

        const infowindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px;font-size:12px;">${store.title}</div>`,
        });

        kakao.maps.event.addListener(marker, 'click', () => {
          infowindow.open(map, marker);
        });

        markersRef.current.push(marker);
      });
    });
  }, [days]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao) return;

    const map = mapInstanceRef.current;
    const { kakao } = window;

    // 기존 마커 제거
    markersRef.current.forEach((marker: any) => marker.setMap(null));
    markersRef.current = [];

    Object.entries(days).forEach(([, stores], index) => {
      stores.forEach((store) => {
        if (!store.mapx || !store.mapy) return;

        const markerImage = new kakao.maps.MarkerImage(
          pinIcons[index % pinIcons.length],
          new kakao.maps.Size(32, 32),
          { offset: new kakao.maps.Point(16, 32) },
        );

        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(store.mapy, store.mapx),
          map,
          image: markerImage,
        });

        const infowindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px;font-size:12px;">${store.title}</div>`,
        });

        kakao.maps.event.addListener(marker, 'click', () => {
          infowindow.open(map, marker);
        });

        markersRef.current.push(marker);
      });
    });
  }, [days]); // mapInstanceRef.current 의존성 제거

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
      {/* 상단 영역 */}
      <div className="shrink-0">
        <h1
          className="mt-4 text-[1.25rem] font-bold leading-[2rem] tracking-[-0.01rem]"
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

      {/* 중간 드래그 영역 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide mt-5">
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
                              className="flex items-center rounded-lg border bg-white p-2 shadow-sm cursor-pointer"
                              onClick={() => {
                                if (
                                  s.mapx &&
                                  s.mapy &&
                                  mapInstanceRef.current
                                ) {
                                  const latlng = new window.kakao.maps.LatLng(
                                    s.mapy,
                                    s.mapx,
                                  );
                                  (mapInstanceRef.current as any).setCenter(
                                    latlng,
                                  );
                                }
                              }}
                            >
                              <img
                                src={s.img || 'https://picsum.photos/100'}
                                alt={s.title}
                                className="h-16 w-16 rounded-lg object-cover"
                              />
                              <div className="ml-3 flex-1">
                                <p className="text-md font-bold text-[#383D48] mb-2">
                                  {s.title}
                                </p>
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

        {/* 하단 확정 버튼 */}
        <div className="shrink-0 pb-6 pt-2 border-t">
          <button
            onClick={() => setShowConfirmModal(true)}
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

      {/* 최종 확정 모달 */}
      <Modal
        open={showConfirmModal}
        title="여행지 확정"
        description="여행지를 확정하시겠어요?"
        confirmText="확정하기"
        onConfirm={() => {
          setShowConfirmModal(false);
          navigate('/diary');
        }}
        onClose={() => setShowConfirmModal(false)}
      />
    </div>
  );
}
