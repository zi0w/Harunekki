import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';

type Gender = 'male' | 'female' | '';

export default function MyInfo() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender>('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { nav('/login', { replace: true }); return; }

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
  }, [nav]);

  if (loading) return <div className="mx-auto max-w-[375px] mt-10">불러오는 중…</div>;

  return (
    <div className="flex flex-col mx-auto max-w-[375px] mt-10 gap-8">
      {/* 이름 */}
      <div>
        <span className="text-base text-[#383D48] font-kakaoSmall font-bold">이름</span>
        <div
          className="mt-3 w-full rounded-lg border p-2 bg-[#FDFDFE] text-black"
        >{name || '-'}</div>
      </div>

      {/* 나이 */}
      <div>
        <span className="text-base text-[#383D48] font-kakaoSmall font-bold">나이</span>
        <div
          className="mt-3 w-full rounded-lg border p-2 bg-[#FDFDFE] text-black"          
        >{age ?? '-'}</div>
      </div>

      {/* 성별 */}
      <div>
        <span className="text-base text-[#383D48] font-kakaoSmall font-bold">성별</span>
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
        className="w-full rounded-lg bg-[#EF6F6F] shadow-sm text-white font-kakaoBig py-3 text-center mt-[200px]"
      >
        정보 수정하기
      </Link>
    </div>
  );
}
