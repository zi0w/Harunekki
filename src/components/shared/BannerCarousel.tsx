import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

import BannerImg1 from '@/assets/icons/home/Banner1.webp';
import BannerImg2 from '@/assets/icons/home/Banner2.webp';

interface BannerItem {
  id: number;
  image: string;
  link: string;
  alt: string;
}

const banners: BannerItem[] = [
  {
    id: 1,
    image: BannerImg1,
    link: '/recommend',
    alt: 'AI 추천 배너',
  },
  {
    id: 2,
    image: BannerImg2,
    link: '/event',
    alt: '이벤트 배너',
  },
];

const BannerCarousel = () => {
  return (
    <div className="w-full mt-5">
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: 10000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-gray-300 !w-2 !h-2',
          bulletActiveClass:
            'swiper-pagination-bullet-active !bg-[#EF6F6F] !scale-110',
        }}
        className="banner-swiper rounded-lg drop-shadow-sm"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <Link to={banner.link} className="block">
              <img
                src={banner.image}
                alt={banner.alt}
                className="w-full h-auto object-cover"
              />
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 커스텀 스타일 */}
      <style jsx>{`
        .banner-swiper {
          --swiper-pagination-bottom: 8px;
        }

        .banner-swiper .swiper-pagination {
          position: relative;
          margin-top: 12px;
        }

        .banner-swiper .swiper-pagination-bullet {
          transition: all 0.2s ease;
        }

        .banner-swiper .swiper-pagination-bullet-active {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default BannerCarousel;
