// src/pages/auth/OnboardingPage.tsx
import { supabase } from '@/lib/supabase/supabase';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Gender = 'male' | 'female' | '';

export default function OnboardingPage() {
  const nav = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>(''); // 문자열로 관리
  const [gender, setGender] = useState<Gender>('');
  const [saving, setSaving] = useState(false);

  // 프리필을 딱 1회만 수행하기 위한 플래그
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        nav('/login', { replace: true });
        return;
      }
      setUserId(user.id);

      if (loadedRef.current) return;

      const { data: row, error } = await supabase
        .from('users')
        .select('name, age, gender')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('users fetch error:', error);
        return;
      }

      if (row) {
        if (name === '') setName(row.name ?? '');
        if (age === '') setAge(row.age != null ? String(row.age) : '');
        if (gender === '') setGender((row.gender as Gender) ?? '');
        if (row.name && row.age != null && row.gender) {
          nav('/', { replace: true });
          return;
        }
      }
      loadedRef.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

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
      console.error('users update error:', error);
      alert(error.message);
      return;
    }
    nav('/', { replace: true });
  };

  return (
    <div className="flex flex-col mx-auto max-w-[375px] mt-10 gap-8">
      {/* 이름 */}
      <div>
        <span className="text-base text-[#383D48] font-kakaoSmall font-bold">
          이름
        </span>
        <input
          className="mt-3 w-full rounded-lg border p-2 bg-[#FDFDFE] text-black outline-none focus:ring-1 focus:ring-black/10"
          value={name}
          placeholder="이름을 입력해주세요."
          onChange={(e) => setName(e.target.value)}
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
          className="mt-3 w-full rounded-lg border p-2 bg-[#FDFDFE] text-black outline-none focus:ring-1 focus:ring-black/10"
          value={age}
          placeholder="나이를 입력해주세요."
          onChange={(e) => setAge(e.target.value)} // 문자열 그대로 관리
          inputMode="numeric"
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
            className={`rounded-lg py-2 text-center font-abeezee shadow-sm transition-all
              bg-white text-[#596072]
              focus:outline-none focus:ring-1 focus:ring-gray-200
              ${
                gender === 'male'
                  ? 'border-2 border-black' // 선택 시 스타일
                  : 'border border-gray-300' // 기본 스타일
              }`}
          >
            남성
          </button>
          <button
            type="button"
            onClick={() => setGender('female')}
            className={`rounded-lg py-2 text-center font-abeezee shadow-sm transition-all
              bg-white text-[#596072]
              focus:outline-none focus:ring-1 focus:ring-gray-200
              ${
                gender === 'female'
                  ? 'border-2 border-black' // 선택 시 스타일
                  : 'border border-gray-300' // 기본 스타일
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
        className="w-full rounded-lg bg-[#EF6F6F] shadow-sm text-white font-kakaoBig py-3 disabled:opacity-60 mt-[200px]"
      >
        {saving ? '저장 중…' : '완료'}
      </button>
    </div>
  );
}
