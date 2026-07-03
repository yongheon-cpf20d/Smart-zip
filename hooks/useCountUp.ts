// hooks/useCountUp.ts
// 숫자가 0에서 목표값까지 부드럽게 올라가는 애니메이션 훅
// 계산 결과 숫자에 사용: const displayValue = useCountUp(result.total);

"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // target이 0이거나 유효하지 않으면 즉시 반영
    if (!target || isNaN(target)) {
      setValue(0);
      return;
    }

    startTimeRef.current = null;
    startValueRef.current = value; // 이전 값에서 시작 (재계산 시 자연스러움)

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutCubic — 처음엔 빠르게, 끝엔 부드럽게
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValueRef.current + (target - startValueRef.current) * eased;

      setValue(Math.round(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target); // 마지막에 정확한 값으로 고정
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}