import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import titleImage from '@/assets/icons/login/login_main.png';
import facebookLoginBtn from '@/assets/icons/login/login_facebook.png';
import googleLoginBtn from '@/assets/icons/login/login_google.png';
import kakaoLoginBtn from '@/assets/icons/login/login_kakao.png';
import emailLoginBtn from '@/assets/icons/login/login_email.png';
import { supabase } from '@/lib/supabase/supabase';

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        navigate('/', { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  const signIn = async (provider: 'google' | 'kakao' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="flex flex-col items-center mt-[124px]">
      <img src={titleImage} width={105} height={154} />
      <div className="flex flex-col mt-[196px] gap-2">
        {/* 이메일 로그인 버튼 */}
        <button
          onClick={() => navigate('/auth/email-login')}
          className="w-[335px] h-[52px]"
        >
          <img src={emailLoginBtn} width={335} height={52} />
          이메일로 로그인
        </button>

        {/* 소셜 로그인 버튼들 */}
        <button onClick={() => signIn('google')} className="w-[335px] h-[52px]">
          <img src={googleLoginBtn} width={335} height={52} />
        </button>
        <button onClick={() => signIn('kakao')} className="w-[335px] h-[52px]">
          <img src={kakaoLoginBtn} width={335} height={52} />
        </button>
        <button
          onClick={() => signIn('facebook')}
          className="w-[335px] h-[52px]"
        >
          <img src={facebookLoginBtn} width={335} height={52} />
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
