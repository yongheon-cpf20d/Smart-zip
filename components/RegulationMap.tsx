// @ts-nocheck
"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { getRegulationByName } from "../lib/regulationData";

// ✅ 3단계 뷰 구조:
//   metro(기본) — 서울시(통합) + 경기 시군구별
//   seoul       — metro에서 서울 클릭 시, 서울 구별 상세
//   nationwide  — "전국 보기" 버튼 클릭 시, 전국 시도
type ViewType = "metro" | "seoul" | "nationwide";

const TOHEO_COLOR = "#dc2626"; // 토지거래허가구역 테두리 색 (진한 빨강)

export default function RegulationMap() {
  const [view, setView] = useState<ViewType>("metro");
  const [tooltip, setTooltip] = useState<{ name: string; type: string; hasToheo: boolean; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);

  const handleMouseEnter = (name: string, e: React.MouseEvent) => {
    const reg = getRegulationByName(name);
    setTooltip({ name, type: reg.type, hasToheo: reg.hasToheo, x: e.clientX, y: e.clientY });
  };
  const handleMouseMove = (name: string, e: React.MouseEvent) => {
    const reg = getRegulationByName(name);
    setTooltip({ name, type: reg.type, hasToheo: reg.hasToheo, x: e.clientX, y: e.clientY });
  };

  const makeStyle = (name: string, strokeBase = "#ffffff", strokeBaseWidth = 0.5, isClickable = false) => {
    const reg = getRegulationByName(name);
    const stroke = reg.hasToheo ? TOHEO_COLOR : strokeBase;
    const strokeWidth = reg.hasToheo ? 1.0 : strokeBaseWidth;
    return {
      default: {
        fill: reg.color,
        stroke,
        strokeWidth,
        outline: "none",
        transition: "all 0.15s ease",
      },
      hover: {
        // ✅ 호버 강조 강화: 진한 남색 테두리 + 확실한 그림자로 파스텔톤 배경에서도 잘 보이게
        fill: reg.color,
        stroke: "#1e293b",
        strokeWidth: 1.5,
        outline: "none",
        filter: "brightness(1.05) drop-shadow(0 6px 14px rgba(15,23,42,0.35))",
        cursor: isClickable ? "pointer" : "default",
      },
      pressed: { fill: reg.color, stroke: "#1e293b", strokeWidth: 1.0, outline: "none" },
    };
  };

  // 서울 전역은 투기과열지구 공통 지정이라, "서울시" 통합 뷰에서는 서울특별시 전체를 하나로 판정
  const isRegulated = (name: string) => {
    const reg = getRegulationByName(name);
    return reg.type !== "규제없음";
  };

  const switchView = (v: ViewType) => {
    setView(v);
    setZoom(1); // 뷰 전환 시 확대 상태 초기화
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#fafbfc" }}>

      <style jsx global>{`
        @keyframes regPulse {
          0%, 100% { filter: brightness(1) saturate(1); }
          50% { filter: brightness(1.08) saturate(1.15); }
        }
        .reg-pulse path {
          animation: regPulse 3.2s ease-in-out infinite;
        }
      `}</style>

      {/* 좌측 상단: 뒤로가기 / 전국 전환 버튼 */}
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, display: "flex", gap: 6 }}>
        {view === "seoul" && (
          <button
            onClick={() => switchView("metro")}
            style={{
              background: "white", border: "1px solid #e2e8f0",
              borderRadius: 8, padding: "6px 12px", fontSize: 12,
              fontWeight: 600, cursor: "pointer", color: "#334155",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            ← 수도권 보기
          </button>
        )}
        <button
          onClick={() => switchView(view === "nationwide" ? "metro" : "nationwide")}
          style={{
            background: "white", border: "1px solid #e2e8f0",
            borderRadius: 8, padding: "6px 12px", fontSize: 12,
            fontWeight: 600, cursor: "pointer", color: "#334155",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {view === "nationwide" ? "← 수도권 보기" : "전국 보기"}
        </button>
      </div>

      {/* 현재 뷰 표시 */}
      <div style={{
        position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
        zIndex: 10, background: "white", border: "1px solid #e2e8f0",
        borderRadius: 8, padding: "6px 14px", fontSize: 12,
        fontWeight: 700, color: "#334155",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        {view === "metro" ? "수도권 (서울·경기)" : view === "seoul" ? "서울특별시" : "전국"}
      </div>

      {/* 범례 */}
      <div style={{
        position: "absolute", bottom: 14, right: 14, zIndex: 10,
        background: "rgba(255,255,255,0.96)", border: "1px solid #eef1f5",
        borderRadius: 12, padding: "12px 16px", fontSize: 11,
        boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
        backdropFilter: "blur(4px)",
      }}>
        {[
          { color: "#fca5a5", label: "투기과열지구", border: null },
          { color: "#f97316", label: "조정대상지역", border: null },
          { color: "transparent", label: "토지거래허가구역", border: TOHEO_COLOR },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 3,
              background: item.color === "transparent" ? "#fef2f2" : item.color,
              display: "inline-block",
              border: item.border ? `2px solid ${item.border}` : "none",
              flexShrink: 0,
            }} />
            <span style={{ color: "#64748b", fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
        <p style={{ color: "#b0b8c4", fontSize: 10, marginTop: 7, marginBottom: 0, borderTop: "1px solid #f1f4f8", paddingTop: 6 }}>
          스크롤/핀치로 확대·축소 가능
        </p>
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
      {view === "nationwide" && (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [127.5, 36], scale: 5000 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={zoom} onMove={({ k }) => setZoom(k)} minZoom={1} maxZoom={8}>
            <Geographies geography="/korea-provinces.json">
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name = geo.properties.name ?? "";
                  const regulated = isRegulated(name);
                  return (
                    <g key={geo.rsmKey} className={regulated ? "reg-pulse" : undefined}>
                      <Geography
                        geography={geo}
                        onMouseEnter={(e) => handleMouseEnter(name, e)}
                        onMouseMove={(e) => handleMouseMove(name, e)}
                        onMouseLeave={() => setTooltip(null)}
                        style={makeStyle(name, "#ffffff", 0.8, false)}
                      />
                    </g>
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      )}

      {/* ② 수도권 지도 — 서울시(통합) + 경기 시군구별, 서울 클릭 시 구별 상세로 전환 */}
      {view === "metro" && (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [127.3, 37.65], scale: 15000 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={zoom} onMove={({ k }) => setZoom(k)} minZoom={1} maxZoom={10}>
            {/* 경기도 시군구 (먼저 그려서 서울이 위에 겹치지 않게) */}
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
                          style={makeStyle(rawName, "#ffffff", 0.4)}
                        />
                      </g>
                    );
                  })
              }
            </Geographies>

            {/* 서울특별시 통합(전국 시도 파일에서 서울만 추출 — 구별 나누지 않고 하나로 표시) */}
            <Geographies geography="/korea-provinces.json">
              {({ geographies }) =>
                geographies
                  .filter((geo) => (geo.properties.name ?? "") === "서울특별시")
                  .map((geo) => {
                    const regulated = isRegulated("서울특별시");
                    return (
                      <g key={geo.rsmKey} className={regulated ? "reg-pulse" : undefined}>
                        <Geography
                          geography={geo}
                          onClick={() => switchView("seoul")}
                          onMouseEnter={(e) => handleMouseEnter("서울특별시", e)}
                          onMouseMove={(e) => handleMouseMove("서울특별시", e)}
                          onMouseLeave={() => setTooltip(null)}
                          style={makeStyle("서울특별시", "#ffffff", 0.8, true)}
                        />
                      </g>
                    );
                  })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      )}

      {/* ③ 서울 구별 상세 (metro 뷰에서 서울 클릭 시) */}
      {view === "seoul" && (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [126.986, 37.565], scale: 50000 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={zoom} onMove={({ k }) => setZoom(k)} minZoom={1} maxZoom={10}>
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
          </ZoomableGroup>
        </ComposableMap>
      )}
    </div>
  );
}