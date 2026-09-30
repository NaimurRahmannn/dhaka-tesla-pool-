"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./map-view-content";

export type { MapViewProps };

export const MapView = dynamic(
  () => import("./map-view-content").then((mod) => mod.MapViewContent),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="map-loading"
        className="flex h-80 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500"
      >
        <span>Loading map...</span>
      </div>
    ),
  },
);
