import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';
import stampIcon from '@/assets/icons/diary/Stamp.png';
import badgeIcon from '@/assets/icons/diary/Badge.png';
import badgeCompleteIcon from '@/assets/icons/diary/Badge_Complete.webp';
import { extractRegionName } from '@/utils/regionUtils';
import { deleteDiary } from '@/lib/supabase/diaries';
import Modal from '@/components/common/Modal';

type DiaryPlace = {
  id: string;
  place_name: string;
  day: number;
  order_index: number;
  visited: boolean;
  stamp_data?: {
    image_url?: string;
    title?: string;
    description?: string;
  };
};

type Diary = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
};

const DiaryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [places, setPlaces] = useState<DiaryPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 설정 버튼을 헤더에 추가하기 위한 전역 상태 설정
  useEffect(() => {
    if (id) {
      (
        window as unknown as { diarySettingsButton?: React.ReactNode }
      ).diarySettingsButton = (
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center justify-center px-2 py-1 rounded-full"
          aria-label="삭제"
        >
          <span
            style={{
              color: '#666666',
              fontSize: '12px',
              fontWeight: 'normal',
              whiteSpace: 'nowrap',
            }}
          >
            삭제
          </span>
        </button>
      );
    }
    return () => {
      (
        window as unknown as { diarySettingsButton?: React.ReactNode }
      ).diarySettingsButton = undefined;
    };
  }, [id]);

  useEffect(() => {
    const fetchDiaryData = async () => {
      if (!id) return;

      // 로딩 상태 설정
      (
        window as unknown as { diaryLoading?: boolean; diaryTitle?: string }
      ).diaryLoading = true;
      (
        window as unknown as { diaryLoading?: boolean; diaryTitle?: string }
      ).diaryTitle = undefined;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 다이어리 정보 가져오기
        const { data: diaryData, error: diaryError } = await supabase
          .from('diaries')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (diaryError) {
          console.error('Error fetching diary:', diaryError);
          return;
        }

        setDiary(diaryData);

        // 브라우저 탭 제목은 항상 "하루네끼"로 유지
        (
          window as unknown as { diaryLoading?: boolean; diaryTitle?: string }
        ).diaryTitle = diaryData.title;
        (
          window as unknown as { diaryLoading?: boolean; diaryTitle?: string }
        ).diaryLoading = false;

        // 다이어리 장소들 가져오기
        const { data: placesData, error: placesError } = await supabase
          .from('diary_places')
          .select('*')
          .eq('diary_id', id)
          .order('day', { ascending: true })
          .order('order_index', { ascending: true });

        if (placesError) {
          console.error('Error fetching places:', placesError);
          return;
        }

        setPlaces(placesData || []);
      } catch (error) {
        console.error('Error:', error);
        (
          window as unknown as { diaryLoading?: boolean; diaryTitle?: string }
        ).diaryLoading = false;
      } finally {
        setLoading(false);
      }
    };

    fetchDiaryData();

    // 컴포넌트 언마운트 시 제목 초기화
    return () => {
      (
        window as unknown as { diaryLoading?: boolean; diaryTitle?: string }
      ).diaryTitle = undefined;
      (
        window as unknown as { diaryLoading?: boolean; diaryTitle?: string }
      ).diaryLoading = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ height: 'calc(100vh - 120px)' }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EF6F6F]"></div>
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="w-full flex items-center justify-center mt-20">
        <p className="text-[#596072]">다이어리를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 일자별로 장소들 그룹화
  const placesByDay = places.reduce(
    (acc, place) => {
      if (!acc[place.day]) {
        acc[place.day] = [];
      }
      acc[place.day].push(place);
      return acc;
    },
    {} as Record<number, DiaryPlace[]>,
  );

  const days = Object.keys(placesByDay)
    .map(Number)
    .sort((a, b) => a - b);

  // 뱃지 완성도 계산
  const totalPlaces = places.length;
  const completedPlaces = places.filter(
    (place) => place.visited && place.stamp_data?.image_url,
  ).length;
  const isBadgeComplete = totalPlaces > 0 && completedPlaces === totalPlaces;

  // 지역명 추출
  const regionName = extractRegionName(places.map((place) => place.place_name));

  // 다이어리 삭제 함수
  const handleDeleteDiary = async () => {
    if (!id) return;

    try {
      await deleteDiary(id);
      navigate('/diary');
    } catch (error) {
      console.error('다이어리 삭제 실패:', error);
      alert('다이어리 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-full flex flex-col mt-6 gap-12 pb-8">
      {/* 일자별 스탬프 */}
      {days.map((day) => (
        <div key={day} className="w-full">
          {/* Day 뱃지 */}
          <div className="flex items-center mb-6">
            <div className="bg-[#EF6F6F] text-white px-2 py-1 rounded-lg text-sm font-kakaoBig">
              Day {day}
            </div>
          </div>

          {/* 스탬프 그리드 (2개씩) */}
          <div className="grid grid-cols-2 gap-6">
            {placesByDay[day].map((place) => (
              <Link
                key={place.id}
                to={`/diary/${id}/place/${place.id}`}
                className="flex flex-col items-center"
              >
                {/* 스탬프 원형 이미지 */}
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  {place.visited && place.stamp_data?.image_url ? (
                    <img
                      src={place.stamp_data.image_url}
                      alt={place.place_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#F4F5F7]">
                      <img
                        src={stampIcon}
                        alt="스탬프"
                        className="w-24 h-24 opacity-60"
                      />
                    </div>
                  )}
                </div>

                {/* 장소명 */}
                <div className="mt-3 px-2 py-1 bg-[#FDFDFE] rounded-lg">
                  <p className="text-xs text-[#596072] font-kakaoSmall text-center truncate">
                    {place.place_name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* 추가 스탬프 스켈레톤 (필요시) - 제거 */}

      {/* 뱃지 섹션 */}
      <div className="w-full mt-12">
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <img
              src={isBadgeComplete ? badgeCompleteIcon : badgeIcon}
              alt={isBadgeComplete ? '완성된 뱃지' : '뱃지'}
              className={`object-contain ${
                isBadgeComplete ? 'w-42 h-42' : 'w-32 h-34'
              }`}
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-[#383D48] font-kakaoBig text-lg">
              {isBadgeComplete ? `${regionName} 완성!` : regionName}
            </p>
            <p className="text-[#9096A5] font-kakaoSmall text-sm mt-1">
              {completedPlaces}/{totalPlaces} 완료
            </p>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        open={showDeleteModal}
        title="정말 다이어리를 삭제하시겠어요?"
        description="한 번 삭제하면 모든 기록이 
        사라지니 신중한 선택 부탁드려요."
        confirmText="삭제하기"
        onConfirm={() => {
          setShowDeleteModal(false);
          handleDeleteDiary();
        }}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default DiaryDetailPage;
