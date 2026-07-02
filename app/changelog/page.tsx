import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ChangelogItem = {
  id: number;
  date: string;
  category: "fix" | "feature" | "improvement";
  title: string;
  description: string | null;
  is_feedback_based: boolean;
};

const CATEGORY_STYLE = {
  fix: { label: "버그수정", bg: "bg-red-100", text: "text-red-700" },
  feature: { label: "신기능", bg: "bg-emerald-100", text: "text-emerald-700" },
  improvement: { label: "개선", bg: "bg-blue-100", text: "text-blue-700" },
};

async function getChangelogs(): Promise<ChangelogItem[]> {
  const { data, error } = await supabase
    .from("changelog")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export const revalidate = 3600; // 1시간 캐싱

export default async function ChangelogPage() {
  const items = await getChangelogs();

  // 날짜별 그룹핑
  const grouped: Record<string, ChangelogItem[]> = {};
  items.forEach(item => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  });

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">📋 업데이트 로그</h1>
            <p className="text-xs text-slate-400 mt-1">똑집의 변화를 기록합니다</p>
          </div>
          <Link
            href="/feedback"
            className="text-xs font-bold px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 transition"
          >
            💬 피드백 보내기
          </Link>
        </div>

        {/* 피드백 반영 건수 배너 */}
        {items.filter(i => i.is_feedback_based).length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">🙌</span>
            <p className="text-sm text-emerald-700">
              지금까지 <span className="font-black">{items.filter(i => i.is_feedback_based).length}개</span>의
              유저 피드백이 반영되었습니다. 소중한 의견 감사합니다!
            </p>
          </div>
        )}

        {/* 로그 목록 */}
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
            아직 업데이트 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, logs]) => (
              <div key={date} className="space-y-2">
                {/* 날짜 헤더 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-700">{date}</span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>

                {/* 해당 날짜 항목들 */}
                <div className="space-y-2">
                  {logs.map(item => {
                    const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.improvement;
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                          {item.is_feedback_based && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              💬 피드백 반영
                            </span>
                          )}
                          <p className="text-sm font-bold text-slate-800">{item.title}</p>
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-100">
          개선 아이디어나 오류를 발견하셨나요?
          <Link href="/feedback" className="text-emerald-600 font-semibold ml-1 hover:underline">
            피드백 보내기 →
          </Link>
        </p>

      </div>
    </div>
  );
}