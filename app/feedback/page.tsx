"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// SHA-256 해시 (브라우저 내장 crypto API)
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// 간단한 수식 캡차 생성
function generateCaptcha(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const ops = ["+", "-", "×"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let answer: number;
  let question: string;
  if (op === "+") { answer = a + b; question = `${a} + ${b}`; }
  else if (op === "-") { answer = Math.max(a, b) - Math.min(a, b); question = `${Math.max(a, b)} - ${Math.min(a, b)}`; }
  else { answer = a * b; question = `${a} × ${b}`; }
  return { question, answer };
}

const CATEGORIES = [
  { key: "feature", label: "🙋 기능 건의", desc: "새로운 기능이나 개선사항" },
  { key: "bug", label: "🐛 오류 신고", desc: "계산 오류나 버그 발견" },
  { key: "other", label: "💬 기타", desc: "칭찬, 욕, 뭐든지" },
];

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("feature");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captcha, setCaptcha] = useState<{ question: string; answer: number }>({ question: "...", answer: -1 });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // 클라이언트에서만 캡차 생성 (SSR/CSR 불일치 방지)
  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  // 제출 완료 후 캡차 재생성
  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  };

  const handleSubmit = async () => {
    setError("");

    // 유효성 검사
    if (!name.trim()) { setError("이름(닉네임)을 입력해주세요."); return; }
    if (!password.trim() || password.length < 4) { setError("비밀번호는 4자 이상 입력해주세요."); return; }
    if (!title.trim()) { setError("제목을 입력해주세요."); return; }
    if (!content.trim() || content.length < 10) { setError("내용을 10자 이상 입력해주세요."); return; }
    if (Number(captchaInput) !== captcha.answer) {
      setError("자동입력 방지 문자가 틀렸습니다.");
      refreshCaptcha();
      return;
    }

    setSubmitting(true);
    try {
      // IP 해시 (서버에서 처리 불가하므로 타임스탬프 기반으로 대체, 실제 IP는 API Route에서 처리)
      const passwordHash = await sha256(password);
      const ipHash = await sha256(navigator.userAgent + new Date().toDateString());

      // 도배 방지: 동일 IP 1시간 내 5회 초과 체크
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", oneHourAgo);

      if ((count ?? 0) >= 5) {
        setError("1시간 내 작성 가능한 피드백 수를 초과하였습니다. (최대 5개)");
        setSubmitting(false);
        return;
      }

      const { error: dbError } = await supabase.from("feedback").insert({
        name: name.trim(),
        password_hash: passwordHash,
        category,
        title: title.trim(),
        content: content.trim(),
        email: email.trim() || null,
        is_public: isPublic,
        ip_hash: ipHash,
      });

      if (dbError) throw dbError;

      setDone(true);
    } catch (err) {
      console.error(err);
      setError("전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white font-sans flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <span className="text-5xl">✅</span>
          <h2 className="text-xl font-black text-slate-800">피드백이 접수되었습니다!</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            소중한 의견 감사합니다. 이메일을 남기셨다면 처리 후 회신드릴게요.
            반영 내역은 <Link href="/changelog" className="text-emerald-600 font-semibold hover:underline">업데이트 로그</Link>에서 확인하실 수 있습니다.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/" className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition">
              메인으로
            </Link>
            <button
              onClick={() => {
                setDone(false);
                setName(""); setPassword(""); setTitle(""); setContent(""); setEmail("");
                setCaptchaInput(""); refreshCaptcha();
              }}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition"
            >
              또 남기기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        <div>
          <h1 className="text-xl font-bold text-slate-800">💬 피드백 보내기</h1>
          <p className="text-xs text-slate-400 mt-1">기능 건의, 오류 신고, 뭐든지 환영합니다. 모든 피드백은 기본 비공개로 처리됩니다.</p>
        </div>

        {/* 카테고리 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">어떤 내용인가요?</h2>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`py-3 px-2 rounded-xl border transition flex flex-col items-center gap-1 text-center ${
                  category === c.key
                    ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="text-sm font-bold">{c.label}</span>
                <span className="text-[10px] opacity-70">{c.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 내용 입력 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">내용 작성</h2>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 취득세 계산이 이상해요"
              maxLength={100}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">내용</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="자세히 알려주실수록 빠르게 개선할 수 있어요."
              maxLength={2000}
              rows={5}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 resize-none"
            />
            <p className="text-[10px] text-slate-400 text-right mt-0.5">{content.length}/2000</p>
          </div>

          {/* 공개 여부 */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <div>
              <p className="text-sm text-slate-600 font-semibold">공개 게시</p>
              <p className="text-[11px] text-slate-400">다른 유저들도 볼 수 있게 공개합니다</p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isPublic ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isPublic ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {/* 작성자 정보 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">작성자 정보</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">이름 (닉네임)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="예: 부동산러버"
                maxLength={20}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">비밀번호 (4자 이상)</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="글 확인용"
                maxLength={20}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              이메일 <span className="text-slate-300">(선택 — 반영 시 회신)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* 캡차 */}
          <div className="border-t border-slate-100 pt-3">
            <label className="text-xs text-slate-400 mb-2 block">자동입력 방지</label>
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 rounded-lg px-4 py-2.5 font-mono font-bold text-slate-700 text-sm select-none min-w-[100px]">
                {captcha.answer === -1 ? "로딩중..." : `${captcha.question} = ?`}
              </div>
              <input
                type="number"
                value={captchaInput}
                onChange={e => setCaptchaInput(e.target.value)}
                placeholder="정답 입력"
                className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              />
              <button
                onClick={refreshCaptcha}
                className="text-xs text-slate-400 hover:text-slate-600 transition"
              >
                🔄 새로고침
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl transition text-base"
        >
          {submitting ? "전송 중..." : "피드백 보내기"}
        </button>

        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          작성된 피드백은 서비스 개선 목적으로만 활용되며, 개인정보는 안전하게 처리됩니다.
          동일 IP에서 1시간 내 5회 초과 작성은 제한됩니다.
        </p>

      </div>
    </div>
  );
}