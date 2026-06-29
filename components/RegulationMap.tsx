// @ts-nocheck
"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const REGULATION_DATA = {
  "서울특별시": { type: "투기과열지구", color: "#ef4444" },
  "인천광역시": { type: "조정대상지역", color: "#f97316" },
  "경기도":     { type: "조정대상지역", color: "#f97316" },
  "대구광역시": { type: "조정대상지역", color: "#f97316" },
  "부산광역시": { type: "조정대상지역", color: "#f97316" },
};

const DEFAULT_COLOR = "#cbd5e1";

const getRegulation = (name: string) =>
  REGULATION_DATA[name] ?? { type: "규제 없음", color: DEFAULT_COLOR };

export default function RegulationMap() {
  const [view, setView] = useState<"provinces" | "seoul">("provinces");
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#f8fafc" }}>

      {view === "seoul" && (
        <button
          onClick={() => setView("provinces")}
          style={{
            position: "absolute", top: 12, left: 12, zIndex: 10,
            background: "white", border: "1px solid #e2e8f0",
            borderRadius: 8, padding: "6px 12px", fontSize: 12,
            fontWeight: 600, cursor: "pointer", color: "#334155",
          }}
        >
          ← 전국 보기
        </button>
      )}

      <div style={{
        position: "absolute", bottom: 12, right: 12, zIndex: 10,
        background: "white", border: "1px solid #e2e8f0",
        borderRadius: 10, padding: "10px 14px", fontSize: 11,
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

      {tooltip && (
        <div style={{
          position: "absolute",
          left: tooltip.x + 12,
          top: tooltip.y - 36,
          zIndex: 20,
          background: "#1e293b", color: "white",
          borderRadius: 8, padding: "6px 10px",
          fontSize: 12, fontWeight: 500,
          pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          {tooltip.name} · {getRegulation(tooltip.name).type}
        </div>
      )}

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
                const isSeoul = name === "서울특별시";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => isSeoul && setView("seoul")}
                    onMouseEnter={(e) => setTooltip({ name, x: e.clientX, y: e.clientY })}
                    onMouseMove={(e) => setTooltip({ name, x: e.clientX, y: e.clientY })}
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
                        filter: "brightness(1.2) drop-shadow(0 3px 8px rgba(0,0,0,0.25))",
                        cursor: isSeoul ? "pointer" : "default",
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
                    onMouseEnter={(e) => setTooltip({ name, x: e.clientX, y: e.clientY })}
                    onMouseMove={(e) => setTooltip({ name, x: e.clientX, y: e.clientY })}
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
                        filter: "brightness(1.2) drop-shadow(0 3px 8px rgba(0,0,0,0.25))",
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