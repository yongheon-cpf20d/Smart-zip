"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

// ✅ 규제 데이터 — 여기만 수정하면 지도에 바로 반영돼!
const REGULATION_DATA: Record<string, { type: string; color: string; label: string }> = {
  // 투기과열지구 (빨강)
  "서울특별시": { type: "투기과열지구", color: "#ef4444", label: "투기과열" },
  "강남구":     { type: "투기과열지구", color: "#ef4444", label: "투기과열" },
  "서초구":     { type: "투기과열지구", color: "#ef4444", label: "투기과열" },
  "송파구":     { type: "투기과열지구", color: "#ef4444", label: "투기과열" },
  "용산구":     { type: "투기과열지구", color: "#ef4444", label: "투기과열" },

  // 조정대상지역 (주황)
  "경기도":     { type: "조정대상지역", color: "#f97316", label: "조정대상" },
  "인천광역시": { type: "조정대상지역", color: "#f97316", label: "조정대상" },
  "성동구":     { type: "조정대상지역", color: "#f97316", label: "조정대상" },
  "마포구":     { type: "조정대상지역", color: "#f97316", label: "조정대상" },
  "영등포구":   { type: "조정대상지역", color: "#f97316", label: "조정대상" },
  "광진구":     { type: "조정대상지역", color: "#f97316", label: "조정대상" },

  // 일반지역 (회색) — 나머지는 자동으로 회색
};

const DEFAULT_COLOR = "#cbd5e1"; // 규제 없음 (슬레이트)

const PROVINCE_GEO = "/korea-provinces.json";
const SEOUL_GEO    = "/seoul-districts.json";

type TooltipInfo = {
  name: string;
  x: number;
  y: number;
} | null;

export default function RegulationMap() {
  const [view, setView]       = useState<"provinces" | "seoul">("provinces");
  const [tooltip, setTooltip] = useState<TooltipInfo>(null);

  const getRegulation = (name: string) =>
    REGULATION_DATA[name] ?? { type: "규제 없음", color: DEFAULT_COLOR, label: "일반" };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#f8fafc" }}>

      {/* 뒤로가기 버튼 (서울 확대 시) */}
      {view === "seoul" && (
        <button
          onClick={() => setView("provinces")}
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            color: "#334155",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          ← 전국 보기
        </button>
      )}

      {/* 범례 */}
      <div style={{
        position: "absolute",
        bottom: 12,
        right: 12,
        zIndex: 10,
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 11,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }}>
        {[
          { color: "#ef4444", label: "투기과열지구" },
          { color: "#f97316", label: "조정대상지역" },
          { color: "#cbd5e1", label: "일반지역" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: item.color, display: "inline-block" }} />
            <span style={{ color: "#475569" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* 툴팁 */}
      {tooltip && (
        <div style={{
          position: "absolute",
          left: tooltip.x + 12,
          top: tooltip.y - 36,
          zIndex: 20,
          background: "#1e293b",
          color: "white",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 12,
          fontWeight: 500,
          pointerEvents: "none",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}>
          {tooltip.name} · {getRegulation(tooltip.name).type}
        </div>
      )}

      {/* 전국 지도 */}
      {view === "provinces" && (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [127.5, 36], scale: 4500 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup>
            <Geographies geography={PROVINCE_GEO}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name = geo.properties.name_kor ?? geo.properties.NAME_KOR ?? geo.properties.name ?? "";
                  const reg  = getRegulation(name);
                  const isClickable = name === "서울특별시";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => isClickable && setView("seoul")}
                      onMouseEnter={(e) => {
                        setTooltip({ name, x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setTooltip({ name, x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: reg.color,
                          stroke: "#ffffff",
                          strokeWidth: 0.8,
                          outline: "none",
                          transition: "all 0.15s ease",
                        },
                        hover: {
                          fill: reg.color,
                          stroke: "#ffffff",
                          strokeWidth: 1.5,
                          outline: "none",
                          filter: "brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.2))",
                          transform: "scale(1.03)",
                          cursor: isClickable ? "pointer" : "default",
                        },
                        pressed: {
                          fill: reg.color,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      )}

      {/* 서울 구 지도 */}
      {view === "seoul" && (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [126.986, 37.565], scale: 90000 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup>
            <Geographies geography={SEOUL_GEO}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name = geo.properties.name_kor ?? geo.properties.NAME_KOR ?? geo.properties.name ?? "";
                  const reg  = getRegulation(name);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(e) => {
                        setTooltip({ name, x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setTooltip({ name, x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: reg.color,
                          stroke: "#ffffff",
                          strokeWidth: 0.5,
                          outline: "none",
                          transition: "all 0.15s ease",
                        },
                        hover: {
                          fill: reg.color,
                          stroke: "#ffffff",
                          strokeWidth: 1,
                          outline: "none",
                          filter: "brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.2))",
                          transform: "scale(1.02)",
                          cursor: "default",
                        },
                        pressed: {
                          fill: reg.color,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      )}
    </div>
  );
}