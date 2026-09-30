"use client";

import { Polyline } from "react-leaflet";

export type RouteLineProps = {
  coordinates?: [number, number][];
  color?: string;
  weight?: number;
  opacity?: number;
};

export function RouteLine({
  coordinates = [],
  color = "#059669",
  weight = 5,
  opacity = 0.8,
}: RouteLineProps) {
  if (!coordinates || coordinates.length < 2) return null;

  return (
    <Polyline
      positions={coordinates}
      pathOptions={{
        color,
        weight,
        opacity,
        lineCap: "round",
        lineJoin: "round",
      }}
    />
  );
}
