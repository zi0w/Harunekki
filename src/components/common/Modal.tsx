import dismiss from '@/assets/icons/modal/dismiss.png';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  onConfirm: () => void;
  onClose: () => void;
};

const Modal = ({
  open,
  title,
  description,
  confirmText,
  onConfirm,
  onClose,
}: Props) => {
  if (!open) return null;

  return (
    <div
      className="fixed z-[100] inset-0 grid place-items-center bg-black/30"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex flex-col items-center text-center relative w-[335px] rounded-2xl bg-[#F9FAFB] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={dismiss}
          onClick={onClose}
          className="absolute right-4 top-4 h-5 w-5 grid place-items-center cursor-pointer"
        />
        <h2 className="font-kakaoBig mt-10 mb-4 text-4 text-[#383D48]">
          {title}
        </h2>
        {description && (
          <p className="whitespace-pre-line font-kakaoSmall mb-5 text-[12px] leading-6 text-[#596072]">
            {description}
          </p>
        )}
        <button
          onClick={onConfirm}
          className="shadow-lg font-kakaoBig text-4 mt-1 w-full rounded-xl bg-[#EF6F6F] py-3 text-white hover:opacity-95"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

export default Modal;
