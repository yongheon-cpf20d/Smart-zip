// components/VisitorStats.tsx
// 메인페이지 상단에 작게 표시하는 방문자 통계 (오늘/전체/실시간)
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Users, Eye, Radio } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Stats = { today: number; total: number; active: number };

export default function VisitorStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = () => {
      supabase.rpc("get_visitor_stats").then(({ data, error }) => {
        if (!error && data && data[0]) {
          setStats({
            today: data[0].today_visitors ?? 0,
            total: data[0].total_visitors ?? 0,
            active: data[0].active_now ?? 0,
          });
        }
      });
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60 * 1000); // 1분마다 갱신
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-3 text-[11px] text-slate-400">
      <span className="flex items-center gap-1">
        <Radio size={11} strokeWidth={2} className="text-emerald-400" />
        <span className="font-semibold text-emerald-500">{stats.active}</span>명 접속중
      </span>
      <span className="text-slate-200">·</span>
      <span className="flex items-center gap-1">
        <Eye size={11} strokeWidth={1.75} />
        오늘 <span className="font-semibold text-slate-500">{stats.today.toLocaleString()}</span>
      </span>
      <span className="text-slate-200">·</span>
      <span className="flex items-center gap-1">
        <Users size={11} strokeWidth={1.75} />
        전체 <span className="font-semibold text-slate-500">{stats.total.toLocaleString()}</span>
      </span>
    </div>
  );
}