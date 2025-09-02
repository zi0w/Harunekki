import titleImage from '@/assets/icons/login/login_main.png';
import naverLoginBtn from '@/assets/icons/login/login_naver.png';
import googleLoginBtn from '@/assets/icons/login/login_google.png';
import kakaoLoginBtn from '@/assets/icons/login/login_kakao.png';
import { supabase } from '@/lib/supabase/supabase';

const LoginPage = () => {
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
    <div className="flex flex-col items-center mt-[164px]">
      <img src={titleImage} width={105} height={154} />
      <div className="flex flex-col mt-[197.83px] gap-4">
        <img src={naverLoginBtn} width={335} height={52} />
        <button onClick={() => signIn('google')} className="w-[335px] h-[52px]">
          <img src={googleLoginBtn} width={335} height={52} />
        </button>
        <img src={kakaoLoginBtn} width={335} height={52} />
      </div>
    </div>
  );
};

export default LoginPage;
