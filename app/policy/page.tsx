import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Megaphone } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const metadata = {
  title: "정책발표 | 똑집 DDokzip",
};

export const revalidate = 1800; // 30분 캐싱

type Policy = {
  id: number;
  slug: string;
  title: string;
  content: string;
  source_url: string | null;
  tag: string;
  created_at: string;
  display_date: string;
};

const TAG_STYLE: Record<string, { bg: string; text: string }> = {
  "국토부": { bg: "bg-emerald-100", text: "text-emerald-700" },
  "금융위": { bg: "bg-slate-200", text: "text-slate-700" },
  "기타": { bg: "bg-slate-100", text: "text-slate-600" },
};

async function getPolicies(): Promise<Policy[]> {
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .order("display_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export default async function PolicyPage() {
  const policies = await getPolicies();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Megaphone size={20} strokeWidth={1.75} className="text-emerald-600" />
          정책발표
        </h1>
          <p className="text-xs text-slate-400 mt-1">국토교통부·금융위원회 공식 발표 요약</p>
        </div>

        {policies.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
            등록된 정책발표가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {policies.map((p) => {
              const style = TAG_STYLE[p.tag] ?? TAG_STYLE["기타"];
              return (
                <Link
                  key={p.id}
                  href={`/policy/${p.slug}`}
                  className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                      {p.tag}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(p.display_date).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 mb-1.5">{p.title}</h2>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {p.content}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}