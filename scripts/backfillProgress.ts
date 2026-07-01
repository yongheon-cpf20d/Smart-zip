// ✅ 백필 진행 상태를 파일에 저장해서, 스크립트를 다시 실행하면 이어서 진행되도록 함
// 진행 상태 파일: scripts/.backfill-progress.json (git에는 커밋하지 않음 - .gitignore 추가 권장)

import fs from "fs";
import path from "path";

const PROGRESS_FILE = path.join(process.cwd(), "scripts", ".backfill-progress.json");

export type BackfillProgress = {
  // 완료된 "지역코드_계약년월" 조합 목록 (예: "11680_202101")
  completedTasks: string[];
  // 마지막 실행 시각
  lastRunAt: string;
  // 누적 통계
  totalFetched: number;
  totalErrors: number;
};

export function loadProgress(): BackfillProgress {
  if (!fs.existsSync(PROGRESS_FILE)) {
    return { completedTasks: [], lastRunAt: "", totalFetched: 0, totalErrors: 0 };
  }
  const raw = fs.readFileSync(PROGRESS_FILE, "utf-8");
  return JSON.parse(raw);
}

export function saveProgress(progress: BackfillProgress) {
  const dir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf-8");
}

export function makeTaskKey(regionCode: string, dealYearMonth: string): string {
  return `${regionCode}_${dealYearMonth}`;
}

export function isTaskCompleted(progress: BackfillProgress, taskKey: string): boolean {
  return progress.completedTasks.includes(taskKey);
}

export function markTaskCompleted(progress: BackfillProgress, taskKey: string) {
  if (!progress.completedTasks.includes(taskKey)) {
    progress.completedTasks.push(taskKey);
  }
}