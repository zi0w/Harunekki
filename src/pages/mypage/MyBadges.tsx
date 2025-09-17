import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';
import badgeCompleteIcon from '@/assets/icons/diary/Badge_Complete.webp';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { updateDiaryRegionNames } from '@/lib/supabase/diaries';

type Badge = {
  id: string;
  diary_id: string;
  title: string;
  region_name: string;
  completed_at: string;
};

export default function MyBadges() {
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 기존 다이어리들의 region_name 업데이트 (한 번만 실행)
      try {
        await updateDiaryRegionNames(user.id);
      } catch (error) {
        console.error('기존 다이어리 지역명 업데이트 실패:', error);
      }

      // 완성된 다이어리에서 뱃지 정보 가져오기
      const { data: diaries } = await supabase
        .from('diaries')
        .select(
          `
          id,
          title,
          start_date,
          end_date,
          region_name,
          diary_places!inner(
            id,
            place_name,
            visited,
            stamp_data
          )
        `,
        )
        .eq('user_id', user.id);

      if (diaries) {
        const completedBadges: Badge[] = [];

        for (const diary of diaries) {
          const places = diary.diary_places;
          const totalPlaces = places.length;
          const completedPlaces = places.filter(
            (place: {
              visited: boolean;
              stamp_data?: { image_url?: string };
            }) => place.visited && place.stamp_data?.image_url,
          ).length;

          // 모든 스탬프가 완성된 다이어리만 뱃지로 추가
          if (totalPlaces > 0 && completedPlaces === totalPlaces) {
            // 저장된 지역명 사용 (캐리어에서 설정한 지역명)
            console.log(
              '다이어리 ID:',
              diary.id,
              'region_name:',
              diary.region_name,
            );
            const regionName = diary.region_name?.trim() || '국내 여행';

            completedBadges.push({
              id: diary.id,
              diary_id: diary.id,
              title: diary.title,
              region_name: regionName,
              completed_at: diary.end_date,
            });
          }
        }

        setBadges(completedBadges);
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ height: 'calc(100vh - 120px)' }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  // 뱃지가 없는 경우
  if (badges.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center mt-20">
        <div className="text-center">
          <p className="text-[#596072] font-kakaoBig text-lg mb-2">
            앗 이런! 아직 뱃지를 받지 못했어요~
          </p>
          <p className="text-[#9096A5] font-kakaoSmall text-sm mb-8">
            여행 다이어리를 완성하고 뱃지 받으러 가볼까요?
          </p>

          <Link
            to="/diary"
            className="inline-block w-full max-w-xs rounded-lg bg-[#EF6F6F] text-white font-kakaoBig py-3 text-center hover:bg-[#E55A5A] hover:text-white transition-colors duration-200"
          >
            여행 다이어리 완성하기
          </Link>
        </div>
      </div>
    );
  }

  // 뱃지가 있는 경우
  return (
    <div className="w-full flex flex-col mt-6 gap-6">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="w-full bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]"
        >
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <img
                src={badgeCompleteIcon}
                alt={`${badge.region_name} 뱃지`}
                className="w-30 h-24"
              />
            </div>

            <div className="text-center">
              <p className="text-[#383D48] font-kakaoBig text-lg mb-1">
                {badge.region_name}
              </p>
              <p className="text-[#9096A5] font-kakaoSmall text-sm">
                {badge.title}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
