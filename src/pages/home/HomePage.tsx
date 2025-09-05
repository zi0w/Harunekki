import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      <Link to="/recommend">
        <div className="w-full h-[188px] bg-[#f3fbff] shadow-lg mt-5 flex flex-col justify-center">
          <p className="text-black text-[25px] text-center">
            챗봇 <br />
            (스타일링 + 캐러셀 작업 필요)
          </p>
        </div>
      </Link>
    </div>
  );
};

export default HomePage;
