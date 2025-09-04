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

  // StrictMode 이펙트 2회 방지
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
    })();
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
      alert(error.message);
      return;
    }
    nav('/mypage/info', { replace: true });
  };

  return (
    <div className="flex flex-col mx-auto max-w-[375px] mt-10 gap-8">
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
        {saving ? '저장 중…' : '수정 완료하기'}
      </button>
    </div>
  );
}
