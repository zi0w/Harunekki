// src/pages/auth/OnboardingPage.tsx
import { supabase } from '@/lib/supabase/supabase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Gender = 'male' | 'female' | '';

export default function OnboardingPage() {
  const nav = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Gender>('');
  const [saving, setSaving] = useState(false);

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

      // 기존값 채우기
      const { data: row } = await supabase
        .from('users')
        .select('name, age, gender')
        .eq('id', user.id)
        .maybeSingle();

      if (row) {
        setName(row.name ?? '');
        setAge((row.age as number) ?? '');
        setGender((row.gender as Gender) ?? '');
        // 이미 완료라면 홈으로
        if (row.name && row.age !== null && row.gender) {
          nav('/', { replace: true });
        }
      } else {
        // 혹시 행이 없으면 만들어 두기(안전)
        await supabase.from('users').insert({ id: user.id });
      }
    })();
  }, [nav]);

  const submit = async () => {
    if (!userId) return;
    if (!name || age === '' || !gender) {
      alert('모두 입력해 주세요.');
      return;
    }
    const nAge = Number(age);
    if (Number.isNaN(nAge) || nAge < 0 || nAge > 120) {
      alert('나이를 확인해 주세요.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ name, age: nAge, gender })
      .eq('id', userId);
    setSaving(false);

    if (error) alert(error.message);
    else nav('/', { replace: true });
  };

  return (
    <div className="mx-auto max-w-[375px] p-5 space-y-4">
      <label className="block">
        <span className="text-base text-[#383D48]">이름</span>
        <input
          className="mt-1 w-full rounded-lg border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">나이</span>
        <input
          type="number"
          className="mt-1 w-full rounded-lg border p-2"
          value={age}
          onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">성별</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setGender('male')}
            className={`rounded-lg border py-2 ${gender === 'male' ? 'bg-black text-white' : 'bg-white'}`}
          >
            남성
          </button>
          <button
            type="button"
            onClick={() => setGender('female')}
            className={`rounded-lg border py-2 ${gender === 'female' ? 'bg-black text-white' : 'bg-white'}`}
          >
            여성
          </button>
        </div>
      </label>

      <button
        onClick={submit}
        disabled={saving}
        className="w-full rounded-lg bg-black text-white py-3 disabled:opacity-60"
      >
        {saving ? '저장 중…' : '완료'}
      </button>
    </div>
  );
}
