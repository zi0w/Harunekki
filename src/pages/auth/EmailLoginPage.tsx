import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';

const EmailLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate('/auth/callback');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center mt-[124px] px-5">
      {/* 헤더 */}
      <div className="flex items-center w-full max-w-[335px] mb-8">
        <button
          onClick={() => navigate('/login')}
          className="mr-4 text-[#383D48]"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-[#383D48]">이메일 로그인</h1>
      </div>

      {/* 로그인 폼 */}
      <div className="w-full max-w-[335px]">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="space-y-4">
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
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#EF6F6F] text-[#383D48] placeholder:text-[#AEB6C6] bg-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#EF6F6F] text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 회원가입으로 이동 */}
        <div className="mt-4 text-center">
          <p className="text-[#9096A5] text-xs mb-2">아직 계정이 없으신가요?</p>
          <button
            onClick={() => navigate('/auth/email-signup')}
            className="w-full py-2 border border-[#EF6F6F] text-[#EF6F6F] rounded-lg font-medium text-sm"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailLoginPage;
