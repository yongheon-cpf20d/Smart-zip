# 똑집 Design System — CLAUDE.md

> 이 문서는 똑집(DDokzip) 프로젝트의 디자인 시스템 지침입니다.
> 새 페이지나 컴포넌트를 만들 때 반드시 이 문서를 먼저 확인하세요.

---

## 1. 기술 스택

- **Framework**: Next.js App Router (TypeScript)
- **Styling**: Tailwind CSS v4
- **Icons**: lucide-react (line 아이콘, strokeWidth 1.75 고정)
- **Charts**: Recharts
- **Font**: Geist Sans (본문), 그린체리1스푼 (브랜드 강조)

---

## 2. 컬러 시스템

### Primary — Emerald
| 용도 | 클래스 |
|------|--------|
| CTA 버튼, 주요 강조 | `bg-emerald-500` / `hover:bg-emerald-600` |
| 결과 카드 배경 | `bg-emerald-50 dark:bg-emerald-950/40` |
| 결과 카드 테두리 | `border-emerald-200 dark:border-emerald-800` |
| 결과 텍스트 | `text-emerald-700 dark:text-emerald-300` |
| 아이콘 | `text-emerald-600` |
| 활성 버튼 탭 | `bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300` |

### Neutral — Slate
| 용도 | 클래스 |
|------|--------|
| 페이지 배경 | `bg-slate-50 dark:bg-slate-900` |
| 카드 배경 | `bg-white dark:bg-slate-800` |
| 카드 테두리 | `border-slate-200 dark:border-slate-700` |
| 제목 | `text-slate-800 dark:text-slate-200` |
| 부제 라벨 | `text-slate-600 dark:text-slate-400` |
| 설명 텍스트 | `text-slate-500 dark:text-slate-400` |
| 비활성 버튼 | `bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300` |

### Accent
| 색상 | 용도 |
|------|------|
| Rose (`text-rose-500`) | 경고 링크, 주의 강조 |
| Amber (`text-amber-600`) | 주의사항, 스트레스 DSR 정보 |
| Blue (`text-blue-700`) | 대출 관련 수치 |
| Purple (`text-purple-500`) | 세대수 등 보조 지표 |

---

## 3. 레이아웃 & 컨테이너

```tsx
// 페이지 기본 구조
<div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
  <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
    {/* 상단 내비: ← 메인으로 + ThemeToggle */}
    <div className="flex items-center justify-between">
      <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition link-press">
        ← 메인으로
      </Link>
      <ThemeToggle />
    </div>
    {/* 페이지 제목 */}
    <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200">
      <Icon size={20} strokeWidth={1.75} className="text-emerald-600" />
      페이지 제목
    </h1>
    {/* 카드들 */}
  </div>
</div>
```

---

## 4. 카드 컴포넌트

```tsx
// 기본 카드
<div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">

// 결과 강조 카드 (emerald)
<div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">

// 경고/주의 카드 (amber)
<div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5">

// 정보 배너 (slate)
<div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3">
```

---

## 5. 버튼

```tsx
// Primary CTA
<button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition btn-press">

// 탭/토글 버튼 (활성)
className="bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300"

// 탭/토글 버튼 (비활성)
className="bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"

// 텍스트 링크 버튼 (페이지 연결)
className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 dark:text-rose-400 hover:text-rose-600 transition animate-pulse"
```

---

## 6. 입력 필드

```tsx
// 기본 input
<input
  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
/>

// 라벨
<label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">

// 숨쉬기 강조 (자동입력 안내 등)
style={{ animation: "inputBreath 1.4s ease-in-out infinite", borderColor: "#10b981" }}
```

---

## 7. 애니메이션 규칙

```css
/* 숨쉬기 효과 — 입력 유도 */
@keyframes inputBreath {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }
  50% { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
}

/* 결과 등장 */
.result-enter {
  animation: fadeSlideUp 0.3s ease;
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 말풍선 팝업 */
@keyframes bubble-pop {
  0%   { opacity: 0; transform: translateX(-50%) scale(0.8) translateY(4px); }
  15%  { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
  70%  { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) scale(0.9) translateY(-3px); }
}
```

