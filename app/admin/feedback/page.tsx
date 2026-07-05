"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import AdminVisitorStats from "@/components/AdminVisitorStats";
import {
  Lock, RefreshCw, MessageSquare, ClipboardList, Lightbulb, Bug,
  MessageCircle, Trash2, Mail, Sparkles, PencilLine,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Feedback = {
  id: number;
  name: string;
  category: string;
  title: string;
  content: string;
  email: string | null;
  is_public: boolean;
  admin_reply: string | null;
  created_at: string;
};

type ChangelogItem = {
  id?: number;
  date: string;
  category: "fix" | "feature" | "improvement";
  title: string;
  description: string;
  is_feedback_based: boolean;
};

const CATEGORY_LABEL: Record<string, string> = {
  feature: "기능건의",
  bug: "오류신고",
  other: "기타",
};

// ── 토글 스위치 공통 컴포넌트 ──
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        position: "relative",
        width: 44,
        height: 24,
        borderRadius: 999,
        background: value ? "#10b981" : "#cbd5e1",
        border: "none",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute",
        top: 2,
        left: value ? 22 : 2,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 0.2s",
        display: "block",
      }} />
    </button>
  );
}

export default function AdminFeedbackPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<"feedback" | "changelog">("feedback");

  // 피드백
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "feature" | "bug" | "other">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyInput, setReplyInput] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  // 체인지로그
  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [newLog, setNewLog] = useState<ChangelogItem>({
    date: new Date().toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(".", "").slice(0, -1),
    category: "feature",
    title: "",
    description: "",
    is_feedback_based: false,
  });
  const [logSaving, setLogSaving] = useState(false);

  const handleLogin = () => {
    if (pwInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuth(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setFeedbacks(data);
    setLoading(false);
  };

  const fetchChangelogs = async () => {
    const { data, error } = await supabase
      .from("changelog")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setChangelogs(data);
  };

  useEffect(() => {
    if (isAuth) {
      fetchFeedbacks();
      fetchChangelogs();
    }
  }, [isAuth]);

  const togglePublic = async (id: number, current: boolean) => {
    const { error } = await supabase
      .from("feedback")
      .update({ is_public: !current })
      .eq("id", id);
    if (!error) {
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, is_public: !current } : f));
    }
  };

  const saveReply = async (id: number) => {
    setSaving(id);
    const reply = replyInput[id] ?? "";
    const { error } = await supabase
      .from("feedback")
      .update({ admin_reply: reply })
      .eq("id", id);
    if (!error) {
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, admin_reply: reply } : f));
    }
    setSaving(null);
  };

  const deleteFeedback = async (id: number, title: string) => {
    if (!confirm(`"${title}" 피드백을 삭제하시겠습니까?\n삭제된 피드백은 복구할 수 없습니다.`)) return;
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (!error) {
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      if (expandedId === id) setExpandedId(null);
    } else {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const saveChangelog = async () => {
    if (!newLog.title.trim() || !newLog.date.trim()) {
      alert("날짜와 제목은 필수입니다.");
      return;
    }
    setLogSaving(true);
    const { error } = await supabase.from("changelog").insert({
      date: newLog.date,
      category: newLog.category,
      title: newLog.title.trim(),
      description: newLog.description.trim() || null,
      is_feedback_based: newLog.is_feedback_based,
    });
    if (!error) {
      await fetchChangelogs();
      setNewLog({
        date: new Date().toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(".", "").slice(0, -1),
        category: "feature",
        title: "",
        description: "",
        is_feedback_based: false,
      });
    }
    setLogSaving(false);
  };

  const deleteChangelog = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const { error } = await supabase.from("changelog").delete().eq("id", id);
    if (!error) setChangelogs(prev => prev.filter(c => c.id !== id));
  };

  const filtered = filter === "all" ? feedbacks : feedbacks.filter(f => f.category === filter);

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

  // ── 관리자 화면 ──
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">관리자</h1>
          <div className="flex gap-2">
            <button onClick={() => { fetchFeedbacks(); fetchChangelogs(); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              <RefreshCw size={12} strokeWidth={1.75} />
              새로고침
            </button>
            <button onClick={() => setIsAuth(false)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              로그아웃
            </button>
          </div>
        </div>

        {/* 방문자 통계 — 관리자만 확인 가능 */}
        <AdminVisitorStats />

        {/* 탭 */}
        <div className="flex gap-2">
          <button onClick={() => setTab("feedback")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition ${
              tab === "feedback" ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
            }`}>
            <MessageSquare size={14} strokeWidth={1.75} />
            피드백 ({feedbacks.length})
          </button>
          <button onClick={() => setTab("changelog")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition ${
              tab === "changelog" ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
            }`}>
            <ClipboardList size={14} strokeWidth={1.75} />
            업데이트 로그 ({changelogs.length})
          </button>
        </div>

        {/* ── 피드백 탭 ── */}
        {tab === "feedback" && (
          <div className="space-y-3">
            {/* 필터 */}
            <div className="flex gap-2 flex-wrap">
              {[
                { k: "all", l: "전체" },
                { k: "feature", l: "기능건의" },
                { k: "bug", l: "오류신고" },
                { k: "other", l: "기타" },
              ].map(f => (
                <button key={f.k} onClick={() => setFilter(f.k as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    filter === f.k ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
                  }`}>
                  {f.l}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-sm">불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">피드백이 없습니다.</div>
            ) : (
              filtered.map(f => (
                <div key={f.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="p-4 hover:bg-slate-50 transition flex items-start justify-between gap-3">
                    <div
                      className="flex items-center gap-2 flex-wrap min-w-0 flex-1 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                    >
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                        {CATEGORY_LABEL[f.category] ?? f.category}
                      </span>
                      {f.is_public && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">공개</span>
                      )}
                      {f.admin_reply && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">답변완료</span>
                      )}
                      <p className="text-sm font-bold text-slate-800 truncate">{f.title}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div
                        className="text-right cursor-pointer"
                        onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                      >
                        <p className="text-xs text-slate-500 font-semibold">{f.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(f.created_at).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFeedback(f.id, f.title); }}
                        className="text-slate-300 hover:text-red-500 transition p-1"
                        title="삭제"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  {expandedId === f.id && (
                    <div className="border-t border-slate-100 p-4 space-y-4">
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{f.content}</p>
                        {f.email && (
                          <p className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                            <Mail size={12} strokeWidth={1.75} />
                            {f.email}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-semibold">공개 설정</span>
                        <Toggle value={f.is_public} onChange={() => togglePublic(f.id, f.is_public)} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-semibold">관리자 답변</label>
                        <textarea
                          value={replyInput[f.id] ?? f.admin_reply ?? ""}
                          onChange={e => setReplyInput(prev => ({ ...prev, [f.id]: e.target.value }))}
                          placeholder="답변을 입력하세요..."
                          rows={3}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 resize-none"
                        />
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => saveReply(f.id)}
                            disabled={saving === f.id}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition disabled:bg-slate-300"
                          >
                            {saving === f.id ? "저장 중..." : "답변 저장"}
                          </button>
                          <button
                            onClick={() => deleteFeedback(f.id, f.title)}
                            className="flex items-center gap-1 px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-500 text-xs font-bold rounded-lg transition"
                          >
                            <Trash2 size={12} strokeWidth={1.75} />
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── 체인지로그 탭 ── */}
        {tab === "changelog" && (
          <div className="space-y-4">

            {/* 새 로그 작성 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-700">새 업데이트 로그 작성</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">날짜</label>
                  <input
                    type="text"
                    value={newLog.date}
                    onChange={e => setNewLog(prev => ({ ...prev, date: e.target.value }))}
                    placeholder="예: 2026.07.02"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">카테고리</label>
                  <select
                    value={newLog.category}
                    onChange={e => setNewLog(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                  >
                    <option value="feature">신기능</option>
                    <option value="fix">버그수정</option>
                    <option value="improvement">개선</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">제목</label>
                <input
                  type="text"
                  value={newLog.title}
                  onChange={e => setNewLog(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="예: 갈아타기 시뮬레이터 출시"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">설명 (선택)</label>
                <textarea
                  value={newLog.description}
                  onChange={e => setNewLog(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="변경 내용을 자세히 설명해주세요."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-semibold">유저 피드백 반영</p>
                  <p className="text-[11px] text-slate-400">체인지로그에 피드백 반영 배지 표시</p>
                </div>
                <Toggle
                  value={newLog.is_feedback_based}
                  onChange={() => setNewLog(prev => ({ ...prev, is_feedback_based: !prev.is_feedback_based }))}
                />
              </div>

              <button
                onClick={saveChangelog}
                disabled={logSaving}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition text-sm disabled:bg-slate-300"
              >
                {logSaving ? "저장 중..." : "업데이트 로그 등록"}
              </button>
            </div>

            {/* 기존 로그 목록 */}
            <div className="space-y-2">
              {changelogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">등록된 로그가 없습니다.</div>
              ) : (
                changelogs.map(log => (
                  <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {log.category === "feature" ? "신기능" : log.category === "fix" ? "버그수정" : "개선"}
                        </span>
                        {log.is_feedback_based && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">피드백반영</span>
                        )}
                        <span className="text-[10px] text-slate-400">{log.date}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{log.title}</p>
                      {log.description && <p className="text-xs text-slate-500 mt-0.5">{log.description}</p>}
                    </div>
                    <button
                      onClick={() => log.id && deleteChangelog(log.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition shrink-0"
                    >
                      삭제
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}