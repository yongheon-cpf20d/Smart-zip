"use client";

import { useState, useEffect, useRef } from "react";

type RollingItem = {
  text: string;
  sub?: string;   // 신고가: 가격, 뉴스: 언론사
  highlight?: string; // 신고가: 상승액
  href?: string;
};

type Props = {
  items: RollingItem[];
  badge: string;
  badgeStyle: string; // tailwind 클래스
  containerStyle: string;
  displayMs?: number;   // 한 항목 표시 시간 (기본 3000ms)
  transitionMs?: number; // 전환 애니메이션 시간 (기본 400ms)
};

export default function RollingWidget({
  items,
  badge,
  badgeStyle,
  containerStyle,
  displayMs = 3000,
  transitionMs = 400,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (items.length <= 1) return;

    const schedule = () => {
      timerRef.current = setTimeout(() => {
        // 슬라이드 업 시작
        setIsSliding(true);
        setTimeout(() => {
          // 다음 항목으로 교체 후 슬라이드 리셋
          setCurrentIndex((prev) => (prev + 1) % items.length);
          setIsSliding(false);
          schedule(); // 다음 사이클 예약
        }, transitionMs);
      }, displayMs);
    };

    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [items, displayMs, transitionMs]);

  if (items.length === 0) return null;

  const item = items[currentIndex];

  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 ${containerStyle}`}
      style={{ height: "56px", overflow: "hidden" }}>
      {/* 뱃지 */}
      <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap ${badgeStyle}`}>
        {badge}
      </span>

      {/* 롤링 텍스트 */}
      <div className="flex-1 overflow-hidden" style={{ height: "56px" }}>
        <div
          style={{
            transform: isSliding ? "translateY(-100%)" : "translateY(0)",
            transition: isSliding ? `transform ${transitionMs}ms ease-in-out` : "none",
            height: "56px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div className="flex items-center gap-2 w-full min-w-0">
            <span className="text-sm font-medium truncate flex-1">{item.text}</span>
            {item.sub && (
              <span className="text-sm font-bold shrink-0 text-red-600">{item.sub}</span>
            )}
            {item.highlight && (
              <span className="text-xs shrink-0 text-red-500">{item.highlight}</span>
            )}
          </div>
        </div>
      </div>

      {/* 인디케이터 점 */}
      {items.length > 1 && (
        <div className="shrink-0 flex gap-1">
          {items.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-3 h-1.5 bg-current opacity-50" : "w-1.5 h-1.5 bg-current opacity-20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}