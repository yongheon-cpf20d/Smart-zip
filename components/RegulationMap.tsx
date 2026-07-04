// @ts-nocheck
"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { getRegulationByName, REGULATION_STYLE } from "../lib/regulationData";

type ViewType = "provinces" | "seoul" | "gyeonggi";

const TOHEO_COLOR = "#7c3aed"; // 토지거래허가구역 테두리 색 (보라)

export default function RegulationMap() {
  const [view, setView] = useState<ViewType>("provinces");
  const [tooltip, setTooltip] = useState<{ name: string; type: string; hasToheo: boolean; x: number; y: number } | null>(null);

  const handleMouseEnter = (name: string, e: React.MouseEvent) => {
    const reg = getRegulationByName(name);
    setTooltip({ name, type: reg.type, hasToheo: reg.hasToheo, x: e.clientX, y: e.clientY });
  };
  const handleMouseMove = (name: string, e: React.MouseEvent) => {
    const reg = getRegulationByName(name);
    setTooltip({ name, type: reg.type, hasToheo: reg.hasToheo, x: e.clientX, y: e.clientY });
  };

  // Geography 스타일 생성 함수
  const makeStyle = (name: string, strokeBase = "#ffffff", strokeBaseWidth = 0.5, isClickable = false) => {
    const reg = getRegulationByName(name);
    const stroke = reg.hasToheo ? TOHEO_COLOR : strokeBase;
    const strokeWidth = reg.hasToheo ? 2.5 : strokeBaseWidth;
    return {
      default: {
        fill: reg.color,
        stroke,
        strokeWidth,
        outline: "none",
        transition: "all 0.25s ease",
      },
      hover: {
        fill: reg.color,
        stroke,
        strokeWidth: reg.hasToheo ? 3 : strokeBaseWidth * 2.5,
        outline: "none",
        filter: "brightness(1.08) drop-shadow(0 4px 12px rgba(15,23,42,0.18))",
        cursor: isClickable ? "pointer" : "default",
      },
      pressed: { fill: reg.color, outline: "none" },
    };
  };

  // 규제지역 여부 판별 (pulse 애니메이션 클래스 부여용)
  const isRegulated = (name: string) => {
    const reg = getRegulationByName(name);
    return reg.type !== "규제없음";
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#fafbfc" }}>

      {/* 규제지역 은은한 펄스 애니메이션 정의 */}
      <style jsx global>{`
        @keyframes regPulse {
          0%, 100% { filter: brightness(1) saturate(1); }
          50% { filter: brightness(1.08) saturate(1.15); }
        }
        .reg-pulse path {
          animation: regPulse 3.2s ease-in-out infinite;
        }
      `}</style>

      {/* 뒤로가기 버튼 */}
      {view !== "provinces" && (
        <button
          onClick={() => setView("provinces")}
          style={{
            position: "absolute", top: 12, left: 12, zIndex: 10,
            background: "white", border: "1px solid #e2e8f0",
            borderRadius: 8, padding: "6px 12px", fontSize: 12,
            fontWeight: 600, cursor: "pointer", color: "#334155",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            transition: "transform 0.15s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ← 전국 보기
        </button>
      )}

      {/* 현재 뷰 표시 */}
      {view !== "provinces" && (
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          zIndex: 10, background: "white", border: "1px solid #e2e8f0",
          borderRadius: 8, padding: "6px 14px", fontSize: 12,
          fontWeight: 700, color: "#334155",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          {view === "seoul" ? "서울특별시" : "경기도"}
        </div>
      )}

      {/* 범례 */}
      <div style={{
        position: "absolute", bottom: 14, right: 14, zIndex: 10,
        background: "rgba(255,255,255,0.96)", border: "1px solid #eef1f5",
        borderRadius: 12, padding: "12px 16px", fontSize: 11,
        boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
        backdropFilter: "blur(4px)",
      }}>
        {[
          { color: "#ef4444", label: "투기과열지구", border: null },
          { color: "#f97316", label: "조정대상지역", border: null },
          { color: "transparent", label: "토지거래허가구역", border: TOHEO_COLOR },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 3,
              background: item.color === "transparent" ? "#f3f0ff" : item.color,
              display: "inline-block",
              border: item.border ? `2px solid ${item.border}` : "none",
              flexShrink: 0,
            }} />
            <span style={{ color: "#64748b", fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
        {view === "provinces" && (
          <p style={{ color: "#b0b8c4", fontSize: 10, marginTop: 7, marginBottom: 0, borderTop: "1px solid #f1f4f8", paddingTop: 6 }}>
            서울·경기 클릭 시 시군구 확대
          </p>
        )}
      </div>

      {/* 툴팁 */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 12,
          top: tooltip.y - 40,
          zIndex: 9999,
          background: "#1e293b", color: "white",
          borderRadius: 8, padding: "6px 10px",
          fontSize: 12, fontWeight: 500,
          pointerEvents: "none", whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        }}>
          {tooltip.name} · {tooltip.type}
          {tooltip.hasToheo && " · 토지거래허가구역"}
        </div>
      )}

      {/* ① 전국 시도 지도 */}
      {view === "provinces" && (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [127.5, 36], scale: 4500 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography="/korea-provinces.json">
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = geo.properties.name ?? "";
                const isClickable = name === "서울특별시" || name === "경기도";
                const regulated = isRegulated(name);
                return (
                  <g key={geo.rsmKey} className={regulated ? "reg-pulse" : undefined}>
                    <Geography
                      geography={geo}
                      onClick={() => {
                        if (name === "서울특별시") setView("seoul");
                        if (name === "경기도") setView("gyeonggi");
                      }}
                      onMouseEnter={(e) => handleMouseEnter(name, e)}
                      onMouseMove={(e) => handleMouseMove(name, e)}
                      onMouseLeave={() => setTooltip(null)}
                      style={makeStyle(name, "#ffffff", 0.8, isClickable)}
                    />
                  </g>
                );
              })
            }
          </Geographies>
        </ComposableMap>
      )}

      {/* ② 서울 구별 지도 */}
      {view === "seoul" && (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [126.986, 37.565], scale: 90000 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography="/seoul-districts.json">
            {({ geographies }) =>
              geographies.map((geo) => {
                const name =
                  geo.properties.name_kor ??
                  geo.properties.NAME_KOR ??
                  geo.properties.name ??
                  "";
                const regulated = isRegulated(name);
                return (
                  <g key={geo.rsmKey} className={regulated ? "reg-pulse" : undefined}>
                    <Geography
                      geography={geo}
                      onMouseEnter={(e) => handleMouseEnter(name, e)}
                      onMouseMove={(e) => handleMouseMove(name, e)}
                      onMouseLeave={() => setTooltip(null)}
                      style={makeStyle(name, "#ffffff", 0.5)}
                    />
                  </g>
                );
              })
            }
          </Geographies>
        </ComposableMap>
      )}

      {/* ③ 경기도 시군구 지도 */}
      {view === "gyeonggi" && (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [127.3, 37.55], scale: 27000 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography="/gyeonggi-sgg.geojson">
            {({ geographies }) =>
              geographies
                .filter((geo) => {
                  const code = geo.properties.code ?? "";
                  return String(code).startsWith("31");
                })
                .map((geo) => {
                  const rawName = geo.properties.name ?? "";
                  const regulated = isRegulated(rawName);
                  return (
                    <g key={geo.rsmKey} className={regulated ? "reg-pulse" : undefined}>
                      <Geography
                        geography={geo}
                        onMouseEnter={(e) => handleMouseEnter(rawName, e)}
                        onMouseMove={(e) => handleMouseMove(rawName, e)}
                        onMouseLeave={() => setTooltip(null)}
                        style={makeStyle(rawName, "#ffffff", 0.5)}
                      />
                    </g>
                  );
                })
            }
          </Geographies>
        </ComposableMap>
      )}
    </div>
  );
}