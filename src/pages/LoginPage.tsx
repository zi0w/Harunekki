import { ROUTES } from '../constants/routes';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import kakaologinicon from '../assets/icon/loginicon/kakao_login_large_wide.png';
const LoginPage = () => {
  const navigate = useNavigate();

  const goToResult = () => {
    navigate(ROUTES.LOGIN);
  };
  const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
  const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

  const handleKakaoLogin = () => {
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <Layout>
      <Header />
      <div className="mt-[32.5rem] flex flex-col items-center gap-[0.625rem]">
        {/* 카카오 로그인 */}
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
    </Layout>
  );
};
export default LoginPage;
