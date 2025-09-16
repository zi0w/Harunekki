import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';
import stampIcon from '@/assets/icons/diary/Stamp.png';
import badgeIcon from '@/assets/icons/diary/Badge.png';
import badgeCompleteIcon from '@/assets/icons/diary/Badge_Complete.webp';
import { extractRegionName } from '@/utils/regionUtils';

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
  const [diary, setDiary] = useState<Diary | null>(null);
  const [places, setPlaces] = useState<DiaryPlace[]>([]);
  const [loading, setLoading] = useState(true);

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

      {/* 추가 스탬프 스켈레톤 (필요시) */}
      {places.length === 0 && (
        <div className="w-full">
          <div className="flex items-center mb-4">
            <div className="bg-gray-200 text-transparent px-3 py-1 rounded-full text-sm font-kakaoBig animate-pulse">
              Day {days.length + 1}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((stamp) => (
              <div key={stamp} className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="mt-2 h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
};

export default DiaryDetailPage;
