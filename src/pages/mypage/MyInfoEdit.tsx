import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';

type Gender = 'male' | 'female' | '';

export default function MyInfoEdit() {
  const nav = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>(''); // ← 문자열로 관리
  const [gender, setGender] = useState<Gender>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // StrictMode 이펙트 2회 방지
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      if (loadedRef.current) return;

      const { data, error } = await supabase
        .from('users')
        .select('name, age, gender')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setName(data.name ?? '');
        setAge(data.age != null ? String(data.age) : '');
        setGender((data.gender as Gender) ?? '');
      }
      loadedRef.current = true;
      setLoading(false);
    })();
  }, []);

  const submit = async () => {
    if (!userId) return;
    if (!name.trim() || age.trim() === '' || !gender) {
      alert('모두 입력해 주세요.');
      return;
    }

    const nAge = Number(age);
    if (!Number.isFinite(nAge) || nAge < 0 || nAge > 120) {
      alert('나이를 확인해 주세요.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ name: name.trim(), age: nAge, gender })
      .eq('id', userId);
    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }
    nav('/mypage/info', { replace: true });
  };

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
        <input
          className="mt-3 w-full rounded-lg border border-gray-200 p-2 bg-[#FDFDFE] text-[#383D48] outline-none focus:ring-1 focus:ring-black/10"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력해주세요."
          autoComplete="off"
        />
      </div>

      {/* 나이 */}
      <div>
        <span className="text-base text-[#383D48] font-kakaoSmall font-bold">
          나이
        </span>
        <input
          type="number"
          className="mt-3 w-full rounded-lg border border-gray-200 p-2 bg-[#FDFDFE] text-[#383D48] outline-none focus:ring-1 focus:ring-black/10"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          inputMode="numeric"
          placeholder="나이를 입력해주세요."
          autoComplete="off"
        />
      </div>

      {/* 성별 */}
      <div>
        <span className="text-base text-[#383D48] font-kakaoSmall font-bold">
          성별
        </span>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setGender('male')}
            className={`rounded-lg py-2 text-center font-abeezee border transition-colors
              bg-white focus:bg-white active:bg-white hover:bg-white
              ${
                gender === 'male'
                  ? 'text-[#EF6F6F] border-[#EF6F6F]' // 선택 시 스타일
                  : 'text-[#8A8A8A] border-gray-300' // 기본 스타일
              }`}
          >
            남성
          </button>
          <button
            type="button"
            onClick={() => setGender('female')}
            className={`rounded-lg py-2 text-center font-abeezee border transition-colors
              bg-white focus:bg-white active:bg-white hover:bg-white
              ${
                gender === 'female'
                  ? 'text-[#EF6F6F] border-[#EF6F6F]' // 선택 시 스타일
                  : 'text-[#8A8A8A] border-gray-300' // 기본 스타일
              }`}
          >
            여성
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="w-full rounded-lg bg-[#EF6F6F] shadow-sm text-white font-kakaoBig py-3 disabled:opacity-60 mt-8 hover:bg-[#E55A5A] hover:text-white transition-colors duration-200 disabled:hover:bg-[#EF6F6F] disabled:hover:text-white"
      >
        {saving ? '저장 중…' : '수정 완료하기'}
      </button>
    </div>
  );
}
