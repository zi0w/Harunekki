import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';

const EmailSignupPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      // 사용자 생성 후 users 테이블에 직접 추가
      const { error: userError } = await supabase
        .from('users')
        .insert({ id: data.user.id, name: null });

      if (userError) {
        console.error('users insert error:', userError);
        setError('사용자 생성 중 오류가 발생했습니다.');
      } else {
        // 회원가입 완료 후 AuthCallback을 거쳐 온보딩으로 이동
        navigate('/auth/callback');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center mt-[124px] px-5">
      {/* 헤더 */}
      <div className="flex items-center w-full max-w-[335px] mb-8">
        <button
          onClick={() => navigate('/auth/email-login')}
          className="mr-4 text-[#383D48]"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-[#383D48]">회원가입</h1>
      </div>

      {/* 회원가입 폼 */}
      <div className="w-full max-w-[335px]">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#EF6F6F] text-[#383D48] placeholder:text-[#AEB6C6] bg-white"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#EF6F6F] text-[#383D48] placeholder:text-[#AEB6C6] bg-white"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#EF6F6F] text-[#383D48] placeholder:text-[#AEB6C6] bg-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#EF6F6F] text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? '회원가입 중...' : '회원가입'}
          </button>
        </form>

        {/* 로그인으로 이동 */}
        <div className="mt-4 text-center">
          <p className="text-[#9096A5] text-xs mb-2">이미 계정이 있으신가요?</p>
          <button
            onClick={() => navigate('/auth/email-login')}
            className="w-full py-2 border border-[#EF6F6F] text-[#EF6F6F] rounded-lg font-medium text-sm"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailSignupPage;
