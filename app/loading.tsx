// app/loading.tsx
// Next.js App Router - 페이지 이동 시 자동 표시되는 로딩 스켈레톤
// app 폴더 루트에 하나만 있으면 전체 페이지에 자동 적용

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4 animate-pulse">

        {/* 뒤로가기 */}
        <div className="h-4 w-16 bg-slate-200 rounded-full" />

        {/* 제목 */}
        <div className="space-y-2 pt-1">
          <div className="h-7 w-52 bg-slate-200 rounded-lg" />
          <div className="h-3 w-72 bg-slate-100 rounded-full" />
        </div>

        {/* 카드 1 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
          <div className="h-4 w-28 bg-slate-200 rounded-full" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 bg-slate-100 rounded-lg" />
            <div className="h-10 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-10 bg-slate-100 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
            <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
            <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
          </div>
        </div>

        {/* 카드 2 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
          <div className="h-4 w-36 bg-slate-200 rounded-full" />
          <div className="h-10 bg-slate-100 rounded-lg" />
          <div className="h-10 bg-slate-100 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
            <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
          </div>
        </div>

        {/* 버튼 */}
        <div className="h-12 bg-emerald-100 rounded-xl" />

      </div>
    </div>
  );
}