import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';
import diaryIcon from '@/assets/icons/diary/Calander@4x.png';

type Diary = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
  cover_image?: string;
};

const DiaryPage = () => {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiaries = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('diaries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching diaries:', error);
          return;
        }

        // 기본 다이어리 커버 이미지들 (디폴트용)
        const defaultCoverImages = [
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop', // 햄버거
          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', // 피자
          'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop', // 샐러드
          'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop', // 파스타
          'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop', // 치킨
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop', // 샌드위치
        ];

        // 각 다이어리의 커버 이미지 결정
        const diariesWithCover = (data || []).map((diary, index) => {
          // 1순위: 테이블에 저장된 cover_image
          // 2순위: 기본 디폴트 이미지
          const coverImage =
            diary.cover_image ||
            defaultCoverImages[index % defaultCoverImages.length];

          return {
            ...diary,
            cover_image: coverImage,
          };
        });

        setDiaries(diariesWithCover);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiaries();
  }, []);

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

  if (diaries.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center mt-20">
        <div className="text-center">
          <h2 className="text-xl font-kakaoBig text-[#383D48] mb-2">
            아직 다이어리가 없어요!
          </h2>
          <p className="text-[#596072] font-kakaoSmall mb-8">
            여행 다이어리를 만들러 가볼까요?
          </p>
          <Link
            to="/carrier" // 캐리어 페이지로 이동
            className="w-full max-w-[335px] rounded-xl bg-[#EF6F6F] shadow-sm text-white font-kakaoBig py-3 text-center block hover:bg-[#E55A5A] hover:text-white transition-colors duration-200"
          >
            여행 다이어리 만들기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-2 gap-4 mt-6">
      {diaries.map((diary) => (
        <Link
          key={diary.id}
          to={`/diary/${diary.id}`}
          className="block relative rounded-2xl"
        >
          {/* 이미지 */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#f4f5f7]">
            {diary.cover_image ? (
              <img
                src={diary.cover_image}
                alt={diary.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  console.log('Image load error for:', diary.cover_image);
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove(
                    'hidden',
                  );
                }}
              />
            ) : null}
            <div
              className={`w-full h-full bg-[#e9ecf1] flex items-center justify-center ${diary.cover_image ? 'hidden' : ''}`}
            >
              <img
                src={diaryIcon}
                alt="다이어리"
                className="w-12 h-12 opacity-50"
              />
            </div>
          </div>

          {/* 텍스트 */}
          <div className="mt-3">
            <p className="font-kakaoSmall text-[16px] text-[#383D48] truncate mb-1">
              {diary.title}
            </p>
            <div className="flex items-center gap-1">
              <img src={diaryIcon} className="w-3 h-3" alt="" />
              <p className="text-[#8A8A8A] font-kakaoSmall text-[12px]">
                {new Date(diary.start_date)
                  .toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })
                  .replace(/\./g, '.')
                  .replace(/\s/g, '')
                  .replace(/\.$/, '')}{' '}
                -{' '}
                {new Date(diary.end_date)
                  .toLocaleDateString('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                  })
                  .replace(/\./g, '.')
                  .replace(/\s/g, '')
                  .replace(/\.$/, '')}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default DiaryPage;
