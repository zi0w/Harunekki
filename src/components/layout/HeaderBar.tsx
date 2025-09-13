import { useNavigate } from 'react-router-dom';
import logo from '@/assets/icons/header/header_icon.svg';
import type { ReactNode } from 'react';

type HeaderBarProps = {
  /** 'logo' = 로고 헤더, 'back' = 뒤로가기 헤더 */
  variant?: 'logo' | 'back';
  /** variant==='back'일 때 표시할 타이틀 */
  title?: string;
  /** 특정 경로로 돌아가기. 생략하면 history(-1) */
  backTo?: string | number; // 예: '/mypage' 또는 -1
  /** back 처리 커스터마이즈 하고 싶으면 onBack 전달 */
  onBackClick?: () => void;
  /** 우측 영역 커스텀(알림, 설정 버튼 등) */
  rightSlot?: ReactNode;
  /** 헤더 높이 */
  heightClassName?: string; // default: 'h-[94px]'
  /** 추가 클래스 */
  className?: string;
  /** 배경색 (페이지에 따라 바꿀 수 있게) */
  bgClassName?: string; // default: 'bg-[#F9FAFB]'
  /** 하단 경계선 유무 */
  withBorder?: boolean;
};

export default function HeaderBar({
  variant = 'logo',
  title,
  backTo,
  onBackClick,
  rightSlot,
  heightClassName = 'h-[94px]',
  className = '',
  bgClassName = 'bg-[#F9FAFB]',
  withBorder = false,
}: HeaderBarProps) {
  const nav = useNavigate();

  const handleBack = () => {
    if (onBackClick) return onBackClick();
    if (typeof backTo === 'string') nav(backTo);
    else if (typeof backTo === 'number') nav(backTo);
    else nav(-1);
  };

  return (
    <header
      className={`${heightClassName} shrink-0 ${bgClassName} ${withBorder ? 'border-b' : ''} ${className} safe-area-top`}
    >
      {/* 좌측 정렬로 수정 */}
      <div className="flex h-full items-center px-5">
        {/* 좌측: 로고 또는 백버튼 */}
        {variant === 'logo' ? (
          <div className="flex items-center">
            <img
              src={logo}
              alt="로고"
              className="h-4 w-auto"
              draggable={false}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              aria-label="뒤로가기"
              className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-black/5"
            >
              <span className="text-[#9096A5] text-lg font-bold">&lt;</span>
            </button>
            {title && (
              <h1 className="font-kakaoBig text-[16px] text-[#383D48]">
                {title}
              </h1>
            )}
          </div>
        )}

        {/* 우측 액션 */}
        {rightSlot && (
          <div className="flex items-center ml-auto">{rightSlot}</div>
        )}
      </div>
    </header>
  );
}
