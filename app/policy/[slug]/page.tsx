import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 1800;

type Policy = {
  id: number;
  slug: string;
  title: string;
  content: string;
  source_url: string | null;
  tag: string;
  created_at: string;
};

const TAG_STYLE: Record<string, { bg: string; text: string }> = {
  "국토부": { bg: "bg-blue-100", text: "text-blue-700" },
  "금융위": { bg: "bg-purple-100", text: "text-purple-700" },
  "기타": { bg: "bg-slate-100", text: "text-slate-600" },
};

async function getPolicy(slug: string): Promise<Policy | null> {
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = await getPolicy(slug);
  return { title: policy ? `${policy.title} | 똑집 DDokzip` : "정책발표 | 똑집 DDokzip" };
}

export default async function PolicyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = await getPolicy(slug);

  if (!policy) notFound();

  const style = TAG_STYLE[policy.tag] ?? TAG_STYLE["기타"];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        <Link href="/policy" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 정책발표 목록
        </Link>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
              {policy.tag}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(policy.created_at).toLocaleDateString("ko-KR")}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-800 leading-snug">{policy.title}</h1>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {policy.content}
          </p>
        </div>

        {policy.source_url && (
          <a
            href={policy.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition text-sm"
          >
            📄 원문 보기 →
          </a>
        )}

        <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
          본 내용은 원문을 요약한 것으로, 정확한 내용은 원문을 확인해주세요.
        </p>
      </div>
    </div>
  );
}