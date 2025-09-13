import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';

type Gender = 'male' | 'female' | '';

export default function MyInfo() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender>('');

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('name, age, gender')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setName(data.name ?? '');
        setAge(data.age ?? null);
        setGender((data.gender as Gender) ?? '');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex flex-col mt-10 gap-8">
        {/* 이름 스켈레톤 */}
        <div>
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* 나이 스켈레톤 */}
        <div>
          <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* 성별 스켈레톤 */}
        <div>
          <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* 버튼 스켈레톤 */}
        <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse mt-8"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col mt-10 gap-8">
      {/* 이름 */}
      <div>
        <span className="text-base text-[#383D48] font-kakaoSmall font-bold">
          이름
        </span>
        <div className="mt-3 w-full rounded-lg border p-2 bg-[#FDFDFE] text-black">
          {name || '-'}
        </div>
      </div>

      {/* 나이 */}
      <div>
        <span className="text-base text-[#383D48] font-kakaoSmall font-bold">
          나이
        </span>
        <div className="mt-3 w-full rounded-lg border p-2 bg-[#FDFDFE] text-black">
          {age ?? '-'}
        </div>
      </div>

      {/* 성별 */}
      <div>
        <span className="text-base text-[#383D48] font-kakaoSmall font-bold">
          성별
        </span>
        <div className="mt-3 grid grid-cols-2 gap-2 ">
          <div
            className={`rounded-lg py-2 text-center font-kakaoSmall bg-white 
                        ${gender === 'male' ? 'border border-gray-200 text-[#EF6F6F]' : 'text-[#D3D8E3] border border-gray-200'}`}
          >
            남성
          </div>
          <div
            className={`rounded-lg py-2 text-center font-kakaoSmall bg-white text-[#596072]
                        ${gender === 'female' ? 'border border-gray-200 text-[#EF6F6F]' : 'text-[#D3D8E3] border border-gray-200'}`}
          >
            여성
          </div>
        </div>
      </div>

      <Link
        to="/mypage/info/edit"
        className="w-full rounded-lg bg-[#EF6F6F] shadow-sm text-white font-kakaoBig py-3 text-center mt-8 hover:bg-[#E55A5A] hover:text-white transition-colors duration-200"
      >
        정보 수정하기
      </Link>
    </div>
  );
}
