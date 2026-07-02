// components/PriceInput.tsx
// 만원 단위 숫자 입력 + 실시간 억/만원 변환 표시 공통 컴포넌트

"use client";

// ── 만원 → 억/만원 변환 함수 (export해서 페이지에서도 쓸 수 있음) ──
export function formatManwon(manwon: number | string): string {
  const n = Number(manwon);
  if (!n || isNaN(n)) return "";
  const uk = Math.floor(n / 10000);
  const man = Math.round(n % 10000);
  if (uk > 0 && man > 0) return `${uk.toLocaleString()}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk.toLocaleString()}억원`;
  return `${man.toLocaleString()}만원`;
}

// ── 원 단위 → 억/만원 변환 (계산 결과 표시용) ──
export function formatWon(won: number): string {
  const abs = Math.abs(Math.round(won));
  const uk = Math.floor(abs / 100_000_000);
  const man = Math.round((abs % 100_000_000) / 10_000);
  let str = "";
  if (uk > 0 && man > 0) str = `${uk.toLocaleString()}억 ${man.toLocaleString()}만원`;
  else if (uk > 0) str = `${uk.toLocaleString()}억원`;
  else str = `${abs.toLocaleString()}원`;
  return won < 0 ? `-${str}` : str;
}

type PriceInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  quickValues?: { label: string; value: string }[];
};

export default function PriceInput({
  value,
  onChange,
  placeholder = "예: 70000",
  label,
  className = "",
  quickValues,
}: PriceInputProps) {
  const preview = formatManwon(value);

  return (
    <div className={className}>
      {label && (
        <label className="text-xs text-slate-400 mb-1 block">{label}</label>
      )}
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 pr-2"
        />
        {preview && (
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold px-1">
            = {preview}
          </div>
        )}
      </div>
      {quickValues && (
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {quickValues.map((q) => (
            <button
              key={q.value}
              type="button"
              onClick={() => onChange(q.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                value === q.value
                  ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}