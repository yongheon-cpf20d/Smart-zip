"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type RollingItem = {
  text: string;
  sub?: string;
  highlight?: string;
  href?: string;
};

type Props = {
  items: RollingItem[];
  badge: string;
  badgeStyle: string;
  containerStyle: string;
  displayMs?: number;
  transitionMs?: number;
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
  const router = useRouter();

  useEffect(() => {
    if (items.length <= 1) return;
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        setIsSliding(true);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % items.length);
          setIsSliding(false);
          schedule();
        }, transitionMs);
      }, displayMs);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [items, displayMs, transitionMs]);

  if (items.length === 0) return null;

  const item = items[currentIndex];

  const handleClick = () => {
    if (!item.href) return;
    if (item.href.startsWith("http")) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(item.href);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 ${containerStyle} ${item.href ? "cursor-pointer hover:opacity-90 transition" : ""}`}
      style={{ height: "56px", overflow: "hidden" }}
      onClick={handleClick}
    >
      <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap ${badgeStyle}`}>
        {badge}
      </span>

      <div className="flex-1 overflow-hidden" style={{ height: "56px" }}>
        <div style={{
          transform: isSliding ? "translateY(-100%)" : "translateY(0)",
          transition: isSliding ? `transform ${transitionMs}ms ease-in-out` : "none",
          height: "56px",
          display: "flex",
          alignItems: "center",
        }}>
          <div className="flex items-center gap-2 w-full min-w-0">
            <span className={`text-sm font-medium truncate flex-1 ${item.href ? "hover:underline" : ""}`}>
              {item.text}
            </span>
            {item.sub && <span className="text-sm font-bold shrink-0 text-red-600">{item.sub}</span>}
            {item.highlight && <span className="text-xs shrink-0 text-red-500">{item.highlight}</span>}
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <div className="shrink-0 flex gap-1">
          {items.map((_: RollingItem, i: number) => (
            <span key={i} className={`rounded-full transition-all duration-300 ${
              i === currentIndex ? "w-3 h-1.5 bg-current opacity-50" : "w-1.5 h-1.5 bg-current opacity-20"
            }`} />
          ))}
        </div>
      )}
    </div>
  );
}