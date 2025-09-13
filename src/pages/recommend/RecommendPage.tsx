import { useEffect, useMemo, useRef, useState } from 'react';
import { askRecommend } from '@/lib/api/recommend';
import bappul from '@/assets/icons/recommend/Image.png';

type Msg = {
  id: string;
  role: 'bot' | 'user';
  text: string;
  pending?: boolean; // 생성중 표시
};

const MAX_LEN = 100;
const MAX_RETRY = 3;

export default function RecommendPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastQuery, setLastQuery] = useState<string>('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const hasChat = messages.length > 0;
  const canSubmit =
    input.trim().length > 0 && input.trim().length <= MAX_LEN && !loading;

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  const pushAssistantPending = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'bot',
        text: '답변 생성 중',
        pending: true,
      },
    ]);
  };

  const replaceLastPending = (text: string) => {
    setMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === 'bot' && next[i].pending) {
          next[i] = { ...next[i], text, pending: false };
          break;
        }
      }
      return next;
    });
  };

  // 최초 추천
  const submit = async () => {
    if (!canSubmit) return;
    const q = input.trim();
    setInput('');
    setLoading(true);

    setLastQuery(q);

    // 내 메시지 추가
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text: q },
    ]);

    pushAssistantPending();

    try {
      const answer = await askRecommend(q);
      replaceLastPending(answer);
      setRetryCount(0);
    } catch (e) {
      console.error(e);
      replaceLastPending(
        '추천 요청 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setLoading(false);
    }
  };

  // 재추천
  const retry = async () => {
    if (retryCount >= MAX_RETRY || loading) return;

    const base = lastQuery || '이전 조건';
    const q = `${base} (같은 조건으로 다른 후보를 추천해줘)`;

    setRetryCount((c) => c + 1);
    setLoading(true);

    // 화면에는 "다시 추천해줘"를 내가 보낸 메시지처럼 표시
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text: '다시 추천해줘' },
    ]);

    pushAssistantPending();

    try {
      const answer = await askRecommend(q);
      replaceLastPending(answer);
    } catch (e) {
      console.error(e);
      replaceLastPending('재추천 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setInput('');
    setMessages([]);
    setRetryCount(0);
    setLastQuery(''); // ✅ 초기화
  };

  const counter = useMemo(() => `${input.trim().length} / ${MAX_LEN}`, [input]);

  return (
    <div className="w-full flex flex-col min-h-screen sm:min-h-[calc(100vh-80px)]">
      {!hasChat ? (
        <div className="flex-1 overflow-y-auto pb-8">
          <div className="mt-16 flex flex-col items-center text-center">
            <img src={bappul} alt="AI 밥풀이" className="h-28 w-28 mb-8" />
            <h2 className="font-kakaoBig text-[16px] text-[#383D48]">
              AI 밥풀이
            </h2>
            <p className="mt-3 font-kakaoSmall text-[14px] leading-5 text-[#596072]">
              원하는 여행 스타일, 이동 수단, 연령대 등<br />
              최대한 자세히 알려주면 취향에 맞춰 추천해줄게!
            </p>
          </div>

          <div className="mt-16">
            <span className="text-[16px] text-[#383D48] font-kakaoBig">
              여행 정보 알려주기
            </span>
            <div className="mt-3 rounded-xl border bg-white p-3 shadow-sm">
              <textarea
                value={input}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.length <= MAX_LEN) setInput(v);
                }}
                placeholder="AI 밥풀이에게 여행 정보를 자세히 알려줘볼까?"
                className="bg-white h-24 w-full resize-none outline-none font-kakaoSmall text-[14px] leading-6 text-[#596072] placeholder:text-[#596072]"
              />
              <div className="mt-2 text-right text-[12px] font-kakaoSmall text-[#9096A5]">{`( ${counter} )`}</div>
            </div>
          </div>

          <button
            disabled={!canSubmit}
            onClick={submit}
            className={`mt-7 w-full rounded-xl py-3 font-kakaoBig text-white shadow-sm
              ${canSubmit ? 'bg-[#EF6F6F] hover:opacity-95' : 'bg-[#D3D8E3] text-[#AEB6C6]'}`}
          >
            {loading ? '추천 중...' : '추천받기'}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* 메시지 리스트 */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto pt-4 space-y-6 scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {messages.map((m) =>
              m.role === 'bot' ? (
                <div key={m.id} className="flex items-start gap-2">
                  <img src={bappul} alt="bot" className="mt-1 h-6 w-6" />
                  <div
                    className={`rounded-xl px-3 py-2 max-w-[80%] font-kakaoSmall text-[13px] leading-6 whitespace-pre-wrap
                      ${
                        m.pending
                          ? 'bg-[#F6F7F9] text-[#8A93A6] italic'
                          : 'bg-[#E9F1FA] text-[#3E5A70]'
                      }`}
                  >
                    {m.text}
                    {m.pending && (
                      <span className="ml-1 animate-pulse">...</span>
                    )}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-xl bg-white border px-3 py-2 text-[#383D48] font-kakaoSmall text-[13px] leading-6 whitespace-pre-wrap">
                    {m.text}
                  </div>
                </div>
              ),
            )}

            <div className="mt-2 flex flex-col items-center">
              <button
                onClick={retry}
                disabled={loading || retryCount >= MAX_RETRY}
                className={`mt-2 rounded-full border shadow-sm w-[150px] bg-white h-[36px] mb-4 px-3 py-1 text-[12px] font-kakaoSmall
                  ${retryCount >= MAX_RETRY ? 'text-[#AEB6C6] border-[#E5E7EB]' : 'text-[#596072] border-[#E5E7EB]'}`}
              >
                다시 추천해줘 &nbsp; {Math.min(retryCount, MAX_RETRY)} /{' '}
                {MAX_RETRY}
              </button>
            </div>
          </div>

          {/* 하단 액션 */}
          <div className="pb-4 pt-2 shrink-0">
            <button
              onClick={resetChat}
              className="w-full rounded-xl bg-[#EF6F6F] py-3 text-white font-kakaoBig shadow-sm hover:opacity-95"
              disabled={loading}
            >
              새로운 여행 정보 알려주기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