- `btn-press`: 버튼 클릭 시 미세 scale down (globals.css 등록됨)
- `link-press`: 링크 클릭 피드백 (globals.css 등록됨)
- `hover-lift`: hover 시 미세 상승 (globals.css 등록됨)
- `animate-pulse`: 주의 유도 링크/배지

---

## 8. 토글 스위치 (커스텀)

```tsx
<button
  onClick={() => setState(v => !v)}
  style={{
    position: "relative", width: 44, height: 24, borderRadius: 999,
    background: state ? "#10b981" : "#cbd5e1", border: "none", cursor: "pointer",
    transition: "background 0.2s", flexShrink: 0,
  }}
>
  <span style={{
    position: "absolute", top: 2, left: state ? 22 : 2,
    width: 20, height: 20, borderRadius: "50%", background: "white",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
  }} />
</button>
```

---

## 9. 페이지 간 연결 (URL 파라미터)

계산기 간 데이터 전달은 URL 쿼리 파라미터로 처리합니다.

```
총비용 → 주담대: /loan?amount={loanLimit만원}
주담대 → DSR: /dsr?newAmount={만원}&newYears={년}&newRate={%}
```

- 자동입력된 필드: 초록 테두리 + "✓ 자동입력" 배지
- 사용자가 채워야 할 필드: 숨쉬기 애니메이션
- 상단에 "XX 계산기에서 자동 입력됐어요!" 배너 표시

---

## 10. 새 메인 페이지 — 역방향 구매력 계산기 (2025 추가)

### 개요
기존 계산기들의 반대 방향: "내가 가진 돈/소득으로 얼마짜리 집을 살 수 있나?"

### UX 방식 — 토스형 스텝 위저드
- 질문 하나씩 페이드 인/아웃
- 이전 답변은 상단에 요약 표시
- 로딩 → 결과 순서

### 질문 흐름
1. 집 매수 계획 여부 (예/아니오)
2. 가용 현금 (만원 입력)
3. 세전 연소득 / 원천징수 기준 (만원 입력)
4. 만 나이 (입력)
5. 주택 소유 이력 (예/아니오) → 생애최초 여부
6. 지역 — 수도권/규제지역 여부 (선택)
7. 계산 중... 로딩 애니메이션
8. 결과: "약 XX억원대 주택을 구매하실 수 있습니다"
9. "세부 내역이 궁금하신가요?" → 기존 총비용 계산기로 연결

### 핵심 계산 로직
```
LTV 한도 = 주택가 × LTV비율
DSR 한도 = (연소득 × DSR상한) / 12 → 역산한 대출원금
실질 대출 한도 = min(LTV한도, DSR한도)
최대 주택가 = (현금 - 부대비용) / (1 - LTV비율)
부대비용 = 취득세 + 복비 + 법무사비 (주택가 기준 역산)
장래소득 반영 (만 39세 이하)
```

### 스타일 가이드
- 배경: `bg-slate-50 dark:bg-slate-900` (메인과 동일)
- 스텝 카드: 중앙 정렬, `max-w-md mx-auto`, 넉넉한 패딩
- 진행 표시: 상단 얇은 emerald 프로그레스 바
- 예/아니오 버튼: 크고 선명하게, 선택 시 emerald 활성
- 결과 숫자: 크고 굵게 (`text-4xl font-black text-emerald-700`)

---

## 11. 아이콘 사용 규칙

```tsx
import { Calculator, Landmark, BarChart3, ... } from "lucide-react";

// 페이지 제목 아이콘
<Icon size={20} strokeWidth={1.75} className="text-emerald-600" />

// 카드 내 아이콘
<Icon size={16} strokeWidth={1.75} className="text-slate-400" />

// 네비게이션 아이콘
<Icon size={18} strokeWidth={1.75} />
```

---

## 12. 하지 말아야 할 것

- ❌ 기존 카드 스타일 임의 변경 (border-radius, padding 등)
- ❌ `rounded-lg` → 카드는 반드시 `rounded-2xl`, 작은 요소는 `rounded-xl`
- ❌ 다크모드 클래스 누락 — 모든 색상 클래스에 `dark:` 쌍 필수
- ❌ lucide-react 외 아이콘 라이브러리 추가
- ❌ 이모지를 아이콘 대신 사용
- ❌ 인라인 스타일로 색상 지정 (애니메이션 제외)
- ❌ `justify` 텍스트 정렬 — 한국어에 어울리지 않음
