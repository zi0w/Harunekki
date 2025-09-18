import { useNavigate } from 'react-router-dom';
import headericon from '@/assets/icons/header/header_icon.svg';

const Header = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="w-full h-[40px] flex items-center bg-[#F9FAFB] border-b safe-area-top">
      <button onClick={handleLogoClick} className="flex items-center">
        <img src={headericon} alt="하루네끼 로고" className="h-4 w-auto" />
      </button>
    </div>
  );
};

export default Header;
