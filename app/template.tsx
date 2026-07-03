// app/template.tsx
// Next.js App Router 전용 파일 — 페이지 이동마다 새로 마운트되어 전환 애니메이션 트리거
// layout.tsx와 달리 페이지가 바뀔 때마다 리렌더링됨

"use client";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-transition">
      {children}
    </div>
  );
}