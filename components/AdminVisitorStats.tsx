// components/AdminVisitorStats.tsx
// ✅ 관리자 대시보드 전용 방문자 통계 카드
// 메인페이지에서는 트래픽 노출을 원치 않아 제거하고, 관리자만 볼 수 있도록 이곳으로 이동
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Radio, Eye, Users } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Stats = { today: number; total: number; active: number };

export default function AdminVisitorStats() {
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

  if (!stats) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white border border-slate-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "실시간 접속중", value: stats.active, icon: Radio, color: "#10b981", suffix: "명" },
    { label: "오늘 방문자", value: stats.today, icon: Eye, color: "#3b82f6", suffix: "명" },
    { label: "전체 방문자", value: stats.total, icon: Users, color: "#64748b", suffix: "명" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon size={13} strokeWidth={1.75} style={{ color: c.color }} />
              <span className="text-[11px] text-slate-400 font-medium">{c.label}</span>
            </div>
            <p className="text-2xl font-black text-slate-800">
              {c.value.toLocaleString()}<span className="text-xs font-semibold text-slate-400 ml-0.5">{c.suffix}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}