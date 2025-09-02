import headericon from '@/assets/icons/header/header_icon.svg';

const Header = () => {
  return (
    <div className="w-[23.4375rem] h-[2.5rem] flex items-center justify-between bg-[#F9FAFB]">
      <button>
        <img src={headericon} alt="헤더 아이콘" className="w-18" />
      </button>
    </div>
  );
};

export default Header;
