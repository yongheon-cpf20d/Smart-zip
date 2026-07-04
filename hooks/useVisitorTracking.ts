// hooks/useVisitorTracking.ts
// 페이지 방문 시 기록 + 3분마다 heartbeat로 실시간 접속자 갱신
"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getVisitorId(): string {
  const KEY = "ddokzip_visitor_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function useVisitorTracking(path: string) {
  useEffect(() => {
    const visitorId = getVisitorId();

    // 방문 기록 추가 (오늘/전체 방문자 집계용)
    supabase.from("page_views").insert({ visitor_id: visitorId, path }).then();

    // 접속중 세션 upsert (실시간 접속자 집계용, 즉시 1회 + 이후 3분마다 heartbeat)
    const heartbeat = () => {
      supabase.from("active_sessions").upsert({
        visitor_id: visitorId,
        last_seen: new Date().toISOString(),
      }).then();
    };
    heartbeat();
    const interval = setInterval(heartbeat, 3 * 60 * 1000); // 3분마다

    return () => clearInterval(interval);
  }, [path]);
}