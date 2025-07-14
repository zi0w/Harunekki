import headericon from '../assets/icon/headericon/header_icon.svg';

const Header = () => {
  return (
    <div className="w-[23.4375rem] h-[2.5rem] flex items-center justify-between bg-[#FFF] mt-[3.13rem]">
      <button>
        <img src={headericon} alt="헤더 아이콘" className="w-8 h-8" />
      </button>
    </div>
  );
};

export default Header;
