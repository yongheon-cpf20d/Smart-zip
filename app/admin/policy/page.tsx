"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Lock, Megaphone, MessageSquare, PencilLine } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Policy = {
  id: number;
  slug: string;
  title: string;
  content: string;
  source_url: string | null;
  tag: string;
  created_at: string;
  display_date: string; // 관리자가 지정하는 표시 날짜 (YYYY-MM-DD)
};

// 오늘 날짜를 YYYY-MM-DD 형식으로
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// 한글 제목 → slug 자동 생성 (날짜 + 랜덤 문자열)
function generateSlug(): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const rand = Math.random().toString(36).slice(2, 7);
  return `${date}-${rand}`;
}

const TAG_OPTIONS = [
  { key: "국토부", label: "국토부" },
  { key: "금융위", label: "금융위" },
  { key: "기타", label: "기타" },
];

export default function AdminPolicyPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tag, setTag] = useState("국토부");
  const [displayDate, setDisplayDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleLogin = () => {
    if (pwInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuth(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const fetchPolicies = async () => {
    const { data, error } = await supabase
      .from("policies")
      .select("*")
      .order("display_date", { ascending: false })
      .order("created_at", { ascending: false }); // 같은 날짜면 등록순
    if (!error && data) setPolicies(data);
  };

  useEffect(() => {
    if (isAuth) fetchPolicies();
  }, [isAuth]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSourceUrl("");
    setTag("국토부");
    setDisplayDate(todayStr());
    setEditingId(null);
  };

  const savePolicy = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용은 필수입니다.");
      return;
    }
    setSaving(true);

    if (editingId) {
      // 수정
      const { error } = await supabase
        .from("policies")
        .update({
          title: title.trim(),
          content: content.trim(),
          source_url: sourceUrl.trim() || null,
          tag,
          display_date: displayDate,
        })
        .eq("id", editingId);
      if (!error) {
        await fetchPolicies();
        resetForm();
      }
    } else {
      // 신규 작성
      const { error } = await supabase.from("policies").insert({
        slug: generateSlug(),
        title: title.trim(),
        content: content.trim(),
        source_url: sourceUrl.trim() || null,
        tag,
        display_date: displayDate,
      });
      if (!error) {
        await fetchPolicies();
        resetForm();
      }
    }
    setSaving(false);
  };

  const startEdit = (p: Policy) => {
    setEditingId(p.id);
    setTitle(p.title);
    setContent(p.content);
    setSourceUrl(p.source_url ?? "");
    setTag(p.tag);
    setDisplayDate(p.display_date ?? todayStr());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deletePolicy = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const { error } = await supabase.from("policies").delete().eq("id", id);
    if (!error) setPolicies(prev => prev.filter(p => p.id !== id));
  };

  // ── 로그인 화면 ──
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 w-full max-w-sm space-y-4">
          <h1 className="flex items-center gap-2 text-lg font-black text-slate-800">
            <Lock size={18} strokeWidth={1.75} className="text-emerald-600" />
            관리자 로그인
          </h1>
          <input
            type="password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="비밀번호 입력"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
          />
          {pwError && <p className="text-xs text-red-500">비밀번호가 틀렸습니다.</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition text-sm"
          >
            로그인
          </button>
          <Link href="/" className="block text-center text-xs text-slate-400 hover:text-emerald-600 transition">
            ← 메인으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <Megaphone size={20} strokeWidth={1.75} className="text-emerald-600" />
            정책발표 관리
          </h1>
          <div className="flex gap-2">
            <Link href="/admin/feedback" className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              <MessageSquare size={13} strokeWidth={1.75} />
              피드백 관리
            </Link>
            <button onClick={() => setIsAuth(false)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              로그아웃
            </button>
          </div>
        </div>

        {/* 작성/수정 폼 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
              {editingId && <PencilLine size={14} strokeWidth={1.75} />}
              {editingId ? "정책 수정" : "새 정책발표 작성"}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="text-xs text-slate-400 hover:text-slate-600">
                취소
              </button>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">기관</label>
            <div className="flex gap-2">
              {TAG_OPTIONS.map(t => (
                <button key={t.key} onClick={() => setTag(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    tag === t.key ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              표시 날짜 <span className="text-slate-300">— 게시판 정렬 기준 (이 날짜가 최신일수록 위에 표시)</span>
            </label>
            <input
              type="date"
              value={displayDate}
              onChange={e => setDisplayDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 기흥·동탄·구리 토지거래허가구역 지정"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">내용 (원문 요약)</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="정책 내용을 요약해서 작성해주세요."
              rows={6}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">원문 링크 (선택)</label>
            <input
              type="text"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://www.molit.go.kr/..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          <button
            onClick={savePolicy}
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition text-sm disabled:bg-slate-300"
          >
            {saving ? "저장 중..." : editingId ? "수정 완료" : "정책발표 등록"}
          </button>
        </div>

        {/* 기존 목록 */}
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-semibold px-1">등록된 정책 ({policies.length}개)</p>
          {policies.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">등록된 정책이 없습니다.</div>
          ) : (
            policies.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{p.tag}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(p.display_date).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{p.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.content}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(p)} className="text-xs text-blue-500 hover:text-blue-700 transition">수정</button>
                  <button onClick={() => deletePolicy(p.id)} className="text-xs text-red-400 hover:text-red-600 transition">삭제</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}