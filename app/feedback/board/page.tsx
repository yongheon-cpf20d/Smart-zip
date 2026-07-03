"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type FeedbackListItem = {
  id: number;
  name: string;
  title: string;
  category: string;
  is_public: boolean;
  admin_reply: string | null;
  created_at: string;
};

type FeedbackDetail = FeedbackListItem & {
  content: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  feature: "🙋 기능건의",
  bug: "🐛 오류신고",
  other: "💬 기타",
};

export default function FeedbackBoardPage() {
  const [list, setList] = useState<FeedbackListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 비밀번호 확인 모달
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [detail, setDetail] = useState<FeedbackDetail | null>(null);

  useEffect(() => {
    // 비공개 글도 목록에는 필요한 정보만(제목 제외) 가져와야 하지만
    // RLS가 is_public=true만 select 허용이라 별도 API 경로 필요.
    // → anon 키로는 비공개 글의 제목을 볼 수 없어야 하므로
    //   목록 조회는 name, category, is_public, admin_reply, created_at, id만
    //   서버사이드에서 title 마스킹 처리된 형태로 내려주는 게 이상적.
    // 여기서는 클라이언트에서 마스킹 처리 (RLS 정책이 전체 select 허용된 상태 기준)
    supabase
      .from("feedback")
      .select("id, name, title, category, is_public, admin_reply, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setList(data);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.is_public && f.title.toLowerCase().includes(q))
    );
  }, [list, search]);

  const openCheck = (id: number) => {
    setSelectedId(id);
    setPwInput("");
    setPwError(false);
    setDetail(null);
  };

  const closeModal = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const checkPassword = async () => {
    if (!selectedId || !pwInput.trim()) return;
    setChecking(true);
    setPwError(false);

    const hash = await sha256(pwInput);
    const { data, error } = await supabase
      .from("feedback")
      .select("id, name, title, content, category, is_public, admin_reply, created_at")
      .eq("id", selectedId)
      .eq("password_hash", hash)
      .single();

    if (error || !data) {
      setPwError(true);
      setChecking(false);
      return;
    }

    setDetail(data);
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">📋 피드백 게시판</h1>
            <p className="text-xs text-slate-400 mt-1">제출한 피드백은 기본적으로 비공개 처리됩니다</p>
          </div>
          <Link
            href="/feedback"
            className="text-xs font-bold px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 transition shrink-0"
          >
            ✍️ 새 피드백
          </Link>
        </div>

        {/* 검색 */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 제목으로 검색"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 pl-9"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">🔍</span>
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            {search ? "검색 결과가 없습니다." : "등록된 피드백이 없습니다."}
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            {/* 헤더 */}
            <div className="grid grid-cols-[70px_1fr_90px_70px] gap-2 px-4 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-400 border-b border-slate-200">
              <span>상태</span>
              <span>제목</span>
              <span>이름</span>
              <span>날짜</span>
            </div>

            {filtered.map((f) => (
              <button
                key={f.id}
                onClick={() => openCheck(f.id)}
                className="w-full grid grid-cols-[70px_1fr_90px_70px] gap-2 px-4 py-3 items-center text-left border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
              >
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full text-center ${
                    f.admin_reply
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {f.admin_reply ? "답변완료" : "처리중"}
                </span>
                <span className="text-sm text-slate-700 truncate">
                  {f.is_public ? f.title : "🔒 비공개인 제목입니다"}
                </span>
                <span className="text-xs text-slate-500 truncate">{f.name}</span>
                <span className="text-[11px] text-slate-400">
                  {new Date(f.created_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] text-slate-400 text-center pt-2">
          본인이 작성한 피드백을 클릭하고 비밀번호를 입력하면 내용과 답변을 확인할 수 있습니다.
        </p>
      </div>

      {/* 비밀번호 확인 모달 */}
      {selectedId !== null && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {!detail ? (
              <>
                <h2 className="text-base font-bold text-slate-800">🔒 비밀번호 확인</h2>
                <p className="text-xs text-slate-400">
                  작성 시 입력한 비밀번호를 입력해주세요.
                </p>
                <input
                  type="password"
                  value={pwInput}
                  onChange={(e) => setPwInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkPassword()}
                  placeholder="비밀번호"
                  autoFocus
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                />
                {pwError && (
                  <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50 transition"
                  >
                    취소
                  </button>
                  <button
                    onClick={checkPassword}
                    disabled={checking}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition disabled:bg-slate-300"
                  >
                    {checking ? "확인 중..." : "확인"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {CATEGORY_LABEL[detail.category] ?? detail.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      detail.admin_reply ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {detail.admin_reply ? "답변완료" : "처리중"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(detail.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-800">{detail.title}</h2>
                <div className="bg-slate-50 rounded-xl p-3 max-h-40 overflow-y-auto">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {detail.content}
                  </p>
                </div>

                {detail.admin_reply ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-emerald-600 mb-1">🏠 똑집 답변</p>
                    <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap">
                      {detail.admin_reply}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400">아직 답변이 등록되지 않았습니다.</p>
                  </div>
                )}

                <button
                  onClick={closeModal}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50 transition"
                >
                  닫기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}