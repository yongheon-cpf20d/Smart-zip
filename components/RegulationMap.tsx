// @ts-nocheck
"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { getRegulationByName } from "../lib/regulationData";

const getRegulation = getRegulationByName;

type ViewType = "provinces" | "seoul" | "gyeonggi";

export default function RegulationMap() {
  const [view, setView] = useState<ViewType>("provinces");
  const [tooltip, setTooltip] = useState<{ name: string; type: string; x: number; y: number } | null>(null);

  const handleMouseEnter = (name: string, e: React.MouseEvent) => {
    const reg = getRegulation(name);
    setTooltip({ name, type: reg.type, x: e.clientX, y: e.clientY });
  };
  const handleMouseMove = (name: string, e: React.MouseEvent) => {
    const reg = getRegulation(name);
    setTooltip({ name, type: reg.type, x: e.clientX, y: e.clientY });
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#f8fafc" }}>

      {/* 뒤로가기 버튼 */}
      {view !== "provinces" && (
        <button
          onClick={() => setView("provinces")}
          style={{
            position: "absolute", top: 12, left: 12, zIndex: 10,
            background: "white", border: "1px solid #e2e8f0",
            borderRadius: 8, padding: "6px 12px", fontSize: 12,
            fontWeight: 600, cursor: "pointer", color: "#334155",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          ← 전국 보기
        </button>
      )}

      {/* 현재 뷰 표시 */}
      {view !== "provinces" && (
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          zIndex: 10, background: "white", border: "1px solid #e2e8f0",
          borderRadius: 8, padding: "6px 12px", fontSize: 12,
          fontWeight: 700, color: "#334155",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}>
          {view === "seoul" ? "서울특별시" : "경기도"}
        </div>
      )}

      {/* 범례 */}
      <div style={{
        position: "absolute", bottom: 12, right: 12, zIndex: 10,
        background: "white", border: "1px solid #e2e8f0",
        borderRadius: 10, padding: "10px 14px", fontSize: 11,
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
        {view === "provinces" && (
          <p style={{ color: "#94a3b8", fontSize: 10, marginTop: 6, marginBottom: 0 }}>
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
        }}>
          {tooltip.name} · {tooltip.type}
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
                const reg = getRegulation(name);
                const isClickable = name === "서울특별시" || name === "경기도";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      if (name === "서울특별시") setView("seoul");
                      if (name === "경기도") setView("gyeonggi");
                    }}
                    onMouseEnter={(e) => handleMouseEnter(name, e)}
                    onMouseMove={(e) => handleMouseMove(name, e)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: {
                        fill: reg.color,
                        stroke: "#ffffff",
                        strokeWidth: 0.8,
                        outline: "none",
                        transition: "all 0.2s ease",
                      },
                      hover: {
                        fill: reg.color,
                        stroke: "#ffffff",
                        strokeWidth: 1.5,
                        outline: "none",
                        filter: "brightness(1.15) drop-shadow(0 3px 8px rgba(0,0,0,0.2))",
                        cursor: isClickable ? "pointer" : "default",
                      },
                      pressed: { fill: reg.color, outline: "none" },
                    }}
                  />
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
                const reg = getRegulation(name);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(e) => handleMouseEnter(name, e)}
                    onMouseMove={(e) => handleMouseMove(name, e)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: {
                        fill: reg.color,
                        stroke: "#ffffff",
                        strokeWidth: 0.5,
                        outline: "none",
                        transition: "all 0.2s ease",
                      },
                      hover: {
                        fill: reg.color,
                        stroke: "#ffffff",
                        strokeWidth: 1,
                        outline: "none",
                        filter: "brightness(1.15) drop-shadow(0 3px 8px rgba(0,0,0,0.2))",
                        cursor: "default",
                      },
                      pressed: { fill: reg.color, outline: "none" },
                    }}
                  />
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
          projectionConfig={{ center: [127.3, 37.6], scale: 20000 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography="/gyeonggi-sgg.geojson">
            {({ geographies }) =>
              geographies
                .filter((geo) => {
                  // 이 파일은 경기도 code가 31로 시작
                  const code = geo.properties.code ?? "";
                  return String(code).startsWith("31");
                })
                .map((geo) => {
                  // name이 "수원시영통구" 형태라 regulationData의 "수원시 영통구"와 매칭 안됨
                  // → 공백 없는 버전도 비교하도록 처리
                  const rawName = geo.properties.name ?? "";
                  const reg = getRegulation(rawName);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(e) => handleMouseEnter(rawName, e)}
                      onMouseMove={(e) => handleMouseMove(rawName, e)}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: reg.color,
                          stroke: "#ffffff",
                          strokeWidth: 0.5,
                          outline: "none",
                          transition: "all 0.2s ease",
                        },
                        hover: {
                          fill: reg.color,
                          stroke: "#ffffff",
                          strokeWidth: 1,
                          outline: "none",
                          filter: "brightness(1.15) drop-shadow(0 3px 8px rgba(0,0,0,0.2))",
                          cursor: "default",
                        },
                        pressed: { fill: reg.color, outline: "none" },
                      }}
                    />
                  );
                })
            }
          </Geographies>
        </ComposableMap>
      )}
    </div>
  );
}