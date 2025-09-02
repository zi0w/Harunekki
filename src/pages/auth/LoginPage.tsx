import kakaologinicon from '@/assets/icons/loginicon/kakao_login_large_wide.png';

const LoginPage = () => {

  const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
  const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

  const handleKakaoLogin = () => {
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <div className="flex flex-col items-center gap-[0.625rem]">
      <button
        onClick={handleKakaoLogin}
        className="flex justify-center items-center w-[20.9375rem] h-[3rem] rounded-[0.75rem] p-0 overflow-hidden appearance-none border-none bg-transparent"
      >
        <img
          src={kakaologinicon}
          alt="카카오 로그인"
          className="w-[20.9375rem] h-[3rem] object-cover"
        />
      </button>

      {/* 아래 버튼들도 예시용이라면 제거 가능 */}
      <button className="flex justify-center items-center w-[20.9375rem] h-[3rem] rounded-[0.75rem] p-0 overflow-hidden appearance-none border-none bg-transparent">
        <img
          src={kakaologinicon}
          alt="카카오 로그인"
          className="w-[20.9375rem] h-[3rem] object-cover"
        />
      </button>
      <button className="flex justify-center items-center w-[20.9375rem] h-[3rem] rounded-[0.75rem] p-0 overflow-hidden appearance-none border-none bg-transparent">
        <img
          src={kakaologinicon}
          alt="카카오 로그인"
          className="w-[20.9375rem] h-[3rem] object-cover"
        />
      </button>
    </div>
  );
};

export default LoginPage;
