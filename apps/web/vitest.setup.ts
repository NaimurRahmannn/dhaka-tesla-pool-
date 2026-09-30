import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, vi } from "vitest";
import { MapViewContent } from "./src/features/map/components/map-view-content";

declare global {
  interface Window {
    __triggerMapClick?: (lat: number, lng: number) => void;
  }
}

afterEach(() => {
  cleanup();
});

// Mock next/dynamic for test environment to render MapViewContent synchronously
vi.mock("next/dynamic", () => {
  return {
    default: () => MapViewContent,
  };
});

// Mock next/navigation for test environment
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));



// Mock react-leaflet for JSDOM test environment
vi.mock("react-leaflet", () => {
  return {
    MapContainer: (allProps: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      center?: [number, number];
      zoom?: number;
      scrollWheelZoom?: boolean;
    }) => {
      const { children, className, style, ...domProps } = allProps;
      delete domProps.center;
      delete domProps.zoom;
      delete domProps.scrollWheelZoom;
      return React.createElement(
        "div",
        { "data-testid": "map-container", className, style, ...domProps },
        children,
      );
    },
    TileLayer: () =>
      React.createElement("div", { "data-testid": "tile-layer" }),
    Marker: (allProps: {
      children?: React.ReactNode;
      position?: [number, number];
      icon?: unknown;
      eventHandlers?: unknown;
    }) => {
      const { children, position, ...domProps } = allProps;
      delete domProps.icon;
      delete domProps.eventHandlers;
      return React.createElement(
        "div",
        {
          "data-testid": "leaflet-marker",
          "data-position": JSON.stringify(position),
          ...domProps,
        },
        children,
      );
    },
    Popup: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "leaflet-popup" }, children),
    Polyline: ({
      positions,
      pathOptions,
      ...props
    }: {
      positions?: unknown;
      pathOptions?: { color?: string };
    }) =>
      React.createElement("div", {
        "data-testid": "leaflet-polyline",
        "data-positions": JSON.stringify(positions),
        "data-color": pathOptions?.color,
        ...props,
      }),
    useMap: () => ({
      fitBounds: vi.fn(),
      setView: vi.fn(),
    }),
    useMapEvents: (
      events: Record<string, (e: { latlng: { lat: number; lng: number } }) => void>,
    ) => {
      if (typeof window !== "undefined") {
        window.__triggerMapClick = (lat: number, lng: number) => {
          events.click?.({ latlng: { lat, lng } });
        };
      }
      return null;
    },
  };
});
