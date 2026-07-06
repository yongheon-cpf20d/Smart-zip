// components/NaverMap.tsx
// ✅ 네이버지도 위에 여러 단지를 마커로 표시. 드래그로 이동, 스크롤/버튼으로 확대·축소 가능.
"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string; // 정보창에 같이 표시할 부가정보 (가격 등)
};

type Props = {
  markers: MapMarker[];
  height?: number;
};

export default function NaverMap({ markers, height = 400 }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // 네이버지도 스크립트 로드 (한 번만)
  useEffect(() => {
    if (window.naver) {
      setScriptLoaded(true);
      return;
    }
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // 지도 생성 및 마커 표시
  useEffect(() => {
    if (!scriptLoaded || !mapContainerRef.current || markers.length === 0) return;

    const validMarkers = markers.filter((m) => m.latitude && m.longitude);
    if (validMarkers.length === 0) return;

    // 마커들의 평균 좌표로 지도 중심 설정
    const avgLat = validMarkers.reduce((sum, m) => sum + m.latitude, 0) / validMarkers.length;
    const avgLng = validMarkers.reduce((sum, m) => sum + m.longitude, 0) / validMarkers.length;

    const map = new window.naver.maps.Map(mapContainerRef.current, {
      center: new window.naver.maps.LatLng(avgLat, avgLng),
      zoom: 12,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    });

    const infoWindow = new window.naver.maps.InfoWindow({ content: "" });

    validMarkers.forEach((m) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(m.latitude, m.longitude),
        map,
        title: m.title,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        infoWindow.setContent(`
          <div style="padding:10px 14px; font-size:13px; line-height:1.5;">
            <strong>${m.title}</strong>
            ${m.subtitle ? `<br/><span style="color:#10b981;font-weight:700;">${m.subtitle}</span>` : ""}
          </div>
        `);
        infoWindow.open(map, marker);
      });
    });

    // 컴포넌트 unmount 시 정리
    return () => {
      infoWindow.close();
    };
  }, [scriptLoaded, markers]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height, borderRadius: 12, overflow: "hidden", background: "#f1f5f9" }}
    />
  );
}