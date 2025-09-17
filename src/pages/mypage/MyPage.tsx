import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';
import Modal from '@/components/common/Modal';
import arrowRight from '@/assets/icons/mypage/arrow_right.png';

export default function MyPage() {
  const nav = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const doLogout = async () => {
    await supabase.auth.signOut();
    nav('/login', { replace: true });
  };

  // ⚠️ 클라이언트에서 auth 계정 자체 삭제는 불가(서비스 키 필요).
  // 임시로 앱 프로필(row)만 삭제하고 로그아웃 처리. 실제 계정 삭제는 Edge Function으로 구현 권장.
  const doDelete = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from('users').delete().eq('id', user.id);
    await supabase.auth.signOut();
    nav('/login', { replace: true });
  };

  return (
    <div className="mt-8">
      <ul className="space-y-4">
        <li>
          <Link
            to="/mypage/info"
            className="flex items-center font-kakaoBig justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-[16px] text-[#596072]">내 정보</span>
            <img src={arrowRight} className="w-4 h-4" draggable={false} />
          </Link>
        </li>
        <li>
          <Link
            to="/mypage/badges"
            className="flex items-center font-kakaoBig justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-[15px] text-[#596072]">내가 받은 뱃지</span>
            <img src={arrowRight} className="w-4 h-4" draggable={false} />
          </Link>
        </li>
        <li>
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex w-full items-center font-kakaoBig justify-between rounded-xl bg-white px-4 py-3 text-left shadow-sm"
          >
            <span className="text-[15px] text-[#596072]">로그아웃</span>
            <img src={arrowRight} className="w-4 h-4" draggable={false} />
          </button>
        </li>
        <li>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex w-full items-center font-kakaoBig justify-between rounded-xl bg-white px-4 py-3 text-left shadow-sm"
          >
            <span className="text-[15px] text-[#596072]">계정 탈퇴</span>
            <img src={arrowRight} className="w-4 h-4" draggable={false} />
          </button>
        </li>
      </ul>

      <Modal
        open={logoutOpen}
        title="정말 로그아웃 하시겠어요?" 
        description="로그아웃 하시면 하루네끼의 모든 서비스를 
        이용하실 수 없어요."
        confirmText="로그아웃 하기"
        onConfirm={() => {
          setLogoutOpen(false);
          doLogout();
        }}
        onClose={() => setLogoutOpen(false)}
      />
      <Modal
        open={deleteOpen}
        title="정말 탈퇴 하시겠어요?"
        description="한 번 탈퇴하면 모든 정보가 사라지니 
        신중한 선택 부탁드려요."
        confirmText="탈퇴하기"
        onConfirm={() => {
          setDeleteOpen(false);
          doDelete();
        }}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
