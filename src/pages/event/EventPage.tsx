import EventBanner from '@/assets/icons/event/info.png';


const EventPage = () => {
  return (
    <div className="w-full h-full">
      <img
        src={EventBanner}
        alt="이벤트 배너"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default EventPage;
