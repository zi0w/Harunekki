import { useEffect, useState } from 'react';
import badgeCompleteIcon from '@/assets/icons/diary/Badge_Complete.webp';

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionName: string;
}

export default function BadgeModal({
  isOpen,
  onClose,
  regionName,
}: BadgeModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-2xl p-6 mx-6 max-w-xs w-full">
        {/* 뱃지 이미지 */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <img
              src={badgeCompleteIcon}
              alt="완성된 뱃지"
              className={`w-30 h-20 transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)} // 에러 시에도 표시
            />
            {!imageLoaded && (
              <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        {/* 축하 메시지 */}
        <div className="text-center mb-5">
          <h2 className="text-xl font-kakaoBig text-[#383D48] mb-2">
            축하합니다!
          </h2>
          <p className="text-md font-kakaoSmall text-[#EF6F6F] mb-2">
            {regionName} 뱃지 획득!
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-[#EF6F6F] text-white font-kakaoBig py-3 rounded-xl hover:bg-[#EF6F6F] transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
